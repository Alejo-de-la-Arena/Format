-- Video por URL: ni el aftermovie ni los clips de FORMAT Lab se suben a
-- Storage. Supabase no hace transcoding ni streaming adaptativo, así que el
-- video vive en YouTube/Vimeo y acá sólo guardamos la URL — el embed se
-- arma en el cliente (ver lib/embed.ts).

-- AFTERMOVIE — uno por Season, no por fecha: una Season son varios viernes
-- bajo el mismo concepto y el aftermovie los resume a todos. Ponerlo en
-- `fechas` obligaría a elegir arbitrariamente qué viernes lo "posee".
alter table seasons add column aftermovie_url text;

-- FORMAT LAB — clips cortos, típicamente uno por DJ de la Season.
-- Va contra `seasons` por el mismo motivo que el aftermovie: el clip es del
-- DJ dentro del concepto de la Season, no de un viernes puntual, y la home
-- los muestra sin contexto de fecha. Cantidad libre (sin límite duro):
-- "3 por Season" es la práctica habitual, no una regla del modelo.
create table season_lab_clips (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  -- Nombre del DJ, o título del clip. Es lo único que se ve bajo el player.
  titulo text not null default '',
  -- URL completa de YouTube o Vimeo, tal cual la pega el admin.
  video_url text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index season_lab_clips_season_id_idx on season_lab_clips(season_id);

alter table season_lab_clips enable row level security;
create policy "public read season_lab_clips" on season_lab_clips
  for select using (true);
create policy "auth write season_lab_clips" on season_lab_clips
  for all to authenticated using (true) with check (true);
