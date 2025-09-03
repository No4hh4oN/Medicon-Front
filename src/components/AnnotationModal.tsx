// src/components/AnnotationModal.tsx
import * as React from "react";
import { useEffect, useMemo, useRef } from "react";
import { RenderingEngine, Enums } from "@cornerstonejs/core";
import { Button } from "@/components/ui/button";
import { ToolGroupManager, ArrowAnnotateTool } from "@cornerstonejs/tools";
import { importArrowAnnotations } from "@/services/annotation";
import { ensureCornerstoneReady } from "@/hooks/bootstrap"; // ← 경로 확인

/* ======================= Types ======================= */
export type AnnotationModalData = {
  logId: number;
  userId: string;
  studyKey: number;
  commentId: number | null;
  createdAt: string;
  actionType?: string; // C/I/U/D 등
  originalTitle?: string | null;
  originalContent?: string | null; // ← 컨테이너 JSON 문자열(annotations 문자열 포함 가능)
  newTitle?: string | null;
  newContent?: string | null;      // ← 컨테이너 JSON 문자열(annotations 문자열 포함 가능)
};

export interface AnnotationModalProps {
  open: boolean;
  data: AnnotationModalData;
  onClose: () => void;
}

/* ======================= Utils ======================= */
// 컨테이너(JSON 문자열) → { container, bundle } 파싱
function extractBundleFromContainer(raw?: string | null) {
  if (!raw) return { container: null as any, bundle: null as any };
  let container: any = null;
  try { container = JSON.parse(raw); } catch { return { container: null, bundle: null }; }

  // 컨테이너 자체가 번들일 수도, annotations 문자열을 품고 있을 수도
  if (container?.version && Array.isArray(container?.objects)) {
    return { container, bundle: container };
  }
  let bundle = container?.annotations;
  if (typeof bundle === "string") {
    try { bundle = JSON.parse(bundle); } catch { bundle = null; }
  }
  return { container, bundle };
}

// 번들/컨테이너에서 imageId 해석 (번들 우선 → 키로 조합)
function resolveImageId(container: any, bundle: any, base = "http://localhost:8080/api/v1/dicom") {
  const obj = Array.isArray(bundle?.objects) ? bundle.objects[0] : null;
  const fromBundle =
    obj?.referencedImageId ||
    obj?.metadata?.referencedImageId ||
    obj?.metadata?.referencedImageURI;

  if (typeof fromBundle === "string") {
    return fromBundle.startsWith("wadouri:") ? fromBundle.replace(/\s+/g,"") : `wadouri:${fromBundle}`.replace(/\s+/g,"");
  }

  const s = container?.studyKey, se = container?.seriesKey, i = container?.imageKey;
  if (s == null || se == null || i == null) return undefined;

  const f = container?.frameNo;
  const frameSeg = typeof f === "number" && f >= 0 ? `/frames/${f}` : "";
  const url = `${base}/studies/${s}/series/${se}/images/${i}${frameSeg}`;

  const id = `wadouri:${url}`.replace(/\s+/g, "");
  return id;
}

function pretty(raw?: string | null) {
  if (!raw) return "";
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw; }
}

/* ======================= Preview (독립 엔진/툴그룹, 보기 전용) ======================= */
type CompareViewProps = { side: "left" | "right"; bundleJson?: string | null };

