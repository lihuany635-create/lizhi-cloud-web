# GridCraft｜P3 安全 MCP 接線候選與正式部署驗收交接 v1.0
日期：2026-11-18（Asia/Taipei）
**開發候選：PASS（隔離測試、待獨立安全複核）｜正式 MCP 接通：BLOCKED／NOT_DEPLOYED。**
維持使用者 2026-11-18 最新目標：「本人 Windows 已開＋GridCraft 已啟動才要連；關機則離線」，不要求永久雲端主機。

## 1. 本輪實際產出（都只在原 PR #88 草稿開發分支）
- 原 Private Site 的 [gridcraft-p3-bridge.mjs](../../sites-migration/ai-workbench/gridcraft-p3-bridge.mjs)：可信 `identity(req,'ai')` 本人綁定後才轉送工具，`GRIDCRAFT_P3_ENABLED` 預設 OFF。追加唯讀 `gridcraft_status`、`gridcraft_list_workbooks`、`gridcraft_read_range`；另有獨立 `GRIDCRAFT_PAIRING_ENABLED` Gate 的 `gridcraft_pair_start` 一次性配對。
- [route-p3-candidate.ts](../../sites-migration/ai-workbench/route-p3-candidate.ts)：擬在**原本的 Site** 保留原 `aiwb_*`、施工照片七工具與既有 `legacyPOST`，只額外加入 Gate ON 的 GridCraft Tools。這只是複製後才生效的候選，沒有部署／覆寫真正 Site。
- [p3-edge-candidate.ts](p3-edge-candidate.ts)：擬沿用**同一既有 Supabase 專案**的受控 HTTPS 服務，提供 Site 本人轉送、短期配對碼、裝置 heartbeat/poll/complete。明確設 `GRIDCRAFT_P3_ENABLED` 未配置時為 OFF；沒有正式部署。
- [P3_SQL_CANDIDATE.sql](P3_SQL_CANDIDATE.sql)：原 Supabase 專案內三張私有暫存資料表與原子領取／完成／一次性配對 RPC。所有表 RLS、沒有 anon/authenticated 授權，僅 service_role。**故意放在 integrations/gridcraft 目錄，而非 migrations，避免誤執行；未套用正式 DB**。
- [gridcraft_outbound_worker.py](gridcraft_outbound_worker.py)：Windows 電腦只向固定 HTTPS Host 主動出站，不允許任意外部 URL／公網 TCP 7979；每次只執行本機授權工作簿的唯讀任務，嚴格限制範圍至 200 格、JSON 結果 24KB、過期／無授權／未知操作一律拒絕，不能執行任意 shell。
- [gridcraft_pairing_client.py](gridcraft_pairing_client.py)：本人透過原 Site 取得 16 位高熵配對碼（TTL 120 秒），只在本機輸入；生成獨立裝置 bearer token，使用 Windows 使用者 DPAPI 加密保存，DB 僅儲存 token SHA256。**原廠 GridCraft localhost token 不送至雲端。**
- [gridcraft_windows_agent.py](gridcraft_windows_agent.py) v0.2：保留 v0.1 本機 READY 與 Windows 登入自啟動，追加「輸入配對碼」「授權目前工作簿」「開始遠端」「停止遠端」。遠端連線預設 OFF、授權文件須在每個使用工作階段本機自行選擇。尚未取得本人實際 Windows v0.2 操作與配對證據。

