/* 立剪 × 圖書館：使用既有登入與 lizhi-library 私有 Storage。
   只讀圖書館中屬於本人的雲端影片；原始檔下載後交給立剪自己的匯入 UI。
   不使用 service key、不修改時間軸、不公開檔案，也不刪除圖書館原件。 */
(function (root) {
  "use strict";

  const BUCKET = "lizhi-library";
  const TABLE = "lizhi_library_items";
  const MAX_BYTES = 50 * 1024 * 1024;
  const EXT = /\.(mp4|webm|mov)$/i;
  const MIME = /^video\/(mp4|webm|quicktime)$/i;
  const WAIT_MS = 90000;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const safeName = (name) => String(name || "video.mp4").replace(/[\\/]/g, "_").slice(0,250);

  function session() {
    const auth = root.LizhiAuth;
    if (!auth?.client || !auth.user?.id) {
      throw new Error("請先以本人帳號登入立之雲端庫");
    }
    return { client: auth.client, user: auth.user };
  }

  function candidate(row) {
    return row && row.location === "cloud"
      && (MIME.test(row.mime || "") || EXT.test(row.file_name || ""))
      && Number(row.size) > 0 && Number(row.size) <= MAX_BYTES;
  }

  async function listVideos() {
    const {client, user} = session();
    const {data, error} = await client.from(TABLE)
      .select("id,user_id,file_name,mime,size,location,storage_path,created_at")
      .eq("user_id", user.id)
      .eq("location", "cloud")
      .is("deleted_at", null)
      .order("created_at", {ascending:false})
      .limit(200);
    if (error) throw new Error("讀取圖書館素材失敗："+error.message);
    return (data || []).filter(candidate).map((row) => ({
      ...row, file_name: safeName(row.file_name)
    }));
  }

  function editor() {
    const frame = document.querySelector("#licut-frame");
    if (!frame?.contentWindow || frame.contentWindow.location.origin !== location.origin) {
      throw new Error("立剪畫面尚未載入");
    }
    const win = frame.contentWindow;
    if (typeof win.licut?.project !== "function") {
      throw new Error("立剪正在初始化，請稍後操作");
    }
    return win;
  }

  function storedInLicut(win, mediaId, size) {
    return new Promise((resolve) => {
      let req;
      try { req = win.indexedDB.open("licut", 1); }
      catch { return resolve(false); }
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
      req.onupgradeneeded = () => { req.transaction?.abort(); resolve(false); };
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("files")) { db.close(); return resolve(false); }
        const tx = db.transaction("files", "readonly");
        const get = tx.objectStore("files").get(mediaId);
        get.onsuccess = () => {
          const f = get.result;
          resolve(f instanceof win.Blob && f.size === size);
        };
        get.onerror = () => resolve(false);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
        tx.onabort = () => db.close();
      };
    });
  }

  async function importVideo(row, announce = () => {}) {
    if (!candidate(row)) throw new Error("不是可匯入的圖書館雲端影片");
    const {client, user} = session();
    if (row.user_id !== user.id) throw new Error("影片不屬於目前登入者");
    const path = String(row.storage_path || "");
    if (!new RegExp("^" + user.id.replace(/[-]/g, "\\-") + "/[a-z0-9-]+\\.(mp4|webm|mov)$", "i").test(path)) {
      throw new Error("雲端影片路徑不符合圖書館規格");
    }
    const win = editor();
    announce("從私人圖書館取回原始影片…");
    const {data: blob, error} = await client.storage.from(BUCKET).download(path);
    if (error || !blob) throw new Error("雲端原檔下載失敗："+(error?.message || "未知錯誤"));
    if (blob.size !== Number(row.size) || !blob.size || blob.size > MAX_BYTES) {
      throw new Error("影片大小不一致；為保護原始素材已取消匯入");
    }
    const original = new win.File([blob], row.file_name, {
      type: MIME.test(row.mime || "") ? row.mime : blob.type || "video/mp4"
    });
    const input = win.document.querySelector('aside[aria-label="素材庫"] input[type="file"][multiple]');
    if (!input) throw new Error("請先在立剪開啟「素材庫」，再按匯入");
    const before = new Set(win.licut.project().media.map((m) => m.id));
    const files = new win.DataTransfer();
    files.items.add(original);
    input.files = files.files;
    announce("已交給立剪原生匯入，核對本機儲存中…");
    input.dispatchEvent(new win.Event("change", {bubbles:true}));

    const start = Date.now();
    while (Date.now() - start < WAIT_MS) {
      if (!win.document.isConnected) throw new Error("立剪畫面已關閉");
      const media = win.licut.project().media.find((m) =>
        !before.has(m.id) && m.name === original.name && Number(m.size) === original.size);
      if (media && await storedInLicut(win, media.id, original.size)) {
        return {status:"imported", name:original.name, mediaId:media.id, bytes:original.size,
          note:"已確認立剪 IndexedDB 保存原始影片；沒有自動加入時間軸"};
      }
      await sleep(600);
    }
    throw new Error("尚未能核對立剪本機儲存，不能標示成功；請檢查素材庫後再操作");
  }

  function make(tag, label, css) {
    const e = document.createElement(tag);
    if (label) e.textContent = label;
    if (css) e.style.cssText = css;
    return e;
  }
  const btnStyle = "padding:8px 10px;border:1px solid #576079;border-radius:8px;background:#343f55;color:#f3f4f8;cursor:pointer";
  function mount() {
    const section = document.querySelector(".licut-embedded");
    if (!section || section.querySelector("#licut-library-bridge")) return;
    section.style.position = "relative";
    const rootEl = make("section",null,"position:absolute;left:12px;bottom:12px;z-index:30;font:13px system-ui,sans-serif;max-width:calc(100% - 24px)");
    rootEl.id = "licut-library-bridge";
    const toggle = make("button","☁ 從圖書館匯入",btnStyle);
    toggle.type = "button";
    const panel = make("div",null,"position:absolute;bottom:42px;left:0;background:#1c222e;color:white;padding:12px;border:1px solid #647087;border-radius:10px;width:min(330px,calc(100vw - 32px));max-height:60vh;overflow:auto;box-shadow:0 5px 22px #0009");
    panel.hidden = true;
    const head = make("strong","圖書館雲端影片");
    const explain = make("p","只能匯入圖書館已上傳的私有影片。它會下載到本機立剪素材庫，不會自動加入時間軸。","font-size:12px;color:#bcc4d0");
    const refresh = make("button","重新整理",btnStyle);
    refresh.type = "button";
    const status = make("p","", "font-size:12px;white-space:pre-wrap;color:#cfe3fd");
    status.setAttribute("role","status");
    const list = make("div");
    const say = (msg) => { status.textContent = msg; };
    async function populate() {
      say("讀取圖書館私人影片清單…");
      list.replaceChildren();
      const files = await listVideos();
      if (!files.length) list.append(make("p","目前圖書館雲端沒有可用影片。先到「圖書館」上傳影片。"));
      for (const row of files) {
        const item = make("div",null,"border-top:1px solid #444e60;padding:8px 0;overflow-wrap:anywhere");
        item.append(make("div",row.file_name + " · " + (row.size/1048576).toFixed(2)+" MiB"));
        const add = make("button","匯入立剪",btnStyle);
        add.type = "button";
        add.addEventListener("click",async() => {
          add.disabled = true;
          try { const v = await importVideo(row,say); say("已成功加入素材庫："+v.name); }
          catch (e) { say("未完成："+(e?.message||String(e))); }
          finally { add.disabled = false; }
        });
        item.append(add); list.append(item);
      }
      say(files.length ? ("找到 "+files.length+" 支圖書館雲端影片。") : "尚無影片；不會讀取其他人的資料。");
    }
    refresh.addEventListener("click",() => populate().catch(e => say("讀取失敗："+e.message)));
    toggle.addEventListener("click",() => { panel.hidden = !panel.hidden; if (!panel.hidden) populate().catch(e => say("讀取失敗："+e.message)); });
    panel.append(head,explain,refresh,status,list);
    rootEl.append(toggle,panel);section.append(rootEl);
  }
  if (typeof document !== "undefined") {
    const observer = new MutationObserver(() => mount());
    observer.observe(document.documentElement,{childList:true,subtree:true});
    mount();
  }
  root.LiCutLibraryBridge = Object.freeze({listVideos,importVideo});
})(window);
