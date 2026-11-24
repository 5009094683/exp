# AgentOS website

The company website for AgentOS, an infrastructure product for running autonomous AI agents:
a marketing site, a clickable demo of the product console, a documentation preview and legal
pages.

Every page is prerendered. The only server-side code is one small handler that receives
early-access and contact requests, so the site runs on Vercel, on Cloudflare Workers or on any
static host, with no database and no separate backend.

The product name, the company details and the accent color come from environment variables, so
the same code can be rebranded without changing any source file.

## Contents

- [Quick start](#quick-start)
- [What the site contains](#what-the-site-contains)
- [Configuration](#configuration)
- [Early-access and contact requests](#early-access-and-contact-requests)
- [Deploy to Vercel](#deploy-to-vercel)
- [Deploy to Cloudflare Workers](#deploy-to-cloudflare-workers)
- [Other static hosts](#other-static-hosts)
- [Before you launch](#before-you-launch)
- [Where to change things](#where-to-change-things)
- [Scripts and tests](#scripts-and-tests)
- [How it is built](#how-it-is-built)

## Quick start

Requirements: Node.js 22 or later and pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # optional: your own overrides; every variable has a default
pnpm dev
```

Open http://localhost:3000. Forms work in development; with no destination configured, each
request is printed to the terminal as a JSON line.

## What the site contains

| Area                  | Routes                                                                                                            | Notes                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing             | `/`, `/platform`, `/platform/*`, `/solutions/*`, `/pricing`, `/security`, `/company`, `/contact`, `/early-access` | Six capability pages and three audience pages. Pricing includes an estimator.                                                                                             |
| Demo console          | `/console/*`                                                                                                      | Overview, agents, runs with step-by-step traces, memory, integrations, policies, audit log, sandboxes, usage and settings. Runs on sample data and is labelled as a demo. |
| Documentation preview | `/docs`, `/docs/*`                                                                                                | Ten pages, each labelled as a preview.                                                                                                                                    |
| Legal                 | `/legal/privacy`, `/legal/terms`, `/legal/cookies`                                                                | Templates filled from the configuration.                                                                                                                                  |
| Sign-in               | `/signin`                                                                                                         | Explains that access is by invitation and offers the request form.                                                                                                        |
| Machine-readable      | `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/.well-known/security.txt`, `/og.png`                    | Generated from the configuration at build time.                                                                                                                           |

Actions in the demo console that would change something (deploy an agent, connect an MCP server,
save a policy, create an API key, invite a member, export audit logs) open the early-access
dialog instead.

## Configuration

All settings are environment variables, and all of them are optional. [`.env.example`](.env.example)
lists every variable with a description.

A value can come from three places. The first one that sets a variable wins:

| Source                                              | Use it for                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| The host's settings (Vercel, Cloudflare) or a shell | Values that differ per deployment, and everything private                       |
| `.env.local` (not committed)                        | Your own values during development                                              |
| [`.env`](.env) (committed)                          | Public details that are the same on every deployment, such as phone and address |

**Never put a secret in `.env`.** The file is committed, and everything in it is published on the
site anyway, so it only takes `SITE_*` settings; a unit test fails on anything else. Webhook URLs,
API keys and the other `LEADS_*` values belong in the host's settings or in `.env.local`.

`.env` currently holds the site's address, the company's phone number and its postal address.
Replace them there if they change, or if you reuse this code for another company.

Two rules apply throughout:

- **`SITE_*` values are read at build time**, because pages are prerendered. Change a value, then
  redeploy.
- **An unset value hides the related interface.** There are no placeholders: without a sales
  address there is no sales channel on the contact page, and without customers there is no
  customer strip.

| Group              | Variables                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product            | `SITE_PRODUCT_NAME`, `SITE_PRODUCT_TAGLINE`, `SITE_PRODUCT_DESCRIPTION`, `SITE_URL`, `SITE_ACCENT_COLOR`                                              |
| Company            | `SITE_COMPANY_NAME`, `SITE_COMPANY_LEGAL_NAME`, `SITE_COMPANY_ADDRESS`, `SITE_COMPANY_FOUNDED`, `SITE_COMPANY_REGISTRATION`                           |
| Contact            | `SITE_CONTACT_EMAIL`, `SITE_SALES_EMAIL`, `SITE_SUPPORT_EMAIL`, `SITE_SECURITY_EMAIL`, `SITE_PRIVACY_EMAIL`, `SITE_CONTACT_PHONE`, `SITE_BOOKING_URL` |
| Links              | `SITE_SOCIAL_X`, `SITE_SOCIAL_LINKEDIN`, `SITE_SOCIAL_GITHUB`, `SITE_SOCIAL_YOUTUBE`, `SITE_SOCIAL_DISCORD`, `SITE_STATUS_URL`, `SITE_CAREERS_URL`    |
| Announcement bar   | `SITE_ANNOUNCEMENT_TEXT`, `SITE_ANNOUNCEMENT_HREF`                                                                                                    |
| Legal pages        | `SITE_LEGAL_EFFECTIVE_DATE`, `SITE_LEGAL_JURISDICTION`                                                                                                |
| Compliance roadmap | `SITE_COMPLIANCE_SOC2`, `SITE_COMPLIANCE_ISO27001`, `SITE_COMPLIANCE_GDPR`, `SITE_COMPLIANCE_HIPAA`                                                   |
| Social proof       | `SITE_CUSTOMERS`, `SITE_TESTIMONIALS`, `SITE_TEAM`, `SITE_BACKERS`, `SITE_STATS`                                                                      |
| Search engines     | `SITE_NOINDEX`, `SITE_GOOGLE_SITE_VERIFICATION`                                                                                                       |
| Requests (runtime) | `LEADS_WEBHOOK_URL`, `RESEND_API_KEY`, `LEADS_TO_EMAIL`, `LEADS_FROM_EMAIL`, `LEADS_ALLOWED_ORIGINS`                                                  |

Notes:

- `SITE_URL` is the canonical origin. It is used for canonical links, the sitemap, social previews,
  the API host shown in the docs and the site's name for itself in the legal pages. `.env` sets
  it. Where it is unset, Vercel falls back to the project's production domain; every other host
  falls back to `http://localhost:3000` and the production build prints a warning.
- `SITE_ACCENT_COLOR` takes one hex color. Hover, text and contrast shades are derived from it,
  and the favicon, app icons and social card are generated in the same color.
- An invalid value fails the build with a message that names the variable.
- The compliance variables accept `planned`, `in-progress`, `achieved` or `hidden`. Mark a
  framework as achieved only when you hold the report or certificate.

## Early-access and contact requests

The early-access dialog, the `/early-access` page and the contact form post JSON to
`/api/early-access` and `/api/contact`. One handler, [`src/server/leads/handler.ts`](src/server/leads/handler.ts),
serves both build targets. It validates the request, drops automated submissions, then delivers
the request to every destination that is configured:

| Destination                                                          | Setting                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| Slack or Discord channel, or any endpoint that accepts a JSON `POST` | `LEADS_WEBHOOK_URL`                                       |
| Email through [Resend](https://resend.com)                           | `RESEND_API_KEY`, `LEADS_TO_EMAIL` and `LEADS_FROM_EMAIL` |

Requests are forwarded, not stored. Each one is also written to the host's logs as a JSON line
with the event `lead.received`. **With no destination configured, the log line is the only
record**, so set a destination before you share the site. Find the logs under Logs in a Vercel
project, or under Observability in a Cloudflare Worker.

Spam protection needs no third-party service: a hidden field that people leave empty, a minimum
time to fill in the form, and a check that the request comes from the site's own origin. On
Cloudflare a rate limit also caps submissions per visitor; on Vercel, add a rate limiting rule in
the firewall if you need one.

If a request cannot be sent, the form shows a prefilled email link to `SITE_CONTACT_EMAIL`. The
same fallback applies on a host with no function runtime.

## Deploy to Vercel

No configuration file is needed.

1. Import the repository at https://vercel.com/new. The Next.js preset is detected.
2. Under Settings, Environment Variables, add the `SITE_*` values you want and the `LEADS_*`
   values for your destination. The values in `.env` apply without being added here.
3. Deploy. Redeploy after changing a `SITE_*` value.

Preview deployments allow the Vercel toolbar in the content security policy; production does not.

## Deploy to Cloudflare Workers

The static build target writes the site to `out/`. [`wrangler.jsonc`](wrangler.jsonc) serves that
directory as static assets and runs [`worker/index.ts`](worker/index.ts) for `/api/*` only.

On Cloudflare, `SITE_*` values are **build variables** and `LEADS_*` values are **runtime
variables and secrets**. They are set in different places.

### From Git, with Workers Builds

1. In the Cloudflare dashboard, go to Workers & Pages, create a Worker and import the repository.
2. Set the build command to `pnpm build`. Leave the deploy command as `npx wrangler deploy` and
   the preview command as `npx wrangler preview`. The build detects Workers Builds and selects
   the static target.
3. Under Settings, Build, add the `SITE_*` values as build variables. The values in `.env` apply
   without being added here.
4. Under Settings, Variables and Secrets, add the `LEADS_*` values.

`.nvmrc` and the `packageManager` field select the Node.js and pnpm versions for the build.

### Previews of other branches

Workers Builds also builds every branch other than the production branch and deploys it as a
[Preview](https://developers.cloudflare.com/workers/previews/): a separate copy of the site at
its own address, which Cloudflare posts on the pull request. The production site does not change
until the branch is merged. A Preview is public: anyone who has its address can open it.

A Preview takes its settings from the `previews` block in `wrangler.jsonc` and inherits almost
nothing from production:

- **The block is required.** Without it `wrangler preview` stops with an error and the build of
  the branch fails.
- **Bindings are declared again.** The rate limit appears in the block under a `namespace_id` of
  its own, so requests to a Preview do not count against production's limit.
- **Production's variables and secrets do not apply.** A Preview therefore has no destination
  for requests: its forms work, and each request is only written to that Preview's logs, so
  testing a Preview does not notify anyone. To have Previews deliver requests, give them their
  own values, for example with
  `pnpm exec wrangler preview base-config secret put LEADS_WEBHOOK_URL`. A value added this way
  applies to Previews created afterwards.

Assets, the compatibility date and the observability settings come from the top level of the
file and are the same for production and Previews.

### From your machine

```bash
pnpm exec wrangler login
pnpm deploy:cf                                   # static build, then wrangler deploy
pnpm exec wrangler secret put LEADS_WEBHOOK_URL  # repeat for each runtime value
```

For a local deploy, put the `SITE_*` values in `.env.production.local` so the build can read them.

To run the Worker locally, build once with `pnpm build:static`, copy `.dev.vars.example` to
`.dev.vars` for runtime values, and start `pnpm preview:cf`.

### Things to know

- `name` in `wrangler.jsonc` is the Worker that the repository deploys to. Workers Builds always
  deploys to the Worker it is connected to, but commands run from your machine use `name`, so keep
  it equal to that Worker's name. Otherwise a deploy or `wrangler secret put` from your machine
  goes to a second Worker.
- `keep_vars` is on, so a deploy does not remove variables you added in the dashboard.
- The rate limit bindings use `namespace_id` `7301` for production and `7302` for Previews. The
  numbers only have to be unique within your account; change them if you already use them.
- To see the product name instead of the host in notification subjects, also add
  `SITE_PRODUCT_NAME` as a runtime variable.
- After you attach or change a custom domain, set `SITE_URL` in `.env` to it and redeploy.
- If Email Address Obfuscation is enabled for your zone, Cloudflare rewrites email addresses in
  the HTML, which appears as hydration warnings in the browser console. Turn it off for this
  hostname.
- The content security policy only allows the site's own origin. If you enable a Cloudflare
  feature that injects a script from another origin, such as Web Analytics, add that origin in
  [`src/config/headers.ts`](src/config/headers.ts).

## Other static hosts

`pnpm build:static` produces a complete site in `out/`, including a `_headers` file that several
static hosts read. The forms need something to answer `/api/early-access` and `/api/contact`;
without it they fall back to the email link, so set `SITE_CONTACT_EMAIL`.

## Before you launch

- Set `SITE_URL`, the company details and the contact addresses.
- Configure a destination for requests and send yourself a test request.
- **Have a lawyer review the legal pages.** They are templates that describe the site as shipped:
  two forms, one entry in the browser's local storage and no analytics. If you add analytics or
  anything else that collects data, update [`src/content/legal.ts`](src/content/legal.ts).
- Review [`src/content/pricing.ts`](src/content/pricing.ts). The site presents it as planned pricing.
- Add customers, testimonials, team members, backers and statistics only when they are real. The
  sections stay hidden until then.
- Keep the compliance statuses accurate.
- Remove `SITE_NOINDEX` from the production deployment if you used it while staging.

The site describes a product in early access. The console is labelled as a demo on every page,
the docs as a preview, and the docs contain no installation commands for packages that do not
exist yet. Keep it that way until those things are real.

## Where to change things

| To change                                  | Edit                                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Site address, phone number, postal address | `.env`                                                                                                                        |
| Names, other contact details, links, color | Environment variables (see [Configuration](#configuration))                                                                   |
| Capability and audience pages              | `src/content/capabilities.ts`, `src/content/capability-pages.ts`, `src/content/solutions.ts`, `src/content/solution-pages.ts` |
| Plans, rates and the estimator             | `src/content/pricing.ts` (the demo console's bill uses the same numbers)                                                      |
| Documentation                              | `src/content/docs/nav.ts`, `src/content/docs/pages.ts`                                                                        |
| Legal pages                                | `src/content/legal.ts`                                                                                                        |
| Code samples shown across the site         | `src/content/samples.ts`                                                                                                      |
| Demo console data                          | `src/demo/`                                                                                                                   |
| Form fields and validation                 | `src/lib/leads/schema.ts`                                                                                                     |
| Wording of the gated actions               | `src/components/leads/gates.ts`                                                                                               |
| Security headers                           | `src/config/headers.ts`, then `UPDATE_HEADERS=1 pnpm test`                                                                    |
| Colors, type and motion                    | `src/app/globals.css`                                                                                                         |

## Scripts and tests

| Command                                            | What it does                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                                         | Development server                                                            |
| `pnpm build` / `pnpm start`                        | Server target: build and run                                                  |
| `pnpm build:static` / `pnpm preview:cf`            | Static target: build and run in the Workers runtime                           |
| `pnpm deploy:cf`                                   | Static build and deploy to Cloudflare                                         |
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | Static checks                                                                 |
| `pnpm test`                                        | Unit tests                                                                    |
| `pnpm test:e2e:server`, `pnpm test:e2e:static`     | Build one target and run the browser tests against it                         |
| `pnpm check:rebrand`                               | Rebuild under another name and fail if the default name appears in the output |

The browser tests need Chromium once: `pnpm exec playwright install chromium`. They run at a
desktop and a mobile viewport, visit every page, check for console errors and broken links, and
submit the forms against a local webhook receiver. CI runs everything above on each pull request.

The browser tests and the rebrand check build with settings of their own, so their results do not
depend on what `.env` or `.env.local` contain.

## How it is built

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix primitives and Motion.

- **Two build targets.** `BUILD_TARGET=server` (the default) is a standard Next.js build.
  `BUILD_TARGET=static` is a static export. API routes are named `route.server.ts` and the static
  target leaves that extension out of `pageExtensions`, so the routes exist only where a server
  can run them. [`next.config.ts`](next.config.ts) has the details.
- **One request handler.** It uses web-standard APIs only, so Next.js route handlers and the
  Cloudflare Worker share it.
- **Cache Components is off.** A static export requires route handlers to set
  `dynamic = "force-static"`, which Cache Components rejects in Next.js 16.4.
- **Configuration is parsed once.** [`src/config/site-schema.ts`](src/config/site-schema.ts) turns
  the environment into a typed object and reports every invalid value together.
- **Product visuals are code.** The console, the traces and the diagrams are components and SVG,
  not screenshots, so they follow the accent color and stay sharp.
- **Sample data is deterministic.** The demo workspace is generated from fixed seeds and defined
  relative to "now". Prerendered HTML uses the build time; after loading, the console follows the
  visitor's clock, so it does not go stale between deploys.
- **Security headers have one source.** The server target sends them from `next.config.ts`, and
  static hosts read `public/_headers`. A unit test keeps the two identical.
