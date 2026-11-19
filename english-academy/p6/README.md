# 英文學習教室 P6｜剩餘功能補齊（隔離候選）

> **狀態：Draft PR，未部署。** 不得以此文件視為正式 Google OAuth、Supabase、MCP、ChatGPT、A22 手機或獨立安全驗收通過。禁止未經本人明確批准合併 main、套用正式 migration 或發布私人 Site。

## 已補功能
- 七題型：翻卡、選擇、拼字、填空、翻譯（僅接受預定等價詞）、聽力（需要可信音訊證據）、造句（待覆核，不自動正確）
- 六技能診斷：A0～C2 **題目參考級別**的 14 題小型展示題庫。獨立顯示 vocabulary/grammar/reading/writing/listening/speaking；沒有資料不評分，不宣稱官方 CEFR
- 造句覆核：四要點 rubric，AI 模型僅可提供建議，正式記分必須由受信任後端核對學習者覆核。瀏覽器展示使用**固定示例回饋**，不假稱已呼叫 AI
- P3 交易持久化候選：新增 P6 sync request / diagnostic / sentence review 資料結構與原子批次入庫 RPC，核對先前網站授權的英文對話、本人 owner、重送內容、一致性與歷史
- 行動版／桌面版展示與自動化測試；**全部使用虛構資料**。

## 隔離版操作
從包含此分支程式的倉庫根目錄啟動靜態伺服器：

\`\`\`bash
python -m http.server 5173
\`\`\`

開啟 \`http://localhost:5173/english-academy/p6/preview/\`。沒有帳號密碼、外部雲端寫入或保存，重新整理會清除暫存作答。

## 測試
- \`node --test english-academy/p6/tests/practice-diagnostic.test.mjs\`：七題型、診斷、覆核及資料安全邊界
- \`node --test english-academy/p6/tests/browser.test.mjs\`：Playwright Chromium 360px 模擬手機及桌面
- \`english-academy/p6/tests/postgres-p6.test.sql\`：**一次性 PostgreSQL 17**，需依序套用 P1/P5 隔離 schema、合成 fixtures，再執行 P6 migration 與負向測試
- \`.github/workflows/english-academy-p6-ci.yml\`：隔離 CI；不含正式部署動作

## 正式整合前待補驗收（不可省略）
1. 真實 Google OAuth、非授權帳號及跨 owner 限制，正式 Supabase RLS 與 Edge 身分／金鑰驗證。
2. P6 SQL 僅是提案；正式執行前需審查已存在資料、備份／回退、交易鎖與權限，並取得本人對資料庫修改的獨立批准。
3. P3 真實 ChatGPT MCP 與同步網路接口，不能用 in-memory mock 或本地 PostgreSQL RPC 冒稱已連接。
4. 聽力需驗證播放／理解的可靠流程、口說需真人或可信語音評估；14 題樣本不足以提供 CEFR 官方程度認證。
5. Android A22 真實實機、同帳號跨裝置及現有立之雲端庫／工作台等功能回歸。
6. 獨立資安與功能驗收，全部必要關卡達標並由本人核准後才可部署。

P6 只增量開發、附加報告，不覆蓋 P0～P5 舊報告與工作台記錄。工作台：TASK-007。Google Drive：https://drive.google.com/drive/folders/117PWBFCdEbioh6zFYxe453XsUa_czjPm
