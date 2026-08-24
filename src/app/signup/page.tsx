import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/kitchen";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Make a kitchen</h1>
      <p className="text-lg leading-8 text-teal/80">
        Email and a password. No newsletter, no paywall. This keeps your conversions, favorites,
        and collections on this machine until a hosted login is wired.
      </p>
      <AuthForm mode="signup" next={next} />
    </div>
  );
}
