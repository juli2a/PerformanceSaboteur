import type { LogisticStatus } from "@/types/inventory";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

const STATUS_TONE: Record<LogisticStatus, BadgeTone> = {
  "In Stock": "instock",
  "To Order": "toorder",
  Ordered: "ordered",
  "In Transit": "transit",
  "Out of Stock": "outofstock",
};

export function getStatusTone(status: LogisticStatus): BadgeTone {
  return STATUS_TONE[status];
}

// Solid (non-tinted) dot color for plain status pickers, e.g. the Bulk Actions status list, which uses a colored dot + plain label instead of the tinted Badge pill used for the status column itself.
const STATUS_DOT_CLASS: Record<LogisticStatus, string> = {
  "In Stock": "bg-status-instock",
  "To Order": "bg-status-toorder",
  Ordered: "bg-status-ordered",
  "In Transit": "bg-status-transit",
  "Out of Stock": "bg-status-outofstock",
};

export function getStatusDotClass(status: LogisticStatus): string {
  return STATUS_DOT_CLASS[status];
}

// Tinted background + matching text color for selectable status rows (the mobile status-change sheet), combined into one literal string per status so Tailwind's scanner sees the full class names (template interpolation like `bg-status-${slug}/12` wouldn't be picked up by the JIT scanner).
const STATUS_ROW_CLASS: Record<LogisticStatus, string> = {
  "In Stock": "bg-status-instock/12 text-status-instock",
  "To Order": "bg-status-toorder/12 text-status-toorder",
  Ordered: "bg-status-ordered/12 text-status-ordered",
  "In Transit": "bg-status-transit/12 text-status-transit",
  "Out of Stock": "bg-status-outofstock/12 text-status-outofstock",
};

export function getStatusRowClass(status: LogisticStatus): string {
  return STATUS_ROW_CLASS[status];
}
