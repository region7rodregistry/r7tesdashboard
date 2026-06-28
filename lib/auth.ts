/**
 * Shared-admin authentication for the NTTC Registry dashboard.
 *
 * A single set of admin credentials (env vars) gates the whole app. On a
 * successful login we hand the browser a signed, HTTP-only session cookie;
 * `proxy.ts` verifies that cookie on every request.
 *
 * Everything here uses the Web Crypto API (`crypto.subtle`) and `btoa`/`atob`
 * (no `node:crypto` / `Buffer`), so the exact same module works unchanged in
 * the Node server-action login path AND in `proxy.ts` — portable by design.
 */

/** Session cookie name. */
export const SESSION_COOKIE = "nttc_session";

/** Session lifetime, in seconds (12 hours — roughly one work day). */
export const SESSION_MAX_AGE = 60 * 60 * 12;

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Configured admin username (defaults to "admin"). */
function getUsername(): string {
  return process.env.AUTH_USERNAME?.trim() || "admin";
}

/** Configured admin password — empty string means "not configured". */
function getPassword(): string {
  return process.env.AUTH_PASSWORD ?? "";
}

/** Cookie-signing secret — empty string means "not configured". */
function getSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}

/**
 * True only when a password AND a signing secret are present. When false the
 * gate fails closed: no credentials verify and no token validates.
 */
export function isAuthConfigured(): boolean {
  return getPassword().length > 0 && getSecret().length > 0;
}

// ── base64url helpers (no Buffer — Edge-safe) ──────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const pad = value.length % 4 === 0 ? 0 : 4 - (value.length % 4);
  const b64 = (value + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── constant-time string compare (credential check) ───────────────────────

/**
 * Compares two strings in time that does not depend on where they first
 * differ, so an attacker can't learn the secret from response timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

/** Verifies a submitted username + password against the configured admin. */
export function verifyCredentials(username: string, password: string): boolean {
  if (!isAuthConfigured()) return false;
  // Evaluate both halves regardless so timing doesn't reveal which was wrong.
  const userOk = timingSafeEqual(username, getUsername());
  const passOk = timingSafeEqual(password, getPassword());
  return userOk && passOk;
}

// ── signed session token  (`<payload>.<hmac>`) ─────────────────────────────

interface SessionPayload {
  /** Subject (admin username). */
  u: string;
  /** Expiry, epoch milliseconds. */
  exp: number;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Mints a signed session token for `username`, valid for SESSION_MAX_AGE. */
export async function createSessionToken(username: string): Promise<string> {
  if (!getSecret()) throw new Error("AUTH_SECRET is not configured");
  const payload: SessionPayload = {
    u: username,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return `${body}.${toBase64Url(sig)}`;
}

/**
 * Verifies a session token's signature and expiry.
 * Returns the payload on success, or null for any malformed/invalid/expired
 * token. `crypto.subtle.verify` compares the HMAC in constant time.
 */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || !getSecret()) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  if (!sigPart) return null;

  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigPart),
      enc.encode(body),
    );
    if (!ok) return null;

    const payload = JSON.parse(dec.decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload?.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.u !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Sanitizes a post-login redirect target so it can only ever point back into
 * this app — defeats open-redirect (`?next=https://evil.com`) attempts.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/";
  // Must be a single-slash absolute path (reject "//host", "/\\host", schemes).
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  // Never bounce a freshly-authenticated user back to the login screen — but
  // match the route boundary, not a bare prefix, so siblings like
  // "/login-history" are still allowed.
  if (
    next === "/login" ||
    next.startsWith("/login/") ||
    next.startsWith("/login?") ||
    next.startsWith("/login#")
  )
    return "/";
  return next;
}
