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
import { centsFromInput, type Category, type Product } from "@/mocks/data";

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
  onSave: (value: ProductInput, id?: string) => void;
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

  function submit(event: FormEvent) {
    event.preventDefault();
    const precioCentavos = centsFromInput(precio);
    if (!nombre.trim()) return setError("Ingresá un nombre de producto.");
    if (precioCentavos === null)
      return setError("Ingresá un precio positivo con hasta dos decimales.");
    onSave(
      {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoria,
        precioCentavos,
      },
      product?.id,
    );
  }

  return (
    <form onSubmit={submit}>
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
          label="Nombre"
          value={nombre}
          onChange={setNombre}
        />
        <Field
          id="product-description"
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
          label="Precio (ARS)"
          value={precio}
          onChange={setPrecio}
          placeholder="1500,50"
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar producto</Button>
      </DialogFooter>
    </form>
  );
}
