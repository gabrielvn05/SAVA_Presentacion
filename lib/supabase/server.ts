import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // En Server Components (render), Next no permite mutar cookies.
          // Supabase puede intentar refrescar sesión; ignoramos aquí y dejamos
          // la persistencia para Server Actions / Route Handlers.
          try {
            cookieStore.set(name, value, options);
          } catch {
            // noop
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, "", options);
          } catch {
            // noop
          }
        }
      }
    }
  );
}
