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
import MetaData from './MetaData';

type Layout = {
    rows: number,
    cols: number
}

type Studies = {
    studyKey: number | string,
    series: Array<{
        seriesKey: number,
        imageIds:string[],
    }>
}

const RENDERING_ENGINE_ID = 'cs3d-re';
const VIEWPORT_ID = 'cs3d-vp';
const TOOLGROUP_ID = 'cs3d-tg';

export default function DicomViewer() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<RenderingEngine | null>(null);

    // 백엔드 시리즈 로딩용 입력값
    const [apiRoot, setApiRoot] = useState('http://localhost:8080/api/v1/dicom');
    const [studyKey, setStudyKey] = useState('21');
    const [startSeriesKey, setStartSeriesKey] = useState('1');

    const [currentImageIds, setCurrentImageIds] = useState<string[] | null>(null);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('Ready');

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

            const viewportIds = enableViewportGrid(re, containerRef.current, { rows: 2, cols: 2 });
/*
            re.enableElement({
                viewportId: VIEWPORT_ID,
                element: containerRef.current,
                type: Enums.ViewportType.STACK,
            }); */

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

            for (const vid of viewportIds) tg.addViewport(vid, RENDERING_ENGINE_ID);

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

            try {
                await loadFourFrom(startSeriesKey);
            } catch (err) {
                console.warn('초기 시리즈 로드 실패', err);
            }
        })();

        return () => {
            mounted = false;
            try {
                engineRef.current?.destroy();
                engineRef.current = null;
            } catch (err) {
                console.warn('렌더링 엔진 정리 중 오류 발생:', err);
            }
        };
    }, []);

    
 const loadFourFrom = async (startKey: string) => {
  if (!engineRef.current) return;

  setLoading(true);
  setStatus('시리즈 목록 불러오는 중…');

  try {
    const listUrl = `${apiRoot}/studies/${encodeURIComponent(studyKey)}`;
    const resp = await fetch(listUrl, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`Series list failed: ${resp.status} ${await resp.text()}`);
    
    const study: Studies = await resp.json();
    const list = Array.isArray(study.series) ? study.series : [];
    if (!list.length) {
        setStatus('시리즈 없음');
        return;
    }

    // 3) 정렬
    const sorted = [...list].sort((a, b) => (a.seriesKey ?? 0) - (b.seriesKey ?? 0));

    // 4) 시작 시리즈 확인 (없으면 첫 항목으로 대체)
    const start = String(startKey ?? '').trim();
    let startIdx = sorted.findIndex(s => s && String(s.seriesKey) === start);
    if (start === '' || startIdx < 0) {
      console.warn(`startSeriesKey(${startKey})가 유효하지 않아 첫 시리즈부터 로드합니다.`);
      startIdx = 0;
    }

    // 5) 시작 포함 최대 4개
    const pick = sorted.slice(startIdx, startIdx + 4);
    setStatus(`로드 중: ${pick.map(p => p.seriesKey).join(', ')}`);

    // 6) 각 뷰포트에 로드 (빈 키 방지)
    const vpIds = rebuildGridAndBindTools(engineRef.current, containerRef.current!, TOOLGROUP_ID);

    const count = Math.min(pick.length, vpIds.length);
    for (let i = 0; i < count; i++) {
      const target = pick[i];
      if (!target?.seriesKey) continue;        // ✅ 최종 가드
      await loadSeriesIntoViewport(pick[i].imageIds, vpIds[i]);
      if (i === 0) setCurrentImageIds(pick[i].imageIds);
    }

    setStatus(`완료: ${pick.map(p => p.seriesKey).join(', ')}`);
  } catch (e: any) {
    console.error(e);
    setStatus(`오류: ${e?.message ?? 'load failed'}`);
    alert('시리즈 로드 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

const loadSeriesIntoViewport = async (imageIds: string[], viewportId: string) => {
    if (!engineRef.current) return;
    if (!Array.isArray(imageIds) || imageIds.length === 0) throw new Error('빈 imageIds');

    const re = engineRef.current;
    const vp = re.getViewport(viewportId) as Types.IStackViewport;
    await vp.setStack(imageIds, 0);
    vp.render();
  };


/*

    // 2) 백엔드에서 시리즈 전체 로딩 → wadouri imageIds로 스택 세팅
    const loadSeriesIntoViewport = async (studyKey: string, seriesKey: string | number, viewportId: string) => {
        if (!engineRef.current) return;

        const sk = String(seriesKey ?? '').trim();
        if (!sk) throw new Error('seriesKey가 비어 있습니다.');
        // 서버가 Long을 기대하면 숫자 체크도 권장
        if (Number.isNaN(Number(sk))) throw new Error(`seriesKey가 숫자가 아닙니다: ${sk}`);


        // 이미지 키 목록 조회
        const listUrl = `${apiRoot}/studies/${encodeURIComponent(studyKey)}/series/${encodeURIComponent(seriesKey)}/images`;
        const resp = await fetch(listUrl, {
            headers: { Accept: 'application/json' },
        });
        if (!resp.ok) {
            console.error('이미지 키 목록 조회 실패:', resp.status, await resp.text());
            alert('시리즈 이미지 목록 요청 실패');
            return;
        }

        const keys: number[] = await resp.json();
        if (!keys?.length) throw new Error(`빈 시리즈: ${seriesKey}`);

        // 키 정렬(필요 시 InstanceNumber 기준으로 교체)
        keys.sort((a, b) => a - b);

        // wadouri imageIds 생성
        const imageIds = keys.map(
            (k) =>
                `wadouri:${apiRoot}/studies/${encodeURIComponent(studyKey)}` +
                `/series/${encodeURIComponent(seriesKey)}/images/${encodeURIComponent(String(k))}`
        );

        if (imageIds.length === 0) {
            console.log('시리즈에 이미지가 없습니다.');
            return;
        }

        const re = engineRef.current;
        const vp = re.getViewport(VIEWPORT_ID) as Types.IStackViewport;
        await vp.setStack(imageIds, 0);
        vp.render();

        setCurrentImageIds(imageIds);
    };*/
/*
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
    */

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
                    value={startSeriesKey}
                    onChange={(e) => setStartSeriesKey(e.target.value)}
                    placeholder="seriesKey"
                />
                <button onClick={() => loadFourFrom(startSeriesKey)}
                    disabled={loading || String(startSeriesKey).trim() === ''}>불러오기</button>
                <span style={{ opacity: 0.7 }}>좌 : 윈도우레벨 / ctrl+좌 : 팬 / 우: 줌 / 휠 : 스택 스크롤
        </span>
            </div>

            {/* 뷰포트 */}
            <div
                ref={containerRef}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#111',
                    display: 'grid',
                    gridTemplateRows: '1fr 1fr',
                    gridTemplateColumns: '1fr 1fr',
                }}
            />
            <MetaData firstImageId={currentImageIds?.[0]}/>
        </div>
    );
}

