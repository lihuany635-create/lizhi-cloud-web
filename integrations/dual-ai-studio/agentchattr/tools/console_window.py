"""Show or hide the console window that belongs to a running process.

Usage: python console_window.py <pid> show|hide [title]
Only changes window visibility/title; never sends any input.
"""
import ctypes
import sys

k = ctypes.WinDLL("kernel32", use_last_error=True)
u = ctypes.WinDLL("user32", use_last_error=True)
k.GetConsoleWindow.restype = ctypes.c_void_p

pid, action = int(sys.argv[1]), sys.argv[2]
title = sys.argv[3] if len(sys.argv) > 3 else None

k.FreeConsole()
if not k.AttachConsole(pid):
    sys.exit(f"cannot attach to {pid}")
if title:
    k.SetConsoleTitleW(title)
hwnd = k.GetConsoleWindow()
k.FreeConsole()

if action == "show":
    u.ShowWindow(ctypes.c_void_p(hwnd), 9)  # SW_RESTORE
    u.SetForegroundWindow(ctypes.c_void_p(hwnd))
else:
    u.ShowWindow(ctypes.c_void_p(hwnd), 0)  # SW_HIDE
