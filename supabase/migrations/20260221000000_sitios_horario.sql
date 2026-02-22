-- Añadir columna horario para gestionar el horario de apertura de los sitios.
-- Formato de ejemplo: "L-V 9:00-18:00; S 10:00-14:00; D cerrado"
alter table public.sitios_relevantes
  add column if not exists horario text;

comment on column public.sitios_relevantes.horario is 'Horario de apertura. Ej: L-V 9:00-18:00; S 10:00-14:00; D cerrado';
