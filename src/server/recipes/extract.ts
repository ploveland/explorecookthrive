import { log } from "../log";
import { saveDraft } from "../drafts/store";
import { fetchRecipeHtml } from "./fetch-html";
import { parsePastedRecipe } from "./parse-paste";
import { recipeFromJsonLd, recipeFromMicrodata } from "./parse-jsonld";
import { ExtractError, extractRequestSchema, type ExtractedRecipe, type RecipeDraft } from "./schema";
import { readUrlCache, writeUrlCache } from "./url-cache";

export async function extractRecipe(
  input: unknown,
  owner: { guestId?: string | null; userId?: string | null } = {},
): Promise<RecipeDraft> {
  const request = extractRequestSchema.parse(input);
  const draftOptions = { guestId: owner.guestId ?? null, userId: owner.userId ?? null };

  if (request.mode === "paste") {
    const recipe = parsePastedRecipe(request.text);
    log.info("recipe.extract", {
      mode: "paste",
      extractor: recipe.extractor,
      confidence: recipe.confidence,
      ingredientCount: recipe.ingredients.length,
    });
    return saveDraft(recipe, draftOptions);
  }

  const cached = await readUrlCache(request.url);
  if (cached) {
    log.info("recipe.extract", { mode: "url", extractor: "cache", sourceHost: cached.sourceSite });
    return saveDraft(cached, draftOptions);
  }

  const { finalUrl, html } = await fetchRecipeHtml(request.url);
  const recipe =
    recipeFromJsonLd(html, finalUrl) ??
    recipeFromMicrodata(html, finalUrl);

  if (!recipe) {
    throw new ExtractError(
      "not_a_recipe",
      "We could not find a recipe on that page. Paste the ingredients and steps instead.",
    );
  }

  await writeUrlCache(request.url, recipe);
  log.info("recipe.extract", {
    mode: "url",
    extractor: recipe.extractor,
    confidence: recipe.confidence,
    sourceHost: recipe.sourceSite,
  });
  return saveDraft(recipe, draftOptions);
}

export type { ExtractedRecipe };
