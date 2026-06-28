"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isAuthConfigured,
  safeNext,
  verifyCredentials,
} from "@/lib/auth";

export interface LoginState {
  error?: string;
}

/**
 * Verifies the submitted credentials and, on success, sets the signed session
 * cookie and redirects to the requested page. Returns an error message string
 * on failure so the form can render it (the redirect path throws internally,
 * so it must not be caught here).
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next")?.toString());

  if (!isAuthConfigured()) {
    return { error: "Login is not configured. Set AUTH_PASSWORD and AUTH_SECRET in the server environment." };
  }
  if (!username || !password) {
    return { error: "Enter both your username and password." };
  }
  if (!verifyCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  const token = await createSessionToken(username);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next);
}

/** Clears the session cookie and returns to the login screen. */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
