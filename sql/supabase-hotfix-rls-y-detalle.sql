-- Ejecutar en Supabase SQL Editor si ves: "stack depth limit exceeded"
-- Causa: policies de user_capabilities llaman has_capability(), y has_capability()
-- consultaba user_capabilities bajo RLS -> recursión infinita.

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

alter table public.solicitudes
  add column if not exists detalle jsonb not null default '{}'::jsonb;

alter table public.account_requests
  add column if not exists rechazo_comentario text;

-- Valores faltantes en enum solicitud_tipo (evita error al insertar desde el asistente)
do $$
begin
  if exists (select 1 from pg_type where typname = 'solicitud_tipo') then
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'solicitud_tipo' and e.enumlabel = 'viaje'
    ) then
      alter type solicitud_tipo add value 'viaje';
    end if;
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'solicitud_tipo' and e.enumlabel = 'enfermedad'
    ) then
      alter type solicitud_tipo add value 'enfermedad';
    end if;
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'solicitud_tipo' and e.enumlabel = 'calamidad_domestica'
    ) then
      alter type solicitud_tipo add value 'calamidad_domestica';
    end if;
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'solicitud_tipo' and e.enumlabel = 'falta_marcado'
    ) then
      alter type solicitud_tipo add value 'falta_marcado';
    end if;
  end if;
end $$;

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

-- Visibilidad de solicitudes:
-- - Personal administrativo: solo las propias (creado_por = auth.uid())
-- - Secretaria/Decano/Superusuario: todas (para revisión y aprobación)

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

-- Decano y Superusuario pueden marcar solicitudes de cuenta como aprobadas/rechazadas (misma regla)
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
