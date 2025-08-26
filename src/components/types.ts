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
export type CommentRow = {
  userId: string;
  commentTitle: string;
  commentContent: string;
  createdAt: string;
  updatedAt: string;
};

// ===== API 응답 타입 =====
export interface ApiStudy {
  studyKey: number;
  studyDate: string;
  studyTime: string;
  studyDesc: string | null;
  modality: string;
  bodyPart: string | null;
  patAge: string | null;
}
export interface ApiPatientResponse {
  studyListDto: ApiStudy[];
  pid: string;
  pbirthdate: string | null;
  pname: string;
  psex: string;
}
export interface ApiModalityResponse {
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
export interface ApiComment {
  commentId: number;
  studyKey: number;
  userId: string;
  commentTitle: string;
  commentContent: string;
  createdAt: string;
  updatedAt: string | null;
}

