import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim() ?? "";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Choose a new password</h1>
      {token ? (
        <>
          <p className="text-lg leading-8 text-teal/80">
            Pick something you can remember. This link works once and expires in an hour.
          </p>
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <>
          <p className="text-lg leading-8 text-teal/80">
            This reset link is missing or incomplete. Request a new one from the sign-in page.
          </p>
          <p className="text-sm text-teal/75">
            <Link className="font-medium underline-offset-4 hover:underline" href="/forgot-password">
              Forgot your password?
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
