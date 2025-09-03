import { annotation } from '@cornerstonejs/tools';
import { API_ROOT } from '@/config/api';
import type { AnnotationBundlePayload, ArrowAnnotationData } from '@/types/annotation';
import { getRenderingEngine } from '@cornerstonejs/core';

function pickArrow(ann: any): ann is ArrowAnnotationData {
  return ann?.metadata?.toolName === 'ArrowAnnotate' || ann?.toolName === 'ArrowAnnotate';
}

// Cornerstone 전체 애노테이션에서 Arrow만 뽑아 직렬화
export function exportArrowAnnotations(): ArrowAnnotationData[] {
  const all = annotation.state.getAllAnnotations(); // 모든 툴 포함
  const arrows: ArrowAnnotationData[] = all
    .filter(pickArrow)
    .map((a: any) => ({
      annotationUID: a.annotationUID ?? crypto.randomUUID(),
      toolName: a.metadata?.toolName ?? a.toolName ?? 'ArrowAnnotate',
      referencedImageId: a.metadata?.referencedImageId ?? a.referencedImageId,
      data: a.data ?? {},
      metadata: a.metadata ?? {},
    }));
  return arrows;
}

// 서버에 저장
export async function saveAnnotationsToServer(payload: AnnotationBundlePayload) {
  /**
   * wadors/http 등으로 시작하는 imageId에서 study/series/image/frame 키를 추출합니다.
   * 예시 포맷:
   *   .../studies/10/series/2/images/153/frames/5
   *   .../studies/10/series/2/instances/153/frames/5
   */
  function parseImageIdKeys(
    imageId: string,
  ): { studyKey: number; seriesKey: number; imageKey: number; frameNo: number } | null {
    // images 또는 instances 모두 허용
    const regex = /studies\/(\d+)\/series\/(\d+)\/(images|instances)\/(\d+)(?:\/frames\/(\d+))?/;

    try {
      const match = imageId.match(regex);
      if (!match) {
        throw new Error(`Could not parse required keys from imageId: ${imageId}`);
      }
      const studyKey = parseInt(match[1], 10);
      const seriesKey = parseInt(match[2], 10);
      const imageKey = parseInt(match[4], 10);
      const frameNo = match[5] ? parseInt(match[5], 10) : -1;

      if (isNaN(studyKey) || isNaN(seriesKey) || isNaN(imageKey)) {
        console.error('Failed to parse one or more keys from imageId', imageId);
        return null;
      }
      return { studyKey, seriesKey, imageKey, frameNo };
    } catch (e) {
      console.error(`Failed to parse imageId: ${imageId}`, e);
      return null;
    }
  }

  // 1. referencedImageId를 기준으로 주석들을 그룹화합니다.
  const groupedByImageId = payload.annotations.reduce((acc, ann) => {
    const imageId = ann.referencedImageId;
    if (!imageId) {
      console.warn('Annotation without referencedImageId found, skipping:', ann);
      return acc;
    }
    if (!acc[imageId]) {
      acc[imageId] = [];
    }
    acc[imageId].push(ann);
    return acc;
  }, {} as Record<string, ArrowAnnotationData[]>);

  // 2. 백엔드 API 형식에 맞는 payload 배열을 생성합니다.
  const backendPayload = Object.entries(groupedByImageId)
    .map(([imageId, annotations]) => {
      const keys = parseImageIdKeys(imageId);
      if (!keys) return null;

      return {
        ...keys,
        annotations: JSON.stringify({ version: '5.3.0', objects: annotations }),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (backendPayload.length === 0) {
    console.log('저장할 주석 데이터가 없습니다.');
    return;
  }

  // 3. 각 이미지별로 API를 호출하여 주석을 저장합니다.
  // API_ROOT ('.../dicom')를 기준으로 annotation API ('.../annotations') URL을 생성합니다.
  const ANNOTATION_API_ROOT = API_ROOT.replace('/dicom', '/annotations');

  const promises = backendPayload.map((payloadItem) => {
    const { studyKey, seriesKey, imageKey } = payloadItem;
    const url = `${ANNOTATION_API_ROOT}/studies/${studyKey}/series/${seriesKey}/images/${imageKey}`;

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadItem),
      credentials: 'include', // Add this line
    });
  });

  try {
    const responses = await Promise.all(promises);

    for (const res of responses) {
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Annotation 저장 실패: ${res.status}, URL: ${res.url}, Body: ${errorBody}`);
      }
    }
  } catch (error) {
    console.error('Annotation 저장 중 오류 발생:', error);
    throw error;
  }
}

// 서버에서 불러오기
export async function fetchAnnotationsFromServer(params: {
  studyKey: string;
  seriesKey: string;   // 필수
  imageKey: string;    // ✅ 추가: 저장 API와 동일하게 이미지 단건 기준으로 조회
}) {
  const ANNOTATION_API_ROOT = API_ROOT.replace('/dicom', '/annotations');
  const { studyKey, seriesKey, imageKey } = params;

  const url = `${ANNOTATION_API_ROOT}/studies/${studyKey}/series/${seriesKey}/images/${imageKey}`;
  console.log('Fetching annotations from URL:', url);

  const res = await fetch(url);
  console.log('Annotation fetch response:', res);
  if (!res.ok) {
    throw new Error(`Annotation 불러오기 실패: ${res.status} - ${res.statusText}`);
  }

  const text = await res.text();

  // 주석이 없는 경우, 빈 번들 반환
  if (!text) {
    return {
      studyKey,
      seriesKey,
      imageIdScope: 'image' as const,
      annotations: [],
      savedAt: new Date().toISOString(),
    } as AnnotationBundlePayload;
  }

  try {
    const rawArray = JSON.parse(text); // Parse the outer array
    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      // Handle empty or non-array response
      return {
        studyKey,
        seriesKey,
        imageIdScope: 'image' as const,
        annotations: [],
        savedAt: new Date().toISOString(),
      } as AnnotationBundlePayload;
    }

    // 서버가 주는 형태가 유연할 수 있으니 안전하게 정규화
    const raw = rawArray[0] as
      | AnnotationBundlePayload
      | {
          annotations?:
            | string
            | { version?: string; objects?: any[] }
            | any[];
          savedAt?: string;
        };

    let annotations: any[] = [];

    // 1) 이미 배열인 경우
    if (Array.isArray((raw as any).annotations)) {
      annotations = (raw as any).annotations as any[];
    }
    // 2) 문자열인 경우 -> JSON 파싱 후 객체의 objects 또는 배열 사용
    else if (typeof (raw as any).annotations === 'string') {
      try {
        const parsed = JSON.parse((raw as any).annotations); // First JSON.parse

        let finalAnnotations: any[] = [];

        // Check if parsed.annotations exists and is a string, then parse it again
        if (typeof parsed?.annotations === 'string') {
          try {
            const innerParsed = JSON.parse(parsed.annotations); // Second JSON.parse
            if (Array.isArray(innerParsed?.objects)) {
              finalAnnotations = innerParsed.objects;
            } else if (Array.isArray(innerParsed)) {
              finalAnnotations = innerParsed;
            }
          } catch (e) {
            console.error('Failed to parse inner annotations string:', e);
          }
        } else if (Array.isArray(parsed?.objects)) {
          finalAnnotations = parsed.objects;
        } else if (Array.isArray(parsed)) {
          finalAnnotations = parsed;
        }

        annotations = finalAnnotations; // Assign to the main annotations variable
      } catch {
        annotations = [];
      }
    }
    // 3) 객체인 경우 -> objects 또는 객체 자체가 배열인지 체크
    else if ((raw as any).annotations && typeof (raw as any).annotations === 'object') {
      const obj = (raw as any).annotations as any;
      if (Array.isArray(obj?.objects)) {
        annotations = obj.objects;
      } else if (Array.isArray(obj)) {
        annotations = obj;
      } else {
        annotations = [];
      }
    }

    console.log('Parsed annotations for import:', annotations);
    

    const bundle: AnnotationBundlePayload = {
      studyKey,
      seriesKey,
      imageIdScope: 'image' as const,
      annotations,
      savedAt: (raw as any).savedAt ?? new Date().toISOString(),
    };

    return bundle;
  } catch (e) {
    console.error('Failed to parse annotations JSON:', e);
    throw new Error('Failed to parse annotations from server.');
  }
}


function clearElementAnnotations(el: HTMLDivElement) {
  try {
    // 최신 버전에선 element로 필터링 가능한 API가 있을 수 있음
    const all = (annotation.state as any).getAnnotations?.() ?? [];
    for (const a of all) {
      // element 메타가 이 엘리먼트가 아니면 스킵
      if (a?.metadata?.element && a.metadata.element !== el) continue;
      (annotation.state as any).removeAnnotation?.(a.annotationUID, el);
    }
  } catch {}
}


function makeUid() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : "anno-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * any 형태(bundle/annotations-string/objects-array) 모두 허용.
 * - annotations 배열 정규화
 * - annotationUID 재발급 (좌/우 충돌 방지)
 * - 현재 뷰포트 imageId로 referencedImageId 고정 (표시 보장)
 */
export function importArrowAnnotations(
  bundle: any,
  renderingEngineId: string,
  viewportId: string
) {
  const re = getRenderingEngine(renderingEngineId);
  const vp: any = re?.getViewport(viewportId);
  const el = vp?.element as HTMLDivElement | undefined;
  if (!re || !vp || !el) return;

  clearElementAnnotations(el);

  // 1) annotations 배열 정규화
  let annos: any[] = [];
  if (Array.isArray(bundle?.annotations)) {
    annos = bundle.annotations;
  } else if (Array.isArray(bundle?.objects)) {
    annos = bundle.objects;
  } else if (typeof bundle?.annotations === "string") {
    try {
      const parsed = JSON.parse(bundle.annotations);
      if (Array.isArray(parsed?.objects)) annos = parsed.objects;
      else if (Array.isArray(parsed?.annotations)) annos = parsed.annotations;
    } catch {}
  }
  if (!Array.isArray(annos)) annos = [];

  // 2) 현재 뷰포트의 imageId 확보
  const currentImageId: string | undefined = (() => {
    try {
      if (typeof vp.getCurrentImageId === "function") return vp.getCurrentImageId();
      if (typeof vp.getCurrentImageIdIndex === "function" && typeof vp.getImageIds === "function") {
        const idx = vp.getCurrentImageIdIndex();
        const ids = vp.getImageIds?.();
        return Array.isArray(ids) ? ids[idx] : undefined;
      }
    } catch {}
    return undefined;
  })();

  // 3) UID 재발급 + imageId 고정
  const wado = (id: string) => (id.startsWith("wadouri:") ? id : `wadouri:${id}`);
  for (const raw of annos) {
    const patched = JSON.parse(JSON.stringify(raw));
    patched.annotationUID = makeUid();
    patched.toolName = patched.toolName || "ArrowAnnotate";

    if (currentImageId) {
      const rid = wado(currentImageId);
      patched.referencedImageId = rid;
      patched.metadata = {
        ...(patched.metadata ?? {}),
        referencedImageId: rid,
        referencedImageURI: rid.replace(/^wadouri:/, ""),
      };
    }

    annotation.state.addAnnotation(patched as any, el);
  }

  re.render?.();
}

