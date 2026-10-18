import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { type Page } from "@/lib/constants/navigation";
import { useApiStore } from "@/api/use-api-store";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/pages/dashboard-page";
import { CustomersPage } from "@/pages/customers-page";
import { ProductsPage } from "@/pages/products-page";
import { OrdersPage } from "@/pages/orders-page";
import { ReportsPage } from "@/pages/reports-page";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const api = useApiStore();

  return (
    <AppShell page={page} onNavigate={setPage}>
      {api.error && (
        <section className="surface" role="alert">
          <p>{api.error}</p>
          <Button disabled={api.busy} onClick={() => void api.refresh()}>
            Reintentar carga
          </Button>
        </section>
      )}
      {api.loading && <p role="status">Cargando datos…</p>}
      {!api.loading && api.ready && (
        <fieldset
          disabled={api.busy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          {page === "dashboard" && (
            <DashboardPage
              customers={api.clientes}
              products={api.productos}
              orders={api.pedidos}
            />
          )}
          {page === "clientes" && (
            <CustomersPage
              customers={api.clientes}
              saveCustomer={api.saveCustomer}
              deactivate={api.deactivate}
            />
          )}
          {page === "productos" && (
            <ProductsPage
              products={api.productos}
              saveProduct={api.saveProduct}
              deactivate={api.deactivate}
            />
          )}
          {page === "pedidos" && (
            <OrdersPage
              customers={api.clientes}
              products={api.productos}
              orders={api.pedidos}
              saveOrder={api.saveOrder}
              changeStatus={api.changeStatus}
              deactivate={api.deactivate}
            />
          )}
          {page === "reportes" && <ReportsPage />}
        </fieldset>
      )}
      <Toaster richColors position="bottom-right" />
    </AppShell>
  );
}
