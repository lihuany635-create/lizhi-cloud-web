-- Synthetic fixtures only; never apply this file to production.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public.lizhi_production_ai_keys(key_hash text primary key,owner_id uuid,chatgpt_owner text);
create table auth.identities(user_id uuid,provider text);
insert into public.lizhi_production_ai_keys values
 (repeat('a',64),'11111111-1111-4111-8111-111111111111','synthetic-site-owner');
insert into auth.identities values ('11111111-1111-4111-8111-111111111111','google');
insert into english_internal.site_owner_links(owner_id,chatgpt_account_sha256,link_verified,enabled,approved_at)
 values('11111111-1111-4111-8111-111111111111',encode(extensions.digest('synthetic-site-owner','sha256'),'hex'),true,true,now());
