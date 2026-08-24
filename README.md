# Explore Cook Thrive

Keep the flavor. Improve the recipe.

Explore Cook Thrive takes a recipe you already love — pasted or imported from a URL — and looks for nutrition upgrades that respect flavor, texture, and technique. It is not a generic “healthy recipe generator.”

This repository is in **Phase 7**: the conversion kitchen plus a quality pass. Paste or import a recipe, convert it, see USDA estimates, then sign in to publish, favorite, and collect. Public Thrive pages get sitemap, robots, and Recipe JSON-LD. Convert, kitchen, and account routes are `noindex`. Guests get 2 conversions; signed-in kitchens get 10 per UTC day. The language model never invents calorie numbers.

Paste a recipe or a URL on the homepage. We structure it (JSON-LD first for URLs), you confirm the reading, then we convert it. Without `OPENAI_API_KEY`, conversions use a local culinary mock so the loop is still usable.

Sign in with email and a password (Auth.js credentials). Publishing requires an account. History is at `/kitchen`, favorites at `/kitchen/favorites`, collections at `/kitchen/collections`. Guest conversions are claimed when you sign in. Accounts, favorites, and collections live in `.data/` alongside drafts and the library.

Structured logs record job ids, extract codes, search result counts, and publish slugs. Recipe bodies, ingredients, instructions, and prompts are stripped before a line is written.

## Run locally

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

App: [http://localhost:43123](http://localhost:43123)

Drafts, conversion jobs, published recipes, accounts, favorites, and collections currently live in `.data/` (gitignored). Postgres is reserved for later; the current loop does not require it.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_PROVIDER` | `openai` (default). Anthropic is reserved. |
| `OPENAI_API_KEY` | If empty, conversions use the local culinary mock |
| `OPENAI_MODEL` | Defaults to `gpt-4.1-mini` |
| `CONVERT_STAGE_DELAY_MS` | Optional pause between job stages (default 350) |
| `USDA_FDC_API_KEY` | Optional. Live USDA FoodData Central lookup. If empty, a local USDA-derived catalog is used |
| `AUTH_SECRET` | Auth.js secret. Required in production; a local fallback is used if empty |
| `AUTH_URL` | Auth.js base URL. Defaults to the local app |
| `APP_URL` | Canonical site URL for sitemap, robots, and Recipe JSON-LD. Falls back to `AUTH_URL`, then `http://localhost:43123` |

Unsplash is not used. GitHub/Google login is not wired yet — email and password is the local account.

Public crawl surfaces: `/`, `/recipes`, `/search`, and public `/recipes/[slug]`. `/convert`, `/kitchen`, `/signin`, `/signup`, and `/api` are disallowed in `robots.txt`. Unlisted and private recipes are `noindex` and stay off the sitemap.

## Scripts

- `npm run dev` — Next.js on port 43123
- `npm test` — domain tests, including eval scoring (no live model calls)
- `npm run eval` — conversion quality fixtures
- `npm run db:validate` — Prisma schema check

## Eval suite

See [evals/README.md](evals/README.md). Golden cases encode dishes where butter, crust, cheese, and sugar are load-bearing. A conversion that reaches for applesauce or skim milk fails.
