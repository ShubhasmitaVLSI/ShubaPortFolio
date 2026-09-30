import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1"));
});

test("home loads without runtime errors and fits the viewport", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".boot")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Shubhasmita");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "circuit");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/home-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test("atlas selection opens the matching archive case", async ({ page }) => {
  await page.goto("/");
  const atlas = page.locator(".atlas-compact");
  await atlas.getByRole("button", { name: /TIMING & GLS/ }).click();
  await expect(atlas.locator(".atlas-detail h3")).toHaveText("GLS-SDF & Timing-Aware Debug");
  await atlas.screenshot({ path: `test-results/atlas-${test.info().project.name}.png` });
  await atlas.getByRole("link", { name: /Explore case file/ }).click();
  await expect(page).toHaveURL(/\/projects#project-03$/);
  await expect(page.locator("#project-03")).toBeVisible();
  await expect(page.locator(".archive-item")).toHaveCount(5);
  await expect(page.locator("#top")).toHaveCount(1);
});

test("theme persists and primary navigation works", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: /Clean Room/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "wafer");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "wafer");
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  if (testInfo.project.name === "mobile") await expect(page.locator("header.nav")).not.toHaveClass(/open/);
});

test("project modal traps keyboard focus and restores it", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".rail .card").first();
  await card.click();
  const dialog = page.getByRole("dialog", { name: "IP Verification" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});

test("ER selection, reset and glossary respond", async ({ page }) => {
  await page.goto("/");
  const table = page.locator(".ent-head").nth(1);
  await table.scrollIntoViewIfNeeded();
  await table.focus();
  await page.keyboard.press("Enter");
  await expect(table.locator("..")).toHaveClass(/sel/);
  await expect(page.locator(".sql-table")).toBeVisible();
  await page.getByRole("button", { name: /Reset layout/ }).click();
  const flip = page.locator(".flip").first();
  await flip.click();
  await expect(flip).toHaveAttribute("aria-pressed", "true");
  await flip.click();
  await expect(flip).toHaveAttribute("aria-pressed", "false");
});

test("skill tree can collapse and inspect a skill", async ({ page }, testInfo) => {
  await page.goto("/");
  const mobile = testInfo.project.name === "mobile";
  const branch = page.locator(mobile ? ".tl-branch" : ".tn.branch").first();
  await branch.click();
  const leaf = page.locator(mobile ? ".tl-leaf" : ".tn.leaf").first();
  await expect(leaf).not.toBeVisible();
  await branch.click();
  await leaf.click();
  await expect(page.locator(".inspector-body h3")).toHaveText("SystemVerilog / UVM");
});

test("chat answers, restores conversation, and resets", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByRole("button", { name: /Ask about Shubhasmita/ }).click();
  await page.getByRole("textbox", { name: "Your question" }).fill("How can I contact Shubhasmita?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chat-log .chat-msg.assistant").last()).toContainText("linkedin.com");
  await page.reload();
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByRole("button", { name: /Ask about Shubhasmita/ }).click();
  await expect(page.locator(".chat-log .chat-msg.user")).toHaveCount(1);
  await page.getByRole("button", { name: "Start a new conversation" }).click();
  await expect(page.locator(".chat-log .chat-msg.user")).toHaveCount(0);
});

test("chat rejects invalid payloads", async ({ request }) => {
  for (const data of [null, {}, { messages: [] }, { messages: [{ role: "user", parts: [null, { type: "text", text: "" }] }] }]) {
    const response = await request.post("/api/chat", { data });
    expect(response.status()).toBe(400);
  }
});

test("chat streams an answer about verification work", async ({ request }) => {
  const response = await request.post("/api/chat", {
    data: { messages: [{ id: "verification-question", role: "user", parts: [{ type: "text", text: "Tell me about GLS-SDF" }] }] },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/event-stream");
  expect(await response.text()).toContain("text-delta");
});

test("reduced motion keeps role readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".role")).toContainText("Design Verification Engineer");
  await expect(page.locator(".atlas-compact")).toBeVisible();
});

test("all themes can be selected", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const name of ["Circuit Atlas", "Nebula Netlist", "Orchid Assertion", "Rosé Gold Die", "Silicon Sign-off", "Phosphor Waveform", "Thermal Corner", "Blush Wafer", "Lilac Liberty", "Clean Room"]) {
    await page.getByRole("button", { name: "Change theme" }).click();
    const option = page.getByRole("menuitemradio", { name: new RegExp(name) });
    await option.click();
    await page.getByRole("button", { name: "Change theme" }).click();
    await expect(option).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
  }
});

test("project carousel advances and returns", async ({ page }) => {
  await page.goto("/");
  const rail = page.locator(".rail");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(() => rail.evaluate(el => el.scrollLeft)).toBeGreaterThan(200);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect.poll(() => rail.evaluate(el => el.scrollLeft)).toBeLessThan(8);
});

test("internal anchors resolve and loaded assets succeed", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await page.goto("/");
  await expect(page.locator(".boot")).toHaveCount(0);
  const missing = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute("href")!).filter(href => href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1)))));
  expect(missing).toEqual([]);
  expect(failed).toEqual([]);
});

test("ER dragging updates position and reset restores it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Drag checked with a desktop pointer; mobile selection is checked separately.");
  await page.goto("/");
  const entity = page.locator(".ent").first();
  const header = entity.locator(".ent-head");
  await header.scrollIntoViewIfNeeded();
  await expect(page.locator(".er")).toHaveClass(/shown/);
  await header.evaluate(async el => {
    const animations: Animation[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) animations.push(...node.getAnimations());
    await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  });
  // Wait for the entrance animation and scrolling to settle before measuring.
  await header.click({ trial: true });
  await header.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
  const initial = await entity.evaluate(el => (el as HTMLElement).style.left);
  const rect = await header.boundingBox();
  if (!rect) throw new Error("Entity header has no bounds");
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 65, rect.y + rect.height / 2 + 25, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => entity.evaluate(el => (el as HTMLElement).style.left)).not.toBe(initial);
  await page.getByRole("button", { name: /Reset layout/ }).click();
  await expect.poll(() => entity.evaluate(el => (el as HTMLElement).style.left)).toBe(initial);
  await page.locator(".er").screenshot({ path: "test-results/er-desktop.png" });
});
