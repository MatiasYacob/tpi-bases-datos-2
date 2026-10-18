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

const date = "2026-10-17T12:00:00.000Z";
const base = (id: string): Base => ({
  id: id.padStart(24, "0"),
  activo: true,
  createdAt: date,
  updatedAt: date,
  deletedAt: null,
});

const clientes: Customer[] = [
  {
    ...base("1"),
    nombre: "Matías",
    apellido: "Yacob",
    email: "matias@example.com",
    contacto: { telefono: "1112345678", direccion: "Calle 123" },
  },
  {
    ...base("2"),
    nombre: "Brenda",
    apellido: "López",
    email: "brenda@example.com",
    contacto: {},
  },
  {
    ...base("3"),
    nombre: "Javier",
    apellido: "Rodríguez",
    email: "javier@example.com",
    contacto: {},
  },
];

const productos: Product[] = [
  {
    ...base("11"),
    nombre: "Mouse inalámbrico",
    categoria: "tecnologia",
    descripcion: "Mouse USB",
    precioCentavos: 150000,
  },
  {
    ...base("12"),
    nombre: "Teclado mecánico",
    categoria: "tecnologia",
    descripcion: "Teclado RGB",
    precioCentavos: 850000,
  },
  {
    ...base("13"),
    nombre: "Cuaderno A4",
    categoria: "libreria",
    descripcion: "80 hojas",
    precioCentavos: 65000,
  },
  {
    ...base("14"),
    nombre: "Lámpara de mesa",
    categoria: "hogar",
    descripcion: "Luz cálida",
    precioCentavos: 420000,
  },
  {
    ...base("15"),
    nombre: "Auriculares",
    categoria: "tecnologia",
    descripcion: "Bluetooth",
    precioCentavos: 360000,
  },
  {
    ...base("16"),
    nombre: "Lapicera",
    categoria: "libreria",
    descripcion: "Tinta azul",
    precioCentavos: 12000,
  },
  {
    ...base("17"),
    nombre: "Organizador",
    categoria: "hogar",
    descripcion: "Escritorio",
    precioCentavos: 195000,
  },
  {
    ...base("18"),
    nombre: "Resaltadores",
    categoria: "libreria",
    descripcion: "Pack x 4",
    precioCentavos: 45000,
  },
  {
    ...base("19"),
    nombre: "Cable USB-C",
    categoria: "tecnologia",
    descripcion: "1 metro",
    precioCentavos: 78000,
  },
];

function sampleOrder(
  id: string,
  customerIndex: number,
  lines: [number, number][],
  estado: OrderStatus,
): Order {
  const customer = clientes[customerIndex];
  const items = lines.map(([index, cantidad]) => {
    const product = productos[index];
    return {
      productoId: product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      precioUnitarioCentavos: product.precioCentavos,
      cantidad,
      subtotalCentavos: product.precioCentavos * cantidad,
    };
  });
  return {
    ...base(id),
    clienteId: customer.id,
    cliente: {
      nombre: customer.nombre,
      apellido: customer.apellido,
      email: customer.email,
    },
    estado,
    items,
    totalCentavos: items.reduce((sum, item) => sum + item.subtotalCentavos, 0),
  };
}

export const initialStore: Store = {
  clientes,
  productos,
  pedidos: [
    sampleOrder(
      "1001",
      0,
      [
        [0, 2],
        [2, 1],
      ],
      "completado",
    ),
    sampleOrder("1002", 1, [[1, 1]], "confirmado"),
    sampleOrder(
      "1003",
      2,
      [
        [3, 1],
        [5, 3],
      ],
      "pendiente",
    ),
    sampleOrder("1004", 0, [[4, 1]], "completado"),
    sampleOrder("1005", 1, [[6, 1]], "cancelado"),
    sampleOrder(
      "1006",
      2,
      [
        [7, 2],
        [8, 1],
      ],
      "completado",
    ),
  ],
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
