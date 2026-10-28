-- 理財表補上單一使用者白名單（與其他 lizhi_* 表一致）。
-- 005/006 原本只檢查 user_id = auth.uid()，任何能登入的帳號都可寫入自己的列。
-- 以 RESTRICTIVE policy 疊加，不改動既有 own policies；擁有者行為不變。
-- Edge Function 以 service role 讀取（已用驗證過的 uid 過濾），不受影響。
-- 回退：drop policy "finance_records_allowlist" / "finance_rule_memories_allowlist"。

begin;

drop policy if exists "finance_records_allowlist" on public.lizhi_finance_records;
create policy "finance_records_allowlist" on public.lizhi_finance_records
  as restrictive for all to authenticated
  using (public.lizhi_web_is_allowed())
  with check (public.lizhi_web_is_allowed());

drop policy if exists "finance_rule_memories_allowlist" on public.lizhi_finance_rule_memories;
create policy "finance_rule_memories_allowlist" on public.lizhi_finance_rule_memories
  as restrictive for all to authenticated
  using (public.lizhi_web_is_allowed())
  with check (public.lizhi_web_is_allowed());

commit;
