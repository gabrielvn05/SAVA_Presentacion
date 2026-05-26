-- =============================================================================
-- Supabase: aviso "Table publicly accessible" / RLS deshabilitado
-- =============================================================================
-- El correo de Supabase indica que alguna tabla en `public` NO tiene
-- Row Level Security (RLS) activado, y por tanto el API (anon key) podría
-- acceder a filas sin políticas.
--
-- 1) Ejecuta la consulta de abajo para VER qué tablas en `public` tienen RLS OFF.
-- 2) Para cada tabla que deba protegerse: ENABLE ROW LEVEL SECURITY + políticas.
-- 3) Para el proyecto SAVA, aplica el esquema completo: sql/schema.sql
--    (o sql/supabase-hotfix-rls-y-detalle.sql) para profiles, solicitudes, etc.
--
-- IMPORTANTE: Si activas RLS en una tabla sin crear políticas, nadie podrá leer
-- ni escribir salvo service_role. Siempre define policies después de ENABLE.
-- =============================================================================

-- Tablas en public sin RLS (revisar cada fila)
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- Ejemplo: activar RLS en una tabla propia (sustituye nombre_tabla)
-- alter table public.nombre_tabla enable row level security;
-- create policy "..." on public.nombre_tabla for select using (...);
