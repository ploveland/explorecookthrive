export function compareHref(
  leftId: string,
  rightId: string,
  leftNumber?: number | null,
  rightNumber?: number | null,
) {
  const leftFirst =
    leftNumber != null && rightNumber != null ? leftNumber <= rightNumber : leftId.localeCompare(rightId) <= 0;
  const first = leftFirst ? leftId : rightId;
  const second = leftFirst ? rightId : leftId;
  return `/kitchen/compare?left=${encodeURIComponent(first)}&right=${encodeURIComponent(second)}`;
}
