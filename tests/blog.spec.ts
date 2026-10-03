import { expect, test } from "@playwright/test";

// The author flow needs the server's credentials:
// BLOG_TEST_EMAIL / BLOG_TEST_PASSWORD must match BLOG_ADMIN_EMAIL / BLOG_ADMIN_PASSWORD.
const email = process.env.BLOG_TEST_EMAIL;
const password = process.env.BLOG_TEST_PASSWORD;

test("visitors can browse the blog but not the editor", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("verification");
  await page.goto("/blog/new");
  await expect(page).toHaveURL(/\/blog\/login\?next=\/blog\/new$/);
  const rss = await page.request.get("/blog/rss.xml");
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
});

test("author can sign in, write, publish, edit and delete a post", async ({ page, browser }, testInfo) => {
  test.skip(!email || !password, "Set BLOG_TEST_EMAIL and BLOG_TEST_PASSWORD to run the author flow.");
  const title = `Closing coverage on a FIFO ${testInfo.project.name} ${Date.now()}`;

  await page.goto("/blog/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".auth-form [role=alert]")).toContainText("don't match");

  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.locator("header.nav").getByRole("link", { name: /Write/ }).click();

  // Required fields block an incomplete publish.
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/blog\/new$/);

  await page.getByLabel(/^Description/).fill("How assertions and cover groups closed the last FIFO holes.");
  await page.getByLabel("Topics").fill("fifo, sva");
  await page.getByLabel("Topics").press("Enter");
  await page.getByLabel("Post content (Markdown)").fill(
    "Intro with **bold** and <script>alert(1)</script>.\n\n## Plan\n\n- [x] Assertions\n- Cover groups\n\n## Result\n\n```sv\nassert property (p_full);\n```\n\n> [!TIP]\n> Standardize it."
  );
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".md-preview strong")).toHaveText("bold");
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page).toHaveURL(/\/blog\/closing-coverage-on-a-fifo/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.locator(".prose")).toContainText("<script>alert(1)</script>");
  await expect(page.locator(".prose script")).toHaveCount(0);
  await expect(page.locator(".callout-tip")).toContainText("Standardize it.");
  if (testInfo.project.name === "desktop") await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  const url = page.url().split("?")[0];

  // Visitors see the published post; a draft disappears for them.
  const visitor = await browser.newPage();
  await visitor.goto(url);
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(title);
  await visitor.goto("/blog?tag=fifo");
  await expect(visitor.getByRole("link", { name: new RegExp(title) })).toBeVisible();

  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Unpublish to draft" }).click();
  await expect(page.getByText("Draft · only you can see this")).toBeVisible();
  const res = await visitor.goto(url);
  expect(res?.status()).toBe(404);
  await visitor.close();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".blog-flash")).toHaveText("Post deleted.");
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
});

// 1×1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test("image uploads require sign-in and reject non-images", async ({ request }) => {
  const anon = await request.post("/api/blog/media", { multipart: { file: { name: "a.png", mimeType: "image/png", buffer: PNG } } });
  expect(anon.status()).toBe(401);
  expect((await request.get("/blog/media/../../package.json")).status()).toBe(404);
});

