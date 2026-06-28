import { UtprasSummaryView } from "@/components/dashboard/utpras-summary-view";
import { getUtprasRegistry } from "@/lib/utpras-data";
import { computeUtprasSummary } from "@/lib/utpras-summary";

export const metadata = { title: "UTPRAS Summary — Regional Dashboard VII" };

// Always read fresh from Supabase so the summary reflects the live registry.
export const dynamic = "force-dynamic";

export default async function UtprasSummaryPage() {
  const { records, source } = await getUtprasRegistry();
  const summary = computeUtprasSummary(records);

  // The section header (with the Summary / Programs / Schools / Statistics tabs)
  // lives in the UTPRAS layout so it persists across tab switches.
  return <UtprasSummaryView summary={summary} source={source} />;
}
