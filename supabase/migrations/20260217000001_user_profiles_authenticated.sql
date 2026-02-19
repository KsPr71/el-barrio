-- user_profiles: perfil de usuario para filtrar sitios por provincia/municipio.
-- Es independiente de Supabase Auth (que se usa solo en Administración).
-- Permitir a authenticated las mismas operaciones que anon, para que guardar
-- el perfil funcione aunque el usuario tenga sesión de Supabase abierta.

create policy "Allow read user_profiles for authenticated"
  on public.user_profiles for select
  to authenticated using (true);

create policy "Allow insert user_profiles for authenticated"
  on public.user_profiles for insert
  to authenticated with check (true);

create policy "Allow update user_profiles for authenticated"
  on public.user_profiles for update
  to authenticated using (true);

create policy "Allow delete user_profiles for authenticated"
  on public.user_profiles for delete
  to authenticated using (true);
