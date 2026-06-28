"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PtcacsStats, ValidityStatus } from "@/lib/ptcacs";

export type StatusFilter = "all" | ValidityStatus;

interface StatDef {
  key: keyof PtcacsStats;
  status: StatusFilter;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  ring: string;
}

interface PtcacsStatCardsProps {
  stats: PtcacsStats;
  activeStatus: StatusFilter;
  onSelect: (status: StatusFilter) => void;
  /** Icon + label for the "total" card, e.g. "Total Centers". */
  totalLabel: string;
  totalIcon: LucideIcon;
}

export function PtcacsStatCards({
  stats,
  activeStatus,
  onSelect,
  totalLabel,
  totalIcon,
}: PtcacsStatCardsProps) {
  const STATS: StatDef[] = [
    { key: "total", status: "all", label: totalLabel, icon: totalIcon, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15", ring: "ring-sky-500" },
    { key: "valid", status: "valid", label: "Valid", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", ring: "ring-emerald-500" },
    { key: "expiring", status: "expiring", label: "Expiring Soon", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15", ring: "ring-amber-500" },
    { key: "expired", status: "expired", label: "Expired", icon: CircleSlash, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/15", ring: "ring-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((s, i) => {
        const active = activeStatus === s.status;
        return (
          <motion.button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.status)}
            aria-pressed={active}
            title={
              s.status === "all"
                ? `Show all ${totalLabel.replace(/^Total\s+/i, "").toLowerCase()}`
                : `Filter to ${s.label.toLowerCase()}`
            }
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card
              className={cn(
                "flex-row items-center gap-4 p-5 transition-all",
                active ? cn("ring-2 shadow-md", s.ring) : "hover:ring-foreground/20",
              )}
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tnum">{stats[s.key].toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
