"use client";

import { motion } from "framer-motion";
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { NttcRecord } from "@/lib/columns";
import { field, formatDate, validityStatus, STATUS_META, type ValidityStatus } from "@/lib/nttc";

export type SortKey = "B" | "C" | "D" | "R" | "AB" | "AE" | "AC" | "AD";
export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface Column {
  key: SortKey | null;
  label: string;
  letter: string;
  className?: string;
}

const COLS: Column[] = [
  { key: "B", label: "Province", letter: "B" },
  { key: "C", label: "Last Name", letter: "C" },
  { key: "D", label: "First Name", letter: "D" },
  { key: null, label: "Middle Name", letter: "E" },
  { key: null, label: "Ext.", letter: "F" },
  { key: "R", label: "Qualification", letter: "R", className: "min-w-[15rem]" },
  { key: "AB", label: "Certificate No.", letter: "AB" },
  { key: "AE", label: "Control No.", letter: "AE" },
  { key: "AC", label: "Date Issuance", letter: "AC" },
  { key: "AD", label: "Validity", letter: "AD" },
];

function StatusPill({ status }: { status: ValidityStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.tone as never}>{meta.label}</Badge>;
}

interface RegistryTableProps {
  rows: NttcRecord[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onView: (record: NttcRecord) => void;
  pageKey: string | number;
}

export function RegistryTable({ rows, sort, onSort, onView, pageKey }: RegistryTableProps) {
  if (rows.length === 0) {
    return (
      <Card className="items-center justify-center gap-3 py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileSearch className="size-6" />
        </div>
        <div>
          <p className="font-medium text-foreground">No records match your filters</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or resetting the filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {COLS.map((c) => {
                const sorted = sort.key === c.key;
                return (
                  <TableHead
                    key={c.letter}
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
          <motion.tbody key={pageKey} className="[&_tr:last-child]:border-0">
            {rows.map((row, i) => {
              const status = validityStatus(row);
              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.012, 0.3) }}
                  onClick={() => onView(row)}
                  className="group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
                >
                  <TableCell className="text-muted-foreground">{field(row, "B") || "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">{field(row, "C") || "—"}</TableCell>
                  <TableCell>{field(row, "D") || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{field(row, "E") || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{field(row, "F") || "—"}</TableCell>
                  <TableCell className="max-w-[20rem] whitespace-normal">{field(row, "R") || "—"}</TableCell>
                  <TableCell className="font-mono text-[0.8rem] text-muted-foreground tnum">
                    {field(row, "AB") || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[0.8rem] text-muted-foreground tnum">
                    {field(row, "AE") || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(field(row, "AC"))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground">{formatDate(field(row, "AD"))}</span>
                      <StatusPill status={status} />
                    </div>
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
                </motion.tr>
              );
            })}
          </motion.tbody>
        </Table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, i) => {
          const status = validityStatus(row);
          return (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
              onClick={() => onView(row)}
              className="w-full rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {field(row, "C")}, {field(row, "D")} {field(row, "E")}
                  </p>
                  <p className="text-xs text-muted-foreground">{field(row, "B")}</p>
                </div>
                <StatusPill status={status} />
              </div>
              <p className="mt-2 text-sm text-foreground">{field(row, "R") || "—"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-muted-foreground">Certificate No.</span>
                  <span className="font-mono text-foreground tnum">{field(row, "AB") || "—"}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Control No.</span>
                  <span className="font-mono text-foreground tnum">{field(row, "AE") || "—"}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Issued</span>
                  <span className="text-foreground">{formatDate(field(row, "AC"))}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Validity</span>
                  <span className="text-foreground">{formatDate(field(row, "AD"))}</span>
                </div>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Eye className="size-3.5" /> View full record
              </span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
