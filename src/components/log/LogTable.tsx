// src/pages/LogsView.tsx
import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ★ 모달 분리 파일 임포트
import AnnotationModal, { type AnnotationModalData } from "../AnnotationModal";
// ★ 시간 포맷 유틸 임포트 (경로는 프로젝트에 맞게)
import { normalizeToYMDHMS } from "../../DateFormat";

/** ───────────────── 타입 ───────────────── **/
type ActionType = "C" | "I" | "U" | "D" | string;

type LogRaw = {
  logId: number;
  studyKey: number;
  userId: string;
  commentId: number | null;
  commentType: string; // 고정 아님
  originalTitle: string | null;
  originalContent: string | null;
  newTitle: string | null;
  newContent: string | null;
  actionType: ActionType;
  createdAt: string;
  updatedAt?: string | null;
};

type LogRow = Omit<LogRaw, "createdAt" | "updatedAt"> & {
  createdAt: string;  // "YYYY-MM-DD HH:mm:ss"
  updatedAt: string;  // "YYYY-MM-DD HH:mm:ss" | "-"
};

/** ───────────────── 유틸 ───────────────── **/
function getCommentTypeBadge(t: string) {
  const map: Record<string, { text: string; className: string }> = {
    COMMENT:    { text: "COMMENT",    className: "bg-indigo-100 text-indigo-800" },
    NOTE:       { text: "NOTE",       className: "bg-teal-100 text-teal-800" },
    REPORT:     { text: "REPORT",     className: "bg-purple-100 text-purple-800" },
    SYSTEM:     { text: "SYSTEM",     className: "bg-gray-200 text-gray-800" },
    ERROR:      { text: "ERROR",      className: "bg-rose-100 text-rose-800" },
    AUDIT:      { text: "AUDIT",      className: "bg-amber-100 text-amber-800" },
    ANNOTATION: { text: "ANNOTATION", className: "bg-neutral-100 text-neutral-900" },
  };
  const key = (t || "").toUpperCase();
  return map[key] ?? { text: t, className: "bg-neutral-700 text-neutral-100" };
}

function getActionTypeInfo(actionType: ActionType) {
  switch (actionType) {
    case "C": return { text: "생성", className: "bg-green-100 text-green-800" };
    case "I": return { text: "추가", className: "bg-blue-100 text-blue-800" };
    case "U": return { text: "수정", className: "bg-yellow-100 text-yellow-800" };
    case "D": return { text: "삭제", className: "bg-red-100 text-red-800" };
    default:  return { text: actionType, className: "bg-gray-100 text-gray-800" };
  }
}

const isAnnotationType = (t: string) => (t || "").toUpperCase() === "ANNOTATION";

