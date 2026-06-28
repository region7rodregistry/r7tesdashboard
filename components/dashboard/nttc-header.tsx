"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookMarked, ChartPie, Database, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SyncButton } from "./sync-button";
import { cn } from "@/lib/utils";

type Source = "supabase" | "local";

interface NttcHeaderProps {
  source: Source;
  syncEnabled: boolean;
}

const TABS = [
  { label: "Registry", href: "/nttc", icon: BookMarked },
  { label: "Statistics", href: "/nttc/statistics", icon: ChartPie },
];

// Matches the sidebar's sliding-indicator feel.
const TAB_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/**
 * Section header for the NTTC module. Lives in the NTTC layout so it persists
 * across the Registry/Statistics tabs — which lets the active-tab indicator
 * slide smoothly between them (shared layoutId) instead of hard-cutting.
 */
export function NttcHeader({ source, syncEnabled }: NttcHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">NTTC Registry</h1>
        <p className="text-sm text-muted-foreground">
          National TVET Trainer’s Certificate holders · TESDA Region VII
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-muted p-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nttc-tab-pill"
                    transition={TAB_SPRING}
                    className="absolute inset-0 rounded-md bg-card shadow-sm"
                  />
                )}
                <t.icon className="relative z-10 size-4" />
                <span className="relative z-10">{t.label}</span>
              </Link>
            );
          })}
        </div>

        <SyncButton enabled={syncEnabled} />

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
            <>
              <Database className="size-3" /> Live · Supabase
            </>
          ) : (
            <>
              <HardDrive className="size-3" /> Local snapshot
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
