import { Card, CardContent } from "@/components/ui/card";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="metric-card">
      <CardContent>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>Datos de la tienda</small>
      </CardContent>
    </Card>
  );
}
