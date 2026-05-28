import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const p = await resolveSolicitanteCertificado(user.id, user.email, md);
  const nombreCompleto = `${p.nombres} ${p.apellidos}`.trim();

  let tipoPersonal = parseTipoPersonal(md.tipo_personal, "docente");
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("profiles").select("rol").eq("id", user.id).single();
    if (data?.rol === "administrativo" && !md.tipo_personal) {
      tipoPersonal = "administrativo";
    }
  } catch {
    // usar valor por metadata
  }

  return NextResponse.json({
    nombres: p.nombres,
    apellidos: p.apellidos,
    nombre_completo: nombreCompleto,
    email: p.email,
    tipo_personal: tipoPersonal
  });
}
