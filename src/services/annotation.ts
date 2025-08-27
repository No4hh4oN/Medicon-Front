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
    const res = await fetch(`${API_ROOT}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`annotation 저장 실패: ${res.status}`);
}

// 서버에서 불러오기
export async function fetchAnnotationsFromServer(params: {
    studyKey: string;
    seriesKey?: string;
}) {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_ROOT}/annotations?${q}`);
    if (!res.ok) throw new Error(`annotation 불러오기 실패: ${res.status}`);
    const data = (await res.json()) as AnnotationBundlePayload;
    return data;
}

// Cornerstone state에 주석 주입 및 렌더 
export function importArrowAnnotations(bundle: AnnotationBundlePayload, renderingEngineId: string, viewportId: string) {
    const re = getRenderingEngine(renderingEngineId);
    const vp: any = re?.getViewport(viewportId);
    const el = vp?.element as HTMLDivElement | undefined;
    if (!re || !vp || !el) return;
    for (const ann of bundle.annotations) {
        annotation.state.addAnnotation(ann as any, el);
    }
    re?.render();
}
