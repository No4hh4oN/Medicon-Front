// src/components/PacsPlusSearchMinimal.tsx
import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/** 결과 행 타입 */
export type ResultRow = {
  pid: string;
  pname: string;
  modality: string;
  desc: string | null;
  when: string;
  status: string;
  series: string | null;
  images: string | null;
  verify: number;
};

/** 코멘트 행 타입 */
type CommentRow = {
  userId: string;
  commentTitle: string;
  commentContent: string;
  createdAt: string;
  updatedAt: string;
};

export interface PacsPlusSearchMinimalProps {
  initialRows?: ResultRow[];
}

// ===== API 응답 타입 =====
interface ApiStudy {
  studyKey: number;
  studyDate: string;
  studyTime: string;
  studyDesc: string | null;
  modality: string;
  bodyPart: string | null;
  patAge: string | null;
}
interface ApiPatientResponse {
  studyListDto: ApiStudy[];
  pid: string;
  pbirthdate: string | null;
  pname: string;
  psex: string;
}
interface ApiModalityResponse {
  pid: string;
  pname: string;
  psex: string;
  pbirthdate: string | null;
  studyKey: number;
  studyDate: string;
  studyTime: string;
  studyDesc: string | null;
  modality: string;
  bodyPart: string | null;
  patAge: string | null;
}
interface ApiComment {
  commentId: number;
  studyKey: number;
  userId: string;
  commentTitle: string;
  commentContent: string;
  createdAt: string;
  updatedAt: string | null;
}

