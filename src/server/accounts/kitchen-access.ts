export function kitchenOwns(
  resource: { userId?: string | null; guestId?: string | null },
  actor: { userId?: string | null; guestId?: string | null },
) {
  if (resource.userId) return Boolean(actor.userId && actor.userId === resource.userId);
  if (resource.guestId) return Boolean(actor.guestId && actor.guestId === resource.guestId);
  return false;
}

export function hasKitchenSession(actor: { userId?: string | null; guestId?: string | null }) {
  return Boolean(actor.userId || actor.guestId);
}
