import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }, testInfo) => { if (!testInfo.title.includes("teaser steps aside")) await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1")); });
test("assistant uses the current page and restores keyboard focus", async ({ page }) => {
  for (const [url, label] of [["/lexicon", "the DV Lexicon"], ["/blog", "the verification blog"], ["/book", "call booking"]]) {
    await page.goto(url);
    await page.getByRole("button", { name: "Open chat", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Chat with Shubhasmita's assistant" });
    await expect(dialog.locator(".chat-context")).toContainText(label);
    await expect(dialog.getByRole("button", { name: "Close chat", exact: true })).toBeFocused();
    await dialog.getByRole("button", { name: "Close chat", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open chat", exact: true })).toBeFocused();
  }
});
test("failed chat can retry without duplicating the question", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/chat", async route => { if (++calls === 1) await route.fulfill({ status: 503, body: "Unavailable" }); else await route.continue(); });
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByRole("button", { name: /Ask about Shubhasmita/ }).click();
  await page.getByRole("textbox", { name: "Your question" }).fill("How can I contact Shubhasmita?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Retry last question" }).click();
  await expect(page.locator(".chat-log .chat-msg.assistant").last()).toContainText("linkedin.com");
  await expect(page.locator(".chat-log .chat-msg.user")).toHaveCount(1);
});
test("a pending response can be stopped and motion preferences are respected", async ({ page }) => {
  await page.route("**/api/chat", route => route.fulfill({ status: 200, contentType: "text/event-stream", body: 'data: {"type":"start","messageId":"qa"}\n\ndata: {"type":"text-start","id":"qa-text"}\n\n' }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByRole("button", { name: /Ask about Shubhasmita/ }).click();
  await expect(page.locator(".chat-msg").first()).toHaveCSS("animation-name", "none");
  // Hold a network request until Stop cancels it.
  await page.unroute("**/api/chat");
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/chat", async route => { await held; await route.abort().catch(() => {}); });
  await page.getByRole("textbox", { name: "Your question" }).fill("Tell me about GLS-SDF");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop response" })).toBeVisible();
  await page.getByRole("button", { name: "Stop response" }).click();
  release();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeVisible();
});
test("chat teaser steps aside when the theme menu opens", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.removeItem("sh-chat-teased"));
  await page.reload();
  await expect(page.locator(".chat-teaser")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect(page.locator(".chat-teaser")).toHaveCount(0);
  await page.getByRole("menuitemradio", { name: /Clean Room/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "wafer");
});

test("author navigation remains reachable within the viewport", async ({ page }, testInfo) => {
  test.skip(!process.env.BLOG_TEST_EMAIL || !process.env.BLOG_TEST_PASSWORD, "Requires isolated author QA credentials.");
  await page.goto("/blog/login");
  await page.getByLabel("Email").fill(process.env.BLOG_TEST_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(process.env.BLOG_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  const nav = page.locator("header.blog-header");
  for (const label of ["Manage", "Visitors", "Write"]) {
    const link = nav.getByRole("link", { name: new RegExp(label) });
    await expect(link).toBeInViewport();
    const box = await link.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.screenshot({ path: "test-results/author-header-" + testInfo.project.name + ".png" });
});

test("offline assistant answers glossary questions from published definitions", async ({ request }) => {
  for (const [question, answer] of [["What is UVM?", "Universal Verification Methodology"], ["What is SVA?", "SystemVerilog Assertions"], ["What is coverage closure?", "Functional + code coverage closure"]]) {
    const res = await request.post("/api/chat", { data: { messages: [{ id: "glossary-question", role: "user", parts: [{ type: "text", text: question }] }] } });
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain(answer);
  }
});
