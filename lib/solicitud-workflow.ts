import type { AppRole } from "@/lib/auth";

export type SolicitudEstado =
  | "en_borrador"
  | "en_revision_secretaria"
  | "pendiente_aprobacion_decano"
  | "aprobada"
  | "rechazada";

export function estadoTrasRevisionSecretaria(creadorRol: AppRole, aprobado: boolean): SolicitudEstado {
  if (!aprobado) return "rechazada";
  if (creadorRol === "decano") return "aprobada";
  return "pendiente_aprobacion_decano";
}

export function solicitudCreadaPorDecano(creadorRol: AppRole) {
  return creadorRol === "decano";
}
