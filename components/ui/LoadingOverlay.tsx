"use client";

type LoadingOverlayProps = Readonly<{
  label?: string;
  /** Si true, cubre solo el contenedor padre con position:relative */
  contained?: boolean;
}>;

export function LoadingOverlay({ label = "Cargando…", contained = false }: LoadingOverlayProps) {
  return (
    <div
      className={contained ? "loading-overlay loading-overlay--contained" : "loading-overlay"}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-overlay__panel">
        <span className="loading-overlay__spinner" aria-hidden />
        <span>{label}</span>
      </div>
    </div>
  );
}
