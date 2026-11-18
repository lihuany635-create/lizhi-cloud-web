"""立之 GridCraft Windows 本機代理 v0.1 — 可攜式、僅本機的安全控制面板。

P3 outbound candidate requires explicit owner pairing and an approved backend; not deployed.
This program opens NO network listener, touches only 127.0.0.1, and does
not expose GridCraft's local control token in user-visible output.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk

from gridcraft_desktop_local import GridCraftLocal
from gridcraft_outbound_worker import HTTPSDeviceTransport, OutboundWorker
from gridcraft_p4_safe_write import P4SafeWriter
from gridcraft_p4_desktop import P4Local
from gridcraft_pairing_client import DeviceStore, PairingError, pair_one_time

try:
    import winreg
except ImportError:  # development tests can run outside Windows
    winreg = None

APP_TITLE = "立之 GridCraft 連線代理"
AUTOSTART_NAME = "LizhiGridCraftAgent"
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_EXE_NAME = "LizhiGridCraftAgent.exe"
MAX_PATH = 1024


def app_directory() -> Path:
    """Current user's local non-roaming application data; never a public dir."""
    local = os.environ.get("LOCALAPPDATA")
    if not local:
        local = str(Path.home() / "AppData" / "Local")
    return Path(local) / "Lizhi" / "GridCraftAgent"


def settings_file() -> Path:
    return app_directory() / "settings.json"


def safe_gridcraft_exe(path: str | Path) -> Path:
    candidate = Path(path).expanduser().resolve(strict=True)
    if candidate.name.casefold() != "gridcraft.exe" or not candidate.is_file():
        raise ValueError("請選擇 GridCraft 官方程式 gridcraft.exe")
    if len(str(candidate)) > MAX_PATH:
        raise ValueError("GridCraft 程式路徑過長")
    return candidate


def load_settings(path: Path | None = None) -> dict:
    path = path or settings_file()
    try:
        result = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(result, dict):
            return {}
        return {
            "gridcraft_path": str(result.get("gridcraft_path") or "")[:MAX_PATH],
            "start_gridcraft_on_login": result.get("start_gridcraft_on_login") is True,
            "remote_enabled": result.get("remote_enabled") is True,
            "auto_allow_p4": result.get("auto_allow_p4") is True,
            "remembered_workbooks": list(dict.fromkeys(x for x in result.get("remembered_workbooks", [])[:20] if isinstance(x, str) and re.fullmatch(r"[0-9a-f]{64}", x))) if isinstance(result.get("remembered_workbooks"), list) else [],
        }
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return {}


def save_settings(settings: dict, path: Path | None = None) -> None:
    path = path or settings_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = {
        "gridcraft_path": str(settings.get("gridcraft_path") or "")[:MAX_PATH],
        "start_gridcraft_on_login": settings.get("start_gridcraft_on_login") is True,
        "remote_enabled": settings.get("remote_enabled") is True,
        "auto_allow_p4": settings.get("auto_allow_p4") is True,
        "remembered_workbooks": list(dict.fromkeys(x for x in settings.get("remembered_workbooks", [])[:20] if isinstance(x, str) and re.fullmatch(r"[0-9a-f]{64}", x))) if isinstance(settings.get("remembered_workbooks"), list) else [],
    }
    tmp = path.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


def workbook_identity_hash(path: str | None) -> str | None:
    """Identity of the owner's previously approved SAVED local workbook.

    Never reuse a transient GridCraft doc number or title as persisted authority.
    Only an existing absolute path can be remembered; no path goes to MCP.
    """
    if not isinstance(path, str) or not path or len(path) > MAX_PATH:
        return None
    try:
        file = Path(path)
        if not file.is_absolute():
            return None
        canonical = file.resolve(strict=True)
        if not canonical.is_file():
            return None
        return hashlib.sha256(str(canonical).casefold().encode("utf-8")).hexdigest()
    except (OSError, RuntimeError, ValueError):
        return None


def installed_executable() -> Path:
    return app_directory() / APP_EXE_NAME


