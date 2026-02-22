-- Permitir actualizar y eliminar objetos del bucket `todos` para usuarios autenticados.
-- Necesario cuando se usa `upsert: true` al subir archivos con el mismo nombre.

drop policy if exists "Authenticated update todos" on storage.objects;
create policy "Authenticated update todos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'todos')
  with check (bucket_id = 'todos');

drop policy if exists "Authenticated delete todos" on storage.objects;
create policy "Authenticated delete todos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'todos');
