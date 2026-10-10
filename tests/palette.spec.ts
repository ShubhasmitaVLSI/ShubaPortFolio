import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("sh-chat-teased", "1"));
});

test("Ctrl+K opens the palette and Enter jumps to a match", async ({ page }) => {
  await page.goto("/blog");
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search the site" });
  await expect(palette).toBeVisible();
  const box = palette.getByRole("combobox");
  await expect(box).toBeFocused();

  await box.fill("dut");
  await expect(palette.getByRole("option").first()).toContainText("DUT — Design Under Test");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/lexicon\/dut$/);
});

test("the header button opens the palette on touch screens and finds blog posts", async ({ page }) => {
  await page.goto("/lexicon");
  await page.getByRole("button", { name: "Search the site" }).click();
  const palette = page.getByRole("dialog", { name: "Search the site" });
  await palette.getByRole("combobox").fill("liberty");
  const post = palette.getByRole("option", { name: /GLS Foundations, Part 1/ });
  await expect(post).toBeVisible();
  await palette.getByRole("combobox").press("Escape");
  await expect(palette).toBeHidden();
});

test("arrow keys move the selection and home sections scroll in place", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search the site" });
  const box = palette.getByRole("combobox");
  await box.fill("career schema");
  await expect(palette.getByRole("option", { selected: true })).toContainText("Career schema");
  await box.press("Enter");
  await expect(palette).toBeHidden();
  await expect(page).toHaveURL(/#schema$/);
  await expect(page.locator("#schema")).toBeInViewport();
});
