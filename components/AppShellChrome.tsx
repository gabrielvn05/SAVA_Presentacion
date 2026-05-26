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

function SidebarNav({
  sidebarItems,
  pathname,
  expandedGroup,
  setExpandedGroup,
  onNavigate
}: Readonly<{
  sidebarItems: SidebarNavItem[];
  pathname: string;
  expandedGroup: string | null;
  setExpandedGroup: (value: string | null | ((current: string | null) => string | null)) => void;
  onNavigate?: () => void;
}>) {
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <nav className="sidebar-nav" aria-label="Menú principal">
      {sidebarItems.map((entry, idx) => {
        if (entry.type === "link") {
          return (
            <Link
              key={`link-${entry.href}`}
              href={entry.href}
              className={`sidebar-nav__link${isActive(entry.href) ? " is-active" : ""}`}
              onClick={onNavigate}
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
              onClick={() => setExpandedGroup((group) => (group === entry.label ? null : entry.label))}
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
                    onClick={onNavigate}
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
  );
}

export function AppShellChrome(props: AppShellChromeProps) {
  const { sidebarItems, userDisplayName, rolLabel, mostrarPill, logoSrc, children } = props;
  const userSubtitle = props.userSubtitle ?? "";
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen && !logoutModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (logoutModalOpen) setLogoutModalOpen(false);
      else closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, logoutModalOpen, closeMobile]);

  useEffect(() => {
    const lock = mobileOpen || logoutModalOpen;
    if (lock) document.documentElement.classList.add("sidebar-open");
    else document.documentElement.classList.remove("sidebar-open");
    return () => document.documentElement.classList.remove("sidebar-open");
  }, [mobileOpen, logoutModalOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) setMobileOpen(false);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const hasNav = sidebarItems.length > 0;

  const sidebarPanel = hasNav ? (
    <aside className={`sidebar-panel${mobileOpen ? " is-open" : ""}`} aria-label="Menú lateral">
      <SidebarNav
        sidebarItems={sidebarItems}
        pathname={pathname}
        expandedGroup={expandedGroup}
        setExpandedGroup={setExpandedGroup}
        onNavigate={closeMobile}
      />

      <div className="sidebar-panel__footer">
        <form ref={logoutFormRef} action="/logout" method="post">
          <button className="sidebar-panel__logout" type="button" onClick={() => setLogoutModalOpen(true)}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  ) : null;

  return (
    <div className={`app-shell-layout${hasNav ? " app-shell-layout--with-sidebar" : ""}`}>
      <header className="topbar topbar--light app-shell__header">
        <div className="topbar__start">
          {hasNav ? (
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
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

      <div className="app-shell__workspace">
        {hasNav ? (
          <>
            <div
              className={`sidebar-backdrop${mobileOpen ? " is-visible" : ""}`}
              aria-hidden={!mobileOpen}
              onClick={closeMobile}
            />
            {sidebarPanel}
          </>
        ) : null}

        <div className="app-shell__content">{children}</div>
      </div>

      {logoutModalOpen ? (
        <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
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
    </div>
  );
}
