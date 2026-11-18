# GridCraft P2｜雲端運算與私人持久化評估、隔離實測 v1.0
日期：2026-11-18（Asia/Taipei）｜計畫書：GridCraft MCP v1.1 第七章 P2｜核定部署：無。

## 重大判定
- **P2-A 雲端原生 GridCraft 運算：PASS（按需短期運算環境，合成資料）**。官方 v0.19.1 CLI 確實在 GitHub Actions `ubuntu-24.04` 上執行，而非使用者的 Windows 電腦。
- **P2-B 本地版本化工作簿儲存契約：PASS（純合成、本次 runner 內）**。6/6 單元測試通過：owner 欄位隔離、同一版本競爭、重送去重、偵測資料損壞、快照還原、重新開啟資料庫及真正 GridCraft 呼叫。
- **P2-C 長期私人雲端持久化：BLOCKED**。目前 SQLite 只放在會消失的 runner 本機；沒有連上經本人批准的雲端私有 Storage / Google Drive API，不能在 runner 結束後保證存在。
- **P2-D 即時遠端請求、雲端機器關機／喚醒、本人 OAuth 實際授權：NOT_TESTED**。GitHub Actions 不等於長期運行的 HTTPS MCP 服務；沒有 ChatGPT 新對話的現網工具。
- **P2-E 本人帳戶方案／剩餘額度與正式服務費用：BLOCKED（未取得官方帳務讀取）**。監控歷史數據不能等同即時官方已核定的費用。
- 綜合：**P2 隔離候選子項通過，但 P2 主驗收閘門 BLOCKED，不能進行正式 P3 上線**。需先取得私人持久化與可信即時運算方案、確認無新增未批准成本。

