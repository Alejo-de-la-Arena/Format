-- FORMAT LAB pasa de Season a Fecha. Un clip pertenece a una Experience
-- concreta; al borrar esa fecha, su fila se borra con ella.
--
-- Si existen clips antiguos, el `set not null` aborta toda la transacción
-- (sin perderlos): no hay una manera confiable de inferir a qué fecha de la
-- Season corresponde cada uno. Asignarlos manualmente antes de reintentar.
begin;

alter table public.season_lab_clips
  add column fecha_id uuid references public.fechas(id) on delete cascade;

alter table public.season_lab_clips
  alter column fecha_id set not null;

drop index if exists public.season_lab_clips_season_id_idx;

alter table public.season_lab_clips
  drop column season_id;

create index season_lab_clips_fecha_id_idx
  on public.season_lab_clips(fecha_id);

commit;
