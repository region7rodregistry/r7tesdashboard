import { UtprasHeader } from "@/components/dashboard/utpras-header";
import { UtprasDashboard } from "@/components/dashboard/utpras-dashboard";
import { getUtprasRegistry } from "@/lib/utpras-data";
import { computeStats } from "@/lib/utpras";

export const metadata = { title: "UTPRAS — Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function UtprasPage() {
  const { records, source } = await getUtprasRegistry();
  const stats = computeStats(records);

  return (
    <>
      <UtprasHeader source={source} />
      <UtprasDashboard records={records} stats={stats} />
    </>
  );
}
