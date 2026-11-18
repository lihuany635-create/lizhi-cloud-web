"""立之 GridCraft Windows 本機代理 v0.1 — 可攜式、僅本機的安全控制面板。

Does NOT connect to ChatGPT or a cloud relay yet (P3 pending).
This program opens NO network listener, touches only 127.0.0.1, and does
not expose GridCraft's local control token in user-visible output.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from gridcraft_desktop_local import GridCraftLocal

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
        }
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return {}


def save_settings(settings: dict, path: Path | None = None) -> None:
    path = path or settings_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = {
        "gridcraft_path": str(settings.get("gridcraft_path") or "")[:MAX_PATH],
        "start_gridcraft_on_login": settings.get("start_gridcraft_on_login") is True,
    }
    tmp = path.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


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
        self.root.title(APP_TITLE + "｜v0.1")
        self.root.geometry("540x395")
        self.root.minsize(470, 340)
        self.root.protocol("WM_DELETE_WINDOW", self.stop)
        self.settings = load_settings()
        self.path_var = tk.StringVar(value=self.settings["gridcraft_path"] if "gridcraft_path" in self.settings else "")
        self.status_var = tk.StringVar(value="檢查中…")
        self.workbooks_var = tk.StringVar(value="工作簿：尚未讀取")
        self.startup_var = tk.BooleanVar(value=startup_enabled())
        self.launch_var = tk.BooleanVar(value=self.settings.get("start_gridcraft_on_login") is True)
        self.info_var = tk.StringVar(value="ChatGPT 遠端 MCP：尚未接通（P3 待驗收）")
        self.running = True
        self._create_widgets()
        self.refresh()
        if minimized:
            root.after(400, root.iconify)
            if self.launch_var.get():
                root.after(1200, self.launch_on_login)
        root.after(4500, self._poll)

    def _create_widgets(self):
        frm = ttk.Frame(self.root, padding=16)
        frm.pack(fill="both", expand=True)
        ttk.Label(frm, text="立之 GridCraft 連線代理", font=("Microsoft JhengHei UI", 17, "bold")).pack(anchor="w")
        ttk.Label(frm, text="本機控制｜不會開放網際網路連入｜v0.1", foreground="#5b6472").pack(anchor="w", pady=(2, 13))
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
        ttk.Label(frm, textvariable=self.info_var, foreground="#926c10", wraplength=490).pack(anchor="w", pady=4)
        ttk.Label(frm, text="安全狀態：唯讀｜127.0.0.1:7979｜不輸出控制權杖", foreground="#5b6472").pack(anchor="w")

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
        self.info_var.set("ChatGPT 遠端 MCP：尚未接通（P3 待驗收）")

    def _poll(self):
        if self.running:
            try:
                self.refresh()
            finally:
                self.root.after(4500, self._poll)

    def stop(self):
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
