-- Permitir a usuarios autenticados leer provincia y municipio.
-- Las políticas actuales solo permiten "anon"; en Administración el usuario está autenticado.

create policy "Allow read provincia for authenticated"
  on public.provincia for select
  to authenticated using (true);

create policy "Allow read municipio for authenticated"
  on public.municipio for select
  to authenticated using (true);
