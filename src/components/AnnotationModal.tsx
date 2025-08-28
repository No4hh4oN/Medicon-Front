// src/components/AnnotationModal.tsx
import * as React from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export type AnnotationModalData = {
  logId: number;
  userId: string;
  studyKey: number;
  commentId: number | null;
  createdAt: string;

  /** 상세 표시용 가공 데이터 */
  title?: string | null;
  content?: string | null;
};

export interface AnnotationModalProps {
  open: boolean;
  data: AnnotationModalData;
  onClose: () => void;
}

//data.







const AnnotationModal: React.FC<AnnotationModalProps> = ({ open, data, onClose }) => {
  // 열려있지 않으면 렌더하지 않음
  if (!open) return null;

  // Esc로 닫기
  useEffect(() => {
    
    console.log(data.title);
    console.log(data.content);
    console.log(data.commentId);
    console.log(data.createdAt);
    console.log(data.logId);
    console.log(data.userId);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pretty = (raw?: string | null) => {
    if (!raw) return "";
    try { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  };

  return (
    
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Annotation 상세">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Dialog */}
      <div className="relative bg-neutral-900 text-neutral-100 rounded-lg shadow-xl w-full max-w-3xl mx-4">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold whitespace-nowrap break-keep">Annotation 상세</h2>
          <Button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 h-8 px-3">닫기</Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Log ID" value={String(data.logId)} />
            <Info label="사용자" value={data.userId} nowrap />
            <Info label="Study / Comment" value={`${data.studyKey} / ${data.commentId ?? "없음"}`} />
            <Info label="시간" value={data.createdAt} />
          </div>

          {data.title ? (
            <section>
              <div className="text-neutral-400 text-sm mb-1">제목</div>
              <div className="bg-neutral-800 rounded p-3 text-sm break-words">
                {data.title}
              </div>
            </section>
          ) : null}

          {data.content ? (
            <section>
              <div className="text-neutral-400 text-sm mb-1">내용</div>
              <pre className="bg-neutral-800 rounded p-3 text-xs max-h-[50vh] overflow-auto">
                {pretty(data.content)}
              </pre>
            </section>
          ) : null}
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
