import { z } from "zod";
import { parsePublicSlug, parseStorageId } from "./safe-path";

export const storageUuidSchema = z.string().refine(
  (value) => {
    try {
      parseStorageId(value, "uuid");
      return true;
    } catch {
      return false;
    }
  },
  { message: "That identifier is not valid." },
);

export const publicSlugSchema = z.string().refine(
  (value) => {
    try {
      parsePublicSlug(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "That identifier is not valid." },
);
