import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compareThriveNutrition, linePresence } from "@/server/convert/compare";
import {
  DIETARY_COPY,
  GOAL_COPY,
  PREFERENCE_COPY,
  type ConversionJob,
} from "@/server/convert/schema";
import {
  NUTRIENT_ROWS,
  formatNutrientDelta,
  formatNutrientValue,
  nutrientDeltaClass,
  nutrientDeltaTone,
} from "@/server/nutrition/display";

function choiceBadges(job: ConversionJob) {
  return [
    PREFERENCE_COPY[job.preference].label,
    ...job.goals.map((goal) => GOAL_COPY[goal].label),
    ...job.dietary.map((item) => DIETARY_COPY[item].label),
  ];
}

function ColumnHeader({
  label,
  job,
  number,
}: {
  label: string;
  job: ConversionJob;
  number: number;
}) {
  const title = job.output?.thriveVersion.title ?? `Version ${number}`;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.16em] text-terracotta uppercase">{label}</p>
      <h2 className="font-heading text-2xl text-teal">
        Version {number} · {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {choiceBadges(job).map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
      <Button render={<Link href={`/convert/result/${job.id}`} />} variant="outline">
        Open this version
      </Button>
    </div>
  );
}

export function CompareVersions({
  originalTitle,
  left,
  right,
  leftNumber,
  rightNumber,
}: {
  originalTitle: string;
  left: ConversionJob;
  right: ConversionJob;
  leftNumber: number;
  rightNumber: number;
}) {
  const nutrition = compareThriveNutrition(left, right);
  const leftLines = left.output?.thriveVersion.ingredients.map((item) => item.rawText) ?? [];
  const rightLines = right.output?.thriveVersion.ingredients.map((item) => item.rawText) ?? [];
  const presence = linePresence(leftLines, rightLines);
  const leftOnly = new Set(presence.leftOnly);
  const rightOnly = new Set(presence.rightOnly);

  return (
    <div className="space-y-10">
      <p className="text-sm text-teal/70">
        Original: <span className="font-medium text-teal">{originalTitle}</span>. Change is Version{" "}
        {rightNumber} minus Version {leftNumber}. Better / not better is about that nutrient, not
        which version you should cook.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <ColumnHeader label="Left" job={left} number={leftNumber} />
        <ColumnHeader label="Right" job={right} number={rightNumber} />
      </div>

      {nutrition.left && nutrition.right && nutrition.delta ? (
        <section className="space-y-4 rounded-3xl bg-white/80 p-5 ring-1 ring-teal/10 sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-teal/60 uppercase">
              USDA estimate {nutrition.perServing ? "· per serving" : "· whole recipe"}
            </p>
            <h2 className="font-heading mt-1 text-2xl text-teal">Version vs version</h2>
          </div>
          <p className="text-sm text-teal/75">
            Numbers come from {nutrition.sourceLabel}, not from the language model. They are
            estimates, not medical advice. A lower calorie line is not automatically a better recipe.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-left text-teal/60">
                  <th className="py-2 pr-3 font-medium"> </th>
                  <th className="py-2 pr-3 font-medium">Version {leftNumber}</th>
                  <th className="py-2 pr-3 font-medium">Version {rightNumber}</th>
                  <th className="py-2 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {NUTRIENT_ROWS.map((row) => {
                  const change = nutrition.delta![row.key];
                  return (
                    <tr key={row.key} className="border-b border-teal/5">
                      <td className="py-2.5 pr-3 text-teal">{row.label}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-teal/80">
                        {formatNutrientValue(row.key, nutrition.left![row.key])}
                        {row.suffix}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums font-medium text-teal">
                        {formatNutrientValue(row.key, nutrition.right![row.key])}
                        {row.suffix}
                      </td>
                      <td className={`py-2.5 tabular-nums font-medium ${nutrientDeltaClass(change, row.invert)}`}>
                        <span className="sr-only">
                          {row.label} {formatNutrientDelta(row.key, change)}
                          {row.suffix}, {nutrientDeltaTone(change, row.invert)}
                        </span>
                        <span aria-hidden>
                          {formatNutrientDelta(row.key, change)}
                          {row.suffix}
                          {Math.abs(change) >= 0.05 ? (
                            <span className="ml-1 text-xs font-normal">
                              {nutrientDeltaTone(change, row.invert) === "improved" ? "better" : "not better"}
                            </span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl bg-sage/15 px-4 py-3 text-sm text-teal ring-1 ring-sage/40">
          One of these versions is missing USDA estimates, so there is no nutrition table to compare.
        </p>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-teal/10">
          <h2 className="font-heading text-2xl text-teal">Version {leftNumber} ingredients</h2>
          <ul className="mt-3 space-y-2 text-sm text-teal">
            {leftLines.map((line) => (
              <li key={line} className={leftOnly.has(line) ? "font-medium" : "text-teal/80"}>
                {line}
                {leftOnly.has(line) ? (
                  <span className="mt-0.5 block text-xs font-normal text-teal/60">Only in this version</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-terracotta/30">
          <h2 className="font-heading text-2xl text-teal">Version {rightNumber} ingredients</h2>
          <ul className="mt-3 space-y-2 text-sm text-teal">
            {rightLines.map((line) => (
              <li key={line} className={rightOnly.has(line) ? "font-medium" : "text-teal/80"}>
                {line}
                {rightOnly.has(line) ? (
                  <span className="mt-0.5 block text-xs font-normal text-teal/60">Only in this version</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChangeList number={leftNumber} job={left} />
        <ChangeList number={rightNumber} job={right} />
      </section>
    </div>
  );
}

function ChangeList({ number, job }: { number: number; job: ConversionJob }) {
  const changes = job.output?.changes ?? [];
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-2xl text-teal">Version {number} vs the original</h2>
      <ul className="space-y-3">
        {changes.map((change) => (
          <li key={`${change.original}-${change.suggested}`} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-teal/10">
            <p className="text-sm font-medium text-teal">
              {change.original} → {change.suggested}
            </p>
            <p className="mt-2 text-sm text-teal/80">{change.nutritionReason}</p>
            <p className="mt-1 text-sm text-teal/70">Flavor: {change.flavorEffect}</p>
            <p className="text-sm text-teal/70">Texture: {change.textureEffect}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
