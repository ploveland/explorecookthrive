import type { NutritionComparison } from "@/server/nutrition/schema";
import {
  NUTRIENT_ROWS,
  confidenceCopy,
  formatNutrientDelta,
  formatNutrientValue,
  nutrientDeltaClass,
  nutrientDeltaTone,
} from "@/server/nutrition/display";

export function ConvertNutrition({ nutrition }: { nutrition: NutritionComparison }) {
  const original = nutrition.original.perServing ?? nutrition.original.totals;
  const thrive = nutrition.thrive.perServing ?? nutrition.thrive.totals;
  const delta = nutrition.deltaPerServing;
  const perServing = Boolean(nutrition.original.perServing && nutrition.thrive.perServing);
  const weaker = [nutrition.original.confidence, nutrition.thrive.confidence].includes("low")
    ? "low"
    : [nutrition.original.confidence, nutrition.thrive.confidence].includes("medium")
      ? "medium"
      : "high";

  return (
    <section className="space-y-4 rounded-3xl bg-white/80 p-5 ring-1 ring-teal/10 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-teal/60 uppercase">
            USDA estimate {perServing ? "· per serving" : "· whole recipe"}
          </p>
          <h2 className="font-heading mt-1 text-2xl text-teal">Original vs Thrive</h2>
        </div>
        <p className="text-xs font-medium tracking-wide text-teal/70 uppercase">
          Confidence: {weaker}
        </p>
      </div>

      <p className="text-sm text-teal/75">
        {confidenceCopy(weaker)}. Numbers come from {nutrition.sourceLabel}, not from the language
        model. They are estimates, not medical advice.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-left text-teal/60">
              <th className="py-2 pr-3 font-medium"> </th>
              <th className="py-2 pr-3 font-medium">Original</th>
              <th className="py-2 pr-3 font-medium">Thrive</th>
              <th className="py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {NUTRIENT_ROWS.map((row) => {
              const change = delta?.[row.key] ?? thrive[row.key] - original[row.key];
              return (
                <tr key={row.key} className="border-b border-teal/5">
                  <td className="py-2.5 pr-3 text-teal">{row.label}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-teal/80">
                    {formatNutrientValue(row.key, original[row.key])}
                    {row.suffix}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums font-medium text-teal">
                    {formatNutrientValue(row.key, thrive[row.key])}
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

      {[...nutrition.original.notes, ...nutrition.thrive.notes].length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-teal/70">
          {[...new Set([...nutrition.original.notes, ...nutrition.thrive.notes])].map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <details className="text-sm text-teal/80">
        <summary className="cursor-pointer font-medium text-teal">Ingredient matching</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <MatchList title="Original" items={nutrition.original.ingredients} />
          <MatchList title="Thrive Version" items={nutrition.thrive.ingredients} />
        </div>
      </details>
    </section>
  );
}

function MatchList({
  title,
  items,
}: {
  title: string;
  items: NutritionComparison["original"]["ingredients"];
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-teal/55 uppercase">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={`${title}-${item.rawText}`} className="text-teal/80">
            <span className="block text-teal">{item.rawText}</span>
            <span className="block text-xs text-teal/60">
              {item.status === "ignored"
                ? "Not counted"
                : item.matchedName
                  ? `${item.matchedName}${item.grams ? ` · ${Math.round(item.grams)}g` : ""}`
                  : "Unmapped"}
              {item.note ? ` — ${item.note}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
