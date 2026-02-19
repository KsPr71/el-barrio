-- Permite a usuarios editar sus propios registros (creado_por = auth.uid()).
-- El admin ya puede editar todos con auth_admin_update.

create policy "auth_user_update_own"
  on public.sitios_relevantes for update
  to authenticated
  using (creado_por = auth.uid())
  with check (creado_por = auth.uid());
