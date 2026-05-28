export function labelTipoSolicitud(tipo: string) {
  if (tipo === "permiso") return "Permiso";
  if (tipo === "justificacion") return "Justificacion";
  if (tipo === "viaje") return "Por viaje";
  if (tipo === "enfermedad") return "Cita médica / salud";
  if (tipo === "calamidad_domestica") return "Calamidad domestica";
  if (tipo === "falta_marcado") return "Falta de marcado";
  return tipo;
}
