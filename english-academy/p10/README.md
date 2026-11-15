# P10｜候選整合與安全修復：交接手冊（P10-A / P10-B）

> **正式 NO-GO｜不部署｜不合併 main｜不得修改正式 Supabase 或私人 MCP Site。**
> 此 PR 是 P1～P9 候選版的**整合分支**，不是第十套獨立網站，也不是在正式立之雲端庫加開新 Site。P8-B 的 G01～G12 真實驗收仍是 0/12。

## 1. P10-A：單一版本與相依鏈

- 從 P9 的既有隔離分支 \`feature/english-academy-p9-release-readiness-20261115\` 延伸；本分支沒有 merge 任何 PR 到 \`main\`。
- \`upstream-lock.json\` 保存 P1～P9 九個依序相依的 Draft PR #60～#67、#69 之**各分支名稱、Head SHA 與 parent ref**，以及唯讀時觀察的正式 main SHA。P0 架構併於 P1，不另建立假 P0 PR。
- CI 使用 \`git cat-file\` 和 \`git merge-base --is-ancestor\` 證明被鎖定的九個 SHA 皆存在於 P10 工作分支的歷史中，且每階段以前一階段候選版為 parent；若曾被 force-push 或版本斷裂須重新核對，不得拿舊的 PASS 當新 commit 證據。
- P8 的 G01～G12 與 P9 NO-GO 規則保留；\`upstream-lock.json\` 明定 0/12 真實驗收，無正式改動權限。

## 2. P10-B：本次自查發現並修正的高風險缺口

### FIX-CANDIDATE-001：P3 / P7 / P6 本人 owner 欄位不一致
- **根因**：P7 Site 經確認的身份物件使用 \`ownerId\`；P3 MCP handler 的後端調用一律使用 \`actor.userId\`；P6 持久化後端使用 \`ownerId\`。直接接線時可能將 \`undefined\` 傳進資料層，或有人誤用 ChatGPT 帳號文字取代 Supabase owner UUID。
- **修復**：\`owner-contract.mjs\` 實作一個**受信任的轉接器**，只有兩個互不依賴的伺服器端驗證器都認可相同 \`ownerId\`、相同 ChatGPT 本人帳號、Issuer、Audience、Client ID、token 啟用狀態後，才能將 UUID 明確映射成 P3 的 \`userId\`；Scopes 取兩者的最小交集，暫不包含正式寫入。
- **測試**：持續對 P3 \`createMcpHandler\` 呼叫 \`tools/list\`、\`tools/call\`，並以 P6 交易 RPC 假資料驗證相同 owner 傳入；偽造 request JSON 的 owner、Site-to-OAuth 跨帳號、失效 Token/Client/Issuer/Scopes 都拒絕。
- **限制**：真實 OAuth introspection 與 Site 原生身分驗證仍未設置。此程式**不是**足以直接供正式 ChatGPT 使用的完整 OAuth 服務；獨立資安複核仍需驗證每個 trusted callback 實際如何驗簽、撤銷與限流。

### FIX-CANDIDATE-002：P1 候選寫入與稽核不在同一個交易
- **根因**：P1 \`POST /candidate\` 先新增候選，再另外 POST 稽核表，若後者失敗會留下不完整的寫入結果。P1 \`POST /card\`、\`/accept\`、\`/ignore\` 曾依賴直接 API 或前端 \`userConfirmed\`，其正式授權不夠完整。P7 草稿已擋正式卡三條路由，但仍允許直接新增候選。
- **修復**：P10 \`fail-closed-edge.mjs\` **擋住四條直接寫入路由**（candidate/card/accept/ignore），只允許經 P1 驗證器的 GET 查詢與 OPTIONS。已將此包裝器接在**未部署的** \`supabase/functions/lizhi-english-academy/index.ts\`，不變更 P1 舊測試契約和正式主站。
- **測試**：四種未經原子化驗證的寫入在到達舊 handler 前全部 HTTP 403；讀取路由仍傳到原 handler；不允許的 Origin、未列出的 HTTP method/action 不會繞過。
- **限制／重要提醒**：這個防護會使候選網站的**新增候選／正式卡功能暫時無法使用**，並非完整產品功能已接通。正式串接須先將 P6 原子同步、P7 可信核准存取改成真正 server-side service，實測使用者身分／同意與審計後才能逐步解除 guard。不允許以展示模式冒稱網站正式可用。

## 3. 仍未修復／正式高風險阻礙（OPEN）

1. **OAuth 與 Session**：P7 Site-to-owner link 只有合成身份契約，沒有正式 ChatGPT Site 原生 identity、有效的 OAuth 授權端 / RFC9728 metadata、Google 登入的雙向 Link 與撤銷。
2. **正式授權後端**：P6 的 PostgreSQL RPC 只在一次性合成 PG17 測試，尚未在經核准 Supabase 環境部署。P7 的一次性批准 schema 沒有對應的正式 UI 與後端批准核發 API。
3. **資料庫權限與安全**：正式 Supabase 尚無已核准 English schema/Edge；\`SECURITY DEFINER\`、Service Role/RLS、SQL schema/search_path、重送與交易鎖仍需**不同執行者**獨立審查及實際負向測試。
4. **既有 Site 相容**：P7 目錄合併器未接入原私人 \`/mcp\` route，尚無對原工作台、照片、Side、立剪全部工具的**真實最新** \`tools/list\` snapshot，不能認定 Site 不受影響。
5. **實機與品質**：A22 Android 真機、口說/聽力可靠度、P2 FSRS 跨日跨裝置、P4 真實適性課程及 Google OAuth/ChatGPT MCP 實際工具調用仍未驗收。
6. **資料保留與成本**：ChatGPT 對話片段的保留／撤銷、敏感句子匿名化、Rate Limit、備份可回復、是否增加外部費用都要先確認；不得以合成 CI 替代。
7. **正式發布權限**：P8-B G01～G12 仍沒有正式 PASS；沒有獨立安全報告、本人授權的環境與 schema／Edge／Site／main／Pages 分項批准。P9 發布檢查必須保持 NO-GO。

## 4. P10 介面串接（候選契約）

\`\`\`
現有立之雲端庫（未改 main）
  └─ 本人 Google OAuth（真實後端驗證待接）
      └─ 已授權 Supabase owner UUID（正式 allowlist/RLS 待驗）
現有私人 ChatGPT Site /mcp（未修改正式 Site）
  └─ 真實 Site 本人身份驗證（待接）
      └─ P7 verifiedSiteOwner(ownerId, chatgptAccountId)
          + 已驗 issuer/audience/client/token（待接）
              └─ P10 verifiedP3Actor(userId=ownerId, leastPrivilegeScopes)
                  └─ P3 MCP tools/list/tools/call
                      └─ P6 trustedDb RPC (ownerId, approved sourceSessionId)
                          └─ 正式 Supabase English schema（待部署及審查）
\`\`\`

- 模型提供的 \`ownerId\`、\`userConfirmed\`、\`email\`、\`clientInfo\`、\`Origin\` 不授權。
- 正式新增單字要有另外的、經 server 驗證並原子消耗之一次性批准；本分支全部 fail-closed。
- 所有既有 MCP 工具的名稱及呼叫功能必須保留，未驗證不得覆蓋原私人 Site。
- 不以本候選編寫新的 ChatGPT Site、新資料庫或第二套工作台。

## 5. 自測、回復與下一步

\`\`\`bash
node --test english-academy/p10/tests/integration-security.test.mjs
\`\`\`

GitHub \`.github/workflows/english-academy-p10-ci.yml\` 驗證 P10 修正、P9 NO-GO 安全、自動檢查 P1～P9 順序與 ancestor SHA、Edge Deno 編譯；P8 全階段 CI 依 \`english-academy/**\` 變更會另行觸發，包含單元、Chromium、PG17 合成備份還原。全部使用合成資料，不涉及正式 Secrets。

**P10-C（待批准）**：先完成獨立資安複核與正式測試環境批准，然後準備受控 Google/Supabase/正式 MCP 對接。P10-D：P8-B G01～G12 真實端到端驗收。P10-E：經本人逐項批准後才交由 P9-B 正式部署與上線監控。

若安全審查發現新的阻斷問題，優先留存在 AI 工作台與 Drive 報告，不要併入正式 \`main\`；不自動關閉正式服務或刪除私人資料。

- P10 工作台：TASK-012
- P9 Draft PR #69：https://github.com/lihuany635-create/lizhi-cloud-web/pull/69
- P8 12 Gate 原矩陣：https://docs.google.com/document/d/1jyTf8jA6Rp9mzFEPBiEHe0eRDjuwUcGSH4YhO18n1Lc/edit
- Drive：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
