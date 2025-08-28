import { useCallback, useState } from 'react';
import {
  ToolGroupManager,
  ArrowAnnotateTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  annotation, // ← 위로 올려도 됨
} from '@cornerstonejs/tools';
import { getRenderingEngine } from '@cornerstonejs/core';
import {
  exportArrowAnnotations,
  fetchAnnotationsFromServer,
  importArrowAnnotations,
  saveAnnotationsToServer,
} from '@/services/annotation';
import type { AnnotationBundlePayload } from '@/types/annotation';

interface Props {
  toolGroupId?: string,
  studyKey: string,
  seriesKey?: string, // DicomViewer에서 필수가 아님
  renderingEngineId: string,
  viewportId: string | null, // 처음에는 null일 수 있음
}

export default function Toolbar({
  toolGroupId = 'cs3d-tg',
  studyKey,
  seriesKey,
  renderingEngineId,
  viewportId,
}: Props) {
  const [annotating, setAnnotating] = useState(false);

  const toggleArrowAnnotate = useCallback(() => {
    const tg = ToolGroupManager.getToolGroup(toolGroupId);
    if (!tg) return console.warn('ToolGroup을 찾을 수 없습니다:', toolGroupId);

    if (annotating) {
      tg.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: 1 }] });
      tg.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: 2 }] });
      tg.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: 4 }] });
      tg.setToolPassive(ArrowAnnotateTool.toolName);
      setAnnotating(false);
    } else {
      tg.setToolActive(ArrowAnnotateTool.toolName, { bindings: [{ mouseButton: 1 }] });
      tg.setToolPassive(WindowLevelTool.toolName);
      setAnnotating(true);
    }
  }, [annotating, toolGroupId]);

  // ---- imageId에서 키 파싱 (images | instances 모두 허용)
  function parseImageIdKeys(imageId: string): { studyKey: number; seriesKey: number; imageKey: number; frameNo: number } | null {
    const regex = /studies\/(\d+)\/series\/(\d+)\/(images|instances)\/(\d+)(?:\/frames\/(\d+))?/;
    try {
      const m = imageId.match(regex);
      if (!m) return null;
      const sKey = parseInt(m[1], 10);
      const seKey = parseInt(m[2], 10);
      const iKey = parseInt(m[4], 10);
      const fNo = m[5] ? parseInt(m[5], 10) : -1;
      if ([sKey, seKey, iKey].some(Number.isNaN)) return null;
      return { studyKey: sKey, seriesKey: seKey, imageKey: iKey, frameNo: fNo };
    } catch {
      return null;
    }
  }

  // 주석 저장
  const onSave = async () => {
    try {
      const annotations = exportArrowAnnotations();
      if (annotations.length === 0) {
        alert('저장할 주석이 없습니다.');
        return;
      }
      await saveAnnotationsToServer({
        studyKey,
        seriesKey,
        imageIdScope: 'image', // ← series가 아니라 image 기준으로 통일 (저장 로직은 image별 전송)
        annotations,
        savedAt: new Date().toISOString(),
      });
      alert('주석이 저장되었습니다.');
    } catch (e: any) {
      console.error('Annotation 저장 중 오류 발생:', e);
      alert(`저장 실패: ${e.message}`);
    }

  };

  // 주석 불러오기
  const onLoad = async () => {
    if (!viewportId) {
      alert('뷰포트가 준비되지 않았습니다. 먼저 시리즈를 불러오세요.');
      return;
    }
    if (!seriesKey) {
      alert('시리즈가 선택되지 않았습니다.');
      return;
    }

    // 현재 뷰포트에서 imageId를 안전하게 얻기
    const re = getRenderingEngine(renderingEngineId);
    const vp: any = re?.getViewport(viewportId);
    if (!re || !vp) {
      alert('렌더링 엔진 또는 뷰포트를 찾을 수 없습니다.');
      return;
    }

    let currentImageId: string | undefined;
    // Cornerstone 뷰포트 타입별 안전 로직
    if (typeof vp.getCurrentImageId === 'function') {
      currentImageId = vp.getCurrentImageId();
    } else if (typeof vp.getCurrentImageIdIndex === 'function' && typeof vp.getImageIds === 'function') {
      const idx = vp.getCurrentImageIdIndex();
      const ids = vp.getImageIds?.();
      currentImageId = Array.isArray(ids) ? ids[idx] : undefined;
    }

    if (!currentImageId) {
      alert('현재 이미지 ID를 가져올 수 없습니다.');
      return;
    }
    console.log('Current Image ID:', currentImageId);

    const keys = parseImageIdKeys(currentImageId);
    if (!keys) {
      console.warn('imageId 파싱 실패:', currentImageId);
      alert('현재 이미지 ID에서 imageKey를 추출할 수 없습니다.');
      return;
    }

    try {
      // ✅ imageKey를 명시적으로 넘김
      console.log('Fetching annotations with:', { studyKey, seriesKey, imageKey: String(keys.imageKey) });
      const bundle = await fetchAnnotationsFromServer({
        studyKey,
        seriesKey,
        imageKey: String(keys.imageKey),
      }) as AnnotationBundlePayload;

      if (!bundle || !Array.isArray(bundle.annotations) || bundle.annotations.length === 0) {
        alert('불러올 주석 데이터가 없습니다.');
        return;
      }

      importArrowAnnotations(bundle, renderingEngineId, viewportId);
      alert('주석을 불러왔습니다.');
    } catch (e: any) {
      console.error('Annotation 불러오기 중 오류 발생:', e);
      alert(`불러오기 실패: ${e.message}`);
    }
  };

  const onClear = () => {
    if (window.confirm('정말 모든 주석을 삭제하시겠습니까?')) {
      annotation.state.removeAllAnnotations();
      const re = getRenderingEngine(renderingEngineId);
      re?.render();
    }
  };

  return (
    <div style={{ display: 'inline-flex', width: 'fit-content', height: 'fit-content' }}>
      <button onClick={toggleArrowAnnotate}>
        {annotating ? '주석 모드 종료' : 'Arrow 주석 달기'}
      </button>
      <button onClick={onSave}>주석 저장</button>
      <button onClick={onLoad}>주석 불러오기</button>
      <button onClick={onClear}>모두 삭제</button>
    </div>
  );
}
