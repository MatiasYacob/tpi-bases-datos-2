import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";

export const navigation = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: ClipboardList },
  { id: "productos", label: "Productos", icon: Boxes },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
] as const;

export type Page = (typeof navigation)[number]["id"];
