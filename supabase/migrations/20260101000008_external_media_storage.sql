-- External media storage: keep large files out of Supabase Storage.
-- Supabase stores the media record, attachment relationships and RLS only.

alter table public.media_assets
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists processing_status text not null default 'ready';

alter table public.media_assets
  drop constraint if exists media_assets_external_provider_check;

alter table public.media_assets
  add constraint media_assets_external_provider_check
  check (external_provider in ('youtube', 'vimeo', 'cloudflare_stream'));

alter table public.media_assets
  add constraint media_assets_storage_provider_check
  check (storage_provider in ('supabase', 'cloudflare_r2'));

alter table public.media_assets
  add constraint media_assets_processing_status_check
  check (processing_status in ('pending', 'ready', 'failed'));

comment on column public.media_assets.storage_provider is
  'Where storage_path/public_path live. Supabase is legacy; cloudflare_r2 is used for large audio/files.';
comment on column public.media_assets.external_provider is
  'External playback provider. cloudflare_stream stores the Stream video UID in external_id.';
