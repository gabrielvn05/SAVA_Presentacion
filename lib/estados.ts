export const ESTADO_LABELS: Record<string, string> = {
  en_borrador: "Borrador",
  en_revision_secretaria: "En revision (Secretaria)",
  pendiente_aprobacion_decano: "Pendiente firma Decano",
  aprobada: "Aprobada",
  rechazada: "Rechazada"
};

export function labelEstado(estado: string) {
  return ESTADO_LABELS[estado] ?? estado;
}
