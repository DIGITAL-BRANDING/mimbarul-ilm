-- Integration tests for schema, RLS, triggers and search. Run via tests/integration/run.sh
\set ON_ERROR_STOP on
\set admin  '''aaaaaaaa-0000-0000-0000-000000000001'''
\set editor '''eeeeeeee-0000-0000-0000-000000000002'''
\set outsider '''99999999-0000-0000-0000-000000000003'''

create schema if not exists t;
create or replace function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'ASSERTION FAILED: %', msg; end if; raise notice 'PASS: %', msg; end $$;
grant usage on schema t to anon, authenticated;
grant execute on function t.ok(boolean, text) to anon, authenticated;

-- ---------- fixtures (superuser, auth.uid() is NULL => provisioning path)
insert into auth.users (id, email) values (:admin, 'admin@test'), (:editor, 'editor@test'), (:outsider, 'x@test');
insert into public.profiles (id, role, display_name) values (:admin, 'admin', 'Admin'), (:editor, 'editor', 'Editor');
insert into public.author_profiles (id, slug, is_primary) values ('a0000000-0000-0000-0000-000000000001', 'main', true);
insert into public.lessons (id, author_id, content_type, original_locale) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'article', 'ha'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'article', 'ar');
insert into public.lesson_translations (id, lesson_id, locale, title, slug, excerpt, body_text, status, published_at) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','ha','Ƙarfin Imani','karfin-imani','Bayani kan imani','Imani yana ƙaruwa da biyayya','draft', null),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','ar','النية في الأعمال','alniyya','شرح حديث النية',E'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ\nوَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى','draft', null);
insert into public.sources (id, source_type, title) values ('50000000-0000-0000-0000-000000000001','hadith_collection','Sahih al-Bukhari');
insert into public.lesson_sources (lesson_id, source_id, hadith_number) values ('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','1');
insert into public.media_assets (id, kind, storage_path, mime_type) values ('60000000-0000-0000-0000-000000000001','image','draft/a.png','image/png');
insert into public.contact_messages (name, email, message) values ('Zainab','z@example.com','Assalamu alaikum');
insert into public.tags (id, slug) values ('70000000-0000-0000-0000-000000000001','imani');
insert into public.tag_translations values ('70000000-0000-0000-0000-000000000001','ha','Imani');
insert into public.lesson_tags values ('10000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001');

-- ================= 1. DRAFT ISOLATION (anonymous) =================
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations) = 0, 'anon sees no draft translations');
select t.ok((select count(*) from public.lessons) = 0, 'anon sees no lesson whose translations are all drafts');
select t.ok((select count(*) from public.lesson_sources) = 0, 'anon sees no citations of draft lessons');
select t.ok((select count(*) from public.sources) = 0, 'anon sees no source used only by draft lessons');
select t.ok((select count(*) from public.media_assets) = 0, 'anon sees no non-public media');
select t.ok((select count(*) from public.lesson_tags) = 0, 'anon sees no tags of draft lessons');
select t.ok((select count(*) from public.search_lessons('imani')) = 0, 'search never returns drafts');
rollback;

-- ================= 2. anon has no access to private tables =================
begin; set local role anon;
do $$ begin perform 1 from public.contact_messages; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot read contact_messages'; end $$;
do $$ begin perform 1 from public.audit_logs; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot read audit_logs'; end $$;
do $$ begin perform 1 from public.lesson_revisions; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot read revisions'; end $$;
do $$ begin perform 1 from public.rate_limits; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot read rate_limits'; end $$;
do $$ begin perform 1 from public.profiles; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot read profiles'; end $$;
do $$ begin insert into public.lessons (content_type) values ('article'); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot insert lessons'; end $$;
do $$ begin insert into public.contact_messages (name,email,message) values ('a','a@b.co','hello world'); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: anon cannot insert contact_messages directly (server-only path)'; end $$;
rollback;

