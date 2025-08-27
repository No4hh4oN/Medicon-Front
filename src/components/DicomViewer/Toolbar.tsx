import { useCallback, useState } from 'react';
import {
  ToolGroupManager,
  ArrowAnnotateTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
} from '@cornerstonejs/tools';
import { exportArrowAnnotations, fetchAnnotationsFromServer, importArrowAnnotations, saveAnnotationsToServer } from '@/services/annotation';

interface ToolbarProps {
  toolGroupId?: string,
  studyKey: string,
  seriesKey: string,
  renderingEngineId: string,
  viewportId: string,
}

export default function Toolbar({
  toolGroupId = 'cs3d-tg',
  studyKey,
  seriesKey,
  renderingEngineId,
  viewportId,
  }: ToolbarProps) {
  const [annotating, setAnnotating] = useState(false);

  const toggleArrowAnnotate = useCallback(() => {
    const tg = ToolGroupManager.getToolGroup(toolGroupId);
    if (!tg) return console.warn('ToolGroup을 찾을 수 없습니다:', toolGroupId);

    if (annotating) {
      // 기본 모드 (WL/WW, Pan, Zoom)
      tg.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: 1 }] });
      tg.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: 2 }] });
      tg.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: 4 }] });

      tg.setToolPassive(ArrowAnnotateTool.toolName);
      setAnnotating(false);
    } else {
      // ArrowAnnotateTool 활성화 (좌클릭으로 주석)
      tg.setToolActive(ArrowAnnotateTool.toolName, { bindings: [{ mouseButton: 1 }] });
      tg.setToolPassive(WindowLevelTool.toolName); // WL 비활성화
      setAnnotating(true);
    }
  }, [annotating, toolGroupId]);
  
  // 주석 저장
  const onSave = async () => {
    const arrows = exportArrowAnnotations();
    const payload = {
      studyKey,
      seriesKey,
      imageIdScope: 'series' as const,
      annotations: arrows,
      savedAt: new Date().toISOString(),
    }
  console.log('payload (object):', payload);
  console.log('payload (json):', JSON.stringify(payload, null, 2));
  console.groupEnd();

    await saveAnnotationsToServer(payload);
  };

  // 주석 불러오기
  const onLoad = async () => {
    const bundle = await fetchAnnotationsFromServer({ studyKey, seriesKey });
    importArrowAnnotations(bundle, renderingEngineId, viewportId);
  }

  return (
    <div style={{  display: 'inline-flex', width: 'fit-content', height: 'fit-content'}}>
      <button onClick={toggleArrowAnnotate}>
        {annotating ? '주석 모드 종료' : 'Arrow 주석 달기'}
      </button>
      
      <button onClick={onSave}>주석 저장</button>
      <button onClick={onLoad}>주석 불러오기</button>
    </div>
  );
}


