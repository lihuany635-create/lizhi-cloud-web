# 手機代理工作台 v1（唯讀）

立之雲端庫入口：主選單「手機代理」，亦可使用 ?open=phoneagent。

- Supabase Google OAuth 登入後，瀏覽器使用使用者 JWT 呼叫 lizhi-mobile-agent Edge Function。
- 服務端以 Supabase Auth 驗證身分及核准帳號，只允許指定 GitHub Pages 來源的 status、ui、screen GET；browser 永遠不存 DEVICE 或 OPERATOR 金鑰。
- 使用者需要在私人 A22 5G 上先開啟 v0.4.1 配對、允許螢幕讀取。③觸控保持關閉。
- A22 螢幕鎖定或 30 分鐘工作階段到期時，應顯示裝置離線。
- 只在無敏感資訊的測試畫面讀取截圖。尚未接入 ChatGPT 原生 MCP，也不提供網頁點擊操作。

## v2 使用者介面改善
- 手機畫面與有效可見的 UI 元件並排呈現（窄螢幕改為上下排列），不直接曝露原始 JSON。
- 篩選 `visibleToUser && boundsValid`，上限 100 元件。越界或無效座標不出現在可操作元素清單。
- 明確顯示目前 App package、全部節點數及有效節點數。
- 「複製 AI 文字摘要」只有在使用者先查詢 UI 後才可操作；摘要包含部分畫面文字與座標，但不包含截圖與金鑰，不會自動上傳給 ChatGPT。
- 網頁仍未直接接入 ChatGPT 的 MCP 操作工具。畫面上的資料可能敏感，複製前應自行確認。
