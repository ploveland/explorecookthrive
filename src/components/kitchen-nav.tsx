import Link from "next/link";
import { currentAccount } from "@/server/accounts/session";

const items = [
  { href: "/kitchen", label: "History" },
  { href: "/kitchen/favorites", label: "Favorites" },
  { href: "/kitchen/collections", label: "Collections" },
];

export async function KitchenNav() {
  const account = await currentAccount();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">Kitchen</p>
        <h1 className="font-heading mt-2 text-4xl text-teal">
          {account.user ? `${account.user.name}’s kitchen` : "Your kitchen"}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-teal/80">
          {account.user
            ? "Conversions, favorites, and collections stay with this account on this machine."
            : "Guest conversions land here for a while. Sign in to keep them, favorite recipes, and publish."}
        </p>
      </div>
      <nav aria-label="Kitchen" className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-teal ring-1 ring-teal/10 hover:bg-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
