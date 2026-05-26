import { ReactNode } from "react";
import { AppFooter } from "@/components/AppFooter";
import { AppShellChrome } from "@/components/AppShellChrome";
import type { SidebarNavItem } from "@/components/sidebar-nav-types";
import type { AppRole, UserProfile } from "@/lib/auth";

type AppShellProps = Readonly<{
  profile: UserProfile;
  userEmail: string | undefined;
  children: ReactNode;
}>;

function buildSidebarItems(rol: AppRole): SidebarNavItem[] {
  const esDecano = rol === "decano";
  const esSecretaria = rol === "secretaria";
  const esSuper = rol === "superusuario";
  const puedeProceso = rol === "secretaria" || rol === "decano";

  if (esSuper) {
    return [{ type: "link", href: "/dashboard", label: "Inicio" }];
  }

  const items: SidebarNavItem[] = [
    { type: "link", href: "/dashboard", label: "Inicio" },
    {
      type: "group",
      label: "Solicitudes",
      items: [
        { href: "/solicitudes/nueva", label: "Nuevas solicitudes" },
        { href: "/solicitudes", label: "Mis solicitudes" }
      ]
    }
  ];

  if (puedeProceso) {
    items.push({ type: "link", href: "/solicitudes/proceso-aprobacion", label: "Proceso de aprobación" });
  }
  if (esDecano) {
    items.push({ type: "link", href: "/admin/usuarios", label: "Usuarios" });
  }
  if (esDecano || esSecretaria) {
    items.push({ type: "link", href: "/admin/solicitudes-cuenta", label: "Solicitudes de cuenta" });
  }

  return items;
}

function etiquetaRol(rol: string) {
  if (rol === "superusuario") return "Superusuario";
  if (rol === "decano") return "Decano";
  if (rol === "secretaria") return "Secretaria";
  return "Administrativo";
}

export function AppShell({ profile, userEmail, children }: AppShellProps) {
  const rolLabel = etiquetaRol(profile.rol);
  const mostrarPill = profile.rol !== "superusuario";
  const sidebarItems = buildSidebarItems(profile.rol);
  const userDisplayName = `${profile.nombres} ${profile.apellidos}`;
  const userSubtitle = userEmail ?? profile.rol;

  return (
    <div className="app-shell">
      <AppShellChrome
        sidebarItems={sidebarItems}
        userDisplayName={userDisplayName}
        userSubtitle={userSubtitle}
        rolLabel={rolLabel}
        mostrarPill={mostrarPill}
        logoSrc="/branding/LOGO-ULEAM.png"
      >
        <div className="app-shell__body">
          <main className="app-main">{children}</main>
          <AppFooter />
        </div>
      </AppShellChrome>
    </div>
  );
}
