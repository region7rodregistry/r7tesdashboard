"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Slice } from "@/lib/stats";

// Horizontal ranked-bar chart — the companion to PieChart for ordered data
// (provinces, sectors) where a donut's slices would be too thin to read. Bar
// LENGTH is relative to the largest value (so #1 fills the track); the trailing
// figure is each slice's SHARE of the total. Shares mirror PieChart's palette.
const PALETTE = [
  "#3b82f6", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4",
  "#ec4899", "#10b981", "#f97316", "#6366f1", "#d946ef", "#0ea5e9",
];
const OTHER_COLOR = "#94a3b8";

interface Props {
  title: string;
  data: Slice[];
  unit?: string;
  icon?: React.ReactNode;
  /** Denominator for the share %. Defaults to the sum of `data`. */
  total?: number;
  /** Per-label colour overrides (e.g. semantic status tones). */
  colors?: Record<string, string>;
  /** Right-aligned header caption. Defaults to "<sum> <unit>". */
  caption?: string;
  className?: string;
}

const colorFor = (label: string, index: number, colors?: Record<string, string>): string =>
  colors?.[label] ?? (label.startsWith("Other") ? OTHER_COLOR : PALETTE[index % PALETTE.length]);

export function BarList({ title, data, unit = "records", icon, total, colors, caption, className }: Props) {
  const sum = total ?? data.reduce((s, x) => s + x.value, 0);
  const max = data.reduce((m, x) => Math.max(m, x.value), 0) || 1;

  return (
    <Card className={cn("gap-4 p-5", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground tnum">
          {caption ?? `${sum.toLocaleString()} ${unit}`}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          No data to display.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((s, i) => {
            const lengthPct = (s.value / max) * 100;
            const share = sum > 0 ? (s.value / sum) * 100 : 0;
            const color = colorFor(s.label, i, colors);
            return (
              <li key={`${s.label}-${i}`}>
                <div className="mb-1.5 flex items-baseline gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate" title={s.label}>
                    {s.label}
                  </span>
                  <span className="shrink-0 font-semibold tnum">{s.value.toLocaleString()}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tnum">
                    {share.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${lengthPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: Math.min(i, 8) * 0.05 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
