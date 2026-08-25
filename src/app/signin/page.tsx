import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/kitchen";
  const limited = params.reason === "limit";
  const reset = params.reason === "reset";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Sign in to your kitchen</h1>
      <p className="text-lg leading-8 text-teal/80">
        {limited
          ? "The first two conversions are open. Sign in to keep going, save favorites, and publish."
          : reset
            ? "Your password is updated. Sign in with the new one."
            : "History, favorites, collections, and publishing live here. You can still try a recipe without an account."}
      </p>
      <AuthForm mode="signin" next={next} />
    </div>
  );
}
