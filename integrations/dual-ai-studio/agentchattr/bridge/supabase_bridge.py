"""雙AI工作室｜網站群聊轉接程式（電腦端）

立之雲端庫網站 ⇄ Supabase（lizhi_dualai_*）⇄ 本程式 ⇄ 本機 agentchattr（127.0.0.1:8300）

- 網站送來的訊息：以「本人」身分送進本機聊天室（與本機網頁發言相同，@claude / @codex 會觸發 AI）
- 本機聊天室的新訊息（AI 回覆、本機發言、系統訊息）：轉上 Supabase，網站即可看到
- 設定檔 bridge.local.json（不進版本控制）：
    {"supabase_url": "...", "publishable_key": "...", "bridge_key": "lzb_..."}
  在網站「雙AI工作室」頁按「產生轉接金鑰」即可取得整段內容。

只用標準函式庫與 agentchattr 已安裝的 websockets，不保存任何登入資料。
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from websockets.sync.client import connect as ws_connect

ROOT = Path(__file__).resolve().parent.parent          # agentchattr/
CONFIG_FILE = ROOT / "bridge.local.json"
STATE_FILE = ROOT / "data" / "bridge_state.json"
LOCAL = "http://127.0.0.1:8300"
POLL_SECONDS = 4          # 有對話時：每 4 秒檢查一次
POLL_IDLE_SECONDS = 15    # 閒置時：每 15 秒檢查一次（省約 7 成請求）
IDLE_AFTER_SECONDS = 300  # 5 分鐘沒有新訊息就算閒置
CHANNEL = "general"


def log(msg: str) -> None:
    print(time.strftime("%H:%M:%S"), msg, flush=True)


# ---------------- Supabase ----------------

class Cloud:
    def __init__(self, cfg: dict):
        self.base = cfg["supabase_url"].rstrip("/") + "/rest/v1/rpc/"
        self.headers = {
            "apikey": cfg["publishable_key"],
            "Authorization": "Bearer " + cfg["publishable_key"],
            "Content-Type": "application/json",
        }
        self.key = cfg["bridge_key"]

    def rpc(self, fn: str, args: dict):
        body = json.dumps({"p_key": self.key, **args}).encode("utf-8")
        req = urllib.request.Request(self.base + fn, data=body, headers=self.headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
        return json.loads(raw) if raw else None

    def pull(self) -> list[dict]:
        return self.rpc("lizhi_dualai_bridge_pull", {}) or []

    def ack(self, ids: list[str]) -> None:
        if ids:
            self.rpc("lizhi_dualai_bridge_ack", {"p_ids": ids})

    def post(self, local_id: int, sender: str, kind: str, content: str) -> None:
        self.rpc("lizhi_dualai_bridge_post", {
            "p_local_id": local_id, "p_sender": sender[:40],
            "p_sender_kind": kind, "p_content": content[:10000],
        })


# ---------------- 本機 agentchattr ----------------

class Local:
    def __init__(self):
        self.token = ""

    def refresh_token(self) -> None:
        with urllib.request.urlopen(LOCAL + "/", timeout=5) as resp:
            html = resp.read().decode("utf-8", "replace")
        m = re.search(r'__SESSION_TOKEN__="([0-9a-f]+)"', html)
        if not m:
            raise RuntimeError("找不到本機聊天室的連線權杖")
        self.token = m.group(1)

    def messages_since(self, since_id: int) -> list[dict]:
        url = f"{LOCAL}/api/messages?channel={CHANNEL}&" + (f"since_id={since_id}" if since_id else "limit=1")
        req = urllib.request.Request(url, headers={"X-Session-Token": self.token})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())

    def send_as_user(self, texts: list[str]) -> None:
        with ws_connect(f"ws://127.0.0.1:8300/ws?token={self.token}", open_timeout=10,
                        max_size=None, origin="http://127.0.0.1:8300") as ws:
            for text in texts:
                ws.send(json.dumps({"type": "message", "text": text, "sender": "user", "channel": CHANNEL}))
            time.sleep(0.5)  # 讓伺服器處理完再關閉連線


# ---------------- 主迴圈 ----------------

def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text("utf-8"))
    except Exception:
        return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state), "utf-8")


def kind_of(msg: dict) -> str:
    if msg.get("type") == "system" or msg.get("sender") == "system":
        return "system"
    return "human" if msg.get("sender") == "user" else "agent"


def run_once(cloud: Cloud, local: Local, state: dict, echo: list[str]) -> bool:
    """執行一輪同步；有任何訊息往來時回傳 True。"""
    # 1) 網站 → 本機
    rows = cloud.pull()
    if rows:
        texts = [r["content"] for r in rows]
        local.send_as_user(texts)
        echo.extend(texts)
        cloud.ack([r["id"] for r in rows])
        log(f"網站→本機 {len(rows)} 則")

    # 2) 本機 → 網站
    last = int(state.get("last_local_id", 0))
    msgs = local.messages_since(last)
    if not last:
        # 第一次啟動：不上傳舊紀錄，從目前最新一則之後開始
        state["last_local_id"] = max([m["id"] for m in msgs], default=0)
        save_state(state)
        return bool(rows)
    sent = 0
    for m in sorted(msgs, key=lambda x: x["id"]):
        text = (m.get("text") or "").strip()
        if m["id"] <= last:
            continue
        if text and not (m.get("sender") == "user" and text in echo):
            cloud.post(m["id"], m.get("sender") or "unknown", kind_of(m), text)
            sent += 1
        elif text in echo:
            echo.remove(text)   # 網站送來的訊息本身，不回傳避免重複
        state["last_local_id"] = m["id"]
    if msgs:
        save_state(state)
    if sent:
        log(f"本機→網站 {sent} 則")
    return bool(rows) or sent > 0 or any(m["id"] > last for m in msgs)


def main() -> int:
    if not CONFIG_FILE.exists():
        log(f"缺少設定檔 {CONFIG_FILE.name}：請在網站「雙AI工作室」頁產生轉接金鑰後存成此檔。")
        return 2
    cfg = json.loads(CONFIG_FILE.read_text("utf-8"))
    cloud, local = Cloud(cfg), Local()
    state, echo = load_state(), []
    last_activity = time.monotonic()
    log("轉接程式啟動")
    while True:
        try:
            if not local.token:
                local.refresh_token()
            if run_once(cloud, local, state, echo):
                last_activity = time.monotonic()
            del echo[:-50]
        except urllib.error.HTTPError as e:
            if e.code == 403 and "8300" in (e.url or ""):
                local.token = ""          # 本機聊天室重啟後權杖會變
            else:
                detail = e.read().decode("utf-8", "replace")[:200]
                log(f"雲端錯誤 {e.code}: {detail}")
                if "invalid_bridge_key" in detail:
                    log("轉接金鑰無效，請到網站重新產生")
                    time.sleep(60)
        except Exception as e:  # 本機聊天室未啟動、網路中斷等：稍後重試
            local.token = ""
            log(f"暫時無法同步：{type(e).__name__}: {e}")
            time.sleep(POLL_SECONDS * 2)
        idle = time.monotonic() - last_activity > IDLE_AFTER_SECONDS
        time.sleep(POLL_IDLE_SECONDS if idle else POLL_SECONDS)


if __name__ == "__main__":
    sys.exit(main())