/** ───────────────── 페이지 ───────────────── **/
const LogsView: React.FC = () => {
  // 선택 기준
  const [actionType, setActionType] = useState<string>("ALL");
  const [selCommentType, setSelCommentType] = useState<string>("ALL");
  const [selUserId, setSelUserId] = useState<string>("ALL");
  const [selStudyKey, setSelStudyKey] = useState<string>("ALL");
  const [selCommentId, setSelCommentId] = useState<string>("ALL");

  // 데이터
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err,   setErr] = useState<string | null>(null);

  // 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<AnnotationModalData | null>(null);

  // 옵션
  const commentTypeOptions = useMemo(() => {
    const set = new Set<string>(); rows.forEach(r => set.add(r.commentType));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const userIdOptions = useMemo(() => {
    const set = new Set<string>(); rows.forEach(r => set.add(r.userId));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const studyKeyOptions = useMemo(() => {
    const set = new Set<string>(); rows.forEach(r => set.add(String(r.studyKey)));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [rows]);

  const commentIdOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => set.add(r.commentId === null ? "NONE" : String(r.commentId)));
    return Array.from(set).sort((a, b) => {
      if (a === "NONE") return -1;
      if (b === "NONE") return 1;
      return Number(a) - Number(b);
    });
  }, [rows]);

  // 필터링
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (actionType     !== "ALL" && r.actionType     !== actionType)     return false;
      if (selCommentType !== "ALL" && r.commentType    !== selCommentType) return false;
      if (selUserId      !== "ALL" && r.userId         !== selUserId)      return false;
      if (selStudyKey    !== "ALL" && String(r.studyKey) !== selStudyKey)  return false;
      if (selCommentId   !== "ALL") {
        if (selCommentId === "NONE") {
          if (r.commentId !== null) return false;
        } else {
          if (String(r.commentId) !== selCommentId) return false;
        }
      }
      return true;
    });
  }, [rows, actionType, selCommentType, selUserId, selStudyKey, selCommentId]);

  // 데이터 로딩
  const fetchLogs = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("http://localhost:8080/api/v1/logs/showAll", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const raw: LogRaw[] = await res.json();
      const normalized: LogRow[] = raw.map((l) => ({
        ...l,
        createdAt: normalizeToYMDHMS(l.createdAt),
        updatedAt: normalizeToYMDHMS(l.updatedAt ?? null),
      }));

      setRows(normalized);
    } catch (e: any) {
      setErr(e?.message ?? "로그를 불러오지 못했습니다.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // 초기화
  const resetFilters = useCallback(() => {
    setActionType("ALL");
    setSelCommentType("ALL");
    setSelUserId("ALL");
    setSelStudyKey("ALL");
    setSelCommentId("ALL");
  }, []);

  // 모달 열기 (ANNOTATION 행의 “자세히 보기” 클릭 시)
const openAnnotationModal = (log: LogRow) => {
  setModalData({
    logId: log.logId,
    userId: log.userId,
    studyKey: log.studyKey,
    commentId: log.commentId,
    createdAt: log.createdAt,
    actionType: log.actionType,
    originalTitle: log.originalTitle,
    originalContent: log.originalContent, // ← 왼쪽
    newTitle: log.newTitle,
    newContent: log.newContent,           // ← 오른쪽
  });
  setModalOpen(true);
};

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex flex-col">
      <Card className="m-4 sm:m-6 md:m-8 bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle>로그 조회</CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* 선택 기준 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
            {/* 액션 타입 */}
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="액션" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                <SelectItem value="ALL">액션: 전체</SelectItem>
                <SelectItem value="C">생성(C)</SelectItem>
                <SelectItem value="I">추가(I)</SelectItem>
                <SelectItem value="U">수정(U)</SelectItem>
                <SelectItem value="D">삭제(D)</SelectItem>
              </SelectContent>
            </Select>

            {/* Comment Type */}
            <Select value={selCommentType} onValueChange={setSelCommentType}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="Comment Type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-72 overflow-auto">
                <SelectItem value="ALL">타입: 전체</SelectItem>
                {commentTypeOptions.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-400">옵션 없음</div>
                ) : (
                  commentTypeOptions.map(t => (
                    <SelectItem key={t} value={t} className="whitespace-nowrap break-keep">
                      {t}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* 사용자 ID */}
            <Select value={selUserId} onValueChange={setSelUserId}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="사용자 ID" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-72 overflow-auto">
                <SelectItem value="ALL">사용자: 전체</SelectItem>
                {userIdOptions.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-400">옵션 없음</div>
                ) : (
                  userIdOptions.map(u => (
                    <SelectItem key={u} value={u} className="whitespace-nowrap break-keep">
                      {u}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Study Key */}
            <Select value={selStudyKey} onValueChange={setSelStudyKey}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="Study Key" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-72 overflow-auto">
                <SelectItem value="ALL">Study: 전체</SelectItem>
                {studyKeyOptions.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-400">옵션 없음</div>
                ) : (
                  studyKeyOptions.map(sk => (
                    <SelectItem key={sk} value={sk} className="whitespace-nowrap break-keep">
                      {sk}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Comment ID */}
            <Select value={selCommentId} onValueChange={setSelCommentId}>
              <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="Comment ID" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-72 overflow-auto">
                <SelectItem value="ALL">Comment: 전체</SelectItem>
                {commentIdOptions.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-400">옵션 없음</div>
                ) : (
                  commentIdOptions.map(cid => (
                    <SelectItem key={cid} value={cid} className="whitespace-nowrap break-keep">
                      {cid === "NONE" ? "없음" : cid}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* 버튼들 */}
            <div className="flex gap-2">
              <Button onClick={fetchLogs} className="flex-1 bg-sky-500 hover:bg-sky-600" disabled={loading}>
                새로고침
              </Button>
              <Button onClick={resetFilters} variant="outline" className="flex-1 border-neutral-700 text-neutral-200">
                초기화
              </Button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div className="px-6 py-4 bg-white/5">
              {loading ? (
                <p className="text-neutral-400">불러오는 중…</p>
              ) : err ? (
                <p className="text-red-400">에러: {err}</p>
              ) : (
                <p className="text-neutral-300">
                  총 <span className="font-semibold text-neutral-100">{filtered.length}</span>건
                </p>
              )}
            </div>

            <table className="w-full text-sm text-left text-neutral-300">
              <thead className="text-xs uppercase bg-neutral-800 text-neutral-400">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">사용자</th>
                  <th className="px-6 py-3">타입</th>
                  <th className="px-6 py-3">액션</th>
                  <th className="px-6 py-3">변경 내용</th>
                  <th className="px-6 py-3">생성 시간</th>
                  <th className="px-6 py-3">수정 시간</th>
                </tr>
              </thead>
              <tbody>
                {!loading && !err && filtered.map((log) => {
                  const cBadge = getCommentTypeBadge(log.commentType);
                  const aBadge = getActionTypeInfo(log.actionType);
                  const originalFull = [log.originalTitle, log.originalContent].filter(Boolean).join(" - ");
                  const newFull = [log.newTitle, log.newContent].filter(Boolean).join(" - ");
                  const annotationRow = isAnnotationType(log.commentType);

                  return (
                    <tr key={log.logId} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800/50">
                      {/* ID */}
                      <td className="px-6 py-4 font-medium text-neutral-100 whitespace-nowrap break-keep min-w-[56px]">
                        {log.logId}
                      </td>

                      {/* 사용자 */}
                      <td className="px-6 py-4 whitespace-nowrap break-keep min-w-[96px]">
                        {log.userId}
                      </td>

                      {/* 타입 뱃지 */}
                      <td className="px-6 py-4 whitespace-nowrap break-keep min-w-[120px]">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none whitespace-nowrap break-keep ${cBadge.className}`}>
                          {cBadge.text}
                        </span>
                      </td>

                      {/* 액션 뱃지 */}
                      <td className="px-6 py-4 whitespace-nowrap break-keep min-w-[96px]">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none whitespace-nowrap break-keep ${aBadge.className}`}>
                          {aBadge.text}
                        </span>
                      </td>

                      {/* 변경 내용 */}
                      <td className="px-6 py-4">
                        {annotationRow ? (
                          <button
                            type="button"
                            onClick={() => openAnnotationModal(log)}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 
                                       bg-neutral-800/60 hover:bg-neutral-700 
                                       text-sky-300 hover:text-sky-200 
                                       text-sm font-medium transition-colors"
                            title="Annotation 상세 보기"
                          >
                            자세히 보기
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M12.293 4.293a1 1 0 0 1 1.414 0L18 8.586a2 2 0 0 1 0 2.828l-4.293 4.293a1 1 0 0 1-1.414-1.414L14.586 12H4a1 1 0 1 1 0-2h10.586l-2.293-2.293a1 1 0 0 1 0-1.414z" />
                            </svg>
                          </button>
                        ) : log.actionType === "U" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-red-400 line-through break-keep">{originalFull}</span>
                            <span className="text-sky-400 break-keep">{newFull}</span>
                          </div>
                        ) : log.actionType === "D" ? (
                          <span className="text-neutral-500 line-through break-keep">{originalFull}</span>
                        ) : (
                          <span className="text-neutral-100 break-keep">{newFull || originalFull}</span>
                        )}
                      </td>

                      {/* 시간 */}
                      <td className="px-6 py-4 whitespace-nowrap break-keep min-w-[144px]">
                        {log.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap break-keep min-w-[144px]">
                        {log.updatedAt || "-"}
                      </td>
                    </tr>
                  );
                })}

                {!loading && !err && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 모달 분리 파일 사용 */}
      <AnnotationModal
        open={!!modalOpen && !!modalData}
        data={modalData as AnnotationModalData}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default LogsView;
