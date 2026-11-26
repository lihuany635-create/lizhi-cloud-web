-- Synthetic fixtures only; never apply this file to production.
set role anon;
do $$begin
 if has_function_privilege(current_user,'public.english_resolve_site_owner(text,text)','EXECUTE') then raise exception 'ANON_RELAY_ACCESS';end if;
end $$;
reset role;
set role authenticated;
do $$begin
 if has_function_privilege(current_user,'public.english_resolve_site_owner(text,text)','EXECUTE') then raise exception 'AUTHENTICATED_RELAY_ACCESS';end if;
end $$;
reset role;
set role service_role;
do $$declare r jsonb;begin
 r=public.english_resolve_site_owner(repeat('a',64),'synthetic-site-owner');
 if r->>'owner_id'<>'11111111-1111-4111-8111-111111111111' then raise exception 'WRONG_OWNER';end if;
 begin
  perform public.english_resolve_site_owner(repeat('a',64),'other-account');
  raise exception 'CROSS_ACCOUNT_ALLOWED';
 exception when raise_exception then
  if sqlerrm<>'ENGLISH_AUTH_DENIED' then raise;end if;
 end;
 begin
  perform public.english_resolve_site_owner(repeat('b',64),'synthetic-site-owner');
  raise exception 'INVALID_KEY_ALLOWED';
 exception when raise_exception then
  if sqlerrm<>'ENGLISH_AUTH_DENIED' then raise;end if;
 end;
end $$;
reset role;
update english_internal.site_owner_links set enabled=false;
set role service_role;
do $$begin
 begin
  perform public.english_resolve_site_owner(repeat('a',64),'synthetic-site-owner');
  raise exception 'REVOKED_LINK_ALLOWED';
 exception when raise_exception then
  if sqlerrm<>'ENGLISH_AUTH_DENIED' then raise;end if;
 end;
end $$;
reset role;
