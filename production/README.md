雲端庫內建製作工作台

介面直接掛載於主站 Shadow DOM，沿用 LizhiAuth.client 的 Supabase session；無 iframe 或外站工作台。

source/ 保存可重建的前端、共用流程規則、後端與測試來源。Node 24：進入 source，npm install；npm test；npm run build。將 native-dist/production-workspace.js 複製至本目錄。Site 端的固定帳號工具轉接來源另外由原工作台 Site 的 Git 來源庫維護，不能把憑證帶入此目錄。

後端部署：backend/index.ts、backend/state.ts、lib/workflow.ts、lib/model-flow.ts 上傳至 Supabase Edge Function lizhi-production；workflow 的 model-flow import 使用 .ts 副檔名。verify_jwt=false 是因為處理器同時驗證 Google 使用者 JWT 與固定 AI 角色憑證；此值不代表允許匿名。schema.sql 已套用正式專案，勿直接重跑建表。原 D1 保留備份，禁止以搬移覆寫新資料。

production-workspace.js 是已編譯的前端資產，不包含伺服器秘密。所有資料更新由服務端檢查擁有者、角色及 revision。
