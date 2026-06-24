"use server";

import { revalidatePath } from "next/cache";
import { invalidateRegistryCache } from "@/lib/data";
import { syncRegistryFromSheet, type SyncResult } from "@/lib/sync";

/**
 * Server action invoked by the in-app Sync button. Server actions are not
 * arbitrary public endpoints (Next protects them with an action id + origin
 * checks), so this is the safe in-app path — no client-held secret required.
 */
export async function syncAction(): Promise<SyncResult> {
  const result = await syncRegistryFromSheet();
  if (result.ok) {
    invalidateRegistryCache(); // drop the in-process memo (registry + statistics)
    revalidatePath("/"); // invalidate the client Router Cache for both routes
    revalidatePath("/statistics");
  }
  return result;
}
