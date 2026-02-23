-- Nombre del usuario en admin_profiles (obligatorio al registrarse).
alter table public.admin_profiles
  add column if not exists name text;

comment on column public.admin_profiles.name is 'Nombre del usuario (obligatorio al registrarse)';
