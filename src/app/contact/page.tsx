import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email Explore Cook Thrive at hello@explorecookthrive.com.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Contact</p>
      <h1 className="font-heading text-4xl text-teal">Say hello</h1>
      <p className="max-w-xl text-lg leading-8 text-teal/80">
        Questions about a Thrive Version, your kitchen, or the library? Write to{" "}
        <a className="font-medium text-teal underline-offset-4 hover:underline" href={CONTACT_MAILTO}>
          {CONTACT_EMAIL}
        </a>
        . This is a real inbox, not a ticket form.
      </p>
      <p className="max-w-xl text-sm leading-6 text-teal/70">
        Nutrition numbers on the site are USDA estimates, not medical advice. For account recovery,
        use Forgot your password on the sign-in page if you can; otherwise mention the email on the
        kitchen in your note.
      </p>
      <Button
        render={<a href={CONTACT_MAILTO} />}
        className="h-11 w-fit bg-terracotta-strong px-5 text-cream"
      >
        Email {CONTACT_EMAIL}
      </Button>
    </div>
  );
}