const PacsPlusSearchMinimal: React.FC<PacsPlusSearchMinimalProps> = ({
  initialRows = [],
}) => {
  const [searchType, setSearchType] = useState<"pname" | "pid" | "modality">("pname");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rows, setRows] = useState<ResultRow[]>(initialRows);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedStudyKey, setSelectedStudyKey] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  const [commentTitle, setCommentTitle] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const onSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSelectedStudyKey(null);
      setComments([]);
      setRows(initialRows);
      return;
    }

    setIsLoading(true);
    const baseUrl = "http://localhost:8080/api";
    let endpoint = "";

    setSelectedStudyKey(null);
    setComments([]);

    if (searchType === "pid") {
      endpoint = `/patientID/${encodeURIComponent(query)}`;
    } else if (searchType === "pname") {
      endpoint = `/patientName/${encodeURIComponent(query)}`;
    } else if (searchType === "modality") {
      endpoint = `/modality/${encodeURIComponent(query)}`;
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) throw new Error(`API 요청 실패: ${response.statusText}`);

      let newRows: ResultRow[] = [];

      if (searchType === "modality") {
        const apiData: ApiModalityResponse[] = await response.json();
        newRows = apiData.map((study) => {
          const year = study.studyDate.substring(0, 4);
          const month = study.studyDate.substring(4, 6);
          const day = study.studyDate.substring(6, 8);
          const hours = study.studyTime.substring(0, 2);
          const minutes = study.studyTime.substring(2, 4);
          const seconds = study.studyTime.substring(4, 6);
          const formattedWhen = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

          return {
            pid: study.pid,
            pname: study.pname,
            modality: study.modality,
            desc: study.studyDesc,
            when: formattedWhen,
            status: study.psex,
            series: study.bodyPart,
            images: study.patAge,
            verify: study.studyKey,
          };
        });
      } else {
        const apiData: ApiPatientResponse[] = await response.json();
        newRows = apiData.flatMap((patient) =>
          patient.studyListDto.map((study) => {
            const year = study.studyDate.substring(0, 4);
            const month = study.studyDate.substring(4, 6);
            const day = study.studyDate.substring(6, 8);
            const hours = study.studyTime.substring(0, 2);
            const minutes = study.studyTime.substring(2, 4);
            const seconds = study.studyTime.substring(4, 6);
            const formattedWhen = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            return {
              pid: patient.pid,
              pname: patient.pname,
              modality: study.modality,
              desc: study.studyDesc,
              when: formattedWhen,
              status: patient.psex,
              series: study.bodyPart,
              images: study.patAge,
              verify: study.studyKey,
            };
          })
        );
      }
      setRows(newRows);
    } catch (e) {
      console.error("[PacsPlusSearchMinimal] API 요청 오류:", e);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchType, searchQuery, initialRows]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const handleRowClick = useCallback(
    async (studyKey: number) => {
      if (selectedStudyKey === studyKey) {
        setSelectedStudyKey(null);
        setComments([]);
        return;
      }

      setSelectedStudyKey(studyKey);
      setIsCommentsLoading(true);
      setComments([]);

      try {
        const response = await fetch(`http://localhost:8080/api/v1/dicom/study/${studyKey}/comment`);
        if (!response.ok) throw new Error(`코멘트 API 요청 실패: ${response.statusText}`);

        const apiData: ApiComment[] = await response.json();
        const formatted: CommentRow[] = apiData.map((c) => ({
          userId: c.userId,
          commentTitle: c.commentTitle,
          commentContent: c.commentContent,
          createdAt: new Date(c.createdAt).toLocaleString(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "-",
        }));
        setComments(formatted);

        setTimeout(() => {
          document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      } catch (e) {
        console.error("[PacsPlusSearchMinimal] 코멘트 API 요청 오류:", e);
        setComments([]);
      } finally {
        setIsCommentsLoading(false);
      }
    },
    [selectedStudyKey]
  );

  const submitComment = useCallback(async () => {
    if (!selectedStudyKey) return;
    const title = commentTitle.trim();
    const content = commentBody.trim();
    if (!title || !content) return;

    try {
      setIsPosting(true);
      const res = await fetch(`http://localhost:8080/api/comment/${selectedStudyKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentTitle: title,
          commentContent: content,
        }),
      });
      if (!res.ok) throw new Error("코멘트 등록 실패");

      const now = new Date().toLocaleString();
      setComments((prev) => [
        ...prev,
        {
          userId: "me",
          commentTitle: title,
          commentContent: content,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      setCommentTitle("");
      setCommentBody("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  }, [selectedStudyKey, commentTitle, commentBody]);

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex flex-col">
      <Card className="bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle>PACS+ 검색</CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* 검색바 */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Select
              value={searchType}
              onValueChange={(v: "pname" | "pid" | "modality") => setSearchType(v)}
            >
              <SelectTrigger className="h-10 rounded-full bg-neutral-800 border-neutral-700 text-neutral-300 w-full md:w-1/4">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-300">
                <SelectItem value="pname">환자 이름</SelectItem>
                <SelectItem value="pid">환자 아이디</SelectItem>
                <SelectItem value="modality">검사장비</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="검색어를 입력하세요"
              className="h-10 rounded-full bg-neutral-800 border-neutral-700 placeholder:text-neutral-500 w-full md:w-1/4"
            />

            <Button
              onClick={onSearch}
              disabled={isLoading}
              className="h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white px-8 w-full md:w-auto disabled:bg-sky-800 disabled:cursor-not-allowed"
            >
              {isLoading ? "검색 중..." : "검색"}
            </Button>
          </div>

          {/* 결과 테이블 */}
          <div className="relative rounded-xl border border-neutral-800">
            <Table>
              <TableHeader className="bg-neutral-900 sticky top-0 z-10">
                <TableRow className="hover:bg-neutral-900">
                  <TableHead className="text-center">환자 아이디</TableHead>
                  <TableHead className="text-center">환자 이름</TableHead>
                  <TableHead className="text-center">검사장비</TableHead>
                  <TableHead className="text-center">검사설명</TableHead>
                  <TableHead className="text-center">검사일시</TableHead>
                  <TableHead className="text-center">성별</TableHead>
                  <TableHead className="text-center">검사부위</TableHead>
                  <TableHead className="text-center">환자 나이</TableHead>
                  <TableHead className="text-center">검사 번호</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : rows.length > 0 ? (
                  rows.map((r) => (
                    <TableRow
                      key={`${r.pid}-${r.when}-${r.verify}`}
                      className="hover:bg-neutral-900/40 cursor-pointer"
                      onClick={() => handleRowClick(r.verify)}
                    >
                      <TableCell className="font-medium text-center">{r.pid}</TableCell>
                      <TableCell className="text-center">{r.pname}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                          {r.modality}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-300 text-center">{r.desc ?? "-"}</TableCell>
                      <TableCell className="text-neutral-400 text-center">{r.when}</TableCell>
                      <TableCell className="text-center">{r.status}</TableCell>
                      <TableCell className="text-center">{r.series ?? "-"}</TableCell>
                      <TableCell className="text-center">{r.images ?? "-"}</TableCell>
                      <TableCell className="text-center">{r.verify}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 코멘트 패널 */}
          {selectedStudyKey !== null && (
            <section id="comments" className="mt-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60">
                <div className="border-b border-neutral-800 px-6 py-4">
                  <h3 className="text-center font-semibold">
                    코멘트 <span className="text-neutral-400">(Study Key: {selectedStudyKey})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  <div className="lg:col-span-2">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50">
                      {isCommentsLoading ? (
                        <div className="py-10 text-center text-neutral-500">
                          코멘트를 불러오는 중입니다...
                        </div>
                      ) : comments.length > 0 ? (
                        <ul className="space-y-4">
                          {comments.map((comment, index) => (
                            <li key={index} className="rounded-xl border border-white p-4">
                              <div className="flex justify-between items-baseline">
                                <p className="font-medium text-neutral-100">{comment.commentTitle}</p>
                                <span className="text-xs text-neutral-500">by {comment.userId}</span>
                              </div>
                              <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">
                                {comment.commentContent}
                              </p>
                              <div className="mt-3 text-right text-xs text-neutral-500 space-y-1">
                                <p>생성: {comment.createdAt}</p>
                                <p>수정: {comment.updatedAt}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-10 text-center text-neutral-500">코멘트가 없습니다.</div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                      <p className="mb-3 text-sm text-neutral-400">새 코멘트</p>
                      <Input
                        value={commentTitle}
                        onChange={(e) => setCommentTitle(e.target.value)}
                        placeholder="제목"
                        className="mb-3 bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
                      />
                      <textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="내용을 입력하세요"
                        rows={6}
                        className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-neutral-500"
                      />
                      <Button
                        onClick={submitComment}
                        disabled={isPosting || !commentTitle.trim() || !commentBody.trim()}
                        className="mt-3 w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800"
                      >
                        {isPosting ? "등록 중..." : "등록"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PacsPlusSearchMinimal;
