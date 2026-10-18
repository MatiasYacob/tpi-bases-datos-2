import type {
  Customer,
  Product,
  Order,
  Store,
  OrderStatus,
} from "@/lib/models";
export type {
  Category,
  OrderStatus,
  Customer,
  Product,
  OrderItem,
  Order,
  Store,
} from "@/lib/models";
export { money, centsFromInput } from "@/lib/models";

type Base = Pick<
  Customer,
  "id" | "activo" | "createdAt" | "updatedAt" | "deletedAt"
>;

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
