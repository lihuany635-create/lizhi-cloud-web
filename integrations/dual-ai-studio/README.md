# 雙AI工作室（Dual AI Studio）｜跨 AI 協作聊天室原型

讓使用者、Claude（Claude Code）與 Codex 在同一個聊天室討論、互相 @、接任務、開發，並交叉審查。
目前是 **P1 本機原型**：只在一台 Windows 電腦上執行，聊天室是本機網頁 `http://127.0.0.1:8300`。

- 研究與實測報告：[docs/P0-P1-研究與實測報告.md](docs/P0-P1-研究與實測報告.md)
- 聊天室底層：[agentchattr](https://github.com/bcurts/agentchattr)（MIT，v0.5.0），本資料夾內為**含 Windows 修補的副本**

## 運作方式

```
你（瀏覽器，本機網頁）
   ⇅
聊天室伺服器 agentchattr（本機，傳話＋存紀錄）
   ⇅                    ⇅
Claude 代理            Codex 代理          ← 背景執行的 Claude Code / Codex CLI
（Claude 訂閱登入）     （ChatGPT 訂閱登入）
   ↓                    ↓
      測試資料夾 test-repo（寫程式、跑測試、git）
```

## 使用方式（Windows）

前置：Python 3.11+、已登入的 Claude Code（`%USERPROFILE%\.local\bin\claude.exe`）、以 npm 安裝並登入的 Codex CLI。

1. 在 `agentchattr` 建立虛擬環境並安裝依賴：`python -m venv .venv`，接著 `.venv\Scripts\pip install -r requirements.txt`
2. 在 `agentchattr` 的上一層建立 `test-repo`（`git init`）。這是代理的工作資料夾。
3. 以 `powershell -STA -File agentchattr\studio.ps1` 開啟控制面板，也可以為它建立桌面捷徑。

| 檔案 | 用途 |
|---|---|
| `agentchattr/studio.ps1` | 控制面板：啟動、打開聊天室、查看 AI、關閉全部，可勾選安全模式 |
| `agentchattr/start-chat.ps1` / `.bat` | 在背景啟動。預設為自動模式；`-Safe` 為每個動作先詢問；`-Visible` 顯示代理視窗 |
| `agentchattr/stop-chat.ps1` / `.bat` | 一鍵關閉，只關閉本資料夾啟動的程式 |
| `agentchattr/show-agents.ps1` / `.bat` | 叫出背景中的代理視窗；`-Hide` 再藏回背景 |

**自動模式的安全提醒**：Codex 以 `approval_policy=never` 加 `danger-full-access` 執行，技術上能存取整台電腦；不用時請關閉。合併、推送、刪除等最終決策仍由使用者決定。

## 對 agentchattr 的修補（相對上游 v0.5.0）

| 檔案 | 修補內容 | 原因 |
|---|---|---|
| `wrapper.py` | 新增 `codex_direct` 注入模式：Codex 直接連 MCP 伺服器，憑證走環境變數，聊天工具自動允許 | 本機轉接程式的回應在測試機上被改壞（多出 chunked 標頭），Codex 讀不到聊天工具 |
| `mcp_proxy.py` | `_safe_read()`：錯誤回應被截斷時不中斷 | 防止轉接執行緒當掉 |
| `config.toml` | Claude 和 Codex 改用 `claude.exe`、`codex.exe`，工作資料夾改為 `../test-repo` | 避開 `codex.cmd` 吃掉引號，並避免使用者自訂的外掛啟動器 |
| 新增腳本 | `start-chat`、`stop-chat`、`show-agents`、`studio`、`tools/console_window.py` | 背景執行、身分重設（名稱固定為 claude／codex）、只用傳統主控台 |

## 交接紀錄（LIZHI-AI-RULES 1.0.0）

```yaml
policy_id: LIZHI-AI-RULES
policy_version: 1.0.0
project_id: unknown            # 未取得 AI 工作台存取權，未對應工作台專案
task_id: 未建立
working_revision: main@58624d4（本 PR 的基底）
goal: 跨 AI 協作聊天室 P0 可行性研究與 P1 本機原型
completed:
  - P0 研究：排除 Switch（Apache-2.0 + Commons Clause，非 OSI 開源），選定 agentchattr（MIT）
  - P1 本機實測（Windows 11，Claude Pro + ChatGPT Plus 訂閱）
  - 一鍵背景啟動、關閉、控制面板
verification:
  state: PASS
  scope: >-
    2026-11-21 單台 Windows 電腦實測：AI 互相 @ 觸發、4 跳防迴圈、Codex 開發並 commit、
    Claude 讀 diff 跑測試並以 PASS 審查、伺服器重啟後紀錄保留、背景模式下兩代理回覆
  evidence:
    - 測試倉庫 test-repo commit 67e8b30（feature/hello，未推送）
    - 聊天紀錄訊息 #25-#26、#36-#41、#43-#52（本機 agentchattr 資料，未上傳）
not_verified:
  - 「轉成工作」介面按鈕（兩次無反應；改由 AI 提議 + 人工 Accept 才建立 Job，且未自動派工）
  - 自動模式下由新腳本啟動（只以安全模式實測）
  - 控制面板各按鈕的點擊（面板顯示已確認）
  - 手機與遠端存取、雲端部署
blockers:
  - 工作台未同步（無 aiwb 工具）
next_action: 使用者審閱本 PR；之後評估 P2（任務狀態機、PASS/FAIL 修正上限、GitHub PR 綁定）
user_action_required: 審閱並決定是否合併本 PR
handoff_saved: 僅本 PR，未寫入工作台
```
