"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { qualityTaskStart } from "@/lib/quality/metrics";

type QualityProviderProps = Readonly<{ children: ReactNode }>;

/** Contexto global de calidad: navegación medida y preferencias de accesibilidad. */
export function QualityProvider({ children }: QualityProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    const end = qualityTaskStart(`navigation:${pathname}`);
    const t = window.setTimeout(() => end(true), 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = document.documentElement.lang || "es";
  }, []);

  return <>{children}</>;
}
