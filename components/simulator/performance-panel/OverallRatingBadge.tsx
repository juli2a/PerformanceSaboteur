import { getRatingPresentation } from "@/lib/utils/gauge";
import { Badge } from "@/components/ui/badge";
import type { VitalRating } from "@/types/simulator";

interface OverallRatingBadgeProps {
  rating: VitalRating | null;
  className?: string;
}

// Worst-of-LCP/CLS/INP pill, shared by the desktop panel's header and the mobile panel's expanded header, so both surfaces present it identically.
export default function OverallRatingBadge({
  rating,
  className,
}: OverallRatingBadgeProps) {
  if (!rating) return null;
  const { tone, label } = getRatingPresentation(rating);

  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  );
}
