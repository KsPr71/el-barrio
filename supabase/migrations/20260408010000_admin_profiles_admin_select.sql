-- Permite que los administradores puedan leer los perfiles de todos los usuarios
-- para mostrar quién registró cada sitio en el panel de Administración.

create policy "Admins can read all admin profiles"
  on public.admin_profiles for select
  to authenticated
  using (public.is_admin_user());