-- ================= 3. outsider: authenticated but NOT staff =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :outsider, true);
select t.ok((select count(*) from public.lesson_translations) = 0, 'authenticated non-staff sees no drafts');
select t.ok((select count(*) from public.profiles) = 0, 'non-staff sees no profiles');
select t.ok((select count(*) from public.contact_messages) = 0, 'non-staff cannot read contact messages');
do $$ begin insert into public.lessons (content_type) values ('article'); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: non-staff cannot insert lessons (RLS)'; end $$;
do $$ begin insert into public.profiles (id, role, display_name) values ('99999999-0000-0000-0000-000000000003','admin','me'); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: outsider cannot self-provision an admin profile'; end $$;
rollback;

-- ================= 4. editor limits =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :editor, true);
select t.ok((select count(*) from public.lesson_translations) = 2, 'editor sees drafts');
do $$ begin update public.lesson_translations set status='published', published_at=now() where id='20000000-0000-0000-0000-000000000001'; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: editor cannot publish'; end $$;
do $$ begin update public.profiles set role='admin' where id='eeeeeeee-0000-0000-0000-000000000002'; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: editor cannot self-promote to admin'; end $$;
select t.ok((select count(*) from public.audit_logs) = 0, 'editor sees no audit logs');
delete from public.lesson_translations;
select t.ok((select count(*) from public.lesson_translations) = 2, 'editor cannot delete translations (admin only)');
update public.lesson_translations set title='Ƙarfin Imani (edited)' where id='20000000-0000-0000-0000-000000000001';
select t.ok((select version from public.lesson_translations where id='20000000-0000-0000-0000-000000000001') = 2, 'update increments version (optimistic concurrency)');
rollback;

-- ================= 5. admin publishing rules =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :admin, true);
-- missing excerpt blocks publishing
update public.lesson_translations set excerpt = null where id='20000000-0000-0000-0000-000000000001';
do $$ begin update public.lesson_translations set status='published' where id='20000000-0000-0000-0000-000000000001'; raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: cannot publish without excerpt'; end $$;
update public.lesson_translations set excerpt='Bayani kan imani' where id='20000000-0000-0000-0000-000000000001';
-- archived -> published is not an allowed transition
update public.lesson_translations set status='archived' where id='20000000-0000-0000-0000-000000000002';
do $$ begin update public.lesson_translations set status='published' where id='20000000-0000-0000-0000-000000000002'; raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: archived -> published rejected'; end $$;
update public.lesson_translations set status='draft' where id='20000000-0000-0000-0000-000000000002';
-- locale is immutable
do $$ begin update public.lesson_translations set locale='en' where id='20000000-0000-0000-0000-000000000001'; raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: locale immutable'; end $$;
-- duplicate (locale, slug)
do $$ begin insert into public.lesson_translations (lesson_id, locale, title, slug) values ('10000000-0000-0000-0000-000000000002','ha','Dup','karfin-imani'); raise exception 'SHOULD FAIL'; exception when unique_violation then raise notice 'PASS: (locale, slug) unique'; end $$;
-- Hadith grading needs a named authority
do $$ begin insert into public.lesson_sources (lesson_id, source_id, authenticity_grade) values ('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','sahih'); raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: grading without authority rejected'; end $$;
insert into public.lesson_sources (lesson_id, source_id, authenticity_grade, graded_by) values ('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','sahih','Verified by the editor against the printed edition');
-- publish both
update public.lesson_translations set status='published' where id in ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002');
select t.ok((select published_at is not null from public.lesson_translations where id='20000000-0000-0000-0000-000000000001'), 'publishing sets published_at');
commit;

-- ================= 6. visitors now see published content only =================
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations) = 2, 'anon sees published translations');
select t.ok((select count(*) from public.lessons) = 2, 'anon sees lessons with a published translation');
select t.ok((select count(*) from public.sources) = 1, 'anon sees source cited by a public lesson');
select t.ok((select count(*) from public.media_assets) = 0, 'anon still cannot see non-public media');
rollback;

