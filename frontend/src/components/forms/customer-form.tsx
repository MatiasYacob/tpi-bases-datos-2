import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/common/field";
import type { Customer } from "@/mocks/data";

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
  onSave: (value: CustomerInput, id?: string) => string | null;
}) {
  const [nombre, setNombre] = useState(customer?.nombre || "");
  const [apellido, setApellido] = useState(customer?.apellido || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [telefono, setTelefono] = useState(customer?.contacto.telefono || "");
  const [direccion, setDireccion] = useState(
    customer?.contacto.direccion || "",
  );
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !email.trim())
      return setError("Completá nombre, apellido y email.");
    setError(
      onSave(
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
      ) || "",
    );
  }

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>
          {customer ? "Editar cliente" : "Nuevo cliente"}
        </DialogTitle>
        <DialogDescription>
          Los cambios se aplican a los datos de demostración.
        </DialogDescription>
      </DialogHeader>
      <div className="form-body">
        <Field
          id="customer-name"
          label="Nombre"
          value={nombre}
          onChange={setNombre}
        />
        <Field
          id="customer-lastname"
          label="Apellido"
          value={apellido}
          onChange={setApellido}
        />
        <Field
          id="customer-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <Field
          id="customer-phone"
          label="Teléfono"
          value={telefono}
          onChange={setTelefono}
          required={false}
        />
        <Field
          id="customer-address"
          label="Dirección"
          value={direccion}
          onChange={setDireccion}
          required={false}
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
        <Button type="submit">Guardar cliente</Button>
      </DialogFooter>
    </form>
  );
}
