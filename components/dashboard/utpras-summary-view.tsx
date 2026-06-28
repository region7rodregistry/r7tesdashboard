"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  Building2,
  MapPinned,
  Layers,
  Database,
  HardDrive,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SummaryMatrix, UtprasSummary } from "@/lib/utpras-summary";

// Distinct, legible accents reused for column dots + the composition bar.
const PROGRAM_COLORS = ["#3b82f6", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e"];
const PROVIDER_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#f59e0b", "#f97316", "#ec4899", "#10b981"];

const EASE = [0.22, 1, 0.36, 1] as const;
const fmt = (n: number) => n.toLocaleString();

interface Props {
  summary: UtprasSummary;
  source: "supabase" | "local";
}

export function UtprasSummaryView({ summary, source }: Props) {
  const kpis = [
    { label: "Registered Programs", value: summary.totalPrograms, icon: FileCheck, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
    { label: "TVET Providers", value: summary.totalProviders, icon: Building2, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15" },
    { label: "Provinces", value: summary.provinces.length, icon: MapPinned, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "Program Types", value: summary.programs.columns.length, icon: Layers, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
  ];

  return (
    <div className="space-y-6">
      {/* Title band */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="bg-tesda-header relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-lg ring-1 ring-black/10 sm:px-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(48% 60% at 90% 6%, rgba(56,121,255,0.45), transparent 70%), radial-gradient(40% 50% at 0% 100%, rgba(255,255,255,0.10), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200">
              TESDA Region VII · Central Visayas
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
              Registered Programs &amp; TVET Providers
            </h1>
            <p className="mt-1 text-sm text-sky-100/90">
              Number of registered programs and providers offering them · as of {summary.asOf}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 self-start border-white/25 bg-white/10 text-[11px] text-sky-50 sm:self-auto",
            )}
          >
            {source === "supabase" ? (
              <><Database className="size-3" /> Live · Supabase</>
            ) : (
              <><HardDrive className="size-3" /> Local snapshot</>
            )}
          </Badge>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.04 * i }}
          >
            <Card className="flex-row items-center gap-4 p-5">
              <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", k.bg, k.color)}>
                <k.icon className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tnum">{fmt(k.value)}</p>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <SummaryCard
        title="Registered Programs by Type"
        subtitle="Counted live from the registry by registration status — matches the Compendium."
        matrix={summary.programs}
        colors={PROGRAM_COLORS}
        unit="programs"
      />

      <SummaryCard
        title="TVET Providers by Type"
        subtitle="Distinct institutions offering registered programs, grouped Private / Public."
        matrix={summary.providers}
        colors={PROVIDER_COLORS}
        unit="providers"
        grouped
        footnote="Providers are distinct institutions in the live registry; counts may differ slightly from the Compendium's manually-consolidated UIID master."
      />
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  matrix,
  colors,
  unit,
  grouped,
  footnote,
}: {
  title: string;
  subtitle: string;
  matrix: SummaryMatrix;
  colors: string[];
  unit: string;
  grouped?: boolean;
  footnote?: string;
}) {
  return (
    <Card className="gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-xs text-muted-foreground tnum">
          {fmt(matrix.grandTotal)} {unit}
        </span>
      </div>

      <CompositionBar matrix={matrix} colors={colors} />
      <SummaryTable matrix={matrix} colors={colors} grouped={grouped} />

      {footnote && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>{footnote}</span>
        </p>
      )}
    </Card>
  );
}

/** Regional composition by column, as one stacked bar + legend. */
function CompositionBar({ matrix, colors }: { matrix: SummaryMatrix; colors: string[] }) {
  const total = matrix.grandTotal || 1;
  return (
    <div className="space-y-2.5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {matrix.columns.map((col, i) => {
          const pct = (matrix.columnTotals[i] / total) * 100;
          if (pct <= 0) return null;
          return (
            <motion.div
              key={col.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.04 * i }}
              style={{ backgroundColor: colors[i % colors.length] }}
              title={`${col.label}: ${fmt(matrix.columnTotals[i])}`}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {matrix.columns.map((col, i) => (
          <li key={col.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-muted-foreground">{col.label}</span>
            <span className="font-semibold tnum">{fmt(matrix.columnTotals[i])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryTable({
  matrix,
  colors,
  grouped,
}: {
  matrix: SummaryMatrix;
  colors: string[];
  grouped?: boolean;
}) {
  // Group spans for the optional Private / Public super-header.
  const groups: { label: string; span: number }[] = [];
  if (grouped) {
    for (const col of matrix.columns) {
      const g = col.group ?? "";
      const last = groups[groups.length - 1];
      if (last && last.label === g) last.span += 1;
      else groups.push({ label: g, span: 1 });
    }
  }

  const numCell = "px-3 py-2 text-right tabular-nums";
  const headCell = "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="scroll-fancy -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
        <thead>
          {grouped && (
            <tr>
              <th className="sticky left-0 z-10 bg-card" />
              {groups.map((g, gi) => (
                <th
                  key={`${g.label}-${gi}`}
                  colSpan={g.span}
                  className={cn(
                    "border-b px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider",
                    g.label === "Private"
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {g.label}
                </th>
              ))}
              <th className="border-b" />
            </tr>
          )}
          <tr>
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Province
            </th>
            {matrix.columns.map((col, i) => (
              <th key={col.key} className={headCell}>
                <span className="inline-flex items-center justify-end gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  {col.label}
                </span>
              </th>
            ))}
            <th className={cn(headCell, "text-foreground")}>Total</th>
          </tr>
        </thead>

        <tbody>
          {matrix.rows.map((row, ri) => (
            <motion.tr
              key={row.province}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE, delay: 0.04 * ri }}
              className="group"
            >
              <td className="sticky left-0 z-10 border-t bg-card px-3 py-2 font-medium transition-colors group-hover:bg-muted/60">
                {row.province}
              </td>
              {row.cells.map((n, i) => (
                <td
                  key={i}
                  className={cn(numCell, "border-t transition-colors group-hover:bg-muted/40", n === 0 && "text-muted-foreground/50")}
                >
                  {n === 0 ? "–" : fmt(n)}
                </td>
              ))}
              <td className={cn(numCell, "border-t bg-primary/[0.04] font-semibold transition-colors group-hover:bg-primary/[0.08]")}>
                {fmt(row.total)}
              </td>
            </motion.tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-muted/60 font-bold">
            <td className="sticky left-0 z-10 border-t bg-muted/60 px-3 py-2.5">Total</td>
            {matrix.columnTotals.map((n, i) => (
              <td key={i} className={cn(numCell, "border-t py-2.5")}>
                {fmt(n)}
              </td>
            ))}
            <td className={cn(numCell, "border-t bg-primary/10 py-2.5 text-primary")}>
              {fmt(matrix.grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
