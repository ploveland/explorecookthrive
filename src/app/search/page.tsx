import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6">
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
          Search
        </p>
        <h1 className="font-heading mt-2 text-4xl text-teal">Find a Thrive Version</h1>
        <p className="mt-3 text-lg leading-8 text-teal/80">
          Full-text search over names, ingredients, cuisines, and tags lands with the
          library. For now, the index is empty on purpose.
        </p>
      </header>
      <form role="search" className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="q"
          placeholder="e.g. buttermilk biscuits, weeknight chicken"
          aria-label="Search recipes"
          className="h-12 flex-1 bg-white/80"
        />
        <Button type="submit" className="h-12 bg-teal px-6 text-cream">
          Search
        </Button>
      </form>
      <p className="rounded-2xl bg-white/70 p-4 text-sm text-teal/80 ring-1 ring-teal/10">
        Nothing published yet. Thrive a recipe first, then this page will have
        something worth finding.
      </p>
    </div>
  );
}
