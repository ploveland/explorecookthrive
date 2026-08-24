import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "@/server/log";
import { extractRecipe } from "@/server/recipes/extract";
import { ExtractError } from "@/server/recipes/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draft = await extractRecipe(body);
    return NextResponse.json({ draftId: draft.id, recipe: draft.recipe });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          code: "invalid_input",
          message: error.issues[0]?.message ?? "Check the recipe and try again.",
        },
        { status: 400 },
      );
    }
    if (error instanceof ExtractError) {
      log.warn("recipe.extract_failed", { code: error.code });
      const status =
        error.code === "blocked_url" || error.code === "invalid_url"
          ? 400
          : error.code === "not_a_recipe"
            ? 422
            : 502;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    return NextResponse.json(
      {
        code: "extract_failed",
        message: "Something went wrong while reading that recipe. Try pasting it instead.",
      },
      { status: 500 },
    );
  }
}
