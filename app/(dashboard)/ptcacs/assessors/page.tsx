import { AssessorsDashboard } from "@/components/dashboard/assessors-dashboard";
import { getAssessors } from "@/lib/ptcacs-data";
import { computeStats } from "@/lib/ptcacs";

export const metadata = { title: "Assessors — PTCACs · Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function AssessorsPage() {
  const { records, source } = await getAssessors();
  const stats = computeStats(records, "name");

  return <AssessorsDashboard records={records} stats={stats} source={source} />;
}
