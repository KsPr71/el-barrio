-- Crear bucket "todos" para imágenes de sitios.
-- En Supabase, los buckets se crean desde Storage. Ejecuta esto en SQL solo si usas
-- extensiones que lo soporten. Alternativamente, crea el bucket manualmente:
-- Dashboard → Storage → New bucket → nombre: "todos", Public: sí.
--
-- Política para permitir upload a usuarios autenticados y lectura pública:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'todos',
  'todos',
  true,
  5242880,
  array['image/webp']
)
on conflict (id) do update set
  public = true,
  allowed_mime_types = array['image/webp'];

-- Lectura pública
drop policy if exists "Public read todos" on storage.objects;
create policy "Public read todos"
  on storage.objects for select
  using (bucket_id = 'todos');

-- Subida para usuarios autenticados
drop policy if exists "Authenticated upload todos" on storage.objects;
create policy "Authenticated upload todos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'todos');
