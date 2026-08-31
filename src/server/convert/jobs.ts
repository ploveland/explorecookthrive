import { saveDraft, getDraft } from "../drafts/store";
import { env } from "../env";
import { log } from "../log";
import { compareRecipeNutrition, type NutritionIngredientInput } from "../nutrition/estimate";
import { inputFromExtractedRecipe } from "./from-recipe";
import { sameKitchen } from "./versions";
import { hasLiveLlm, runConversion } from "./run";
import { kitchenOwns } from "../accounts/kitchen-access";
import {
  InvalidStorageIdError,
  dataDir,
  listConfinedJsonIds,
  newStorageId,
  readConfinedJson,
  writeConfinedJson,
} from "../fs/safe-path";
import {
  ACTIVE_JOB_STAGES,
  PROMPT_VERSION,
  conversionJobSchema,
  type ConversionJob,
  type ConversionJobStatus,
  type DietaryRequirementId,
  type NutritionGoalId,
  type TastePreferenceId,
} from "./schema";

const DIR = dataDir("jobs");
const running = new Set<string>();

function stageDelayMs() {
  const raw = env("CONVERT_STAGE_DELAY_MS");
  if (!raw) return 350;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 350;
}

async function writeJob(job: ConversionJob) {
  const next = conversionJobSchema.parse({
    ...job,
    updatedAt: new Date().toISOString(),
  });
  await writeConfinedJson(DIR, next.id, JSON.stringify(next, null, 2));
  return next;
}

export async function getJob(id: string): Promise<ConversionJob | null> {
  try {
    const raw = await readConfinedJson(DIR, id);
    return conversionJobSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    return null;
  }
}

export async function getAccessibleJob(
  id: string,
  actor: { userId?: string | null; guestId?: string | null },
): Promise<ConversionJob | null> {
  const job = await getJob(id);
  if (!job || !kitchenOwns(job, actor)) return null;
  return job;
}

export class JobError extends Error {
  constructor(
    public readonly code: "draft_not_found" | "job_not_found",
    message: string,
  ) {
    super(message);
    this.name = "JobError";
  }
}

