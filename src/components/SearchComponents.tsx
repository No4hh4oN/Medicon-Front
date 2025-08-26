import * as React from "react";
import { useState, useCallback } from "react";
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
import type { ResultRow, CommentRow } from "./types";
import { fetchStudies, fetchComments, postComment } from "./api";
import { StudyTable } from "./StudyTable";
import { CommentSection } from "./CommentSection";

export interface PacsPlusSearchMinimalProps {
  initialRows?: ResultRow[];
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

  const onSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSelectedStudyKey(null);
      setComments([]);
      setRows(initialRows);
      return;
    }

    setIsLoading(true);
    setSelectedStudyKey(null);
    setComments([]);

    try {
      const newRows = await fetchStudies(searchType, query);
      setRows(newRows);
    } catch (e) {
      console.error("[PacsPlusSearchMinimal] API 요청 오류:", e);
      setRows([]); // 오류 발생 시 행을 비웁니다.
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchType, initialRows]);

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
        const formatted = await fetchComments(studyKey);
        setComments(formatted);
      } catch (e) {
        console.error("[PacsPlusSearchMinimal] 코멘트 API 요청 오류:", e);
        setComments([]);
      } finally {
        setIsCommentsLoading(false);
      }
    },
    [selectedStudyKey]
  );

  const handleAddComment = useCallback(
    async (title: string, content: string) => {
      if (!selectedStudyKey) return;

      try {
        await postComment(selectedStudyKey, title, content);

        // Optimistically update the UI
        const now = new Date().toLocaleString();
        setComments((prev) => [
          ...prev,
          {
            userId: "me", // Or get from auth context
            commentTitle: title,
            commentContent: content,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      } catch (e) {
        console.error("코멘트 등록 실패:", e);
        // 사용자에게 에러 알림을 표시할 수 있습니다.
      }
    },
    [selectedStudyKey]
  );

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex flex-col">
      <Card className="m-4 sm:m-6 md:m-8 bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle>PACS+ 검색</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* ▶︎ 상단 검색바 */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Select value={searchType} onValueChange={(value: "pname" | "pid" | "modality") => setSearchType(value)}>
              <SelectTrigger className="w-full md:w-[120px] bg-neutral-800 border-neutral-700">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
                <SelectItem value="pname">환자 이름</SelectItem>
                <SelectItem value="pid">환자 아이디</SelectItem>
                <SelectItem value="modality">검사장비</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="search"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              className="flex-1 bg-neutral-800 border-neutral-700 placeholder:text-neutral-500"
            />
            <Button onClick={onSearch} className="w-full md:w-auto bg-sky-500 hover:bg-sky-600">
              검색
            </Button>
          </div>

          <StudyTable rows={rows} isLoading={isLoading} onRowClick={handleRowClick} />

          {/* 코멘트 패널 */}
          {selectedStudyKey !== null && (
            <CommentSection
              studyKey={selectedStudyKey}
              comments={comments}
              isLoading={isCommentsLoading}
              onAddComment={handleAddComment}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PacsPlusSearchMinimal;
