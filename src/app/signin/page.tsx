import { AuthForm } from "@/components/auth-form";
import { googleAuthConfigured, googleAuthFailureCopy } from "@/server/accounts/google";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/kitchen";
  const limited = params.reason === "limit";
  const reset = params.reason === "reset";
  const googleFailure = googleAuthFailureCopy(params.reason);
  const oauthError = Boolean(params.error) && !googleFailure && !limited && !reset;
  const googleEnabled = googleAuthConfigured();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Sign in to your kitchen</h1>
      <p className="text-lg leading-8 text-teal/80">
        {limited
          ? "The first two conversions are open. Sign in to keep going, save favorites, and publish."
          : reset
            ? "Your password is updated. Sign in with the new one."
            : googleFailure
              ? googleFailure
              : oauthError
                ? "Google sign-in did not finish. Try again, or use your email and password."
                : googleEnabled
                  ? "Continue with Google, or use the email and password for this kitchen. You can still try a recipe without an account."
                  : "History, favorites, collections, and publishing live here. You can still try a recipe without an account."}
      </p>
      <AuthForm mode="signin" next={next} googleEnabled={googleEnabled} />
    </div>
  );
}
