set role postgres;

-- Ejecutar manualmente DESPUÉS del deploy y de 0020_double_diamond.sql.
-- No modifica otras Seasons ni sobrescribe flyers, lineup o contenido cargado.
-- Sin aftermovie_url: se carga desde el admin cuando exista.
begin;

insert into public.seasons (
  slug, numero, nombre, forma, colores, fecha_inicio, fecha_fin,
  concepto, about_relato, color_descripcion, forma_descripcion, intro_text, intro_motion
)
values (
  'jungle', '004', 'JUNGLE', 'double-diamond',
  array['#0F8A34', '#0A3D1F', '#3DFF5C', '#C6F7A8', '#FFFFFF'],
  date '2026-11-06', date '2026-11-27',
  $txt$Let it grow.$txt$,
  $txt$La expansión. Lo vivo empieza a ocuparlo todo.

JUNGLE es el momento en que FORMAT se desborda. Lo que empezó como estructura, subió y aprendió a latir junto, ahora crece por su cuenta: se enreda, se extiende, toma la terraza.

No es una selva de postal. Es naturaleza intervenida por la noche, el sonido y la luz: hojas, sombras y neón sobre el río.$txt$,
  $txt$Verde.

Profundo, húmedo, vivo.

Es el color de lo que crece sin pedir permiso. Abajo, la sombra espesa de las hojas; arriba, un destello ácido, como la luz que se filtra entre ellas.

No decora la terraza: la cubre.$txt$,
  $txt$Rombo con doble línea.

El cuadrado de Origin, girado sobre su punta.

La estructura del inicio, inclinada y tomada por lo vivo. La doble línea de Pulse sigue ahí: la conexión no se pierde, ahora contiene una selva.$txt$,
  $txt$LET IT GROW.$txt$,
  'grow'
)
on conflict (slug) do update set
  numero = excluded.numero,
  nombre = excluded.nombre,
  forma = excluded.forma,
  colores = excluded.colores,
  fecha_inicio = excluded.fecha_inicio,
  fecha_fin = excluded.fecha_fin,
  concepto = excluded.concepto,
  about_relato = excluded.about_relato,
  color_descripcion = excluded.color_descripcion,
  forma_descripcion = excluded.forma_descripcion,
  intro_text = excluded.intro_text,
  intro_motion = excluded.intro_motion;

insert into public.fechas (season_id, fecha, especial)
select s.id, f.fecha, f.especial
from public.seasons s
cross join (values
  (date '2026-11-06', true),
  (date '2026-11-13', false),
  (date '2026-11-20', false),
  (date '2026-11-27', false)
) as f(fecha, especial)
where s.slug = 'jungle'
on conflict (season_id, fecha) do update set especial = excluded.especial;

-- Pulse: su frase de bienvenida pasa a leerse de intro_text (antes estaba
-- fija en el código). Sólo completa el campo si está vacío.
update public.seasons
set intro_text = 'FEEL THE CONNECTION'
where slug = 'pulse' and intro_text = '';

commit;
reset role;
