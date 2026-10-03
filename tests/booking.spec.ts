import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1"));
});

const IST = 330 * 60_000;
const istMinutes = (iso: string) => {
  const d = new Date(Date.parse(iso) + IST);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

test("availability is 30-minute slots from 6:30 to 10:00 PM IST", async ({ request }) => {
  const res = await request.get("/api/booking");
  expect(res.ok()).toBe(true);
  const { days } = (await res.json()) as { days: { slots: { start: string }[] }[] };
  expect(days.length).toBeGreaterThan(0);
  for (const day of days.slice(1)) expect(day.slots.map((s) => istMinutes(s.start))).toEqual([1110, 1140, 1170, 1200, 1230, 1260, 1290]);
});

test("booking API rejects invalid input, unknown slots and bots", async ({ request }) => {
  const bad = await request.post("/api/booking", { data: { start: "x", name: "", email: "nope", topic: "" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).fields).toMatchObject({ name: expect.any(String), email: expect.any(String), topic: expect.any(String) });

  const valid = { name: "Test Visitor", email: "visitor@example.com", company: "", topic: "Career opportunity", message: "" };
  const offGrid = await request.post("/api/booking", { data: { ...valid, start: "2030-01-01T13:15:00.000Z" } });
  expect(offGrid.status()).toBe(409);
  const bot = await request.post("/api/booking", { data: { ...valid, start: "2030-01-01T13:00:00.000Z", website: "spam" } });
  expect(bot.status()).toBe(400);
});

test("Let's talk leads to booking, and no GitHub links remain", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Let's talk" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("30-minute");
});

test("a visitor can pick a slot and book (dry run)", async ({ page, request }) => {
  const { configured } = await (await request.get("/api/booking")).json();
  test.skip(!configured, "Start the server with BOOKING_DRY_RUN=1 or Google credentials.");
  test.skip(!process.env.BOOKING_TEST_SUBMIT && !process.env.BOOKING_DRY_RUN, "Submitting would create a real calendar event.");

  await page.goto("/book");
  // The site clips horizontal overflow, so check the card itself fits the viewport.
  const box = (await page.locator(".book-card").boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const continueBtn = page.getByRole("button", { name: /Continue/ });
  await expect(continueBtn).toBeDisabled();
  const slot = page.locator(".slot:not(:disabled)").first();
  await slot.click();
  // The selected slot keeps dark text on the accent fill even while hovered.
  const accentInk = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("span"));
    probe.style.color = "var(--accent-ink)";
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect.poll(() => slot.evaluate((el) => getComputedStyle(el).color)).toBe(accentInk);
  await continueBtn.click();

  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.locator(".booking-form .field-error").first()).toBeVisible();

  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email for the invitation").fill("visitor@example.com");
  await page.getByRole("button", { name: "Career opportunity" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText("You're booked, Test!")).toBeVisible();
  await expect(page.getByRole("link", { name: /Google Meet link/ })).toHaveAttribute("href", /meet\.google\.com/);
});

test("the chatbot offers booking and opens the slot picker", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat", exact: true }).click();
  await page.getByRole("button", { name: /Ask about Shubhasmita/ }).click();
  await page.getByRole("textbox", { name: "Your question" }).fill("Can I schedule a call with her?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".chat-log .chat-msg.assistant").last()).toContainText("6:30 PM");
  await page.getByRole("button", { name: /Pick a time with Shubhasmita/ }).click();
  await expect(page.locator(".chat-book .booking")).toBeVisible();
  await expect(page.locator(".chat-book").getByText("Pick a day and time")).toBeVisible();
});
