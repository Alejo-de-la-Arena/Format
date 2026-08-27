-- Se va el "Set completo": la card de la home y el bloque Sets de
-- /eventos/[slug]. Ninguna fecha tenía cargado un set (ambas columnas
-- estaban en NULL en las 3 fechas de Origin), así que no se pierde nada.
--
-- El video de FORMAT ahora entra por dos lugares, los dos a nivel Season:
-- seasons.aftermovie_url y season_lab_clips.video_url (ver 0006).

alter table fechas
  drop column if exists youtube_url,
  drop column if exists soundcloud_url;