export async function listJobs(): Promise<ConversionJob[]> {
  const ids = await listConfinedJsonIds(DIR);
  const jobs = await Promise.all(
    ids.map(async (id) => {
      try {
        return conversionJobSchema.parse(JSON.parse(await readConfinedJson(DIR, id)));
      } catch {
        return null;
      }
    }),
  );
  return jobs
    .filter((job): job is ConversionJob => Boolean(job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listJobsForAccount(input: {
  userId?: string | null;
  guestId?: string | null;
}): Promise<ConversionJob[]> {
  const jobs = await listJobs();
  return jobs.filter((job) => {
    if (input.userId && job.userId === input.userId) return true;
    if (input.guestId && job.guestId === input.guestId) return true;
    return false;
  });
}

export async function assignJobOwner(input: { guestId: string; userId: string }) {
  const jobs = await listJobs();
  await Promise.all(
    jobs
      .filter((job) => job.guestId === input.guestId && !job.userId)
      .map((job) => writeJob({ ...job, userId: input.userId })),
  );
}

export async function createJob(input: {
  draftId: string;
  goals: NutritionGoalId[];
  preference: TastePreferenceId;
  dietary: DietaryRequirementId[];
  guestId?: string | null;
  userId?: string | null;
}): Promise<ConversionJob> {
  let draft;
  try {
    draft = await getDraft(input.draftId);
  } catch (error) {
    if (error instanceof InvalidStorageIdError) throw error;
    throw error;
  }
  if (!draft) {
    throw new JobError("draft_not_found", "We could not find that recipe draft.");
  }
  if (!kitchenOwns(draft, { userId: input.userId, guestId: input.guestId })) {
    throw new JobError("draft_not_found", "We could not find that recipe draft.");
  }

  const now = new Date().toISOString();
  const live = hasLiveLlm();
  return writeJob({
    id: newStorageId(),
    draftId: draft.id,
    recipe: draft.recipe,
    goals: input.goals,
    dietary: input.dietary,
    preference: input.preference,
    status: "queued",
    statusLabel: "Queued",
    provider: live ? "openai" : "mock",
    model: live ? env("OPENAI_MODEL") || "gpt-4.1-mini" : "culinary-mock-v1",
    promptVersion: PROMPT_VERSION,
    output: null,
    nutrition: null,
    errorCode: null,
    errorMessage: null,
    inputTokens: null,
    outputTokens: null,
    latencyMs: null,
    guestId: input.guestId ?? null,
    userId: input.userId ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function ensureDraftFromJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job) {
    throw new JobError("job_not_found", "We could not find that conversion.");
  }
  const draft = await saveDraft(job.recipe, {
    id: job.draftId,
    guestId: job.guestId,
    userId: job.userId,
  });
  return { job, draft };
}

async function setStatus(id: string, status: ConversionJobStatus, statusLabel: string) {
  const job = await getJob(id);
  if (!job) return null;
  return writeJob({ ...job, status, statusLabel });
}

export async function processJob(id: string): Promise<ConversionJob | null> {
  const job = await getJob(id);
  if (!job) return null;
  if (job.status === "complete" || job.status === "failed") return job;
  if (running.has(id)) return job;
  running.add(id);

  try {
    const delay = stageDelayMs();
    const estimateStage = ACTIVE_JOB_STAGES.find((stage) => stage.status === "estimating");
    const beforeEstimate = ACTIVE_JOB_STAGES.filter((stage) => stage.status !== "estimating");

    for (const stage of beforeEstimate) {
      await setStatus(id, stage.status, stage.label);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const current = await getJob(id);
    if (!current) return null;

    const result = await runConversion(
      inputFromExtractedRecipe(current.recipe, current.goals, current.preference, current.dietary),
    );

    if (estimateStage) {
      await setStatus(id, estimateStage.status, estimateStage.label);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const latest = (await getJob(id)) ?? current;
    let nutrition = null;
    try {
      nutrition = await compareRecipeNutrition({
        original: toNutritionInputs(latest.recipe.ingredients),
        originalServings: latest.recipe.servings,
        thrive: toNutritionInputs(result.output.thriveVersion.ingredients),
        thriveServings: result.output.thriveVersion.servings,
      });
      log.info("convert.nutrition_estimated", {
        jobId: id,
        originalMapped: nutrition.original.mappedCount,
        originalUnmapped: nutrition.original.unmappedCount,
        thriveMapped: nutrition.thrive.mappedCount,
        thriveUnmapped: nutrition.thrive.unmappedCount,
      });
    } catch (error) {
      log.error("convert.nutrition_failed", {
        jobId: id,
        success: false,
        errorCode: error instanceof Error ? error.name : "nutrition_failed",
      });
    }

    const done = await writeJob({
      ...latest,
      status: "complete",
      statusLabel: "Ready",
      provider: result.provider,
      model: result.model,
      promptVersion: result.promptVersion,
      output: result.output,
      nutrition,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      errorCode: null,
      errorMessage: null,
    });

    log.info("convert.job_complete", {
      jobId: done.id,
      provider: done.provider,
      model: done.model,
      success: true,
      latencyMs: done.latencyMs ?? undefined,
    });

    return done;
  } catch (error) {
    const failed = await writeJob({
      ...job,
      status: "failed",
      statusLabel: "Could not finish",
      errorCode: error instanceof Error ? error.name : "convert_failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "The conversion did not finish. Try again in a moment.",
    });
    log.error("convert.job_failed", {
      jobId: id,
      success: false,
      errorCode: failed.errorCode ?? undefined,
    });
    return failed;
  } finally {
    running.delete(id);
  }
}

function toNutritionInputs(
  items: { rawText: string; name: string | null; quantity: number | null; unit: string | null }[],
): NutritionIngredientInput[] {
  return items.map((item) => ({
    rawText: item.rawText,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  }));
}

export function startJob(id: string) {
  void processJob(id);
}

export async function listRelatedJobs(job: ConversionJob): Promise<ConversionJob[]> {
  const jobs = await listJobs();
  return jobs
    .filter((candidate) => candidate.draftId === job.draftId && sameKitchen(candidate, job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function publicJob(job: ConversionJob) {
  return {
    id: job.id,
    draftId: job.draftId,
    status: job.status,
    statusLabel: job.statusLabel,
    provider: job.provider,
    model: job.model,
    goals: job.goals,
    dietary: job.dietary,
    preference: job.preference,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
