/**
 * Métricas ligeras de calidad en uso (ISO/IEC 25022: efectividad y eficiencia).
 * Registra duración y resultado de tareas sin datos personales.
 */

export type QualityTaskRecord = Readonly<{
  taskId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  success: boolean;
}>;

const MAX_RECORDS = 50;
const store: QualityTaskRecord[] = [];

export function qualityTaskStart(taskId: string): (success: boolean) => void {
  const startedAt = performance.now();
  return (success: boolean) => {
    const endedAt = performance.now();
    const record: QualityTaskRecord = {
      taskId,
      startedAt,
      endedAt,
      durationMs: Math.round(endedAt - startedAt),
      success
    };
    store.push(record);
    if (store.length > MAX_RECORDS) store.shift();
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.info("[SAVA calidad]", record);
    }
  };
}

export function getQualityTaskRecords(): readonly QualityTaskRecord[] {
  return store;
}
