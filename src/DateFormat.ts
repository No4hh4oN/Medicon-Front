// src/utils/datetime.ts

// ISO 마이크로초 → 밀리초(3자리)로 절단 (JS Date는 ms까지만 안전)
function clampIsoFractionToMs(s: string): string {
  return s.replace(/(\.\d{3})\d+/, "$1");
}

// 공용 포맷: "YYYY-MM-DD HH:mm:ss"
export function fmtYMDHMS(d: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} `
       + `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// 문자열 → Date 관용 파서 (ISO/한국형/YY/MM/DD 지원)
export function parseFlexibleDate(input?: string | null): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // 1) ISO 류
  if (s.includes("T")) {
    const iso = clampIsoFractionToMs(s);
    const d = new Date(iso);
    return isNaN(d.valueOf()) ? null : d;
  }

  // 2) 하이픈 로컬형: 2025-08-27 16:57:10(.123)
  {
    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
    );
    if (m) {
      const [, y, M, D, h, mi, se] = m;
      const d = new Date(+y, +M - 1, +D, +h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  // 3) 슬래시 YY/MM/DD: 25/08/27 17:19:26(.123456)
  {
    const m = s.match(
      /^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
    );
    if (m) {
      const [, yy, mm, dd, h, mi, se] = m;
      const year = 2000 + +yy;
      const d = new Date(year, +mm - 1, +dd, +h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  // 4) 한국형: 2025. 8. 27. 오후 5:32:42
  {
    const m = s.match(
      /(\d{4})\. (\d{1,2})\. (\d{1,2})\. (오전|오후) (\d{1,2}):(\d{2}):(\d{2})/
    );
    if (m) {
      const [, y, M, D, ampm, hStr, mi, se] = m;
      let h = +hStr;
      if (ampm === "오후" && h !== 12) h += 12;
      if (ampm === "오전" && h === 12) h = 0;
      const d = new Date(+y, +M - 1, +D, h, +mi, +se);
      return isNaN(d.valueOf()) ? null : d;
    }
  }

  const d = new Date(s);
  return isNaN(d.valueOf()) ? null : d;
}

// 최종 통일 포맷: "YYYY-MM-DD HH:mm:ss"
export function normalizeToYMDHMS(raw?: string | null): string {
  const d = parseFlexibleDate(raw);
  return d ? fmtYMDHMS(d) : (raw ?? "-");
}
