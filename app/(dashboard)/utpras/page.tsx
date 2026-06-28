import { UtprasDashboard } from "@/components/dashboard/utpras-dashboard";
import { getUtprasRegistry } from "@/lib/utpras-data";
import { computeStats } from "@/lib/utpras";

export const metadata = { title: "UTPRAS — Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function UtprasPage() {
  const { records } = await getUtprasRegistry();
  const stats = computeStats(records);

  // The section header (with Programs/Schools tabs + data-source badge) lives in
  // the UTPRAS layout so it persists across tab switches.
  return <UtprasDashboard records={records} stats={stats} />;
}
