export type KitchenActor = {
  userId?: string | null;
  guestId?: string | null;
};

export type KitchenResource = {
  userId?: string | null;
  guestId?: string | null;
};

/**
 * Ownership for private kitchen records (drafts and conversions).
 * A signed-in owner wins over a leftover guest cookie: once userId is set,
 * only that account can access the record.
 */
export function kitchenOwns(resource: KitchenResource, actor: KitchenActor) {
  if (resource.userId) return Boolean(actor.userId && actor.userId === resource.userId);
  if (resource.guestId) return Boolean(actor.guestId && actor.guestId === resource.guestId);
  return false;
}

export function hasKitchenSession(actor: KitchenActor) {
  return Boolean(actor.userId || actor.guestId);
}

export function ownedOrNull<T extends KitchenResource>(resource: T | null, actor: KitchenActor): T | null {
  if (!resource || !kitchenOwns(resource, actor)) return null;
  return resource;
}

export function canViewPublishedRecipe(
  recipe: { visibility: "public" | "unlisted" | "private"; ownerId?: string | null },
  viewerId?: string | null,
) {
  if (recipe.visibility === "public" || recipe.visibility === "unlisted") return true;
  return Boolean(viewerId && recipe.ownerId === viewerId);
}

export function ownsPublishedRecipe(
  recipe: { ownerId?: string | null },
  userId?: string | null,
) {
  return Boolean(userId && recipe.ownerId === userId);
}
