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

進階工具（參考 Premiere）：

- 片段與子母畫面共用參數（`add_clip`／`update_clip`／`add_overlay`／`update_overlay`）：
  - `speed` 0.1~8（變速，長度跟著變）、`reverse`（倒轉，不播聲音）、`freeze` 秒數（定格）
  - `transform {scale, x, y, rotate, opacity, fit}`：`scale` 1 = 原大小；`x`/`y` 是畫面寬高的比例位移；`rotate` 角度；`fit` 為 `contain`（完整顯示）或 `cover`（填滿畫面）
  - `crop {l, t, r, b}`（0~0.45）
  - `filters` 另有 `temperature` -1~1、`tint` -1~1、`vignette` 0~1、`blur` 0~1、`sharpen` 0~1
  - `muted`、`fadeIn`、`fadeOut`（片段本身聲音的淡入淡出）
- `freeze_frame {time, duration?, clipId?}`：在時間點插入定格畫面
- `ripple_delete {clipId}`：刪除片段，後面的文字、字幕、音樂、子母畫面、標記一起往前移
- `duplicate {clipId | textId | captionId | musicId | overlayId}`
- 關鍵影格：`set_keyframe {clipId | overlayId, prop, time, value}`、`remove_keyframe {..., prop, time}`、`clear_keyframes {..., prop?}`
  - `prop`：scale x y rotate opacity volume
  - `time` 是片段內的秒數（0 = 片段開頭），中間會平滑內插
- 子母畫面（疊在主軌上、可自由擺放時間）：`add_overlay {mediaId, start, in?, out?, ...}`、`update_overlay {overlayId, ...}`、`remove_overlay {overlayId}`
- 標記：`add_marker {time, label?, color?}`、`update_marker {markerId, ...}`、`remove_marker {markerId}`
- 自動壓低配樂：`set_ducking {enabled?, source?, level?, fade?, segments?}`
  - `source: captions` 表示有字幕的地方就壓低；`segments` 用 `[[start, end]]` 指定說話段落
  - `level` 是壓低後的音量倍數

精確剪輯與批次操作：

- `ripple_trim {clipId, in?, out?, ...}`：修剪主軌片段，後面其他軌一起前後移
- `slip_clip {clipId | overlayId, delta}`：滑移（長度不變，換用素材的另一段，delta 為素材秒數）
- `split_all {time}`：所有軌一起切開
- `shift_items {items: [{kind, id}], delta}`：批次移動文字／字幕／音樂／子母畫面／標記
- `remove_items {items: [{kind, id}]}`：批次刪除（kind 可含 clip）
- `tag_media {mediaId, name?, tags?, scene?, note?, rating?}`：素材整理

### 其他控制方式

- 頁面內：`window.licut`（`run(ops, label)`、`op`、`project()`、`summary()`、`seek`、`play`、`pause`、`undo`、`redo`、`history()`、`on(fn)`）
- 同網站外層頁面：`iframe.contentWindow.postMessage({licut: 'run', id, ops, label}, origin)`，回覆 `{licutReply: id, ok, result | error}`；指令另有 `summary`、`project`、`undo`、`redo`、`seek`、`play`、`pause`、`script`
- 立剪裡的「腳本」面板：貼 JSON 操作陣列或 JavaScript

畫面與調色（片段與子母畫面共用）：

- `filters` 另有 `exposure` -3~3（檔）、`highlights`／`shadows` -1~1
- `curves {master | r | g | b: [[x, y], …]}`：曲線，0~1，`null` 代表重設
- `lut {id, intensity}`
  - 內建 id：`bi:tealorange`、`bi:fade`、`bi:noir`、`bi:golden`、`bi:night`、`bi:film`、`bi:vivid`
  - 匯入的 .cube 存在手機上，專案的 `luts` 只記名稱
- `mask {shape: none | rect | ellipse, x, y, w, h, feather, invert}`：遮罩，座標以片段畫面為準（0~1）
- `chroma {enabled, color, similarity, smooth, spill}`：色鍵去背
- `blend`（子母畫面）：`normal`、`screen`、`multiply`、`add`、`lighten`、`darken`
- 關鍵影格：`prop` 多了 `speed`（速度曲線）；`set_keyframe` 可加 `ease`（`ease`、`linear`、`in`、`out`、`hold`）
- 轉場另有：`whipleft`、`whipright`、`spin`、`zoomblur`、`glitch`、`flash`、`blurfade`、`wipeup`、`doorway`

音訊工作台：

- 片段、子母畫面、音樂都能加：`eq {low, mid, high}`（dB，-15~15）、`denoise`（0~1，頻譜降噪）、`norm`（標準化補償 dB）、`muted`
- `set_mix {main?, overlay?, music?, master?, muted?: {main?, overlay?, music?}, limiter?}`：混音台（各軌與總音量 0~4、靜音、限制器）

字幕系統：

