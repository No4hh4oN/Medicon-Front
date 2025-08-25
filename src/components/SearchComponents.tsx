// src/components/PacsPlusSearchMinimal.tsx
import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  // fetcher prop은 API 로직을 컴포넌트 내부에 직접 구현하므로 더 이상 필요하지 않습니다.
  // fetcher?: (q: { pid?: string; pname?: string; modality?: string }) => Promise<ResultRow[]>;
}

// API 응답 데이터 구조에 대한 타입 정의
interface ApiStudy {
  studyKey: number;
  studyDate: string;
  studyTime: string;
  studyDesc: string | null;
  modality: string;
  bodyPart: string | null;
  patAge: string | null;
}

interface ApiPatientResponse {
  studyListDto: ApiStudy[];
  pid: string;
  pbirthdate: string | null;
  pname: string;
  psex: string;
}


/** 검색바(환자 아이디/이름) + 결과 테이블(헤더/본체)만 구현한 미니 컴포넌트 */
const PacsPlusSearchMinimal: React.FC<PacsPlusSearchMinimalProps> = ({
  initialRows = [],
  // fetcher,
}) => {
  // 환자 아이디 입력창 제거 및 검색 기준 드롭다운 추가
  const [searchType, setSearchType] = useState<"pname" | "pid" | "modality">("pname");
  // 환자 이름 입력창을 검색어 입력창으로 변경
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rows, setRows] = useState<ResultRow[]>(initialRows);
  const [isLoading, setIsLoading] = useState(false);

  const onSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setRows(initialRows);
      return;
    }

    setIsLoading(true);
    const baseUrl = "http://localhost:8080/api";
    let endpoint = "";

    if (searchType === "pid") {
      endpoint = `/patientID/${encodeURIComponent(query)}`;
    } else if (searchType === "pname") {
      endpoint = `/patientName/${encodeURIComponent(query)}`;
    } else if (searchType === "modality") {
      endpoint = `/modality/${encodeURIComponent(query)}`;
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }
      const apiData: ApiPatientResponse[] = await response.json();

      // API 응답(중첩 구조)을 테이블에 맞는 평평한 데이터로 변환합니다.
      const newRows: ResultRow[] = apiData.flatMap(patient =>
        patient.studyListDto.map(study => {
          const { studyDate, studyTime } = study;
          const year = studyDate.substring(0, 4);
          const month = studyDate.substring(4, 6);
          const day = studyDate.substring(6, 8);
          const hours = studyTime.substring(0, 2);
          const minutes = studyTime.substring(2, 4);
          const seconds = studyTime.substring(4, 6);
          const formattedWhen = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

          return {
            pid: patient.pid,
            pname: patient.pname,
            modality: study.modality,
            desc: study.studyDesc,
            when: formattedWhen,
            // --- 아래는 API에 없는 데이터이므로 임시 값을 사용합니다 ---
            status: '완료',
            series: 1, // API 응답에 시리즈 수가 없으므로 임시값
            images: 1, // API 응답에 이미지 수가 없으므로 임시값
            verify: false, // API 응답에 verify 여부가 없으므로 임시값
          };
        })
      );
      setRows(newRows ?? []);
    } catch (e) {
      console.error("[PacsPlusSearchMinimal] API 요청 오류:", e);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchType, searchQuery, initialRows]); // 의존성 배열 수정

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="bg-neutral-900 text-neutral-100 p-4 sm:p-6 md:p-8 h-screen flex flex-col">
      <Card className="bg-neutral-900/60 border-neutral-800 shadow-none flex-1 flex flex-col">

        <CardContent className="p-6 flex-1 flex flex-col gap-4">
          {/* ▶︎ 상단 검색바 (요청하신 두 입력만) */}
          <div className="flex flex-col md:flex-row items-center gap-3">            {/* 검색 기준 드롭다운 */}
            <Select value={searchType} onValueChange={(value: "pname" | "pid" | "modality") => setSearchType(value)}>
              <SelectTrigger className="h-10 rounded-full bg-neutral-800 border-neutral-700 text-neutral-300 w-full md:w-1/4">
                <SelectValue placeholder="검색 기준" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-300">
                <SelectItem value="pname">환자 이름</SelectItem>
                <SelectItem value="pid">환자 아이디</SelectItem>
                <SelectItem value="modality">검사장비</SelectItem>
              </SelectContent>
            </Select>

            {/* 검색어 입력창 */}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="검색어를 입력하세요"
              className="h-10 rounded-full bg-neutral-800 border-neutral-700 placeholder:text-neutral-500 w-full md:w-1/4"
            />
            <Button
              onClick={onSearch}
              disabled={isLoading}
              className="h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white px-8 w-full md:w-auto disabled:bg-sky-800 disabled:cursor-not-allowed"
            >
              {isLoading ? "검색 중..." : "검색"}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : rows.length > 0 ? (
                  rows.map((r) => (
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
                  ))
                ) : (
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
