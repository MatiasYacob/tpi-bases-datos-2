import { ApiError, errorMessage } from "@/api/client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/common/field";
import type { Customer } from "@/lib/models";

type CustomerInput = Pick<
  Customer,
  "nombre" | "apellido" | "email" | "contacto"
>;

export function CustomerForm({
  customer,
  onCancel,
  onSave,
}: {
  customer?: Customer;
  onCancel: () => void;
  onSave: (value: CustomerInput, id?: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(customer?.nombre || "");
  const [apellido, setApellido] = useState(customer?.apellido || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [telefono, setTelefono] = useState(customer?.contacto.telefono || "");
  const [direccion, setDireccion] = useState(
    customer?.contacto.direccion || "",
  );
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!nombre.trim() || !apellido.trim() || !email.trim())
      return setError("Completá nombre, apellido y email.");
    setPending(true);
    setErrorField(undefined);
    try {
      await onSave(
        {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email,
          contacto: {
            ...(telefono.trim() && { telefono: telefono.trim() }),
            ...(direccion.trim() && { direccion: direccion.trim() }),
          },
        },
        customer?.id,
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
            {customer ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            Los cambios se guardan en la tienda.
          </DialogDescription>
        </DialogHeader>
        <div className="form-body">
          <Field
            id="customer-name"
            error={errorField === "nombre" ? error : undefined}
            label="Nombre"
            value={nombre}
            onChange={setNombre}
          />
          <Field
            id="customer-lastname"
            error={errorField === "apellido" ? error : undefined}
            label="Apellido"
            value={apellido}
            onChange={setApellido}
          />
          <Field
            id="customer-email"
            error={errorField === "email" ? error : undefined}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            id="customer-phone"
            error={errorField === "contacto.telefono" ? error : undefined}
            label="Teléfono"
            value={telefono}
            onChange={setTelefono}
            required={false}
          />
          <Field
            id="customer-address"
            error={errorField === "contacto.direccion" ? error : undefined}
            label="Dirección"
            value={direccion}
            onChange={setDireccion}
            required={false}
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
          <Button type="submit">Guardar cliente</Button>
        </DialogFooter>
      </fieldset>
    </form>
  );
}
