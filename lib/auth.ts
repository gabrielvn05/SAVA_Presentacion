import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AppRole = "superusuario" | "decano" | "secretaria" | "administrativo";
export type Capability =
  | "gestionar_usuarios"
  | "revisar_solicitudes"
  | "aprobar_solicitudes"
  | "generar_solicitudes";

export type UserProfile = {
  id: string;
  nombres: string;
  apellidos: string;
  rol: AppRole;
  activo: boolean;
};

type RequireAuthOptions = {
  skipPasswordChangeCheck?: boolean;
};

const ROLE_DEFAULT_CAPABILITIES: Record<AppRole, Capability[]> = {
  superusuario: ["gestionar_usuarios", "revisar_solicitudes", "aprobar_solicitudes", "generar_solicitudes"],
  decano: ["revisar_solicitudes", "aprobar_solicitudes", "generar_solicitudes"],
  secretaria: ["revisar_solicitudes", "generar_solicitudes"],
  administrativo: ["generar_solicitudes"]
};

export async function requireAuth(options: RequireAuthOptions = {}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!options.skipPasswordChangeCheck && user.user_metadata?.force_password_change === true) {
    redirect("/cambiar-clave");
  }

  return { supabase, user };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombres, apellidos, rol, activo")
    .eq("id", userId)
    .single();

  if (!error && data) {
    return data as UserProfile;
  }

  // Fallback para escenarios de RLS/policies mal sincronizadas.
  try {
    const admin = createSupabaseAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("profiles")
      .select("id, nombres, apellidos, rol, activo")
      .eq("id", userId)
      .single();

    if (!adminError && adminData) {
      return adminData as UserProfile;
    }
  } catch {
    // ignoramos y devolvemos el error original enriquecido abajo
  }

  const details = error ? `${error.code ?? ""} ${error.message}`.trim() : "sin datos";
  throw new Error(`No se pudo obtener el perfil del usuario (${details}).`);
}

export async function hasCapability(userId: string, capability: Capability): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (ROLE_DEFAULT_CAPABILITIES[profile.rol].includes(capability)) return true;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_capabilities")
    .select("capability")
    .eq("user_id", userId)
    .eq("capability", capability)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
