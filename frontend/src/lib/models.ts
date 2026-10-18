import { categoryLabel, statusLabel } from "@/lib/constants/catalog";

export type Category = keyof typeof categoryLabel;
export type OrderStatus = keyof typeof statusLabel;

type Base = {
  id: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Customer = Base & {
  nombre: string;
  apellido: string;
  email: string;
  contacto: { telefono?: string; direccion?: string };
};

export type Product = Base & {
  nombre: string;
  descripcion: string;
  categoria: Category;
  precioCentavos: number;
};

export type OrderItem = {
  productoId: string;
  nombre: string;
  categoria: Category;
  precioUnitarioCentavos: number;
  cantidad: number;
  subtotalCentavos: number;
};

export type Order = Base & {
  clienteId: string;
  cliente: Pick<Customer, "nombre" | "apellido" | "email">;
  estado: OrderStatus;
  items: OrderItem[];
  totalCentavos: number;
};

export type Store = {
  clientes: Customer[];
  productos: Product[];
  pedidos: Order[];
};

export const money = (centavos: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    centavos / 100,
  );
export function centsFromInput(value: string): number | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimal = ""] = value.trim().replace(",", ".").split(".");
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
