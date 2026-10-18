import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
import { ProductForm } from "@/components/forms/product-form";
import { usePagination } from "@/hooks/usePagination";
import { categoryLabel } from "@/lib/constants/catalog";
import { money, type Category, type Product } from "@/mocks/data";
import type { MockStore } from "@/mocks/useMockStore";

export function ProductsPage({
  products,
  saveProduct,
  deactivate,
}: Pick<MockStore, "saveProduct" | "deactivate"> & { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = products.filter(
    (item) =>
      `${item.nombre} ${item.descripcion}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!category || item.categoria === category),
  );
  const { page, setPage, visible } = usePagination(filtered);
  const selected = products.find((item) => item.id === editId);

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Gestioná el catálogo de productos"
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditId(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo producto
          </Button>
        }
      />
      <div className="filters">
        <div className="search-field">
          <Search aria-hidden="true" size={17} />
          <Input
            aria-label="Buscar productos"
            placeholder="Buscar producto..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <NativeSelect
          aria-label="Filtrar por categoría"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as Category | "");
            setPage(1);
          }}
        >
          <option value="">Todas las categorías</option>
          {Object.entries(categoryLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <section className="surface table-surface">
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="actions-head">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <strong>{item.nombre}</strong>
                      <span className="cell-note">{item.descripcion}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabel[item.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell className="numeric">
                      {money(item.precioCentavos)}
                    </TableCell>
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
          <ProductForm
            key={editId || "new"}
            product={selected}
            onCancel={() => setFormOpen(false)}
            onSave={(input, id) => {
              saveProduct(input, id);
              setFormOpen(false);
              toast.success(id ? "Producto actualizado" : "Producto creado");
            }}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDeactivateDialog
        open={deleteId !== null}
        entity="producto"
        description="Dejará de aparecer en el catálogo activo. Los pedidos existentes conservarán su precio histórico."
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deactivate("productos", deleteId);
          setDeleteId(null);
          toast.success("Producto dado de baja");
        }}
      />
    </>
  );
}
