export interface Log {
  logId: number;
  studyKey: number;
  userId: string;
  commentId: number | null;
  commentType: string;
  originalTitle: string | null;
  originalContent: string | null;
  newTitle: string | null;
  newContent: string | null;
  actionType: string;
  createdAt: string;
  updatedAt: string;
}