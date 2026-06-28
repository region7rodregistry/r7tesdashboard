import { CentersDashboard } from "@/components/dashboard/centers-dashboard";
import { getAssessmentCenters } from "@/lib/ptcacs-data";
import { computeStats } from "@/lib/ptcacs";

export const metadata = { title: "Assessment Centers — PTCACs · Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function CentersPage() {
  const { records, source } = await getAssessmentCenters();
  const stats = computeStats(records, "assessment_center");

  return <CentersDashboard records={records} stats={stats} source={source} />;
}
