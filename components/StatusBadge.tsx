import { labelEstado } from "@/lib/estados";

const CLASS_BY_ESTADO: Record<string, string> = {
  en_borrador: "badge--muted",
  en_revision_secretaria: "badge--warning",
  pendiente_aprobacion_decano: "badge--info",
  aprobada: "badge--success",
  rechazada: "badge--danger"
};

export function StatusBadge({ estado }: Readonly<{ estado: string }>) {
  const cls = CLASS_BY_ESTADO[estado] ?? "badge--muted";
  return <span className={`badge ${cls}`}>{labelEstado(estado)}</span>;
}
