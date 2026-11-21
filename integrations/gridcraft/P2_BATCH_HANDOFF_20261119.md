# GridCraft v0.5.4 P2 — 安全批次寫入候選交接

**狀態：隔離開發候選（非正式發布）**。本方案沿用現有 v0.5.3 P4SafeWriter／P4Local／本機授權、CAS、備份與讀回機制。不得在原 Site/Edge 尚未經正式核准、驗證前宣稱 ChatGPT 能遠端使用三項新工具。

## 支援功能與操作限制

- 新 `P2BatchWriter.prepare(doc, operations)`：同一個已授權且目前開啟的工作簿，最多 **8 個不重疊範圍**，每個範圍沿用 P4 **50 格與 4096 byte** 限制，批次總計最多 **200 格、16 KiB**。`parse=false`；禁止公式注入；若範圍重疊、數值格式錯誤、沒有已驗證的文件身分，立即拒絕。
- 預覽 90 秒有效，顯示位置、格數、變更數、驗證摘要（不回傳私人欄位內容）；使用原 Site 的本人身分與本機 P4 開關核准後才可提交。
- `commit(preview_id,expected_version,request_id,write_enabled,owner_confirmed)`：整批讀回檢查、**一次完整 XLSX 備份**、備份後再次 CAS、單一 batch request_id 的永久防重放收據，逐範圍寫入＋讀回。結果 `VERIFIED_NOT_SAVED` 表示本機記憶體內值驗證通過，**不代表已存磁碟**。
- `status(request_id,reconcile)`：只回報收據狀態與摘要；開啟 `reconcile=True` 時比對所有目標範圍的來源／修改後雜湊，不揭露內容。重新啟動／工作簿 ID 可能重用後回 `SESSION_CHANGED_NOT_VERIFIED`，必須拒絕誤驗證。
- **不承諾原子性**：多範圍寫入間發生使用者修改、斷線、逾時或磁碟寫入問題時回 `PARTIAL_CONFLICT`／`OUTCOME_UNKNOWN` 等，保留已有備份與進度；**絕不盲目重送或默默還原**，以免覆寫使用者的同時編輯。需要人工審閱或先讀取狀態；狀態只是觀察，不能證明沒有任何曾發生的寫入。

## 安全與驗證

- P2 收據只保存狀態、座標、時間、雜湊與本機備份識別，不保存任何儲存格值、密碼、絕對路徑或 token。以原子更新和 SHA-256 完整性記號保護，不能當作惡意對手的密碼學簽章。
- 永久保留批次 request-id 雜湊以拒絕重放；超過 50,000 筆須先人工審核整理，不能刪除舊記錄而導致可重新提交。損壞／符號連結收據時 P2 fail closed；P3、既有 P4 仍應可照常運作。
- 從本機 UI 的授權清單獲得 approved_docs，每次操作均動態驗證；不得讓遠端直接自行核發 doc grant。`owner_confirmed` 只能來自 Site 本人驗證，不可靠用戶輸入或模型口頭授權。
- 本候選僅新增 Windows worker 的 opt-in P2 route，**既有 Edge v6 和 Site v31 並沒有新的 P2 工具 schema**；所以正式遠端無法呼叫，勿標記 LIVE。
- P2 收據查詢只適用於 owner-authenticated Site；正式發佈前必須加上明確的 request_id 身分綁定、重送／斷線與第二帳號撤權驗收。

## 驗收證據

候選 Python 3.12/3.13 Ubuntu/Windows CI 應跑：`test_p2_batch.py`、`test_p4_safe_write.py`、`test_xlsx_fidelity.py` 與原 OutboundWorker 回歸；若套件路徑或舊測試檔名稱不同，以真實 CI log 修正，不臆測成功。僅使用合成資料，GitHub 公開倉庫不得加入本人真實試算表。

真機端到端、使用者目前 Book1 工作簿、Edge/Site 授權／過期任務與非快取流量用量均為 `NOT_TESTED`，屬 P5 或經批准的獨立正式驗收。

## 下一步

候選 PR 只放在 P1 分支上並標成 Draft。正式發布需另獲本人批准，增補原 Site/Edge 的驗證、Schema、request ID idempotency、裝置離線、結果不明的查詢，保留原私人 Site/DB/登入，不新建第二套網站。
