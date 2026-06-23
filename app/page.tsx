import { AppShell } from "@/components/dashboard/app-shell";
import { RegistryDashboard } from "@/components/dashboard/registry-dashboard";
import { getRegistry } from "@/lib/data";
import { canSyncToSupabase } from "@/lib/supabase";
import { computeStats } from "@/lib/nttc";

// Always read fresh from Supabase so a Sync is reflected immediately.
export const dynamic = "force-dynamic";

export default async function Page() {
  const { records, source } = await getRegistry();
  const stats = computeStats(records);

  return (
    <AppShell source={source} syncEnabled={canSyncToSupabase}>
      <RegistryDashboard records={records} stats={stats} />
    </AppShell>
  );
}
