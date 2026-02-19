-- Campos para fecha de cambio de estado, suscripción y términos.
-- fecha_cambio_estado: actualizada cada vez que cambia el estado.
-- fecha_aceptado: cuando estado pasó a aceptado (inicio del año de suscripción).
-- acepto_terminos: el usuario aceptó términos antes de registrar (solo para inserts de usuarios).

alter table public.sitios_relevantes
  add column if not exists fecha_cambio_estado timestamptz,
  add column if not exists fecha_aceptado timestamptz,
  add column if not exists acepto_terminos boolean not null default false;

comment on column public.sitios_relevantes.fecha_cambio_estado is 'Fecha del último cambio de estado.';
comment on column public.sitios_relevantes.fecha_aceptado is 'Fecha en que se aceptó. Suscripción vence 1 año después.';
comment on column public.sitios_relevantes.acepto_terminos is 'Usuario aceptó términos y condiciones al registrar.';

-- Función para expirar suscripciones (aceptado -> en_revision cuando pasó 1 año)
create or replace function public.expirar_suscripciones()
returns void as $$
begin
  update public.sitios_relevantes
  set estado_suscripcion = 'en_revision',
      fecha_cambio_estado = now()
  where estado_suscripcion = 'aceptado'
    and fecha_aceptado is not null
    and fecha_aceptado + interval '1 year' < now();
end;
$$ language plpgsql security definer;

grant execute on function public.expirar_suscripciones() to anon;
grant execute on function public.expirar_suscripciones() to authenticated;

-- Usuarios deben aceptar términos al insertar (creado_por no null)
drop policy if exists "auth_user_insert_own" on public.sitios_relevantes;
create policy "auth_user_insert_own"
  on public.sitios_relevantes for insert
  to authenticated
  with check (
    creado_por = auth.uid()
    and estado_suscripcion = 'creado'
    and acepto_terminos = true
  );
