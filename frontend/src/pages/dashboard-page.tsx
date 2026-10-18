import { Metric } from "@/components/common/metric";
import { OrderTable } from "@/components/common/order-table";
import { PageHeader } from "@/components/common/page-header";
import { money, type Customer, type Product, type Order } from "@/mocks/data";
import { dashboardSummary } from "@/mocks/selectors";

export function DashboardPage({
  customers,
  products,
  orders,
}: {
  customers: Customer[];
  products: Product[];
  orders: Order[];
}) {
  const summary = dashboardSummary(customers, products, orders);
  const recent = [...orders]
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    )
    .slice(0, 4);
  return (
    <>
      <PageHeader
        title="Resumen general"
        subtitle="Una vista rápida de la actividad de tu tienda"
      />
      <div className="metrics">
        <Metric
          label="Clientes activos"
          value={String(summary.activeCustomers)}
        />
        <Metric
          label="Productos disponibles"
          value={String(summary.availableProducts)}
        />
        <Metric
          label="Pedidos registrados"
          value={String(summary.registeredOrders)}
        />
        <Metric
          label="Ventas completadas"
          value={money(summary.completedSalesCents)}
        />
      </div>
      <section className="surface">
        <h2>Pedidos recientes</h2>
        <OrderTable orders={recent} />
      </section>
      <section className="surface explainer">
        <h2>¿Qué permite demostrar este prototipo?</h2>
        <p>
          Altas, edición y bajas lógicas de clientes y productos; creación de
          pedidos con instantáneas, transiciones de estado y ventas por
          categoría. Los cambios permanecen en memoria hasta recargar la página.
        </p>
      </section>
    </>
  );
}
