-- Un iframe de YouTube/Vimeo puede declarar una proporción panorámica.
-- La guardamos como ancho / alto para reconstruir nuestro player sin HTML.
alter table public.season_lab_clips
  add column aspect_ratio numeric not null default (16.0 / 9.0)
  check (aspect_ratio >= 0.5 and aspect_ratio <= 4.0);
