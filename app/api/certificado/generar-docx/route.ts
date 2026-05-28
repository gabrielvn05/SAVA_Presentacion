import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import { buildOficioDocxBuffer } from "@/lib/certificado/build-oficio-docx";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";

export const runtime = "nodejs";

const TIPOS: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

function isTipo(v: unknown): v is CertificadoTipo {
  return typeof v === "string" && (TIPOS as string[]).includes(v);
}

/** Descarga el Word rellenado (formato institucional). Útil si no hay LibreOffice para PDF. */
export async function POST(req: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = (await req.json()) as {
    tipo?: unknown;
    fecha_inicio?: unknown;
    fecha_fin?: unknown;
    motivo?: unknown;
    detalle?: unknown;
    solicitante_nombres?: unknown;
    solicitante_apellidos?: unknown;
    tipo_personal?: unknown;
  };

  if (!isTipo(body.tipo)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });

  const fecha_inicio = typeof body.fecha_inicio === "string" ? body.fecha_inicio : "";
  const fecha_fin = typeof body.fecha_fin === "string" ? body.fecha_fin : "";
  const motivo = typeof body.motivo === "string" ? body.motivo : "";
  const detalle = body.detalle && typeof body.detalle === "object" && body.detalle !== null ? (body.detalle as Record<string, unknown>) : {};

  const fechaIniErr = validateFechaInicioMaxTresMeses(fecha_inicio);
  if (fechaIniErr) return NextResponse.json({ error: fechaIniErr }, { status: 400 });

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  let solicitante = await resolveSolicitanteCertificado(user.id, user.email, md);
  const overrideNombres = typeof body.solicitante_nombres === "string" ? body.solicitante_nombres.trim() : "";
  const overrideApellidos = typeof body.solicitante_apellidos === "string" ? body.solicitante_apellidos.trim() : "";
  if (overrideNombres) {
    solicitante = { nombres: overrideNombres, apellidos: overrideApellidos, email: solicitante.email };
  }

  const tipoPersonal = parseTipoPersonal(body.tipo_personal ?? detalle.tipo_personal);
  const detalleConPersonal = { ...detalle, tipo_personal: tipoPersonal };

  const destinatario = await fetchDecanoOficioDestinatario();
  const docx = await buildOficioDocxBuffer(
    {
      solicitante: { nombres: solicitante.nombres, apellidos: solicitante.apellidos, email: solicitante.email },
      tipo: body.tipo,
      tipo_personal: tipoPersonal,
      fecha_inicio,
      fecha_fin,
      motivo,
      detalle: detalleConPersonal
    },
    destinatario
  );

  return new NextResponse(docx, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="oficio-justificacion.docx"'
    }
  });
}
