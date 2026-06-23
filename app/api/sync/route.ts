import { NextResponse } from "next/server";
import { syncRegistryFromSheet, SHEET_ID, SHEET_GID } from "@/lib/sync";
import { canSyncToSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYNC_SECRET = process.env.SYNC_SECRET;

/**
 * REST entry point for EXTERNAL / cron callers (e.g. a Vercel Cron job).
 * It is fail-closed: it refuses unless SYNC_SECRET is configured AND supplied,
 * so the destructive overwrite is never reachable anonymously. The in-app Sync
 * button does NOT use this route — it calls the protected `syncAction` server
 * action instead (so no secret is ever shipped to the browser).
 */
export async function POST(request: Request) {
  if (!SYNC_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "REST sync is disabled. Set SYNC_SECRET to call POST /api/sync from external/cron jobs. The in-app Sync button does not need this.",
      },
      { status: 403 },
    );
  }
  if (request.headers.get("x-sync-secret") !== SYNC_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: missing or invalid x-sync-secret header." },
      { status: 401 },
    );
  }

  const result = await syncRegistryFromSheet();
  return NextResponse.json(result, { status: result.ok ? 200 : result.status });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST here (with x-sync-secret) to sync the Google Sheet into Supabase. The in-app button uses a protected server action instead.",
    sheetId: SHEET_ID,
    gid: SHEET_GID,
    writable: canSyncToSupabase,
    restEnabled: Boolean(SYNC_SECRET),
  });
}
