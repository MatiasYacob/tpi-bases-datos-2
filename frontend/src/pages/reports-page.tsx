import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyRow } from "@/components/common/empty-row";
import { Metric } from "@/components/common/metric";
import { PageHeader } from "@/components/common/page-header";
import { categoryLabel } from "@/lib/constants/catalog";
import { money } from "@/lib/models";
import { reportSummary } from "@/lib/selectors";
import { salesByCategory, type Sale } from "@/api/use-api-store";
import { errorMessage } from "@/api/client";

export function ReportsPage() {
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [report, setReport] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setReport([]);
    if (from && until && from > until) {
      setError("La fecha desde no puede ser posterior a hasta.");
      setLoading(false);
      return () => controller.abort();
    }
    void salesByCategory(from, until, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setReport(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, until, retry]);
  const summary = reportSummary(report);
  return (
    <>
      <PageHeader
        title="Reporte de ventas"
        subtitle="Ventas de pedidos completados, agrupadas por categoría"
      />
      <div className="filters date-filters">
        <div>
          <Label htmlFor="from">Desde</Label>
          <Input
            id="from"
            type="date"
            value={from}
            max={until || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="until">Hasta</Label>
          <Input
            id="until"
            type="date"
            value={until}
            min={from || undefined}
            onChange={(event) => setUntil(event.target.value)}
          />
        </div>
        {(from || until) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setUntil("");
            }}
          >
            Limpiar fechas
          </Button>
        )}
      </div>
      {loading && <p role="status">Cargando reporte…</p>}
      {error && (
        <section role="alert" className="surface">
          <p>{error}</p>
          <Button onClick={() => setRetry((value) => value + 1)}>
            Reintentar reporte
          </Button>
        </section>
      )}
      {!loading && !error && (
        <>
          <div className="metrics report-metrics">
            <Metric
              label="Categorías con ventas"
              value={String(summary.categories)}
            />
            <Metric label="Unidades vendidas" value={String(summary.units)} />
            <Metric label="Importe total" value={money(summary.amountCents)} />
          </div>
          <section className="surface">
            <h2>Ventas por categoría</h2>
            {report.length ? (
              <div className="bars">
                {report.map((item) => (
                  <div className="bar-row" key={item.categoria}>
                    <span>{categoryLabel[item.categoria]}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(item.importeCentavos / summary.maxAmountCents) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{money(item.importeCentavos)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-chart">
                No hay ventas completadas en el período seleccionado.
              </p>
            )}
          </section>
          <section className="surface table-surface">
            <div className="table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidades vendidas</TableHead>
                    <TableHead>Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.length ? (
                    report.map((item) => (
                      <TableRow key={item.categoria}>
                        <TableCell>{categoryLabel[item.categoria]}</TableCell>
                        <TableCell>{item.unidadesVendidas}</TableCell>
                        <TableCell className="numeric">
                          {money(item.importeCentavos)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRow columns={3} />
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
      <p className="report-note">
        Ventas guardadas de pedidos activos y completados. El período incluye
        ambos días seleccionados y usa la fecha de creación del pedido.
      </p>
    </>
  );
}
