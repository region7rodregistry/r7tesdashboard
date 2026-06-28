import { RegistryDashboard } from "@/components/dashboard/registry-dashboard";
import { getRegistry } from "@/lib/data";
import { computeStats } from "@/lib/nttc";

// Always read fresh from Supabase so a Sync is reflected immediately.
export const dynamic = "force-dynamic";

export default async function NttcPage() {
  const { records } = await getRegistry();
  const stats = computeStats(records);

  return <RegistryDashboard records={records} stats={stats} />;
}
