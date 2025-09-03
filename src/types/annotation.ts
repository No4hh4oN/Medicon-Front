export interface ArrowAnnotationData {
  annotationUID: string;          // CS가 부여하는 UID
  toolName: 'ArrowAnnotate';      // 도구 이름
  referencedImageId?: string;     // 이미지 단위로 저장할 때
  data: {
    handles: {
      start: { x: number; y: number };
      end: { x: number; y: number };
    };
    text?: string;                // 사용자가 입력한 주석 텍스트
    // 그 외 Cornerstone가 넣는 필드가 있어도 같이 보존 권장
    [k: string]: any;
  };
  metadata?: Record<string, any>;
}

export interface AnnotationBundlePayload {
  studyKey: string;
  seriesKey?: string;             // 시리즈 단위 저장 시
  viewportId?: string;            // 원하면 뷰포트 스코프도
  imageIdScope?: 'series' | 'image';
  annotations: ArrowAnnotationData[];
  savedAt: string;                // ISO 문자열
  currentImageId?: string;        // 현재 뷰포트의 imageId (주석이 없을 때 빈 값 전송용)
}

