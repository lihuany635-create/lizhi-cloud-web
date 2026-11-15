# 立之英文學習教室｜P9 上線前維運與回復準備（未部署）

> 工作台 TASK-010。**P9-A 是隔離開發／演練；P9-B 真實發布、實際監控及真實回復未獲本人批准。**
> 本專案正式整合目標仍是既有「立之雲端庫」，不可另建平行正式 Site 或重新配置第二套工作台。

## 來源與版本

- P8 Draft PR #67 -> P9 \`feature/english-academy-p9-operations-20261115\`，GitHub 主倉庫 \`lihuany635-create/lizhi-cloud-web\`
- P8 TASK-009 8/11 工作台項目完成、正式 G01～G12 **0/12**，Google OAuth、Supabase、ChatGPT MCP、A22 實機、獨立安全與正式資料復原都仍需真實驗收
- 正式員工手冊 v1.1、全功能路徑總索引 v1.2、工作台操作手冊 v2.1；正式變更必須本人事前分項批准

## P9-A 可先完成的模組

1. \`release-readiness.mjs\`：檢查 pinned commit、七項發布準備與五項分別核准的操作範圍（Supabase schema、Edge、私人 Site、main、Pages）。任何使用者、工作台或 CI 自填的旗標都只能影響『準備程度』，程式永不提供 deployment/merge 動作。
2. \`health-monitor.mjs\`：以**合成事件**評估 5 分鐘內的登入拒絕、Edge 5xx、MCP 同步錯誤、批准繞過、跨帳號資料洩漏、既有 MCP 工具遺失、FSRS 寫入錯誤等閾值；僅輸出類別／數量／時間桶，不保存真實英文對話、個人身分、Email、Access Token 或錯誤原文。**沒有連接正式遙測、通知或持續排程**。
3. \`incident-rollback.mjs\`：事故 SEV1～SEV3 狀態轉移與不可覆寫歷史。出問題時優先停英語寫入、關閉新英語入口、停用 \`english_*\` MCP 而保留舊工具、回復上一個核准 Edge 版、檢查原工作台/照片服務與資料；此模組只產生操作計畫和模擬結果，絕不真正停用或更新現有服務。
4. \`scripts/run-rehearsal.mjs\`：演練合成『跨帳號隔離警報』、故意注入『MCP namespace 停用步驟失敗』。預期 rehearsal 結果為 \`SIMULATED_FAILURE\`，證明流程能在失敗時回報，而不是把錯誤掩成 PASS。
5. P9 CI：Node.js 24 自動契約測試及合成演練。P8 CI 因 \`english-academy/**\` 變更會獨立重跑 P0～P8 單元／Chromium 手機及桌面／臨時 PostgreSQL 17／Deno 編譯。所有工作流程 \`permissions: contents: read\`、無部署動作。

## 上線前手動驗收與實際操作順序

### Stage 0：安全與範圍
- 先完成 P8 G01～G12 真正、獨立且可核驗的全部正式證據，審查被發現的高風險缺陷；缺一項就不進行正式寫入。
- 確認版本一致（候選完整 SHA、正式 Edge 及私人 Site 的版本）、資料庫備份／撤回流程、實機 A22 及真實 ChatGPT MCP 工具清單。
- 建立事故通知窗口與維運負責人；確認費用和資料保存／刪除政策。未取得明確批准前不使用私人資料執行測試。

### Stage 1：取得本人分項核准
每一項獨立送審：① Supabase schema/RLS；② Supabase Edge/Secrets；③ 現有私人 Site 新增 English MCP namespace；④ GitHub \`main\` 合併；⑤ GitHub Pages 上線；⑥ 費用（如有）；⑦ 任何涉及正式資料刪除／回復（如必要）。核准必須包含版本 SHA、目的與允許的操作範圍。**僅說「P9」不代表授權上線**。

### Stage 2：逐項受控部署（待核准的操作手冊）
- 先完成正式環境快照／備份與獨立安全核對，再依核准的 schema/Edge 方案佈署最小權限；
- 核對本人 Google 與 ChatGPT 透過已核驗的雙向 owner link，正式卡必須先被本人可信批准再同交易入庫；
- 保留 Site 的全部工作台、照片、Side、立剪工具與身份驗證，\`english_*\` 只能**追加**而不能覆蓋；
- 在完成正式負向測試和 A22 實機／MCP 端到端後，取得本人對 \`main\` 及 Pages 的獨立批准，才可開啟正式入口。

### Stage 3：上線觀察（尚未啟用）
建議每 5 分鐘觀察錯誤率與安全事件，初期優先人工查核：登入成功／未授權拒絕、Edge 5xx、同步佇列、FSRS 寫入、候選卡審核交易、跨帳號隔離與原有 MCP 工具完整性。**這是提案，沒有排定真正監控任務或通知**。任何警報都不能把單字／錯句／Token 當作明文送出。

| 指標 | 候選觸發條件（需正式調整與驗收） | 處理 |
| --- | --- | --- |
| \`cross_owner_violation\`／\`consent_bypass_attempt\` | 5 分鐘 1 次 | SEV1，停止英語寫入，確認登入與 RLS；本人授權後回復 |
| \`legacy_mcp_regression\` | 5 分鐘 1 次 | SEV1，優先還原舊工具完整性 |
| \`edge_5xx\` | 5 分鐘 5 次 | SEV1/SEV2 查根因；若影響資料寫入則停止新英語流量 |
| \`auth_denied\` | 5 分鐘 12 次 | SEV2/SEV3，檢查暴力登入／OAuth 更新 |
| \`sync_failure\` | 5 分鐘 5 次 | SEV2，核對 requestId 重送／去重 |
| \`fsrs_persistence_error\` | 5 分鐘 3 次 | SEV2，暫停不安全複習寫入 |

### Stage 4：故障時的撤回程序
先 **記錄事故及證據 → 評級 → 保護既有系統**；不要為救英語功能而改壞 AI 工作台、照片或圖書館。由有權限的人員在本人核准下停英語新寫入，再停新入口與 English MCP namespace；必要時將 Edge/Pages/Site 切回事前確認可用的版本，逐項驗證舊服務未受影響。資料庫 migration 若需 rollback，先評估資料保留，**不得擅自 DROP、DELETE 或復寫正式資料**。記錄實際處理、恢復、事後檢討與防再發。

## 安全與驗收狀態

- **已可驗**：隔離演練、發布閘門、告警分類與遮罩、失敗注入、P0～P8 合成回歸（結果以該 PR 最新 CI log 為準）。
- **未連線**：正式雲端遙測、真實通知／排程、雲端庫正式入口、真實 Google OAuth、正式 Supabase RLS／Edge、ChatGPT MCP 真實 tools/list/call、正式 A22 Android、正式備份回復。
- **待獨立審查**：安全審查簽章、資料保存與金鑰策略、發布故障的回退權限、所有 G01～G12。
- **未執行／禁止擅自執行**：main merge、Pages deploy、Site route 更新、正式資料 mutation、任何未批准付費服務。

## 交接
Google Drive 專案：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm

P8 驗收紀錄：https://docs.google.com/document/d/1BJvKLWwzPRVXB77dCZ_PV_nmUMFuNazEMQpSjZxV21Y/edit

P5 G01～G12 矩陣：https://docs.google.com/document/d/1jyTf8jA6Rp9mzFEPBiEHe0eRDjuwUcGSH4YhO18n1Lc/edit

候選結論：**P9-A 隔離維運準備 ≠ P9-B 正式上線與持續監控。**
