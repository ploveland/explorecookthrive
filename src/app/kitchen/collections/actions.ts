"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CollectionError, createCollection } from "@/server/accounts/collections";
import { currentAccount } from "@/server/accounts/session";

export async function createCollectionAction(_prev: string | null, formData: FormData) {
  const account = await currentAccount();
  if (!account.userId) {
    redirect("/signin?next=/kitchen/collections");
  }
  const userId = account.userId;
  try {
    const collection = await createCollection(userId, String(formData.get("name") ?? ""));
    revalidatePath("/kitchen/collections");
    revalidatePath(`/kitchen/collections/${collection.slug}`);
    redirect(`/kitchen/collections/${collection.slug}`);
  } catch (error) {
    if (error instanceof CollectionError) return error.message;
    throw error;
  }
}
