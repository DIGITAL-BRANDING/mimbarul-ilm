#!/usr/bin/env bash
# HTTP smoke/regression checks against a RUNNING production build of the app that is connected to the integration stack
# (tests/integration/stack: seeded fixtures). Not wired into `npm test` because it needs the stack + `next build && next start`.
#   1) start the stack and export NEXT_PUBLIC_* as in tests/integration/run-stack.mjs
#   2) npm run build && npm start -- -p 3111
#   3) APP_URL=http://localhost:3111 bash tests/integration/http-checks.sh
# Exit code is non-zero if any check fails.
B="${APP_URL:-http://localhost:3111}"; PASS=0; FAIL=0
t(){ # name, condition-exit
  if [ "$2" = "0" ]; then PASS=$((PASS+1)); echo "PASS  $1"; else FAIL=$((FAIL+1)); echo "FAIL  $1"; fi; }
get(){ curl -s -o /tmp/p.html -D /tmp/h.txt -w "%{http_code}" "$B$1"; }
has(){ grep -aqF -- "$1" /tmp/p.html; }
hasnt(){ ! grep -aqF -- "$1" /tmp/p.html; }
code(){ [ "$(get "$1")" = "$2" ]; }

echo "=== lesson: Hausa original with English translation, taxonomy, citation, media, related"
code /ha/lessons/gwajin-ilimi 200; t "200 /ha/lessons/gwajin-ilimi" $?
has '<title>Gwajin ilimi | Mimbarul Ilm'; t "title" $?
has 'hrefLang="en" href="http://localhost:3000/en/lessons/knowledge-test"'; t "hreflang en (exists, published)" $?
has 'hrefLang="x-default" href="http://localhost:3000/ha/lessons/gwajin-ilimi"'; t "x-default = original language" $?
has 'rel="canonical" href="http://localhost:3000/ha/lessons/gwajin-ilimi"'; t "canonical" $?
has 'property="og:type" content="article"'; t "OpenGraph article" $?
has 'Marubuci na gwaji'; t "author shown" $?
has 'category=fanni-na-gwaji'; t "category link" $?
has 'Imani'; t "tag shown" $?
has 'Ba a tabbatar da wannan madogara ba tukuna'; t "unverified citation labelled (Hausa)" $?
has 'Littafin gwaji'; t "citation title" $?
has 'media-public/lessons/pub%20file.mp3'; t "public audio URL, encoded" $?
has 'preload="none"'; t "audio not preloaded" $?
hasnt 'secret.mp3'; t "private audio NOT exposed" $?
hasnt 'private/pub.mp3'; t "private storage path NOT exposed" $?
has 'Niyya a ayyuka'; t "related lesson listed" $?
has 'lang="en"'; t "language switcher offers English" $?
python3 - <<'PY'
import re,json
h=open('/tmp/p.html',encoding='utf8').read()
blocks=re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,re.S)
types=[json.loads(b)['@type'] for b in blocks]
assert types==['Article','BreadcrumbList'],types
a=json.loads(blocks[0]); assert a['inLanguage']=='ha' and a['author']['name']=='Marubuci na gwaji' and 'publisher' not in a
print("jsonld ok")
PY
t "JSON-LD valid: Article + BreadcrumbList, no invented publisher" $?
grep -qi "content-security-policy" /tmp/h.txt; t "CSP header present" $?

echo "=== translation page"
code /en/lessons/knowledge-test 200; t "200 /en/lessons/knowledge-test" $?
has 'Fixture Translator'; t "translator attributed" $?
has 'This translation has been reviewed'; t "review status shown" $?
has 'Hausa'; t "original language shown" $?
has 'hrefLang="ha" href="http://localhost:3000/ha/lessons/gwajin-ilimi"'; t "reciprocal hreflang to Hausa" $?
has '<html lang="en" dir="ltr">'; t "html lang/dir en" $?

