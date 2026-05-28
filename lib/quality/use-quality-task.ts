"use client";

import { useCallback, useRef } from "react";
import { qualityTaskStart } from "@/lib/quality/metrics";

/** Registra duración y éxito de una tarea (ISO/IEC 25022 — eficiencia y efectividad). */
export function useQualityTask(taskId: string) {
  const endRef = useRef<((success: boolean) => void) | null>(null);

  const start = useCallback(() => {
    endRef.current = qualityTaskStart(taskId);
  }, [taskId]);

  const complete = useCallback((success: boolean) => {
    endRef.current?.(success);
    endRef.current = null;
  }, []);

  return { start, complete };
}
