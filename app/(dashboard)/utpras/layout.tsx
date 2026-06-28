import { UtprasHeader } from "@/components/dashboard/utpras-header";
import { getUtprasRegistry } from "@/lib/utpras-data";

/**
 * Persistent shell for the UTPRAS module. Keeping the header here (instead of in
 * each page) means it survives Programs <-> Schools navigation, so the
 * active-tab indicator can slide between tabs and only the body below swaps.
 *
 * The registry read is memoized (see getUtprasRegistry), so awaiting it here is
 * cheap and, because layouts persist, it only runs once per entry into the
 * section — not on every tab switch.
 */
export default async function UtprasLayout({ children }: { children: React.ReactNode }) {
  const { source } = await getUtprasRegistry();

  return (
    <>
      <UtprasHeader source={source} />
      {children}
    </>
  );
}