-- a draft English translation of a published lesson stays hidden
insert into public.lesson_translations (id, lesson_id, locale, kind, translator_name, title, slug, excerpt, body_text) values
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','en','translation','Test Translator','Strength of Faith','strength-of-faith','About faith','Faith increases with obedience');
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations where locale='en') = 0, 'draft English translation hidden while Hausa original is public');
select t.ok((select count(*) from public.lesson_translations where locale='ha') = 1, 'published Hausa original visible');
rollback;
do $$ begin insert into public.lesson_translations (lesson_id, locale, kind, title, slug) values ('10000000-0000-0000-0000-000000000001','ar','translation','x','x'); raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: translation requires translator attribution'; end $$;

-- ================= 7. scheduled publication =================
update public.lesson_translations set status='published', published_at = now() + interval '7 days' where id='20000000-0000-0000-0000-000000000003';
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations where locale='en') = 0, 'future-dated published translation is NOT public yet');
rollback;
update public.lesson_translations set published_at = now() - interval '1 minute' where id='20000000-0000-0000-0000-000000000003';
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations where locale='en') = 1, 'translation becomes public once its date arrives');
rollback;

-- ================= 8. slug change => redirect, revisions, audit =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :admin, true);
update public.lesson_translations set slug='faith-strength' where id='20000000-0000-0000-0000-000000000003';
update public.lesson_translations set slug='faith-strength-2' where id='20000000-0000-0000-0000-000000000003';
select t.ok((select to_path from public.url_redirects where from_path='/en/lessons/strength-of-faith') = '/en/lessons/faith-strength-2', 'slug change creates redirect and collapses redirect chains');
select t.ok((select to_path from public.url_redirects where from_path='/en/lessons/faith-strength') = '/en/lessons/faith-strength-2', 'intermediate slug also redirects to the latest');
update public.lesson_translations set slug='strength-of-faith' where id='20000000-0000-0000-0000-000000000003';
select t.ok((select count(*) from public.url_redirects where from_path='/en/lessons/strength-of-faith') = 0, 'redirect removed when slug is restored (no redirect away from a live URL)');
select t.ok((select count(*) from public.lesson_revisions where translation_id='20000000-0000-0000-0000-000000000003') >= 1, 'revisions recorded');
select t.ok((select count(*) from public.audit_logs where action='lesson.status_changed') >= 2, 'status changes are audit-logged');
select t.ok((select count(*) from public.audit_logs where action='lesson.slug_changed') >= 2, 'slug changes are audit-logged');
do $$ begin update public.audit_logs set action='tampered'; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: audit_logs cannot be updated'; end $$;
do $$ begin delete from public.audit_logs; raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'PASS: audit_logs cannot be deleted'; end $$;
commit;

-- ================= 9. unpublishing removes public access =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :admin, true);
update public.lesson_translations set status='draft' where id='20000000-0000-0000-0000-000000000003';
commit;
begin; set local role anon;
select t.ok((select count(*) from public.lesson_translations where locale='en') = 0, 'unpublished translation disappears from public access');
rollback;

-- ================= 10. SEARCH (Hausa / Arabic / English) =================
begin; set local role anon;
select t.ok((select count(*) from public.search_lessons('karfin')) = 1, 'Hausa: "karfin" finds title "Ƙarfin" (hooked-letter folding)');
select t.ok((select count(*) from public.search_lessons('ƘARFIN')) = 1, 'Hausa: hooked capital query');
select t.ok((select count(*) from public.search_lessons('الاعمال بالنيات')) = 1, 'Arabic: plain query matches vocalised text (tashkeel folding)');
select t.ok((select count(*) from public.search_lessons('إِنَّمَا الْأَعْمَالُ')) = 1, 'Arabic: vocalised query matches');
select t.ok((select count(*) from public.search_lessons('انما')) = 1, 'Arabic: alef-hamza variants fold together');
select t.ok((select count(*) from public.search_lessons('imani')) = 1, 'tag name is searchable');
select t.ok((select count(*) from public.search_lessons('bukhari')) = 1, 'cited source title is searchable');
select t.ok((select count(*) from public.search_lessons('')) = 0, 'empty query returns nothing safely');
select t.ok((select count(*) from public.search_lessons('   ')) = 0, 'whitespace query returns nothing safely');
select t.ok((select count(*) from public.search_lessons('100%')) = 0, 'LIKE wildcard characters are escaped');
select t.ok((select count(*) from public.search_lessons('zzzznotfound')) = 0, 'no-match query returns nothing');
select t.ok((select count(*) from public.search_lessons('imani', 'ar')) = 0, 'locale filter applies');
select t.ok((select count(*) from public.search_lessons('Strength of Faith')) = 0, 'unpublished (draft) English lesson is not searchable');
select t.ok((select count(*) from public.search_lessons('karfin', null, 'audio')) = 0, 'content-type filter applies');
rollback;

