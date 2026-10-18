import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { type Page } from "@/lib/constants/navigation";
import { useMockStore } from "@/mocks/useMockStore";
import { DashboardPage } from "@/pages/dashboard-page";
import { CustomersPage } from "@/pages/customers-page";
import { ProductsPage } from "@/pages/products-page";
import { OrdersPage } from "@/pages/orders-page";
import { ReportsPage } from "@/pages/reports-page";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const mock = useMockStore();

  return (
    <AppShell page={page} onNavigate={setPage}>
      {page === "dashboard" && (
        <DashboardPage
          customers={mock.clientes}
          products={mock.productos}
          orders={mock.pedidos}
        />
      )}
      {page === "clientes" && (
        <CustomersPage
          customers={mock.clientes}
          saveCustomer={mock.saveCustomer}
          deactivate={mock.deactivate}
        />
      )}
      {page === "productos" && (
        <ProductsPage
          products={mock.productos}
          saveProduct={mock.saveProduct}
          deactivate={mock.deactivate}
        />
      )}
      {page === "pedidos" && (
        <OrdersPage
          customers={mock.clientes}
          products={mock.productos}
          orders={mock.pedidos}
          saveOrder={mock.saveOrder}
          changeStatus={mock.changeStatus}
          deactivate={mock.deactivate}
        />
      )}
      {page === "reportes" && (
        <ReportsPage salesByCategory={mock.salesByCategory} />
      )}
      <Toaster richColors position="bottom-right" />
    </AppShell>
  );
}
