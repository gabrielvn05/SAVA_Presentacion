-- Ejecutar en Supabase SQL Editor si al enviar una solicitud aparece:
-- invalid input value for enum solicitud_tipo: "calamidad_domestica" (u otro valor)

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
