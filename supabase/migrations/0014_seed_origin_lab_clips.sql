-- Clips solicitados para la Experience Origin del 7 de agosto de 2026.
-- Es idempotente: volver a correrla no duplica filas por video.
with origin_fecha as (
  select fechas.id
  from public.fechas
  join public.seasons on seasons.id = fechas.season_id
  where seasons.slug = 'origin'
    and fechas.fecha = date '2026-08-07'
    and fechas.especial = true
), clips(titulo, video_url, orden) as (
  values
    ('Fran Tettamanti', 'https://www.youtube.com/watch?v=owFITuKDXbw', 0),
    ('Momo Ezcurra b2b Luca Dovidio', 'https://www.youtube.com/watch?v=LGI8dnbRfNc', 1),
    ('Momo Ezcurra b2b Luca Dovidio — drop 002', 'https://www.youtube.com/watch?v=57vqXP_GGNY', 2),
    ('Momo Ezcurra b2b Luca Dovidio — drop 003', 'https://www.youtube.com/watch?v=o8xLJ6Rwkgk', 3)
)
insert into public.season_lab_clips (fecha_id, titulo, video_url, orden, aspect_ratio)
select origin_fecha.id, clips.titulo, clips.video_url, clips.orden, 1265.0 / 480.0
from origin_fecha
cross join clips
where not exists (
  select 1
  from public.season_lab_clips existing
  where existing.fecha_id = origin_fecha.id
    and existing.video_url = clips.video_url
);
