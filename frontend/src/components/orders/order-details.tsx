import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/status-badge";
import {
  categoryLabel,
  nextStatuses,
  statusLabel,
} from "@/lib/constants/catalog";
import { money, type Order, type OrderStatus } from "@/mocks/data";

export function OrderDetails({
  order,
  onClose,
  onStatusChange,
  onDeactivate,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDeactivate: (id: string) => void;
}) {
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="form-dialog">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Pedido #{order.id.slice(-6)}</DialogTitle>
              <DialogDescription>
                Cliente histórico: {order.cliente.nombre}{" "}
                {order.cliente.apellido} · {order.cliente.email}
              </DialogDescription>
            </DialogHeader>
            <div className="order-details">
              {order.items.map((item) => (
                <div className="detail-line" key={item.productoId}>
                  <div>
                    <strong>
                      {item.nombre} × {item.cantidad}
                    </strong>
                    <span>
                      {categoryLabel[item.categoria]} ·{" "}
                      {money(item.precioUnitarioCentavos)} c/u
                    </span>
                  </div>
                  <strong>{money(item.subtotalCentavos)}</strong>
                </div>
              ))}
              <div className="detail-total">
                <strong>Total del pedido</strong>
                <strong>{money(order.totalCentavos)}</strong>
              </div>
              <div className="detail-status">
                Estado actual: <StatusBadge status={order.estado} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {nextStatuses[order.estado].map((next) => (
                <Button
                  key={next}
                  variant={next === "cancelado" ? "destructive" : "default"}
                  onClick={() => onStatusChange(order.id, next)}
                >
                  {next === "cancelado"
                    ? "Cancelar pedido"
                    : `Marcar ${statusLabel[next].toLowerCase()}`}
                </Button>
              ))}
              <Button variant="ghost" onClick={() => onDeactivate(order.id)}>
                Dar de baja
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
