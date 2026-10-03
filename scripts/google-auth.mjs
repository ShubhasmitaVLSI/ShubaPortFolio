// One-time setup: authorize the portfolio to create Calendar events (with Meet
// links), read free/busy times and send booking emails as the owner.
//
//   npm run google:auth
//
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (a "Desktop app" OAuth client)
// in .env.local. Saves GOOGLE_REFRESH_TOKEN to .env.local when it finishes.

import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/gmail.send",
];
const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}`;
const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret, BOOKING_OWNER_EMAIL: owner } = process.env;

if (!id || !secret) {
  console.error("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first (see README → Call booking).");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: id,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPES.join(" "),
  access_type: "offline",
  prompt: "consent",
  state,
  ...(owner ? { login_hint: owner } : {}),
})}`;

function saveToken(token) {
  const file = ".env.local";
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const line = `GOOGLE_REFRESH_TOKEN=${token}`;
  const next = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line)
    : `${text}${text && !text.endsWith("\n") ? "\n" : ""}${line}\n`;
  writeFileSync(file, next);
}

const server = createServer(async (req, res) => {
  const params = new URL(req.url ?? "/", REDIRECT).searchParams;
  if (!params.has("code") && !params.has("error")) return res.writeHead(404).end();
  const done = (msg) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`<p style="font:16px sans-serif">${msg}</p>`);
    server.close();
  };
  if (params.get("state") !== state) return done("State mismatch. Run the script again.");
  if (params.get("error")) {
    console.error(`Authorization was not granted: ${params.get("error")}`);
    return done("Authorization was cancelled. You can close this tab.");
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: params.get("code"), client_id: id, client_secret: secret, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
  });
  const data = await tokenRes.json();
  if (!data.refresh_token) {
    console.error("No refresh token returned:", data.error_description ?? data.error ?? data);
    return done("Something went wrong; check the terminal.");
  }
  const granted = (data.scope ?? "").split(" ");
  const missing = SCOPES.filter((s) => !granted.includes(s));
  saveToken(data.refresh_token);
  console.log("\n✓ Saved GOOGLE_REFRESH_TOKEN to .env.local");
  if (missing.length) console.warn(`! These permissions were not granted, so parts of booking won't work:\n  ${missing.join("\n  ")}`);
  console.log("  Add the same value to your hosting environment variables, then restart the server.\n");
  done("✓ Connected. You can close this tab and return to the terminal.");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\nOpen this link and sign in${owner ? ` as ${owner}` : ""}:\n\n${url}\n`);
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";
  execFile(opener, [url], () => {});
});
