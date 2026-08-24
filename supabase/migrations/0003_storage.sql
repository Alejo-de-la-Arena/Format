-- Buckets públicos para flyers y galerías. Lectura pública (next/image
-- necesita URLs directas), escritura sólo para usuarios autenticados.

insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('galerias', 'galerias', true)
on conflict (id) do nothing;

create policy "public read flyers" on storage.objects
  for select using (bucket_id = 'flyers');
create policy "auth write flyers" on storage.objects
  for insert to authenticated with check (bucket_id = 'flyers');
create policy "auth update flyers" on storage.objects
  for update to authenticated using (bucket_id = 'flyers');
create policy "auth delete flyers" on storage.objects
  for delete to authenticated using (bucket_id = 'flyers');

create policy "public read galerias" on storage.objects
  for select using (bucket_id = 'galerias');
create policy "auth write galerias" on storage.objects
  for insert to authenticated with check (bucket_id = 'galerias');
create policy "auth update galerias" on storage.objects
  for update to authenticated using (bucket_id = 'galerias');
create policy "auth delete galerias" on storage.objects
  for delete to authenticated using (bucket_id = 'galerias');
