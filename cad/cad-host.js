/* 立之 CAD：同來源 WASM 框架宿主；只傳明確選取的圖檔，不提供網路檔案 API。 */
(function () {
  "use strict";
  const DB_NAME = "lizhi-cad-local";
  const DB_STORE = "permissions";
  const RECOVERY_STORE = "recovery";
  let saveQueue = Promise.resolve();
  let pendingSaves = 0;
  let dirtyDrawing = false;
  const MAX_BYTES = 32 * 1024 * 1024;
  let panel = null;
  let frame = null;
  let folder = null;
  let ready = false;
  let listening = false;
  let currentName = "Drawing.dxf";
  let allowAiControl = false;
  const pendingCadCommands = new Map();

  function status(message, error) {
    const element = panel?.querySelector("#cad-status");
    if (element) {
      element.textContent = message;
      element.dataset.error = error ? "true" : "false";
    }
  }
  function safeName(value) {
    const basename = String(value || "Drawing.dxf").split(/[\/\\]/).pop() || "Drawing.dxf";
    return basename.replace(/[<>:"|?*\u0000-\u001f]/g, "_").slice(0, 120) || "Drawing.dxf";
  }
  function download(name, bytes) {
    const filename = safeName(name);
    const ext = filename.split(".").pop().toLowerCase();
    const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "pdf" ? "application/pdf" : "application/octet-stream";
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function database() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
        if (!db.objectStoreNames.contains(RECOVERY_STORE)) db.createObjectStore(RECOVERY_STORE, { keyPath: "id" });
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }
  async function storedFolder(value) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, value === undefined ? "readonly" : "readwrite");
        const req = value === undefined ? tx.objectStore(DB_STORE).get("cad-directory") : tx.objectStore(DB_STORE).put(value, "cad-directory");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  }

  // A save message marks the Rust engine clean before the parent can finish disk I/O.
  // Persist an emergency browser-local copy first, and retain it until verified disk write.
  async function recoveryTx(mode, operation) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(RECOVERY_STORE, mode);
        let result;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error("recovery transaction failed"));
        tx.onabort = () => reject(tx.error || new Error("recovery transaction aborted"));
        const request = operation(tx.objectStore(RECOVERY_STORE));
        request.onsuccess = () => { result = request.result; };
      });
    } finally {
      db.close();
    }
  }
  async function storeRecovery(filename, bytes) {
    const id = crypto.randomUUID();
    await recoveryTx("readwrite", store => store.put({
      id, name: filename, at: new Date().toISOString(),
      data: new Blob([bytes], { type: "application/octet-stream" })
    }));
    return id;
  }
  const getRecoveries = () => recoveryTx("readonly", store => store.getAll());
  const clearRecovery = id => recoveryTx("readwrite", store => store.delete(id));
  async function refreshRecoveryButton() {
    try {
      const entries = await getRecoveries();
      const button = panel?.querySelector('[data-cad-action="recovery"]');
      if (button) button.textContent = entries.length ? "救援存檔（" + entries.length + "）" : "救援存檔";
    } catch {
      // Browser storage can be disabled or full; the drawing engine remains usable.
    }
  }
  async function showRecoveries() {
    const container = panel?.querySelector("#cad-recovery-list");
    if (!container) return;
    container.replaceChildren();
    let entries;
    try { entries = await getRecoveries(); }
    catch {
      status("無法讀取本機救援檔案，請檢查瀏覽器儲存權限。", true);
      return;
    }
    entries.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (!entries.length) {
      container.textContent = "沒有待救援的存檔。";
    }
    for (const entry of entries) {
      const line = document.createElement("div");
      line.className = "cad-recovery-item";
      const caption = document.createElement("span");
      caption.textContent = safeName(entry.name) + " · " + String(entry.at).slice(0, 19);
      const restore = document.createElement("button");
      restore.type = "button"; restore.className = "button";
      restore.textContent = "再次下載";
      restore.dataset.cadRecoveryDownload = entry.id;
      const discard = document.createElement("button");
      discard.type = "button"; discard.className = "button danger";
      discard.textContent = "確認已有備份後刪除";
      discard.dataset.cadRecoveryDelete = entry.id;
      line.append(caption, restore, discard);
      container.append(line);
    }
    container.hidden = false;
    await refreshRecoveryButton();
  }

  async function permitted(mode) {
    if (!folder || typeof folder.queryPermission !== "function") return false;
    return (await folder.queryPermission({ mode })) === "granted";
  }
  async function selectFolder() {
    if (typeof window.showDirectoryPicker !== "function") {
      status("此瀏覽器不支援資料夾授權；仍可直接下載 DXF 檔案。", true);
      return;
    }
    try {
      folder = await window.showDirectoryPicker({ mode: "readwrite", id: "lizhi-cad-drawings" });
      if (!await permitted("readwrite")) {
        status("未授權資料夾寫入。CAD 仍可使用，但儲存改為下載。", true);
        return;
      }
      try { await storedFolder(folder); }
      catch { status("已授權資料夾，但瀏覽器未能記住授權；下次需重新選取。"); return; }
      status("本機 CAD 資料夾已授權。DXF 儲存將保留獨立版本；不會上傳原檔。");
    } catch (error) {
      if (error?.name !== "AbortError") status("資料夾無法存取；CAD 儲存會改為下載。", true);
    }
  }
  async function restoreFolder() {
    try {
      folder = await storedFolder() || null;
      if (folder && await permitted("readwrite")) status("本機 DXF 資料夾已連結，可以建立歷史版本。");
      else if (folder) status("先前的資料夾仍有紀錄，但權限已失效；請重新選擇資料夾。");
    } catch {
      status("本機資料夾授權紀錄無法讀取；仍可以匯入與下載圖檔。", true);
    }
  }
  function openDrawing(name, buffer) {
    if (!ready || !frame?.contentWindow) {
      status("CAD 繪圖引擎尚未準備完成，請稍後重新開啟圖檔。", true);
      return;
    }
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      status("圖檔為空或超過 32 MiB，已拒絕載入。", true);
      return;
    }
    currentName = safeName(name);
    frame.contentWindow.postMessage({ type: "cadcraft:open", name: currentName, bytes: buffer }, location.origin, [buffer]);
    status("已傳送「" + currentName + "」給本機 CAD 引擎，請在繪圖區確認載入結果。");
  }
  async function saveRevision(name, bytes) {
    const filename = safeName(name);
    let recoveryId = null;
    try {
      // Durable before filesystem write: browser-only IndexedDB, never uploaded to an API.
      recoveryId = await storeRecovery(filename, bytes);
    } catch {
      status("瀏覽器緊急備份不可用，正在嘗試正常寫入／下載。請勿關閉頁面。", true);
    }
    try {
      if (/\.dxf$/i.test(filename) && await permitted("readwrite")) {
        const directory = await folder.getDirectoryHandle("revisions", { create: true });
        const prefix = filename.replace(/\.dxf$/i, "");
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const revision = prefix + "-" + stamp + "-" + crypto.randomUUID() + ".dxf";
        const handle = await directory.getFileHandle(revision, { create: true });
        const writer = await handle.createWritable({ keepExistingData: false });
        try {
          await writer.write(bytes);
          await writer.close();
        } catch (error) {
          try { await writer.abort(); } catch {}
          throw error;
        }
        // Do not mark success just because createWritable()/postMessage returned:
        // read the actual file back and compare the complete content digest.
        const diskFile = await handle.getFile();
        if (diskFile.size !== bytes.byteLength) throw new Error("DXF size mismatch after write");
        const [expected, actual] = await Promise.all([
          crypto.subtle.digest("SHA-256", bytes),
          diskFile.arrayBuffer().then(data => crypto.subtle.digest("SHA-256", data))
        ]);
        const x = new Uint8Array(expected), y = new Uint8Array(actual);
        if (x.some((value, i) => value !== y[i])) throw new Error("DXF SHA-256 mismatch after write");
        currentName = filename;
        if (recoveryId) {
          try { await clearRecovery(recoveryId); } catch { /* keep an extra emergency copy */ }
        }
        await refreshRecoveryButton();
        status("已驗證本機 DXF：revisions/" + revision + "（大小與 SHA-256 一致，舊版保留）。");
        return true;
      }
      download(filename, bytes);
      await refreshRecoveryButton();
      status(recoveryId
        ? "已要求瀏覽器下載「" + filename + "」，另有本機救援存檔。未建立本機歷史版本，請確認下載成功。"
        : "已要求瀏覽器下載「" + filename + "」，但無救援副本；未建立本機歷史版本，請立即確認下載成功。", true);
      return false;
    } catch {
      let downloadAttempted = false;
      try { download(filename, bytes); downloadAttempted = true; } catch {}
      await refreshRecoveryButton();
      status("DXF／匯出檔未通過本機持久化驗證。"
        + (downloadAttempted ? "已要求備援下載，請檢查瀏覽器下載清單。" : "下載亦失敗，請勿關閉頁面。")
        + (recoveryId ? "可由「救援存檔」重新下載。" : "瀏覽器也未保存救援副本，請重新嘗試存檔。"), true);
      return false;
    }
  }
  function acknowledgeSave(requestId, persisted) {
    // An acknowledgement never means that merely starting a download was durable.
    if (typeof requestId !== "string" || !/^cad-save-\d{1,18}$/.test(requestId)) return;
    if (frame?.contentWindow) {
      frame.contentWindow.postMessage({
        type: "cadcraft:save-ack", requestId, ok: persisted === true
      }, location.origin);
    }
  }
  async function handleMessage(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const msg = event.data;
    if (!msg || typeof msg !== "object" || typeof msg.type !== "string") return;
    if (msg.type === "cadcraft:command-result") {
      const job = pendingCadCommands.get(msg.requestId);
      if (!job) return;
      pendingCadCommands.delete(msg.requestId);
      clearTimeout(job.timer);
      if (msg.ok === true) job.resolve(msg.result ?? null);
      else job.reject(new Error(String(msg.error || "CAD 命令失敗").slice(0, 300)));
      return;
    }
    if (msg.type === "cadcraft:ready") {
      ready = true;
      status("CADCraft 繪圖引擎已就緒。可使用 CAD 內「新建」或開啟 DXF；本機繪圖不經過遠端伺服器。");
    } else if (msg.type === "cadcraft:dirty") {
      dirtyDrawing = msg.dirty === true;
      if (dirtyDrawing && pendingSaves===0) status("CAD 有未完成保存的變更，請先在 CAD 內執行儲存並確認成功。", true);
    } else if (msg.type === "cadcraft:save") {
      const bytes = msg.bytes;
      if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
        status("CAD 匯出的檔案無效或超過 32 MiB；未寫入資料夾。", true);
        acknowledgeSave(msg.requestId, false);
        return;
      }
      pendingSaves++;
      saveQueue = saveQueue
        .then(async () => {
          const persisted = await saveRevision(msg.name, bytes);
          acknowledgeSave(msg.requestId, persisted === true);
        })
        .catch(() => {
          acknowledgeSave(msg.requestId, false);
          status("儲存流程發生未預期錯誤；請立刻檢查本機版本與救援檔案。", true);
        })
        .finally(() => { pendingSaves--; });
    } else if (msg.type === "cadcraft:failed") {
      ready = false;
      status("CAD 繪圖引擎載入失敗；" + String(msg.error || "請檢查瀏覽器 WebAssembly 支援。").slice(0, 180), true);
    }
  }
  async function listVersions() {
    const list = panel?.querySelector("#cad-version-list");
    if (!list) return;
    if (!await permitted("read")) {
      status("要查看歷史版本，請先重新授權本機 DXF 資料夾。", true);
      return;
    }
    list.replaceChildren();
    try {
      const dir = await folder.getDirectoryHandle("revisions");
      const names = [];
      for await (const [name, item] of dir.entries()) {
        if (item.kind === "file" && /^[^\/\\]+\.dxf$/i.test(name)) names.push(name);
        if (names.length >= 2000) break;
      }
      names.sort().reverse();
      for (const name of names.slice(0, 80)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button";
        button.dataset.cadRevision = name;
        button.textContent = name;
        list.append(button);
      }
      list.hidden = false;
      if (!names.length) {
        list.textContent = "目前還沒有 DXF 本機歷史版本。";
      }
      status("已列出最近 " + Math.min(names.length, 80) + " 個版本。點選檔名會在目前 CAD 中開啟，請先儲存未完成的修改。");
    } catch {
      list.hidden = false;
      list.textContent = "尚未建立歷史版本資料夾。";
    }
  }
  async function openRevision(name) {
    try {
      if (!await permitted("read")) throw Error("permission");
      const dir = await folder.getDirectoryHandle("revisions");
      const file = await (await dir.getFileHandle(name)).getFile();
      if (file.size > MAX_BYTES || !file.size) throw Error("size");
      // Restore only into the editor. Never overwrite the version being restored.
      const original = name.replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-(?:[0-9a-f]{8}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.dxf$/i, ".dxf");
      openDrawing(original, await file.arrayBuffer());
    } catch {
      status("歷史版本無法開啟；請檢查本機資料夾授權及檔案。", true);
    }
  }
  async function onClick(event) {
    const action = event.target.closest("[data-cad-action]")?.dataset.cadAction;
    const revision = event.target.closest("[data-cad-revision]")?.dataset.cadRevision;
    const recoveryDownload = event.target.closest("[data-cad-recovery-download]")?.dataset.cadRecoveryDownload;
    const recoveryDelete = event.target.closest("[data-cad-recovery-delete]")?.dataset.cadRecoveryDelete;
    if (!action && !revision && !recoveryDownload && !recoveryDelete) return;
    if (action === "folder") await selectFolder();
    else if (action === "open") panel?.querySelector("#cad-open-file")?.click();
    else if (action === "versions") await listVersions();
    else if (action === "recovery") await showRecoveries();
    else if (action === "ai-enable") {
      if (!ready) { status("請先載入 CADCraft，才能允許 AI 操作。", true); return; }
      if (!confirm("允許此分頁接收已授權的 AI CAD 幾何指令？只能新建、直線、矩形和圓，不能讀取本機路徑；關閉分頁即失效。")) return;
      allowAiControl = true;
      panel?.querySelector('[data-cad-action="ai-enable"]')?.setAttribute("hidden", "");
      panel?.querySelector('[data-cad-action="ai-disable"]')?.removeAttribute("hidden");
      panel?.querySelector('[data-cad-action="remote-connect"]')?.removeAttribute("hidden");
      status("此分頁已允許 AI CAD 幾何指令，關閉頁面自動撤銷。");
    } else if (action === "ai-disable") {
      revokeAiControl("使用者已停止 AI CAD 操作。");
    } else if (action === "remote-connect") {
      try {
        if (!allowAiControl) throw new Error("請先允許本頁 CAD AI 操作");
        if (!window.LizhiCadRelay) throw new Error("CAD MCP 中繼模組尚未載入");
        await window.LizhiCadRelay.connect();
        panel?.querySelector('[data-cad-action="remote-connect"]')?.setAttribute("hidden", "");
        panel?.querySelector('[data-cad-action="remote-disconnect"]')?.removeAttribute("hidden");
        status("本頁 CAD 指令中繼已啟用。請在一般 ChatGPT 對話連接私人「立之 CAD 指令代理」Site，確認六個 MCP 工具已載入後才能操作。本頁請保持開啟，可隨時斷開。");
      } catch (error) {
        status("ChatGPT MCP 未連線：" + String(error?.message || "登入／服務驗證失敗").slice(0,180), true);
      }
    } else if (action === "remote-disconnect") {
      await window.LizhiCadRelay?.disconnect?.();
      panel?.querySelector('[data-cad-action="remote-connect"]')?.removeAttribute("hidden");
      panel?.querySelector('[data-cad-action="remote-disconnect"]')?.setAttribute("hidden", "");
      status("已停止向 ChatGPT MCP 中繼領取新的 CAD 指令。");
    }
    else if (recoveryDownload) {
      const item = (await getRecoveries()).find(row => row.id === recoveryDownload);
      if (item) { download(item.name, item.data); status("已要求再次下載救援存檔，請確認瀏覽器下載成功；救援副本尚未刪除。"); }
    } else if (recoveryDelete) {
      if (!confirm("只有確認外部備份已完成，才能刪除此本機救援副本。確定刪除嗎？")) return;
      await clearRecovery(recoveryDelete);
      await showRecoveries();
    }
    else if (action === "reload" && frame) {
      if (!confirm("重新載入 CAD 將放棄尚未儲存的圖面變更，確定繼續？")) return;
      ready = false;
      revokeAiControl("重新載入 CAD 前已關閉 AI 操作權限。");
      frame.src = frame.src;
      status("正在重新載入 CAD 繪圖引擎…");
    } else if (revision) {
      if (!confirm("開啟歷史版本會取代目前開啟的圖面，請確認已儲存修改。")) return;
      await openRevision(revision);
    }
  }
  async function onFile(event) {
    if (event.target?.id !== "cad-open-file") return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(dxf|dwg)$/i.test(file.name) || file.size > MAX_BYTES || file.size === 0) {
      status("僅接受 CADCraft 支援的 DXF／DWG，且大小須在 32 MiB 以內。", true);
      return;
    }
    try { openDrawing(file.name, await file.arrayBuffer()); }
    catch { status("無法讀取本機圖檔。", true); }
  }
  function safePoint(value) {
    return Array.isArray(value) && value.length === 2 &&
      value.every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1000000);
  }
  function validateCadCommand(name, params) {
    if (!params || typeof params !== "object" || Array.isArray(params)) return false;
    if (JSON.stringify(params).length > 8192) return false;
    const keys = Object.keys(params);
    if (name === "new") return keys.every(k => k === "metric") && (params.metric === undefined || typeof params.metric === "boolean");
    if (name === "rectang") return keys.length === 2 && keys.includes("p1") && keys.includes("p2") && safePoint(params.p1) && safePoint(params.p2);
    if (name === "line") return keys.every(k => k === "points" || k === "closed") && Array.isArray(params.points) &&
      params.points.length >= 2 && params.points.length <= 64 && params.points.every(safePoint) &&
      (params.closed === undefined || typeof params.closed === "boolean");
    if (name === "circle") return keys.every(k => ["center", "radius", "diameter"].includes(k)) &&
      safePoint(params.center) && Number(keys.includes("radius")) + Number(keys.includes("diameter")) === 1 &&
      [params.radius ?? params.diameter].every(n => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 1000000);
    return false;
  }
  function revokeAiControl(message) {
    allowAiControl = false;
    void window.LizhiCadRelay?.disconnect?.();
    panel?.querySelector('[data-cad-action="remote-connect"]')?.setAttribute("hidden", "");
    panel?.querySelector('[data-cad-action="remote-disconnect"]')?.setAttribute("hidden", "");
    panel?.querySelector('[data-cad-action="ai-enable"]')?.removeAttribute("hidden");
    panel?.querySelector('[data-cad-action="ai-disable"]')?.setAttribute("hidden", "");
    for (const [, job] of pendingCadCommands) {
      clearTimeout(job.timer);
      job.reject(new Error(message || "CAD 操作權限已被撤銷"));
    }
    pendingCadCommands.clear();
    if (message) status(message, true);
  }

  window.LizhiCadHost = {
    get commandStatus() { return { ready, enabled: allowAiControl, dirty: dirtyDrawing, pending: pendingCadCommands.size }; },
    // Not a network endpoint: must be invoked by an authenticated per-session
    // broker after explicit opt-in. This layer is also safe for local manual QA.
    command(name, params) {
      if (!allowAiControl || !ready || !frame?.contentWindow) return Promise.reject(new Error("CAD AI 控制未啟用或繪圖引擎離線"));
      if (!validateCadCommand(name, params)) return Promise.reject(new Error("不支援此 CAD 幾何指令或座標"));
      if (pendingCadCommands.size >= 16) return Promise.reject(new Error("CAD 命令佇列已滿"));
      const requestId = "cad-" + crypto.randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingCadCommands.delete(requestId);
          reject(new Error("CAD 指令逾時，未自動重試以避免重複畫圖"));
        }, 25000);
        pendingCadCommands.set(requestId, { resolve, reject, timer });
        try {
          frame.contentWindow.postMessage({ type: "cadcraft:command", requestId, command: name, params }, location.origin);
        } catch (e) {
          clearTimeout(timer); pendingCadCommands.delete(requestId); reject(e);
        }
      });
    },
    mount(target) {
      if (panel === target) return;
      panel = target;
      frame = panel.querySelector("#cad-frame");
      ready = false;
      dirtyDrawing = false;
      allowAiControl = false;
      if (!frame) return;
      frame.addEventListener("load", () => {
        if (!ready) status("CAD 框架已載入，等待 CADCraft WebAssembly 就緒；若一直無回應，請確認網站已安裝引擎。");
      });
      panel.addEventListener("click", onClick);
      panel.addEventListener("change", onFile);
      if (!listening) {
        window.addEventListener("message", handleMessage);
        window.addEventListener("beforeunload", event => {
          if (pendingSaves > 0 || dirtyDrawing) { event.preventDefault(); event.returnValue = ""; }
        });
        listening = true;
      }
      restoreFolder();
      refreshRecoveryButton();
    }
  };
})();
