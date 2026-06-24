"use client";

import * as React from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { StatCards } from "./stat-cards";
import { FiltersBar, type FilterState } from "./filters-bar";
import { RegistryTable, type SortKey, type SortState } from "./registry-table";
import { PaginationBar } from "./pagination-bar";
import { RecordDialog } from "./record-dialog";
import { ExportMenu, type ExportMenuItem } from "./export-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type NttcRecord } from "@/lib/columns";
import { field, parseDate, uniqueSorted, validityStatus, type RegistryStats } from "@/lib/nttc";
import { exportRegistryCsv, exportRegistryXlsx, prettyDate } from "@/lib/export";

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
  const [pageSize, setPageSize] = React.useState(15);
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

  // Both exports are filter-adaptive: they use `sorted`, the current
  // filtered + sorted record set.
  const handleExportCsv = React.useCallback(() => {
    try {
      exportRegistryCsv(sorted, `NTTC Registry as of - ${prettyDate()}.csv`);
      toast.success(`Exported ${sorted.length.toLocaleString()} records to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("CSV export failed. Please try again.");
    }
  }, [sorted]);

  const handleExportXlsx = React.useCallback(async () => {
    try {
      await exportRegistryXlsx(sorted, `NTTC Registry as of - ${prettyDate()}.xlsx`, {
        generatedAt: new Date().toLocaleString(),
        totalRecords: sorted.length,
      });
      toast.success(`Exported ${sorted.length.toLocaleString()} records to Excel`);
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed. Please try again.");
    }
  }, [sorted]);

  const exportItems = React.useMemo<ExportMenuItem[]>(
    () => [
      {
        key: "csv",
        label: "CSV (.csv)",
        description: "Raw data — same column layout as the database seed",
        icon: <FileText className="size-4" />,
        onSelect: handleExportCsv,
      },
      {
        key: "xlsx",
        label: "Excel workbook (.xlsx)",
        description: "Formatted, labeled columns with filters & freeze",
        icon: <FileSpreadsheet className="size-4" />,
        onSelect: handleExportXlsx,
      },
    ],
    [handleExportCsv, handleExportXlsx],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Certificate Registry</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search National TVET Trainer&rsquo;s Certificate holders across Region VII.
        </p>
      </div>

      <StatCards
        stats={stats}
        activeStatus={filters.status}
        onSelect={(status) =>
          updateFilters({ status: status !== "all" && filters.status === status ? "all" : status })
        }
      />

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
                {[15, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ExportMenu
            items={exportItems}
            label={`Export ${sorted.length.toLocaleString()} records`}
            disabled={sorted.length === 0}
          />
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
