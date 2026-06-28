"use client";

import * as React from "react";
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Hash,
  Building2,
  Layers,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UtprasStatCards, type StatusFilter } from "./utpras-stat-cards";
import { UtprasTable, type SortKey, type SortState } from "./utpras-table";
import { PaginationBar } from "./pagination-bar";
import { UtprasRecordDialog } from "./utpras-record-dialog";
import { ExportMenu, type ExportMenuItem } from "./export-menu";
import { field, validityStatus } from "@/lib/utpras";
import { exportUtprasCsv, exportUtprasXlsx } from "@/lib/utpras-export";
import { prettyDate } from "@/lib/export";
import type { UtprasRecord } from "@/lib/utpras-columns";
import type { School } from "@/lib/utpras-schools";

interface SchoolDetailProps {
  school: School;
  onBack: () => void;
}

// Columns scanned by the in-school search box.
const SEARCH_FIELDS = ["course_program", "program_reg_no", "sector", "trainer", "duration"];

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm leading-snug text-foreground">{children || "—"}</p>
      </div>
    </div>
  );
}

export function SchoolDetail({ school, onBack }: SchoolDetailProps) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortState>({ key: "course_program", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [selected, setSelected] = React.useState<UtprasRecord | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const deferredSearch = React.useDeferredValue(search);

  const filtered = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return school.programs.filter((r) => {
      if (status !== "all" && validityStatus(r) !== status) return false;
      if (q) {
        const hay = SEARCH_FIELDS.map((f) => field(r, f)).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [school.programs, status, deferredSearch]);

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
  }, [status, sort, pageSize, deferredSearch]);

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
      exportUtprasCsv(sorted, `${school.name} — UTPRAS Programs as of ${prettyDate()}.csv`);
      toast.success(`Exported ${sorted.length.toLocaleString()} programs to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("CSV export failed. Please try again.");
    }
  }, [sorted, school.name]);

  const handleExportXlsx = React.useCallback(async () => {
    try {
      await exportUtprasXlsx(sorted, `${school.name} — UTPRAS Programs as of ${prettyDate()}.xlsx`, {
        generatedAt: new Date().toLocaleString(),
        totalRecords: sorted.length,
      });
      toast.success(`Exported ${sorted.length.toLocaleString()} programs to Excel`);
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed. Please try again.");
    }
  }, [sorted, school.name]);

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

  const location = [school.municipality, school.province].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 w-fit text-muted-foreground">
        <ArrowLeft className="size-4" /> All schools
      </Button>

      {/* School info card */}
      <Card className="gap-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {school.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {school.institution_type && (
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="size-3" /> {school.institution_type}
                </Badge>
              )}
              {school.classification && <Badge variant="outline">{school.classification}</Badge>}
              {location && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <MapPin className="size-3" /> {location}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={User} label="Head of Institution">
            {school.institution_head}
          </InfoItem>
          <InfoItem icon={Hash} label="Unique Institution ID">
            <span className="font-mono tnum">{school.unique_institution_id}</span>
          </InfoItem>
          <InfoItem icon={Layers} label="Sectors">
            {school.sectors.length ? school.sectors.join(", ") : ""}
          </InfoItem>
          <InfoItem icon={MapPin} label="Address">
            {school.address}
          </InfoItem>
          <InfoItem icon={Phone} label="Contact Number">
            <span className="whitespace-pre-line font-mono text-[0.82rem] tnum">{school.tel_no}</span>
          </InfoItem>
          <InfoItem icon={Mail} label="Email Address">
            <span className="break-all">{school.email}</span>
          </InfoItem>
        </div>
      </Card>

      {/* This school's KPI cards */}
      <UtprasStatCards
        stats={school.stats}
        activeStatus={status}
        onSelect={(s) => setStatus(s !== "all" && status === s ? "all" : s)}
      />

      {/* Programs of this school */}
      <div className="space-y-4">
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this school's programs…"
              aria-label="Search programs in this school"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Rows</span>
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
              label={`Export ${sorted.length.toLocaleString()}`}
              disabled={sorted.length === 0}
            />
          </div>
        </div>

        <UtprasTable rows={pageRows} sort={sort} onSort={handleSort} onView={handleView} />

        <PaginationBar page={currentPage} totalPages={totalPages} onPage={setPage} />
      </div>

      <UtprasRecordDialog record={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
