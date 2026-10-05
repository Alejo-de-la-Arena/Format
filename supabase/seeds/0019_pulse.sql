set role postgres;

-- Ejecutar manualmente DESPUÉS del deploy y de 0018_double_circle.sql.
-- No modifica otras Seasons ni sobrescribe flyers, lineup o contenido cargado.
begin;

insert into public.seasons (slug, numero, nombre, forma, colores, fecha_inicio, fecha_fin)
values (
  'pulse', '003', 'PULSE', 'double-circle',
  array['#E5233B', '#8B0F1D', '#FF6B6B', '#FFD1D1', '#FFFFFF'],
  date '2026-10-09', date '2026-10-30'
)
on conflict (slug) do update set
  numero = excluded.numero,
  nombre = excluded.nombre,
  forma = excluded.forma,
  colores = excluded.colores,
  fecha_inicio = excluded.fecha_inicio,
  fecha_fin = excluded.fecha_fin;

insert into public.fechas (season_id, fecha, especial)
select s.id, f.fecha, f.especial
from public.seasons s
cross join (values
  (date '2026-10-09', true),
  (date '2026-10-16', false),
  (date '2026-10-23', false),
  (date '2026-10-30', false)
) as f(fecha, especial)
where s.slug = 'pulse'
on conflict (season_id, fecha) do update set especial = excluded.especial;

commit;
reset role;
