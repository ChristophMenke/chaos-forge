-- Add image_url and image_generated_at to sessions for AI-generated mood images
alter table public.sessions add column image_url text;
alter table public.sessions add column image_generated_at timestamptz;

-- Create session-images storage bucket (public, like monster-images)
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload session images
create policy "Authenticated users can upload session images"
on storage.objects for insert to authenticated
with check (bucket_id = 'session-images');

-- Allow public read access
create policy "Public read access for session images"
on storage.objects for select to public
using (bucket_id = 'session-images');

-- Allow authenticated users to update (overwrite) session images
create policy "Authenticated users can update session images"
on storage.objects for update to authenticated
using (bucket_id = 'session-images');
