import type { ReactNode } from "react";
import { safeHttpUrl } from "@/lib/safe-http-url";
import { cn } from "@/lib/utils";
import { planRecipeCover, type CoverInput } from "@/lib/recipe-cover";

export function RecipeCover({
  seed,
  size,
  className,
  photo,
  children,
}: {
  seed: CoverInput;
  size: "thumb" | "card" | "banner" | "hero";
  className?: string;
  photo?: { url: string; alt: string } | null;
  children?: ReactNode;
}) {
  const cover = planRecipeCover(seed);
  const photoUrl = photo?.url ? safeHttpUrl(photo.url) : null;
  const foodPhoto = photoUrl && photo ? { url: photoUrl, alt: photo.alt } : null;
  const decorative = !children && !foodPhoto;

  return (
    <div
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "relative overflow-hidden",
        size === "thumb" && "h-14 w-14 shrink-0 rounded-xl",
        size === "card" && "h-40 w-full sm:h-44",
        size === "banner" && "h-32 w-full sm:h-36",
        size === "hero" && "min-h-52 w-full rounded-3xl sm:min-h-72",
        className,
      )}
      style={{ backgroundImage: cover.backgroundImage }}
    >
      {foodPhoto ? (
        <img
          src={foodPhoto.url}
          alt={foodPhoto.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-35 mix-blend-soft-light"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 13px)",
          }}
        />
      )}
      {children ? (
        <div
          className={cn(
            "relative flex h-full flex-col justify-end bg-[linear-gradient(to_top,rgba(28,46,58,0.62),rgba(28,46,58,0.12)_48%,transparent)]",
            size === "hero"
              ? "min-h-52 px-5 py-5 sm:min-h-72 sm:px-8 sm:py-7"
              : "px-5 py-4 sm:px-6",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
