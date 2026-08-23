import Link from "next/link";

const rails = [
  {
    title: "Recently Thrived",
    body: "New Thrive Versions will land here after the first conversions are published.",
  },
  {
    title: "Comfort food, reworked",
    body: "The dishes people refuse to give up — fried chicken, mac and cheese, biscuits — treated with respect.",
  },
  {
    title: "High protein",
    body: "Dinners that already eat like dinner, with more staying power.",
  },
  {
    title: "Better baking",
    body: "Cakes, breads, and cookies where structure matters as much as sugar.",
  },
  {
    title: "Weeknight meals",
    body: "Tuesday food. One pan when we can. Flavor first.",
  },
  {
    title: "Biggest nutrition improvements",
    body: "When a small technique change moves calories, sodium, or fiber in a meaningful way.",
  },
];

export function DiscoveryRails() {
  return (
    <section aria-labelledby="discover-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-terracotta uppercase">
            From the library
          </p>
          <h2 id="discover-heading" className="font-heading mt-1 text-3xl text-teal">
            Recipes worth keeping
          </h2>
        </div>
        <Link
          href="/recipes"
          className="hidden text-sm font-medium text-teal underline-offset-4 hover:underline sm:inline"
        >
          Browse all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rails.map((rail) => (
          <article
            key={rail.title}
            className="rounded-2xl border border-teal/10 bg-white/70 p-5 shadow-[0_10px_30px_-24px_rgba(61,90,128,0.6)]"
          >
            <div className="mb-4 h-28 rounded-xl bg-[linear-gradient(135deg,#8DA78A_0%,#3D5A80_55%,#E07A5F_120%)] opacity-90" />
            <h3 className="font-heading text-xl text-teal">{rail.title}</h3>
            <p className="mt-2 text-sm leading-6 text-teal/80">{rail.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
