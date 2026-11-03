-- LiCut private video inbox. Candidate only; do not apply before explicit deployment approval.
-- Bytes are never public; only the existing owner-scoped Edge (service role) may issue short-lived signed URLs.
-- No object INSERT/SELECT/UPDATE/DELETE policies are granted to browser or third-party OAuth clients.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lizhi-licut-inbox', 'lizhi-licut-inbox', false, 52428800,
        array['video/mp4','video/webm','video/quicktime']::text[])
on conflict (id) do nothing;

-- Defense-in-depth: if this bucket already exists, ensure it stays private and constrained.
update storage.buckets
set public = false, file_size_limit = 52428800,
    allowed_mime_types = array['video/mp4','video/webm','video/quicktime']::text[]
where id = 'lizhi-licut-inbox';
