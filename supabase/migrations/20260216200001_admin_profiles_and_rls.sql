-- Tabla de perfiles para usuarios de Supabase Auth (Administración).
-- role: 'admin' | 'user'. Los admins pueden ver/editar todos los sitios; los usuarios solo los propios.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_admin_profiles_id on public.admin_profiles (id);

alter table public.admin_profiles enable row level security;

-- Perfiles visibles solo por el propio usuario
create policy "Users can read own admin profile"
  on public.admin_profiles for select
  to authenticated using (auth.uid() = id);

create policy "Users can update own admin profile"
  on public.admin_profiles for update
  to authenticated using (auth.uid() = id);

-- Insert: servicio/trigger crea el perfil al registrarse (ver función abajo)
create policy "Users can insert own admin profile"
  on public.admin_profiles for insert
  to authenticated with check (auth.uid() = id);

-- Función para crear perfil con role 'user' al registrarse
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
  insert into public.admin_profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

comment on table public.admin_profiles is 'Perfiles de usuarios de Administración. role: admin | user.';
