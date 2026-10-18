import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Category,
  Customer,
  Product,
  Order,
  OrderStatus,
  Store,
} from "@/lib/models";
import { apiRequest, errorMessage, readAll } from "./client";
export type Sale = {
  categoria: Category;
  unidadesVendidas: number;
  importeCentavos: number;
};
type CustomerInput = Pick<
  Customer,
  "nombre" | "apellido" | "email" | "contacto"
>;
type ProductInput = Pick<
  Product,
  "nombre" | "descripcion" | "categoria" | "precioCentavos"
>;
type OrderInput = {
  clienteId: string;
  items: { productoId: string; cantidad: number }[];
};
export function salesByCategory(
  from: string,
  until: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (from) query.set("desde", new Date(from + "T00:00:00").toISOString());
  if (until) {
    const end = new Date(until + "T00:00:00");
    end.setDate(end.getDate() + 1);
    query.set("hasta", end.toISOString());
  }
  return apiRequest<{ data: Sale[] }>(
    "/reportes/ventas-por-categoria?" + query,
    { signal },
  ).then((response) => response.data);
}
export function useApiStore() {
  const [store, setStore] = useState<Store>({
    clientes: [],
    productos: [],
    pedidos: [],
  });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const writing = useRef(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const current = ++revision.current;
    try {
      const [clientes, productos, pedidos] = await Promise.all([
        readAll<Customer>("clientes", signal),
        readAll<Product>("productos", signal),
        readAll<Order>("pedidos", signal),
      ]);
      if (current === revision.current) {
        setStore({ clientes, productos, pedidos });
        setReady(true);
        setError("");
      }
    } catch (err) {
      if (signal?.aborted) return;
      if (current === revision.current) setError(errorMessage(err));
    } finally {
      if (!signal?.aborted && current === revision.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function write<T>(
    kind: keyof Store,
    path: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    if (writing.current)
      throw new Error("Hay una operación en curso. Esperá a que termine.");
    writing.current = true;
    setBusy(true);
    ++revision.current;
    try {
      const response = await apiRequest<{ data: T }>(path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      // Aplicar la escritura confirmada antes de refrescar. Un fallo de lectura no repite el POST.
      setStore((current) => {
        const value = response.data as Customer | Product | Order;
        const existing = current[kind] as (Customer | Product | Order)[];
        const remaining = existing.filter((item) => item.id !== value.id);
        const rows =
          method === "DELETE"
            ? remaining
            : [value, ...remaining].sort(
                (a, b) =>
                  b.createdAt.localeCompare(a.createdAt) ||
                  b.id.localeCompare(a.id),
              );
        return { ...current, [kind]: rows };
      });
      await refresh();
      return response.data;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function saveCustomer(input: CustomerInput, id?: string) {
    await write<Customer>(
      "clientes",
      "/clientes" + (id ? "/" + id : ""),
      id ? "PATCH" : "POST",
      input,
    );
  }
  async function saveProduct(input: ProductInput, id?: string) {
    await write<Product>(
      "productos",
      "/productos" + (id ? "/" + id : ""),
      id ? "PATCH" : "POST",
      input,
    );
  }
  async function saveOrder(input: OrderInput) {
    return write<Order>("pedidos", "/pedidos", "POST", input);
  }
  async function changeStatus(id: string, estado: OrderStatus) {
    try {
      await write<Order>("pedidos", "/pedidos/" + id, "PATCH", { estado });
    } catch (err) {
      void refresh();
      throw err;
    }
  }
  async function deactivate(kind: keyof Store, id: string) {
    await write<{ id: string; activo: false }>(
      kind,
      "/" + kind + "/" + id,
      "DELETE",
    );
  }
  return {
    ...store,
    saveCustomer,
    saveProduct,
    saveOrder,
    changeStatus,
    deactivate,
    refresh,
    loading,
    ready,
    error,
    busy,
  };
}
export type ApiStore = ReturnType<typeof useApiStore>;