def startup_enabled() -> bool:
    if winreg is None:
        return False
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as key:
            value, _ = winreg.QueryValueEx(key, AUTOSTART_NAME)
            return value == f'"{installed_executable()}" --minimized'
    except (OSError, PermissionError):
        return False


def enable_startup(executable: Path | None = None) -> Path:
    """Explicit opt-in only, HKCU Run; no admin, task scheduler or elevation."""
    if winreg is None or os.name != "nt":
        raise RuntimeError("開機自動啟動僅支援 Windows")
    if not getattr(sys, "frozen", False) and executable is None:
        raise RuntimeError("開機啟動僅支援已打包的 Windows .exe")
    source = (executable or Path(sys.executable)).resolve(strict=True)
    target = installed_executable()
    target.parent.mkdir(parents=True, exist_ok=True)
    if source != target.resolve():
        # Keep a stable per-user location when the downloaded EXE is moved.
        shutil.copy2(source, target)
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, AUTOSTART_NAME, 0, winreg.REG_SZ, f'"{target}" --minimized')
    return target


def disable_startup() -> None:
    if winreg is None:
        return
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as key:
            winreg.DeleteValue(key, AUTOSTART_NAME)
    except FileNotFoundError:
        pass


def start_gridcraft(path: str | Path):
    selected = safe_gridcraft_exe(path)
    # Only locally user-selected GridCraft.exe, no shell/cmd/synthetic remote args.
    return subprocess.Popen(
        [str(selected), "--control", "7979"],
        cwd=str(selected.parent),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
        close_fds=True,
    )


def diagnostic() -> int:
    """Safe packaging self-test; never reads or emits token/private documents."""
    assert AUTOSTART_NAME and RUN_KEY
    assert APP_EXE_NAME.lower().endswith(".exe")
    assert load_settings(Path("__intentionally_missing_gridcraft_test__.json")) == {}
    assert GridCraftLocal(port=7979, timeout=1.2) is not None
    print("PASS: LizhiGridCraftAgent packaging and local-only dependencies")
    print("NOT_TESTED: user's real Windows desktop or remote ChatGPT MCP")
    return 0


