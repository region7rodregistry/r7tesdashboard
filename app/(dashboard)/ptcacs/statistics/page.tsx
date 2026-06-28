import { PtcacsStatisticsView } from "@/components/dashboard/ptcacs-statistics-view";
import { getPtcacsStatistics } from "@/lib/ptcacs-data";

export const metadata = { title: "PTCACs Statistics — Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function PtcacsStatisticsPage() {
  const { centers, assessors, source } = await getPtcacsStatistics();

  // The section header (with Centers / Assessors / Statistics tabs) lives in the
  // PTCACs layout so it persists across tab switches.
  return <PtcacsStatisticsView centers={centers} assessors={assessors} source={source} />;
}
