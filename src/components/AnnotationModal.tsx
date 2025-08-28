// src/components/AnnotationModal.tsx
import * as React from "react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

export type AnnotationModalData = {
  logId: number;
  userId: string;
  studyKey: number;
  commentId: number | null;
  createdAt: string;
  actionType?: string; // U/C/D 등

  // 원본/신규 내용 모두 받음 (null 가능)
  originalTitle?: string | null;
  originalContent?: string | null;
  newTitle?: string | null;
  newContent?: string | null;
};

export interface AnnotationModalProps {
  open: boolean;
  data: AnnotationModalData;
  onClose: () => void;
}

const AnnotationModal: React.FC<AnnotationModalProps> = ({ open, data, onClose }) => {
  if (!open) return null;

  // 디버깅 로그 (열릴 때마다)
  useEffect(() => {
    console.log("Annotation modal data:", data);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  const pretty = (raw?: string | null) => {
    if (!raw) return "";
    try { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  };

  // 좌/우 내용 미리 가공
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

        {/* Title diff (옵션) */}
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

        {/* Content diff: 왼쪽 ORIGINAL_CONTENT / 오른쪽 NEW_CONTENT */}
        <div className="px-6 pb-6 pt-4">
          <div className="text-neutral-400 text-sm mb-2">내용</div>
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
        </div>
      </div>
    </div>
  );
};

export default AnnotationModal;

/** 작은 정보박스 */
function Info({ label, value, nowrap = false }: { label: string; value: string; nowrap?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-neutral-400">{label}</div>
      <div className={"font-semibold " + (nowrap ? "break-keep whitespace-nowrap" : "")}>{value}</div>
    </div>
  );
}
