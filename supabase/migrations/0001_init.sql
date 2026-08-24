-- FORMAT — schema inicial: seasons, fechas, lineup_slots, fotos_galeria.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table seasons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  numero text not null,
  nombre text not null,
  forma text not null check (forma in (
    'circle','triangle','square','hexagon','hexagon-organic','infinity'
  )),
  -- Hasta 5 hex, en orden de rol (ver CLAUDE.md § Colores por Season).
  colores text[] not null default '{}'::text[]
    check (array_length(colores, 1) is null or array_length(colores, 1) <= 5),
  concepto text not null default '',
  fecha_inicio date not null,
  fecha_fin date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fecha_fin_after_inicio check (fecha_fin >= fecha_inicio)
);

create trigger seasons_set_updated_at before update on seasons
  for each row execute function set_updated_at();

create table fechas (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  fecha date not null,
  especial boolean not null default false,
  hora_inicio time,
  hora_fin time,
  flyer_path text,       -- path dentro del bucket "flyers"
  foto_escena_path text, -- path dentro del bucket "galerias"
  youtube_url text,
  soundcloud_url text,
  -- Sólo aplican cuando especial = true (fechas Experience).
  barra_libre boolean not null default false,
  trago_nombre text,
  trago_descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, fecha)
);

create index fechas_season_id_idx on fechas(season_id);
create index fechas_fecha_idx on fechas(fecha);

create trigger fechas_set_updated_at before update on fechas
  for each row execute function set_updated_at();

create table lineup_slots (
  id uuid primary key default gen_random_uuid(),
  fecha_id uuid not null references fechas(id) on delete cascade,
  orden integer not null,
  hora_inicio time,
  hora_fin time,
  -- 1+ nombres; 2+ se renderiza como back-to-back ("A b2b B").
  artistas text[] not null default '{}'::text[]
    check (array_length(artistas, 1) is not null),
  created_at timestamptz not null default now(),
  unique (fecha_id, orden)
);

create index lineup_slots_fecha_id_idx on lineup_slots(fecha_id);

create table fotos_galeria (
  id uuid primary key default gen_random_uuid(),
  fecha_id uuid not null references fechas(id) on delete cascade,
  storage_path text not null, -- path dentro del bucket "galerias"
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha_id, storage_path)
);

create index fotos_galeria_fecha_id_idx on fotos_galeria(fecha_id);
