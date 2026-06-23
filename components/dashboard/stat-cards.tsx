"use client";

import { motion } from "framer-motion";
import { Users, ShieldCheck, Clock, CircleSlash, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RegistryStats } from "@/lib/nttc";

interface StatDef {
  key: keyof RegistryStats;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const STATS: StatDef[] = [
  { key: "total", label: "Total Holders", icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
  { key: "valid", label: "Valid", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  { key: "expiring", label: "Expiring Soon", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
  { key: "expired", label: "Expired", icon: CircleSlash, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/15" },
];

export function StatCards({ stats }: { stats: RegistryStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.key}
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
              <p className="text-2xl font-bold tnum">{stats[s.key].toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
