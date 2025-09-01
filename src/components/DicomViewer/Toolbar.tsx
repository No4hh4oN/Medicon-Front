import { useCallback, useState } from 'react';
import {
  ToolGroupManager,
  ArrowAnnotateTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  annotation,
} from '@cornerstonejs/tools';
import { getRenderingEngine } from '@cornerstonejs/core';
import {
  exportArrowAnnotations,
  fetchAnnotationsFromServer,
  importArrowAnnotations,
  saveAnnotationsToServer,
} from '@/services/annotation';
import type { AnnotationBundlePayload } from '@/types/annotation';
import { Button } from '@/components/ui/button';
import { PencilLine, Save, FolderOpen, Trash2 } from 'lucide-react';

interface Props {
  toolGroupId?: string;
  studyKey: string;
  seriesKey?: string;
  renderingEngineId: string;
  viewportId: string | null;
}

export default function Toolbar({
  toolGroupId = 'cs3d-tg',
  studyKey,
  seriesKey,
  renderingEngineId,
  viewportId,
}: Props) {
  const [annotating, setAnnotating] = useState(false);

  // 중복 식별자 방지: toggleArrowAnnotate → handleToggleAnnotate
  const handleToggleAnnotate = useCallback(() => {
    const tg = ToolGroupManager.getToolGroup(toolGroupId);
    if (!tg) {
      console.warn('ToolGroup을 찾을 수 없습니다:', toolGroupId);
      return;
    }

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

  // imageId → 키 파싱
  function parseImageIdKeys(imageId: string): {
    studyKey: number; seriesKey: number; imageKey: number; frameNo: number;
  } | null {
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

  const onSave = useCallback(async () => {
    try {
      const annotations = exportArrowAnnotations();
      if (annotations.length === 0) {
        alert('저장할 주석이 없습니다.');
        return;
      }
      await saveAnnotationsToServer({
        studyKey,
        seriesKey,
        imageIdScope: 'image',
        annotations,
        savedAt: new Date().toISOString(),
      });
      alert('주석이 저장되었습니다.');
    } catch (e: any) {
      console.error('Annotation 저장 중 오류 발생:', e);
      alert(`저장 실패: ${e.message}`);
    }
  }, [studyKey, seriesKey]);

  const onLoad = useCallback(async () => {
    if (!viewportId) {
      alert('뷰포트가 준비되지 않았습니다. 먼저 시리즈를 불러오세요.');
      return;
    }
    if (!seriesKey) {
      alert('시리즈가 선택되지 않았습니다.');
      return;
    }

    const re = getRenderingEngine(renderingEngineId);
    const vp: any = re?.getViewport(viewportId);
    if (!re || !vp) {
      alert('렌더링 엔진 또는 뷰포트를 찾을 수 없습니다.');
      return;
    }

    let currentImageId: string | undefined;
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

    const keys = parseImageIdKeys(currentImageId);
    if (!keys) {
      console.warn('imageId 파싱 실패:', currentImageId);
      alert('현재 이미지 ID에서 imageKey를 추출할 수 없습니다.');
      return;
    }

    try {
      const bundle = (await fetchAnnotationsFromServer({
        studyKey,
        seriesKey,
        imageKey: String(keys.imageKey),
      })) as AnnotationBundlePayload;

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
  }, [viewportId, seriesKey, renderingEngineId, studyKey]);

  const onClear = useCallback(() => {
    if (window.confirm('정말 모든 주석을 삭제하시겠습니까?')) {
      annotation.state.removeAllAnnotations();
      const re = getRenderingEngine(renderingEngineId);
      re?.render();
    }
  }, [renderingEngineId]);

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-2 py-1">
      {/* 주석 토글 */}
      <Button
        size="sm"
        onClick={handleToggleAnnotate}
        className={annotating
          ? 'bg-sky-500 hover:bg-sky-600 text-white'
          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'}
      >
        <PencilLine className="h-4 w-4" />
        <span className="ml-2">{annotating ? '주석 모드 종료' : 'Arrow 주석 달기'}</span>
      </Button>

      <div className="mx-1 h-5 w-px bg-neutral-800" />

      {/* 저장 */}
      <Button size="sm" variant="ghost" onClick={onSave} className="text-neutral-200 hover:bg-neutral-800">
        <Save className="h-4 w-4" />
        <span className="ml-2">주석 저장</span>
      </Button>

      {/* 불러오기 */}
      <Button size="sm" variant="ghost" onClick={onLoad} className="text-neutral-200 hover:bg-neutral-800">
        <FolderOpen className="h-4 w-4" />
        <span className="ml-2">주석 불러오기</span>
      </Button>

      {/* 모두 삭제 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
      >
        <Trash2 className="h-4 w-4" />
        <span className="ml-2">모두 삭제</span>
      </Button>
    </div>
  );
}
