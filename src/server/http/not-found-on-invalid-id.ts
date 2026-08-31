import { notFound } from "next/navigation";
import { InvalidStorageIdError } from "@/server/fs/safe-path";

export function notFoundOnInvalidId(error: unknown): never {
  if (error instanceof InvalidStorageIdError) notFound();
  throw error;
}
