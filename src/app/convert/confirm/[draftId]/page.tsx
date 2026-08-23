import { notFound } from "next/navigation";
import { ConfirmRecipeForm } from "@/components/confirm-recipe-form";
import { getDraft } from "@/server/drafts/store";

export default async function ConfirmRecipePage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const draft = await getDraft(draftId);
  if (!draft) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Confirm the reading
      </p>
      <h1 className="font-heading text-4xl text-teal">Is this the recipe you meant?</h1>
      <ConfirmRecipeForm draftId={draft.id} initialRecipe={draft.recipe} />
    </div>
  );
}
