/* 立之 CAD：同來源 WASM 框架宿主；只傳明確選取的圖檔，不提供網路檔案 API。 */
(function () {
  "use strict";
  const DB_NAME = "lizhi-cad-local";
  const DB_STORE = "permissions";
  const MAX_BYTES = 32 * 1024 * 1024;
  let panel = null;
  let frame = null;
  let folder = null;
  let ready = false;
  let listening = false;
  let currentName = "Drawing.dxf";

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
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
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
    if (!/\.dxf$/i.test(filename)) {
      download(filename, bytes);
      status("已下載匯出檔「" + filename + "」。");
      return;
    }
    if (!await permitted("readwrite")) {
      download(filename, bytes);
      status("DXF 已下載。資料夾未授權或授權已失效，未建立本機歷史版本。", true);
      return;
    }
    try {
      const directory = await folder.getDirectoryHandle("revisions", { create: true });
      const prefix = filename.replace(/\.dxf$/i, "");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const revision = prefix + "-" + stamp + "-" + crypto.randomUUID().slice(0, 8) + ".dxf";
      const file = await directory.getFileHandle(revision, { create: true });
      const writer = await file.createWritable({ keepExistingData: false });
      try {
        await writer.write(bytes);
        await writer.close();
      } catch (error) {
        try { await writer.abort(); } catch {}
        throw error;
      }
      currentName = filename;
      status("已儲存在所選資料夾的 revisions/" + revision + "（保留舊版、不覆蓋）。");
    } catch {
      download(filename, bytes);
      status("本機版本寫入失敗，已提供 DXF 下載備份；請檢查容量與資料夾權限。", true);
    }
  }
  async function handleMessage(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const msg = event.data;
    if (!msg || typeof msg !== "object" || typeof msg.type !== "string") return;
    if (msg.type === "cadcraft:ready") {
      ready = true;
      status("CADCraft 繪圖引擎已就緒。可使用 CAD 內「新建」或開啟 DXF；本機繪圖不經過遠端伺服器。");
    } else if (msg.type === "cadcraft:dirty") {
      if (msg.dirty === true) status("CAD 圖面有尚未儲存的修改。請在 CAD 內使用儲存指令。");
    } else if (msg.type === "cadcraft:save") {
      const bytes = msg.bytes;
      if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
        status("CAD 匯出的檔案無效或超過 32 MiB；未寫入資料夾。", true);
        return;
      }
      await saveRevision(msg.name, bytes);
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
      const original = name.replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}\.dxf$/i, ".dxf");
      openDrawing(original, await file.arrayBuffer());
    } catch {
      status("歷史版本無法開啟；請檢查本機資料夾授權及檔案。", true);
    }
  }
  async function onClick(event) {
    const action = event.target.closest("[data-cad-action]")?.dataset.cadAction;
    const revision = event.target.closest("[data-cad-revision]")?.dataset.cadRevision;
    if (!action && !revision) return;
    if (action === "folder") await selectFolder();
    else if (action === "open") panel?.querySelector("#cad-open-file")?.click();
    else if (action === "versions") await listVersions();
    else if (action === "reload" && frame) {
      if (!confirm("重新載入 CAD 將放棄尚未儲存的圖面變更，確定繼續？")) return;
      ready = false;
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
    if (!/\.(dxf|dwg|svg)$/i.test(file.name) || file.size > MAX_BYTES || file.size === 0) {
      status("僅接受 CADCraft 支援的 DXF／DWG／SVG，且大小須在 32 MiB 以內。", true);
      return;
    }
    try { openDrawing(file.name, await file.arrayBuffer()); }
    catch { status("無法讀取本機圖檔。", true); }
  }
  window.LizhiCadHost = {
    mount(target) {
      if (panel === target) return;
      panel = target;
      frame = panel.querySelector("#cad-frame");
      ready = false;
      if (!frame) return;
      frame.addEventListener("load", () => {
        if (!ready) status("CAD 框架已載入，等待 CADCraft WebAssembly 就緒；若一直無回應，請確認網站已安裝引擎。");
      });
      panel.addEventListener("click", onClick);
      panel.addEventListener("change", onFile);
      if (!listening) {
        window.addEventListener("message", handleMessage);
        listening = true;
      }
      restoreFolder();
    }
  };
})();
