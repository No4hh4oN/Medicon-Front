import { API_ROOT } from "@/config/api";

export type Studies = {
    studyKey: number | string,
    series: Array<{
        seriesKey: number,
        imageIds: string[],
    }>
}

// Api 호출
export async function fetchStudy(studyKey: string | number, apiRoot: string = API_ROOT): Promise<Studies> {
    const listUrl = `${apiRoot}/studies/${encodeURIComponent(studyKey)}`;
    const resp = await fetch(listUrl, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`Series list failed: ${resp.status} ${await resp.text()}`);

    return resp.json();
}
