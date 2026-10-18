# Implementation progress

Legend: DONE = implemented and verified as stated | PARTIAL | TODO

## Verified so far (see "How verified")
| Area | Status | Notes |
|---|---|---|
| Project scaffold (Next 16.4, React 19, TS 5.9 strict, Tailwind 4, ESLint 9, Vitest, Playwright installed) | DONE | TypeScript 7 and ESLint 10 deliberately NOT used (ecosystem compatibility) |
| Env validation (zod), `.env.example` | DONE | |
| Supabase clients: browser, server (cookie), public (anon, cacheable), service (server-only) | DONE | |
| DB schema (25 tables), migrations 0001-0007 | DONE | applied to PostgreSQL 16; 0007 also verified as an upgrade on existing data |
| RLS on every table + least-privilege grants | DONE | 77 SQL assertions pass |
| Triggers: status transitions, publish-rights, slug-change 301 redirects, revisions, audit log, role-escalation guard | DONE | |
| Multilingual search (Hausa/Arabic/English folding) `search_lessons()` | DONE (DB) | no UI yet |
| Storage buckets/policies (private + public) | WRITTEN, UNTESTED | needs a real Supabase project (no `storage` schema in test DB) |
| i18n routing `/ha /ar /en`, RTL/LTR, hreflang + x-default, localized 404 | DONE | verified via HTTP on production build |
| Fonts self-hosted; Hausa hooked letters + Arabic diacritics glyph coverage verified | DONE | Noto Serif + Amiri |
| Admin auth: login action, server-side `requireStaff/requireAdmin`, proxy gate, logout, dashboard | PARTIAL | code builds and anonymous gate verified over HTTP; **login against a real Supabase Auth NOT yet exercised** |
| Rich-text document validator, embed allowlist, safe redirect, slug, publishing rules | DONE | adversarial unit tests |
| Home page (live DB queries, ISR 5 min) | PARTIAL | Real Postgres + PostgREST test stack and public-query integration suite added; stack execution remains unverified on this machine because Docker is unavailable |
| Public lessons list and detail, search | DONE | Locale aware pages use the anonymous Supabase client; lesson document JSON is rendered as React nodes |
| Sitemap and robots | DONE | Sitemap includes localized homes, lesson indexes and published translations only; robots blocks admin and search |

## How verified
- `npm run typecheck`, `npm run lint`, `npm test` (68 unit tests), `npm run test:db` (77 assertions, needs local Postgres 15+), `next build`.
- HTTP checks against `next start`: redirects, lang/dir, canonical, hreflang, 404 status, admin gate, security headers.
- NOT verified: real Supabase (Auth, Storage), Postgres + PostgREST integration run (Docker unavailable on this machine), browsers (Playwright not yet run), accessibility audits, Lighthouse.

## Remaining (planned order)
1. **Phase 3 - Publishing system**: lesson editor (Tiptap), autosave with `version` check, translations UI, categories/tags/sources/media admin, preview, publish/archive, revision restore, media upload + public release.
2. **Phase 4 - Public site**: categories, audio, video, books, about, richer lesson media/player support, contact (Turnstile + rate limit).
3. **Phase 5 - SEO**: JSON-LD, redirects lookup in proxy/not-found, OG images.
4. **Phase 6 - Tests/docs**: Playwright E2E, a11y checks, deployment/backup docs, final report.

## Known issues / decisions
- CSP uses `'unsafe-inline'` for scripts (Next bootstrap); move to nonces before launch.
- Hausa and Arabic interface strings are drafts and need native-speaker review.
- Publication status lives on translations only (no lesson-level status) to avoid contradictory values.
- No generated Supabase types yet; `src/types/db.ts` is hand-written.
- MFA enforcement, login rate-limiting beyond Supabase's built-in limits: TODO.
- `/` and other unprefixed paths use a 307 redirect (locale chosen by cookie/Accept-Language).
- Remaining home page links such as audio and video routes still need their public pages.
