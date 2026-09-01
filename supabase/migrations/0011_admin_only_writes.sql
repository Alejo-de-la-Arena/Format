-- Producción: el sitio sigue leyendo contenido público, pero sólo cuentas
-- con app_metadata.role = 'admin' pueden escribir tablas u objetos.
-- No usar user_metadata para autorización: el usuario puede editarlo.

drop policy if exists "auth write seasons" on seasons;
drop policy if exists "auth write fechas" on fechas;
drop policy if exists "auth write lineup_slots" on lineup_slots;
drop policy if exists "auth write fotos_galeria" on fotos_galeria;
drop policy if exists "auth write season_lab_clips" on season_lab_clips;

create policy "admin write seasons" on seasons
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin write fechas" on fechas
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin write lineup_slots" on lineup_slots
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin write fotos_galeria" on fotos_galeria
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin write season_lab_clips" on season_lab_clips
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "auth write flyers" on storage.objects;
drop policy if exists "auth update flyers" on storage.objects;
drop policy if exists "auth delete flyers" on storage.objects;
drop policy if exists "auth write galerias" on storage.objects;
drop policy if exists "auth update galerias" on storage.objects;
drop policy if exists "auth delete galerias" on storage.objects;
create policy "admin write media" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('flyers', 'galerias')
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id in ('flyers', 'galerias')
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
