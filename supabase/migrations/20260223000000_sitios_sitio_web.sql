-- Sitio web del negocio.
alter table public.sitios_relevantes
  add column if not exists sitio_web text;

comment on column public.sitios_relevantes.sitio_web is 'URL del sitio web del negocio';