## 具體實測證據（不是模擬）
- [官方 GridCraft v0.19.1 + 完整 P1/P2 GH Actions Run 44217406071](https://github.com/lihuany635-create/lizhi-cloud-web/actions/runs/44217406071)。Linux 標準 runner，官方發行 SHA256 校驗 `8d97bba2d5bb00fd69ed55064852c1fd914de40d5ecd55ca01c8df81b828946d`；MCP 初始化／XLSX 匯入／局部修改／複雜物件 smoke 全部成功。
- 同一 run：`python3 integrations/gridcraft/p2_synthetic_test.py` → `Ran 6 tests ... OK`。
- `p2_synthetic_store.py`：只允許 `GRIDCRAFT_P2_SYNTHETIC_ONLY=1` 運行；本地 SQLite 不接受真正私人工作簿正式使用。內含 ZIP 結構上限、工作簿 UUID、owner 欄位、單檔最大 2 MB、總解壓限制、SHA256、版本 CAS、request_id 去重、BEGIN IMMEDIATE 原子性、版本快照、新版本還原及無 shell 的受限 GridCraft CLI 呼叫。
- `p2_synthetic_test.py`：新資料庫重開、不同 owner 拒絕、舊版本拒絕、重送不重覆寫入、競爭寫入恰有一個成功、損壞驗證、回滾並實際修改 B3 2300→2500 和重新讀取 D3=75000。
- **重要侷限**：owner 參數是測試程式產生、不是現網身分驗證；SQLite BLOB 未加密且只允許合成資料；同 runner 的本機重開不等於不同 runner／不同機器跨次持久化；只測局部編輯，不是正式 API／服務。

## 經查證的託管方案與拒絕事項
| 方案 | 能否直接執行 Rust CLI | 永久私人工作簿 | 安全／成本結論 |
|---|---|---|---|
| 既有 GitHub Actions 標準 Linux | 已實際 PASS | runner 磁碟暫時 | 公開 repo 標準 runner 使用費按官方文件屬免費；不得把私人 XLSX 當公開程式碼/CI Artifact；不能取代 HTTPS 持續對話 |
| 既有 Supabase Edge | Deno／Wasm 可做轉接；原生程序無證據 | 可考慮既有 private Storage，但目前未驗證可用配額 | Free：256MB／2 秒 CPU、150 秒 wall-clock；若運算超標會失敗。不直接把原生 GridCraft CLI 塞進 Edge；大量讀寫會增加非快取 Egress |
| 既有 Cloudflare Workers Free / Site | JS／Wasm 轉接可能，不能直接啟動 Linux CLI | 需外部受控持久化 | Free：每請求 CPU 10ms、記憶體 128MB，不能假裝已可跑完整引擎 |
| Render Free Web Service | 提供原生應用服務，尚未實測 GridCraft | 免費本機硬碟隨休眠/重啟消失 | 15 分鐘閒置休眠、約一分鐘喚醒，750 instance-hours/月與頻寬/建置限額；新外部託管需本人批准；免費不適合生產 |
| Koyeb Free Instance | 可放原生服務，尚未實測 GridCraft | 不支援持久 Volume | 0.1 vCPU / 512MB、1 小時無流量停機；需外部永久儲存；新外部服務需本人批准 |

官方參考：
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/wasm
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://developers.cloudflare.com/workers/platform/limits/
- https://render.com/docs/free
- https://www.koyeb.com/docs/reference/instances

## 監控與官方帳務（不編造）
- 使用者既有「立之 Supabase 流量監控中心」於 2026-11-18 本次查到：AI 操作數額度 WITHIN_CAP；獨立的非快取流量資料是 **2026-11-16 人工歷史值 10.549 GB**，歷史計費期間 **2026-10-26～2026-11-26**，免費基準 **5 GB**。來源 `manual_supabase_usage_dashboard`，`providerVerified=false`，不是當前官方帳單及當前帳戶訂閱的驗證。
- 本次準備查官方 Supabase 組織方案前，`usage_log_before` 回報「監控讀寫未完成或驗證失敗」，再以 eventId `a3b00df6-38e7-4f61-b746-c78262e26a03` 查詢 `usage_events` 無紀錄。遵從員工手冊第 27～29 條，**停止非必要 Supabase 管理讀取**，並標記 `NOT_LOGGED`，沒有編造 before/after。
- 不自行新增 Edge、DB、Storage Bucket、Render/Koyeb 服務，不使用未批准費用、正式金鑰或正式私人 Excel。

## 偏好的候選接法（未核准、未部署）
```text
ChatGPT（原 Private Site，本人身分）
  → P3 限權 gridcraft_* MCP Gateway
  → HTTPS 雲端受控原生運算（需選定與測試）
  → 每次操作從授權私人儲存讀原版本
  → 在隔離暫存區執行 v0.19.1 → 寫入新版本＋CAS＋備份
  → 驗證差異與 SHA256 → 回傳少量結果
```
不可把 Chrome/ChatGPT 的 Google Drive 連接器 token 直接假定可轉移給遠端 Site；若選 Google Drive 長期儲存，需再設計本人授權的 Drive API 憑證界線；若選 Supabase Private Storage，需先驗證實際容量、當期非快取量及可用性。未證實的互通不要宣告完成。

## 接續工作（精確條件）
1. 【AI】取得合法且不新增未批准費用的雲端託管方案，實測可信官方 GridCraft CLI、記憶體/CPU/冷啟動；需要額外服務先請本人核准。
2. 【AI】選擇經核准的私有 Storage，實測**跨 runner／跨重啟**持久化、owner 身分不可偽造、私有 XLSX 不會出現在公開 CI、版本鎖與原件 hash 不變、還原。
3. 【AI】取得官方 Supabase 方案／帳期及剩餘用量或等效外部儲存成本資訊；監控可用時逐次 log before/after，超限時停止非必要請求。
4. 完成上述後才可將 P2-C/P2-E 由 BLOCKED 改 PASS；P3 依獨立授權進入受限 HTTP MCP，**正式 Site/Edge 上線仍需本人明確核准**。
