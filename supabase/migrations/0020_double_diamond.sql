set role postgres;

-- Pendiente de ejecución manual. Suma la forma de JUNGLE (rombo con doble
-- línea) y su movimiento de intro ('grow'), y conserva los valores de las
-- Seasons anteriores.
begin;

alter table public.seasons drop constraint if exists seasons_forma_check;
alter table public.seasons add constraint seasons_forma_check check (forma in (
  'circle', 'triangle', 'square', 'hexagon', 'hexagon-organic', 'infinity',
  'cross', 'double-circle', 'double-diamond'
));

alter table public.seasons drop constraint if exists seasons_intro_motion_valid;
alter table public.seasons add constraint seasons_intro_motion_valid check (intro_motion in (
  'signal', 'ascend', 'expand', 'grow'
));

commit;
reset role;
