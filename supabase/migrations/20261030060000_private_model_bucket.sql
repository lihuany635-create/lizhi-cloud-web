-- Private storage for 3D models, previews and model manifests.
-- Read: only the allowlisted owner account (lizhi_web_is_allowed), via the website session.
-- Write: no client policy; only the service role (import/deploy tooling) can write.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lizhi-models', 'lizhi-models', false, 41943040)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists lizhi_models_owner_read on storage.objects;
create policy lizhi_models_owner_read on storage.objects
  for select to authenticated
  using (bucket_id = 'lizhi-models' and public.lizhi_web_is_allowed());
