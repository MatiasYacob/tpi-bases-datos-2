import { useState } from "react";
import { errorMessage } from "@/api/client";
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
import { money, type Order, type OrderStatus } from "@/lib/models";

export function OrderDetails({
  order,
  onClose,
  onStatusChange,
  onDeactivate,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
  onDeactivate: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function change(id: string, status: OrderStatus) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onStatusChange(id, status);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setError("");
          onClose();
        }
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
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setError("");
                  onClose();
                }}
              >
                Cerrar
              </Button>
              {nextStatuses[order.estado].map((next) => (
                <Button
                  key={next}
                  disabled={pending}
                  variant={next === "cancelado" ? "destructive" : "default"}
                  onClick={() => void change(order.id, next)}
                >
                  {next === "cancelado"
                    ? "Cancelar pedido"
                    : `Marcar ${statusLabel[next].toLowerCase()}`}
                </Button>
              ))}
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => onDeactivate(order.id)}
              >
                Dar de baja
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
