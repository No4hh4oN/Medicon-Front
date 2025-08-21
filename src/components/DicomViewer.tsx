import { useEffect, useRef, useState } from 'react';
import {
    RenderingEngine,
    Enums,
    init as coreInit,
    type Types,
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
} from '@cornerstonejs/tools';

const RENDERING_ENGINE_ID = 'cs3d-re';
const VIEWPORT_ID = 'cs3d-vp';
const TOOLGROUP_ID = 'cs3d-tg';

export default function DicomViewer() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<RenderingEngine | null>(null);

    // 백엔드 시리즈 로딩용 입력값
    const [apiRoot, setApiRoot] = useState('http://localhost:8080/api/v1/dicom');
    const [studyKey, setStudyKey] = useState('21');
    const [seriesKey, setSeriesKey] = useState('1');

    // 1) Cornerstone 초기화 (앱 생애주기 1회)
    useEffect(() => {
        let mounted = true;
        (async () => {
            await coreInit();
            await dicomImageLoaderInit({ maxWebWorkers: 2 });
            await toolsInit();

            if (!mounted || !containerRef.current) return;

            // 렌더링 엔진 & 뷰포트
            const re = new RenderingEngine(RENDERING_ENGINE_ID);
            engineRef.current = re;

            re.enableElement({
                viewportId: VIEWPORT_ID,
                element: containerRef.current,
                type: Enums.ViewportType.STACK,
            });

            // 툴 등록
            addTool(PanTool);
            addTool(ZoomTool);
            addTool(StackScrollTool);
            addTool(WindowLevelTool);

            // 툴 그룹 생성/연결
            let tg = ToolGroupManager.getToolGroup(TOOLGROUP_ID);
            if (!tg) {
                tg = ToolGroupManager.createToolGroup(TOOLGROUP_ID)!;
            }
            tg.addTool(PanTool.toolName);
            tg.addTool(ZoomTool.toolName);
            tg.addTool(StackScrollTool.toolName);
            tg.addTool(WindowLevelTool.toolName);
            tg.addViewport(VIEWPORT_ID, RENDERING_ENGINE_ID);

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
            tg.setToolActive(StackScrollTool.toolName);
        })();

        return () => {
            mounted = false;
            try {
                engineRef.current?.destroy();
                engineRef.current = null;
            } catch {}
        };
    }, []);
/*
    // 2) 백엔드에서 시리즈 전체 로딩 → wadouri imageIds로 스택 세팅
    const loadSeries = async () => {
        if (!engineRef.current) return;

        // 이미지 키 목록 조회
        const listUrl = `${apiRoot}/studies/${encodeURIComponent(studyKey)}/series/${encodeURIComponent(seriesKey)}/images`;
        const resp = await fetch(listUrl, {
            headers: { Accept: 'application/json' },
            method: 'GET',
            mode: 'cors',
        });
        if (!resp.ok) {
            console.error('이미지 키 목록 조회 실패:', resp.status, await resp.text());
            alert('시리즈 이미지 목록 요청 실패');
            return;
        }

        const keys: number[] = await resp.json();

        // 키 정렬(필요 시 InstanceNumber 기준으로 교체)
        keys.sort((a, b) => a - b);

        // wadouri imageIds 생성
        const imageIds = keys.map(
            (k) =>
                `wadouri:${apiRoot}/studies/${encodeURIComponent(studyKey)}` +
                `/series/${encodeURIComponent(seriesKey)}/images/${encodeURIComponent(String(k))}`
        );

        if (imageIds.length === 0) {
            alert('시리즈에 이미지가 없습니다.');
            return;
        }

        const re = engineRef.current;
        const vp = re.getViewport(VIEWPORT_ID) as Types.IStackViewport;
        await vp.setStack(imageIds, 0);
        vp.render();
    };*/

    // 2) 단일 이미지 로딩 → wadouri imageId 세팅
    const loadOneImage = async () => {
    if (!engineRef.current) return;

    // 특정 이미지 하나만 URL 지정
    const imageId = `wadouri:${apiRoot}/studies/${encodeURIComponent(studyKey)}` +
                    `/series/${encodeURIComponent(seriesKey)}/images/2`;

    const re = engineRef.current;
    const vp = re.getViewport(VIEWPORT_ID) as Types.IStackViewport;

    // 배열에 한 장만 넣어서 스택 세팅
    await vp.setStack([imageId], 0);
    vp.render();
    };

    return (
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
            {/* 백엔드 입력/로딩 UI */}
            <div style={{ padding: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    style={{ flex: '1 1 360px' }}
                    value={apiRoot}
                    onChange={(e) => setApiRoot(e.target.value)}
                    placeholder="API Root"
                />
                <input
                    style={{ width: 160 }}
                    value={studyKey}
                    onChange={(e) => setStudyKey(e.target.value)}
                    placeholder="studyKey"
                />
                <input
                    style={{ width: 160 }}
                    value={seriesKey}
                    onChange={(e) => setSeriesKey(e.target.value)}
                    placeholder="seriesKey"
                />
                <button onClick={loadOneImage}>불러오기</button>
                <span style={{ opacity: 0.7 }}>좌 : 윈도우레벨 / ctrl+좌 : 팬 / 우: 줌 / 휠 : 스택 스크롤
        </span>
            </div>

            {/* 뷰포트 */}
            <div
                ref={containerRef}
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '100%', height: '100%', background: '#111' }}
            />
        </div>
    );
}