function AnnotationPreview({ side, bundleJson }: CompareViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const ranRef = useRef(false);

  // 재렌더에도 불변이도록 useRef로 고유 ID 고정
  const engineId = useRef(`anno-prev-engine-${side}-${Math.random().toString(36).slice(2)}`).current;
  const viewportId = useRef(`anno-prev-vp-${side}-${Math.random().toString(36).slice(2)}`).current;
  const toolGroupId = useRef(`anno-prev-tg-${side}-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    let re: RenderingEngine | null = null;

    (async () => {
      if (!hostRef.current || !bundleJson) return;

      // Cornerstone 전역 초기화 보장 (core/loader/tools + addTool(ArrowAnnotate))
      await ensureCornerstoneReady();

      // 1) 컨테이너/번들 파싱
      const { container, bundle } = extractBundleFromContainer(bundleJson);
      if (!bundle) {
        console.warn("AnnotationPreview: 번들을 파싱하지 못했습니다.", { container });
        return;
      }

      // 2) imageId 결정
      const imageId = resolveImageId(container, bundle);
      if (!imageId) {
        console.warn("AnnotationPreview: imageId를 찾을 수 없습니다.", { container, bundle });
        return;
      }
      console.log("resolved imageId =", imageId);
      if (!imageId || typeof imageId !== "string") return;

      // 3) 엔진/뷰포트 생성
      re = new RenderingEngine(engineId);
      const el = hostRef.current;

      re.enableElement({
        viewportId,
        type: Enums.ViewportType.STACK,
        element: el!,
        defaultOptions: { background: [0, 0, 0] },
      });

      // 4) 보기 전용 ToolGroup (Arrow만)
      let tg = ToolGroupManager.getToolGroup(toolGroupId);
      if (!tg) tg = ToolGroupManager.createToolGroup(toolGroupId)!;
      // @ts-ignore(간단 중복체크)
      /*
      if (!(tg as any).tools?.[ArrowAnnotateTool.toolName]) {
        tg.addTool(ArrowAnnotateTool.toolName);
      }*/
      if (!tg.getToolInstance?.(ArrowAnnotateTool.toolName)) {
        tg.addTool(ArrowAnnotateTool.toolName);
      }

      tg.addViewport(viewportId, engineId);
      tg.setToolPassive(ArrowAnnotateTool.toolName);

      // 5) 이미지 로드 → 주석 입히기
      const vp = re.getViewport(viewportId) as any;
      await vp.setStack([imageId]);
      await re.render();

      importArrowAnnotations(bundle, engineId, viewportId);
      //await re.render();

      // 보기 전용
      el!.style.pointerEvents = "none";
    })();

    // 6) 클린업
    return () => {
      try { ToolGroupManager.getToolGroup(toolGroupId)?.removeViewports(viewportId, engineId); } catch {}
      try { re?.disableElement(viewportId); } catch {}
      try { re?.destroy?.(); } catch {}
      try { ToolGroupManager.destroyToolGroup(toolGroupId); } catch {}
    };
  }, [bundleJson, side, engineId, viewportId, toolGroupId]);

  return (
    <div
      ref={hostRef}
      className="rounded bg-black/60 w-full h-[260px] md:h-[320px] overflow-hidden"
    />
  );
}

/* ======================= Modal 본체 ======================= */
const AnnotationModal: React.FC<AnnotationModalProps> = ({ open, data, onClose }) => {
  if (!open) return null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const originalPretty = useMemo(() => pretty(data.originalContent), [data.originalContent]);
  const newPretty      = useMemo(() => pretty(data.newContent),      [data.newContent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Annotation 상세">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-neutral-900 text-neutral-100 rounded-lg shadow-xl w-full max-w-5xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold whitespace-nowrap break-keep">Annotation 상세</h2>
          <div className="flex items-center gap-2">
            {data.actionType && (
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-semibold">
                {data.actionType}
              </span>
            )}
            <Button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 h-8 px-3">닫기</Button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 pt-5 grid grid-cols-2 gap-4 text-sm">
          <Info label="Log ID" value={String(data.logId)} />
          <Info label="사용자" value={data.userId} nowrap />
          <Info label="Study / Comment" value={`${data.studyKey} / ${data.commentId ?? "없음"}`} />
          <Info label="시간" value={data.createdAt} />
        </div>

        {/* Title diff */}
        {(data.originalTitle || data.newTitle) && (
          <div className="px-6 pt-4 pb-2">
            <div className="text-neutral-400 text-sm mb-2">제목</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-neutral-400 text-xs">이전 (ORIGINAL_TITLE)</div>
                <div className="bg-neutral-800 rounded p-3 text-sm min-h-[44px]">
                  {data.originalTitle ?? <span className="text-neutral-500">-</span>}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-neutral-400 text-xs">현재 (NEW_TITLE)</div>
                <div className="bg-neutral-800 rounded p-3 text-sm min-h-[44px]">
                  {data.newTitle ?? <span className="text-neutral-500">-</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 미리보기 (좌/우) */}
        {(data.originalContent || data.newContent) && (
          <div className="px-6 pt-4">
            <div className="text-neutral-400 text-sm mb-2">주석 이미지 미리보기</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-neutral-400 text-xs">이전 (ORIGINAL)</div>
                {data.originalContent ? (
                  <AnnotationPreview side="left" bundleJson={data.originalContent} />
                ) : (
                  <div className="text-neutral-500 bg-neutral-800 rounded p-3 text-center">-</div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-neutral-400 text-xs">현재 (NEW)</div>
                {data.newContent ? (
                  <AnnotationPreview side="right" bundleJson={data.newContent} />
                ) : (
                  <div className="text-neutral-500 bg-neutral-800 rounded p-3 text-center">-</div>
                )}
              </div>
            </div>
          </div>
        )}
{/* 
        
        <div className="px-6 pb-6 pt-4">
          <div className="text-neutral-400 text-sm mb-2">내용(JSON)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-neutral-400 text-xs">이전 (ORIGINAL_CONTENT)</div>
              <pre className="bg-neutral-800 rounded p-3 text-xs max-h-[55vh] overflow-auto">
                {originalPretty || <span className="text-neutral-500">-</span>}
              </pre>
            </div>
            <div className="space-y-1">
              <div className="text-neutral-400 text-xs">현재 (NEW_CONTENT)</div>
              <pre className="bg-neutral-800 rounded p-3 text-xs max-h-[55vh] overflow-auto">
                {newPretty || <span className="text-neutral-500">-</span>}
              </pre>
            </div>
          </div>
        </div>*/}
      </div>
    </div>
  );
};

export default AnnotationModal;

/* ======================= Small Info ======================= */
function Info({ label, value, nowrap = false }: { label: string; value: string; nowrap?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-neutral-400">{label}</div>
      <div className={"font-semibold " + (nowrap ? "break-keep whitespace-nowrap" : "")}>{value}</div>
    </div>
  );
}

