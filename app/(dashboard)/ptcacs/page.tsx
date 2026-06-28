import { ComingSoon } from "@/components/sections/coming-soon";
import { getSection } from "@/lib/sections";

export const metadata = { title: "PTCACs — Regional Dashboard VII" };

export default function PtcacsPage() {
  return <ComingSoon section={getSection("ptcacs")} />;
}
