import { StatisticsView } from "@/components/dashboard/statistics-view";
import { getStatistics } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NttcStatisticsPage() {
  const { data } = await getStatistics();

  return <StatisticsView data={data} />;
}
