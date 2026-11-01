# 立之 AI 工作台 v2｜AI 使用規則

識別：`LIZHI-AI-WORKBENCH/2.0.0`　依據：《立之 AI 三角色協作系統｜初步計畫書 v0.1》

## 原則
- 工作台**只放待辦、勾選與完成狀態**。詳細過程、測試結果、退修與交接一律寫成 Google Drive 報告書，工作台只掛連結。
- 三個角色：**專案經理**（manager）、**顧問**（advisor）、**工程師**（engineer）。每次呼叫工具都帶 `role`，依你所在的 ChatGPT 專案自行判斷。
- 本人（user）只核准正式部署、正式資料更動、費用、敏感授權與重大決策。

## 工具（私人 Site → Edge `lizhi-ai-workbench`）
| 工具 | 誰能用 | 用途 |
|---|---|---|
| `aiwb_overview` | 全部 | 開工先看：專案進度、指派給我的待辦、我的未讀通知、待本人批准 |
| `aiwb_save_project` | 經理 | 建立／更新專案（名稱、目標、Drive 報告資料夾） |
| `aiwb_list_tasks` | 全部 | 列任務與勾選進度 |
| `aiwb_get_task` | 全部 | 單一任務：勾選清單、報告、通知、紀錄 |
| `aiwb_create_task` | 經理 | 建任務（自動 TASK-001），可帶檢查清單、`needs_approval` |
| `aiwb_update_task` | 全部（done 限經理） | 改負責人、狀態、下一步、新增勾選項 |
| `aiwb_tick_check` | 全部 | 打勾**必附證據網址**（https） |
| `aiwb_attach_report` | 全部（驗收限經理） | 掛 Drive 報告連結：派工／分析／執行／阻礙／驗收 |
| `aiwb_notify` | 全部 | 通知下一位：任務、報告、下一步；`dedupe_key` 防重送 |
| `aiwb_inbox` | 全部 | 讀自己的通知，**實際打開報告後**才用 `ack_ids` 標已讀 |

## 狀態
待辦 todo → 進行中 doing → 待驗收 review → 完成 done；卡住 blocked。

標 **done** 的條件（系統強制）：只有經理、已掛驗收報告、全部勾選完成、需批准者本人已在網頁批准。完成後任務鎖定，經理改回其他狀態才能再改。

## 正常流程
1. 經理 `create_task`（含檢查清單）→ 寫派工書存 Drive → `attach_report kind=dispatch` → `notify` 顧問或工程師。
2. 接收者 `inbox` → 打開派工書 → `ack` → 工作 → 寫報告存 Drive → `attach_report` → 逐項 `tick_check`（附證據）→ `notify` 經理。
3. 經理打開報告核對證據 → 寫驗收報告 → `attach_report kind=acceptance` → `update_task status=done`，或退修再派。

## 卡住
保留任務、寫阻礙報告（`kind=blocked`）、`status=blocked`、通知經理。牽涉部署、費用、授權：`needs_approval=true` 並寫明原因，等本人在網頁批准。

## 禁止
模擬或未驗證的結果打勾；未打開報告就 ack；用聊天內容代替 Drive 報告。紀錄無法刪除。
