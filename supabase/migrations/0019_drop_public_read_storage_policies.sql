-- Storage: quita las policies de SELECT abiertas a cualquiera sobre
-- storage.objects para los buckets públicos.
--
-- Los tres buckets son public = true: sus archivos se sirven por
-- /storage/v1/object/public/<bucket>/<path> sin pasar por RLS, así que el
-- sitio sigue cargando flyers, galerías y portadas igual. Lo único que
-- habilitaban estas policies era usar la API autenticada de Storage como
-- anónimo: listar el contenido de los buckets (enumerar archivos) o
-- consultar metadata.
--
-- El admin conserva lectura, listado e info() por las policies "admin write
-- media" (0011) y "admin write season-previews" (0016), que son FOR ALL.
--
-- Ejecutar manualmente. Verificar antes que los buckets sigan públicos:
--   select id, public from storage.buckets
--   where id in ('flyers', 'galerias', 'season-previews');
-- Si alguno no es público, NO aplicar: sus imágenes dejarían de cargar.

begin;

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id in ('flyers', 'galerias', 'season-previews') and public is not true
  ) then
    raise exception 'Hay un bucket de FORMAT que no es público: no aplicar esta migración.';
  end if;
end $$;

drop policy if exists "public read flyers" on storage.objects;
drop policy if exists "public read galerias" on storage.objects;
drop policy if exists "public read season-previews" on storage.objects;

commit;
