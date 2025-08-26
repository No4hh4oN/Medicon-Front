import * as React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ResultRow } from "./types";

interface StudyTableProps {
  rows: ResultRow[];
  isLoading: boolean;
  onRowClick: (studyKey: number) => void;
}

export const StudyTable: React.FC<StudyTableProps> = ({ rows, isLoading, onRowClick }) => {
  return (
    <div className="relative rounded-xl border border-neutral-800">
      <Table>
        <TableHeader className="bg-neutral-900 sticky top-0 z-10">
          <TableRow className="hover:bg-neutral-900">
            <TableHead className="text-center">환자 아이디</TableHead>
            <TableHead className="text-center">환자 이름</TableHead>
            <TableHead className="text-center">검사장비</TableHead>
            <TableHead className="text-center">검사설명</TableHead>
            <TableHead className="text-center">검사일시</TableHead>
            <TableHead className="text-center">성별</TableHead>
            <TableHead className="text-center">검사부위</TableHead>
            <TableHead className="text-center">환자 나이</TableHead>
            <TableHead className="text-center">검사 번호</TableHead>
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
              <TableRow
                key={`${r.pid}-${r.when}-${r.verify}`}
                className="hover:bg-neutral-900/40 cursor-pointer"
                onClick={() => onRowClick(r.verify)}
              >
                <TableCell className="font-medium text-center">{r.pid}</TableCell>
                <TableCell className="text-center">{r.pname}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                    {r.modality}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-300 text-center">{r.desc ?? "-"}</TableCell>
                <TableCell className="text-neutral-400 text-center">{r.when}</TableCell>
                <TableCell className="text-center">{r.status}</TableCell>
                <TableCell className="text-center">{r.series ?? "-"}</TableCell>
                <TableCell className="text-center">{r.images ?? "-"}</TableCell>
                <TableCell className="text-center">{r.verify}</TableCell>
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
  );
};
