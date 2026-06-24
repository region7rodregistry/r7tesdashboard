import { SkeletonShell } from "@/components/dashboard/skeleton-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

// Shown by Next.js while the server component in page.tsx awaits getRegistry().
export default function Loading() {
  return (
    <SkeletonShell>
      <DashboardSkeleton />
    </SkeletonShell>
  );
}
