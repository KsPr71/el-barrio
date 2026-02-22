-- Permitir lectura de la tabla `team` desde la app.
-- Si la tabla ya tiene RLS habilitado sin políticas de SELECT,
-- la consulta devuelve vacío o error.

alter table if exists public.team enable row level security;

drop policy if exists "Allow read team for anon" on public.team;
create policy "Allow read team for anon"
  on public.team for select
  to anon
  using (true);

drop policy if exists "Allow read team for authenticated" on public.team;
create policy "Allow read team for authenticated"
  on public.team for select
  to authenticated
  using (true);
