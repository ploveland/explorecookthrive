# Explore Cook Thrive

Keep the flavor. Improve the recipe.

Explore Cook Thrive takes a recipe you already love — pasted or imported from a URL — and looks for nutrition upgrades that respect flavor, texture, and technique. It is not a generic “healthy recipe generator.”

This repository is in **Phase 4**: paste or import a recipe, confirm the reading, choose nutrition goals, get a private Thrive Version, and see USDA-based nutrition estimates for the original and the rewrite. The language model never invents calorie or macro numbers.

Paste a recipe or a URL on the homepage. We structure it (JSON-LD first for URLs), you confirm the reading, then we convert it. Without `OPENAI_API_KEY`, conversions use a local culinary mock so the loop is still usable.

## Run locally

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

App: [http://localhost:43123](http://localhost:43123)

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_PROVIDER` | `openai` (default). Anthropic is reserved. |
| `OPENAI_API_KEY` | If empty, conversions use the local culinary mock |
| `OPENAI_MODEL` | Defaults to `gpt-4.1-mini` |
| `CONVERT_STAGE_DELAY_MS` | Optional pause between job stages (default 350) |
| `USDA_FDC_API_KEY` | Optional. Live USDA FoodData Central lookup. If empty, a local USDA-derived catalog is used |

Auth is intentionally not implemented yet. Unsplash is not used.

## Scripts

- `npm run dev` — Next.js on port 43123
- `npm test` — domain tests, including eval scoring (no live model calls)
- `npm run eval` — conversion quality fixtures
- `npm run db:validate` — Prisma schema check

## Eval suite

See [evals/README.md](evals/README.md). Golden cases encode dishes where butter, crust, cheese, and sugar are load-bearing. A conversion that reaches for applesauce or skim milk fails.
