import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when Supabase reads are configured (URL + anon key present). */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** True when the privileged sync endpoint can write (service role present). */
export const canSyncToSupabase = Boolean(url && serviceKey);

/** Read-only client (anon key). Returns null when Supabase isn't configured. */
export function getSupabaseReadClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/**
 * Privileged client (service-role key) — SERVER ONLY.
 * Used by /api/sync to overwrite the registry. Never import into client code.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
