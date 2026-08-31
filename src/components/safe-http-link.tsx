import type { ReactNode } from "react";
import { safeHttpUrl } from "@/lib/safe-http-url";

export function SafeHttpLink({
  href,
  children,
  className,
  rel = "noreferrer noopener",
}: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
  rel?: string;
}) {
  const url = safeHttpUrl(href);
  if (!url) return null;
  return (
    <a className={className} href={url} rel={rel}>
      {children}
    </a>
  );
}
