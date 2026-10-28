# 原 Sites 本人授權、免費額度及部署安全實查 v1.8

2026-10-28（Asia/Taipei）。唯一專案 `61b88bec-9b3e-49e6-8780-d073fc816516`，接手實讀 Revision **93**，原分支 `feature/ai-loop-p1-spec-sandbox-20261028` / Draft PR #43，基底 commit `3baf1a4d93d13d79fc43c9b895cd81c73e6d01b2`。未建立新站點或平行專案。

**結論：兩項核心阻礙尚未完整解除。可信 ingress 仍需原站驗收；帳戶當期額度/超額行為為 NOT_VERIFIED。route 保持 INGRESS_VERIFIER_REQUIRED，MANUAL OFF、AUTO OFF，不部署、不建正式表、不改正式 Secrets、不發真實 Grant。**

## 1. 來源與現況

已讀 LIZHI-AI-BOOT/1.0.0、LIZHI-AI-RULES/1.0.0、v1.5/v1.6/v1.7、候選 host/route/SQL、原工作台最新 context/handoff。原 v1.7 本地全套重跑 **206/206**，舊版完成事項未重做。

原 Site `appgprj_6ad8267ce66c8191899aa5edc0c681af`：

|檢查|實際證據與界線|
|---|---|
|正式版本|Sites get_site latest_version=24；對應 deployment `appgdep_6adf5b0f5f588191bb75da8b3f6e1096` 實讀 succeeded；網址 `https://lizhi-animation-flow.lihuany635.chatgpt.site`|
|原始碼 provenance|v24 saved source `8055ebb0860f8bb2ca1593588072a4fe56b512b5`。本地舊 Site checkout 是另一 commit，不能當目前線上完整程式；GitHub 候選碼亦非線上程式|
|私人權限|get_site role=owner；custom policy 僅一個 owner，無群組；automations=[]。這是管理端設定證據，非所有越權測試已完成|
|MCP|mcp_url/oauth_resource 指向原 `/mcp`；本對話載入同工作台73工具，涵蓋既有通用專案、素材圖說、動畫模型與寫回。已實際執行既有 context/handoff；未更動原 `/mcp`。73是本對話載入清單，非本輪從匿名 raw tools/list 取得的完整live schema|
|D1|overview 精確 binding=`DB`、table=`animation_projects`，無Grant/Audit表；沒有讀取原表內私人資料|
|Secrets|管理工具只投影名稱/is_secret：`PRODUCTION_BRIDGE_KEY`、`PRODUCTION_CHATGPT_OWNER` 仍存在且 secret=true；`PRODUCTION_BRIDGE_URL` 非secret key亦存在。沒有查看/輸出 value。存在不等於完整運作健康驗收|
|回退|v24與v23 deployment均實讀succeeded；v23 source `99148c33d344ebf305f2a448372997177c3ee8f5`。優先保存v24原樣為程式回退點；沒有實際執行回退。回退程式不會還原資料庫/上傳檔|

## 2. 官方身分能力與實際負向測試

Sites 官方技能 `references/identity-and-secrets.md` 與 `references/site-mcp-server.md` 明確列出：登入後有 Site-scoped `oai-authenticated-user-id`、email、可選full-name；ID在同Site穩定、跨Site不同。Sites對MCP入口檢查Site可見性；service bypass bearer不提供visitor identity。這是**正式平台支援欄位的文件證據**，修正v1.7僅因公開網頁省略ID而不確定其是否支援的說法。

公開官方頁仍主要列email/full-name，不提供本專案所需的原站anti-spoof保證、簽章驗證函數、撤權即時性或可呼叫session introspection：
- https://learn.chatgpt.com/docs/sites/data-and-connections
- https://learn.chatgpt.com/docs/sites/managing-a-site
- https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites

本輪用無cookie、無Authorization、無service bypass的curl，固定原Site公開域名、不follow redirect，做三次**不會寫入業務資料**的負向請求，摘要如下：

|案例|實際HTTP|證據範圍|
|---|---|---|
|GET `/` 未登入|401，HTML title `Sign in required` / `Log in to access`|原公開域名前門此請求要求登入|
|POST `/mcp` tools/list 未登入|401，沒有工具清單|此匿名MCP discovery被拒|
|POST `/mcp` tools/list 加假ID/email|401，沒有工具清單|測試假subject `V18_FAKE_SUBJECT`，不能僅以這兩個header繞過此入口|

不是使用真實owner ID偽造，沒有讀取Secret來取得owner ID。先前urllib曾只回相同403短字串，未能確認來源，**不把403列為授權PASS**；上表是後續curl明確讀回的401證據。瀏覽器Site landing與終端反應不同，瀏覽器導覽可能受平台訪問路徑影響，不能把瀏覽器能看介紹頁當作匿名可取私人資料，也不能據此假設owner session有效。

**仍未驗證**：獨立源站是否存在/能繞過、以真owner ID標頭攻擊、owner真登入與server principal綁定、不同帳號、登出後session失效、撤權立即生效。沒有發現可在原Site實際使用並提供這些保障的簽章/可信principal callback；不以一般header helper或永久Secret替代。因此候選route仍拒絕；`AI_LOOP_VERIFIED_INGRESS_CALLBACK`只是尚未接通的候選注入點，不是有效Sites環境設定方法。不可把函數字串或mock設定進Secrets。

