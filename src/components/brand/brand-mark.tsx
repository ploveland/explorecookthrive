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
        "group inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <img
        src="/brand/logo.png"
        alt="Explore Cook Thrive — Love your food. Nourish your life."
        width={1254}
        height={1254}
        className={cn(
          "h-auto w-auto object-contain",
          compact ? "h-12 sm:h-14" : "h-16 sm:h-20",
        )}
      />
    </Link>
  );
}
