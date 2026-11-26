# P11｜沿用「立之雲端庫」原私人 MCP Site 的英文學習擴充（候選／未部署）

> 本分支 **只做隔離開發**。正式環境不修改 Supabase、不改 Site、GitHub \`main\` 或 Pages；本次也**沒有**把使用者真實聊天紀錄存進網站或填入正式單字卡。
>
> 接續 P10 Draft PR #70；前一輪聊天資料整理候選見 PR #74（尚未合併／不可當正式後端）。

## 一、目的與唯一系統

使用者要求：ChatGPT 對談時觀察到的錯誤句子與詞彙，交由**既有**「立之英文學習教室」正式保存、在網站審核後加入單字卡。不要建立第二個 Site、網站、資料庫、外掛單字卡或取代原私人 MCP。

既有 Site /mcp 已提供 AI 工作台、Side、立剪、施工照片等工具，任何英語擴充都必須保留原始工具回應、順序、身分控制與原用戶資料。無法可靠驗證原工具集合時拒絕啟用英文工具，而不破壞原有服務。

## 二、本次已實作的候選程式

- \`site-mcp-extension.mjs\`：使用 P3 正式候選工具定義與 P7 catalog／dispatcher，以 \`english_\` 前綴擴充原 Site 的 \`tools/list\` 和 \`tools/call\`。未啟用正式入卡工具 \`english_add_vocabulary\`；未連通或未驗證 owner 時英文工具不出現。
- \`mount-existing-site.mjs\`：提供**以原 handler 為主**的 Site \`POST /mcp\` 包裝函式。英文工具以外原樣走舊 handler；發生英文故障時不會擋掉 AI 工作台、Side、立剪與照片功能。此模組沒有硬編任何站點、金鑰或 account。
- \`tests/*.test.mjs\`：虛構 34 工具盤點、工具防遺失、只讀 scope、惡意 owner 參數、正式單字不可繞過、Site→P3→合成 P6 backend 的候選／錯句原子呼叫／session 拒絕與重送、原有 POST 保留。
- \`.github/workflows/english-academy-p11-ci.yml\`：PR 隔離 Node 測試，不部署、無 Secrets、無修改正式資料庫。

## 三、未完成的正式接線（拒絕自動視為成功）

1. **真人身份綁定**：使用現有 Site 的受信任 \`identity(req, 'ai')\`，核對原 Site ChatGPT 本人識別與伺服器批准的 Supabase Google owner UUID。不可拿 Google Email、模型自填 owner、URL 參數、clientInfo 代替驗證；P10 還需驗簽 issuer、audience、client、token active/revocation、scope 交集。
2. **正式 P6 儲存**：目前正式 Supabase 沒有 \`english_*\` 表和 \`lizhi-english-academy\` Edge。必須有經資安審查的 P1/P5/P6/P7 schema、RLS、session 同意與原子 \`english_p6_ingest_batch\`，方可持久化錯句與候選卡；同樣必須有實際備份與還原方案。
3. **真的綁在原私人 Site**：\`mountEnglishOnExistingSite\` 要在現有 Site 編輯後由原 \`app/mcp/route.ts\` 代入 \`postOriginal\`、\`isReady\`、\`verifySiteOwner\`、\`invokeEnglish\` 和當時**真實**工具 baseline。這五個參數均不能由聊天模型、客戶端輸入或固定測試 fixture 冒充；此倉庫的 migration 文案不是已套用的 Site 設定。原 Site 當前包含其他功能，部署前後需比較完整工具快照與真實呼叫。
4. **網站審核正式入卡**：ChatGPT 只提議 \`english_create_card_candidates\`，而不能自行呼叫 \`add_vocabulary\`。候選卡需在**現有英文教室網頁**完成本人批准、後端單次交易消耗批准並正式建卡，才可進入 P2 FSRS-7 復習與 P4 課程。
5. **ChatGPT 工具可見性**：原 Site 的 MCP 套件須部署並經平台重新整理工具清單；目前這個對話的工具清單**沒有** \`english_*\`，因此不能聲稱已在 ChatGPT 直接呼叫英文 MCP。
6. **G01–G12 正式驗收**：真實 Google 登入、跨 owner、撤銷、原 Site 無損、真實資料歷程、A22 手機、獨立資安審查、owner schema／Edge／Site／main／Pages 分項批准全部仍為必備條件。已存在 P9 NO-GO release gate，不能因合成 CI 成功就繞過。

## 四、未來 Site 接線形式（示意，不能直接部署）

\`\`\`js
// Inside original private Site runtime after its trusted auth has been implemented.
// Use the EXISTING site route as postOriginal, do not replace or discard it.
const POST = mountEnglishOnExistingSite({
  postOriginal: existingPost,
  isReady: trustedP8GateAndBackendHealthCheck, // returns true only when real backend and owner link verified
  verifySiteOwner: trustedP7SiteGoogleLinkVerifier,
  invokeEnglish: trustedP10OwnerBoundP3P6Invoker,
  baselineNames: auditedCurrentOriginalToolNames,
});
\`\`\`

如果任一依賴不存在，英文功能必須保持關閉，原 Site 原有工具繼續工作。**不得**將 \`isReady:()=>true\` 或合成測試 actor 帶進正式部署。

## 五、測試

\`\`\`bash
node --test english-academy/p11/tests/*.test.mjs
\`\`\`

測試使用 synthetic ChatGPT owner UUID、假單字與英文句子，沒有真實對話、憑證、正式服務或請求。測試結果僅為合成資料證據，不能代表 P8-B 正式驗收 PASS。

工作台：TASK-016。Drive 專案：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm

## 六、P11-B｜網站單字卡／錯句與授權同步候選（2026-11-15 增量）

> 此增量僅**候選**。正式資料庫、Edge、Site、main、Pages 一律未修改。P8-B 真實 G01～G12 尚待完成。

- `schema/20261115_p11_web_cards_candidate.sql`：在既有 P1/P5/P6/P7 資料表及私有 consent schema 上加服務端原子 RPC：`english_web_session_active`（比對 `auth.sessions`）、`english_web_create_candidate`（手動加入待審）、`english_web_promote_candidate`（一筆交易核准、建卡、審計、去重）、`english_web_ignore_candidate`（略過但保留歷史）、`english_web_grant_chat_session`／`english_web_revoke_chat_session`（網站本人授權 24 小時來源並允許撤銷）。全部只允許 service_role RPC；不可由瀏覽器直接執行。
- `supabase-verified-web.mjs`：受信任的伺服器端 Google JWT 查驗（Auth user API + token issuer/audience/sub/expiry/session）與 Supabase Auth session 有效性、本人 allowlist、RPC/owner 限制，金鑰只取伺服器環境，不放瀏覽器或 GitHub。這是未部署程式，正式環境仍待真實登出與不同帳號測試。
- `web-card-api.mjs`：既有網站 `GET status/cards/candidates/errors/sessions`、`POST candidate/accept/ignore/authorize-session/revoke-session` 的可信簽入入口，拒絕偽造 owner/批准、重送或未授權動作。
- 既有 `supabase/functions/lizhi-english-academy/index.ts`：接入 P11 Web handler，但保留原 P10 fail-closed 作為預設；只有經個別批准的伺服器端 `ENGLISH_P11_WEB_WRITES_APPROVED=true` 才能執行寫入，不可因合併程式就誤開。
- 既有 `english-academy/live/app.mjs`：原單字中心改成「先候選→網站本人確認→正式單字卡」；新增「錯句紀錄」、設定中的 24 小時 ChatGPT 學習對話來源授權、複製代碼與撤銷。沒有後端時顯示不可用，不會假裝儲存。
- 測試：P11 Node 身分／RPC 契約、一次性 PostgreSQL17 P1→P11 真實 SQL、既有 Playwright 360px 手機及桌面瀏覽器回歸（合成資料），所有 PR CI 不含正式 deploy。

**仍未完成正式工作：** P3 MCP 可信 bearer／Site→Google owner 原生雙向連結、原私人 Site 工具清單安全快照與正式接線、真實 P1→P11 migration、正式 Edge 部署、網站切換現有靜態體驗入口、真實 Google/A22/跨裝置驗收與獨立資安複核。尤其 ChatGPT 目前仍未能在正式網站寫單字或錯句。
