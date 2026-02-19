-- Añadir campos para autenticación y flujo de administración en sitios_relevantes.
-- creado_por: usuario Supabase Auth que creó el registro (null = admin/legacy).
-- creado_at: fecha de creación del registro.
-- estado_suscripcion: creado | en_revision | aceptado (solo aceptados se muestran en la app pública).

alter table public.sitios_relevantes
  add column if not exists creado_por uuid references auth.users (id) on delete set null,
  add column if not exists creado_at timestamptz not null default now(),
  add column if not exists estado_suscripcion text;

-- Registros legacy (sin creado_por): considerados aceptados para no romper la app
update public.sitios_relevantes set estado_suscripcion = 'aceptado' where estado_suscripcion is null;
alter table public.sitios_relevantes alter column estado_suscripcion set default 'creado';
alter table public.sitios_relevantes alter column estado_suscripcion set not null;

-- Constraint para validar estados (si no existe)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_estado_suscripcion'
  ) then
    alter table public.sitios_relevantes
      add constraint chk_estado_suscripcion
      check (estado_suscripcion in ('creado', 'en_revision', 'aceptado'));
  end if;
end $$;

-- Índices para filtros habituales
create index if not exists idx_sitios_relevantes_estado on public.sitios_relevantes (estado_suscripcion);
create index if not exists idx_sitios_relevantes_creado_por on public.sitios_relevantes (creado_por);

comment on column public.sitios_relevantes.creado_por is 'Usuario auth que creó el registro. NULL indica admin o registro legacy.';
comment on column public.sitios_relevantes.creado_at is 'Fecha de creación del registro.';
comment on column public.sitios_relevantes.estado_suscripcion is 'creado | en_revision | aceptado. Solo aceptados se muestran en la app pública.';