## 3. 免費額度與管理介面

已使用瀏覽器開啟 `https://chatgpt.com/`；畫面顯示Log in/Sign up，沒有登入的Site管理帳號，因此未能進入原Site Settings/Usage。未要求或讀取密碼/OTP；不以service bypass模擬本人登入。可用Sites native工具沒有當期帳單/用量/DB容量查詢，database overview亦無容量metadata；不能從表名或版本tar大小推算D1使用量。

官方Help Center本輪實讀：Plus/Pro現階段包含hosting，建置/編輯消耗Codex usage；hosting流量/儲存另有共用限制，單Site DB上限10GB。**這些是一般適用文件，不是本帳戶管理畫面的方案、當期餘額或費用硬上限證據**。現階段一般政策比v1.7已有更明確資訊，但仍不足以通過本人的NT$0上線門檻。

|要求|原帳戶判定|
|---|---|
|原Site適用帳戶/hosting方案|NOT_VERIFIED（不能僅用對話記憶中的Plus代替管理資料）|
|當期剩餘量、重置時間|NOT_VERIFIED|
|原D1實際容量|NOT_VERIFIED|
|D1讀寫使用/配額|NOT_VERIFIED|
|Workers/Sites執行用量|NOT_VERIFIED|
|超額確實拒絕執行|NOT_VERIFIED|
|自動額外帳單/credit使用/自動購買風險|NOT_VERIFIED；未啟用或變更任何此類功能|
|真正平台費用hard cap/超額計費開關|NOT_VERIFIED；沒有自行虛構可設定欄位|

不套用Cloudflare原生Free配額作為ChatGPT Sites帳戶餘額。沒有新增API、外部模型、訂閱、新站或付費runner；沒有支付/升級。本輪會消耗既有建置/查詢/CI資源，**沒有帳單讀回，因此不聲稱實際帳單增量已驗證為零**。

## 4. 已修正候選程式與資料風險

- v1.6 verifier缺乏deadline，最初驗證可能永遠等待。現在與request body、run共享受限deadline，驗證器卡住會TIMEOUT，不能發Grant。
- 只看authenticated/subject仍會誤接受過期、撤銷或匿名的normalized principal。現在要求可信callback提供有限`expiresAt`且大於server time，拒絕revoked/isAnonymous。這是host的normalization契約，不是宣稱Sites已有同名API。
- 原本驗證與READ_ATTEMPT audit之間有等待窗口；現在source前再次驗證principal。REVIEW_MATCH audit後亦再驗證，撤權不得成功回傳摘要。不能取消已送達的唯讀請求，但可以丟棄其結果/禁止下一讀。
- 原發證與ISSUED audit分兩次SQL，audit失敗可能留下孤兒grant。現在用D1 `batch`單一transaction寫兩筆；audit失敗整批rollback。依Cloudflare官方D1 API語義，且在本地SQLite transaction實測，**尚未在真實雲端D1驗收**。來源：https://developers.cloudflare.com/d1/worker-api/d1-database/
- 原子UPDATE RETURNING/UNIQUE(owner,request_id)保留；新增兩個獨立SQLite連線的並行run測試，僅一輪能做5讀。
- SQL候選只新增原兩張隔離表及audit時間index，補calls 0..5、revoked 0/1、state enum、正值expires約束；沒有ALTER/DELETE原animation_projects，不在自動migration路徑、不執行正式SQL。

### 保存、清理與一致性

本版沒有清理端點或背景排程；不刪任何原站資料。Grant到期/撤權後仍保留compact ledger，因刪除其UNIQUE request_id將允許舊request重放，不能「過期即整列刪除」。Audit保留30天僅為待本人核定提案，須先匯出核對hash/備份後再授權人工分批清理；不能先刪再補證據。Grant墓碑長期累積與audit儲存/讀寫上限仍需真實額度和容量規劃，額度不明就不啟用。D1真實主庫/副本讀一致性與跨實例撤權尚未實測，本地SQLite不能替代。

## 5. 測試、AUTH與正式操作

本地Node24.22.1全套 **213/213 PASS、0 fail/skip/cancel**（原206＋V18-01~07），候選route syntax及bundle另驗證。新增測試涵蓋過期/撤銷/匿名principal、卡住verifier、稽核期間撤權、發證audit transaction rollback、summary前撤權、schema隔離約束、不同DB連線防重。Sites identity與Bridge/D1介面是mock；SQLite SQL/rollback/reopen/連線、HTTP物件及timeout是本地真實執行。CI必須依本版提交後的實際run/job日誌判定，不能以本檔自動宣稱成功。

**正式Worker AUTH01～AUTH10：全部NOT_TESTED，沒有真實PASS。** 三個外部401是既有前門負向觀測，不能充當部署後正式十項驗收或跨帳號/即時撤權成功。

尚需：登入原帳戶管理畫面查用量/計費控制；補原Site可信principal/來源封鎖與session撤權實證；核定保存/清理與雲端D1一致性方案。未全部達成，**不請求正式部署批准**。條件日後齊備才一次核准原Site差分發布＋兩張隔離表（不改原表）＋短期MANUAL單專案三讀AUTH01～10＋測後OFF，回退至已記錄v24程式且保留隔離表/稽核，不刪DB作回退。任何Secrets新增/變更須另明確列出，本輪沒有此需要或許可。
