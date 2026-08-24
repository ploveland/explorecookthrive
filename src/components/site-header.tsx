import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { signOutAction } from "@/app/signin/sign-out-action";
import { currentAccount } from "@/server/accounts/session";

const links = [
  { href: "/recipes", label: "Recipes" },
  { href: "/search", label: "Search" },
  { href: "/kitchen", label: "Kitchen" },
];

export async function SiteHeader() {
  const account = await currentAccount();

  return (
    <header className="sticky top-0 z-40 border-b border-teal/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandMark compact />
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-teal hover:bg-sage/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
          {account.user ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm font-medium text-teal hover:bg-sage/20"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/signin"
              className="rounded-full px-3 py-2 text-sm font-medium text-teal hover:bg-sage/20"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/#thrive"
            className="rounded-full bg-terracotta-strong px-4 py-2 text-sm font-semibold text-cream shadow-sm hover:bg-terracotta-strong/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Thrive a recipe
          </Link>
        </nav>
      </div>
    </header>
  );
}
