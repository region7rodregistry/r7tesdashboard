import { ComingSoon } from "@/components/sections/coming-soon";
import { getSection } from "@/lib/sections";

export const metadata = { title: "I.T. — Regional Dashboard VII" };

export default function ItPage() {
  return <ComingSoon section={getSection("it")} />;
}
