# Shubhasmita Sahoo — Portfolio

Next.js 15 App Router, React 19, TypeScript, and CSS. Requires Node.js 22 or newer.

## Develop

```sh
npm ci
npm run dev
```

`next dev` builds into `.next-dev/` and `next build` / `next start` use `.next/`, so a dev server can stay running while you build and check production.

## Content and design

- Profile, links, projects, experience, education and the rest of the home-page copy: `lib/data.ts`.
- Home page: `app/page.tsx` lists the sections in order; each section's markup lives in `components/` (`Section.tsx` is the shared heading layout).
- Skill hierarchy and career ER schema: `lib/structure.ts`.
- DV glossary and phase navigation: `lib/dv.ts`.
- Circuit Atlas: `components/CircuitAtlas.tsx`; connected expertise nodes open matching project archive entries.
- Ten persisted themes, with Circuit Atlas (copper/teal) as the default.
- Animated netlist, signal traces, draggable ER entities, skill inspector, glossary flip cards, project dialogs, and scroll effects. Reduced-motion preferences are supported.
- To add a portrait, put `profile.jpg` in `public/` and set `profile.image` to `/profile.jpg` in `lib/data.ts`. Otherwise the monogram is displayed without requesting a missing image.

## Blog

`/blog` lists posts with search (press `/`), topic filters, a featured post and an RSS feed at `/blog/rss.xml`. Each post page has a table of contents, code copy buttons, share links, related posts and article metadata for search engines.

**Writing.** Set `BLOG_ADMIN_EMAIL`, `BLOG_ADMIN_PASSWORD` (8+ characters) and `BLOG_AUTH_SECRET` (32+ characters, for example `openssl rand -base64 32`) in `.env.local` or the hosting environment, then sign in at `/blog/login`. Only that one author account can write. The editor has a formatting toolbar, live and split Markdown preview, tags, an optional cover image URL, draft/publish, and ⌘S / Ctrl+S to save. It also autosaves to the browser so a closed tab or expired session doesn't lose work. Drafts are visible only to the signed-in author. Changing the password or secret signs out every session.

Markdown supports headings, emphasis, links, images with captions, lists, checklists, tables, fenced code, quotes and callouts (`> [!TIP]`, `NOTE`, `IMPORTANT`, `WARNING`, `CAUTION`). All text is escaped, so raw HTML in a post shows as text.

Editor extras:
- **Images:** paste, drag-drop or click 🖼 to upload into the post, or upload a cover. Photos are downscaled to WebP (max 1800 px) in the browser. The server accepts only real PNG, JPEG, WebP or GIF data (checked by content, never SVG) up to 4 MB, and stores it beside the posts.
- **Code highlighting** for ` ```sv ` (SystemVerilog/UVM/SVA), ` ```py `, ` ```tcl ` and ` ```sh `.
- **Timing diagrams:** in a ` ```wave ` block, write one signal per line, e.g. `clk : p......` or `data : x.=.=x | A5 3C`. Use `p`/`n` for clocks, `0`/`1` for levels, `x` for unknown, `z` for high-impedance, `=` for a bus value and `.` to hold. A `# line` becomes the caption. The ∿ toolbar button inserts an example.
- **Scheduling:** set a future *Publish date* and click **Schedule**. The post stays hidden from visitors, RSS and the sitemap until then, then appears with no further action.

`/sitemap.xml` and `/robots.txt` list the public pages and live posts. Set `SITE_URL` so they use the production domain.

**Storage.** By default, posts are JSON files in `content/blog/` (or `BLOG_DIR`). That works for local writing and Node hosts with a writable disk, and posts written locally can be committed and deployed. Serverless hosts such as Vercel have a read-only disk: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or Vercel KV's `KV_REST_API_URL` / `KV_REST_API_TOKEN`) to store posts in Redis and publish from the live site.

Sign-in attempts are limited per server instance (5 failures per 15 minutes per IP).

## Call booking

