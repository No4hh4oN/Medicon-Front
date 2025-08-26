import { useCallback, useState } from 'react';
import {
  ToolGroupManager,
  ArrowAnnotateTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
} from '@cornerstonejs/tools';

interface Props {
  toolGroupId?: string;
}

export default function ViewerToolbar({ toolGroupId = 'cs3d-tg' }: Props) {
  const [annotating, setAnnotating] = useState(false);

  const toggleArrowAnnotate = useCallback(() => {
    const tg = ToolGroupManager.getToolGroup(toolGroupId);
    if (!tg) return console.warn('ToolGroup을 찾을 수 없습니다:', toolGroupId);

    if (annotating) {
      // 🔙 기본 모드 복원 (WL/WW, Pan, Zoom)
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

  return (
    <div style={{  display: 'inline-flex', width: 'fit-content', height: 'fit-content'}}>
      <button onClick={toggleArrowAnnotate}>
        {annotating ? '주석 모드 종료' : 'Arrow 주석 달기'}
      </button>
    </div>
  );
}


