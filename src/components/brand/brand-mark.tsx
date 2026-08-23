import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <img
        src="/brand/mark.svg"
        alt=""
        width={44}
        height={44}
        className="size-11 rounded-full ring-2 ring-cream"
      />
      <span className="leading-none">
        <span className="font-heading block text-lg tracking-tight">
          <span className="text-teal">Explore</span>{" "}
          <span className="text-sage">Cook</span>{" "}
          <span className="text-terracotta">Thrive</span>
        </span>
        {!compact ? (
          <span className="mt-1 block text-xs tracking-[0.12em] text-teal/80 uppercase">
            Love your food. Nourish your life.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
