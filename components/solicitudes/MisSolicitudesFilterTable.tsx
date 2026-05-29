"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DateInput } from "@/components/ui/DateInput";
import { PaginationControls } from "@/components/PaginationControls";
import { StatusBadge } from "@/components/StatusBadge";
import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import type { ProcesoEstadoFiltro, SolicitudFiltros, SolicitudListRow } from "@/lib/solicitudes-filters";
import { rolFromSolicitud, rowMatchesSolicitudFilters } from "@/lib/solicitudes-filters";

const PAGE_SIZE = 10;

const ESTADOS_PROCESO: ReadonlyArray<{ value: ProcesoEstadoFiltro; label: string }> = [
  { value: "", label: "Todos los procesos" },
  { value: "en_borrador", label: "Borrador" },
  { value: "en_revision_secretaria", label: "En revision (Secretaria)" },
  { value: "pendiente_aprobacion_decano", label: "Pendiente aprobacion (Decano)" },
  { value: "aprobada", label: "Aprobadas por Decano" },
  { value: "rechazada", label: "Rechazadas por Decano" }
];

function emptyFilters(): SolicitudFiltros {
  return { nombre: "", rol: "", fechaDesde: "", fechaHasta: "", estado: "" };
}

export function MisSolicitudesFilterTable({ rows }: Readonly<{ rows: SolicitudListRow[] }>) {
  const [f, setF] = useState<SolicitudFiltros>(emptyFilters);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => rows.filter((r) => rowMatchesSolicitudFilters(r, f)), [rows, f]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [f]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <>
      <article className="card" style={{ marginBottom: "1rem" }}>
        <h2 className="page-header__title" style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
          Filtros
        </h2>
        <div className="solicitud-filters">
          <div>
            <label htmlFor="f-nombre">Nombre o texto en motivo</label>
            <input
              id="f-nombre"
              value={f.nombre}
              onChange={(e) => setF((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Buscar..."
            />
          </div>
          <div>
            <label htmlFor="f-rol">Rol</label>
            <input
              id="f-rol"
              value={f.rol}
              onChange={(e) => setF((p) => ({ ...p, rol: e.target.value }))}
              placeholder="Ej. Docente, Administrativo..."
            />
          </div>
          <div>
            <label htmlFor="f-desde">Fecha desde</label>
            <DateInput
              id="f-desde"
              value={f.fechaDesde}
              onChange={(e) => setF((p) => ({ ...p, fechaDesde: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="f-hasta">Fecha hasta</label>
            <DateInput
              id="f-hasta"
              value={f.fechaHasta}
              onChange={(e) => setF((p) => ({ ...p, fechaHasta: e.target.value }))}
            />
          </div>
          <div className="solicitud-filters__span2">
            <label htmlFor="f-estado">Estado del tramite</label>
            <select
              id="f-estado"
              value={f.estado}
              onChange={(e) => setF((p) => ({ ...p, estado: e.target.value as ProcesoEstadoFiltro }))}
            >
              {ESTADOS_PROCESO.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="field-hint" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
          {filtered.length} solicitud{filtered.length === 1 ? "" : "es"} encontrada{filtered.length === 1 ? "" : "s"} de{" "}
          {rows.length}. Se muestran {PAGE_SIZE} por página.
        </p>
      </article>

      <article className="card card--flat">
        <div className="table-wrap">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Periodo</th>
                <th>Estado</th>
                <th>Motivo</th>
                <th>Rol</th>
                <th>Justificativo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                    No hay solicitudes con estos filtros.
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id}>
                    <td>{labelTipoSolicitud(s.tipo)}</td>
                    <td>
                      {s.fecha_inicio} - {s.fecha_fin}
                    </td>
                    <td>
                      <StatusBadge estado={s.estado} />
                    </td>
                    <td>
                      <span className="text-truncate">{s.motivo}</span>
                    </td>
                    <td>
                      <span className="text-truncate">{rolFromSolicitud(s) || "—"}</span>
                    </td>
                    <td>
                      <span className="text-truncate">{s.justificativo_nombre || "-"}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link href={`/solicitudes/${s.id}`} className="btn btn--secondary btn--sm">
                          Ver
                        </Link>
                        <Link href={`/solicitudes/${s.id}/editar`} className="btn btn--secondary btn--sm">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </article>
    </>
  );
}
