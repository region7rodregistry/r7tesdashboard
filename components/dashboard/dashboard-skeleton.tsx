import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = 11; // 10 data columns + Actions
const ROWS = 15; // matches the default page size

/**
 * Loading placeholder for the Certificate Registry. Mirrors the real
 * <RegistryDashboard> layout (heading, stat cards, filters, table) so the
 * page doesn't jump when the data finishes streaming in.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-4 p-5">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <Card className="gap-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Skeleton className="h-9 flex-1" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
              <Skeleton className="h-9 lg:w-44" />
              <Skeleton className="h-9 lg:w-40" />
              <Skeleton className="h-9 lg:w-48" />
            </div>
          </div>
          <Skeleton className="h-4 w-48" />
        </Card>

        {/* Rows-per-page + export row */}
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-44" />
        </div>

        {/* Desktop table */}
        <Card className="hidden overflow-hidden py-0 md:block">
          <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-3">
            {Array.from({ length: COLUMNS }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: ROWS }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0">
              {Array.from({ length: COLUMNS }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </Card>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {Array.from({ length: ROWS }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-3/4" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-8" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
