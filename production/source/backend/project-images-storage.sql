-- Private project image objects. Access only via lizhi-production after owner/project checks.
-- No public bucket and no anon/authenticated object policy is added.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('lizhi-production-images','lizhi-production-images',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
