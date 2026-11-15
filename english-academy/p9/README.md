# P9｜立之英文學習教室 — 發布前治理、監控與維護（未部署）

> 狀態：**隔離候選／合成驗證／正式 NO-GO**。P8-B 真實 G01～G12 正式驗收 0/12；P9 不是正式上線許可，亦不得因此修改既有 Supabase、原私人 Site、main 或 GitHub Pages。
> 本文件為 **TASK-011** 的操作規格候選，版本需經本人批准才能採用正式部署流程。

## 1. P9 新增成果

- \`release-coordinator.mjs\`：將 P5 的獨立證據驗證、P7 正式先決條件、P8 G01～G12 串起來做純函式 Go/No-Go。不使用真正 verifier 時必定 NO_GO；即使模擬 verifier 全部 PASS，仍不執行部署，且 owner 對 schema、Edge、Site、main、Pages 必須 **逐項批准**。
- \`privacy-monitor.mjs\`：按匿名計數、失敗率、p95、被拒絕請求、跨 owner 異常、備份／交易回復異常、現有工具遺失計算健康狀態與事件級別。只保留嚴格白名單的統計欄位，原始 URL、token、ChatGPT 句子、owner UUID、電子郵件等不進報告；目前沒有 live data source、常駐服務、發送通知或自動降級。
- \`recovery-runbook.mjs\`：生成 **DRY_RUN_ONLY** 回復清單；先停英語新增入口／寫入，再檢驗 legacy Site 清單、備份、確認上線 commit 及本人授權。永遠不自動 DROP 正式資料、不觸碰正式 DB、不覆蓋 AI 工作台／照片／Side／立剪。
- \`scripts/create-prelaunch-report.mjs\`：產生 P9-A \`prelaunch-blocked.json\`，所有真實 G01～G12 保持待驗，記錄當次 commit 與備援提案，不含真正用戶資料或權杖。
- \`.github/workflows/english-academy-p9-ci.yml\`：只做 P9 Node 安全自測與工作流程變更靜態審查；P8 CI、P5 CI 由 \`english-academy/**\` 路徑變更觸發全階段回歸。

## 2. 監控項目與處理建議（草案，不是已啟用的監控）

| 對象 | 合成狀態規則（建議值、待實流量校準） | 對應處置 |
| --- | --- | --- |
| API 錯誤率 | 至少 20 請求；5% warning、20% critical | 記錄失敗，檢查是否只影響英語 Edge |
| API p95 延遲 | 2.5 秒 warning、7 秒 critical | 判斷上下游故障；不可自動斷開其他服務 |
| 未授權請求 | 單區間拒絕次數 20 warning | 查看匿名統計，不記錄 token |
| 跨 owner／未驗證寫入 | 出現一次立即 critical | 停止英語新增寫入計畫，保全稽核證據 |
| 既有 MCP 工具消失 | 出現一次立即 critical | 停止英文工具路由變更；保留原 Site 功能 |
| 交易回復失敗 | 出現一次立即 critical | 保全資料、不刪除紀錄，升級獨立審查 |
| 沒有足夠取樣 | 少於 20 請求 warning／資料不足 | 不得判定系統 healthy |

初始門檻僅供 P9 合成測試。正式使用前必須先有經本人核准的監控資料來源、明確的時間窗、限流與維護時段、資料保留期限、隱私與告警對象；不得擅自架設自動 Agent 或新增付費監控服務。

## 3. 上線 Gate，順序及批准

1. **P8-B 正式證據**：12 Gate 的真實證據、獨立安全複核、A22 實機、真實 OAuth／Supabase／ChatGPT MCP／正式 Site 全鏈通過，留可複驗 SHA 的記錄。
2. **恢復準備**：正式資料備份和可控制的還原測試、舊 Site 工具清單的發布前快照；缺一即 NO_GO。
3. **本人對測試環境及正式 schema 各自批准**：先審查 P1/P5/P6/P7 migration 所有 RLS、SECURITY DEFINER、索引、資料相容性，並核對 SQL 及準備回退。
4. **本人對 Edge 分項批准**：受信任 Google/ChatGPT-to-owner 綁定、正式卡單筆後端確認與撤銷，所有 Secret 僅在後端；不得套用缺少核准流程的 P7 fail-closed Edge 後聲稱正式產品完整。
5. **本人對既有私人 Site 分項批准**：採 \`english_*\` namespace，絕不可替換原工作台／照片／Side／立剪工具。比較完整 names 和真實 \`tools/call\`。
6. **全部正式驗收與先決條件 PASS** 後，本人另行批准指定 SHA 的 \`main\` 合併與 GitHub Pages 發布。新付費服務、資料清理或復原另需本人批准。
7. **實際發布後** 經另外授權的監控與值班程序才可開始。視真實錯誤率、權限、資料一致性和原工具的操作結果決定是否保留、停用或回復英文新功能；不是 CI 通過就自動判定成功。

P9 程式只產生檢查結果和操作建議，不會呼叫任何主站、Supabase、私人 Site 或 GitHub deploy API。正式發布須由受授權的操作員執行並逐步留證。

## 4. 故障等級、阻斷與回復演練

**SEV1 — 資料／權限高風險**：跨 owner、未核准寫入、私密資料洩漏、正式 DB 記錄毀損或備份失敗。優先由本人/授權人員限制新英文流量，保全記錄並啟動獨立安全複核；不得自動 DROP、重置其他工具或推測已還原。

**SEV2 — 服務異常**：連續錯誤／延遲過高、部分真實 MCP 連線失敗或嚴重舊功能損失。先區分英文新增分支與既有功能，確認原工作台服務、照片、立剪、讀書室仍可用；可按核准回退計畫只停用英文新增路由。

**SEV3 — 單一功能缺陷**：UI、文案、非安全性顯示問題；紀錄並於隔離分支修復後重測，不以小修正直接覆蓋正式服務。

回復順序（只為演練）：
1. 記錄 incident ID、release SHA、受影響功能與現有用戶影響範圍。
2. 停止新的英語候選同步和正式卡寫入**提案**，但不刪除以前資料。
3. 比對 Site 發布前完整 \`tools/list\` 名稱，不得遺失任何既有工具。
4. 確認上線前備份及已核准可回復的 Site/Edge/Pages 版本。
5. 取得本人的正式回退／資料恢復批准（如果任何真實變更）。
6. 由授權操作員按批准範圍回復新英文模組，不碰既有服務。
7. 實測 Google OAuth、學習數據讀寫、英語路由與全部舊功能。
8. 在 AI 工作台、Google Drive 附加事故、修正、再驗證和簽核紀錄。

## 5. 維護與稽核（候選工作規則）

- **每次候選發布**：版本 SHA、變更清單、獨立審查、回退版本、備份位置、G01～G12 結果、本人逐項批准。
- **每次安全／資料問題**：P9-INC / P9-MAINT 不重複事件 ID，不覆蓋舊報告；資料庫及 ChatGPT 原對話片段不應寫入一般 CI 記錄。
- **每週維護提案**：檢查缺陷趨勢、英文詞庫／FSRS 同步錯誤、異常登入統計和原有站點相容，但目前**未設定排程**，不會在本對話外自行持續監控。
- **每次變更前後**：以名單比對 AI 工作台、照片、Side、立剪等原工具，不得以總數相等取代名稱相同。
- **必要安全條件**：存取最小化、權杖去識別化、資料保存與刪除規則、備份能還原、變更與負向測試可追蹤。

## 6. 目前阻礙及交接

- P8-B 仍未完成真實 G01～G12；無任何獨立正式驗收 PASS。
- 正式 Supabase English 表／Edge／Site-to-owner 真實 OAuth、正式卡核准 UI、真實 MCP 功能和 A22 Android 均尚未完整驗收。
- 獨立安全、真實備份及回復、本人對正式 schema／Edge／Site／main／Pages 的分項批准尚未辦理。
- **P9-A** 可先完成 Node 測試、模擬回復、監控規則、部署缺口清單及 Drive 交接報告；**P9-B** 正式上線與正式監控不得進行。

連結：
- P8 Draft PR #67：https://github.com/lihuany635-create/lizhi-cloud-web/pull/67
- P8 階段報告：https://docs.google.com/document/d/1BJvKLWwzPRVXB77dCZ_PV_nmUMFuNazEMQpSjZxV21Y/edit
- P5 12 Gate 矩陣：https://docs.google.com/document/d/1jyTf8jA6Rp9mzFEPBiEHe0eRDjuwUcGSH4YhO18n1Lc/edit
- P9 原 Drive 專案：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
