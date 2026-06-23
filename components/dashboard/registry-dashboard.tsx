"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { StatCards } from "./stat-cards";
import { FiltersBar, type FilterState } from "./filters-bar";
import { RegistryTable, type SortKey, type SortState } from "./registry-table";
import { PaginationBar } from "./pagination-bar";
import { RecordDialog } from "./record-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLUMNS, type NttcRecord } from "@/lib/columns";
import { field, parseDate, uniqueSorted, validityStatus, type RegistryStats } from "@/lib/nttc";

interface RegistryDashboardProps {
  records: NttcRecord[];
  stats: RegistryStats;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  province: "all",
  sector: "all",
  status: "all",
};

const DATE_KEYS: SortKey[] = ["AC", "AD"];
const SEARCH_LETTERS = ["C", "D", "E", "F", "B", "R", "Q", "AB", "AE", "S", "V"];

export function RegistryDashboard({ records, stats }: RegistryDashboardProps) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortState>({ key: "C", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<NttcRecord | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const provinces = React.useMemo(() => uniqueSorted(records, "B"), [records]);
  const sectors = React.useMemo(() => uniqueSorted(records, "Q"), [records]);

  const filtered = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.province !== "all" && field(r, "B") !== filters.province) return false;
      if (filters.sector !== "all" && field(r, "Q") !== filters.sector) return false;
      if (filters.status !== "all" && validityStatus(r) !== filters.status) return false;
      if (q) {
        const hay = SEARCH_LETTERS.map((l) => field(r, l)).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, filters]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const mult = dir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (DATE_KEYS.includes(key)) {
        const da = parseDate(field(a, key))?.getTime() ?? -Infinity;
        const db = parseDate(field(b, key))?.getTime() ?? -Infinity;
        return (da - db) * mult;
      }
      return field(a, key).localeCompare(field(b, key), "en", { numeric: true }) * mult;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = React.useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  React.useEffect(() => {
    setPage(1);
  }, [filters, sort, pageSize]);

  const updateFilters = React.useCallback((next: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const handleSort = React.useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }, []);

  const handleView = React.useCallback((record: NttcRecord) => {
    setSelected(record);
    setDialogOpen(true);
  }, []);

  const exportCsv = React.useCallback(() => {
    const header = COLUMNS.map((c) => `"${c.label}"`).join(",");
    const lines = sorted.map((r) =>
      COLUMNS.map((c) => `"${String((r[c.letter] as string | null) ?? "").replace(/"/g, '""')}"`).join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nttc-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [sorted]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Certificate Registry</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search National TVET Trainer&rsquo;s Certificate holders across Region VII.
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="space-y-4">
        <FiltersBar
          filters={filters}
          onChange={updateFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          provinces={provinces}
          sectors={sectors}
          total={records.length}
          filtered={sorted.length}
        />

        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Export {sorted.length.toLocaleString()} records
          </Button>
        </div>

        <RegistryTable
          rows={pageRows}
          sort={sort}
          onSort={handleSort}
          onView={handleView}
          pageKey={`${currentPage}-${sort.key}-${sort.dir}-${filters.search}-${filters.province}-${filters.sector}-${filters.status}`}
        />

        <PaginationBar page={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>

      <RecordDialog record={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
