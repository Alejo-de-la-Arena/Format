-- Optional welcome direction, 1:1 with Season. Existing RLS applies.
-- Run manually before editing the welcome in /admin. No content is seeded.
begin;

alter table public.seasons
  add column intro_text text not null default ''
    constraint seasons_intro_text_length check (char_length(intro_text) <= 160),
  add column intro_motion text not null default 'signal'
    constraint seasons_intro_motion_valid check (intro_motion in ('signal', 'ascend', 'expand'));

comment on column public.seasons.intro_text is 'Optional welcome phrase; line breaks preserved. Empty uses the Season name.';
comment on column public.seasons.intro_motion is 'Welcome motion preset; identity is read from the existing shape and colors.';

commit;
