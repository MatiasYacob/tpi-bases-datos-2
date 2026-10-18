import { useState } from "react";
import { nextStatuses } from "@/lib/constants/catalog";
import {
  initialStore,
  type Category,
  type Customer,
  type Order,
  type OrderStatus,
  type Product,
  type Store,
} from "./data";

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
type Sale = {
  categoria: Category;
  unidadesVendidas: number;
  importeCentavos: number;
};

const newBase = () => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID().replaceAll("-", "").slice(0, 24),
    activo: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
};

export function useMockStore() {
  const [store, setStore] = useState<Store>(() =>
    structuredClone(initialStore),
  );
  const clientes = store.clientes.filter((item) => item.activo);
  const productos = store.productos.filter((item) => item.activo);
  const pedidos = store.pedidos.filter((item) => item.activo);

  function saveCustomer(input: CustomerInput, id?: string): string | null {
    const email = input.email.trim().toLowerCase();
    if (store.clientes.some((item) => item.email === email && item.id !== id))
      return "Ese email ya está registrado. Usá otro.";
    const value = { ...input, email };
    setStore((current) => ({
      ...current,
      clientes: id
        ? current.clientes.map((item) =>
            item.id === id
              ? { ...item, ...value, updatedAt: new Date().toISOString() }
              : item,
          )
        : [{ ...newBase(), ...value }, ...current.clientes],
    }));
    return null;
  }

  function saveProduct(value: ProductInput, id?: string): void {
    setStore((current) => ({
      ...current,
      productos: id
        ? current.productos.map((item) =>
            item.id === id
              ? { ...item, ...value, updatedAt: new Date().toISOString() }
              : item,
          )
        : [{ ...newBase(), ...value }, ...current.productos],
    }));
  }

  function saveOrder(input: OrderInput): string | null {
    const customer = clientes.find((item) => item.id === input.clienteId);
    const lines = input.items;
    if (
      !customer ||
      lines.length < 1 ||
      lines.length > 50 ||
      new Set(lines.map((item) => item.productoId)).size !== lines.length ||
      lines.some(
        (item) =>
          !Number.isInteger(item.cantidad) ||
          item.cantidad < 1 ||
          item.cantidad > 100 ||
          !productos.some((product) => product.id === item.productoId),
      )
    ) {
      return "Elegí un cliente activo y entre 1 y 50 productos distintos, con cantidades de 1 a 100.";
    }
    const items = lines.map((line) => {
      const product = productos.find((item) => item.id === line.productoId)!;
      return {
        productoId: product.id,
        nombre: product.nombre,
        categoria: product.categoria,
        precioUnitarioCentavos: product.precioCentavos,
        cantidad: line.cantidad,
        subtotalCentavos: product.precioCentavos * line.cantidad,
      };
    });
    const totalCentavos = items.reduce(
      (sum, item) => sum + item.subtotalCentavos,
      0,
    );
    if (!Number.isSafeInteger(totalCentavos))
      return "El total excede el rango admitido.";
    const order: Order = {
      ...newBase(),
      clienteId: customer.id,
      cliente: {
        nombre: customer.nombre,
        apellido: customer.apellido,
        email: customer.email,
      },
      estado: "pendiente",
      items,
      totalCentavos,
    };
    setStore((current) => ({
      ...current,
      pedidos: [order, ...current.pedidos],
    }));
    return null;
  }

  function changeStatus(id: string, next: OrderStatus): boolean {
    const current = store.pedidos.find((item) => item.id === id);
    if (!current || !nextStatuses[current.estado].includes(next)) return false;
    setStore((value) => ({
      ...value,
      pedidos: value.pedidos.map((item) =>
        item.id === id
          ? { ...item, estado: next, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
    return true;
  }

  function deactivate(kind: keyof Store, id: string): void {
    const now = new Date().toISOString();
    setStore((current) => ({
      ...current,
      [kind]: current[kind].map((item) =>
        item.id === id
          ? { ...item, activo: false, deletedAt: now, updatedAt: now }
          : item,
      ),
    }));
  }

  function salesByCategory(from: string, until: string): Sale[] {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const endDate = until ? new Date(`${until}T00:00:00`) : null;
    endDate?.setDate(endDate.getDate() + 1);
    const end = endDate?.getTime() ?? Infinity;
    const groups: Record<Category, Sale> = {
      tecnologia: {
        categoria: "tecnologia",
        unidadesVendidas: 0,
        importeCentavos: 0,
      },
      libreria: {
        categoria: "libreria",
        unidadesVendidas: 0,
        importeCentavos: 0,
      },
      hogar: { categoria: "hogar", unidadesVendidas: 0, importeCentavos: 0 },
    };
    pedidos
      .filter(
        (order) =>
          order.estado === "completado" &&
          new Date(order.createdAt).getTime() >= start &&
          new Date(order.createdAt).getTime() < end,
      )
      .forEach((order) =>
        order.items.forEach((item) => {
          groups[item.categoria].unidadesVendidas += item.cantidad;
          groups[item.categoria].importeCentavos += item.subtotalCentavos;
        }),
      );
    return Object.values(groups)
      .filter((group) => group.unidadesVendidas > 0)
      .sort((a, b) => a.categoria.localeCompare(b.categoria));
  }

  return {
    store,
    clientes,
    productos,
    pedidos,
    saveCustomer,
    saveProduct,
    saveOrder,
    changeStatus,
    deactivate,
    salesByCategory,
  };
}

export type MockStore = ReturnType<typeof useMockStore>;
