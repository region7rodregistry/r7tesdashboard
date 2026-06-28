import { UtprasStatisticsView } from "@/components/dashboard/utpras-statistics-view";
import { getUtprasStatistics } from "@/lib/utpras-data";

export const metadata = { title: "UTPRAS Statistics — Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function UtprasStatisticsPage() {
  const { data } = await getUtprasStatistics();

  // The section header (with Programs / Schools / Statistics tabs) lives in the
  // UTPRAS layout so it persists across tab switches.
  return <UtprasStatisticsView data={data} />;
}
