import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import { buildCertificadoPdf, type CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import {
  mergeCertificadoConAnexo,
  mimeAnexoFromFile,
  validarAnexoObligatorio,
  validarAnexoOpcional
} from "@/lib/certificado/merge-pdf-anexos";

export const runtime = "nodejs";

const TIPOS: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

function isTipo(v: unknown): v is CertificadoTipo {
  return typeof v === "string" && (TIPOS as string[]).includes(v);
}

type Payload = {
  tipo?: unknown;
  fecha_inicio?: unknown;
  fecha_fin?: unknown;
  motivo?: unknown;
  detalle?: unknown;
  solicitante_nombres?: unknown;
  solicitante_apellidos?: unknown;
  tipo_personal?: unknown;
};

async function parsePayload(req: Request): Promise<{ payload: Payload; anexo: File | null }> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const raw = fd.get("payload");
    const payload = typeof raw === "string" ? (JSON.parse(raw) as Payload) : ({} as Payload);
    const anexo = fd.get("anexo");
    return { payload, anexo: anexo instanceof File && anexo.size > 0 ? anexo : null };
  }
  const payload = (await req.json()) as Payload;
  return { payload, anexo: null };
}

export async function POST(req: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { payload: body, anexo } = await parsePayload(req);

  if (!isTipo(body.tipo)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });

  const fecha_inicio = typeof body.fecha_inicio === "string" ? body.fecha_inicio : "";
  const fecha_fin = typeof body.fecha_fin === "string" ? body.fecha_fin : "";
  const motivo = typeof body.motivo === "string" ? body.motivo : "";
  const detalle = body.detalle && typeof body.detalle === "object" && body.detalle !== null ? (body.detalle as Record<string, unknown>) : {};

  if (!fecha_inicio || !fecha_fin || !motivo.trim()) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const anexoErr =
    validarAnexoObligatorio(
      body.tipo,
      anexo ? { size: anexo.size, type: anexo.type, name: anexo.name } : null
    ) ?? validarAnexoOpcional(anexo ? { size: anexo.size, type: anexo.type, name: anexo.name } : null);
  if (anexoErr) return NextResponse.json({ error: anexoErr }, { status: 400 });

  const fechaIniErr = validateFechaInicioMaxTresMeses(fecha_inicio);
  if (fechaIniErr) return NextResponse.json({ error: fechaIniErr }, { status: 400 });

  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: "La fecha fin debe ser mayor o igual a la fecha inicio." }, { status: 400 });
  }

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  let solicitante = await resolveSolicitanteCertificado(user.id, user.email, md);

  const overrideNombres = typeof body.solicitante_nombres === "string" ? body.solicitante_nombres.trim() : "";
  const overrideApellidos = typeof body.solicitante_apellidos === "string" ? body.solicitante_apellidos.trim() : "";
  if (overrideNombres) {
    solicitante = {
      nombres: overrideNombres,
      apellidos: overrideApellidos,
      email: solicitante.email
    };
  }

  const nombreCompleto = `${solicitante.nombres} ${solicitante.apellidos}`.trim();
  if (!nombreCompleto) {
    return NextResponse.json(
      { error: "No se encontró el nombre del solicitante en su perfil. Contacte al administrador." },
      { status: 400 }
    );
  }

  const tipoPersonal = parseTipoPersonal(body.tipo_personal ?? detalle.tipo_personal);
  const detalleConPersonal = { ...detalle, tipo_personal: tipoPersonal };

  const destinatario = await fetchDecanoOficioDestinatario();
  let { buffer: pdf, source } = await buildCertificadoPdf(
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

  if (anexo) {
    const mime = mimeAnexoFromFile(anexo);
    const anexoBuf = Buffer.from(await anexo.arrayBuffer());
    pdf = await mergeCertificadoConAnexo(pdf, anexoBuf, mime);
  }

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="certificado-justificacion.pdf"',
      "X-Sava-Pdf-Source": source
    }
  });
}
