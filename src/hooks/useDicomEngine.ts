import { useState, useEffect, useRef } from 'react';
import {
    RenderingEngine,
    init as coreInit,
} from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import {
    init as toolsInit,
    addTool,
    ToolGroupManager,
    Enums as toolsEnums,
    PanTool,
    ZoomTool,
    StackScrollTool,
    WindowLevelTool,
    ArrowAnnotateTool,
} from '@cornerstonejs/tools';

const RENDERING_ENGINE_ID = 'rendering-engine';
//const VIEWPORT_ID = 'viewport';
const TOOLGROUP_ID = 'toolgroup';

// 초기화 (core/ tools/ engine/ toolgroup 생성)
export default function useDicomEngine() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<RenderingEngine | null>(null);
    const [isReady, setIsReady] = useState(false);

    // 1) Cornerstone 초기화 (앱 생애주기 1회)
    useEffect(() => {
        let mounted = true;
        (async () => {
            await coreInit();
            await dicomImageLoaderInit({ maxWebWorkers: 2 });
            await toolsInit();

            if (!mounted) return;

            // 렌더링 엔진 & 뷰포트
            const re = new RenderingEngine(RENDERING_ENGINE_ID);
            engineRef.current = re;

            // 툴 등록
            addTool(PanTool);
            addTool(ZoomTool);
            addTool(StackScrollTool);
            addTool(WindowLevelTool);
            addTool(ArrowAnnotateTool);

            // 툴 그룹 생성/연결
            let tg = ToolGroupManager.getToolGroup(TOOLGROUP_ID);
            if (!tg) {
                tg = ToolGroupManager.createToolGroup(TOOLGROUP_ID)!;
            }
            tg.addTool(PanTool.toolName);
            tg.addTool(ZoomTool.toolName);
            tg.addTool(StackScrollTool.toolName);
            tg.addTool(WindowLevelTool.toolName);
            tg.addTool(ArrowAnnotateTool.toolName);
            //tg.addViewport(VIEWPORT_ID, RENDERING_ENGINE_ID);

            // 바인딩 (좌: 윈도우레벨 / 우: 줌 / Ctrl+좌: 팬 / 휠 : 스택)
            tg.setToolActive(WindowLevelTool.toolName, {
                bindings: [{ mouseButton: toolsEnums.MouseBindings.Primary }],
            });
            tg.setToolActive(PanTool.toolName, {
                bindings: [{
                    mouseButton: toolsEnums.MouseBindings.Primary,
                    modifierKey: toolsEnums.KeyboardBindings.Ctrl,
                }],
            });
            tg.setToolActive(ZoomTool.toolName, {
                bindings: [{ mouseButton: toolsEnums.MouseBindings.Secondary }],
            });

            // StackScrollTool 은 기본 동작(드래그 기반)을 사용
            tg.setToolActive(StackScrollTool.toolName, {
                bindings: [{ mouseButton: toolsEnums.MouseBindings.Wheel }],
            });

            // 화살표 주석
            tg.setToolPassive(ArrowAnnotateTool.toolName);

            // 화살표 주석 텍스트 입력 콜백
            tg.setToolConfiguration(ArrowAnnotateTool.toolName, {
                getTextCallback: () => prompt('주석 입력:') ?? '',
                changeTextCallback: () => prompt('주석 수정:') ?? '',
            })

            setIsReady(true);
        })();

        return () => {
            mounted = false;
            try {
                engineRef.current?.destroy();
            } catch (err) {
                console.warn('렌더링 엔진 정리 중 오류 발생:', err);
            }
            engineRef.current = null;
        };
    }, []);

    return {
        containerRef,
        engineRef,
        toolGroupId: TOOLGROUP_ID,
        //viewportId: VIEWPORT_ID,
        renderingEngineId: RENDERING_ENGINE_ID,
        isReady,
     };
}
