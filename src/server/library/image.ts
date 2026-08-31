import { safeHttpUrl } from "@/lib/safe-http-url";
import type { RecipeImage, RecipeImageSource } from "./schema";

const FOOD_PHOTO_SOURCES: readonly RecipeImageSource[] = [
  "ect_original",
  "user_upload",
  "licensed",
];

/** Photos of the completed dish. Generated/illustrative art is not a Google Recipe image. */
export function isRecipeFoodPhoto(image: RecipeImage | null | undefined): image is RecipeImage {
  if (!image?.url || !safeHttpUrl(image.url)) return false;
  return FOOD_PHOTO_SOURCES.includes(image.source);
}

export function recipeSocialImages(image: RecipeImage | null | undefined) {
  if (!isRecipeFoodPhoto(image)) return undefined;
  return [
    {
      url: image.url,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      alt: image.alt,
    },
  ];
}
