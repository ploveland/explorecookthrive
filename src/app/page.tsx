import { DiscoveryRails } from "@/components/discovery-rails";
import { ThriveIntakeForm } from "@/components/thrive-intake-form";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#E07A5F22,transparent_32%),radial-gradient(circle_at_left,#8DA78A33,transparent_28%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <img
              src="/brand/logo.png"
              alt="Explore Cook Thrive — Love your food. Nourish your life."
              width={1254}
              height={1254}
              className="mb-6 h-auto w-44 max-w-full object-contain sm:w-56"
            />
            <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
              Keep the flavor. Improve the recipe.
            </p>
            <h1 className="font-heading mt-4 text-4xl leading-[1.1] text-balance text-teal sm:text-5xl lg:text-6xl">
              Love the recipe. Want to make it better?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-teal/85">
              Paste a recipe you already cook, or bring one in from a URL. We look
              for nutrition changes that earn their keep — and we leave butter,
              crust, cheese, and fire alone when they are why the dish works.
            </p>
            <ul className="mt-8 grid gap-3 text-sm text-teal sm:grid-cols-3">
              <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-teal/10">
                No applesauce-for-butter defaults
              </li>
              <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-teal/10">
                Estimated nutrition, never a medical claim
              </li>
              <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-teal/10">
                The original stays yours
              </li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white/80 p-5 shadow-[0_24px_60px_-32px_rgba(61,90,128,0.55)] ring-1 ring-teal/10 sm:p-7">
            <h2 className="font-heading text-2xl text-teal">Thrive This Recipe</h2>
            <p className="mt-1 mb-5 text-sm text-teal/75">
              Start with the version you already like. Confirmation comes before any rewrite.
            </p>
            <ThriveIntakeForm />
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <DiscoveryRails />
      </section>
    </div>
  );
}
