# Explore Cook Thrive

Keep the flavor. Improve the recipe.

Explore Cook Thrive takes a recipe you already love — pasted or imported from a URL — and looks for nutrition upgrades that respect flavor, texture, and technique. It is not a generic “healthy recipe generator.”

This repository is in **Phase 8**: the conversion kitchen plus community cook notes. Paste or import a recipe, convert it, see USDA estimates, then sign in to publish, favorite, collect, and rate. Browse the library by tag or USDA per-serving bounds (calories, protein, fiber, sodium). Public Thrive pages get sitemap, robots, Recipe JSON-LD, and an optional Community Tested badge. On a Thrive Version you can scale servings; per-serving USDA numbers stay put and ingredient amounts move with the pot. Convert, kitchen, and account routes are `noindex`. Conversions are unlimited for now (set `CONVERT_GUEST_LIMIT` and `CONVERT_AUTH_DAILY_LIMIT` to restore caps). The language model never invents calorie numbers.

Paste a recipe or a URL on the homepage. We structure it (JSON-LD first for URLs), you confirm the reading, then we convert it. After a Thrive Version, you can change goals, closeness, or dietary needs and thrive the same original again. The kitchen groups every Thrive Version of that original (Version 1, 2, …) so you can open any of them and compare two side by side (USDA estimates, ingredients, and what changed from the original). Without `OPENAI_API_KEY`, conversions use a local culinary mock so the loop is still usable.

Sign in with email and a password (Auth.js credentials), or **Continue with Google** when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. If you forget a password, use **Forgot your password?** on the sign-in page. Google-only kitchens can set a password that way too. Publishing requires an account. History is at `/kitchen`, favorites at `/kitchen/favorites`, collections at `/kitchen/collections`. Guest conversions are claimed when you sign in. On a public Thrive Version, copy the link, use Share on your phone, or email it — we send that page, not the original recipe. After you cook a public Thrive Version, sign in to rate taste, texture, similarity to the original, and ease. You can leave an optional short note. Notes cannot include links, ads, or abusive language, and each kitchen can only save a handful of ratings an hour. You can email hello@explorecookthrive.com if a note is not about the dish. **Community Tested** means at least three other kitchens scored taste and texture 4 or higher and would make it again. Accounts, favorites, collections, ratings, and cook notes live in `.data/` alongside drafts and the library.

Structured logs record job ids, extract codes, search result counts, publish slugs, and rating counts. Recipe bodies, ingredients, instructions, prompts, cook notes, passwords, reset tokens, and OAuth tokens are stripped before a line is written.

## Run locally

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

