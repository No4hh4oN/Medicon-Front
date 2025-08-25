// src/components/PacsPlusSearchMinimal.tsx
import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


/** 결과 행 타입 */
export type ResultRow = {
  /** 환자 아이디 */
  pid: string;
  /** 환자 이름 */
  pname: string;
  /** 검사장비(모달리티) */
  modality: string;
  /** 검사설명 */
  desc: string | null;
  /** 검사일시 (표시용 문자열) */
  when: string;
  /** 판독상태 */
  status: "대기" | "진행" | "완료";
  /** 시리즈 수 */
  series: number;
  /** 이미지 수 */
  images: number;
  /** Verify 여부 */
  verify: boolean;
};

export interface PacsPlusSearchMinimalProps {
  /** 초기 렌더 때 보여줄 행들 (없으면 빈 테이블) */
  initialRows?: ResultRow[];
  /**
   * 검색 실행 함수(선택): 주입하면 이 함수로 API 조회
   * 반환값으로 테이블 행을 돌려주면 setRows로 반영됨.
   */
  fetcher?: (q: { pid: string; pname: string }) => Promise<ResultRow[]>;
}

/** 검색바(환자 아이디/이름) + 결과 테이블(헤더/본체)만 구현한 미니 컴포넌트 */
const PacsPlusSearchMinimal: React.FC<PacsPlusSearchMinimalProps> = ({
  initialRows = [],
  fetcher,
}) => {
  const [patientId, setPatientId] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [rows, setRows] = useState<ResultRow[]>(initialRows);

  const onSearch = useCallback(async () => {
    if (fetcher) {
      try {
        const data = await fetcher({ pid: patientId, pname: patientName });
        setRows(data ?? []);
      } catch (e) {
        console.error("[PacsPlusSearchMinimal] fetcher error:", e);
        setRows([]);
      }
      return;
    }
    // fetcher가 없으면 간단 필터 데모 (로컬 initialRows 기준)
    const id = patientId.trim().toLowerCase();
    const name = patientName.trim().toLowerCase();
    setRows(
      initialRows.filter(
        (r) =>
          (!id || r.pid.toLowerCase().includes(id)) &&
          (!name || r.pname.toLowerCase().includes(name))
      )
    );
  }, [fetcher, patientId, patientName, initialRows]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="bg-neutral-900 text-neutral-100 p-4 sm:p-6 md:p-8 h-screen flex flex-col">
      <Card className="bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">

        <CardContent className="p-6 flex-1 flex flex-col gap-4">
          {/* ▶︎ 상단 검색바 (요청하신 두 입력만) */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="환자 아이디"
              className="h-10 rounded-full bg-neutral-800 border-neutral-700 placeholder:text-neutral-500 w-full md:w-1/4"
            />
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="환자 이름"
              className="h-10 rounded-full bg-neutral-800 border-neutral-700 placeholder:text-neutral-500 w-full md:w-1/4"
            />
            <Button
              onClick={onSearch}
              className="h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white px-8 w-full md:w-auto"
            >
              검색
            </Button>
          </div>

          {/* ▶︎ 결과 테이블 (헤더 포함) */}
          <div className="relative flex-1 overflow-y-auto rounded-xl border border-neutral-800">
            <Table>
              <TableHeader className="bg-neutral-900 sticky top-0 z-10">
                <TableRow className="hover:bg-neutral-900">
                  <TableHead>환자 아이디</TableHead>
                  <TableHead>환자 이름</TableHead>
                  <TableHead>검사장비</TableHead>
                  <TableHead>검사설명</TableHead>
                  <TableHead>검사일시</TableHead>
                  <TableHead>판독상태</TableHead>
                  <TableHead className="text-right">시리즈</TableHead>
                  <TableHead className="text-right">이미지</TableHead>
                  <TableHead className="text-center">Verify</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.pid}-${r.when}`} className="hover:bg-neutral-900/40">
                    <TableCell className="font-medium">{r.pid}</TableCell>
                    <TableCell>{r.pname}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                        {r.modality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-neutral-300">{r.desc ?? "-"}</TableCell>
                    <TableCell className="text-neutral-400">{r.when}</TableCell>
                    <TableCell>
                      {r.status === "완료" ? (
                        <span className="text-emerald-400">완료</span>
                      ) : r.status === "진행" ? (
                        <span className="text-sky-400">진행</span>
                      ) : (
                        <span className="text-yellow-400">대기</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.series}</TableCell>
                    <TableCell className="text-right">{r.images}</TableCell>
                    <TableCell className="text-center">{r.verify ? "Y" : "N"}</TableCell>
                  </TableRow>
                ))}

                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PacsPlusSearchMinimal;
