import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/constants/catalog";
import type { OrderStatus } from "@/mocks/data";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={`status status-${status}`}>{statusLabel[status]}</Badge>
  );
}
