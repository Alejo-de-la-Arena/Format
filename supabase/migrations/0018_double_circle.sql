set role postgres;

-- Pendiente de ejecución manual. Conserva las formas de Seasons anteriores.
begin;

alter table public.seasons drop constraint if exists seasons_forma_check;
alter table public.seasons add constraint seasons_forma_check check (forma in (
  'circle', 'triangle', 'square', 'hexagon', 'hexagon-organic', 'infinity',
  'cross', 'double-circle'
));

commit;
reset role;
