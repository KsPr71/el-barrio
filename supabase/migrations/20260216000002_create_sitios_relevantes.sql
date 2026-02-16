-- La tabla sitios_relevantes ya existe con la estructura definida en el proyecto.
-- Este archivo solo habilita RLS y la política de lectura para anon (cliente app).
-- Si la tabla ya tiene RLS, ejecutar solo la política que falte.

alter table public.sitios_relevantes enable row level security;

drop policy if exists "Allow read sitios_relevantes for anon" on public.sitios_relevantes;
create policy "Allow read sitios_relevantes for anon"
  on public.sitios_relevantes for select to anon using (true);
