import { AppShell } from "@/components/dashboard/app-shell";
import { StatisticsView } from "@/components/dashboard/statistics-view";
import { getStatistics } from "@/lib/data";
import { canSyncToSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const { data, source } = await getStatistics();

  return (
    <AppShell source={source} syncEnabled={canSyncToSupabase}>
      <StatisticsView data={data} />
    </AppShell>
  );
}
