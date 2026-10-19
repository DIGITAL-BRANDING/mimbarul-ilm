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

-- =====================================================================================================
-- Extended fixtures: cases that MUST stay hidden or behave specially on the public site.
-- =====================================================================================================
insert into public.lessons (id, author_id, content_type, original_locale) values
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'article', 'ha'),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'article', 'ha');

insert into public.author_profile_translations (author_id, locale, display_name) values
  ('a0000000-0000-0000-0000-000000000001', 'ha', 'Marubuci na gwaji');

-- L1: a PUBLISHED, reviewed English translation
insert into public.lesson_translations (id, lesson_id, locale, kind, translator_name, title, slug, excerpt, body, body_text, status, published_at) values
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'en', 'translation', 'Fixture Translator', 'Knowledge test', 'knowledge-test', 'A public test lesson',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is public text."}]}]}', 'This is public text.', 'published', now() - interval '1 minute');
update public.lesson_translations set review_status = 'reviewed' where id = '20000000-0000-0000-0000-000000000011';

-- L3: Hausa lesson with an Arabic hadith block. Its English translation is still a DRAFT and must stay private.
insert into public.lesson_translations (id, lesson_id, locale, title, slug, excerpt, body, body_text, status, published_at) values
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'ha', 'Niyya a ayyuka', 'niyya-a-ayyuka', 'Bayani kan niyya',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hadisi ya ce:"}]},{"type":"blockquote","attrs":{"kind":"hadith","dir":"rtl","lang":"ar"},"content":[{"type":"paragraph","attrs":{"dir":"rtl","lang":"ar"},"content":[{"type":"text","text":"إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"}]}]}]}',
   E'Hadisi ya ce:\nإِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', 'published', now() - interval '2 days');
insert into public.lesson_translations (id, lesson_id, locale, kind, translator_name, title, slug, excerpt, body_text, status) values
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 'en', 'translation', 'Draft Translator', 'Intentions (unfinished)', 'intentions-draft', 'Not ready', 'Not ready for the public', 'draft');

-- L4: published but SCHEDULED for the future
insert into public.lesson_translations (id, lesson_id, locale, title, slug, excerpt, body_text, status, published_at) values
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'ha', 'Darasi na nan gaba', 'nan-gaba', 'Za a buga daga baya', 'Rubutu na nan gaba', 'published', now() + interval '7 days');

-- Citations: one unverified, one graded + verified
insert into public.sources (id, source_type, title, author_or_compiler) values ('50000000-0000-0000-0000-000000000002', 'hadith_collection', 'Fixture Hadith Collection', 'Fixture Compiler');
insert into public.lesson_sources (lesson_id, source_id, hadith_number, authenticity_grade, graded_by, reference_verified, quotation, sort_order) values
  ('10000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', '1', 'sahih', 'Fixture authority', true, 'Fixture quotation', 0);

-- Taxonomy
insert into public.categories (id, slug, sort_order) values ('c0000000-0000-0000-0000-000000000001', 'fixture-cat', 1);
insert into public.category_translations (category_id, locale, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'ha', 'Fanni na gwaji', 'fanni-na-gwaji'),
  ('c0000000-0000-0000-0000-000000000001', 'en', 'Test subject', 'test-subject');
insert into public.lesson_categories values
  ('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001');
insert into public.tags (id, slug) values ('70000000-0000-0000-0000-000000000001', 'imani');
insert into public.tag_translations values ('70000000-0000-0000-0000-000000000001', 'ha', 'Imani');
insert into public.lesson_tags values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001');
insert into public.related_lessons (lesson_id, related_lesson_id) values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003');

-- Media: a public audio file, a PRIVATE audio file (must never be exposed), and a public YouTube embed
insert into public.media_assets (id, kind, storage_path, public_path, is_public, mime_type, duration_seconds) values
  ('60000000-0000-0000-0000-000000000001', 'audio', 'private/pub.mp3', 'lessons/pub file.mp3', true, 'audio/mpeg', 60),
  ('60000000-0000-0000-0000-000000000002', 'audio', 'private/secret.mp3', null, false, 'audio/mpeg', 30);
insert into public.media_assets (id, kind, external_provider, external_id, is_public) values ('60000000-0000-0000-0000-000000000003', 'video', 'youtube', 'dQw4w9WgXcQ', true);
insert into public.media_asset_translations (media_id, locale, title) values
  ('60000000-0000-0000-0000-000000000001', 'ha', 'Sautin gwaji'), ('60000000-0000-0000-0000-000000000003', 'ha', 'Bidiyon gwaji');
insert into public.lesson_media (lesson_id, media_id, role) values
  ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'audio'),
  ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', 'audio'),
  ('10000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', 'video');

-- Private data that must never be readable with the anonymous key
insert into public.contact_messages (name, email, message) values ('Visitor', 'v@example.com', 'private message');

-- A renamed lesson keeps working through the redirect table
insert into public.url_redirects (from_path, to_path) values ('/ha/lessons/tsohon-suna', '/ha/lessons/gwajin-ilimi');
