import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { QualityProvider } from "@/components/quality/QualityProvider";
import { SkipToMain } from "@/components/quality/SkipToMain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth";
import { headers } from "next/headers";
import { ReactNode } from "react";

function isPublicAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/solicitar-cuenta") ||
    pathname.startsWith("/auth/")
  );
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const supabase = createSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = data.user && !authError ? data.user : null;

  let profile = null;
  if (user) {
    try {
      profile = await getUserProfile(user.id);
    } catch {
      profile = null;
    }
  }

  const pathname = headers().get("x-pathname") ?? "";
  const useAppShell = Boolean(user && profile && !isPublicAuthRoute(pathname));

  return (
    <html lang="es">
      <body>
        <QualityProvider>
          <SkipToMain />
          {useAppShell ? (
            <AppShell profile={profile!} userEmail={user!.email}>
              {children}
            </AppShell>
          ) : (
            <div className="app-public">{children}</div>
          )}
        </QualityProvider>
      </body>
    </html>
  );
}
