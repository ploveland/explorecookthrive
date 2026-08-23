# Conversion quality evals

This suite is part of the product, not an afterthought.

Each JSON case in `evals/cases/` is a recipe people already love, plus culinary guardrails:

- `mustPreserve` — load-bearing ingredients or techniques
- `mustNotSuggest` — default “diet” swaps that would flatten the dish
- `allowedAdditions` — extras that can be justified (beans, a second flour, pasta water)

`src/server/eval/score.ts` grades a structured Thrive output without calling a model. Unit tests run this against the local culinary mock so conversions that reach for applesauce, skim milk, or invented ingredients fail in CI.

A later `npm run eval:live` can send fixtures through OpenAI. Live evals are opt-in and must never run in ordinary unit tests.

Scoring fails a conversion when it:

- drops a load-bearing ingredient without saying why it stays
- suggests a banned swap (applesauce for butter, skim milk in carbonara, and similar)
- invents an ingredient that was not in the original and not explained
- makes disease-treatment claims
- attaches nutrition numbers to the model payload (macros come from USDA)
