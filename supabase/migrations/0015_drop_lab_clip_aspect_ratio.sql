-- El width/height de un iframe compartido describe el embed, no el video
-- fuente. FORMAT Lab usa el player nativo 16:9 para no imponer proporciones
-- incorrectas ni crear franjas alrededor del video.
alter table public.season_lab_clips
  drop column if exists aspect_ratio;
