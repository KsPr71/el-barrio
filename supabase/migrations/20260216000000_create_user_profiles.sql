-- Perfil de usuario: nombre, correo, provincia y municipio de interés.
-- user_id identifica al usuario (p. ej. openId de tu sistema de auth).
-- Ejecuta este SQL en el editor SQL de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/<tu-proyecto>/sql

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text,
  email text,
  province text,
  municipality text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_user_id_key unique (user_id)
);

-- Índice para búsquedas por user_id
create index if not exists idx_user_profiles_user_id on public.user_profiles (user_id);

-- Actualizar updated_at al modificar
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- RLS: habilitado. Políticas permiten leer/escribir por anon (cliente app).
-- Cuando integres Supabase Auth, restringe con: user_id = auth.uid()::text
alter table public.user_profiles enable row level security;

create policy "Allow read for anon"
  on public.user_profiles for select
  to anon using (true);

create policy "Allow insert for anon"
  on public.user_profiles for insert
  to anon with check (true);

create policy "Allow update for anon"
  on public.user_profiles for update
  to anon using (true);

create policy "Allow delete for anon"
  on public.user_profiles for delete
  to anon using (true);

comment on table public.user_profiles is 'Datos de perfil del usuario: nombre, email, provincia y municipio de interés.';
