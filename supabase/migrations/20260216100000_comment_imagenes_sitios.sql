-- Documentar formato del campo imagenes en sitios_relevantes.
-- Formato: TEXT con varias URLs separadas por comas (ej: "https://a.jpg,https://b.jpg").
comment on column public.sitios_relevantes.imagenes is 'URLs de imágenes separadas por comas. Ejemplo: https://ejemplo.com/1.jpg,https://ejemplo.com/2.jpg';
