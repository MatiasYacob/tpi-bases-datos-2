import type { Category, Customer, Order, Product } from "./data";

export function dashboardSummary(
  customers: Customer[],
  products: Product[],
  orders: Order[],
) {
  return {
    activeCustomers: customers.length,
    availableProducts: products.length,
    registeredOrders: orders.length,
    completedSalesCents: orders
      .filter((item) => item.estado === "completado")
      .reduce((sum, item) => sum + item.totalCentavos, 0),
  };
}

export function reportSummary(
  report: {
    categoria: Category;
    unidadesVendidas: number;
    importeCentavos: number;
  }[],
) {
  return {
    categories: report.length,
    units: report.reduce((sum, item) => sum + item.unidadesVendidas, 0),
    amountCents: report.reduce((sum, item) => sum + item.importeCentavos, 0),
    maxAmountCents: Math.max(1, ...report.map((item) => item.importeCentavos)),
  };
}

export function estimateOrderCents(
  items: { productoId: string; cantidad: number }[],
  products: Product[],
) {
  return items.reduce(
    (sum, item) =>
      sum +
      (products.find((product) => product.id === item.productoId)
        ?.precioCentavos || 0) *
        item.cantidad,
    0,
  );
}
