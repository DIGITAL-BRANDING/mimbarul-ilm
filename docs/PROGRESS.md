# Implementation progress

Legend: DONE = implemented and verified as stated | PARTIAL | TODO

## Status
| Area | Status | Notes |
|---|---|---|
| Scaffold (Next 16.4, React 19, TS 5.9 strict, Tailwind 4, ESLint 9, Vitest, Playwright installed) | DONE | TypeScript 7 / ESLint 10 deliberately not used (ecosystem compatibility) |
| Env validation, Supabase clients (browser / server / anon-public / service) | DONE | |
| DB schema + RLS + triggers, migrations 0001-0007 | DONE | 77 SQL assertions; 0007 verified as an upgrade on existing data |
| Multilingual search `search_lessons()` (Hausa/Arabic/English folding) | DONE | verified through PostgREST, incl. Arabic without diacritics |
| i18n routing `/ha /ar /en`, RTL/LTR, localized 404, hreflang + x-default | DONE | verified over HTTP |
| Admin auth (login action, server-side guards, proxy gate, dashboard) | PARTIAL | anonymous gate verified; **login against real Supabase Auth NOT exercised** |
| Rich-text validator, embed allowlist, safe redirect, slug, publishing rules | DONE | adversarial unit tests |
| **Lessons list**: search box, category + type filters, sort, pagination with total, empty/loading states | DONE | URL-driven; filtered pages `noindex`; out-of-range page shows last page (`noindex`) |
| **Lesson page**: citations (grading + authority + verified), RTL Arabic blocks, translation notice, categories/tags, audio/video, related, share, print, breadcrumbs | DONE | verified over HTTP on a production build |
| **Search page** (current language / all languages) | DONE | |
| **Slug-change redirects** (permanent redirect from the old URL) | DONE | DB trigger records them; page serves them |
| **SEO on lesson page**: canonical, OpenGraph, Article + BreadcrumbList JSON-LD, hreflang only for public translations | DONE | no invented publisher/ratings |
| **Sitemap** (reciprocal alternates, published only) + robots | DONE | excludes drafts and scheduled items |
| Home page | DONE | |
| Storage buckets/policies | WRITTEN, UNTESTED | needs a real Supabase project |
| Audio / video / books / about / contact / category pages | TODO | `audio`, `videos`, `books`, `about`, `contact`, `categories/*` still 404 |
| Lesson editor, admin CRUD, media upload, revisions UI | TODO | Phase 3 |
| Playwright E2E, accessibility audit, Lighthouse | TODO | |

## How verified (and what was NOT)
- `npm run typecheck`, `npm run lint`, `npm test` (**102 unit tests**), `npm run test:db` (**77 SQL assertions**, local PostgreSQL 15+).
- **Stack integration (24 tests)**: the app's real Supabase client against PostgreSQL + PostgREST under the real `anon` role and RLS
  (`npm run test:stack` with Docker; during development it was executed with native PostgreSQL 16 + PostgREST 13.0.4 + nginx 1.24).
- **HTTP checks (69)** against `next build && next start` connected to that stack: `bash tests/integration/http-checks.sh`.
- NOT verified: real Supabase (Auth, Storage, hosted PostgREST), the Docker Compose file itself (Docker was unavailable; it pins
  PostgREST 12.2.12 while development used 13.0.4), browsers/Playwright, accessibility audits, Lighthouse, load.

## Findings fixed during review (kept here so they are not reintroduced)
1. `npm run test:stack` could not work: `vitest.config.mts` only includes `tests/unit`, and the Supabase client calls `/rest/v1/*`, which a bare PostgREST does not serve. Added `vitest.integration.config.mts` and an nginx gateway to the compose stack.
2. **Soft 404s**: a `loading.tsx` at `lessons/` wrapped the lesson page in Suspense, so `notFound()`/`permanentRedirect()` ran after streaming started and returned HTTP 200. `loading.tsx` now lives in the `(index)` route group and covers only the listing.
3. `notFound()` from a page rendered a bare error shell because the root layout called `notFound()` itself. The layout now falls back to the default locale.
4. Past-the-end pages: PostgREST answers HTTP 416 (and some versions send a truncated error body). Detected by status code, never by body.
5. Citations previously printed the raw grade code (e.g. `unverified`) in English for every language; now localized, attributed to the named authority, and explicitly labelled verified/unverified.

## Known issues / decisions
- CSP uses `'unsafe-inline'` for scripts (Next bootstrap); move to nonces before launch.
- Hausa and Arabic interface strings are drafts and need native-speaker review.
- Publication status lives on translations only (no lesson-level status).
- No generated Supabase types; `src/types/db.ts` and `src/lib/data/*.ts` row types are hand-written (`supabase gen types` once a project is linked).
- MFA enforcement and login rate limiting beyond Supabase's built-in limits: TODO.
- `/` and unprefixed paths use a 307 locale redirect.
- Out-of-range list pages return 200 + `noindex` (not a redirect) because that route streams behind `loading.tsx`.
- Lesson pages are ISR (5 min). A scheduled lesson appears within that window of its publish time.