test("author tools: image paste, scheduling, highlighting, waveforms and sitemap", async ({ page, browser }, testInfo) => {
  test.skip(!email || !password, "Set BLOG_TEST_EMAIL and BLOG_TEST_PASSWORD to run the author flow.");
  await page.goto("/blog/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/blog$/);

  // Upload API: SVG (script-capable) is refused even when labelled as PNG; a real PNG is stored and served.
  const svg = await page.request.post("/api/blog/media", {
    multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") } },
  });
  expect(svg.status()).toBe(415);
  const up = await page.request.post("/api/blog/media", { multipart: { file: { name: "dot.png", mimeType: "image/png", buffer: PNG } } });
  const { url } = await up.json();
  expect(url).toMatch(/^\/blog\/media\/[a-f0-9]{20}\.png$/);
  const served = await page.request.get(url);
  expect(served.headers()["content-type"]).toBe("image/png");

  const title = `Scheduled waveform post ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/blog/new");
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel(/^Description/).fill("Checks highlighting, timing diagrams and scheduling.");
  const editor = page.getByLabel("Post content (Markdown)");
  await editor.fill("Intro.\n\n```sv\nassert property (@(posedge clk) req |-> ack);\n```\n\n```wave\n# Handshake\nclk : p.....\nreq : 0.1..0\n```\n");

  // Paste an image straight into the editor.
  await editor.focus();
  await editor.press("End");
  await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "pasted-diagram.png", { type: "image/png" }));
    document.querySelector("textarea.md-input")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  }, PNG.toString("base64"));
  await expect(editor).toHaveValue(/!\[pasted diagram\]\(\/blog\/media\/[a-f0-9]{20}\.png\)/);

  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.locator(".md-preview .tok-k").first()).toHaveText("assert");
  await expect(page.locator(".md-preview .wave svg")).toHaveAttribute("aria-label", "Handshake");

  // Schedule two days out: the author sees it, visitors don't.
  const later = new Date(Date.now() + 2 * 86_400_000);
  const local = new Date(later.getTime() - later.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  await page.locator(".publish-at input").fill(local);
  await page.getByRole("button", { name: "Schedule" }).click();
  await expect(page.getByText(/Scheduled · goes live/)).toBeVisible();
  await expect(page.locator(".prose .wave")).toBeVisible();
  const postUrl = page.url().split("?")[0];

  const visitor = await browser.newPage();
  expect((await visitor.goto(postUrl))?.status()).toBe(404);
  await visitor.goto("/blog");
  await expect(visitor.getByText(title)).toHaveCount(0);
  const sitemap = await (await visitor.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/blog");
  expect(sitemap).not.toContain(postUrl.split("/blog/")[1]);
  await visitor.close();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".blog-flash")).toHaveText("Post deleted.");
});

test("author dashboard lists posts by status with edit, publish and delete", async ({ page }, testInfo) => {
  test.skip(!email || !password, "Set BLOG_TEST_EMAIL and BLOG_TEST_PASSWORD to run the author flow.");
  expect((await page.goto("/blog/manage"))?.url()).toMatch(/\/blog\/login\?next=\/blog\/manage$/);
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/blog\/manage$/);

  // Create a draft from the dashboard's "New post" button.
  const title = `Dashboard draft ${testInfo.project.name} ${Date.now()}`;
  await page.getByRole("link", { name: "+ New post" }).first().click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel(/^Description/).fill("Created to test the dashboard.");
  await page.getByLabel("Post content (Markdown)").fill("Body.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft · only you can see this")).toBeVisible();

  await page.goto("/blog/manage");
  const tab = (name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
  const row = page.locator(".manage-row", { hasText: title });
  await tab("Drafts").click();
  await expect(row).toBeVisible();
  await tab("Published").click();
  await expect(row).toHaveCount(0);

  // Publish from the list, then find it under Published.
  await tab("All").click();
  await row.getByRole("button", { name: `Publish ${title}` }).click();
  await expect(page.locator(".blog-flash")).toHaveText("Post published.");
  await tab("Published").click();
  await expect(row.locator(".badge").first()).toHaveText("Published");

  // Edit opens the editor for that post.
  await row.getByRole("link", { name: `Edit ${title}` }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await page.goto("/blog/manage");

  // Unpublish, then delete, both returning to the dashboard.
  await row.getByRole("button", { name: `Unpublish ${title}` }).click();
  await expect(page.locator(".blog-flash")).toHaveText("Post moved to drafts.");
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: `Delete ${title}` }).click();
  await expect(page).toHaveURL(/\/blog\/manage\?deleted=1$/);
  await expect(page.locator(".blog-flash")).toHaveText("Post deleted.");
  await expect(row).toHaveCount(0);
});
