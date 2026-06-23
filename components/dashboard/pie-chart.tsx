"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Slice } from "@/lib/stats";

// Mid-luminance palette that stays legible on both light and dark cards.
const PALETTE = [
  "#3b82f6", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4",
  "#ec4899", "#10b981", "#f97316", "#6366f1", "#d946ef", "#0ea5e9",
];
const OTHER_COLOR = "#94a3b8";

interface Props {
  title: string;
  data: Slice[];
  totalCategories?: number;
  icon?: React.ReactNode;
  unit?: string;
  className?: string;
}

const SIZE = 200;
const STROKE = 30;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

const colorFor = (label: string, index: number): string =>
  label.startsWith("Other") ? OTHER_COLOR : PALETTE[index % PALETTE.length];

export function PieChart({ title, data, totalCategories, icon, unit = "records", className }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  useEffect(() => setHovered(null), [data]);

  const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data]);

  const segments = useMemo(() => {
    let acc = 0;
    return data.map((s, i) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * CIRC;
      const offset = -((acc / total) * CIRC) || 0;
      acc += s.value;
      return { ...s, index: i, fraction, dash, offset, color: colorFor(s.label, i) };
    });
  }, [data, total]);

  const active = hovered != null && hovered < segments.length ? segments[hovered] : null;
  const distinct = totalCategories ?? data.length;
  const rolledUp = distinct > data.length;
  const shownTop = data.length - (data.some((d) => d.label.startsWith("Other")) ? 1 : 0);
  const countLabel = rolledUp
    ? `${distinct} categories · top ${shownTop}`
    : `${distinct} ${distinct === 1 ? "category" : "categories"}`;

  const ariaLabel =
    total === 0
      ? `${title}: no data`
      : `${title}: ${total} ${unit} across ${distinct} categories. ` +
        segments.slice(0, 3).map((s) => `${s.label} ${(s.fraction * 100).toFixed(0)} percent`).join(", ");

  const toggle = (i: number) => setHovered((h) => (h === i ? null : i));

  return (
    <Card className={cn("gap-4 p-5", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground tnum">{countLabel}</span>
      </div>

      {total === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No data to display.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative shrink-0">
            <motion.svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={ariaLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="-rotate-90"
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="text-muted"
              />
              {segments.map((seg) => {
                const dimmed = active != null && active.index !== seg.index;
                return (
                  <motion.circle
                    key={`${seg.label}-${seg.index}`}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                    strokeDashoffset={seg.offset}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dimmed ? 0.25 : 1 }}
                    transition={{ duration: 0.25 }}
                    onMouseEnter={() => setHovered(seg.index)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => toggle(seg.index)}
                    style={{ cursor: "pointer" }}
                    aria-hidden
                  />
                );
              })}
            </motion.svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {active ? (
                <>
                  <span className="text-2xl font-bold tnum">{active.value}</span>
                  <span className="max-w-[7rem] text-[11px] leading-tight text-muted-foreground">
                    {active.label}
                  </span>
                  <span className="text-[11px] font-medium text-primary tnum">
                    {(active.fraction * 100).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold tnum">{total}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{unit}</span>
                </>
              )}
            </div>
          </div>

          <ul className="scroll-fancy flex max-h-[200px] w-full flex-col gap-1 overflow-y-auto pr-1 text-sm">
            {segments.map((seg) => {
              const dimmed = active != null && active.index !== seg.index;
              return (
                <li key={`legend-${seg.label}-${seg.index}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(seg.index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(seg.index)}
                    onBlur={() => setHovered(null)}
                    onClick={() => toggle(seg.index)}
                    aria-pressed={active?.index === seg.index}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      active?.index === seg.index && "bg-muted",
                      dimmed && "opacity-50",
                    )}
                  >
                    <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
                    <span className="min-w-0 flex-1 truncate" title={seg.label}>
                      {seg.label}
                    </span>
                    <span className="shrink-0 font-medium tnum">{seg.value}</span>
                    <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tnum">
                      {(seg.fraction * 100).toFixed(1)}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
