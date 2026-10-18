import { useState } from "react";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDeactivateDialog({
  open,
  entity,
  description,
  onClose,
  onConfirm,
}: {
  open: boolean;
  entity: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) {
          setError("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar baja del {entity}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              setError("");
              onClose();
            }}
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void confirm()}
          >
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
