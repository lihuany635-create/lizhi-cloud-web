# 立之 AI 多代理協作迴圈｜零新增費用防護 v1.3

日期：2026-10-28（Asia/Taipei）。原工作台專案：`61b88bec-9b3e-49e6-8780-d073fc816516`。原 GitHub：`lihuany635-create/lizhi-cloud-web`，Draft PR #43。

**狀態：離線成本驗證器與測試完成；不是雲端帳單保證、授權完成或部署許可。** 零新增費用是本專案開發的**硬性目標**，任何既有帳戶的真實費用／剩餘額度需由服務端或帳單實際查核，不能由程式假定。

## 本次實作

- `experimental/ai-loop/zero-cost-guard.mjs`：`ZeroNewSpendPreflight`；無網路、無 SDK、無密鑰、無發行 token、無部署功能；只做入場前審核，不執行 MCP／外部操作。
- `experimental/ai-loop/zero-cost-guard.test.mjs`：18 項 Node `node:test` 離線測試；已本地合併舊 146 項測試，**164/164 PASS、0 FAIL**。
- 現有證據 CLI 在本地實測可以自動包含 18 項：`acceptance-evidence.mjs` 結果 SANDBOX_PASS/164/164、`auth-evidence.mjs` 結果 `LOCAL_MOCK_PREFLIGHT_PASS`，`liveOwnerAuthorization=NOT_TESTED`。

## 成本防護規則

1. **預設不執行**：僅 `MANUAL`、`L0` 入場；即使判定符合免費條件，回傳的 `executionAuthorized=false`、`networkCallAuthorized=false`、`authorApproved=false`，不能用此結果啟動程式。
2. **直接拒絕**：任何新付費 API、外部 AI 模型、訂閱升級、啟用 cron、部署、生成 Secret、業務寫入、L1–L3、AUTO 模式與跨專案要求。
3. **允許離線判讀**：`local_sandbox_test` 可離線產生 `LOCAL_SANDBOX_ONLY` 提案，不取得外部權限。
4. **條件式遠端判讀**：`github_public_standard_ci` 和 `existing_workbench_readonly` 需提供可信伺服器取得的帳號計量證明：方案核實、額度、已用量、成本估算、無超額計費、最近五分鐘內更新、目標專案一致。缺資料或快達上限就拒絕；GitHub 還需公開 Repo、標準 runner、無大型 runner 或可計費 artifact storage；工作台需核實本人與唯讀能力。
5. **不可偽造證明**：忽略呼叫者傳入的 `ownerApproved`、`authenticated`、`usage`、`freeTier` 等旗標；只有受信任宿主注入 `getTrustedUsage` 才能提供計量資料。**目前這項宿主尚未實作**，CI 中一律是 mock 證明。
6. **警示限制**：此模組無法保證各雲端平台真正不收費；只要帳單控制沒有在雲端服務商端限制，或另一個程序直接略過防護器，仍可能產生費用。正式系統必須另做帳號方案與 billing hard cap 查驗。

## 2026-10-28 官方費率參考（非使用者帳號帳單）

- GitHub Actions：公開儲存庫的標準 GitHub-hosted runner 通常免費，但大型 runner/特定儲存可能計費。`https://docs.github.com/en/actions/concepts/billing-and-usage`
- Supabase Free：有免費方案（含一定 Edge、DB、Storage、流量配額）；用量達上限及休眠機制需以實際帳號核對。`https://supabase.com/pricing`
- Cloudflare Workers Free：有每日 requests、每次 CPU time 與 cron 限制；是事件式執行器而非無限時長的常駐 Worker。`https://developers.cloudflare.com/workers/platform/limits/`

這些資料**不代表已確認本人帳號的方案與剩餘量**。若帳號為其他方案、PR 改成 private、使用高級 Runner、開啟其他付費功能，需重新核價。

## 驗收與後續

離線測試 18 項包含正常免費判讀、OFF/AUTO 拒絕、L1-L3、付費/新增服務/部署/寫入拒絕、來源偽造、過期或超額計量、非公開 Repo 和大型 Runner 拒絕、跨專案、敏感錯誤安全。只可記錄 **sandbox-only PASS**。

下一個真實里程碑不是增加更多模擬角色，而是在本人**另行明確核准**的宿主上，把已認證且限 project + 三唯讀工具的 server grant、真實計量讀回與撤權串成一次性 `MANUAL` L0 E2E。此前：AUTO OFF、PR Draft、不合併 `main`、不開新雲端服務、不修改正式資料、不使用付費模型 API。
