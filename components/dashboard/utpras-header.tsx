"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileCheck,
  Database,
  HardDrive,
  BookMarked,
  GraduationCap,
  ChartPie,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UtprasHeaderProps {
  source: "supabase" | "local";
}

const TABS = [
  { label: "Summary", href: "/utpras/summary", icon: LayoutDashboard },
  { label: "Programs", href: "/utpras", icon: BookMarked },
  { label: "Schools", href: "/utpras/schools", icon: GraduationCap },
  { label: "Statistics", href: "/utpras/statistics", icon: ChartPie },
];

// Matches the sidebar's sliding-indicator feel.
const TAB_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/**
 * Section header for the UTPRAS module. Lives in the UTPRAS layout so it persists
 * across the Programs / Schools tabs — which lets the active-tab indicator slide
 * smoothly between them (shared layoutId) instead of hard-cutting. The global
 * nav, logo, theme and sign-out live in the sidebar.
 */
export function UtprasHeader({ source }: UtprasHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileCheck className="size-6 text-primary" />
          UTPRAS Registry
        </h1>
        <p className="text-sm text-muted-foreground">
          Registered &amp; accredited TVET programs · TESDA Region VII
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
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="utpras-tab-pill"
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
