import { ApiError, errorMessage } from "@/api/client";
import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { money, type Customer, type Product } from "@/lib/models";
import { estimateOrderCents } from "@/lib/selectors";

type DraftItem = { key: string; productoId: string; cantidad: number };
type OrderInput = {
  clienteId: string;
  items: { productoId: string; cantidad: number }[];
};

export function OrderForm({
  customers,
  products,
  onCancel,
  onSave,
}: {
  customers: Customer[];
  products: Product[];
  onCancel: () => void;
  onSave: (input: OrderInput) => Promise<void>;
}) {
  const [clienteId, setClienteId] = useState(customers[0]?.id || "");
  const [items, setItems] = useState<DraftItem[]>([
    {
      key: crypto.randomUUID(),
      productoId: products[0]?.id || "",
      cantidad: 1,
    },
  ]);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<string>();
  const [pending, setPending] = useState(false);
  const estimate = estimateOrderCents(items, products);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setErrorField(undefined);
    try {
      await onSave({
        clienteId,
        items: items.map(({ productoId, cantidad }) => ({
          productoId,
          cantidad,
        })),
      });
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setErrorField(err.campo);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending}>
      <fieldset
        disabled={pending}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <DialogHeader>
          <DialogTitle>Crear pedido</DialogTitle>
          <DialogDescription>
            El total mostrado es estimativo. El servidor calculará el total
            definitivo.
          </DialogDescription>
        </DialogHeader>
        <div className="form-body">
          <div className="field">
            <Label htmlFor="order-customer">Cliente</Label>
            <NativeSelect
              id="order-customer"
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              disabled={!customers.length}
            >
              {customers.map((customer) => (
                <option value={customer.id} key={customer.id}>
                  {customer.nombre} {customer.apellido}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="field">
            <Label>Productos</Label>
            {items.map((item) => (
              <div className="order-item" key={item.key}>
                <NativeSelect
                  aria-label="Producto"
                  value={item.productoId}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((line) =>
                        line.key === item.key
                          ? { ...line, productoId: event.target.value }
                          : line,
                      ),
                    )
                  }
                >
                  {products.map((product) => (
                    <option value={product.id} key={product.id}>
                      {product.nombre} · {money(product.precioCentavos)}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  aria-label="Cantidad"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={item.cantidad}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((line) =>
                        line.key === item.key
                          ? { ...line, cantidad: Number(event.target.value) }
                          : line,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Quitar producto"
                  onClick={() =>
                    setItems((current) =>
                      current.filter((line) => line.key !== item.key),
                    )
                  }
                >
                  <X />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={items.length >= 50 || !products.length}
              onClick={() =>
                setItems((current) => [
                  ...current,
                  {
                    key: crypto.randomUUID(),
                    productoId:
                      products.find(
                        (product) =>
                          !current.some(
                            (line) => line.productoId === product.id,
                          ),
                      )?.id || products[0].id,
                    cantidad: 1,
                  },
                ])
              }
            >
              <Plus /> Agregar producto
            </Button>
          </div>
          <div className="estimate">
            <span>Total estimado</span>
            <strong>{money(estimate)}</strong>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {errorField ? errorField + ": " + error : error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!customers.length || !products.length}
          >
            Crear pedido
          </Button>
        </DialogFooter>
      </fieldset>
    </form>
  );
}