## 2. 真實隔離 CI 測試證據（不是正式對話端到端）
- [P3 CI #44223883719](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223883719)：原 Site + 模擬 relay Node 21/21 PASS（read-only 工具、本人身分、假設備與冒用 token、TTL、重送、錯誤重導向、配對 Gate），Windows Python 出站模擬 11/11、原本本機控制回歸 6/6。Deno Edge handler 隔離資料庫 mock 9/9、TypeScript 檢查與 Gate OFF PASS。隔離 PostgreSQL 16：RLS/owner 單一 claim、完成去重、配對一次性及錯碼拒絕 PASS。
- [Windows v0.2 CI #44223637530](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223637530)：真正 Windows 2022 runner 6 本機控制 + 8 Windows 啟動與設定 + 7 Windows DPAPI 一次性配對 + 11 出站處理 = **32/32 PASS**，PyInstaller EXE 製作與封裝後 `--self-test` 通過。
- Windows v0.2 EXE SHA-256：`4ad88c413d48baef29be96e00ca215741dfc2dbe36092c33ec2be80aff2a04a4`（根據 CI 自我檢測日誌）。ZIP [私人 Drive 備份](https://drive.google.com/file/d/10nQSbwjfSTOE8uyDmNBf3Nvo1BpKEVkn/view)，驗證檔案權限 shared:false，owner-only。
- 舊 P3 SQL pairing 初版 [CI #44223252289](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223252289) 因建置腳本替換字串意外破壞 SQL Dollar-Quote 而 FAIL；已從原版完整重建，後續 [#44223372916](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223372916) 在隔離 PG16 通過，保留失敗紀錄。
- 使用者先前在自己的 PC 回報 GridCraft v0.1 本機 READY，**屬使用者回報，不是本輪 GitHub CI 驗證遠端 MCP 已上線**。

## 3. 安全及功能邊界
- 只在 PC 開機、代理經本人配對、GridCraft 本機控制 READY、且指定工作簿經本機明確授權時，才允許唯讀範圍查詢；關機或逾期回 `DEVICE_OFFLINE`，程式未開回 `GRIDCRAFT_OFFLINE`，token 撤銷／錯誤回 `UNAUTHORIZED`。
- 原 GridCraft `127.0.0.1:7979` 不公開；遠端服務只有固定 HTTPS host 的出站連線，禁止任意檔案讀取、shell、鍵鼠、程式啟動或 Excel 寫入。
- P3 僅是 **唯讀安全前置**，P4 才會增加使用者明確批准且具備本機快照/版本鎖的指定儲存格修改，絕不直接寫原件或承諾所有 Excel 物件無損。
- Site 原本人驗證 `PRODUCTION_CHATGPT_OWNER` 沿用，Side/AIWB/施工照片工具不得遺失；新 Secret 限 server-only，配對碼可短時出現在本人對話，但不能貼出任何 GridCraft control token／裝置長效 bearer。
- v0.2 的約 6 秒輪詢只有使用者勾選遠端連線時啟動。**可能增加 Supabase 非快取流量**；依舊監控人工歷史 10.549GB/Free5GB 基準，`providerVerified=false`，尚非官方即時帳單。正式部署前須審閱真正額度、頻率限速、重試與用量上限，避免不必要 egress。
- 雖然 v0.2 會透過 DPAPI 加密存裝置密鑰，但**雲端撤權/第二帳號實測、持續輪詢費用、跨對話工具載入，以及原站原工具回歸**未通過；P3 不可宣告上線。

## 4. 尚待驗證（正式階段 BLOCKED／NOT_TESTED）
1. P3 **原 Private Site** 需本人批准後才替換原 route，並保留現有身分、Secrets、legacy-route、所有原有 MCP。
2. 原有 Supabase 專案需本人批准後才能套用三張私有資料表／原子 RPC 與部署 Edge 候選，必要新 Secret 僅設站端／Edge，不寫入倉庫或聊天。**本輪零正式 DB 變更**。
3. 高風險安全需獨立複核：裝置配對 brute force/限流、認證撤銷、服務持久化、跨裝置、鎖屏／登出、正式配額與部署回退；目前只有作者自測。
4. 使用者已在 PC 使用 v0.1 READY，但 v0.2 尚未安裝/配對；需以 Site 取得一次性碼再於 PC 輸入，選擇可讀工作簿並開始遠端，然後 ChatGPT 新對話實測 status / list / read。不能把模擬測試當做上述流程通過。
5. P4 Excel 寫入／版本快照／原件保留未做。

## 5. 明確部署閘門
本 P3 先交付候選，不含正式部署授權。若使用者**另行明確批准 P3 正式部署**：
- 先獨立安全複核與查核當期 Supabase 用量，執行正式資料備份/回退準備。
- 在原 Supabase 專案採最小 migration（3 tables + 3 RPC），先以 Gate OFF 發布一個 Edge 候選，測匿名/跨身分拒絕。
- 原 Private Site 只新增受控 `gridcraft_*` tools，保持原已註冊工具清單、owner 驗證與 Secrets。任何原工具減少即 rollback。
- 設定 server-only owner/bridge secret；僅對本人啟用 Pair Gate，取得一次性碼配對本人 Windows v0.2。
- 新 ChatGPT 對話實際測試 READY、OFFLINE、指定工作簿讀取、撤權；不得在權限／流量驗收前啟用遠端寫入。
- 未達閘門就維持舊 Site/原 v0.1 本機可用，正式服務不改動。

## 6. 補充 CI 回歸與監控限制（2026-11-18）
- [P3 最新完整 CI #44223995873](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223995873)：Node Site/relay、Windows outbound、Deno Edge mock DB、隔離 PG16 四個 job 均 SUCCESS，含修正後 Edge READY 心跳新鮮度門檻。這依然不是正式站或本人 PC 端到端。
- 前一輪 [CI #44223977021](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44223977021) FAIL：Edge 新增 READY 心跳檢查後，原測試 fixture 缺 last_seen／status；已同步補上新鮮心跳，後續 CI #44223995873 SUCCESS。保留失敗紀錄。
- 本次打算按員工手冊登記 AI 工作台前，usage_status 回 WITHIN_CAP、usage_alerts 卻回 HTTP 503，usage_egress_history 仍是 2026-11-16 的人工歷史用量 10.549GB、providerVerified=false。因此**遵守第27～29條暫停非必要工作台 Supabase 寫入，工作台 P3 交接狀態 NOT_LOGGED**；詳細 GitHub 與 Google Drive 報告已保存，不假稱 side_log 成功。後續新對話可在監控恢復、可記帳後補新增交接。
