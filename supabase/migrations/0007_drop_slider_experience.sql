-- El Slider Experience se reemplaza por el aftermovie embebido (ver 0006).
-- No quedaba ningún consumidor de las fotos: el único era el <Carousel> de
-- la banda "FORMAT Experience" de la home.
--
-- Se van la tabla y las policies del bucket. El BUCKET en sí (y sus 7
-- objetos) NO se puede borrar desde acá: storage.protect_delete() bloquea
-- el DELETE directo sobre storage.objects a propósito, para no dejar
-- archivos huérfanos en S3 con la metadata borrada. Hay que hacerlo por la
-- Storage API o desde el dashboard:
--   Supabase → Storage → season-previews → Delete bucket
-- Eso vacía y elimina el bucket limpiando también los archivos.

drop table if exists season_slider_photos;

drop policy if exists "public read season-previews" on storage.objects;
drop policy if exists "auth write season-previews" on storage.objects;
drop policy if exists "auth update season-previews" on storage.objects;
drop policy if exists "auth delete season-previews" on storage.objects;
