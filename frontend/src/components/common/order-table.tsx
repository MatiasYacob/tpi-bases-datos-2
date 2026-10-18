import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money, type Order } from "@/mocks/data";
import { EmptyRow } from "./empty-row";
import { StatusBadge } from "./status-badge";

export function OrderTable({
  orders,
  onDetails,
}: {
  orders: Order[];
  onDetails?: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Importe</TableHead>
            <TableHead>Estado</TableHead>
            {onDetails && (
              <TableHead className="actions-head">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <strong>#{order.id.slice(-6)}</strong>
                  <span className="cell-note">
                    {order.items.length} producto
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                </TableCell>
                <TableCell>
                  {order.cliente.nombre} {order.cliente.apellido}
                </TableCell>
                <TableCell className="numeric">
                  {money(order.totalCentavos)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.estado} />
                </TableCell>
                {onDetails && (
                  <TableCell className="actions-cell">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDetails(order.id)}
                    >
                      Detalle
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <EmptyRow columns={onDetails ? 5 : 4} />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
