"use client";

import { Eye, ArrowUpDown, ArrowUp, ArrowDown, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import type { PtcacsRecord } from "@/lib/ptcacs-columns";
import { field, formatDate, validityStatus, type ValidityStatus } from "@/lib/ptcacs";
import { cn } from "@/lib/utils";

export type SortKey =
  | "province"
  | "name"
  | "qualification_title"
  | "valid_until";

export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface Column {
  key: SortKey | null;
  label: string;
  className?: string;
}

const COLS: Column[] = [
  { key: "province", label: "Province" },
  { key: "name", label: "Name", className: "min-w-[12rem]" },
  { key: "qualification_title", label: "Qualification Title", className: "min-w-[14rem]" },
  { key: null, label: "Sector" },
  { key: null, label: "Company Name", className: "min-w-[12rem]" },
  { key: null, label: "Designation" },
  { key: "valid_until", label: "Valid Until" },
];

const DOT: Record<ValidityStatus, string> = {
  valid: "bg-emerald-500",
  expiring: "bg-amber-500",
  expired: "bg-rose-500",
  unknown: "bg-muted-foreground/40",
};

interface AssessorsTableProps {
  rows: PtcacsRecord[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onView: (record: PtcacsRecord) => void;
}

export function AssessorsTable({ rows, sort, onSort, onView }: AssessorsTableProps) {
  if (rows.length === 0) {
    return (
      <Card className="items-center justify-center gap-3 py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileSearch className="size-6" />
        </div>
        <div>
          <p className="font-medium text-foreground">No assessors match your filters</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or resetting the filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <Card className="hidden overflow-x-auto py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {COLS.map((c) => {
                const sorted = sort.key === c.key;
                return (
                  <TableHead
                    key={c.label}
                    scope="col"
                    aria-sort={
                      c.key ? (sorted ? (sort.dir === "asc" ? "ascending" : "descending") : "none") : undefined
                    }
                    className={c.className}
                  >
                    {c.key ? (
                      <button
                        onClick={() => onSort(c.key as SortKey)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        {c.label}
                        {sorted ? (
                          sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.label
                    )}
                  </TableHead>
                );
              })}
              <TableHead scope="col" className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <tbody className="[&_tr:last-child]:border-0">
            {rows.map((row) => {
              const status = validityStatus(row);
              return (
                <tr
                  key={row.id}
                  onClick={() => onView(row)}
                  className="group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
                >
                  <TableCell className="text-muted-foreground">{field(row, "province") || "—"}</TableCell>
                  <TableCell className="max-w-[18rem] whitespace-normal font-medium text-foreground">
                    {field(row, "name") || "—"}
                  </TableCell>
                  <TableCell className="max-w-[20rem] whitespace-normal">{field(row, "qualification_title") || "—"}</TableCell>
                  <TableCell className="max-w-[14rem] whitespace-normal text-muted-foreground">
                    {field(row, "sector") || "—"}
                  </TableCell>
                  <TableCell className="max-w-[18rem] whitespace-normal text-muted-foreground">
                    {field(row, "company_name") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{field(row, "present_designation") || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2 shrink-0 rounded-full", DOT[status])} />
                      <span className="text-muted-foreground">{formatDate(field(row, "valid_until"))}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(row);
                      }}
                      className="opacity-70 transition-opacity group-hover:opacity-100"
                    >
                      <Eye className="size-3.5" /> View
                    </Button>
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const status = validityStatus(row);
          return (
            <button
              key={row.id}
              onClick={() => onView(row)}
              className="w-full rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{field(row, "name") || "—"}</p>
                  <p className="text-xs text-muted-foreground">{field(row, "province")}</p>
                </div>
                <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", DOT[status])} />
              </div>
              <p className="mt-2 text-sm text-foreground">{field(row, "qualification_title") || "—"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-muted-foreground">Sector</span>
                  <span className="text-foreground">{field(row, "sector") || "—"}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Valid Until</span>
                  <span className="text-foreground">{formatDate(field(row, "valid_until"))}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-muted-foreground">Company</span>
                  <span className="text-foreground">{field(row, "company_name") || "—"}</span>
                </div>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Eye className="size-3.5" /> View full record
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
