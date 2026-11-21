"""Test-only guard: point LOCALAPPDATA at a throw-away directory.

On 2026-11-22 running the full suite on the owner's own Windows PC let
AgentUI() persist synthetic settings into the REAL
%LOCALAPPDATA%\\Lizhi\\GridCraftAgent\\settings.json (remote connection and
GridCraft autostart switched off). Every test module that imports the Windows
agent must call isolate_app_directory() from setUpModule().
"""
from __future__ import annotations

import os
import tempfile

_state = {}


def isolate_app_directory():
    if "tmp" in _state:
        return _state["tmp"].name
    tmp = tempfile.TemporaryDirectory(prefix="gridcraft-test-localappdata-")
    _state["tmp"] = tmp
    _state["old"] = os.environ.get("LOCALAPPDATA")
    os.environ["LOCALAPPDATA"] = tmp.name
    return tmp.name


def restore_app_directory():
    tmp = _state.pop("tmp", None)
    if tmp is None:
        return
    old = _state.pop("old", None)
    if old is None:
        os.environ.pop("LOCALAPPDATA", None)
    else:
        os.environ["LOCALAPPDATA"] = old
    tmp.cleanup()
