-- 立之圖書館 v2：重點筆記、相關書、內文搜尋。
alter table public.lizhi_library_items
  add column if not exists key_points text[] not null default '{}',
  add column if not exists related_ids uuid[] not null default '{}';

-- 內文搜尋：回傳符合的書與命中處前後的片段（依登入者的權限執行，只看得到自己的書）
create or replace function public.lizhi_library_search(q text)
returns table (id uuid, snippet text)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select lower(btrim(q)) as t,
           '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select i.id,
         substring(i.text_excerpt
                   from greatest(1, strpos(lower(i.text_excerpt), term.t) - 40)
                   for 140) as snippet
  from public.lizhi_library_items i, term
  where char_length(term.t) between 1 and 100
    and i.deleted_at is null
    and i.text_excerpt ilike term.pattern
  order by i.created_at desc
  limit 50;
$$;

revoke all on function public.lizhi_library_search(text) from public, anon;
grant execute on function public.lizhi_library_search(text) to authenticated;