function enableViewportGrid(
  re: RenderingEngine,
  gridRoot: HTMLDivElement,
  next: Layout
): string[] {
  gridRoot.innerHTML = '';
  const ids: string[] = [];
  const total = next.rows * next.cols;

  for (let i = 0; i < total; i++) {
    const cell = document.createElement('div');
    cell.style.position = 'relative';
    cell.style.width = '100%';
    cell.style.height = '100%';
    gridRoot.appendChild(cell);

    const canvasHost = document.createElement('div');
    canvasHost.style.position = 'absolute';
    canvasHost.style.inset = '0';
    canvasHost.style.outline = 'none';
    cell.appendChild(canvasHost);

    const viewportId = `vp-${i}`;
    re.enableElement({
      viewportId,
      element: canvasHost,
      type: Enums.ViewportType.STACK,
    });
    ids.push(viewportId);
  }
  return ids;
}

// 로드 시 그리드 재생성
function rebuildGridAndBindTools(
  re: RenderingEngine,
  gridRoot: HTMLDivElement,
  toolGroupId: string
): string[] {
  // 1) 기존 뷰포트 전부 disable
  for (const vp of re.getViewports()) {
    try { re.disableElement(vp.id); } catch (err){ console.log(err)}
  }

  // 2) 새 그리드 생성
  const vpIds = enableViewportGrid(re, gridRoot, { rows: 2, cols: 2 });

  // 3) ToolGroup에 새 뷰포트 연결
  const tg = ToolGroupManager.getToolGroup(toolGroupId)!;
  for (const vid of vpIds) tg.addViewport(vid, RENDERING_ENGINE_ID);

  return vpIds;
}