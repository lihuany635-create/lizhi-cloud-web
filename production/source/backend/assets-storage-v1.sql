-- Format-only migration. Preserve private access, RLS and existing bytes.
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf'] where id='lizhi-production-images' and public=false;
-- Rollback upload formats only (keep all existing objects):
-- update storage.buckets set allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='lizhi-production-images' and public=false;
