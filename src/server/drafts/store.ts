import { InvalidStorageIdError, dataDir, newStorageId, readConfinedJson, readConfinedJsonRecords, writeConfinedJson } from "../fs/safe-path";
import { ownedOrNull, type KitchenActor } from "../accounts/kitchen-access";
import { extractedRecipeSchema, recipeDraftSchema, type ExtractedRecipe, type RecipeDraft } from "../recipes/schema";

const DIR = dataDir("drafts");

export type DraftOwner = KitchenActor;

export async function saveDraft(
  recipe: ExtractedRecipe,
  options: { id?: string } & DraftOwner = {},
): Promise<RecipeDraft> {
  const id = options.id ?? newStorageId();
  const existing = options.id ? await getDraft(id).catch(() => null) : null;
  const now = new Date().toISOString();
  const draft = recipeDraftSchema.parse({
    id,
    recipe: extractedRecipeSchema.parse(recipe),
    guestId: options.guestId ?? existing?.guestId ?? null,
    userId: options.userId ?? existing?.userId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  await writeConfinedJson(DIR, draft.id, JSON.stringify(draft, null, 2));
  return draft;
}

export async function getDraft(id: string): Promise<RecipeDraft | null> {
  try {
    const raw = await readConfinedJson(DIR, id);
    return recipeDraftSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    return null;
  }
}

export async function getAccessibleDraft(id: string, actor: DraftOwner): Promise<RecipeDraft | null> {
  const draft = await getDraft(id);
  return ownedOrNull(draft, actor);
}

export async function updateAccessibleDraft(
  id: string,
  recipe: ExtractedRecipe,
  actor: DraftOwner,
): Promise<RecipeDraft | null> {
  const existing = await getAccessibleDraft(id, actor);
  if (!existing) return null;
  return updateDraft(existing.id, recipe);
}

export async function updateDraft(id: string, recipe: ExtractedRecipe): Promise<RecipeDraft | null> {
  const existing = await getDraft(id);
  if (!existing) return null;
  const draft = recipeDraftSchema.parse({
    ...existing,
    recipe: extractedRecipeSchema.parse(recipe),
    updatedAt: new Date().toISOString(),
  });
  await writeConfinedJson(DIR, draft.id, JSON.stringify(draft, null, 2));
  return draft;
}

export async function listDrafts(): Promise<RecipeDraft[]> {
  return readConfinedJsonRecords(DIR, (raw) => recipeDraftSchema.parse(raw));
}

export async function assignDraftOwner(input: { guestId: string; userId: string }) {
  const drafts = await listDrafts();
  await Promise.all(
    drafts
      .filter((draft) => draft.guestId === input.guestId && !draft.userId)
      .map((draft) =>
        writeConfinedJson(
          DIR,
          draft.id,
          JSON.stringify({ ...draft, userId: input.userId }, null, 2),
        ),
      ),
  );
}