App: [http://localhost:43123](http://localhost:43123)

Drafts, conversion jobs, published recipes, accounts, favorites, collections, and cook ratings currently live in `.data/` (gitignored). Postgres is reserved for later; the current loop does not require it.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_PROVIDER` | `openai` (default). Anthropic is reserved. |
| `OPENAI_API_KEY` | If empty, conversions use the local culinary mock |
| `OPENAI_MODEL` | Defaults to `gpt-4.1-mini` |
| `CONVERT_STAGE_DELAY_MS` | Optional pause between job stages (default 350) |
| `CONVERT_GUEST_LIMIT` | Guest conversion cap. `0` or empty = unlimited |
| `CONVERT_AUTH_DAILY_LIMIT` | Signed-in conversions per UTC day. `0` or empty = unlimited |
| `USDA_FDC_API_KEY` | Optional. Live USDA FoodData Central lookup. If empty, a local USDA-derived catalog is used |
| `AUTH_SECRET` | Auth.js secret. Required in production; a local fallback is used if empty |
| `AUTH_URL` | Auth.js base URL. Defaults to the local app |
| `AUTH_GOOGLE_ID` | Google OAuth client id. Empty hides **Continue with Google** |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `APP_URL` | Canonical site URL for sitemap, robots, and Recipe JSON-LD. Falls back to `AUTH_URL`, then Render’s `RENDER_EXTERNAL_URL`, then `http://localhost:43123` |
| `RESEND_API_KEY` | Sends password-reset mail. If empty, local/dev shows a one-hour reset link on the page; production needs this key (or the operator script below) |
| `EMAIL_FROM` | Resend From address. Defaults to `Explore Cook Thrive <onboarding@resend.dev>` (that sender can only deliver to the Resend account email until you verify a domain) |

Unsplash is not used. Apple and GitHub login are not wired. Google login is optional (see below).

Public crawl surfaces: `/`, `/recipes`, `/search`, `/contact`, and public `/recipes/[slug]`. `/convert`, `/kitchen`, `/signin`, `/signup`, `/forgot-password`, `/reset-password`, and `/api` are disallowed in `robots.txt`. Unlisted and private recipes are `noindex` and stay off the sitemap.

## Scripts

- `npm run dev` — Next.js on port 43123
- `npm run start` — production server on `$PORT` or 43123
- `npm test` — domain tests, including eval scoring (no live model calls)
- `npm run eval` — conversion quality fixtures
- `npm run db:validate` — Prisma schema check
- `npm run db:studio` — Prisma studio
- `npm run account:set-password` — operator reset: `--email you@example.com --password 'at-least-8-chars'`

## Password reset

Kitchens recover a forgotten password from **Sign in → Forgot your password?**. The link is single-use and expires in an hour. The form always says the same thing whether or not that email has a kitchen.

On Render, add `RESEND_API_KEY` (and optionally `EMAIL_FROM` after you verify a domain). Until a domain is verified, Resend’s `onboarding@resend.dev` sender only delivers to the email on the Resend account — enough to recover the operator kitchen.

If mail is not configured yet, recover from the Render shell against the persistent disk:

```bash
npm run account:set-password -- --email you@example.com --password 'at-least-8-chars'
```

Locally, with no Resend key, the forgot-password page shows the reset link so you can finish the loop without leaving the machine.

## Google login

The **Continue with Google** button stays hidden until both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. Create a Google Cloud **Web application** OAuth client and add:

- Authorized JavaScript origins: `https://explorecookthrive.com` and, for local work, `http://127.0.0.1:43123` (and `http://localhost:43123` if you use that host)
- Authorized redirect URIs: `https://explorecookthrive.com/api/auth/callback/google` and `http://127.0.0.1:43123/api/auth/callback/google`

Put the client id and secret on Render (and in `.env` locally), then redeploy. Auth.js uses JWT sessions; the kitchen id in the session is our UUID, not Google’s `sub`.

A new verified Google email creates a kitchen with no password. Signing in again with the same Google account returns to that kitchen. If that verified email already has a password kitchen, we do **not** attach Google until you confirm the kitchen password on `/signin/connect-google`. Unverified Google emails are refused. Two different Google accounts cannot share one kitchen email.

Google-only kitchens cannot sign in with a password until they set one via **Forgot your password?** (or the operator script).

## Deploy on Render

The live kitchen needs a **persistent disk**. Render’s free web service cannot keep `.data/`. Use a paid instance (Starter or larger).

1. Push this repo to GitHub (`git push github main`).
2. In [Render](https://dashboard.render.com), open **New → Blueprint** and connect `ploveland/explorecookthrive` (or your fork). Render reads `render.yaml`.
3. Deploy. The public URL looks like `https://explore-cook-thrive.onrender.com`. Auth and sitemap use Render’s `RENDER_EXTERNAL_URL` until you set `APP_URL` and `AUTH_URL`.
4. The first ship uses the culinary mock and local USDA catalog. Add `OPENAI_API_KEY` (and optionally `USDA_FDC_API_KEY`) under **Environment** when you want live conversions. Add `RESEND_API_KEY` so “Forgot your password?” can email a link. Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` when the Google OAuth client is ready. Do not put empty secret values in `render.yaml` — a Blueprint deploy would overwrite the dashboard keys. After a wipe, paste `OPENAI_API_KEY` again and confirm the working page says the live model, not the culinary mock.
5. Optional: add a custom domain, then set both `APP_URL` and `AUTH_URL` to `https://your-domain.com` (no trailing slash).

Kitchens, published recipes, and ratings persist on the `ect-data` disk across deploys. Take your own backups; a disk is not a database dump.

Render sets `NODE_ENV=production` for the whole service. That would skip `devDependencies` during `npm ci`, which is why Tailwind, TypeScript, and the Prisma CLI live in `dependencies` and the Blueprint installs with `--include=dev`.

If `next build` runs out of memory, raise the instance size and redeploy.

## Eval suite

See [evals/README.md](evals/README.md). Golden cases encode dishes where butter, crust, cheese, and sugar are load-bearing. A conversion that reaches for applesauce or skim milk fails.
