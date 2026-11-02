set role postgres;

-- Pendiente de ejecución manual. Suma la forma de JUNGLE (rombo con doble
-- línea) y conserva las formas de las Seasons anteriores.
begin;

alter table public.seasons drop constraint if exists seasons_forma_check;
alter table public.seasons add constraint seasons_forma_check check (forma in (
  'circle', 'triangle', 'square', 'hexagon', 'hexagon-organic', 'infinity',
  'cross', 'double-circle', 'double-diamond'
));

commit;
reset role;
