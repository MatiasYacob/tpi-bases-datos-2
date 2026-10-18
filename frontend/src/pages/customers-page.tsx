import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyRow } from "@/components/common/empty-row";
import { ConfirmDeactivateDialog } from "@/components/common/confirm-deactivate-dialog";
import { Pager } from "@/components/common/pager";
import { PageHeader } from "@/components/common/page-header";
import { CustomerForm } from "@/components/forms/customer-form";
import { usePagination } from "@/hooks/usePagination";
import type { Customer } from "@/mocks/data";
import type { MockStore } from "@/mocks/useMockStore";

export function CustomersPage({
  customers,
  saveCustomer,
  deactivate,
}: Pick<MockStore, "saveCustomer" | "deactivate"> & { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = customers.filter((item) =>
    `${item.nombre} ${item.apellido} ${item.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const { page, setPage, visible } = usePagination(filtered);
  const selected = customers.find((item) => item.id === editId);

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Administrá los datos de tus clientes"
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditId(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo cliente
          </Button>
        }
      />
      <div className="filters">
        <div className="search-field">
          <Search aria-hidden="true" size={17} />
          <Input
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <section className="surface table-surface">
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="actions-head">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <strong>
                        {item.nombre} {item.apellido}
                      </strong>
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.contacto.telefono || "—"}</TableCell>
                    <TableCell className="actions-cell">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditId(item.id);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                      >
                        Baja
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyRow columns={4} />
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <Pager total={filtered.length} page={page} onChange={setPage} />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="form-dialog">
          <CustomerForm
            key={editId || "new"}
            customer={selected}
            onCancel={() => setFormOpen(false)}
            onSave={(input, id) => {
              const error = saveCustomer(input, id);
              if (!error) {
                setFormOpen(false);
                toast.success(id ? "Cliente actualizado" : "Cliente creado");
              }
              return error;
            }}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDeactivateDialog
        open={deleteId !== null}
        entity="cliente"
        description="Dejará de aparecer en los listados activos. Los pedidos existentes conservarán sus datos históricos."
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deactivate("clientes", deleteId);
          setDeleteId(null);
          toast.success("Cliente dado de baja");
        }}
      />
    </>
  );
}