echo "=== Arabic hadith block + draft translation + video"
code /ha/lessons/niyya-a-ayyuka 200; t "200 /ha/lessons/niyya-a-ayyuka" $?
has 'data-kind="hadith"'; t "hadith block typed" $?
has 'dir="rtl"'; t "RTL on Arabic block" $?
has 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ'; t "Arabic text + diacritics intact" $?
has '>Hadisi<'; t "block labelled in Hausa" $?
hasnt 'hrefLang="en"'; t "NO hreflang for the draft English translation" $?
hasnt 'intentions-draft'; t "draft slug never leaked" $?
has 'youtube-nocookie.com/embed/dQw4w9WgXcQ'; t "video via nocookie embed" $?
has 'sandbox="allow-scripts allow-same-origin allow-presentation"'; t "iframe sandboxed" $?
has 'Fixture authority'; t "grading attributed to named authority" $?
has 'An tabbatar da madogarar'; t "verified marker (Hausa)" $?

echo "=== visibility, redirects"
code /en/lessons/intentions-draft 404; t "draft translation -> 404" $?
code /ha/lessons/nan-gaba 404; t "scheduled lesson -> 404" $?
code /ha/lessons/sirrin-daftari 404; t "draft lesson -> 404" $?
code /ha/lessons/tsohon-suna 308; t "renamed slug -> permanent redirect" $?
grep -qi "^location: /ha/lessons/gwajin-ilimi" /tmp/h.txt; t "redirect target correct" $?
code /ha/lessons/babu-wannan 404; t "unknown slug -> 404" $?
has 'Ba a sami shafin ba'; t "localized 404 body" $?

echo "=== listing, filters, pagination"
code /ha/lessons 200; t "200 /ha/lessons" $?
sed 's/<[^>]*>//g' /tmp/p.html | grep -aqE '2 +sakamako'; t "result count" $?
has 'Gwajin ilimi'; t "lists lesson 1" $?
code "/ha/lessons?category=fanni-na-gwaji" 200; has 'Niyya a ayyuka'; t "category filter" $?
has 'name="robots" content="noindex'; t "filtered page is noindex" $?
code "/ha/lessons?category=babu" 200; has 'Ba a sami komai ba'; t "unknown category -> empty state" $?
code "/ha/lessons?type=bogus&page=-3" 200; t "garbage params tolerated" $?
code "/ha/lessons?page=500" 200; t "past-the-end page is not an error" $?
has 'Gwajin ilimi'; t "past-the-end page shows the last real page" $?
has 'name="robots" content="noindex'; t "past-the-end page is noindex" $?
code "/ha/lessons?sort=old" 200; python3 -c "
h=open('/tmp/p.html',encoding='utf8').read(); assert h.index('Niyya a ayyuka')<h.index('Gwajin ilimi')"; t "oldest-first order" $?
code /ar/lessons 200; has '<html lang="ar" dir="rtl">'; t "Arabic listing is RTL" $?

echo "=== search"
code "/ha/search?q=%D8%A7%D9%84%D8%A7%D8%B9%D9%85%D8%A7%D9%84%20%D8%A8%D8%A7%D9%84%D9%86%D9%8A%D8%A7%D8%AA" 200; has 'Niyya a ayyuka'; t "Arabic query without diacritics finds the lesson" $?
has 'name="robots" content="noindex'; t "search results are noindex" $?
code "/ha/search?q=knowledge" 200; hasnt 'Knowledge test'; t "search scoped to current language" $?
code "/ha/search?q=knowledge&all=1" 200; has 'Knowledge test'; t "all-languages search" $?
code "/ha/search?q=unfinished&all=1" 200; hasnt 'Intentions'; t "draft text not searchable" $?
code "/ha/search?q=%3Cscript%3Ealert(1)%3C/script%3E" 200; hasnt '<script>alert(1)'; t "reflected query escaped" $?
code "/ha/search" 200; has 'Rubuta kalmar da kake nema'; t "empty query prompt" $?

echo "=== sitemap / robots"
curl -s $B/sitemap.xml > /tmp/p.html
has 'knowledge-test'; t "sitemap: published English translation" $?
has 'xhtml:link rel="alternate" hreflang="en"'; t "sitemap: reciprocal alternates" $?
for s in nan-gaba intentions-draft sirrin-daftari; do hasnt "$s"; t "sitemap excludes $s" $?; done
curl -s $B/robots.txt > /tmp/p.html; has 'Disallow: /admin/'; t "robots blocks admin" $?; has 'sitemap.xml'; t "robots lists sitemap" $?
echo; echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
