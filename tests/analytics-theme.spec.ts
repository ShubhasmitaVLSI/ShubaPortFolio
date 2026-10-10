import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const email = "analytics-qa@example.invalid";
const password = "analytics-qa-password";
const secret = "analytics-qa-secret-at-least-thirty-two-characters";
test.use({ userAgent: "Mozilla/5.0 Chrome/130.0 Safari/537.36" });
test.beforeEach(async ({ page }) => { await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1")); });
async function author(page: import("@playwright/test").Page) {
  test.skip(process.env.ANALYTICS_TEST_AUTH !== "1", "Use the isolated analytics QA server for author checks.");
  const body = Buffer.from(JSON.stringify({ sub: email, exp: Date.now() + 3600000 })).toString("base64url");
  const sig = createHmac("sha256", secret + "\u0000" + password).update(body).digest("base64url");
  await page.context().addCookies([{ name: "blog_session", value: body + "." + sig, url: base, httpOnly: true, sameSite: "Lax" }]);
}
test("theme cycles after five minutes and manual selection restarts timer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".boot")).toHaveCount(0);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.clock.fastForward(300000);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nebula");
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect(page.getByRole("menuitemradio", { name: /Nebula Netlist/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitemradio", { name: /Clean Room/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "wafer");
  await page.clock.fastForward(299000);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "wafer");
  await page.clock.fastForward(1000);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "circuit");
  expect(await page.evaluate(() => document.documentElement.classList.contains("theme-anim"))).toBe(false);
});
test("automatic themes can be paused and preference persists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemcheckbox", { name: /Auto theme/ }).click();
  await page.clock.fastForward(600000);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "circuit");
  await page.reload();
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect(page.getByRole("menuitemcheckbox", { name: /Auto theme/ })).toHaveAttribute("aria-checked", "false");
});
test("analytics dashboard is private and collection validates requests", async ({ page, request }) => {
  await page.goto("/blog/visitors");
  await expect(page).toHaveURL(/\/blog\/login\?next=\/blog\/visitors$/);
  const headers = { origin: base, "user-agent": "Mozilla/5.0 Chrome/130.0" };
  expect((await request.get("/api/visits")).status()).toBe(405);
  expect((await request.post("/api/visits", { headers: { ...headers, origin: "https://untrusted.invalid" }, data: { path: "/" } })).status()).toBe(403);
  expect((await request.post("/api/visits", { headers, data: { path: "/?email=private" } })).status()).toBe(400);
  expect((await request.post("/api/visits", { headers, data: { path: "/projects", referrer: "example.org" } })).status()).toBe(204);
  expect((await request.post("/api/visits", { headers: { ...headers, dnt: "1" }, data: { path: "/lexicon/do-not-track" } })).status()).toBe(204);
  await author(page);
  await page.goto("/blog/visitors");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Visitor analytics");
  await expect(page.locator("main")).toContainText("example.org");
  await expect(page.locator("main")).not.toContainText("/lexicon/do-not-track");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("author can switch animated day week month charts", async ({ page }, testInfo) => {
  await author(page);
  await page.goto("/blog/visitors");
  let total: number | undefined;
  for (const mode of ["Day", "Week", "Month"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await expect(page.getByRole("button", { name: mode, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", { name: new RegExp("Visitors and page views by " + mode.toLowerCase()) })).toBeVisible();
    const sum = await page.locator(".visitor-chart tbody tr td:last-child").evaluateAll(cells => cells.reduce((n, cell) => n + Number(cell.textContent), 0));
    if (total === undefined) total = sum;
    expect(sum).toBe(total);
  }
  await page.getByText("View as table", { exact: true }).click();
  await expect(page.locator(".visitor-chart table")).toBeVisible();
  await page.locator(".visitor-chart").evaluate(async el => { await Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))); });
  await page.screenshot({ path: "test-results/visitors-" + testInfo.project.name + ".png", fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".an-bar").first()).toHaveCSS("animation-name", "none");
});

test("charts run from the first recorded day, beyond the 30-day detail window", async ({ page }) => {
  test.skip(!process.env.ANALYTICS_DIR, "Point ANALYTICS_DIR at the analytics QA server's data folder.");
  await author(page);
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const launch = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
  const file = path.join(process.env.ANALYTICS_DIR!, "daily-totals.json");
  const saved = await fs.readFile(file, "utf8").catch(() => "{}");
  await fs.mkdir(process.env.ANALYTICS_DIR!, { recursive: true });
  await fs.writeFile(file, JSON.stringify({ ...JSON.parse(saved), [launch]: 7 }));
  try {
    await page.goto("/blog/visitors?range=all");
    await expect(page.locator(".an-sub").first()).toContainText("since " + launch);
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await expect(page.locator(".visitor-chart tbody tr").first().locator("td").first()).toHaveText(launch.slice(0, 7));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await fs.writeFile(file, saved);
  }
});

test("dashboard turns visits into sources, places, reading time, searches and live activity", async ({ page, request }) => {
  test.skip(process.env.ANALYTICS_TEST_AUTH !== "1", "Use the isolated analytics QA server for author checks.");
  const visitor = {
    origin: base,
    "user-agent": "Mozilla/5.0 (iPhone) Mobile Chrome/130.0",
    "x-forwarded-for": "203.0.113.7",
    "x-vercel-ip-country": "IN",
    "x-vercel-ip-city": "Bengaluru",
  };
  const query = "uvm ral " + Date.now().toString(36).replace(/\d/g, "");
  expect((await request.post("/api/visits", { headers: visitor, data: { path: "/lexicon/dut", referrer: "www.linkedin.com" } })).status()).toBe(204);
  expect((await request.post("/api/visits", { headers: visitor, data: { type: "engage", path: "/lexicon/dut", seconds: 95, depth: 100 } })).status()).toBe(204);
  expect((await request.post("/api/visits", { headers: visitor, data: { type: "search", path: "/lexicon/dut", q: query, hits: 0 } })).status()).toBe(204);
  // Personal-looking searches are dropped, not stored.
  expect((await request.post("/api/visits", { headers: visitor, data: { type: "search", path: "/", q: "me@example.com", hits: 0 } })).status()).toBe(204);
  expect((await request.post("/api/visits", { headers: visitor, data: { type: "engage", path: "/", seconds: "lots", depth: 10 } })).status()).toBe(400);

  await author(page);
  await page.goto("/blog/visitors?range=7d");
  await expect(page.locator(".an-card", { hasText: "Where visits come from" })).toContainText("LinkedIn");
  await expect(page.locator(".an-card", { hasText: "Where visitors are" })).toContainText("India");
  await expect(page.locator(".an-card", { hasText: "Where visitors are" })).toContainText("Bengaluru");
  await expect(page.locator(".an-pages")).toContainText("DUT");
  const searches = page.locator(".an-searches");
  await expect(searches.locator("li", { hasText: query })).toContainText("No results");
  await expect(searches).not.toContainText("example.com");
  await expect(page.locator(".an-feed li").first()).toContainText("Bengaluru, India");
  await expect(page.locator(".an-tile", { hasText: "Live now" }).locator(".an-tile-value")).not.toHaveText("0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