class AgentUI:
    def __init__(self, root: tk.Tk, minimized: bool = False):
        self.root = root
        self.root.title(APP_TITLE + "｜v0.4 自動連線候選")
        self.root.geometry("680x620")
        self.root.minsize(600, 550)
        self.root.protocol("WM_DELETE_WINDOW", self.stop)
        self.settings = load_settings()
        self.pair_store = DeviceStore(app_directory())
        try:
            self.paired = self.pair_store.load()
        except PairingError:
            self.paired = None
        self.allowed_docs = set()  # Only saved-path grants or explicit current-session grants.
        self.session_grants = {}  # doc -> (exact identity hash | None, displayed title).
        self.remote_stop = threading.Event()
        self.remote_thread = None
        # P4 write toggle is NEVER loaded from settings or automatically enabled.
        self.p4_write_enabled = False
        self.p4_state_var = tk.StringVar(value="P4 寫入：等待本機工作簿授權")
        self.auto_p4_var = tk.BooleanVar(value=self.settings.get("auto_allow_p4") is True)
        self.remote_status = "未配對（遠端 MCP 尚未驗收）" if not self.paired else "已配對，尚未驗證遠端服務"
        self.path_var = tk.StringVar(value=self.settings["gridcraft_path"] if "gridcraft_path" in self.settings else "")
        self.status_var = tk.StringVar(value="檢查中…")
        self.workbooks_var = tk.StringVar(value="工作簿：尚未讀取")
        self.startup_var = tk.BooleanVar(value=startup_enabled())
        self.launch_var = tk.BooleanVar(value=self.settings.get("start_gridcraft_on_login") is True)
        self.info_var = tk.StringVar(value="ChatGPT 遠端 MCP：尚未接通（P3 待正式部署與驗收）")
        self.running = True
        self._create_widgets()
        self.refresh()
        if minimized:
            root.after(400, root.iconify)
        # Just launching this agent is enough: GridCraft and saved pairing
        # reconnect without repeating buttons. No new workbook is auto-granted.
        if self.path_var.get():
            root.after(1100, self.launch_on_login)
        root.after(4500, self._poll)
        if self.paired and self.settings.get("remote_enabled") is not False:
            root.after(900, self.start_remote)

    def _create_widgets(self):
        frm = ttk.Frame(self.root, padding=16)
        frm.pack(fill="both", expand=True)
        ttk.Label(frm, text="立之 GridCraft 連線代理", font=("Microsoft JhengHei UI", 17, "bold")).pack(anchor="w")
        ttk.Label(frm, text="打開代理即自動連線｜只認已授權的本機工作簿｜v0.4", foreground="#5b6472").pack(anchor="w", pady=(2, 13))
        ttk.Label(frm, textvariable=self.status_var, font=("Microsoft JhengHei UI", 12, "bold")).pack(anchor="w")
        ttk.Label(frm, textvariable=self.workbooks_var, wraplength=490).pack(anchor="w", pady=(5, 10))
        source = ttk.Frame(frm)
        source.pack(fill="x", pady=(3, 4))
        ttk.Entry(source, textvariable=self.path_var, state="readonly").pack(side="left", fill="x", expand=True)
        ttk.Button(source, text="選擇 GridCraft.exe", command=self.choose_gridcraft).pack(side="left", padx=(6, 0))
        buttons = ttk.Frame(frm)
        buttons.pack(fill="x", pady=7)
        ttk.Button(buttons, text="啟動 GridCraft", command=self.launch_gridcraft).pack(side="left")
        ttk.Button(buttons, text="重新檢查", command=self.refresh).pack(side="left", padx=7)
        ttk.Button(buttons, text="停止代理", command=self.stop).pack(side="left")
        ttk.Separator(frm).pack(fill="x", pady=9)
        ttk.Checkbutton(
            frm,
            text="Windows 登入後自動啟動此代理（需要本人按一下才啟用）",
            variable=self.startup_var,
            command=self.change_startup,
        ).pack(anchor="w", pady=(2, 5))
        ttk.Checkbutton(
            frm,
            text="登入後也自動啟動 GridCraft（需先選擇 GridCraft.exe）",
            variable=self.launch_var,
            command=self.change_launch_preference,
        ).pack(anchor="w")
        ttk.Separator(frm).pack(fill="x", pady=10)
        remote = ttk.Frame(frm)
        remote.pack(fill="x", pady=(2, 8))
        ttk.Button(remote, text="輸入配對碼", command=self.pair_remote).pack(side="left")
        ttk.Button(remote, text="授權目前工作簿", command=self.grant_open_book).pack(side="left", padx=4)
        ttk.Button(remote, text="開始遠端", command=self.start_remote).pack(side="left", padx=4)
        ttk.Button(remote, text="停止遠端", command=self.stop_remote).pack(side="left")
        ttk.Button(frm, text="P4 寫入授權（本次執行）", command=self.toggle_p4_write).pack(anchor="w", pady=5)
        ttk.Checkbutton(frm, text="記住本機 P4 寫入允許（僅限已授權的檔案；每次實際寫入仍須在原 Site 確認）",
                        variable=self.auto_p4_var,command=self.change_auto_p4).pack(anchor="w", pady=2)
        ttk.Label(frm, textvariable=self.p4_state_var, foreground="#a64d11", wraplength=570).pack(anchor="w", pady=2)
        ttk.Label(frm, textvariable=self.info_var, foreground="#926c10", wraplength=540).pack(anchor="w", pady=4)
        ttk.Label(frm, text="安全狀態：白名單＋兩階段寫入｜127.0.0.1:7979｜不輸出控制權杖", foreground="#5b6472").pack(anchor="w")

    def choose_gridcraft(self):
        chosen = filedialog.askopenfilename(
            parent=self.root,
            title="選擇已安裝的 GridCraft.exe",
            filetypes=[("GridCraft", "gridcraft.exe"), ("Windows 程式", "*.exe")],
        )
        if not chosen:
            return
        try:
            path = safe_gridcraft_exe(chosen)
            self.path_var.set(str(path))
            self.settings["gridcraft_path"] = str(path)
            save_settings(self.settings)
        except (OSError, ValueError) as exc:
            messagebox.showerror("GridCraft 路徑不正確", str(exc), parent=self.root)

    def launch_gridcraft(self):
        local_status = GridCraftLocal(port=7979, timeout=1.2).status()["status"]
        if local_status == "READY":
            self.status_var.set("GridCraft 已在線，不重複啟動")
            return
        if local_status == "UNAUTHORIZED":
            messagebox.showerror("控制授權異常", "GridCraft 已回應但權杖驗證失敗，請先處理本機授權", parent=self.root)
            return
        if not self.path_var.get():
            messagebox.showinfo("請先選擇程式", "請先指定已安裝的 GridCraft.exe", parent=self.root)
            return
        try:
            start_gridcraft(self.path_var.get())
            self.status_var.set("已向 Windows 發出啟動指令；稍後檢查 GridCraft 是否就緒")
        except (OSError, ValueError) as exc:
            messagebox.showerror("啟動失敗", str(exc), parent=self.root)

    def launch_on_login(self):
        # Never create an extra GridCraft window when it is already available.
        if GridCraftLocal(port=7979, timeout=1.2).status()["status"] != "GRIDCRAFT_OFFLINE":
            return
        if self.path_var.get():
            try:
                start_gridcraft(self.path_var.get())
            except (OSError, ValueError):
                self.status_var.set("自動啟動 GridCraft 失敗；請手動檢查")

    def change_startup(self):
        requested = self.startup_var.get()
        try:
            if requested:
                enable_startup()
            else:
                disable_startup()
        except (OSError, RuntimeError, ValueError) as exc:
            self.startup_var.set(startup_enabled())
            messagebox.showerror("開機啟動設定未變更", str(exc), parent=self.root)

    def change_launch_preference(self):
        if self.launch_var.get() and not self.path_var.get():
            self.launch_var.set(False)
            messagebox.showinfo("先指定 GridCraft", "選擇 GridCraft.exe 後才能啟用此功能", parent=self.root)
            return
        self.settings["start_gridcraft_on_login"] = self.launch_var.get()
        try:
            save_settings(self.settings)
        except OSError as exc:
            self.launch_var.set(not self.launch_var.get())
            messagebox.showerror("儲存失敗", str(exc), parent=self.root)

    def refresh(self):
        state = GridCraftLocal(port=7979, timeout=1.2).status()
        status = state["status"]
        meanings = {
            "READY": "READY｜GridCraft 已開啟，桌面本機可安全讀取",
            "GRIDCRAFT_OFFLINE": "GRIDCRAFT_OFFLINE｜未偵測到 GridCraft 控制連線",
            "UNAUTHORIZED": "UNAUTHORIZED｜本機權杖不可用／已失效",
            "CONTROL_ERROR": "CONTROL_ERROR｜控制服務回傳錯誤",
        }
        self.status_var.set(meanings.get(status, status))
        if status == "READY":
            try:
                windows = GridCraftLocal(port=7979, timeout=1.2).windows()
                self.workbooks_var.set(f"已開啟工作簿：{len(windows)} 本（只顯示於本機）")
            except Exception:
                self.workbooks_var.set("工作簿清單暫時無法讀取")
        else:
            self.workbooks_var.set("目前無法讀取工作簿")
        if status == "READY":
            try:
                self._verified_grants(windows)
                if self.auto_p4_var.get() and self.allowed_docs and self.remote_stop.is_set() is False:
                    self.p4_write_enabled = True
                    self.p4_state_var.set("P4 寫入：自動授權已記住的本機檔案（實際寫入仍需 Site 確認）")
                elif not self.allowed_docs:
                    self.p4_write_enabled = False
                    self.p4_state_var.set("P4 寫入：等待已授權的本機檔案")
            except Exception:
                self.allowed_docs.clear()
                self.p4_write_enabled = False
        self.info_var.set("ChatGPT 遠端 MCP：" + self.remote_status)

    def _poll(self):
        if self.running:
            try:
                self.refresh()
            finally:
                self.root.after(4500, self._poll)


    def pair_remote(self):
        code = simpledialog.askstring(
            "一次性裝置配對",
            "從本人 ChatGPT 私人 MCP 取得 16 位一次性配對碼，在此輸入（有效 2 分鐘）：",
            parent=self.root
        )
        if not code:
            return
        try:
            device_id, token = pair_one_time(code.strip())
            self.pair_store.save(device_id, token)
            self.paired = {"device_id": device_id, "token": token}
            self.remote_status = "已配對，正在自動連線"
            self.root.after(250, self.start_remote)
            messagebox.showinfo("配對資料已保存", "裝置認證已加密保存在目前 Windows 使用者帳號中。", parent=self.root)
        except (PairingError, OSError) as exc:
            self.remote_status = "配對尚未成功"
            messagebox.showerror("配對失敗", str(exc), parent=self.root)

    def grant_open_book(self):
        try:
            windows = GridCraftLocal(port=7979, timeout=1.2).windows()
        except Exception:
            messagebox.showerror("GridCraft 不在線", "先以本機連上 GridCraft 再授權工作簿", parent=self.root)
            return
        if not windows:
            messagebox.showinfo("沒有工作簿", "請先在 GridCraft 開啟工作簿", parent=self.root)
            return
        lines = [str(i + 1) + ". " + str(w.get("title", ""))[:65] for i, w in enumerate(windows[:20])]
        choice = simpledialog.askinteger(
            "本機工作簿授權",
            "只授權你親自指定的工作簿供 ChatGPT 唯讀使用：\n" + "\n".join(lines),
            parent=self.root, minvalue=1, maxvalue=len(lines)
        )
        if choice is None:
            return
        doc = windows[choice - 1].get("doc")
        if not isinstance(doc, str) or not doc:
            messagebox.showerror("無法授權", "工作簿沒有有效識別碼", parent=self.root)
            return
        # A click grants this exact local document. Saved files are remembered
        # by canonical path identity; transient Book1 is not remembered on disk.
        title = str(windows[choice-1].get("title", ""))[:100]
        identity = None
        try:
            detail = GridCraftLocal(port=7979, timeout=1.2).inspect(doc)
            identity = workbook_identity_hash(detail.get("path") if isinstance(detail, dict) else None)
        except Exception:
            pass
        self.session_grants[doc] = (identity, title)
        self.allowed_docs.add(doc)
        if identity:
            remembered = self.settings.get("remembered_workbooks", [])
            self.settings["remembered_workbooks"] = list(dict.fromkeys([*remembered, identity]))[-20:]
            save_settings(self.settings)
            self.remote_status = "已授權並記住這個本機檔案；下次開啟將自動恢復"
        else:
            self.remote_status = "已授權未存檔工作簿；請先存成檔案，之後才能永久自動授權"
        self.refresh()

    def _verified_grants(self, windows=None):
        """Recheck exact document identity; never auto-grant by title or UID."""
        local = GridCraftLocal(port=7979, timeout=1.2)
        if windows is None:
            windows = local.windows()
        valid = set()
        remembered = set(self.settings.get("remembered_workbooks", []))
        for w in windows[:20]:
            doc = w.get("doc")
            if not isinstance(doc, str):
                continue
            try:
                detail = local.inspect(doc)
                path_hash = workbook_identity_hash(detail.get("path") if isinstance(detail, dict) else None)
            except Exception:
                continue
            current_title = str(w.get("title",""))[:100]
            grant = self.session_grants.get(doc)
            if path_hash and path_hash in remembered:
                valid.add(doc)
            elif grant is not None and grant == (path_hash, current_title):
                valid.add(doc)
        self.allowed_docs = valid
        return valid

    def change_auto_p4(self):
        new_value = self.auto_p4_var.get()
        if new_value and not messagebox.askyesno(
            "記住本機寫入允許",
            "以後打開代理會自動允許已授權工作簿的本機 P4 寫入。"
            "每次真正寫入仍必須先在原私人 Site 核對預覽並確認。\n\n"
            "你可以隨時取消這項設定。是否啟用？", parent=self.root):
            self.auto_p4_var.set(False)
            return
        self.settings["auto_allow_p4"] = bool(self.auto_p4_var.get())
        save_settings(self.settings)
        self.p4_write_enabled = bool(self.allowed_docs and self.auto_p4_var.get())
        self.refresh()

    def toggle_p4_write(self):
        if self.p4_write_enabled:
            self.p4_write_enabled = False
            if self.auto_p4_var.get():
                self.auto_p4_var.set(False)
                self.settings["auto_allow_p4"] = False
                save_settings(self.settings)
            self.p4_state_var.set("P4 寫入：已停用；你可再按此鈕允許一次")
            return
        if not self.allowed_docs:
            messagebox.showerror("沒有授權工作簿", "先在本機授權測試工作簿，不能寫其他檔案。", parent=self.root)
            return
        approved = messagebox.askyesno(
            "P4 寫入風險確認",
            "P4 將允許 ChatGPT 在本次 Windows 執行期間，經兩階段預覽及本人確認後，"
            "修改已授權工作簿中最多 50 格。\n"
            "寫入前會建立本機 XLSX 快照，但不會自動儲存或覆寫原件。\n"
            "本功能仍屬開發候選。是否開啟本次執行的寫入授權？",
            parent=self.root,
        )
        if approved:
            self.p4_write_enabled = True
            self.p4_state_var.set("P4 寫入：已允許（僅本次執行；可再按此鈕關閉）")

    def _remote_loop(self):
        if not self.paired:
            return
        try:
            transport = HTTPSDeviceTransport(
                device_id=self.paired["device_id"], device_token=self.paired["token"])
            p4_writer = P4SafeWriter(
                local=P4Local(port=7979, timeout=3),
                backup_folder=app_directory() / "P4Backups",
                approved_docs=self.allowed_docs)
            worker = OutboundWorker(
                transport=transport, local=GridCraftLocal(port=7979, timeout=2),
                approved_docs=self.allowed_docs,
                p4_writer=p4_writer,
                p4_enabled=lambda: self.p4_write_enabled,
                grant_checker=self._verified_grants)
            while not self.remote_stop.is_set():
                worker.approved_docs = frozenset(self._verified_grants())
                try:
                    worker.run_once()
                    self.remote_status = "出站連線已收到伺服器回應（遠端 Site 仍須獨立驗收）"
                except Exception:
                    self.remote_status = "出站服務未接通或暫時不可用"
                self.remote_stop.wait(6)
        except Exception:
            self.remote_status = "無法啟動安全出站連線"

    def start_remote(self):
        if not self.paired:
            self.remote_status = "尚未經本人完成裝置配對"
            messagebox.showinfo("尚未配對", "需先在私人 Site 產生一次性配對碼", parent=self.root)
            return
        if self.remote_thread and self.remote_thread.is_alive():
            return
        self.remote_stop.clear()
        self.settings["remote_enabled"] = True
        save_settings(self.settings)
        self.remote_thread = threading.Thread(target=self._remote_loop, daemon=True)
        self.remote_thread.start()

    def stop_remote(self):
        self.p4_write_enabled = False
        self.p4_state_var.set("P4 寫入：已停用（遠端停止）")
        self.remote_stop.set()
        self.settings["remote_enabled"] = False
        save_settings(self.settings)
        self.remote_status = "遠端連線已停止（本機配對資料保留，若要撤銷雲端權限需在本人 Site 操作）"

    def stop(self):
        self.p4_write_enabled = False
        self.remote_stop.set()
        self.running = False
        self.root.destroy()


def main(argv=None):
    p = argparse.ArgumentParser(description="Lizhi GridCraft Windows local agent")
    p.add_argument("--self-test", action="store_true", help="Check packaging only; no private data")
    p.add_argument("--minimized", action="store_true", help="Start the window minimized after Windows login")
    args = p.parse_args(argv)
    if args.self_test:
        return diagnostic()
    if os.name != "nt":
        print("Windows only; run the packaged EXE on your own Windows PC.", file=sys.stderr)
        return 2
    root = tk.Tk()
    AgentUI(root, minimized=args.minimized)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
