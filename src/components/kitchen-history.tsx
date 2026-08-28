import Link from "next/link";
import { KitchenComparePicker } from "@/components/kitchen-compare-picker";
import { RecipeCover } from "@/components/recipe-cover";
import { Button } from "@/components/ui/button";
import { coverInputFromOriginal } from "@/lib/recipe-cover";
import type { ConversionJob } from "@/server/convert/schema";
import { completeVersions, choiceLine, groupJobsByOriginal, versionNumberFor } from "@/server/convert/versions";

function versionTitle(job: ConversionJob, number: number | null) {
  const label = number ? `Version ${number}` : job.statusLabel;
  const title = job.output?.thriveVersion.title;
  return title ? `${label} · ${title}` : label;
}

export function KitchenHistory({
  jobs,
  publishedSlugs,
}: {
  jobs: ConversionJob[];
  publishedSlugs: Record<string, string>;
}) {
  const groups = groupJobsByOriginal(jobs);

  return (
    <ul className="space-y-4">
      {groups.map((group) => {
        const againFrom =
          group.jobs.find((job) => job.status === "complete" || job.status === "failed") ?? group.latest;
        return (
          <li key={group.draftId} className="overflow-hidden rounded-3xl bg-white/80 ring-1 ring-teal/10">
            <RecipeCover seed={coverInputFromOriginal(group)} size="banner">
              <p className="text-xs font-semibold tracking-[0.16em] text-cream/80 uppercase">Original</p>
              <h2 className="font-heading mt-1 line-clamp-2 text-2xl text-cream">{group.originalTitle}</h2>
            </RecipeCover>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-teal/70">
                {group.completeCount === 1
                  ? "1 Thrive Version"
                  : `${group.completeCount} Thrive Versions`}
                {group.jobs.length > group.completeCount
                  ? ` · ${group.jobs.length - group.completeCount} still working or failed`
                  : null}
              </p>
              <ul className="mt-4 space-y-3">
                {group.jobs.map((job) => {
                  const number = versionNumberFor(group.jobs, job.id);
                  const slug = publishedSlugs[job.id];
                  return (
                    <li
                      key={job.id}
                      className="rounded-2xl bg-cream/80 px-4 py-3 ring-1 ring-teal/10"
                    >
                      <p className="font-medium text-teal">{versionTitle(job, number)}</p>
                      <p className="mt-1 text-sm text-teal/70">{choiceLine(job)}</p>
                      <p className="mt-1 text-xs text-teal/55">
                        {new Date(job.createdAt).toLocaleString()} ·{" "}
                        {job.provider === "mock" ? "Culinary mock" : "OpenAI"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.status === "complete" ? (
                          <Button render={<Link href={`/convert/result/${job.id}`} />} variant="outline">
                            Open
                          </Button>
                        ) : (
                          <Button render={<Link href={`/convert/working/${job.id}`} />} variant="outline">
                            Check progress
                          </Button>
                        )}
                        {job.status === "complete" && slug ? (
                          <Button render={<Link href={`/recipes/${slug}`} />} variant="outline">
                            View in the library
                          </Button>
                        ) : null}
                        {job.status === "complete" && !slug ? (
                          <Button
                            render={<Link href={`/convert/result/${job.id}#save-to-library`} />}
                            className="bg-terracotta-strong text-cream"
                          >
                            Save to the library
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {againFrom.status === "complete" || againFrom.status === "failed" ? (
                <Button
                  render={<Link href={`/convert/again/${againFrom.id}`} />}
                  className="mt-4 h-10 bg-terracotta-strong px-4 text-cream"
                >
                  Thrive again
                </Button>
              ) : null}
              <KitchenComparePicker versions={completeVersions(group.jobs)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
