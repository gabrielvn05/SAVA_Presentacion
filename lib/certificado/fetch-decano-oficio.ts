import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { OficioDestinatario } from "@/lib/certificado/oficio-placeholders";

const DEFAULT_DESTINATARIO: OficioDestinatario = {
  titulo: "Dr.",
  nombres: process.env.OFICIO_DECANO_NOMBRES ?? "Ángel Cristian",
  apellidos: process.env.OFICIO_DECANO_APELLIDOS ?? "Mera Macias",
  facultad: process.env.OFICIO_FACULTAD ?? FACULTAD_DEFAULT
};

export async function fetchDecanoOficioDestinatario(): Promise<OficioDestinatario> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("nombres, apellidos")
      .eq("rol", "decano")
      .eq("activo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!data) return DEFAULT_DESTINATARIO;

    return {
      titulo: "Dr.",
      nombres: data.nombres,
      apellidos: data.apellidos,
      facultad: process.env.OFICIO_FACULTAD ?? DEFAULT_DESTINATARIO.facultad
    };
  } catch {
    return DEFAULT_DESTINATARIO;
  }
}
