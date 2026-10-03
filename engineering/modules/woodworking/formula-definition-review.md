# Woodworking Formula Definition Review — Phase 3

審查日期：2026-10-04

## 已核准發布（v1.0.0）

| formula_id | 定義 | canonical unit / representation | rounding | 專業限制 |
| --- | --- | --- | --- | --- |
| `woodworking.board-area` | `length × width × quantity` | 尺寸轉為 m，結果 m² | 4 位小數 | 面積估算，不是 BOM／裁切最佳化 |
| `woodworking.board-quantity` | `required_area × (1 + waste_rate) ÷ single_board_area`；建議張數明確使用 `ceil` | 面積 m²；損耗率為小數 | 面積與 raw count 4 位小數；張數向上取整 | 不考慮排版、木紋、鋸路、餘料與缺陷 |
| `woodworking.waste-factor` | `base × (1 + waste_rate)` | 損耗率固定為小數，`0.1 = 10%` | 4 位小數 | 超過 50% 顯示 warning；最大 200% |
| `woodworking.timber-weight` | `length × width × thickness × density` | 尺寸 m、密度 kg/m³、重量 kg | 4 位小數 | 密度必須由使用者輸入；結果為估算 |
| `woodworking.slope-angle` | `atan2(rise, run)` | 尺寸 m、角度 degree | 3 位小數 | 僅為直角三角形 rise/run 坡度角 |

每條正式公式均包含 Input Schema、單位契約、Validation、Rounding、Warnings、Applicability、Assumptions 與綁定 formula id/version 的 Golden Samples。

## 未核准／未發布

| 候選 | status | 原因 |
| --- | --- | --- |
| 木料材積／才 | `NEEDS_CONFIRMATION` | 專案內沒有可信的台灣木材交易「才」定義、尺寸單位、進位規則或來源，不得自行假設。 |
| 等角接合斜切 | `NEEDS_CONFIRMATION` | Phase 3 只核准明確的 rise/run 坡度角；不同接合幾何應使用另一個 formula_id 並另行審查。 |

本次不建立材料資料庫；不實作 BOM、Cutting Optimization、家具模型、2D/3D、Quote 或 AI。
