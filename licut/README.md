# 立剪（licut）

手機剪片模組。剪輯、預覽、匯出都在瀏覽器裡完成，影片檔只留在手機上。
原始碼另外保存在 licut-web 專案，這個資料夾放的是建置好的成品（`index.html`）。

## 雲端同步與 Claude 遠端剪輯

在立之雲端庫登入後打開立剪，會自動啟用同步（標題旁出現紫色圓點）：

| 資料表 | 誰寫 | 內容 |
|---|---|---|
| `lizhi_licut_projects` | 手機 | `project`：完整時間軸；`summary`：給 Claude 看的摘要（每段在成品裡的秒數） |
| `lizhi_licut_thumbs` | 手機 | 每個素材的縮圖 `thumb` 與 10 格膠卷 `filmstrip`（JPEG data URL） |
| `lizhi_licut_commands` | Claude | 剪輯指令；手機執行後把 `status` 改成 `done` 或 `error` |

資料表由 `supabase/migrations/007_lizhi_licut_sync.sql` 建立，權限只開給核准的帳號。

### 給 Claude：怎麼遠端剪

1. 讀目前狀態：

   ```sql
   select summary, updated_at, device from lizhi_licut_projects;
   select media_id, name, kind, duration, filmstrip from lizhi_licut_thumbs;
   ```

   `filmstrip` 是一張 1600×90 的 JPEG，從左到右是素材均分的 10 格畫面。

2. 送指令（一批算一步，手機上可以復原；任一步失敗整批不套用）：

   ```sql
   insert into lizhi_licut_commands (user_id, label, ops)
   select user_id, '段落間加淡化', '[
     {"op":"set_transition","args":{"clipId":"c_xxx","type":"fade","duration":0.6}},
     {"op":"add_text","args":{"text":"週末去海邊","start":0,"end":3,"y":0.2}}
   ]'::jsonb
   from lizhi_licut_projects;
   ```

3. 幾秒後檢查結果：`select id, status, error, result from lizhi_licut_commands order by id desc limit 5;`
   手機沒開立剪時，指令會停在 `pending`，下次打開時依序執行。

### 可用的操作

時間單位都是秒。片段的 `in`/`out` 是素材內的秒數；文字、字幕、音樂的 `start`/`end` 是成品裡的秒數。
主軌是磁吸式，片段依序排列；轉場掛在「後一段」上，會讓兩段重疊。
文字的 `x`/`y` 是畫面中心點比例（0~1），`size` 以畫面短邊 = 1080 計。

- `add_clip {mediaId, in?, out?, index?, transition?, filters?, volume?}`
- `update_clip {clipId, in?, out?, volume?, filters?, transition?}`，濾鏡 `filters: {brightness -1~1, contrast 0~3, saturation 0~3, preset}`
- `split_clip {time, clipId?}`、`move_clip {clipId, index}`、`remove_clip {clipId}`
- `set_transition {clipId, type, duration?}`，type：none fade dissolve fadeblack fadewhite wipeleft wiperight slideleft slideright smoothleft circleopen radial pixelize zoomin
- preset：none mono sepia warm cool vintage vivid
- `add_text {text, start, end, x?, y?, size?, color?, stroke?, strokeColor?, box?, boxColor?, boxOpacity?}`、`update_text {textId, ...}`、`remove_text {textId}`
- `add_music {mediaId, start?, in?, out?, volume?, fadeIn?, fadeOut?}`、`update_music {musicId, ...}`、`remove_music {musicId}`
- `set_captions {items:[{start,end,text}]}`、`add_caption`、`update_caption {captionId, ...}`、`remove_caption`、`clear_captions`、`set_caption_style {size?, color?, y?, box?, boxOpacity?}`
- `set_project {name?, width?, height?, fps?}`
