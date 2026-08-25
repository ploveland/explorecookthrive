import {
  DIETARY_COPY,
  GOAL_COPY,
  PREFERENCE_COPY,
  type ConversionJob,
} from "./schema";

export type OriginalGroup = {
  draftId: string;
  originalTitle: string;
  latest: ConversionJob;
  jobs: ConversionJob[];
  completeCount: number;
};

export type ThriveVersionSummary = {
  id: string;
  versionNumber: number;
  title: string;
  choices: string;
  createdAt: string;
};

export function choiceLine(job: ConversionJob) {
  return [
    PREFERENCE_COPY[job.preference].label,
    ...job.goals.map((goal) => GOAL_COPY[goal].label),
    ...job.dietary.map((item) => DIETARY_COPY[item].label),
  ].join(" · ");
}

export function completeVersions(jobs: ConversionJob[]): ThriveVersionSummary[] {
  return jobs
    .filter((job) => job.status === "complete")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((job, index) => ({
      id: job.id,
      versionNumber: index + 1,
      title: job.output?.thriveVersion.title ?? `Version ${index + 1}`,
      choices: choiceLine(job),
      createdAt: job.createdAt,
    }));
}

export function versionNumberFor(jobs: ConversionJob[], jobId: string): number | null {
  return completeVersions(jobs).find((version) => version.id === jobId)?.versionNumber ?? null;
}

export function groupJobsByOriginal(jobs: ConversionJob[]): OriginalGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, ConversionJob[]>();
  for (const job of jobs) {
    const existing = buckets.get(job.draftId);
    if (!existing) {
      buckets.set(job.draftId, [job]);
      order.push(job.draftId);
      continue;
    }
    existing.push(job);
  }

  return order.map((draftId) => {
    const grouped = buckets.get(draftId) ?? [];
    const latest = grouped[0]!;
    return {
      draftId,
      originalTitle: latest.recipe.originalTitle || latest.recipe.title,
      latest,
      jobs: grouped,
      completeCount: grouped.filter((job) => job.status === "complete").length,
    };
  });
}

export function sameKitchen(a: ConversionJob, b: ConversionJob) {
  if (a.userId && b.userId) return a.userId === b.userId;
  if (a.guestId && b.guestId) return a.guestId === b.guestId;
  return !a.userId && !b.userId && !a.guestId && !b.guestId;
}
