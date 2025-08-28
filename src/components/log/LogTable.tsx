// src/pages/LogsView.tsx
import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** ───────────────── 타입 ───────────────── **/
type ActionType = "C" | "I" | "U" | "D" | string;

type LogRaw = {
  logId: number;
  studyKey: number;
  userId: string;
  commentId: number | null;
  commentType: string;
  originalTitle: string | null;
  originalContent: string | null;
  newTitle: string | null;
  newContent: string | null;
  actionType: ActionType;
  createdAt: string;          // 서버 원본(형식 섞여있음)
  updatedAt?: string | null;  // 서버 원본(형식 섞여있음)
};

type LogRow = Omit<LogRaw, "createdAt" | "updatedAt"> & {
  createdAt: string;          // 통일 포맷 "YYYY-MM-DD HH:mm:ss"
  updatedAt: string;          // 통일 포맷 or "-"
};

/** ───────────────── 유틸: 시간 파싱/포맷 통일 ───────────────── **/

// ISO 마이크로초 → 밀리초(3자리)로 절단 (JS Date는 ms까지만 안전)
function clampIsoFractionToMs(s: string): string {
  // ex) 2025-08-27T17:32:59.903612 -> 2025-08-27T17:32:59.903
  return s.replace(/(\.\d{3})\d+/, "$1");
}

// 공용 포맷 "YYYY-MM-DD HH:mm:ss"
function fmtYMDHMS(d: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} `
       + `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// 문자열 → Date 관용 파서
function parseFlexibleDate(input?: string | null): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // 1) ISO 류 (T 포함, 소수점 길이 다양)
  if (s.includes("T")) {
    const iso = clampIsoFractionToMs(s);
    const d = new Date(iso);
    return isNaN(d.valueOf()) ? null : d;
  }

  // 2) 하이픈 로컬형: 2025-08-27 16:57:10(.123)
  {
    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
    );
    if (m) {
      const [, y, M, D, h, mi, se] = m;
      const d = new Date(+y, +M - 1, +D, +h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  // 3) 슬래시 YY/MM/DD: 25/08/27 17:19:26(.675297600)
  {
    const m = s.match(
      /^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
    );
    if (m) {
      const [, yy, mm, dd, h, mi, se] = m;
      const year = 2000 + +yy; // 25 -> 2025
      const d = new Date(year, +mm - 1, +dd, +h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  // 4) 한국형: 2025. 8. 27. 오후 5:32:42
  {
    const m = s.match(
      /(\d{4})\. (\d{1,2})\. (\d{1,2})\. (오전|오후) (\d{1,2}):(\d{2}):(\d{2})/
    );
    if (m) {
      const [, y, M, D, ampm, hStr, mi, se] = m;
      let h = +hStr;
      if (ampm === "오후" && h !== 12) h += 12;
      if (ampm === "오전" && h === 12) h = 0;
      const d = new Date(+y, +M - 1, +D, h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  // 5) 기타 브라우저 파서가 처리 가능한 형식
  const d = new Date(s);
  return isNaN(d.valueOf()) ? null : d;
}

// 최종 통일 포맷
function normalizeDateString(raw?: string | null): string {
  const d = parseFlexibleDate(raw);
  return d ? fmtYMDHMS(d) : (raw ?? "-");
}

/** ───────────────── 액션 뱃지 유틸 ───────────────── **/
function getActionTypeInfo(actionType: ActionType) {
  switch (actionType) {
    case "C":
      return { text: "생성", className: "bg-green-100 text-green-800" };
    case "I":
      return { text: "추가", className: "bg-blue-100 text-blue-800" };
    case "U":
      return { text: "수정", className: "bg-yellow-100 text-yellow-800" };
    case "D":
      return { text: "삭제", className: "bg-red-100 text-red-800" };
    default:
      return { text: actionType, className: "bg-gray-100 text-gray-800" };
  }
}

/** ───────────────── 페이지 컴포넌트 ───────────────── **/
const LogsView: React.FC = () => {
  // 선택 기준
  const [actionType, setActionType] = useState<"ALL" | ActionType>("ALL");
  const [userId, setUserId] = useState("");
  const [studyKey, setStudyKey] = useState<string>("");

  // 데이터 상태
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 필터링
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (actionType !== "ALL" && r.actionType !== actionType) return false;
      if (userId && !r.userId.toLowerCase().includes(userId.toLowerCase())) return false;
      if (studyKey && String(r.studyKey) !== studyKey) return false;
      return true;
    });
  }, [rows, actionType, userId, studyKey]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("http://localhost:8080/api/v1/logs/showAll", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const raw: LogRaw[] = await res.json();

      // 시간 통일 처리
      const normalized: LogRow[] = raw.map((l) => ({
        ...l,
        createdAt: normalizeDateString(l.createdAt),
        updatedAt: normalizeDateString(l.updatedAt ?? null),
      }));

      setRows(normalized);
    } catch (e: any) {
      setErr(e?.message ?? "로그를 불러오지 못했습니다.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex flex-col">
      <Card className="m-4 sm:m-6 md:m-8 bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle>로그 조회</CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* 선택 기준 */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Select
              value={actionType}
              onValueChange={(v) => setActionType(v as "ALL" | ActionType)}
            >
              <SelectTrigger className="w-full md:w-[160px] bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="액션" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="C">생성(C)</SelectItem>
                <SelectItem value="I">추가(I)</SelectItem>
                <SelectItem value="U">수정(U)</SelectItem>
                <SelectItem value="D">삭제(D)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="사용자 ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
            />

            <Input
              placeholder="Study Key"
              value={studyKey}
              onChange={(e) => setStudyKey(e.target.value)}
              className="w-full md:w-[160px] bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
            />

            <Button
              onClick={fetchLogs}
              className="w-full md:w-auto bg-sky-500 hover:bg-sky-600"
              disabled={loading}
            >
              새로고침
            </Button>
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
                  const badge = getActionTypeInfo(log.actionType);
                  const originalFull = [log.originalTitle, log.originalContent]
                    .filter(Boolean)
                    .join(" - ");
                  const newFull = [log.newTitle, log.newContent]
                    .filter(Boolean)
                    .join(" - ");

                  return (
                    <tr
                      key={log.logId}
                      className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800/50"
                    >
                      <td className="px-6 py-4 font-medium text-neutral-100">{log.logId}</td>
                      <td className="px-6 py-4">{log.userId}</td>
                      <td className="px-6 py-4">{log.commentType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.actionType === "U" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-red-400 line-through">{originalFull}</span>
                            <span className="text-sky-400">{newFull}</span>
                          </div>
                        ) : log.actionType === "D" ? (
                          <span className="text-neutral-500 line-through">{originalFull}</span>
                        ) : (
                          <span className="text-neutral-100">{newFull || originalFull}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{log.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{log.updatedAt || "-"}</td>
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
    </div>
  );
};

export default LogsView;