-- ================= 11. profile escalation via admin only =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :admin, true);
update public.profiles set role='admin' where id=:editor;
select t.ok((select role from public.profiles where id=:editor) = 'admin', 'admin can promote another user');
select t.ok((select count(*) from public.audit_logs where action='profile.role_changed') = 1, 'role change is audit-logged');
rollback;


-- ================= 12. migration 0007 additions =================
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :admin, true);
-- citation verification is stamped by the server-side trigger, not by the client
insert into public.lesson_sources (id, lesson_id, source_id, hadith_number, reference_verified, verified_by)
  values ('51000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','7', true, :editor);
select t.ok((select verified_by from public.lesson_sources where id='51000000-0000-0000-0000-000000000001') = :admin::uuid, 'verified_by is set from the session user (client value ignored)');
select t.ok((select verified_at is not null from public.lesson_sources where id='51000000-0000-0000-0000-000000000001'), 'verified_at is stamped');
update public.lesson_sources set hadith_number='8' where id='51000000-0000-0000-0000-000000000001';
select t.ok((select not reference_verified from public.lesson_sources where id='51000000-0000-0000-0000-000000000001'), 'changing the locator invalidates verification');
update public.lesson_sources set editorial_notes='note only' where id='51000000-0000-0000-0000-000000000001';
-- review status resets when text changes
update public.lesson_translations set review_status='reviewed' where id='20000000-0000-0000-0000-000000000003';
select t.ok((select review_status from public.lesson_translations where id='20000000-0000-0000-0000-000000000003')='reviewed', 'translation can be marked reviewed');
update public.lesson_translations set title='Strength of Faith (edited)' where id='20000000-0000-0000-0000-000000000003';
select t.ok((select review_status from public.lesson_translations where id='20000000-0000-0000-0000-000000000003')='unreviewed', 'editing text resets review status');
-- contact workflow status
rollback;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :editor, true);
update public.contact_messages set status='read';
select t.ok((select count(*) from public.contact_messages where status='read') = 1, 'staff can mark a contact message read');
do $$ begin update public.contact_messages set status='bogus'; raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: invalid contact status rejected'; end $$;
rollback;
-- categories: stable unique slug
do $$ begin insert into public.categories (slug) values ('a'),('a'); raise exception 'SHOULD FAIL'; exception when unique_violation then raise notice 'PASS: category slug unique'; end $$;
do $$ begin insert into public.categories (slug) values ('Bad Slug'); raise exception 'SHOULD FAIL'; exception when check_violation then raise notice 'PASS: category slug format enforced'; end $$;

-- ================= 13. seed is idempotent and publicly readable =================
\i supabase/seed.sql
\i supabase/seed.sql
select t.ok((select count(*) from public.categories where slug in ('quran-tafsir','hadith','aqeedah','tawheed','fiqh-worship','character','book-commentary','history','general')) = 9, 'seed creates the 9 starter categories exactly once');
select t.ok((select count(*) from public.category_translations) = 27, 'seed creates 27 category translations (9 x 3 locales)');
begin; set local role anon;
select t.ok((select count(*) from public.category_translations where locale='ar') = 9, 'anon can read category names');
rollback;

\echo ALL INTEGRATION TESTS PASSED
