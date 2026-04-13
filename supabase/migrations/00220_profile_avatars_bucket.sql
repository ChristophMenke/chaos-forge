-- ═══════════════════════════════════════════════════════════════════════════════
-- Epic 20: Profile-Avatar Storage Bucket (getrennt von Character-Avataren)
-- ═══════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

create policy "Profile avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'profile-avatars');

create policy "Users can upload their own profile avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own profile avatar"
  on storage.objects for update
  using (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own profile avatar"
  on storage.objects for delete
  using (
    bucket_id = 'profile-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
