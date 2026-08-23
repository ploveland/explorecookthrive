import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDraft } from "@/server/drafts/store";

export default async function ReadyPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const draft = await getDraft(draftId);
  if (!draft) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Ready
      </p>
      <h1 className="font-heading text-4xl text-teal">{draft.recipe.title}</h1>
      <p className="text-lg leading-8 text-teal/80">
        The recipe is structured and saved. Conversion — goals, taste preference, and a
        Thrive Version — is the next build. Nothing has been rewritten yet.
      </p>
      <ul className="rounded-2xl bg-white/80 p-5 text-sm text-teal ring-1 ring-teal/10">
        <li>{draft.recipe.ingredients.length} ingredients</li>
        <li>{draft.recipe.instructions.length} steps</li>
        {draft.recipe.servings ? <li>Serves {draft.recipe.servings}</li> : null}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href={`/convert/confirm/${draft.id}`} />} variant="outline">
          Edit again
        </Button>
        <Button render={<Link href="/#thrive" />} className="bg-terracotta-strong text-cream">
          Thrive another recipe
        </Button>
      </div>
    </div>
  );
}
