import { AppShell } from "@/components/dashboard/app-shell";
import { StatisticsView } from "@/components/dashboard/statistics-view";
import { getRegistry } from "@/lib/data";
import { canSyncToSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const { records, source } = await getRegistry();

  return (
    <AppShell source={source} syncEnabled={canSyncToSupabase}>
      <StatisticsView records={records} />
    </AppShell>
  );
}
