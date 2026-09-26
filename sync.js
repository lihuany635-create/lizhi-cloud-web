(function () {
  const TABLE = "lizhi_web_records";
  const SYNCABLE = new Set(["folder", "note", "podcast"]);
  let busy = false;
  let timer = null;

  function isCloud() {
    return Boolean(window.LizhiAuth && location.hostname.endsWith("github.io"));
  }

  function schedule() {
    if (!isCloud()) return;
    clearTimeout(timer);
    timer = setTimeout(() => { void sync(); }, 500);
  }

  async function sync() {
    if (!isCloud() || busy || !window.LizhiAuth.user || !window.LizhiRecordStore) return;
    busy = true;
    try {
      const { data: remoteRows, error } = await window.LizhiAuth.client
        .from(TABLE)
        .select("id,kind,payload,created_at,updated_at,deleted_at");
      if (error) throw error;
      const remote = new Map((remoteRows || []).map(row => [row.id, row]));
      const localRows = (await window.LizhiRecordStore.all()).filter(row => SYNCABLE.has(row.kind));
      const local = new Map(localRows.map(row => [row.id, row]));
      const uploads = [];

      for (const row of localRows) {
        const cloud = remote.get(row.id);
        const localTime = Date.parse(row.updatedAt || row.createdAt || 0) || 0;
        const cloudTime = Date.parse(cloud?.updated_at || cloud?.created_at || 0) || 0;
        if (!cloud || localTime >= cloudTime) {
          uploads.push({
            id: row.id,
            user_id: window.LizhiAuth.user.id,
            kind: row.kind,
            payload: row,
            created_at: row.createdAt || new Date().toISOString(),
            updated_at: row.updatedAt || row.createdAt || new Date().toISOString(),
            deleted_at: row.deletedAt || null
          });
        } else {
          await window.LizhiRecordStore.put(cloud.payload);
        }
      }

      for (const cloud of remoteRows || []) {
        if (!local.has(cloud.id)) await window.LizhiRecordStore.put(cloud.payload);
      }

      if (uploads.length) {
        const { error: uploadError } = await window.LizhiAuth.client.from(TABLE).upsert(uploads, { onConflict: "user_id,id" });
        if (uploadError) throw uploadError;
      }
      window.LizhiSync.lastSyncedAt = Date.now();
    } catch (error) {
      console.warn("立之雲端庫同步失敗：", error);
      window.LizhiSync.lastError = error;
    } finally {
      busy = false;
    }
  }

  window.LizhiSync = { schedule, sync, get lastSyncedAt() { return this._lastSyncedAt; }, set lastSyncedAt(value) { this._lastSyncedAt = value; }, lastError: null };
})();

