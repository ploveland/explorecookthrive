import { Badge } from "@/components/ui/badge";
import { COMMUNITY_TESTED_MIN_RATINGS } from "@/server/community/policy";
import type { RatingSummary } from "@/server/community/policy";

export function CommunityBadge({
  summary,
  className,
}: {
  summary: RatingSummary;
  className?: string;
}) {
  if (!summary.communityTested) return null;
  return (
    <Badge
      variant="secondary"
      className={`border-sage/40 bg-sage/25 text-teal ${className ?? ""}`}
    >
      Community Tested
    </Badge>
  );
}

export function communityTestedCopy() {
  return `Community Tested means at least ${COMMUNITY_TESTED_MIN_RATINGS} other kitchens rated taste and texture 4 or higher and would make it again.`;
}
