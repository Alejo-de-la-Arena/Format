-- Slider Experience: reemplaza el preview único de Season (preview_path)
-- por una colección ordenable de hasta 8 fotos — mismo patrón que
-- fotos_galeria. Reusa el bucket "season-previews" ya existente (sus
-- policies están scopeadas por bucket_id, no por path, así que no hace
-- falta tocarlas).

create table season_slider_photos (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  storage_path text not null, -- path dentro del bucket "season-previews"
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (season_id, storage_path)
);

create index season_slider_photos_season_id_idx on season_slider_photos(season_id);

alter table season_slider_photos enable row level security;
create policy "public read season_slider_photos" on season_slider_photos
  for select using (true);
create policy "auth write season_slider_photos" on season_slider_photos
  for all to authenticated using (true) with check (true);

-- Migra el preview ya cargado (si existe) como primer ítem del slider,
-- antes de borrar la columna vieja — no se pierde la imagen ya subida.
insert into season_slider_photos (season_id, storage_path, orden)
select id, preview_path, 0
from seasons
where preview_path is not null;

alter table seasons drop column preview_path;
