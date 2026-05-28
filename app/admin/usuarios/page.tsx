import Link from "next/link";
import { crearUsuarioInterno, delegarCapacidad } from "@/app/actions";
import { getUserProfile, requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/PageHeader";

export default async function UsuariosPage() {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);

  if (profile.rol !== "superusuario") {
    return (
      <section className="stack">
        <PageHeader title="Usuarios" subtitle="Módulo reservado para superusuario." />
        <article className="card">
          <p className="field-hint" style={{ margin: 0 }}>
            Solo el superusuario puede crear usuarios y delegar capacidades. Las solicitudes de cuenta se gestionan en
            el módulo correspondiente del Decanato o Secretaría.
          </p>
        </article>
      </section>
    );
  }

  const admin = createSupabaseAdminClient();
  const [{ data: usuarios }, { count: pendientesCuenta = 0 }] = await Promise.all([
    admin.from("profiles").select("id, nombres, apellidos, email, rol, activo").order("created_at", { ascending: false }),
    admin.from("account_requests").select("*", { head: true, count: "exact" }).eq("status", "pendiente")
  ]);

  return (
    <section className="stack">
      <PageHeader
        title="Administración de usuarios"
        subtitle={`Alta de cuentas y delegación de capacidades. Solicitudes de cuenta pendientes: ${pendientesCuenta}.`}
      />
      <article className="card row" style={{ justifyContent: "space-between" }}>
        <p className="field-hint" style={{ margin: 0 }}>
          Las solicitudes enviadas desde login las revisan Decano o Secretaría en solicitudes de cuenta.
        </p>
        <Link href="/admin/solicitudes-cuenta" className="btn btn--secondary btn--sm">
          Ir a solicitudes de cuenta
        </Link>
      </article>
      <article className="card stack">
        <h2 style={{ margin: 0 }}>Nuevo usuario</h2>
        <form action={crearUsuarioInterno} className="stack">
          <div className="form-grid form-grid--2">
            <div>
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" name="nombres" placeholder="Nombres" required />
            </div>
            <div>
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" name="apellidos" placeholder="Apellidos" required />
            </div>
          </div>
          <div className="form-grid form-grid--2">
            <div>
              <label htmlFor="email">Correo</label>
              <input id="email" name="email" type="email" placeholder="correo@institucion.edu" required />
            </div>
            <div>
              <label htmlFor="password">Contraseña temporal</label>
              <input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
            </div>
          </div>
          <div>
            <label htmlFor="rol">Rol</label>
            <select id="rol" name="rol" defaultValue="administrativo">
              <option value="administrativo">Administrativo</option>
              <option value="secretaria">Secretaría</option>
              <option value="decano">Decano</option>
              <option value="superusuario">Superusuario</option>
            </select>
          </div>
          <button className="btn btn--primary" type="submit">
            Crear usuario
          </button>
        </form>
      </article>

      <article className="card stack">
        <h2 style={{ margin: 0 }}>Delegar funcionalidad</h2>
        <form action={delegarCapacidad} className="form-grid form-grid--2">
          <div>
            <label htmlFor="user_id">Usuario</label>
            <select id="user_id" name="user_id" required defaultValue="">
              <option value="" disabled>
                Seleccionar usuario
              </option>
              {(usuarios || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombres} {u.apellidos} - {u.rol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="capability">Capacidad</label>
            <select id="capability" name="capability" required defaultValue="revisar_solicitudes">
              <option value="generar_solicitudes">Generar solicitudes</option>
              <option value="revisar_solicitudes">Revisar solicitudes</option>
              <option value="aprobar_solicitudes">Aprobar solicitudes</option>
              <option value="gestionar_usuarios">Gestionar usuarios</option>
            </select>
          </div>
          <button className="btn btn--secondary" type="submit">
            Delegar
          </button>
        </form>
      </article>

      <article className="card card--flat">
        <div className="table-wrap">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios || []).map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.nombres} {u.apellidos}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.rol}</td>
                  <td>{u.activo ? <span className="badge badge--success">Activo</span> : <span className="badge badge--muted">Inactivo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
