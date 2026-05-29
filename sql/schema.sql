-- Extensiones
create extension if not exists "pgcrypto";

-- Tipos base
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('superusuario', 'decano', 'secretaria', 'administrativo');
  end if;
  if not exists (select 1 from pg_type where typname = 'capability_type') then
    create type capability_type as enum (
      'gestionar_usuarios',
      'revisar_solicitudes',
      'aprobar_solicitudes',
      'generar_solicitudes'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'solicitud_tipo') then
    create type solicitud_tipo as enum (
      'permiso',
      'justificacion',
      'viaje',
      'enfermedad',
      'calamidad_domestica',
      'falta_marcado'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'solicitud_estado') then
    create type solicitud_estado as enum (
      'en_borrador',
      'en_revision_secretaria',
      'pendiente_aprobacion_decano',
      'aprobada',
      'rechazada'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombres text not null,
  apellidos text not null,
  rol app_role not null default 'administrativo',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crear profile automaticamente al crear usuario en Auth
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_nombres text;
  v_apellidos text;
  v_rol app_role;
begin
  v_email := coalesce(new.email, '');
  v_nombres := coalesce(new.raw_user_meta_data->>'nombres', 'Pendiente');
  v_apellidos := coalesce(new.raw_user_meta_data->>'apellidos', 'Pendiente');
  v_rol := coalesce((new.raw_user_meta_data->>'rol')::app_role, 'administrativo');

  insert into public.profiles(id, email, nombres, apellidos, rol, activo)
  values (new.id, v_email, v_nombres, v_apellidos, v_rol, true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create table if not exists public.user_capabilities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  capability capability_type not null,
  otorgado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, capability)
);

-- Solicitudes de cuenta (creadas desde login y aprobadas por Decano)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_request_status') then
    create type account_request_status as enum ('pendiente', 'aprobada', 'rechazada');
  end if;
end $$;

create table if not exists public.account_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nombres text not null,
  apellidos text not null,
  rol_solicitado app_role not null default 'administrativo',
  motivo text,
  status account_request_status not null default 'pendiente',
  rechazo_comentario text,
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email, status) deferrable initially immediate
);

-- Compatibilidad si la tabla ya existia en una version anterior.
alter table public.account_requests
  add column if not exists rechazo_comentario text;

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null references public.profiles(id),
  tipo solicitud_tipo not null default 'justificacion',
  fecha_inicio date not null,
  fecha_fin date not null,
  motivo text not null,
  detalle jsonb not null default '{}'::jsonb,
  justificativo_path text,
  justificativo_nombre text,
  estado solicitud_estado not null default 'en_revision_secretaria',
  revisado_por uuid references public.profiles(id),
  firmado_por uuid references public.profiles(id),
  observaciones_secretaria text,
  observaciones_decano text,
  fecha_firma timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fecha_rango_valido check (fecha_fin >= fecha_inicio)
);

alter table public.solicitudes
  add column if not exists detalle jsonb not null default '{}'::jsonb;

-- Hacer justificativo opcional (compatibilidad con versiones anteriores)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'solicitudes'
      and column_name = 'justificativo_path'
      and is_nullable = 'NO'
  ) then
    alter table public.solicitudes alter column justificativo_path drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'solicitudes'
      and column_name = 'justificativo_nombre'
      and is_nullable = 'NO'
  ) then
    alter table public.solicitudes alter column justificativo_nombre drop not null;
  end if;
end $$;

-- Extender enum de solicitud si la BD venia de una version anterior
do $$
begin
  if exists (select 1 from pg_type where typname = 'solicitud_tipo') then
    if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'solicitud_tipo' and e.enumlabel = 'viaje') then
      alter type solicitud_tipo add value 'viaje';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'solicitud_tipo' and e.enumlabel = 'enfermedad') then
      alter type solicitud_tipo add value 'enfermedad';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'solicitud_tipo' and e.enumlabel = 'calamidad_domestica') then
      alter type solicitud_tipo add value 'calamidad_domestica';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'solicitud_tipo' and e.enumlabel = 'falta_marcado') then
      alter type solicitud_tipo add value 'falta_marcado';
    end if;
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_solicitudes on public.solicitudes;
create trigger trg_set_updated_at_solicitudes
before update on public.solicitudes
for each row execute procedure public.set_updated_at();

-- Tras crear perfil, asignar capacidades por rol
create or replace function public.handle_profile_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_capabilities(new.id, new.rol);
  return new;
end;
$$;

