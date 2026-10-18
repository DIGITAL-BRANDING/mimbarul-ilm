-- OPTIONAL starter taxonomy (the subject list from the project brief). Safe to re-run.
-- These are neutral category names only: no religious content, no personal information.
-- Hausa and Arabic names are DRAFTS and must be reviewed by a native speaker / the scholar.
do $$
declare
  rec record; cid uuid;
begin
  for rec in select * from (values
    (1, 'quran-tafsir',   'Alƙur''ani da Tafsiri',     'alkurani-da-tafsiri',  'القرآن والتفسير',       'alquran-wa-altafsir',  'Qur''an and Tafsir',           'quran-and-tafsir'),
    (2, 'hadith',         'Hadisi',                    'hadisi',               'الحديث',                'alhadith',             'Hadith',                       'hadith'),
    (3, 'aqeedah',        'Akida',                     'akida',                'العقيدة',               'alaqeeda',             'Aqeedah',                      'aqeedah'),
    (4, 'tawheed',        'Tauhidi',                   'tauhidi',              'التوحيد',               'altawheed',            'Tawheed',                      'tawheed'),
    (5, 'fiqh-worship',   'Fikihu da Ibada',           'fikihu-da-ibada',      'الفقه والعبادات',       'alfiqh-wal-ibadat',    'Fiqh and Worship',             'fiqh-and-worship'),
    (6, 'character',      'Halaye da Tarbiyya',        'halaye-da-tarbiyya',   'الأخلاق والتربية',      'alakhlaq-wal-tarbiya', 'Islamic Character and Education', 'character-and-education'),
    (7, 'book-commentary','Sharhin Littattafan Malamai','sharhin-littattafai', 'شروح الكتب العلمية',    'shuruh-alkutub',       'Scholarly Book Commentaries',  'book-commentaries'),
    (8, 'history',        'Tarihin Musulunci',         'tarihin-musulunci',    'التاريخ الإسلامي',      'altarikh-alislami',    'Islamic History',              'islamic-history'),
    (9, 'general',        'Darussa Gabaɗaya',          'darussa-gabaduya',     'دروس إسلامية عامة',     'durus-islamiyya-amma', 'General Islamic Lessons',      'general-lessons')
  ) as t(sort, key, ha_name, ha_slug, ar_name, ar_slug, en_name, en_slug)
  loop
    insert into public.categories (slug, sort_order) values (rec.key, rec.sort)
      on conflict (slug) do update set sort_order = excluded.sort_order
      returning id into cid;
    insert into public.category_translations (category_id, locale, name, slug) values
      (cid, 'ha', rec.ha_name, rec.ha_slug), (cid, 'ar', rec.ar_name, rec.ar_slug), (cid, 'en', rec.en_name, rec.en_slug)
      on conflict (category_id, locale) do nothing;
  end loop;
end $$;
