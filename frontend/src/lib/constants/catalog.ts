export const categoryLabel = {
  tecnologia: "Tecnología",
  libreria: "Librería",
  hogar: "Hogar",
} as const;

export const statusLabel = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
} as const;

export const nextStatuses: Record<
  keyof typeof statusLabel,
  (keyof typeof statusLabel)[]
> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};
