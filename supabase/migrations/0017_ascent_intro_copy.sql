-- Keep the active Season's intro aligned with the single-scene welcome.
update public.seasons
set intro_text = 'THE ENERGY RISES.'
where slug = 'ascent';
