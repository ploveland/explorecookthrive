import { notFound } from "next/navigation";
import { ConvertGoalsForm } from "@/components/convert-goals-form";
import { gateConversion } from "@/server/accounts/session";
import { authDailyLimit, guestConversionLimit } from "@/server/accounts/policy";
import { getJob } from "@/server/convert/jobs";
import { getDraft } from "@/server/drafts/store";

export default async function ConvertGoalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ draftId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { draftId } = await params;
  const { from } = await searchParams;
  const draft = await getDraft(draftId);
  if (!draft) notFound();
  const conversion = await gateConversion();
  const fromJob = from ? await getJob(from) : null;
  const again = Boolean(fromJob && fromJob.draftId === draft.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        {again ? "Thrive again" : "Goals"}
      </p>
      <h1 className="font-heading text-4xl text-teal">
        {again ? `Change how we thrive ${draft.recipe.title}` : `How should we thrive ${draft.recipe.title}?`}
      </h1>
      <p className="text-lg leading-8 text-teal/80">
        {again
          ? "Update the goals, how close it should stay, or dietary needs. We will write a new Thrive Version from the same original. The last private result stays in your kitchen."
          : "Tell us what better means for this dish. We will protect the parts that make it itself."}
      </p>
      {conversion.remaining == null ? (
        <p className="text-sm text-teal/70">Conversions are open while we grow the kitchen.</p>
      ) : conversion.userId ? (
        <p className="text-sm text-teal/70">
          {conversion.remaining} of {authDailyLimit()} conversions left today.
        </p>
      ) : (
        <p className="text-sm text-teal/70">
          {conversion.remaining} of {guestConversionLimit()} guest conversions left. Sign in to keep a
          kitchen.
        </p>
      )}
      <ConvertGoalsForm
        draftId={draft.id}
        recipeTitle={draft.recipe.title}
        initialGoals={again && fromJob ? fromJob.goals : undefined}
        initialPreference={again && fromJob ? fromJob.preference : undefined}
        initialDietary={again && fromJob ? fromJob.dietary : undefined}
        again={again}
        fromJobId={again && fromJob ? fromJob.id : null}
      />
    </div>
  );
}