- 多語字幕軌：`add_caption_track {name, lang, copyFrom?, keepText?}` → `{track}`、`update_caption_track {track, name?, lang?, visible?}`、`remove_caption_track {track}`
- `set_captions`、`add_caption`、`clear_captions`、`set_caption_style` 可加 `track`（主字幕是 `main`）；`update_caption`／`remove_caption` 會在所有軌找
- 逐字字幕：字幕可帶 `words: [[start, end, 字], …]`；`set_caption_style {mode: normal | karaoke | typewriter, hiColor, anim: none | fade | pop | slideup}`
- 文字動畫：`add_text`／`update_text` 的 `anim {in, out, dur}`
  - `in`：none、fade、pop、slideup、slideleft、zoom、typewriter
  - `out`：none、fade、slidedown、shrink
- SRT／VTT 匯入匯出在立剪的字幕面板

預覽與輸出（只在手機上操作，沒有遠端指令）：

- 代理檔：540p、每 0.5 秒一個關鍵格；存在手機的 IndexedDB，預覽用代理檔，匯出一律用原始檔
- 預覽解析度：流暢、標準、清晰三段
- 匯出用 WebCodecs，即時算出、直接編碼：
  - 編碼：H.264、H.265、VP9，依裝置支援自動停用不能用的
  - 解析度：原始、4K、1080p、720p、480p；幀率 24～60
  - 範圍：整支、自訂、依標記切段
  - 可排批次佇列
  - 沒有 WebCodecs 的瀏覽器會改用 MediaRecorder
- 純音訊：WAV（無損）或 M4A，離線混音，比即時快

遮罩轉場：

- `mask.shape` 多了 `linear`（線性遮罩，`angle` 為角度）
- 關鍵影格 `prop` 多了 `maskX`、`maskY`、`maskAngle`
- `make_mask_transition {clipId, duration?, direction?: left | right}`：把前一段的結尾移到子母畫面，用線性遮罩帶出這一段（物體帶過去的無縫轉場）

軌道鎖定與隱藏：

- `set_track {track, locked?, hidden?}`
  - `track`：`text`、`overlay`、`video`、`caption`、`music`，或語言字幕軌 `ct:<id>`
- 鎖定的軌道不能選取或拖曳，波紋刪除、波紋修剪、全軌切割也不會動到它
- 隱藏的軌道不顯示、也不匯出；音樂軌隱藏就是靜音

其他：

- 片段 `bgFill: none | blur`：橫轉直的模糊背景填滿
- `update_clip`／`update_overlay` 可直接給 `keys {prop: [[time, value, ease?], …]}`
- `cut_ranges {ranges: [[start, end], …]}`：剪掉這幾段時間，後面的東西一起往前補（例如去靜音）

### 音效、旁白、節拍、文字樣式、貼圖
- `add_music {..., track: 'sfx'}`：放到「音效」軌（內建音效、錄的旁白都在這軌，不會被自動壓低）；`update_music {musicId, track: 'music' | 'sfx'}` 可換軌；`set_mix` 多了 `sfx`
- `set_track {track: 'sfx', hidden?, locked?}`：音效軌整軌靜音／鎖定
- 文字：`font`（`sans` 黑體、`serif` 明體、`kai` 文楷、`round` 粉圓、`hei` 港式黑體）、`glow` 0~1、`glowColor`、`rotate`（度）
- 形狀貼圖：`add_text {shape: rect | circle | arrow | line | bubble | star | heart, w, h, color（外框）, stroke（粗細）, fill, fillOpacity, ...}`；表情貼圖就是 `text` 放 emoji
- 節拍偵測在音樂的屬性面板：每拍／每小節加標記（標籤 `♪`）、依小節切開主軌

### 特效與轉場（一鍵）
- 轉場另有：`wipedown`、`slideup`、`slidedown`、`whipup`、`whipdown`、`zoomout`、`diamond`、`heart`、`blinds`、`squeeze`、`rgbsplit`、`lightleak`、`ripple`、`shake`、`blocks`、`dreamy`、`crosszoom`、`dipblack`、`pageturn`
- `vfx {type, amount}`（片段、子母畫面）：動態特效，`null` 關閉。type：`shake` `glitch` `rgbsplit` `vhs` `oldfilm` `grain` `leak` `strobe` `soul` `breathe` `fisheye` `mirror` `kaleido` `split3` `pixelate` `rainbow` `posterize` `invert` `sketch` `cctv`，趣味：`snow` `hearts` `sparkles` `confetti` `rain` `tiktok` `tvonoff` `camcorder` `letterbox` `spotlight` `flare` `nightvision` `thermal` `colorpop` `neon` `halftone` `warhol` `grid9` `kaleido6` `infinite` `swirl` `wave` `heat` `pixel8`
- 「特效」分頁的一鍵動畫（入場／出場／強調／運鏡）、一鍵風格、轉場面板的無縫轉場，都是用 `set_keyframe`、`filters`、`lut`、`vfx`、`set_transition` 組合出來的
