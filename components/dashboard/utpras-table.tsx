"use client";

import { Eye, ArrowUpDown, ArrowUp, ArrowDown, FileSearch, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import type { UtprasRecord } from "@/lib/utpras-columns";
import { field } from "@/lib/utpras";

export type SortKey = "province" | "institution_name" | "course_program" | "duration";
export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface Column {
  key: SortKey | null;
  label: string;
  field: string;
  className?: string;
}

// The exact eight columns requested for the registry table.
const COLS: Column[] = [
  { key: "province", label: "Province", field: "province" },
  { key: "institution_name", label: "Name of Institution", field: "institution_name", className: "min-w-[14rem]" },
  { key: "course_program", label: "Qualification", field: "course_program", className: "min-w-[14rem]" },
  { key: "duration", label: "Duration", field: "duration" },
  { key: null, label: "Address", field: "address", className: "min-w-[14rem]" },
  { key: null, label: "Head of Institution", field: "institution_head" },
  { key: null, label: "Contact Number", field: "tel_no" },
  { key: null, label: "Email", field: "email" },
];

interface UtprasTableProps {
  rows: UtprasRecord[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onView: (record: UtprasRecord) => void;
}

export function UtprasTable({ rows, sort, onSort, onView }: UtprasTableProps) {
  if (rows.length === 0) {
    return (
      <Card className="items-center justify-center gap-3 py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileSearch className="size-6" />
        </div>
        <div>
          <p className="font-medium text-foreground">No programs match your filters</p>
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
                    key={c.field}
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
                          sort.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
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
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onView(row)}
                className="group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
              >
                <TableCell className="text-muted-foreground">{field(row, "province") || "—"}</TableCell>
                <TableCell className="max-w-[22rem] whitespace-normal font-medium text-foreground">
                  {field(row, "institution_name") || "—"}
                </TableCell>
                <TableCell className="max-w-[20rem] whitespace-normal">{field(row, "course_program") || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{field(row, "duration") || "—"}</TableCell>
                <TableCell className="max-w-[22rem] whitespace-normal text-muted-foreground">
                  {field(row, "address") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{field(row, "institution_head") || "—"}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-[0.8rem] text-muted-foreground tnum">
                  {field(row, "tel_no") || "—"}
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-muted-foreground">{field(row, "email") || "—"}</TableCell>
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
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            onClick={() => onView(row)}
            className="w-full rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{field(row, "institution_name") || "—"}</p>
                <p className="text-xs text-muted-foreground">{field(row, "province")}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-foreground">{field(row, "course_program") || "—"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-muted-foreground">Duration</span>
                <span className="text-foreground">{field(row, "duration") || "—"}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Head of Institution</span>
                <span className="text-foreground">{field(row, "institution_head") || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-muted-foreground">Address</span>
                <span className="text-foreground">{field(row, "address") || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="font-mono text-foreground tnum">{field(row, "tel_no") || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 truncate">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-foreground">{field(row, "email") || "—"}</span>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Eye className="size-3.5" /> View full record
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
