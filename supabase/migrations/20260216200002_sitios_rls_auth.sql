-- RLS para sitios_relevantes con Supabase Auth.
-- anon: solo SELECT estado_suscripcion = 'aceptado'.
-- user: SELECT/INSERT propios (creado_por = auth.uid()).
-- admin: SELECT/INSERT/UPDATE/DELETE todos.

create or replace function public.is_admin_user()
returns boolean as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Eliminar política antigua que permitía todo a anon
drop policy if exists "Allow read sitios_relevantes for anon" on public.sitios_relevantes;

-- Anónimos: solo ven aceptados (app pública)
create policy "anon_select_aceptados"
  on public.sitios_relevantes for select
  to anon
  using (estado_suscripcion = 'aceptado');

-- Usuarios autenticados: pueden ver todos los aceptados (app principal)
create policy "auth_select_aceptados"
  on public.sitios_relevantes for select
  to authenticated
  using (estado_suscripcion = 'aceptado');

-- Usuarios autenticados: admins ven todo (página Administración)
create policy "auth_admin_select_all"
  on public.sitios_relevantes for select
  to authenticated
  using (public.is_admin_user());

-- Usuarios autenticados: usuarios ven solo los suyos (página Administración)
create policy "auth_user_select_own"
  on public.sitios_relevantes for select
  to authenticated
  using (creado_por = auth.uid());

-- Insert: usuario crea con creado_por = uid y estado = creado
create policy "auth_user_insert_own"
  on public.sitios_relevantes for insert
  to authenticated
  with check (creado_por = auth.uid() and estado_suscripcion = 'creado');

-- Insert: admin puede crear sin restricción
create policy "auth_admin_insert"
  on public.sitios_relevantes for insert
  to authenticated
  with check (public.is_admin_user());

-- Update/Delete: solo admin
create policy "auth_admin_update"
  on public.sitios_relevantes for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "auth_admin_delete"
  on public.sitios_relevantes for delete
  to authenticated
  using (public.is_admin_user());
