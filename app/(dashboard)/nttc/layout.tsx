import { NttcHeader } from "@/components/dashboard/nttc-header";
import { getRegistrySource } from "@/lib/data";
import { canSyncToSupabase } from "@/lib/supabase";

/**
 * Persistent shell for the NTTC module. Keeping the header here (instead of in
 * each page) means it survives Registry<->Statistics navigation, so the
 * active-tab indicator can slide between tabs and only the body below swaps.
 *
 * The source read is memoized (see getRegistry), so awaiting it here is cheap,
 * and because layouts persist it only runs once per entry into the section —
 * not on every tab switch.
 */
export default async function NttcLayout({ children }: { children: React.ReactNode }) {
  const source = await getRegistrySource();

  return (
    <>
      <NttcHeader source={source} syncEnabled={canSyncToSupabase} />
      {children}
    </>
  );
}
