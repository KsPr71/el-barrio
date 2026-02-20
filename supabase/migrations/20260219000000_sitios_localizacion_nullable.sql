-- Permitir localizacion vacía (opcional) en sitios_relevantes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sitios_relevantes'
      and column_name = 'localizacion' and is_nullable = 'NO'
  ) then
    alter table public.sitios_relevantes alter column localizacion drop not null;
  end if;
end $$;
