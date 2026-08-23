import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDraft, updateDraft } from "@/server/drafts/store";
import { extractedRecipeSchema } from "@/server/recipes/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json({ message: "We could not find that draft." }, { status: 404 });
  }
  return NextResponse.json(draft);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const recipe = extractedRecipeSchema.parse(body.recipe ?? body);
    const draft = await updateDraft(id, recipe);
    if (!draft) {
      return NextResponse.json({ message: "We could not find that draft." }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "That recipe could not be saved." },
        { status: 400 },
      );
    }
    throw error;
  }
}
