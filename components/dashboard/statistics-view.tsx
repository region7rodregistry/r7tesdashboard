"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users, MapPin, Layers, GraduationCap, ShieldCheck, Building2,
  FileText, FileSpreadsheet, FileType,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportMenu, type ExportMenuItem } from "./export-menu";
import { PieChart } from "./pie-chart";
import { cn } from "@/lib/utils";
import type { StatsData, StatusFilter } from "@/lib/stats";
import {
  exportStatisticsCsv,
  exportStatisticsXlsx,
  exportStatisticsPdf,
  prettyDate,
  type StatSection,
  type StatsExportMeta,
} from "@/lib/export";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "valid", label: "Valid" },
  { key: "expiring", label: "Expiring" },
  { key: "expired", label: "Expired" },
];

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All Records",
  valid: "Valid",
  expiring: "Expiring",
  expired: "Expired",
};

export function StatisticsView({ data }: { data: StatsData }) {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const b = data[status];

  const summary = [
    { label: "Records", value: b.recordCount, icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
    { label: "Provinces", value: b.provinceCount, icon: MapPin, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
    { label: "Sectors", value: b.sectorCount, icon: Layers, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15" },
    { label: "Qualifications", value: b.qualCount, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  ];

  // Build the export payload for the CURRENTLY selected status tab. Uses the
  // full (non-truncated) sector/qualification lists so every count is exported.
  const buildMeta = (): StatsExportMeta => ({
    statusLabel: STATUS_LABEL[status],
    generatedAt: new Date().toLocaleString(),
    summary: [
      { label: "Records", value: b.recordCount },
      { label: "Provinces", value: b.provinceCount },
      { label: "Sectors", value: b.sectorCount },
      { label: "Qualifications", value: b.qualCount },
    ],
  });
  const buildSections = (): StatSection[] => [
    { title: "By Province", slices: b.province },
    { title: "By Validity Status", slices: b.validity },
    { title: "By Sector", slices: b.sectorFull },
    { title: "By Institution Type", slices: b.institution },
    { title: "By Qualification", slices: b.qualificationFull },
  ];

  const fileBase = `NTTC Statistics (${STATUS_LABEL[status]}) as of - ${prettyDate()}`;
  const exportItems: ExportMenuItem[] = [
    {
      key: "csv",
      label: "CSV (.csv)",
      description: "All breakdowns as one flat table",
      icon: <FileText className="size-4" />,
      onSelect: () => {
        try {
          exportStatisticsCsv(buildMeta(), buildSections(), `${fileBase}.csv`);
          toast.success("Statistics exported to CSV");
        } catch (e) {
          console.error(e);
          toast.error("CSV export failed. Please try again.");
        }
      },
    },
    {
      key: "xlsx",
      label: "Excel workbook (.xlsx)",
      description: "A formatted sheet per breakdown",
      icon: <FileSpreadsheet className="size-4" />,
      onSelect: async () => {
        try {
          await exportStatisticsXlsx(buildMeta(), buildSections(), `${fileBase}.xlsx`);
          toast.success("Statistics exported to Excel");
        } catch (e) {
          console.error(e);
          toast.error("Excel export failed. Please try again.");
        }
      },
    },
    {
      key: "pdf",
      label: "PDF report (.pdf)",
      description: "Clean report with logo & per-count tables",
      icon: <FileType className="size-4" />,
      onSelect: async () => {
        try {
          await exportStatisticsPdf(buildMeta(), buildSections(), `${fileBase}.pdf`);
          toast.success("Statistics report exported to PDF");
        } catch (e) {
          console.error(e);
          toast.error("PDF export failed. Please try again.");
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Distribution of NTTC holders across Region VII — Central Visayas.
          </p>
        </div>
        <ExportMenu
          items={exportItems}
          label="Export"
          disabled={b.recordCount === 0}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
          >
            <Card className="flex-row items-center gap-4 p-5">
              <div className={`flex size-12 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tnum">{s.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={status === t.key ? "default" : "outline"}
            onClick={() => setStatus(t.key)}
            className={cn(status === t.key && "pointer-events-none")}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Charts */}
      {b.recordCount === 0 ? (
        <Card className="min-h-[30vh] items-center justify-center gap-2 p-8 text-muted-foreground">
          <Layers className="size-10" />
          <p>No records to chart for this filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <PieChart title="By Province" data={b.province} icon={<MapPin className="size-4 text-amber-600 dark:text-amber-400" />} />
          <PieChart title="By Validity Status" data={b.validity} icon={<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />} />
          <PieChart title="By Sector" data={b.sector} totalCategories={b.sectorCount} icon={<Layers className="size-4 text-violet-600 dark:text-violet-400" />} />
          <PieChart title="By Institution Type" data={b.institution} icon={<Building2 className="size-4 text-cyan-600 dark:text-cyan-400" />} />
          <PieChart
            title="By Qualification"
            data={b.qualification}
            totalCategories={b.qualCount}
            icon={<GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />}
            className="xl:col-span-2"
          />
        </div>
      )}
    </div>
  );
}
