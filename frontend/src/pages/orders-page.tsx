import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { OrderTable } from "@/components/common/order-table";
import { ConfirmDeactivateDialog } from "@/components/common/confirm-deactivate-dialog";
import { Pager } from "@/components/common/pager";
import { PageHeader } from "@/components/common/page-header";
import { OrderForm } from "@/components/forms/order-form";
import { OrderDetails } from "@/components/orders/order-details";
import { usePagination } from "@/hooks/usePagination";
import { statusLabel } from "@/lib/constants/catalog";
import type { OrderStatus } from "@/mocks/data";
import type { MockStore } from "@/mocks/useMockStore";

export function OrdersPage({
  customers,
  products,
  orders,
  saveOrder,
  changeStatus,
  deactivate,
}: {
  customers: MockStore["clientes"];
  products: MockStore["productos"];
  orders: MockStore["pedidos"];
} & Pick<MockStore, "saveOrder" | "changeStatus" | "deactivate">) {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = orders
    .filter((item) => !status || item.estado === status)
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
  const { page, setPage, visible } = usePagination(filtered);
  const selected = orders.find((item) => item.id === detailsId) ?? null;

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Seguimiento de compras y estados"
        action={
          <Button size="lg" onClick={() => setFormOpen(true)}>
            <Plus /> Crear pedido
          </Button>
        }
      />
      <div className="filters">
        <NativeSelect
          aria-label="Filtrar por estado"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "");
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <section className="surface table-surface">
        <OrderTable orders={visible} onDetails={setDetailsId} />
      </section>
      <Pager total={filtered.length} page={page} onChange={setPage} />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="form-dialog">
          <OrderForm
            customers={customers}
            products={products}
            onCancel={() => setFormOpen(false)}
            onSave={(input) => {
              const error = saveOrder(input);
              if (!error) {
                setFormOpen(false);
                toast.success("Pedido creado con el total calculado");
              }
              return error;
            }}
          />
        </DialogContent>
      </Dialog>
      <OrderDetails
        order={selected}
        onClose={() => setDetailsId(null)}
        onStatusChange={(id, next) => {
          if (changeStatus(id, next)) {
            setDetailsId(null);
            toast.success(`Pedido ${statusLabel[next].toLowerCase()}`);
          }
        }}
        onDeactivate={(id) => {
          setDetailsId(null);
          setDeleteId(id);
        }}
      />
      <ConfirmDeactivateDialog
        open={deleteId !== null}
        entity="pedido"
        description="Dejará de aparecer en los listados y reportes activos. Esto es distinto de cancelar el pedido."
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deactivate("pedidos", deleteId);
          setDeleteId(null);
          toast.success("Pedido dado de baja");
        }}
      />
    </>
  );
}
