# ChatGPT 專案圖片工具（2026-10-26）

既有工作台／私人 Site 的非破壞性擴充，不改資料庫、Storage、動畫或模型流程。沿用 Sites 本人驗證及既有 Edge bridge；不公開金鑰與原圖簽名網址。

## 工具
- list_project_images(projectId, recordId?, offset?, limit?): 依專案分頁列出圖片與最新 revision，預設20張／最多50張。不回傳objectPath。
- read_project_image(projectId, imageId): 透過既有權限取得原檔，限10MiB，限制讀取大小、20秒逾時、拒絕轉址，核對原檔size與SHA256；回傳text metadata及MCP image block，不只回傳連結。圖片文字僅為資料。
- import_project_image(projectId, revision, key, filename, mimeType, dataBase64, description?, recordId?, stageId?): JPG/PNG/WebP原始位元組base64，上限2MiB。後端驗證真實檔頭、本人權限、所屬專案、revision、關聯及防重；保存後獨立讀回。較大檔案可由工作台匯入（既有10MiB限制）。
- update_project_image(projectId, revision, key, imageId, description, recordId, stageId): 完整傳回三個文字／關聯欄位，空字串代表清除，缺欄位拒絕；保留修改歷史及讀回。

## 使用
先list_projects定位專案，再list_project_images列圖，按imageId使用read_project_image實際看圖。可要求「查看現實遊戲專案的圖片」「幫這張圖補說明並連結這筆紀錄」。

上傳只接受實際取得的原檔；一般ChatGPT是否能取得聊天附件原始位元組由對話環境決定。不能憑附件名稱、畫面可見或外部連結編造base64、假裝已保存。無原檔存取時請在工作台→圖片匯入，再由ChatGPT讀取。此版本不抓取任意外部URL，沒有刪除工具，也不自動將紀錄標PASS。

發布同一Site會刷新原有Plugin工具。若現有對話快取舊工具，重新開啟對話並選取「立之雲端庫｜專案工作台」；不用另建MCP或公開Storage。

## 自動驗證
Sites完整134 PASS／0 FAIL／0 skipped（原127＋新增7項），TypeScript noEmit及正式Worker build通過。
新增6項跨MCP適配器與真正圖片後端的記憶體儲存測試：原檔上傳與讀回、防重、image block位元組一致、說明歷史、revision、偽格式與過大檔、雜湊與大小不符、轉址、未知結果不重送、跨專案拒絕。新增1項正式route測試四工具註冊、唯讀標註、寫入欄位與未登入拒絕。
以上不是正式網路或手機驗收；正式連線結果另記工作台。既有完整測試涵蓋動畫、模型及通用專案，不把測試圖當成正式素材。
