-- Contenido de la página /about (identidad de marca por Season). Es 1:1 con
-- la Season y comparte ciclo de vida, read (`select *`), write
-- (`upsertSeason`) y RLS con el resto de la fila, así que van como columnas
-- y no como tabla aparte — mismo criterio que aftermovie_url / preview_path
-- (0006 / 0004).
--
-- El trago NO vive acá: es uno por Season y ya se carga en la fecha
-- Experience (especial = true) via fechas.trago_nombre / trago_descripcion.
-- /about lo lee de esa fecha, igual que el detalle de evento.

alter table seasons
  add column about_relato      text not null default '',
  add column color_descripcion text not null default '',
  add column forma_descripcion text not null default '';
