# pre-hades-v3.0 備份說明

HADES-v3.0（2026-10-26）以 EP02 23 張圖說資料包整棟重建 `model-viewer/hades-house.glb`。舊版未刪除，可完整還原：

| 版本 | 位置 | SHA-256 |
|---|---|---|
| HADES-v2.4（換版前 Pages 正式部署版） | `revisions/hades-v2.4/transfer/`（gzip 分割檔＋manifest，可組回原檔） | `3e9954932b51c04f0d9c7b3750b978e93cda6b9b260049eae8988dd37a5bc21c` |
| v2.3（換版前 repo 內原始檔） | `backups/pre-hades-v2.4/hades-house.glb` | `ff59c749ba4184d1fd74c5086f86e4c89bcc553aa6d0f6458ab89f03ecb4dccb` |

還原：把對應檔案放回 `model-viewer/hades-house.glb`，並同步修改 `current-models.json` 的 `current_sha256`（檢視器會比對 SHA）。
