-- Tablas provincia y municipio para selector en perfil.
-- municipio pertenece a una provincia (filtrado por provincia_id).
-- Ejecuta en Supabase SQL Editor si aún no tienes estas tablas.

-- Provincia
create table if not exists public.provincia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
);

create index if not exists idx_provincia_nombre on public.provincia (nombre);

alter table public.provincia enable row level security;

create policy "Allow read provincia for anon"
  on public.provincia for select to anon using (true);

comment on table public.provincia is 'Provincias para el selector del perfil.';

-- Municipio (pertenece a una provincia)
create table if not exists public.municipio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  provincia_id uuid not null references public.provincia (id) on delete cascade
);

create index if not exists idx_municipio_provincia_id on public.municipio (provincia_id);

alter table public.municipio enable row level security;

create policy "Allow read municipio for anon"
  on public.municipio for select to anon using (true);

comment on table public.municipio is 'Municipios por provincia para el selector del perfil.';
