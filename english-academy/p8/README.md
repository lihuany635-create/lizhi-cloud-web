# P8｜立之英文學習教室：隔離集中驗收與正式驗收交接

> **P8-A = 可先進行的隔離測試；P8-B = 正式環境真實驗收，尚未獲批准。**
> 此分支未部署、未合併 \`main\`，未更新正式 Supabase、ChatGPT Site 或正式雲端庫。不要把 Chromium 模擬手機、臨時 PostgreSQL 或合成 OAuth token 當成正式驗收。

## 接手基線
- 原始版本：\`feature/english-academy-p7-integration-20261115\` / Draft PR #66，正式 Google/Supabase 身分與 ChatGPT 私人 Site 尚未接線。
- 本分支：\`feature/english-academy-p8-acceptance-20261115\`，Draft PR #67，**base P7，不是 main**。
- 正式驗收規範：\`english-academy/p5/release-gate.mjs\` 的 12 個 gates，\`english-academy/p7/integration-preflight.mjs\` 的不部署安全閘門。
- 執行環境：Node.js 24、Playwright Chromium、一次性 PostgreSQL 17、Deno 編譯。測試只用原創題目、虛構 owner UUID 和匿名合成資料。

## P8-A 已建立驗收工具
1. \`acceptance-matrix.mjs\`：G01～G12 對照 P5 原正式需求；隔離 CI 結果只能列為 \`synthetic\`，G01～G12 預設 \`NOT_TESTED\`，未通過獨立驗證的「PASSED」宣稱會被降為 \`BLOCKED\`。
2. \`tests/acceptance.test.mjs\`：針對假核准、mock OAuth、偽造擁有者、跨帳號讀取、失效 Site 連結、正式審查 SHA 不一致、在 URL 夾 token 等做負向測試；測試人為模擬「全部通過」仍不能執行部署。
3. \`scripts/generate-status.mjs\`：產生純文字 JSON 報告（沒有私人資料），明列全部 12 項正式閘門未驗收。可作為下一位審查者的初始帳本，**不是獨立驗收簽署**。
4. \`.github/workflows/english-academy-p8-ci.yml\`：Node P0～P8 測試、P1/P4/P6 Chromium 手機與桌面回歸、PG17 P1/P5 合成資料備份還原、PG17 P6/P7 RLS 與正式卡批准交易、Deno Edge 編譯。沒有 merge、deploy、Supabase secrets 或 live URL 存取。
5. \`createP8Defect\`／\`appendP8Defect\`：將 P8 缺陷按 G 閘門、嚴重程度和證據 URL 附加，避免覆蓋原錯誤。

## P8-B：12 項實機／真實服務驗收清單

| Gate | 必須取得的真實證據 | 標準／拒絕條件 | 狀態 |
| --- | --- | --- | --- |
| G01 Google OAuth | 本人及非授權測試帳號的真實登入、過期 Session/撤銷的 server-side log | 本人可登入；他人、過期或撤銷登入被拒；前端 Email 不作為伺服器授權 | NOT_TESTED |
| G02 正式 RLS | 經核准環境的已套用 schema、匿名與跨 owner 的 read/write 負向證據 | 各 owner 資料互不可見且無越權寫入，服務金鑰僅在後端 | NOT_TESTED |
| G03 A22 Android | 實機有日期的登入、觸控、字卡審核、語音/安全區截圖 | 真正 A22 裝置通過，不以 Chromium 尺寸模擬代替 | NOT_TESTED |
| G04 FSRS 真實持久化 | 真實資料庫複習事件、跨日與跨裝置相同狀態、重送去重、狀態還原 | 版本固定，重複事件不得造成第二次排程 | NOT_TESTED |
| G05 題型／六技能 | 七題型、主觀覆核、可信聽力、未作答與口說資料的實際紀錄 | 無證據不得虛構 CEFR 或口說／聽力能力 | NOT_TESTED |
| G06 ChatGPT MCP | ChatGPT 實際 tools/list/tools/call，指定對話候選同步及跨 owner 負向 | 非指定對話絕不擷取，重送／錯誤可查，既有工具仍可用 | NOT_TESTED |
| G07 OAuth 資源與撤銷 | 已部署 RFC 9728 metadata、真實 issuer/audience/client 綁定、撤銷測試 | 偽造 clientId、token 或 model-supplied owner 全被拒 | NOT_TESTED |
| G08 適性課程 | 真實同意的練習證據、課程變更前後、AI 建議覆核 | 記錄可追溯，無資料時不能虛構建議成效 | NOT_TESTED |
| G09 獨立安全審查 | 與執行者不同的專業審查者簽核及缺陷修正閉環 | 中高風險安全缺陷未關閉時不進行部署 | NOT_TESTED |
| G10 舊系統回歸 | 既有 AI 工作台、照片、讀書室、圖書館、Side、立剪的真實工具清單／操作前後 | 無工具遺失、權限下降、資料誤改或原有路由失效 | NOT_TESTED |
| G11 備份還原 | 經核准實際環境資料備份、測試還原、恢復時間及錯誤回退演練 | 可在出錯後安全關閉英文分支並維持舊系統，不擅自 DROP | NOT_TESTED |
| G12 真實完整學習閉環 | ChatGPT 指定對話 → 候選 → 本人批准 → 正式卡 → 作答 → FSRS → 適性規劃/週報 | 每個節點同一 verified owner、資料正確且可回復 | NOT_TESTED |

### 正式驗收證據格式
對每一 gate 新增一筆獨立的附加紀錄：
- \`requirement\`：使用 P5 正式 requirement ID 而不是自由命名
- \`commitSha\`：確切 40 位候選 commit，必須與環境一致
- \`environment\`：\`production-verified\`，必須由獨立核驗者檢查
- \`status\`：\`passed\`／\`failed\`／\`blocked\`，不可由單一測試腳本自行宣告
- \`checkedBy\`：非 \`self\` 的實際獨立審查者（以人員／權限紀錄為準）
- \`evidenceUrl\`：可信 HTTPS 證據，**不可含 JWT、API token、query token、密碼**
- 日期時間、受測帳號類別（不可含敏感帳密）、重現步驟、實際結果、失敗/修正、回退結果、本人核准範圍。

## 本人批准閘門（全部獨立）
正式操作須由本人另行批准具體 commit SHA、環境及動作，**P8 指令本身不批准**：
1. Supabase migration／RLS 變更（含具體 SQL）
2. Supabase Edge 部署／正式 secret 設定
3. 既有私人 MCP Site route／OAuth 與工具清單修改
4. GitHub \`main\` 合併
5. GitHub Pages 正式發布
6. 新增付費服務（如發生）
7. 正式資料刪除／回復（如必要）

P8-A 的 CI 永遠沒有這些動作。所有 G01～G12 真實證據和獨立審查完成後，P5 \`reviewReleaseEvidence\` 才能顯示 \`READY_FOR_OWNER_APPROVAL\`，但仍需 \`authorizeReleaseScope\` 分別查核本人批准；這些函式**只評估，不執行部署**。

## 阻礙與回退
- 若未核准 schema，後端保持無 English 表／Edge，新 UI 不可對真實學習紀錄宣稱可用。
- 若 OAuth 或 Site-to-owner 連結沒有完整驗證，禁止真實 MCP 寫入，且不能把模型自述「本人已同意」當核准。
- 若 P7 的 fail-closed guard 擋下正式單字入卡，屬預期安全行為；正式產品需先完成可信批准 UI + 伺服器消耗批准，再獨立測試。
- 若 P8-B 發現資安高風險缺陷，記錄並通知本人、停止相依正式變更；不改動既有 AI 工作台／照片等生產工具。
- 若正式系統更新經批准仍失敗，按預先核可的方式關閉新英文入口、停用新 MCP namespace、回復舊 Site/Edge，再核對原有功能。資料 schema 回退不得擅自刪除已存在的正式學習資料。

## P8-A 證據與交接
- Draft PR #67：https://github.com/lihuany635-create/lizhi-cloud-web/pull/67
- P5 正式驗收閘門：https://github.com/lihuany635-create/lizhi-cloud-web/blob/feature/english-academy-p7-integration-20261115/english-academy/p5/release-gate.mjs
- P5 G01–G12 工作矩陣：https://docs.google.com/document/d/1jyTf8jA6Rp9mzFEPBiEHe0eRDjuwUcGSH4YhO18n1Lc/edit
- P7 階段報告：https://docs.google.com/document/d/1RJc00hZb8cZsSUxCeKWRYRc2q6EhWgUv5HpMmQZIW3s/edit
- 原 Google Drive：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
- 工作台 P8：TASK-009

**切勿將 P8-A 的合成測試通過、候選功能實現、獨立正式驗收通過與正式部署混為一談。**
