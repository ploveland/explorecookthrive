# Explore Cook Thrive

Keep the flavor. Improve the recipe.

Explore Cook Thrive takes a recipe you already love — pasted or imported from a URL — and looks for nutrition upgrades that respect flavor, texture, and technique. It is not a generic “healthy recipe generator.”

This repository is in **Phase 1**: branded app shell, PostgreSQL schema, taxonomy, OpenAI provider abstraction, and a culinary eval suite. Recipe extraction and conversion are next.

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
| `OPENAI_API_KEY` | Required when conversions are wired in Phase 3 |
| `OPENAI_MODEL` | Defaults to `gpt-4.1-mini` |
| `USDA_FDC_API_KEY` | USDA FoodData Central, Phase 4 |

Auth is intentionally not implemented yet. Unsplash is not used.

## Scripts

- `npm run dev` — Next.js on port 43123
- `npm test` — domain tests, including eval scoring (no live model calls)
- `npm run eval` — conversion quality fixtures
- `npm run db:validate` — Prisma schema check

## Eval suite

See [evals/README.md](evals/README.md). Golden cases encode dishes where butter, crust, cheese, and sugar are load-bearing. A conversion that reaches for applesauce or skim milk fails.
