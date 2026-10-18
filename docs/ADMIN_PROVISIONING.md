# Provisioning the first administrator

Public sign-up must be **disabled** (Supabase Dashboard > Authentication > Providers > Email > turn off "Allow new users to sign up").
There is no registration page in the app; staff accounts are created deliberately.

1. Supabase Dashboard > Authentication > Users > **Add user**. Enter the administrator's email and a strong, unique password
   (generate it with a password manager; never commit or paste it into chat). Tick "Auto Confirm".
2. Copy the new user's UUID, then run in **SQL Editor** (this runs with no `auth.uid()`, which is the only path allowed to create an admin):
   ```sql
   insert into public.profiles (id, role, display_name)
   values ('<USER-UUID>', 'admin', 'Display Name');
   ```
3. Sign in at `/admin/login`. An authenticated user WITHOUT a `profiles` row is refused.
4. Enable MFA (TOTP) for the administrator in Supabase Auth settings. (App-level MFA enforcement: not yet implemented, see PROGRESS.md.)

Editors: same steps with `role = 'editor'`. Editors can draft and edit but cannot publish, unpublish or edit published content.
