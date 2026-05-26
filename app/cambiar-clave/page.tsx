import { cambiarClaveInicial } from "@/app/actions";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { redirect } from "next/navigation";

export default async function CambiarClavePage() {
  const { user } = await requireAuth({ skipPasswordChangeCheck: true });

  if (user.user_metadata?.force_password_change !== true) {
    redirect("/dashboard");
  }

  return (
    <section className="stack" style={{ maxWidth: 640, margin: "0 auto", padding: "1rem 0" }}>
      <PageHeader
        title="Cambio obligatorio de contraseña"
        subtitle="Por seguridad, debes cambiar la clave temporal antes de usar el sistema."
      />
      <article className="card stack">
        <form action={cambiarClaveInicial} className="stack">
          <div>
            <label htmlFor="new_password">Nueva contraseña</label>
            <input id="new_password" name="new_password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm_password">Confirmar contraseña</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <p className="field-hint">Usa al menos 8 caracteres. Evita reutilizar contraseñas de otros sistemas.</p>
          <button className="btn btn--primary" type="submit">
            Guardar nueva contraseña
          </button>
        </form>
      </article>
    </section>
  );
}

