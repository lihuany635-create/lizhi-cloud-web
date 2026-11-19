"""立之 GridCraft Windows 本機代理 v0.4 — 已配對自動回連、已儲存檔案自動授權。
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
LAUNCH_MAX_ATTEMPTS = 3
LAUNCH_MAX_POLLS = 18
LAUNCH_POLL_MS = 2000


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


def locate_gridcraft_exe(saved_path: str = "") -> Path | None:
    """Use an owner-selected path, else known GridCraft install locations.

    Never execute a path coming from a remote MCP request or a workbook.
    """
    roots = [
        os.environ.get("ProgramW6432"),
        os.environ.get("PROGRAMFILES"),
        os.environ.get("ProgramFiles(x86)"),
        r"C:\Program Files",
    ]
    candidates = ([saved_path] if saved_path else []) + [
        str(Path(root) / "ArtCraft" / "GridCraft" / "gridcraft.exe")
        for root in roots if root
    ]
    for raw in candidates:
        try:
            return safe_gridcraft_exe(raw)
        except (OSError, RuntimeError, ValueError):
            continue
    return None


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
        self.root.title(APP_TITLE + "｜v0.5.1 一鍵連線修正版")
        self.root.geometry("490x275")
        self.root.minsize(440, 260)
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
        # Auto mode is scoped to workbooks currently OPEN IN LOCAL GRIDCRAFT.
        # No human UI confirmation; Site still must authenticate the owner.
        self.p4_write_enabled = False
        self.p4_state_var = tk.StringVar(value="P4 寫入：等待 GridCraft 就緒")
        self.auto_p4_var = tk.BooleanVar(value=self.settings.get("auto_allow_p4") is True)
        self.remote_status = "未配對（遠端 MCP 尚未驗收）" if not self.paired else "已配對，尚未驗證遠端服務"
        self.path_var = tk.StringVar(value=self.settings["gridcraft_path"] if "gridcraft_path" in self.settings else "")
        self.status_var = tk.StringVar(value="檢查中…")
        self.workbooks_var = tk.StringVar(value="工作簿：尚未讀取")
        self.startup_var = tk.BooleanVar(value=startup_enabled())
        self.launch_var = tk.BooleanVar(value=self.settings.get("start_gridcraft_on_login") is True)
        self.info_var = tk.StringVar(value="ChatGPT 遠端 MCP：啟動後自動連線中")
        self.running = True
        self.launch_process = None
        self.launch_attempts = 0
        self.launch_polls = 0
        self.launch_active = False
        self.launch_error = ""
        self._create_widgets()
        self.refresh()
        if minimized:
            root.after(400, root.iconify)
        # Attempt a bounded startup even when settings lost the EXE path.
        # Also recover the verified default install path if it exists.
        root.after(1100, self.launch_on_login)
        root.after(4500, self._poll)
        if self.paired:
            root.after(900, self.start_remote)

    def _create_widgets(self):
        """Minimal one-click UI: opening the EXE automatically connects."""
        frm = ttk.Frame(self.root, padding=16)
        frm.pack(fill="both", expand=True)
        ttk.Label(frm, text="立之 GridCraft", font=("Microsoft JhengHei UI", 17, "bold")).pack(anchor="w")
        ttk.Label(frm, text="開啟代理自動啟動 GridCraft 並連線｜v0.5.1",
                  foreground="#5b6472").pack(anchor="w", pady=(3, 12))
        ttk.Label(frm, textvariable=self.status_var,
                  font=("Microsoft JhengHei UI", 12, "bold")).pack(anchor="w")
        ttk.Label(frm, textvariable=self.workbooks_var).pack(anchor="w", pady=(4, 4))
        ttk.Label(frm, textvariable=self.info_var,
                  wraplength=450).pack(anchor="w", pady=(4, 12))
        buttons = ttk.Frame(frm)
        buttons.pack(fill="x", pady=5)
        ttk.Button(buttons, text="停止連線", command=self.stop_remote).pack(side="left")
        ttk.Button(buttons, text="重新連線", command=self.start_remote).pack(side="left", padx=8)
        ttk.Button(buttons, text="關閉代理", command=self.stop).pack(side="left")
        # Exceptional first-time setup only; previously paired users never need these.
        if not self.paired:
            ttk.Button(frm, text="首次配對此裝置", command=self.pair_remote).pack(anchor="w", pady=5)
        if not self.path_var.get():
            ttk.Button(frm, text="首次指定 GridCraft 程式", command=self.choose_gridcraft).pack(anchor="w")
        ttk.Label(frm, text="僅經本人帳號與裝置金鑰連線｜本機備份｜可立即停止",
                  foreground="#5b6472").pack(anchor="w", pady=(6, 0))

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
        """Start a bounded, observable one-click launch instead of a one-shot call."""
        if not self.running or self.launch_active or self.remote_stop.is_set():
            return
        self.launch_attempts = 0
        self.launch_polls = 0
        self.launch_process = None
        self.launch_error = ""
        self.launch_active = True
        self._ensure_gridcraft_started()

    def _ensure_gridcraft_started(self):
        """Nonblocking retry timer; never spawn a second still-running GridCraft."""
        if not self.running or self.remote_stop.is_set() or not self.launch_active:
            self.launch_active = False
            return
        try:
            status = GridCraftLocal(port=7979, timeout=1.2).status().get("status")
        except Exception:
            status = "CONTROL_ERROR"
        if status == "READY":
            self.launch_active = False
            self.launch_process = None
            self.launch_error = ""
            self.refresh()
            return
        if status == "UNAUTHORIZED":
            self.launch_active = False
            self.status_var.set("GridCraft 本機認證失效，已停止自動啟動")
            return

        self.launch_polls += 1
        if self.launch_polls >= LAUNCH_MAX_POLLS:
            self.launch_active = False
            if not self.launch_error:
                self.launch_error = "啟動後未收到 READY"
            self.status_var.set("GridCraft 自動啟動未成功：" + self.launch_error)
            return

        # A socket that exists but fails control negotiation may be a running
        # GridCraft instance. Do not spawn another process on top of it.
        if status == "GRIDCRAFT_OFFLINE":
            child_running = False
            if self.launch_process is not None:
                try:
                    exit_code = self.launch_process.poll()
                except (OSError, ValueError):
                    exit_code = 1
                child_running = exit_code is None
                if not child_running:
                    self.launch_error = "主程式提前結束，代碼 " + str(exit_code)[:12]
            if not child_running and self.launch_attempts < LAUNCH_MAX_ATTEMPTS:
                executable = locate_gridcraft_exe(self.path_var.get())
                if executable is None:
                    self.launch_active = False
                    self.launch_error = "找不到 GridCraft.exe；請確認安裝位置"
                    self.status_var.set(self.launch_error)
                    return
                if str(executable) != self.path_var.get():
                    self.path_var.set(str(executable))
                    self.settings["gridcraft_path"] = str(executable)
                    try:
                        save_settings(self.settings)
                    except OSError:
                        pass  # Still allow launch; next run can rediscover.
                self.launch_attempts += 1
                try:
                    self.launch_process = start_gridcraft(executable)
                    self.launch_error = ""
                    self.status_var.set(
                        f"正在自動啟動 GridCraft（第 {self.launch_attempts} 次）"
                    )
                except (OSError, ValueError) as exc:
                    # Do not leak full exception details or file names to the cloud.
                    self.launch_process = None
                    self.launch_error = "啟動程序失敗：" + type(exc).__name__
            elif child_running:
                self.status_var.set("正在等待 GridCraft 啟動完成")
        elif status == "CONTROL_ERROR":
            self.status_var.set("GridCraft 控制介面初始化中，正在重試")
        self.root.after(LAUNCH_POLL_MS, self._ensure_gridcraft_started)

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
        """Shows local readiness, not an unverified claim that cloud MCP succeeded."""
        local = GridCraftLocal(port=7979, timeout=1.2)
        state = local.status()
        status = state.get("status", "CONTROL_ERROR")
        self.status_var.set({
            "READY": "GridCraft：READY",
            "GRIDCRAFT_OFFLINE": "GridCraft 尚未啟動",
            "UNAUTHORIZED": "本機 GridCraft 授權失效",
            "CONTROL_ERROR": "本機 GridCraft 連線錯誤"
        }.get(status, status))
        if status == "GRIDCRAFT_OFFLINE" and not self.launch_active and self.launch_error:
            self.status_var.set("自動啟動失敗：" + self.launch_error)
        if status == "READY":
            try:
                windows = local.windows()
                approved = self._verified_grants(windows)
                self.workbooks_var.set(f"已開啟可用工作簿：{len(approved)} 本")
            except Exception:
                self.workbooks_var.set("工作簿讀取失敗")
                self.allowed_docs.clear()
        else:
            self.workbooks_var.set("等待 GridCraft 就緒")
            self.allowed_docs.clear()
        # Local write permission is automatic, but actual remote commit
        # remains a site/Edge user identity check + local CAS/backup decision.
        self.p4_write_enabled = bool(
            self.paired and self.allowed_docs and not self.remote_stop.is_set()
        )
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

    def forget_authorized_workbooks(self):
        """Explicit local revocation; no change to user documents or cloud pairing."""
        if not messagebox.askyesno("清除檔案授權",
             "忘記此 Windows 使用者已記住的工作簿授權？\n"
             "這不會刪除任何 Excel，遠端 MCP 將無法讀寫那些工作簿，"
             "直到你再次在本機授權。", parent=self.root):
            return
        self.settings["remembered_workbooks"] = []
        self.session_grants.clear()
        self.allowed_docs.clear()
        self.p4_write_enabled = False
        save_settings(self.settings)
        self.remote_status = "已清除工作簿授權；保留裝置配對但不能讀寫檔案"
        self.refresh()

    def _verified_grants(self, windows=None):
        """Auto-authorize only currently OPEN local workbooks; never a disk path.

        Re-evaluated before EVERY remote request; closed/removed workbooks
        instantly lose access. The owner must still be authenticated at Site.
        """
        if windows is None:
            try:
                windows = GridCraftLocal(port=7979, timeout=1.2).windows()
            except Exception:
                self.allowed_docs = set()
                self.p4_write_enabled = False
                return set()
        valid = set()
        for w in windows[:20]:
            if not isinstance(w, dict):
                continue
            doc = w.get("doc")
            if isinstance(doc, str) and re.fullmatch(r"[1-9][0-9]{0,19}", doc):
                if 1 <= int(doc) <= (1 << 64) - 1:
                    valid.add(doc)
        self.allowed_docs = valid
        self.p4_write_enabled = bool(self.paired and valid and
                                     not self.remote_stop.is_set())
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
            "這個本機授權可隨時關閉。是否開啟本次執行的寫入授權？",
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
                try:
                    worker.approved_docs = frozenset(self._verified_grants())
                    worker.run_once()
                    self.remote_status = "伺服器已回應（Cloud MCP 狀態需另行查核）"
                except Exception:
                    self.remote_status = "出站服務未接通或暫時不可用"
                self.remote_stop.wait(6)
        except Exception:
            self.remote_status = "無法啟動安全出站連線"

    def start_remote(self):
        if not self.paired:
            self.remote_status = "尚未配對；首次使用仍需要本人裝置配對一次"
            return
        if self.remote_thread and self.remote_thread.is_alive():
            return
        self.remote_stop.clear()
        self.settings["remote_enabled"] = True
        save_settings(self.settings)
        self.remote_thread = threading.Thread(target=self._remote_loop, daemon=True)
        self.remote_thread.start()

    def stop_remote(self):
        self.launch_active = False
        self.p4_write_enabled = False
        self.p4_state_var.set("P4 寫入：已停用（遠端停止）")
        self.remote_stop.set()
        self.settings["remote_enabled"] = False
        save_settings(self.settings)
        self.remote_status = "遠端連線已停止（本機配對資料保留，若要撤銷雲端權限需在本人 Site 操作）"

    def stop(self):
        self.launch_active = False
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
