-- RLS: lectura pública (el sitio lee sin sesión), escritura sólo para
-- usuarios autenticados (Alejo y Tomás, dados de alta manualmente).

alter table seasons enable row level security;
alter table fechas enable row level security;
alter table lineup_slots enable row level security;
alter table fotos_galeria enable row level security;

create policy "public read seasons" on seasons
  for select using (true);
create policy "public read fechas" on fechas
  for select using (true);
create policy "public read lineup_slots" on lineup_slots
  for select using (true);
create policy "public read fotos_galeria" on fotos_galeria
  for select using (true);

create policy "auth write seasons" on seasons
  for all to authenticated using (true) with check (true);
create policy "auth write fechas" on fechas
  for all to authenticated using (true) with check (true);
create policy "auth write lineup_slots" on lineup_slots
  for all to authenticated using (true) with check (true);
create policy "auth write fotos_galeria" on fotos_galeria
  for all to authenticated using (true) with check (true);