drop trigger if exists trg_profile_seed_caps on public.profiles;
create trigger trg_profile_seed_caps
after insert on public.profiles
for each row execute procedure public.handle_profile_after_insert();

-- Capacidades por defecto según rol
create or replace function public.seed_default_capabilities(p_user_id uuid, p_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_capabilities where user_id = p_user_id;

  if p_role in ('administrativo', 'secretaria', 'decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'generar_solicitudes')
    on conflict do nothing;
  end if;

  if p_role in ('secretaria', 'decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'revisar_solicitudes')
    on conflict do nothing;
  end if;

  if p_role in ('decano', 'superusuario') then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'aprobar_solicitudes')
    on conflict do nothing;
  end if;

  -- Regla pedida: solo Decano crea usuarios.
  if p_role = 'decano' then
    insert into public.user_capabilities(user_id, capability) values (p_user_id, 'gestionar_usuarios')
    on conflict do nothing;
  end if;
end;
$$;

-- Permisos y RLS
alter table public.profiles enable row level security;
alter table public.user_capabilities enable row level security;
alter table public.solicitudes enable row level security;
alter table public.account_requests enable row level security;

-- SECURITY DEFINER: evita recursión infinita en RLS cuando policies de `user_capabilities`
-- llaman a has_capability() y esa función a su vez consulta `user_capabilities`.
create or replace function public.has_capability(cap capability_type)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol = 'superusuario'
  )
  or exists (
    select 1
    from public.user_capabilities uc
    where uc.user_id = auth.uid() and uc.capability = cap
  )
$$;

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles for select
using (auth.role() = 'authenticated');

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists profiles_insert_decano on public.profiles;
create policy profiles_insert_decano
on public.profiles for insert
with check (public.has_capability('gestionar_usuarios'));

drop policy if exists capabilities_read_self on public.user_capabilities;
create policy capabilities_read_self
on public.user_capabilities for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('decano', 'superusuario')
  )
);

drop policy if exists capabilities_manage_decano on public.user_capabilities;
create policy capabilities_manage_decano
on public.user_capabilities for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('decano', 'superusuario')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('decano', 'superusuario')
  )
);

-- Account requests policies
drop policy if exists account_requests_insert_anon on public.account_requests;
create policy account_requests_insert_anon
on public.account_requests for insert
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists account_requests_select_decano on public.account_requests;
drop policy if exists account_requests_select_roles on public.account_requests;
create policy account_requests_select_roles
on public.account_requests for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('decano', 'secretaria', 'superusuario')
  )
);

drop policy if exists account_requests_update_decano on public.account_requests;
create policy account_requests_update_decano
on public.account_requests for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('decano', 'superusuario')
  )
)
with check (
  status in ('aprobada', 'rechazada')
);

drop policy if exists account_requests_update_secretaria_rechazo on public.account_requests;
create policy account_requests_update_secretaria_rechazo
on public.account_requests for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'secretaria'
  )
)
with check (
  status = 'rechazada' and coalesce(rechazo_comentario, '') <> ''
);

drop policy if exists solicitudes_select_policy on public.solicitudes;
create policy solicitudes_select_policy
on public.solicitudes for select
using (
  creado_por = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('secretaria', 'decano', 'superusuario')
  )
);

drop policy if exists solicitudes_insert_policy on public.solicitudes;
create policy solicitudes_insert_policy
on public.solicitudes for insert
with check (creado_por = auth.uid());

drop policy if exists solicitudes_update_policy on public.solicitudes;
create policy solicitudes_update_policy
on public.solicitudes for update
using (
  creado_por = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('secretaria', 'decano', 'superusuario')
  )
)
with check (
  creado_por = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.rol in ('secretaria', 'decano', 'superusuario')
  )
);

-- Bucket para justificativos
insert into storage.buckets (id, name, public)
values ('justificativos', 'justificativos', true)
on conflict (id) do nothing;

drop policy if exists justificativos_select_all on storage.objects;
create policy justificativos_select_all
on storage.objects for select
using (bucket_id = 'justificativos' and auth.role() = 'authenticated');

drop policy if exists justificativos_insert_auth on storage.objects;
create policy justificativos_insert_auth
on storage.objects for insert
with check (bucket_id = 'justificativos' and auth.role() = 'authenticated');

drop policy if exists justificativos_update_auth on storage.objects;
create policy justificativos_update_auth
on storage.objects for update
using (bucket_id = 'justificativos' and auth.role() = 'authenticated')
with check (bucket_id = 'justificativos' and auth.role() = 'authenticated');
