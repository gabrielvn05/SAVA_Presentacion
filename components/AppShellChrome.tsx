"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { SidebarNavItem } from "@/components/sidebar-nav-types";

type AppShellChromeProps = Readonly<{
  sidebarItems: SidebarNavItem[];
  userDisplayName: string;
  userSubtitle: string;
  rolLabel: string;
  mostrarPill: boolean;
  logoSrc: string;
  children: ReactNode;
}>;

function Chevron({ open }: Readonly<{ open: boolean }>) {
  return (
    <span
      className="sidebar-nav__chevron"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      ▼
    </span>
  );
}

export function AppShellChrome(props: AppShellChromeProps) {
  const { sidebarItems, userDisplayName, rolLabel, mostrarPill, logoSrc, children } = props;
  const userSubtitle = props.userSubtitle ?? "";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    for (const entry of sidebarItems) {
      if (entry.type !== "group") continue;
      const childActive = entry.items.some(
        (sub) => pathname === sub.href || (sub.href !== "/" && pathname.startsWith(`${sub.href}/`))
      );
      if (childActive) {
        setExpandedGroup(entry.label);
        return;
      }
    }
  }, [pathname, sidebarItems]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open && !logoutModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (logoutModalOpen) setLogoutModalOpen(false);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, logoutModalOpen, close]);

  useEffect(() => {
    const lock = open || logoutModalOpen;
    if (lock) document.documentElement.classList.add("sidebar-open");
    else document.documentElement.classList.remove("sidebar-open");
    return () => document.documentElement.classList.remove("sidebar-open");
  }, [open, logoutModalOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const hasNav = sidebarItems.length > 0;

  return (
    <>
      {hasNav ? (
        <>
          <div
            className={`sidebar-backdrop${open ? " is-visible" : ""}`}
            aria-hidden={!open}
            onClick={close}
          />

          <aside className={`sidebar-drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
            <div className="sidebar-drawer__header">
              <img src="/branding/LOGO-ULEAM-HORIZONTAL.png" alt="ULEAM" className="sidebar-drawer__logo" />
            </div>

            <div className="sidebar-drawer__user">
              <span className="sidebar-drawer__user-name">{userDisplayName}</span>
              <span className="sidebar-drawer__user-email">{userSubtitle}</span>
              {mostrarPill ? <span className="sidebar-drawer__pill">{rolLabel}</span> : null}
            </div>

            <nav className="sidebar-nav" aria-label="Menú principal">
              {sidebarItems.map((entry, idx) => {
                if (entry.type === "link") {
                  return (
                    <Link
                      key={`link-${entry.href}`}
                      href={entry.href}
                      className={`sidebar-nav__link${isActive(entry.href) ? " is-active" : ""}`}
                      onClick={close}
                    >
                      {entry.label}
                    </Link>
                  );
                }

                const groupOpen = expandedGroup === entry.label;
                return (
                  <div key={`group-${entry.label}-${idx}`} className="sidebar-nav__group">
                    <button
                      type="button"
                      className="sidebar-nav__group-btn"
                      aria-expanded={groupOpen}
                      onClick={() => setExpandedGroup((g) => (g === entry.label ? null : entry.label))}
                    >
                      <span>{entry.label}</span>
                      <Chevron open={groupOpen} />
                    </button>
                    {groupOpen ? (
                      <div className="sidebar-nav__sub">
                        {entry.items.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`sidebar-nav__sublink${isActive(sub.href) ? " is-active" : ""}`}
                            onClick={close}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="sidebar-drawer__footer">
              <form ref={logoutFormRef} action="/logout" method="post">
                <button
                  className="sidebar-drawer__logout"
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </aside>

          {logoutModalOpen ? (
            <div
              className="logout-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
            >
              <button
                type="button"
                className="logout-modal__backdrop"
                aria-label="Cerrar"
                onClick={() => setLogoutModalOpen(false)}
              />
              <div className="logout-modal__panel">
                <h2 id="logout-modal-title" className="logout-modal__title">
                  Cerrar sesión
                </h2>
                <p className="logout-modal__text">¿Seguro que desea cerrar sesión?</p>
                <div className="logout-modal__actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setLogoutModalOpen(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      setLogoutModalOpen(false);
                      logoutFormRef.current?.submit();
                    }}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <header className="topbar topbar--light">
        <div className="topbar__start">
          {hasNav ? (
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sidebar-toggle__bar" />
              <span className="sidebar-toggle__bar" />
              <span className="sidebar-toggle__bar" />
            </button>
          ) : null}
          <div className="topbar__brand">
            <img className="topbar__logo-img" src={logoSrc} alt="Universidad Laica Eloy Alfaro de Manabí" />
            <div className="topbar__titles">
              <span className="topbar__name">SAVA</span>
              <span className="topbar__tagline">Permisos y justificaciones</span>
            </div>
          </div>
        </div>

        <div className="topbar__user">
          <div className="topbar__user-meta">
            <span className="topbar__user-name">{userDisplayName}</span>
            <span className="topbar__user-email">{userSubtitle}</span>
            {mostrarPill ? <span className="topbar__pill">{rolLabel}</span> : null}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
