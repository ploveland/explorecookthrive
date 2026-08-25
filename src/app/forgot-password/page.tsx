import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Account</p>
      <h1 className="font-heading text-4xl text-teal">Forgot your password?</h1>
      <p className="text-lg leading-8 text-teal/80">
        Enter the email for your kitchen. If we have it, you get a one-hour link to choose a new
        password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
