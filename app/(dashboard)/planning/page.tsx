import { ComingSoon } from "@/components/sections/coming-soon";
import { getSection } from "@/lib/sections";

export const metadata = { title: "Planning — Regional Dashboard VII" };

export default function PlanningPage() {
  return <ComingSoon section={getSection("planning")} />;
}
