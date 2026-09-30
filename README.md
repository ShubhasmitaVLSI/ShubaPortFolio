# Shubhasmita Sahoo — Portfolio

Next.js 15 App Router, React 19, TypeScript, and CSS. Requires Node.js 22 or newer.

## Develop

```sh
npm ci
npm run dev
```

## Content and design

- Profile, links, projects, and experience: `lib/data.ts`.
- Skill hierarchy and career ER schema: `lib/structure.ts`.
- DV glossary and phase navigation: `lib/dv.ts`.
- Circuit Atlas: `components/CircuitAtlas.tsx`; connected expertise nodes open matching project archive entries.
- Ten persisted themes, with Circuit Atlas (copper/teal) as the default.
- Animated netlist, signal traces, draggable ER entities, skill inspector, glossary flip cards, project dialogs, and scroll effects. Reduced-motion preferences are supported.
- To add a portrait, put `profile.jpg` in `public/` and set `profile.image` to `/profile.jpg` in `lib/data.ts`. Otherwise the monogram is displayed without requesting a missing image.

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

In another terminal, run `npm run test:e2e`. The tests use locally installed Microsoft Edge and cover desktop and mobile viewports. Install Edge if it is unavailable, or change `channel` in `playwright.config.ts` to an installed Playwright browser. `TEST_BASE_URL` can point tests to another running instance.

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
