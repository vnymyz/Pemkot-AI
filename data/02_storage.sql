-- Private storage buckets. Run after 01_schema.sql. Safe to run again.
-- No storage policies are created on purpose: browsers cannot read or write
-- these buckets directly. The server uses the secret key and hands out
-- short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vendor-documents', 'vendor-documents', false, 10485760,
   array['application/pdf', 'image/png', 'image/jpeg']),
  ('generated-files', 'generated-files', false, 20971520,
   array[
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
   ])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
