import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginMicrosoftButton } from "@/components/auth/LoginMicrosoftButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function fieldText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function login(formData: FormData) {
  "use server";

  const email = fieldText(formData, "email");
  const password = fieldText(formData, "password");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=1");
  }

  redirect("/dashboard");
}

async function loginWithMicrosoft() {
  "use server";

  const supabase = createSupabaseServerClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo
    }
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

type LoginPageProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  const hasError = searchParams.error === "1";
  const hasOAuthError = searchParams.error === "oauth";
  const solicitudOk = searchParams.solicitud === "ok";

  return (
    <div className="login-page">
      <aside className="login-hero">
        <span className="login-hero__badge">Acceso institucional</span>
        <img
        src="/branding/LOGO-ULEAM-HORIZONTAL.png"
          alt="ULEAM"
          style={{ maxWidth: 450, width: "100%", height: "auto" }}
        />
        <h1> Sistema de Asistencia y Validaciones Académicas (SAVA)</h1>
        <p>Gestión de permisos y justificaciones</p>
      </aside>
      <div className="login-panel">
        <div className="card stack login-card" id="contenido-principal" tabIndex={-1}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Iniciar sesión</h2>
            <p className="field-hint" style={{ margin: "0.4rem 0 0" }}>
              Usa el correo y contraseña que te asignó el sistema o tu unidad.
            </p>
          </div>

          {hasError ? (
            <div className="alert alert--error" role="alert">
              Credenciales incorrectas o usuario sin perfil. Si aún no tienes cuenta, puedes solicitarla abajo.
            </div>
          ) : null}

          {hasOAuthError ? (
            <div className="alert alert--error" role="alert">
              No se pudo iniciar sesión con Microsoft 365. Intenta de nuevo o contacta al administrador.
            </div>
          ) : null}

          {solicitudOk ? (
            <div className="alert alert--warning" role="status">
              Solicitud enviada. El Decano revisará tu pedido; cuando sea aprobado podrás iniciar sesión con el correo indicado.
            </div>
          ) : null}

          <LoginMicrosoftButton loginWithMicrosoft={loginWithMicrosoft} />

          <LoginForm loginAction={login} />

          <div className="login-signup-cta">
            <p className="login-signup-cta__label">¿No tienes cuenta todavía?</p>
            <Link href="/solicitar-cuenta" className="btn btn--secondary">
              Solicitar cuenta
            </Link>
            <p className="field-hint" style={{ margin: "0.75rem 0 0", fontSize: "0.78rem" }}>
              Solo personal autorizado. Tu solicitud será revisada por el Decanato.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
