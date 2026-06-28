import { NttcHeader } from "@/components/dashboard/nttc-header";
import { getRegistrySource } from "@/lib/data";
import { canSyncToSupabase } from "@/lib/supabase";

/**
 * Persistent shell for the NTTC module. Keeping the header here (instead of in
 * each page) means it survives Registry<->Statistics navigation, so the
 * active-tab indicator can slide between tabs and only the body below swaps.
 *
 * Not async: the source label is streamed to the header via a promise (read
 * with `use()` behind a small Suspense), so this layout never blocks rendering.
 */
export default function NttcLayout({ children }: { children: React.ReactNode }) {
  const sourcePromise = getRegistrySource();

  return (
    <>
      <NttcHeader sourcePromise={sourcePromise} syncEnabled={canSyncToSupabase} />
      {children}
    </>
  );
}
