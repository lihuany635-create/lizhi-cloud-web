-- Canonical JSON remains the source of truth; no image copy or data migration.
create or replace function public.lizhi_production_image_index_v1(p_owner uuid, p_project uuid, p_ids uuid[])
returns table(revision bigint, images jsonb)
language sql stable security invoker set search_path = ''
as $$
 select s.revision, coalesce((
   select jsonb_agg(i.value) from jsonb_array_elements(coalesce(p.value->'images','[]'::jsonb)) i
   where i.value->>'id' = any(select x::text from unnest(p_ids) x)
 ), '[]'::jsonb)
 from public.lizhi_production_state s
 cross join lateral jsonb_array_elements(coalesce(s.data->'portfolio','[]'::jsonb)) p
 where s.owner_id = p_owner and p.value->>'id' = p_project::text
   and cardinality(p_ids) between 1 and 50
   and not exists (select 1 from jsonb_array_elements(coalesce(s.data->'trash','[]'::jsonb)) t
     where t.value->>'kind'='project' and t.value->>'projectId'=p_project::text)
$$;
revoke all on function public.lizhi_production_image_index_v1(uuid,uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.lizhi_production_image_index_v1(uuid,uuid,uuid[]) to service_role;
-- Rollback after restoring the previous Edge: drop function public.lizhi_production_image_index_v1(uuid,uuid,uuid[]);
