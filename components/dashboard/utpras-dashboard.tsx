"use client";

import * as React from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { UtprasStatCards } from "./utpras-stat-cards";
import { FiltersBar, type FilterState } from "./filters-bar";
import { UtprasTable, type SortKey, type SortState } from "./utpras-table";
import { PaginationBar } from "./pagination-bar";
import { UtprasRecordDialog } from "./utpras-record-dialog";
import { ExportMenu, type ExportMenuItem } from "./export-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UtprasRecord } from "@/lib/utpras-columns";
import { field, uniqueSorted, validityStatus, type UtprasStats } from "@/lib/utpras";
import { exportUtprasCsv, exportUtprasXlsx } from "@/lib/utpras-export";
import { prettyDate } from "@/lib/export";

interface UtprasDashboardProps {
  records: UtprasRecord[];
  stats: UtprasStats;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  province: "all",
  sector: "all",
  status: "all",
  institution: "all",
};

// Columns scanned by the free-text search box.
const SEARCH_FIELDS = [
  "institution_name", "course_program", "address", "institution_head",
  "tel_no", "email", "program_reg_no", "municipality", "province", "sector",
  "unique_institution_id", "formerly_name",
];

export function UtprasDashboard({ records, stats }: UtprasDashboardProps) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortState>({ key: "institution_name", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [selected, setSelected] = React.useState<UtprasRecord | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const provinces = React.useMemo(() => uniqueSorted(records, "province"), [records]);
  const sectors = React.useMemo(() => uniqueSorted(records, "sector"), [records]);
  // Institutions narrow to the chosen province so the dropdown stays relevant.
  const institutions = React.useMemo(() => {
    const scope =
      filters.province === "all"
        ? records
        : records.filter((r) => field(r, "province") === filters.province);
    return uniqueSorted(scope, "institution_name");
  }, [records, filters.province]);

  const filtered = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.province !== "all" && field(r, "province") !== filters.province) return false;
      if (
        filters.institution &&
        filters.institution !== "all" &&
        field(r, "institution_name") !== filters.institution
      )
        return false;
      if (filters.sector !== "all" && field(r, "sector") !== filters.sector) return false;
      if (filters.status !== "all" && validityStatus(r) !== filters.status) return false;
      if (q) {
        const hay = SEARCH_FIELDS.map((f) => field(r, f)).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, filters]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const mult = dir === "asc" ? 1 : -1;
    arr.sort(
      (a, b) => field(a, key).localeCompare(field(b, key), "en", { numeric: true }) * mult,
    );
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
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      // Changing province re-scopes the institution list, so clear any stale
      // institution selection (unless the caller set one explicitly).
      if (
        next.province !== undefined &&
        next.province !== prev.province &&
        next.institution === undefined
      ) {
        merged.institution = "all";
      }
      return merged;
    });
  }, []);

  const handleSort = React.useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }, []);

  const handleView = React.useCallback((record: UtprasRecord) => {
    setSelected(record);
    setDialogOpen(true);
  }, []);

  const handleExportCsv = React.useCallback(() => {
    try {
      exportUtprasCsv(sorted, `UTPRAS Registry as of - ${prettyDate()}.csv`);
      toast.success(`Exported ${sorted.length.toLocaleString()} programs to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("CSV export failed. Please try again.");
    }
  }, [sorted]);

  const handleExportXlsx = React.useCallback(async () => {
    try {
      await exportUtprasXlsx(sorted, `UTPRAS Registry as of - ${prettyDate()}.xlsx`, {
        generatedAt: new Date().toLocaleString(),
        totalRecords: sorted.length,
      });
      toast.success(`Exported ${sorted.length.toLocaleString()} programs to Excel`);
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
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Program Registry</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search registered &amp; accredited TVET programs across Region VII.
        </p>
      </div>

      <UtprasStatCards
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
          institutions={institutions}
          total={records.length}
          filtered={sorted.length}
          searchPlaceholder="Search institution, qualification, address, reg. no.…"
          noun="programs"
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
            label={`Export ${sorted.length.toLocaleString()} programs`}
            disabled={sorted.length === 0}
          />
        </div>

        <UtprasTable
          rows={pageRows}
          sort={sort}
          onSort={handleSort}
          onView={handleView}
          pageKey={`${currentPage}-${sort.key}-${sort.dir}-${filters.search}-${filters.province}-${filters.sector}-${filters.status}`}
        />

        <PaginationBar page={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>

      <UtprasRecordDialog record={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
