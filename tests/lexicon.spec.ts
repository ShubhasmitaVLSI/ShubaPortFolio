import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1"));
});

test("the navbar leads to the DV Lexicon and its DUT guide", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Menu" }).click();
  const nav = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(nav.getByRole("link", { name: "Schema" })).toHaveCount(0);
  await nav.getByRole("link", { name: "Lexicon", exact: true }).click();
  await expect(page).toHaveURL(/\/lexicon$/);
  await page.getByRole("link", { name: /DUT — Design Under Test/ }).click();
  await expect(page).toHaveURL(/\/lexicon\/dut$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Design Under Test");
  await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link")).toHaveCount(8);
});

test("the boundary diagram switches between RTL and gate-level DUT", async ({ page }) => {
  await page.goto("/lexicon/dut");
  const diagram = page.locator(".boundary");
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram.locator(".bd-blocks")).toContainText("Storage array");
  await diagram.getByRole("button", { name: "Gate-level DUT" }).click();
  await expect(diagram).toHaveAttribute("data-mode", "gls");
  await expect(diagram.locator(".bd-blocks")).toContainText("dfxtp");
});

test("the knowledge check scores answers and can be retried", async ({ page }) => {
  await page.goto("/lexicon/dut#knowledge-check");
  const quiz = page.locator(".quiz");
  const q = (n: number) => quiz.locator(".quiz-q").nth(n);

  await q(0).getByRole("button", { name: /FIFO read pointer/ }).click();
  await expect(q(0)).toHaveClass(/is-right/);
  await q(1).getByRole("button", { name: /Waive it/ }).click();
  await expect(q(1)).toHaveClass(/is-wrong/);
  await expect(q(1).locator(".quiz-why")).toContainText("The answer is C");
  // An answered question is locked.
  await expect(q(1).getByRole("button", { name: /Trace first X/ })).toHaveAttribute("aria-disabled", "true");
  await q(2).getByRole("button", { name: /Accepted writes and reads/ }).click();
  await q(3).getByRole("button", { name: "False" }).click();
  await expect(quiz.locator(".quiz-score")).toContainText("3 of 4 correct");

  await quiz.getByRole("button", { name: "Retry" }).click();
  await expect(quiz.locator(".quiz-score")).toContainText("0 of 4 answered");
});
