import { SchoolsDashboard } from "@/components/dashboard/schools-dashboard";
import { getUtprasRegistry } from "@/lib/utpras-data";
import { groupSchools, computeSchoolsOverview } from "@/lib/utpras-schools";

export const metadata = { title: "Schools — UTPRAS · Regional Dashboard VII" };

// Always read fresh from Supabase so a re-seed is reflected immediately.
export const dynamic = "force-dynamic";

export default async function UtprasSchoolsPage() {
  const { records } = await getUtprasRegistry();
  const schools = groupSchools(records);
  const overview = computeSchoolsOverview(schools);

  return <SchoolsDashboard schools={schools} overview={overview} />;
}
