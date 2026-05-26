import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import { buildCertificadoPdfBuffer, type CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";

export const runtime = "nodejs";

const TIPOS: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

function isTipo(v: unknown): v is CertificadoTipo {
  return typeof v === "string" && (TIPOS as string[]).includes(v);
}

export async function POST(req: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("nombres, apellidos, email").eq("id", user.id).maybeSingle();

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const solicitante = profile
    ? { nombres: profile.nombres, apellidos: profile.apellidos, email: profile.email }
    : {
        nombres: String(md.nombres ?? md.name ?? "Usuario"),
        apellidos: String(md.apellidos ?? md.family_name ?? ""),
        email: user.email ?? null
      };

  const body = (await req.json()) as {
    tipo?: unknown;
    fecha_inicio?: unknown;
    fecha_fin?: unknown;
    motivo?: unknown;
    detalle?: unknown;
  };

  if (!isTipo(body.tipo)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });

  const fecha_inicio = typeof body.fecha_inicio === "string" ? body.fecha_inicio : "";
  const fecha_fin = typeof body.fecha_fin === "string" ? body.fecha_fin : "";
  const motivo = typeof body.motivo === "string" ? body.motivo : "";
  const detalle = body.detalle && typeof body.detalle === "object" && body.detalle !== null ? (body.detalle as Record<string, unknown>) : {};

  if (!fecha_inicio || !fecha_fin || !motivo.trim()) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const fechaIniErr = validateFechaInicioMaxTresMeses(fecha_inicio);
  if (fechaIniErr) return NextResponse.json({ error: fechaIniErr }, { status: 400 });

  if (fecha_fin < fecha_inicio) return NextResponse.json({ error: "La fecha fin debe ser mayor o igual a la fecha inicio." }, { status: 400 });

  const pdf = await buildCertificadoPdfBuffer({
    solicitante: { nombres: solicitante.nombres, apellidos: solicitante.apellidos, email: solicitante.email },
    tipo: body.tipo,
    fecha_inicio,
    fecha_fin,
    motivo,
    detalle
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="certificado-justificacion.pdf"'
    }
  });
}
