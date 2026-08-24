-- Preview de color/forma de la Season como imagen subida (reemplaza el
-- render en vivo del panel de admin) — columna + bucket propio, mismo
-- patrón que flyers/galerías.

alter table seasons add column preview_path text;

insert into storage.buckets (id, name, public)
values ('season-previews', 'season-previews', true)
on conflict (id) do nothing;

create policy "public read season-previews" on storage.objects
  for select using (bucket_id = 'season-previews');
create policy "auth write season-previews" on storage.objects
  for insert to authenticated with check (bucket_id = 'season-previews');
create policy "auth update season-previews" on storage.objects
  for update to authenticated using (bucket_id = 'season-previews');
create policy "auth delete season-previews" on storage.objects
  for delete to authenticated using (bucket_id = 'season-previews');
