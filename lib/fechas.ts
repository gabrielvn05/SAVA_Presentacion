export function isoDateUTC(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISODateUTC(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function threeMonthsAgoUTC(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCMonth(d.getUTCMonth() - 3);
  return d;
}

export function validateFechaInicioMaxTresMeses(fechaInicioISO: string, now = new Date()): string | null {
  const fecha = parseISODateUTC(fechaInicioISO);
  if (!fecha) return "Fecha inicio inválida.";

  const min = threeMonthsAgoUTC(now);
  if (fecha.getTime() < min.getTime()) {
    return `La fecha inicio no puede ser anterior a ${isoDateUTC(min)} (máximo 3 meses hacia atrás).`;
  }
  return null;
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODateUTC(iso);
  if (!d) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return isoDateUTC(d);
}

