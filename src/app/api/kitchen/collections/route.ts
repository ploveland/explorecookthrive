import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  CollectionError,
  addToCollection,
  createCollection,
  listCollections,
} from "@/server/accounts/collections";
import { currentAccount } from "@/server/accounts/session";

const createSchema = z.object({
  name: z.string().min(1),
});

const addSchema = z.object({
  collectionId: z.string().min(1),
  slug: z.string().min(1),
});

export async function GET() {
  const account = await currentAccount();
  if (!account.userId) {
    return NextResponse.json(
      { code: "sign_in_required", message: "Sign in to see collections." },
      { status: 401 },
    );
  }
  const collections = await listCollections(account.userId);
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  try {
    const account = await currentAccount();
    if (!account.userId) {
      return NextResponse.json(
        { code: "sign_in_required", message: "Sign in to make a collection." },
        { status: 401 },
      );
    }
    const json = await request.json();
    if ("collectionId" in json) {
      const body = addSchema.parse(json);
      const collection = await addToCollection(account.userId, body.collectionId, body.slug);
      return NextResponse.json({ collection });
    }
    const body = createSchema.parse(json);
    const collection = await createCollection(account.userId, body.name);
    return NextResponse.json({ collection });
  } catch (error) {
    if (error instanceof ZodError || error instanceof CollectionError) {
      return NextResponse.json(
        { code: "invalid_input", message: error instanceof Error ? error.message : "Check that collection." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { code: "collection_failed", message: "We could not update that collection." },
      { status: 500 },
    );
  }
}
