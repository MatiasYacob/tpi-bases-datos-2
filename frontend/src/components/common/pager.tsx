import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PAGE_SIZE } from "@/lib/constants/pagination";

export function Pager({
  total,
  page,
  onChange,
}: {
  total: number;
  page: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        Mostrando {total ? (page - 1) * PAGE_SIZE + 1 : 0}–
        {Math.min(page * PAGE_SIZE, total)} de {total}
      </span>
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page * PAGE_SIZE >= total}
          onClick={() => onChange(page + 1)}
        >
          Siguiente <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
