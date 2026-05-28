import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SolicitanteCertificado = Readonly<{
  nombres: string;
  apellidos: string;
  email: string | null;
}>;

function nombreDesdeEmail(email: string | undefined) {
  const local = email?.split("@")[0]?.trim();
  if (!local) return "Solicitante";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Perfil del usuario autenticado que genera el oficio (siempre desde BD, sin placeholder "Usuario"). */
export async function resolveSolicitanteCertificado(
  userId: string,
  userEmail: string | undefined,
  userMetadata: Record<string, unknown>
): Promise<SolicitanteCertificado> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("nombres, apellidos, email")
      .eq("id", userId)
      .single();

    if (!error && data?.nombres?.trim()) {
      return {
        nombres: data.nombres.trim(),
        apellidos: (data.apellidos ?? "").trim(),
        email: data.email ?? userEmail ?? null
      };
    }
  } catch {
    // siguiente fallback
  }

  const metaNombres = String(userMetadata.nombres ?? "").trim();
  const metaApellidos = String(userMetadata.apellidos ?? "").trim();
  if (metaNombres && metaNombres.toLowerCase() !== "usuario") {
    return {
      nombres: metaNombres,
      apellidos: metaApellidos,
      email: userEmail ?? null
    };
  }

  const full = String(userMetadata.full_name ?? userMetadata.name ?? "").trim();
  if (full && full.toLowerCase() !== "usuario") {
    const parts = full.split(/\s+/);
    return {
      nombres: parts[0] ?? full,
      apellidos: parts.slice(1).join(" "),
      email: userEmail ?? null
    };
  }

  return {
    nombres: nombreDesdeEmail(userEmail),
    apellidos: metaApellidos,
    email: userEmail ?? null
  };
}
