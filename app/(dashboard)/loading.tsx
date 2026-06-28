import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Fallback for async section pages in this group that lack their own
// loading.tsx (e.g. the Overview index). The sidebar layout stays put.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="space-y-8">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-32 gap-3 p-5">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
