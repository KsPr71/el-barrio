-- Habilita sincronización incremental fiable para sitios_relevantes.
-- updated_at cambia en cada insert/update y permite traer solo cambios recientes.

alter table public.sitios_relevantes
  add column if not exists updated_at timestamptz not null default now();

update public.sitios_relevantes
set updated_at = greatest(
  coalesce(updated_at, to_timestamp(0)),
  coalesce(creado_at, to_timestamp(0)),
  coalesce(fecha_cambio_estado, to_timestamp(0)),
  coalesce(fecha_aceptado, to_timestamp(0))
)
where updated_at is null
   or creado_at is not null
   or fecha_cambio_estado is not null
   or fecha_aceptado is not null;

create or replace function public.set_sitios_relevantes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_sitios_relevantes_updated_at on public.sitios_relevantes;
create trigger set_sitios_relevantes_updated_at
  before update on public.sitios_relevantes
  for each row execute function public.set_sitios_relevantes_updated_at();

create index if not exists idx_sitios_relevantes_updated_at
  on public.sitios_relevantes (updated_at desc);
