"use client";

import { Database, HardDrive, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UtprasHeaderProps {
  source: "supabase" | "local";
}

/**
 * Section header for the UTPRAS module: title + data-source badge. Mirrors the
 * NTTC header's layout (the global nav, logo, theme and sign-out live in the
 * sidebar).
 */
export function UtprasHeader({ source }: UtprasHeaderProps) {
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
