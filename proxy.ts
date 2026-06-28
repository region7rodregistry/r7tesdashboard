import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, safeNext, verifySessionToken } from "@/lib/auth";

/**
 * Route gate (Next.js 16 "proxy" convention — the renamed Middleware). Every
 * page request must carry a valid session cookie; otherwise the visitor is
 * bounced to /login (with a `next` hint so we can send them back to where they
 * were headed). Already-authenticated visitors who hit /login are forwarded
 * on to their `next` target (or the dashboard).
 *
 * Runs on the Node.js runtime — Next 16 proxy files always use Node.js and the
 * `runtime` option is unavailable here. lib/auth.ts still uses only Web Crypto
 * + btoa/atob (no node:crypto / Buffer) so the same module is reused unchanged
 * by the Node server-action login path; that portability is a convenience.
 *
 * Static assets, Next internals and /api/* are excluded via `config.matcher`
 * below — the /api/sync route keeps its own SYNC_SECRET guard.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const isLogin = pathname === "/login";

  if (isLogin) {
    if (session) {
      // Already signed in — skip the login screen, honoring any `next` hint.
      const next = safeNext(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const target = pathname + search;
    if (target && target !== "/") loginUrl.searchParams.set("next", target);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route EXCEPT api routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