"Let's talk", "Book a call" and the chat's **Book** tab open a scheduler at `/book`. Visitors pick a 30-minute slot between 6:30 and 10:00 PM IST, for any day in the next 14 days. Times show in IST with the visitor's local time alongside. Visitors then enter their name, email, an optional company, a topic and a note. On submit, the server:

1. Rechecks the owner's Google Calendar free/busy, so a slot can't be double-booked.
2. Creates the event on the owner's calendar with a Google Meet link. Google emails the invitation to the visitor.
3. Emails the owner the visitor's details, the Meet link and a link to the event. Replying to that email reaches the visitor.

Times already busy on the calendar show as "Booked". The chatbot recognizes requests to meet or schedule time and offers a "Pick a time" shortcut.

**Connect Google (one time, about 10 minutes):**

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project. Enable **Google Calendar API** and **Gmail API**.
2. Open **Google Auth Platform**. Set up branding with app name "Portfolio bookings" and your email. Choose audience **External**, then click **Publish app** to move it to *In production*. A *Testing* app's tokens expire after 7 days, which would silently stop bookings. Google labels the app "unverified", which is fine because only you sign in to it.
3. Under **Clients**, create an OAuth client of type **Desktop app**. Copy its ID and secret into `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and set `BOOKING_OWNER_EMAIL`.
4. Run `npm run google:auth` and sign in as the owner. On the "unverified app" screen, choose *Advanced → Go to Portfolio bookings*, then allow all three permissions. The script saves `GOOGLE_REFRESH_TOKEN` to `.env.local`.
5. Add the same four variables to the hosting environment and redeploy.

The permissions used are: create events on calendars you own, view free/busy, and send email. No calendar contents are read. Without Google configured, the booking page shows a LinkedIn fallback. `BOOKING_DRY_RUN=1` previews the full flow locally without scheduling anything. Booking submissions are limited per server instance (4 per IP per hour), and a hidden form field rejects simple bots.

## Chat

The `/api/chat` route supports optional Gemini and Groq providers. Copy `.env.example` to `.env.local` and configure keys only on the server. Without keys, the assistant answers from the portfolio knowledge. Local environment files are ignored by Git.

Rate limiting is best-effort per server instance. If enabling paid providers on a public deployment, configure provider budget limits and a shared rate limiter at the hosting layer. Live provider responses require valid credentials; local fallback is covered by browser checks.

## Verify

```sh
npm run typecheck
npm run build
npm audit
npm run start -- --port 3100
```

In another terminal, run `npm run test:e2e`. Run with `BOOKING_DRY_RUN=1` on the server and in the test environment to cover booking submission without creating events. To include the blog author flow, start the server with blog credentials and set `BLOG_TEST_EMAIL` and `BLOG_TEST_PASSWORD` to the same values. The tests use locally installed Microsoft Edge and cover desktop and mobile viewports. Without Edge, set `PW_CHANNEL=chromium` to use Playwright's bundled Chromium (`npx playwright install chromium`). `TEST_BASE_URL` can point tests to another running instance.

The suite checks navigation, all themes, persistence, atlas-to-project links, modal keyboard behavior, skill collapse and inspection, ER selection/drag/reset, glossary interaction, carousel controls, chat persistence/reset, invalid API payloads, asset responses, responsive overflow, and reduced motion. Screenshots and failure traces are written to `test-results/` (ignored by Git). Mobile checks use Chromium emulation, not physical iOS Safari.

When a development server is already running, use a separate output directory for production verification. PowerShell:

```powershell
$env:NEXT_DIST_DIR='.next-production'
npm run build
npm run start -- --port 3100
```

Use the same `NEXT_DIST_DIR` for both build and start. Default deployments can omit it.

## Deploy

Import the repository into Vercel with the Next.js preset, or use a Node.js host that runs `npm ci`, `npm run build`, and `npm start`. Configure Node.js 22 or newer and optional provider keys in the hosting environment. A static-only host cannot run `/api/chat`.

PostCSS is overridden to a patched 8.5.x release; retain the lockfile and run the build and audit after dependency changes. The app sends nosniff, same-origin framing, and strict-origin referrer headers.
