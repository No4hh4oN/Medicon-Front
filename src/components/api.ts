import type{
  ApiPatientResponse,
  ApiModalityResponse,
  ApiComment,
  ResultRow,
  CommentRow,
} from "./types";

const BASE_URL = "http://localhost:8080/api";

export async function fetchStudies(
  searchType: "pname" | "pid" | "modality",
  query: string
): Promise<ResultRow[]> {
  let endpoint = "";
  if (searchType === "pid") {
    endpoint = `/patientID/${encodeURIComponent(query)}`;
  } else if (searchType === "pname") {
    endpoint = `/patientName/${encodeURIComponent(query)}`;
  } else if (searchType === "modality") {
    endpoint = `/modality/${encodeURIComponent(query)}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.statusText}`);
  }

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
  return newRows;
}

export async function fetchComments(studyKey: number): Promise<CommentRow[]> {
  const response = await fetch(`${BASE_URL}/v1/dicom/study/${studyKey}/comment`);
  if (!response.ok) {
    throw new Error(`코멘트 API 요청 실패: ${response.statusText}`);
  }

  const apiData: ApiComment[] = await response.json();
  return apiData.map((c) => ({
    userId: c.userId,
    commentTitle: c.commentTitle,
    commentContent: c.commentContent,
    createdAt: new Date(c.createdAt).toLocaleString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "-",
  }));
}

export async function postComment(studyKey: number, title: string, content: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/comment/${studyKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commentTitle: title,
      commentContent: content,
    }),
  });
  if (!res.ok) {
    throw new Error("코멘트 등록 실패");
  }
}

