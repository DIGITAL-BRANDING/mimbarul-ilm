-- Public and draft rows are deliberately both present. Anonymous REST requests must only expose the public row.
insert into public.author_profiles (id, slug, is_primary)
values ('a0000000-0000-0000-0000-000000000001', 'test-author', true);

insert into public.lessons (id, author_id, content_type, original_locale) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'article', 'ha'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'article', 'ha');

insert into public.lesson_translations (id, lesson_id, locale, title, slug, excerpt, body, body_text, status, published_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ha', 'Gwajin ilimi', 'gwajin-ilimi', 'Darasin jama''a domin gwaji', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Wannan rubutu ne na jama''a."}]}]}', 'Wannan rubutu ne na jama''a.', 'published', now() - interval '1 minute'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'ha', 'Sirrin daftari', 'sirrin-daftari', 'Wannan draft ne', '{"type":"doc","content":[{"type":"paragraph"}]}', 'Sirrin draft', 'draft', null);

insert into public.sources (id, source_type, title) values ('50000000-0000-0000-0000-000000000001', 'other', 'Littafin gwaji');
insert into public.lesson_sources (lesson_id, source_id, page) values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '12');
