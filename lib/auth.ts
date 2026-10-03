// Single-author sign-in for the blog. Credentials come from server environment
// variables; the session is an HMAC-signed, httpOnly cookie. Changing the
// password or secret invalidates every existing session.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "blog_session";
const MAX_AGE = 60 * 60 * 24 * 7; // seconds

const env = () => ({
  email: process.env.BLOG_ADMIN_EMAIL?.trim().toLowerCase() ?? "",
  password: process.env.BLOG_ADMIN_PASSWORD ?? "",
  secret: process.env.BLOG_AUTH_SECRET ?? "",
});

/** Names of missing or invalid settings (never their values), for server logs and local hints. */
export function authProblems() {
  const { email, password, secret } = env();
  const problems: string[] = [];
  if (!email) problems.push("BLOG_ADMIN_EMAIL is missing");
  if (!password) problems.push("BLOG_ADMIN_PASSWORD is missing");
  else if (password.length < 8) problems.push("BLOG_ADMIN_PASSWORD is shorter than 8 characters");
  if (!secret) problems.push("BLOG_AUTH_SECRET is missing");
  else if (secret.length < 32) problems.push("BLOG_AUTH_SECRET is shorter than 32 characters");
  return problems;
}

export const authConfigured = () => authProblems().length === 0;

// Hashing first gives equal-length buffers, so the comparison leaks no length.
const sameText = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

const sign = (body: string) => {
  const { secret, password } = env();
  return createHmac("sha256", `${secret}\u0000${password}`).update(body).digest("base64url");
};

function verify(token: string): string | null {
  const [body, sig] = token.split(".");
  if (!body || !sig || !sameText(sig, sign(body))) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(body, "base64url").toString()) as { sub?: string; exp?: number };
    return sub === env().email && typeof exp === "number" && exp > Date.now() ? sub : null;
  } catch {
    return null;
  }
}

/** The signed-in author's email, or null for visitors. */
export async function currentAdmin() {
  if (!authConfigured()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verify(token) : null;
}

export function checkCredentials(email: string, password: string) {
  const want = env();
  // Evaluate both so a wrong email takes as long as a wrong password.
  const okEmail = sameText(email.trim().toLowerCase(), want.email);
  const okPassword = sameText(password, want.password);
  return authConfigured() && okEmail && okPassword;
}

export async function startSession() {
  const body = Buffer.from(JSON.stringify({ sub: env().email, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

// Best-effort, per-instance brute-force guard: 5 failures per 15 minutes per IP.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

const recent = (ip: string) => (failures.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW_MS);

export const loginBlocked = (ip: string) => recent(ip).length >= MAX_FAILURES;

export function recordFailure(ip: string) {
  if (failures.size > 5000) failures.clear();
  failures.set(ip, [...recent(ip), Date.now()]);
}

export const clearFailures = (ip: string) => failures.delete(ip);
