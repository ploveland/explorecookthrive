import { notFound } from "next/navigation";
import { ConvertGoalsForm } from "@/components/convert-goals-form";
import { getDraft } from "@/server/drafts/store";

export default async function ConvertGoalsPage({
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
        Goals
      </p>
      <h1 className="font-heading text-4xl text-teal">How should we thrive {draft.recipe.title}?</h1>
      <p className="text-lg leading-8 text-teal/80">
        Tell us what better means for this dish. We will protect the parts that make it itself.
      </p>
      <ConvertGoalsForm draftId={draft.id} recipeTitle={draft.recipe.title} />
    </div>
  );
}
