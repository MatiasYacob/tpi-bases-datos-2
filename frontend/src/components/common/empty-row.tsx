import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyRow({
  columns,
  message = "No hay registros para mostrar",
}: {
  columns: number;
  message?: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="empty-row">
        {message}
      </TableCell>
    </TableRow>
  );
}
