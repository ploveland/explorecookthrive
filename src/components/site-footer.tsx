import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-teal/10 bg-teal text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-heading text-2xl">
            <span className="text-cream">Explore</span>{" "}
            <span className="text-sage">Cook</span>{" "}
            <span className="text-terracotta">Thrive</span>
          </p>
          <p className="mt-2 max-w-md text-sm text-cream/85">
            Love your food. Nourish your life. We start with a recipe you already
            like, then look for nutrition wins that leave the dish itself intact.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link className="underline-offset-4 hover:underline" href="/recipes">
            Recipe library
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/search">
            Search
          </Link>
          <p className="text-cream/70">Nutrition figures will always be estimates.</p>
        </div>
      </div>
    </footer>
  );
}
