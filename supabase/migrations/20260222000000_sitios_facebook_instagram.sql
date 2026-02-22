-- Enlaces a redes sociales (Facebook e Instagram) del sitio.
alter table public.sitios_relevantes
  add column if not exists facebook_link text,
  add column if not exists instagram_link text;

comment on column public.sitios_relevantes.facebook_link is 'URL del perfil o página de Facebook del sitio';
comment on column public.sitios_relevantes.instagram_link is 'URL del perfil de Instagram del sitio';
