-- Additive migration. Existing bridge keys are read, never changed or reissued.
begin;
create or replace function public.english_resolve_site_owner(
 p_key_hash text,p_chatgpt_owner text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare answer jsonb;
begin
 if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' or
    p_chatgpt_owner is null or length(p_chatgpt_owner) not between 1 and 180 then
  raise exception 'ENGLISH_AUTH_DENIED';
 end if;
 select pg_catalog.jsonb_build_object('owner_id',k.owner_id,
  'enabled',l.enabled,'link_verified',l.link_verified) into answer
 from public.lizhi_production_ai_keys k
 join public.english_authorized_users a on a.owner_id=k.owner_id and a.enabled
 join english_internal.site_owner_links l on l.owner_id=k.owner_id
 where k.key_hash=p_key_hash and k.chatgpt_owner=p_chatgpt_owner
  and l.chatgpt_account_sha256=pg_catalog.encode(extensions.digest(p_chatgpt_owner,'sha256'),'hex')
  and l.enabled and l.link_verified and l.approved_at is not null
  and exists(select 1 from auth.identities i where i.user_id=k.owner_id and i.provider='google');
 if answer is null then raise exception 'ENGLISH_AUTH_DENIED';end if;
 return answer;
end $$;
revoke all on function public.english_resolve_site_owner(text,text) from public,anon,authenticated;
grant execute on function public.english_resolve_site_owner(text,text) to service_role;
commit;
