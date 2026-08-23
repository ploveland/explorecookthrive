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
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-teal shadow-[inset_0_0_0_3px_#FDFCDC]">
        <svg
          viewBox="0 0 48 48"
          className="size-8"
          aria-hidden="true"
        >
          <path
            d="M10 30c4-9 10-14 14-15 4 1 10 6 14 15"
            fill="none"
            stroke="#E07A5F"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M18 29c2-7 5-11 6-12 1 1 4 5 6 12"
            fill="#8DA78A"
          />
          <ellipse cx="24" cy="33" rx="12" ry="5" fill="#FDFCDC" />
          <ellipse cx="24" cy="33" rx="12" ry="5" fill="none" stroke="#FDFCDC" strokeWidth="2" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="font-heading block text-lg tracking-tight text-teal">
          Explore Cook Thrive
        </span>
        {!compact ? (
          <span className="mt-1 block text-xs text-teal/80">
            Keep the flavor. Improve the recipe.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
