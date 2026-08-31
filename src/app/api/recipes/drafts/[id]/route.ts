import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { currentAccount } from "@/server/accounts/session";
import { hasKitchenSession } from "@/server/accounts/kitchen-access";
import { getAccessibleDraft, updateDraft } from "@/server/drafts/store";
import { jsonErrorFromUnknown, notFoundResponse, sessionRequiredResponse } from "@/server/http/api-error";
import { extractedRecipeSchema } from "@/server/recipes/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const account = await currentAccount();
    if (!hasKitchenSession(account)) return sessionRequiredResponse();
    const { id } = await context.params;
    const draft = await getAccessibleDraft(id, account);
    if (!draft) {
      return notFoundResponse("We could not find that draft.");
    }
    return NextResponse.json(draft);
  } catch (error) {
    return jsonErrorFromUnknown(error) ?? NextResponse.json({ code: "draft_failed", message: "We could not load that draft." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const account = await currentAccount();
    if (!hasKitchenSession(account)) return sessionRequiredResponse();
    const { id } = await context.params;
    const existing = await getAccessibleDraft(id, account);
    if (!existing) {
      return notFoundResponse("We could not find that draft.");
    }
    const body = await request.json();
    const recipe = extractedRecipeSchema.parse(body.recipe ?? body);
    const draft = await updateDraft(existing.id, recipe);
    if (!draft) {
      return notFoundResponse("We could not find that draft.");
    }
    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "That recipe could not be saved." },
        { status: 400 },
      );
    }
    return jsonErrorFromUnknown(error) ?? NextResponse.json({ code: "draft_failed", message: "We could not save that draft." }, { status: 500 });
  }
}
