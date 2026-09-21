-- Ejecutar manualmente antes de habilitar el upload en /admin.
-- No modifica aftermovies ni imágenes de otras secciones.
begin;

alter table public.seasons add column if not exists aftermovie_poster_path text;
comment on column public.seasons.aftermovie_poster_path is
  'Objeto WebP de season-previews, exclusivo del aftermovie de la home';

insert into storage.buckets (id, name, public)
values ('season-previews', 'season-previews', true)
on conflict (id) do update set public = true;

-- Limpia permisos históricos si el bucket ya existía.
drop policy if exists "public read season-previews" on storage.objects;
drop policy if exists "auth write season-previews" on storage.objects;
drop policy if exists "auth update season-previews" on storage.objects;
drop policy if exists "auth delete season-previews" on storage.objects;
drop policy if exists "admin write season-previews" on storage.objects;

create policy "public read season-previews" on storage.objects
  for select using (bucket_id = 'season-previews');
create policy "admin write season-previews" on storage.objects
  for all to authenticated
  using (bucket_id = 'season-previews' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'season-previews' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

commit;