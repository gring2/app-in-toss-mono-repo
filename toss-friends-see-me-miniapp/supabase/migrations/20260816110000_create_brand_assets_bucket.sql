insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'friend-lens-brand',
  'friend-lens-brand',
  true,
  5242880,
  array['image/png']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read friend lens brand assets" on storage.objects;
create policy "public can read friend lens brand assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'friend-lens-brand');

drop policy if exists "bootstrap friend lens brand assets" on storage.objects;
create policy "bootstrap friend lens brand assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'friend-lens-brand'
    and name in ('friend-lens-icon.png', 'friend-lens-thumbnail.png')
  );
