"""Windows-only safe singleton and installed-EXE update plumbing for GridCraft.

No network listener, no elevation, and no termination of foreign processes.
The old v0.5.2 does not support a Quit event; upgrading it while running
must fail safely rather than killing a possible in-progress P4 write.
"""
from __future__ import annotations

import ctypes
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
from ctypes import wintypes

MUTEX_NAME=r"Local\LizhiGridCraftAgent"
QUIT_EVENT_NAME=r"Local\LizhiGridCraftAgent.Quit"
ERROR_ALREADY_EXISTS=183
WAIT_OBJECT_0=0
WAIT_ABANDONED=0x80
WAIT_TIMEOUT=258
EVENT_MODIFY_STATE=0x0002
SYNCHRONIZE=0x00100000
SW_RESTORE=9


class WinLifecycleError(RuntimeError):
    pass


def _kernel():
    if os.name!="nt":
        raise WinLifecycleError("WINDOWS_REQUIRED")
    return ctypes.WinDLL("kernel32",use_last_error=True)


def _configure(kernel):
    kernel.CreateMutexW.argtypes=[ctypes.c_void_p,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.CreateMutexW.restype=wintypes.HANDLE
    kernel.OpenMutexW.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.OpenMutexW.restype=wintypes.HANDLE
    kernel.ReleaseMutex.argtypes=[wintypes.HANDLE]
    kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    kernel.CreateEventW.argtypes=[ctypes.c_void_p,wintypes.BOOL,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.CreateEventW.restype=wintypes.HANDLE
    kernel.OpenEventW.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.OpenEventW.restype=wintypes.HANDLE
    kernel.SetEvent.argtypes=[wintypes.HANDLE]
    kernel.WaitForSingleObject.argtypes=[wintypes.HANDLE,wintypes.DWORD]
    kernel.WaitForSingleObject.restype=wintypes.DWORD
    return kernel


def acquire_single_instance():
    kernel=_configure(_kernel())
    handle=kernel.CreateMutexW(None,True,MUTEX_NAME)
    if not handle:
        raise WinLifecycleError("MUTEX_FAILED")
    exists=ctypes.get_last_error()==ERROR_ALREADY_EXISTS
    return handle,exists


def release_instance(handle):
    if not handle:return
    kernel=_configure(_kernel())
    kernel.ReleaseMutex(handle)
    kernel.CloseHandle(handle)


def focus_existing_agent(title_prefix="立之 GridCraft 連線代理"):
    """Find only the known application window, restore and focus it."""
    if os.name!="nt":return False
    user32=ctypes.WinDLL("user32",use_last_error=True)
    callback_type=ctypes.WINFUNCTYPE(wintypes.BOOL,wintypes.HWND,wintypes.LPARAM)
    user32.EnumWindows.argtypes=[callback_type,wintypes.LPARAM]
    user32.GetWindowTextLengthW.argtypes=[wintypes.HWND]
    user32.GetWindowTextW.argtypes=[wintypes.HWND,wintypes.LPWSTR,ctypes.c_int]
    user32.ShowWindow.argtypes=[wintypes.HWND,ctypes.c_int]
    user32.SetForegroundWindow.argtypes=[wintypes.HWND]
    found=[]
    @callback_type
    def visitor(hwnd,_lparam):
        length=user32.GetWindowTextLengthW(hwnd)
        if length<=0 or length>256:
            return True
        buf=ctypes.create_unicode_buffer(length+1)
        user32.GetWindowTextW(hwnd,buf,len(buf))
        if buf.value.startswith(title_prefix):
            found.append(hwnd)
            return False
        return True
    user32.EnumWindows(visitor,0)
    if not found:return False
    user32.ShowWindow(found[0],SW_RESTORE)
    user32.SetForegroundWindow(found[0])
    return True


def create_quit_event():
    kernel=_configure(_kernel())
    handle=kernel.CreateEventW(None,False,False,QUIT_EVENT_NAME)
    if not handle:
        raise WinLifecycleError("QUIT_EVENT_FAILED")
    return handle


def watch_quit_event(event_handle,stop_event,quit_requested):
    """Call only thread-safe threading.Event.set(), never Tk from this thread."""
    kernel=_configure(_kernel())
    while not stop_event.is_set():
        result=kernel.WaitForSingleObject(event_handle,1000)
        if result==WAIT_OBJECT_0:
            quit_requested.set()
            return


def signal_quit_and_wait(seconds=10):
    """Signal a v0.5.3+ owner, then wait for its held mutex to be released.

    Old v0.5.2 has neither event nor mutex; caller separately checks for a
    visible legacy UI and refuses to overwrite its running binary.
    """
    kernel=_configure(_kernel())
    event=kernel.OpenEventW(EVENT_MODIFY_STATE,False,QUIT_EVENT_NAME)
    if event:
        try:
            if not kernel.SetEvent(event):
                raise WinLifecycleError("QUIT_SIGNAL_FAILED")
        finally:
            kernel.CloseHandle(event)
    mutex=kernel.OpenMutexW(SYNCHRONIZE,False,MUTEX_NAME)
    if not mutex:
        return bool(event)
    try:
        result=kernel.WaitForSingleObject(mutex,max(0,int(seconds*1000)))
        if result not in (WAIT_OBJECT_0,WAIT_ABANDONED):
            raise WinLifecycleError("OLD_AGENT_STILL_RUNNING")
        # The waiting updater acquired ownership of the mutex.
        kernel.ReleaseMutex(mutex)
        return True
    finally:
        kernel.CloseHandle(mutex)


def file_sha256(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as handle:
        while data:=handle.read(1024*1024):
            h.update(data)
    return h.hexdigest()


def maybe_update_installed(source,target):
    """Update a stable installed copy and relaunch it with --minimized.

    Returns False when no update needed; True when another exe was launched.
    Never overwrite the legacy running EXE or delete unsaved workbooks.
    """
    if not getattr(sys,"frozen",False):
        return False
    source=Path(source).resolve(strict=True)
    target=Path(target).resolve(strict=False)
    if source==target or (target.exists() and file_sha256(source)==file_sha256(target)):
        return False
    if os.name!="nt":
        raise WinLifecycleError("WINDOWS_REQUIRED")
    # If old v0.5.2 has no event/mutex, a visible window is the only safe
    # evidence that it is still running. Never force terminate it.
    try:
        ready=signal_quit_and_wait(10)
    except WinLifecycleError:
        focus_existing_agent()
        raise
    if not ready and focus_existing_agent():
        raise WinLifecycleError("LEGACY_AGENT_CLOSE_REQUIRED")
    target.parent.mkdir(parents=True,exist_ok=True)
    temp=target.with_suffix(".update.tmp")
    try:
        shutil.copy2(source,temp)
        os.replace(temp,target)
        subprocess.Popen([str(target),"--minimized"],cwd=str(target.parent),
                         shell=False,stdin=subprocess.DEVNULL,
                         stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
                         close_fds=True)
    except (OSError,ValueError):
        raise WinLifecycleError("AGENT_UPDATE_FAILED") from None
    finally:
        if temp.exists():
            temp.unlink()
    return True
