import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

// Body fallback while the server component awaits getAssessmentCenters().
// The PTCACs header lives in layout.tsx and stays visible during the load.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <DashboardSkeleton />
    </div>
  );
}
