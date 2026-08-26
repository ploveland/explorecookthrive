export type CoverInput = {
  key: string;
  title: string;
  tags?: readonly string[];
  cuisine?: string | null;
  category?: string | null;
  goals?: readonly string[];
};

export const COVER_PALETTE_IDS = ["hearth", "garden", "bake", "sea", "spice", "citrus"] as const;
export type CoverPaletteId = (typeof COVER_PALETTE_IDS)[number];

const PALETTES: Record<
  CoverPaletteId,
  { from: string; via: string; to: string; spot: string; spot2: string }
> = {
  hearth: {
    from: "#c45c43",
    via: "#3d5a80",
    to: "#8da78a",
    spot: "#fcf5e966",
    spot2: "#e07a5f88",
  },
  garden: {
    from: "#8da78a",
    via: "#3d5a80",
    to: "#1c2e3a",
    spot: "#fcf5e955",
    spot2: "#8da78aaa",
  },
  bake: {
    from: "#e07a5f",
    via: "#c45c43",
    to: "#8da78a",
    spot: "#fcf5e977",
    spot2: "#3d5a8088",
  },
  sea: {
    from: "#3d5a80",
    via: "#1c2e3a",
    to: "#8da78a",
    spot: "#8da78a99",
    spot2: "#e07a5f66",
  },
  spice: {
    from: "#c45c43",
    via: "#e07a5f",
    to: "#3d5a80",
    spot: "#fcf5e955",
    spot2: "#1c2e3a66",
  },
  citrus: {
    from: "#8da78a",
    via: "#e07a5f",
    to: "#3d5a80",
    spot: "#fcf5e966",
    spot2: "#c45c4366",
  },
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function coverTokens(input: CoverInput) {
  const tokens = new Set<string>();
  for (const tag of input.tags ?? []) tokens.add(slug(tag));
  if (input.cuisine) tokens.add(slug(input.cuisine));
  if (input.category) tokens.add(slug(input.category));
  for (const goal of input.goals ?? []) tokens.add(slug(goal.replaceAll("_", "-")));
  for (const word of `${input.title} ${input.key}`.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word) tokens.add(word);
  }
  return tokens;
}

function hasAny(tokens: Set<string>, candidates: readonly string[]) {
  return candidates.some((item) => tokens.has(item));
}

export function pickCoverPalette(input: CoverInput): CoverPaletteId {
  const tokens = coverTokens(input);
  if (
    hasAny(tokens, [
      "dessert",
      "better-baking",
      "bake",
      "cake",
      "cookie",
      "cookies",
      "biscuit",
      "biscuits",
      "cobbler",
      "brownie",
      "brownies",
    ])
  ) {
    return "bake";
  }
  if (hasAny(tokens, ["mexican", "indian", "middle-eastern", "east-asian"])) {
    return "spice";
  }
  if (hasAny(tokens, ["mediterranean", "vegetarian", "vegan"])) {
    return "garden";
  }
  if (hasAny(tokens, ["southern", "comfort-food", "dinner", "chili", "stew", "soup"])) {
    return "hearth";
  }
  if (hasAny(tokens, ["higher-protein", "weeknight", "one-pan", "grill"])) {
    return "sea";
  }
  if (hasAny(tokens, ["lower-calories", "lower-sodium", "snack", "lunch"])) {
    return "citrus";
  }
  return COVER_PALETTE_IDS[hashString(input.key) % COVER_PALETTE_IDS.length];
}

export function planRecipeCover(input: CoverInput) {
  const paletteId = pickCoverPalette(input);
  const palette = PALETTES[paletteId];
  const hash = hashString(`${input.key}|${input.title}`);
  const angle = 112 + (hash % 56);
  const ax = 10 + (hash % 40);
  const ay = 6 + ((hash >>> 6) % 44);
  const bx = 54 + ((hash >>> 12) % 38);
  const by = 46 + ((hash >>> 18) % 42);
  const backgroundImage = [
    `radial-gradient(circle at ${ax}% ${ay}%, ${palette.spot} 0%, transparent 42%)`,
    `radial-gradient(circle at ${bx}% ${by}%, ${palette.spot2} 0%, transparent 50%)`,
    `linear-gradient(${angle}deg, ${palette.from} 0%, ${palette.via} 52%, ${palette.to} 100%)`,
  ].join(", ");

  return { paletteId, angle, backgroundImage };
}

export function coverInputFromPublished(recipe: {
  slug: string;
  title: string;
  tags?: readonly string[];
  cuisine?: string | null;
  category?: string | null;
  goals?: readonly string[];
}): CoverInput {
  return {
    key: recipe.slug,
    title: recipe.title,
    tags: recipe.tags,
    cuisine: recipe.cuisine,
    category: recipe.category,
    goals: recipe.goals,
  };
}

export function coverInputFromJob(job: {
  id: string;
  goals?: readonly string[];
  recipe: {
    title: string;
    originalTitle?: string | null;
    cuisine?: string | null;
    category?: string | null;
  };
  output?: { thriveVersion: { title: string } } | null;
}): CoverInput {
  return {
    key: job.id,
    title: job.output?.thriveVersion.title ?? job.recipe.originalTitle ?? job.recipe.title,
    cuisine: job.recipe.cuisine,
    category: job.recipe.category,
    goals: job.goals,
  };
}

export function coverInputFromOriginal(group: {
  draftId: string;
  originalTitle: string;
  latest: {
    goals?: readonly string[];
    recipe: { cuisine?: string | null; category?: string | null };
  };
}): CoverInput {
  return {
    key: group.draftId,
    title: group.originalTitle,
    cuisine: group.latest.recipe.cuisine,
    category: group.latest.recipe.category,
    goals: group.latest.goals,
  };
}
