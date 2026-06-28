"use client";

import * as React from "react";
import { FileText, FileSpreadsheet, Building2, Database, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { PtcacsStatCards } from "./ptcacs-stat-cards";
import { FiltersBar, type FilterState } from "./filters-bar";
import { CentersTable, type SortKey, type SortState } from "./centers-table";
import { PaginationBar } from "./pagination-bar";
import { CenterRecordDialog } from "./center-record-dialog";
import { ExportMenu, type ExportMenuItem } from "./export-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CENTER_COLUMNS, type PtcacsRecord } from "@/lib/ptcacs-columns";
import { field, uniqueSorted, validityStatus, type PtcacsStats } from "@/lib/ptcacs";
import { exportPtcacsCsv, exportPtcacsXlsx } from "@/lib/ptcacs-export";
import { prettyDate } from "@/lib/export";
import { cn } from "@/lib/utils";

interface CentersDashboardProps {
  records: PtcacsRecord[];
  stats: PtcacsStats;
  source: "supabase" | "local";
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
  "assessment_center", "qualification_title", "address", "center_manager",
  "tel_no", "accreditation_number", "province", "sector",
];

export function CentersDashboard({ records, stats, source }: CentersDashboardProps) {
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortState>({ key: "assessment_center", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [selected, setSelected] = React.useState<PtcacsRecord | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const deferredSearch = React.useDeferredValue(filters.search);

  const provinces = React.useMemo(() => uniqueSorted(records, "province"), [records]);
  const sectors = React.useMemo(() => uniqueSorted(records, "sector"), [records]);
  // Centers narrow to the chosen province so the dropdown stays relevant.
  const centers = React.useMemo(() => {
    const scope =
      filters.province === "all"
        ? records
        : records.filter((r) => field(r, "province") === filters.province);
    return uniqueSorted(scope, "assessment_center");
  }, [records, filters.province]);

  const filtered = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.province !== "all" && field(r, "province") !== filters.province) return false;
      if (filters.institution && filters.institution !== "all" && field(r, "assessment_center") !== filters.institution)
        return false;
      if (filters.sector !== "all" && field(r, "sector") !== filters.sector) return false;
      if (filters.status !== "all" && validityStatus(r) !== filters.status) return false;
      if (q) {
        const hay = SEARCH_FIELDS.map((f) => field(r, f)).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, filters.province, filters.institution, filters.sector, filters.status, deferredSearch]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const mult = dir === "asc" ? 1 : -1;
    arr.sort((a, b) => field(a, key).localeCompare(field(b, key), "en", { numeric: true }) * mult);
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
      if (next.province !== undefined && next.province !== prev.province && next.institution === undefined) {
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

  const handleView = React.useCallback((record: PtcacsRecord) => {
    setSelected(record);
    setDialogOpen(true);
  }, []);

  const handleExportCsv = React.useCallback(() => {
    try {
      exportPtcacsCsv(sorted, CENTER_COLUMNS, `Assessment Centers as of - ${prettyDate()}.csv`);
      toast.success(`Exported ${sorted.length.toLocaleString()} records to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("CSV export failed. Please try again.");
    }
  }, [sorted]);

  const handleExportXlsx = React.useCallback(async () => {
    try {
      await exportPtcacsXlsx(sorted, CENTER_COLUMNS, `Assessment Centers as of - ${prettyDate()}.xlsx`, {
        sheetName: "Assessment Centers",
        title: "Accredited Assessment Centers",
        note: "Accredited Competency Assessment Centers. Reflects the filters applied at export time.",
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Accredited Assessment Centers</h2>
          <p className="text-sm text-muted-foreground">
            Browse and search TESDA-accredited competency assessment centers across Region VII.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[11px]",
            source === "supabase"
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {source === "supabase" ? (
            <><Database className="size-3" /> Live · Supabase</>
          ) : (
            <><HardDrive className="size-3" /> Local snapshot</>
          )}
        </Badge>
      </div>

      <PtcacsStatCards
        stats={stats}
        totalLabel="Total Centers"
        totalIcon={Building2}
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
          institutions={centers}
          institutionLabel="Center"
          institutionAllLabel="All Centers"
          total={records.length}
          filtered={sorted.length}
          searchPlaceholder="Search center, qualification, manager, accreditation no.…"
          noun="records"
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

        <CentersTable rows={pageRows} sort={sort} onSort={handleSort} onView={handleView} />

        <PaginationBar page={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>

      <CenterRecordDialog record={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
