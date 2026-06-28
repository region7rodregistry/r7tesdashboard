import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Body fallback while the statistics server component awaits getUtprasStatistics().
// The UTPRAS header lives in layout.tsx and stays visible during the load.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="space-y-6">
      <span className="sr-only">Loading…</span>

      {/* Summary cards */}
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

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="gap-4 p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="size-40 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
