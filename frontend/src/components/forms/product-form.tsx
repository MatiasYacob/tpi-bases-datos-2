import { ApiError, errorMessage } from "@/api/client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/common/field";
import { categoryLabel } from "@/lib/constants/catalog";
import { centsFromInput, type Category, type Product } from "@/lib/models";

type ProductInput = Pick<
  Product,
  "nombre" | "descripcion" | "categoria" | "precioCentavos"
>;

export function ProductForm({
  product,
  onCancel,
  onSave,
}: {
  product?: Product;
  onCancel: () => void;
  onSave: (value: ProductInput, id?: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(product?.nombre || "");
  const [descripcion, setDescripcion] = useState(product?.descripcion || "");
  const [categoria, setCategoria] = useState<Category>(
    product?.categoria || "tecnologia",
  );
  const [precio, setPrecio] = useState(
    product ? (product.precioCentavos / 100).toFixed(2) : "",
  );
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const precioCentavos = centsFromInput(precio);
    if (!nombre.trim()) return setError("Ingresá un nombre de producto.");
    if (precioCentavos === null)
      return setError("Ingresá un precio positivo con hasta dos decimales.");
    setPending(true);
    setErrorField(undefined);
    try {
      await onSave(
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          categoria,
          precioCentavos,
        },
        product?.id,
      );
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
          <DialogTitle>
            {product ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            El precio se guarda como centavos enteros.
          </DialogDescription>
        </DialogHeader>
        <div className="form-body">
          <Field
            id="product-name"
            error={errorField === "nombre" ? error : undefined}
            label="Nombre"
            value={nombre}
            onChange={setNombre}
          />
          <Field
            id="product-description"
            error={errorField === "descripcion" ? error : undefined}
            label="Descripción"
            value={descripcion}
            onChange={setDescripcion}
            required={false}
          />
          <div className="field">
            <Label htmlFor="product-category">Categoría</Label>
            <NativeSelect
              id="product-category"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value as Category)}
            >
              {Object.entries(categoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Field
            id="product-price"
            error={errorField === "precioCentavos" ? error : undefined}
            label="Precio (ARS)"
            value={precio}
            onChange={setPrecio}
            placeholder="1500,50"
          />
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
          <Button type="submit">Guardar producto</Button>
        </DialogFooter>
      </fieldset>
    </form>
  );
}
