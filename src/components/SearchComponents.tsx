import * as React from "react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { fetchStudies, fetchComments, postComment, updateComment, deleteComment } from "./api";
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
  const navigate = useNavigate();

  const onSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setRows(initialRows);
      setSelectedStudyKey(null);
      setComments([]);
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
      // 같은 행을 다시 클릭하면 코멘트 창을 닫습니다.
      if (selectedStudyKey === studyKey) {
        setSelectedStudyKey(null);
        setComments([]);
        return;
      }

      setSelectedStudyKey(studyKey);
      setIsCommentsLoading(true);
      setComments([]); // 이전 코멘트 목록을 비웁니다.

      try {
        const fetchedComments = await fetchComments(studyKey);
        setComments(fetchedComments);
      } catch (e) {
        console.error("[PacsPlusSearchMinimal] 코멘트 API 요청 오류:", e);
        setComments([]); // 오류 발생 시 코멘트 목록을 비웁니다.
      } finally {
        setIsCommentsLoading(false);
      }
    },
    [selectedStudyKey]
  );

  const handleRowDoubleClick = useCallback(
    (studyKey: number) => {
      navigate(`/viewer/${studyKey}`);
    },
    [navigate]
  );

  const handleAddComment = useCallback(
    async (title: string, content: string) => {
      if (!selectedStudyKey) return;

      try {
        await postComment(selectedStudyKey, title, content);
        // 코멘트 등록 후 목록을 새로고침하여 최신 데이터를 반영합니다.
        const fetchedComments = await fetchComments(selectedStudyKey);
        setComments(fetchedComments);
      } catch (e) {
        console.error("코멘트 등록 실패:", e);
        // 사용자에게 에러 알림을 표시할 수 있습니다.
      }
    },
    [selectedStudyKey]
  );

  const handleUpdateComment = useCallback(async (commentId: number, title: string, content: string, original: CommentRow) => {
    if (!selectedStudyKey) return;
    try {
      await updateComment(selectedStudyKey, commentId, title, content, original);
      const fetchedComments = await fetchComments(selectedStudyKey);
      setComments(fetchedComments);
    } catch (e) {
      console.error("코멘트 수정 실패:", e);
      // 사용자에게 에러 알림을 표시할 수 있습니다.
    }
  }, [selectedStudyKey]);

  const handleDeleteComment = useCallback(async (commentId: number, comment: CommentRow) => {
    if (!selectedStudyKey) return;
    try {
      await deleteComment(selectedStudyKey, commentId, comment);
      const fetchedComments = await fetchComments(selectedStudyKey);
      setComments(fetchedComments);
    } catch (e) {
      console.error("코멘트 삭제 실패:", e);
      // 사용자에게 에러 알림을 표시할 수 있습니다.
    }
  }, [selectedStudyKey]);

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

          <StudyTable rows={rows} isLoading={isLoading} onRowClick={handleRowClick} onRowDoubleClick={handleRowDoubleClick} />

          {selectedStudyKey !== null && (
            <CommentSection
              studyKey={selectedStudyKey}
              comments={comments}
              isLoading={isCommentsLoading}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PacsPlusSearchMinimal;
