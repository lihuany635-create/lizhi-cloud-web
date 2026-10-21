# 立之雲端庫 Android 0.1.0

本次建立 Android 基礎版，來源為 `lihuany635-create/lizhi-cloud-web` 的 `739095aa21b3e605bb73944d0d33f82fcae19a7b`。這是程式實作與編譯交付，不等於全部六階段已驗收。Android 實機、正式登入及跨裝置資料移轉仍需完成。

## 本版內容

- Capacitor 8 Android 專案，識別碼 `tw.lizhi.cloud`，Android 7（API 24）以上。
- 主要網站程式與各模組一起打包到 APK；不依賴遠端主頁載入。
- 主程式 Supabase SDK 隨 APK 打包；原網站仍維持原來的載入方式。
- Android Google 登入使用外部瀏覽器、PKCE 與嚴格驗證的回傳網址。
- 返回鍵關閉選單／彈窗、返回首頁；首頁返回鍵將 App 移到背景。
- 原生環境不啟動主程式 Service Worker，避免舊快取覆蓋 APK 內容。
- 本機影音在 App 中保持可見；邀請網址使用原網站網址。
- Blob 匯出檔經分段寫入 App 快取，再開啟 Android 分享／儲存面板。包含同源 iframe 的匯出，仍需實機確認各個模組。
- 新增動畫流程工作台入口，開啟現有線上工作台。
- Android 模組清單、資料移入說明及目前同步範圍顯示在 App 設定頁。

## 登入前必要設定

在既有 Supabase 專案的 Authentication → URL Configuration → Redirect URLs **新增**：

```text
lizhi-cloud://auth/callback
```

保留原有 Site URL 及所有 Redirect URLs。本次沒有管理後台連線，因此沒有宣稱已完成這項設定，也沒有執行資料庫 migration。

驗證時使用核准的原 Google 帳號。取消登入、切錯帳號或重複回傳不能進入受保護模組。App 冷啟動與已開啟狀態都要測試登入回跳。

## 模組盤點與移轉

| 模組 | 目前原始碼狀態 | 本版安排與待辦 |
|---|---|---|
| 主資料庫 | `lizhi-local-cloud` v1；records、blobs | 沿用格式；主頁 JSON 備份不含 Blob，不代表整站完整備份 |
| 理財 | `lizhi-finance` v1 | 沿用；使用理財模組自己的備份／匯入；該模組自動同步仍受 github.io 判斷限制 |
| 工程 | `lizhi-engineering` v14 | 沿用；先確認本機是否另有較新 v16 版本，再導入實際資料 |
| 圖書館與知識庫 | 多個本機／雲端轉接器 | 手機不能使用電腦 localhost API，需逐一驗收 |
| 映構 | 本機專案、圖檔、裝置資料夾；遠端 popup 交接 | 本機畫布已打包；裝置資料夾 API 與原 popup 交接未移植成 Android 原生流程 |
| 立剪 | 已打包的 HTML／JS 工作台 | 匯入、編解碼、代理與輸出需實機確認；背景輸出尚未建立 |
| 動畫流程 | 獨立的 ChatGPT Site | 本版提供線上入口；帳號與資料仍由原工作台管理 |
| 讀書室 | 外部 Vercel 網站 | 需要網路，不能視為完整離線模組 |

瀏覽器、PWA 與 App 的本機儲存彼此獨立。先在原裝置各模組匯出，記錄項目數與附件數，再於 App 分別匯入、核對。未建立跨模組通用匯入器；不自動讀取或覆蓋瀏覽器資料。

## 編譯

安裝 Node 24、JDK 21、Android SDK（Platform 36 / Build Tools 36.0.0），設定 `JAVA_HOME` 與 `ANDROID_HOME`。根目錄執行：

```text
npm ci
npm run mobile:build
npm run test:mobile
npm run mobile:apk
```

輸出：`artifacts/lizhi-cloud-0.1.0-debug.apk`。也可使用 GitHub Actions 的 Android App workflow。

這是開發簽章 APK。後續可更新安裝必須保持相同簽章；正式版需要由擁有者保管的固定簽章與版本遞增。CI 的臨時 debug key 不保證跨次執行相同。不要為了測試覆蓋或移除唯一資料副本。

## 驗收清單

1. 安裝、首次 Google 登入、取消登入、錯誤帳號阻擋與登出。
2. 已登入後關閉網路，再開 App、理財與工程；重開後資料仍存在。
3. 新增一筆測試資料，匯出、匯入，再比對筆數與金額；測試附件本體。
4. 映構、立剪、A4 與 3D 頁面逐一載入；切換選單後原 iframe 狀態保留。
5. 從主頁與 iframe 各匯出檔案，Android 儲存後重新開啟確認。
6. 登入回跳、返回鍵、直橫切換、鍵盤遮擋與安全邊界。
7. 記錄背景／鎖定／系統終止的實際結果；本版不宣稱長時間背景輸出成功。

## 下一批實作

先完成實機與登入驗收，再處理資料移轉與附件保存。接著依序建立映構原生資料夾、同步佇列與衝突處理、跨模組 AI 任務協定、背景工作。AI 任務需攜帶 project_id、episode_id、規則與素材版本、交接紀錄、產出及狀態。App 化本身不代表 ChatGPT 已接通。

## 自動檢查紀錄（2026-10-21）

- Android 專項：17/17 通過，包括 PKCE 回傳白名單、錯誤帳號阻擋、冷／暖啟動、回傳去重、匯出分段位元組一致性、寫入失敗處理與打包範圍。
- APK：Gradle assembleDebug 成功；apksigner 驗證通過；包內 272 個資源逐一比對最終 mobile build，內容全部一致。套件 `tw.lizhi.cloud`、版本 `0.1.0`、最低 API 24、目標 API 36。
- 映構登入／整合及信用卡消費與卡費繳款：52/52 通過。
- 全專案既有回歸：1321 項，1312 通過、9 項失敗。獨立取出未修改的基準 commit 重跑相關項目，確認同樣 9 項失敗；均為固定版本字串的舊入口／Service Worker 檢查。本次沒有改寫這些舊測試使它們通過。
- 真實 Google 登入、Android 裝置操作與正式資料移轉：未驗收。
