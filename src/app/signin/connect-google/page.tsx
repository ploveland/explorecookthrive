import Link from "next/link";
import { ConnectGoogleForm } from "@/components/connect-google-form";
import { peekGoogleLink } from "@/server/accounts/google";

export const dynamic = "force-dynamic";

export default async function ConnectGooglePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const pending = token ? await peekGoogleLink(token) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Connect Google to this kitchen</h1>
      {pending ? (
        <>
          <p className="text-lg leading-8 text-teal/80">
            A kitchen already uses {pending.email}. Enter that password to attach this Google
            account. We do not merge kitchens on email alone.
          </p>
          <ConnectGoogleForm token={token} email={pending.email} />
        </>
      ) : (
        <>
          <p className="text-lg leading-8 text-teal/80">
            That Google link expired. Sign in with Google again if you still want to connect it.
          </p>
          <p className="text-sm text-teal/75">
            <Link className="font-medium underline-offset-4 hover:underline" href="/signin">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
