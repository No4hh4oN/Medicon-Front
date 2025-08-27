import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MetaData from './MetaData';
import useDicomEngine from '../../hooks/useDicomEngine';
import useSeriesStack from '../../hooks/useSeriesStack';
import { fetchStudy } from '../../services/dicomApi';
import { getOverlayHost, rebuildGridAndBindTools } from '../../layouts/grid';
import Toolbar from './Toolbar';

type Layout = {
    rows: number,
    cols: number
}

type Props = {
    studyKey: string;
}

const RENDERING_ENGINE_ID = 'rendering-engine';
const TOOLGROUP_ID = 'toolgroup';

export default function DicomViewer({ studyKey }: Props) {
    const { containerRef, engineRef, renderingEngineId, toolGroupId } = useDicomEngine();
    const { setStackToViewport } = useSeriesStack(engineRef);

    // 시리즈 로딩용 입력값
    //const [studyKey, setStudyKey] = useState('21');
    //const [startSeriesKey, setStartSeriesKey] = useState('1');
    const startSeriesKey = '1';

    const [layout, setLayout] = useState<Layout>({ rows: 1, cols: 1 })

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('Ready');

    // 뷰포트별 첫 imageId 저장
    const [firstImgByVp, setFirstImgByVp] = useState<Record<string, string>>({});

    const [viewportId, setViewportId] = useState<string[]>([]);
    const [activeViewportId, setActiveViewportId] = useState<string | null>(null);

    // 레이아웃 적용(언제든 호출)
    const applyLayout = (rows: number, cols: number) => {
        if (!engineRef.current || !containerRef.current) return;
        setLayout({ rows, cols });
        rebuildGridAndBindTools(
            engineRef.current,
            containerRef.current,
            { rows, cols },
            toolGroupId,
            renderingEngineId,
        );

        setFirstImgByVp({}); // 레이아웃 바뀌면 이전 오버레이 매핑 초기화
    };

    // 시작 시리즈 포함 현재 레이아웃 수만큼 채우기
    const loadFromStart = async () => {
        if (!engineRef.current || !containerRef.current) return;
        setLoading(true);
        setStatus('검사 로딩 중…');

        try {
            const study = await fetchStudy(studyKey);
            const list = Array.isArray(study.series) ? study.series : [];
            if (!list.length) { setStatus('시리즈 없음'); return; }

            // 정렬 + 시작 인덱스
            const sorted = [...list].sort((a, b) => (a.seriesKey ?? 0) - (b.seriesKey ?? 0));
            const startNum = Number(String(startSeriesKey).trim());
            let startIdx = sorted.findIndex(s => s.seriesKey === startNum);
            if (Number.isNaN(startNum) || startIdx < 0) startIdx = 0;

            // 잔상 방지: 현재 레이아웃으로 재빌드
            const vpIds = rebuildGridAndBindTools(
                engineRef.current,
                containerRef.current,
                layout,
                toolGroupId,
                renderingEngineId
            );

            setViewportId(vpIds);
            if (!activeViewportId && vpIds.length) setActiveViewportId(vpIds[0]);

            // 필요한 만큼만 로드
            const need = Math.min(layout.rows * layout.cols, vpIds.length, sorted.length - startIdx);

            // 새 로드 시작 전 매핑 초기화
            const nextMap: Record<string, string> = {};

            for (let i = 0; i < need; i++) {
                const vpId = vpIds[i];
                const imageIds = sorted[startIdx + i].imageIds;
                await setStackToViewport(imageIds, vpIds[i]);
                nextMap[vpId] = imageIds[0];
            }

            setFirstImgByVp(nextMap);
            setStatus(`완료: ${sorted.slice(startIdx, startIdx + need).map(s => s.seriesKey).join(', ')}`);
        } catch (e: any) {
            console.error(e);
            setStatus(`오류: ${e?.message ?? 'load failed'}`);
            alert('시리즈 로드 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFromStart();
    }, [studyKey, layout.rows, layout.cols, startSeriesKey]);



    return (
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
            {/* 백엔드 입력/로딩 UI */}
            <div style={{ padding: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* 
                <input
                    style={{ width: 160 }}
                    value={startSeriesKey}
                    onChange={(e) => setStartSeriesKey(e.target.value)}
                    placeholder="seriesKey"
                />*/}
                <select
                    value={`${layout.rows}x${layout.cols}`}
                    onChange={(e) => {
                        const [r, c] = e.target.value.split('x').map(Number);
                        applyLayout(r, c);
                    }}
                >
                    <option value={"1x1"}>1x1</option>
                    <option value={"2x2"}>2x2</option>
                    <option value={"3x3"}>3x3</option>
                </select>
                <button onClick={() => loadFromStart()}
                    disabled={loading || String(startSeriesKey).trim() === ''}>불러오기</button>
                <span style={{ opacity: 0.7 }}>좌 : 윈도우레벨 / ctrl+좌 : 팬 / 우: 줌 / 휠 : 스택 스크롤</span>
                <Toolbar
                    toolGroupId={toolGroupId}
                    renderingEngineId={renderingEngineId}
                    viewportId={activeViewportId ?? viewportId[0]}
                    studyKey={studyKey}
                    seriesKey={startSeriesKey}
                />
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
                    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                    gap: '2px',
                }}
            />

            {/* 각 뷰포트 메타데이터 렌더 */}
            {containerRef.current &&
                Object.entries(firstImgByVp).map(([vpId, imgId]) => {
                    const host = getOverlayHost(containerRef.current!, vpId);
                    return host
                        ? createPortal(<MetaData firstImageId={imgId} />, host, `meta-${vpId}`)
                        : null;
                })
            }
        </div>
    );
}
