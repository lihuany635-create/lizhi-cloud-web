雲端庫內建製作工作台

介面直接掛載於主站 Shadow DOM，沿用 LizhiAuth.client 的 Supabase session；無 iframe 或外站工作台。

source/ 保存可重建的前端、共用流程規則、後端與測試來源。Node 24：進入 source，npm install；npm test；npm run build。將 native-dist/production-workspace.js 複製至本目錄。Site 端的固定帳號工具轉接來源另外由原工作台 Site 的 Git 來源庫維護，不能把憑證帶入此目錄。

後端部署：backend/index.ts、backend/state.ts、lib/workflow.ts、lib/model-flow.ts 上傳至 Supabase Edge Function lizhi-production；workflow 的 model-flow import 使用 .ts 副檔名。verify_jwt=false 是因為處理器同時驗證 Google 使用者 JWT 與固定 AI 角色憑證；此值不代表允許匿名。schema.sql 已套用正式專案，勿直接重跑建表。原 D1 保留備份，禁止以搬移覆寫新資料。

production-workspace.js 是已編譯的前端資產，不包含伺服器秘密。所有資料更新由服務端檢查擁有者、角色及 revision。

v7 通用專案：在既有 portfolio 上新增 schemaVersion 2，保留原動畫／模型 rows。四種範本、五個主要分頁、六種明確工作結果、證據與範圍、問題／限制、AI交接、key防重、revision／CAS及通用備份回復。新通用工具在原 Sites /mcp，沿用現有OAuth與本人AI bridge，無公開管理金鑰。

新增通用MCP：list_projects / get_project / create_project / get_project_context / list_project_stages / create_project_stage / create_project_task / update_project_task / append_work_record / register_project_artifact / register_project_source / report_project_issue / get_project_handoff。

寫入先讀最新revision，每次使用唯一key，最後get_project讀回。PASS只適用附證據的scope及mode；simulation不等於actual，無證據自動轉NOT_TESTED。舊completed紀錄不直接當PASS。作者才能回復同專案備份，回復保留歷史且不改動畫模型專業資料。

相容測試112/112通過；桌面／手機瀏覽器預覽連線不可用，新通用工具在目前對話尚未重新載入，這兩項端對端維持NOT_TESTED。部署成功不代表這兩項已通過。


## AI 員工守則（2026-10-25）

所有處理本工作台資料的 ChatGPT、Claude、Codex、Gemini 或其他代理，接手前先閱讀 [AI 員工守則 v1.0](../docs/AI_EMPLOYEE_HANDBOOK_v1.0.md)（LIZHI-AI-RULES 1.0.0）。須按最新有效專案上下文、revision 和範圍證據回報；`queued`、`executed`、`saved`、`owner-approved` 分開。此處為文件入口，**並不代表現行 MCP 已自動注入規則或其他 AI 已閱讀**；相關自動載入與回條另列在共用工作台待辦。
