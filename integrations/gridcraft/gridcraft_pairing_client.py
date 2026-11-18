"""Windows P3 device pairing, user-scoped DPAPI credential store (candidate only).

No server endpoint is deployed yet. Never print or log the device token.
Pairing runs only when Windows user enters a short-lived code from their own
verified Private Site; the GridCraft local token is never transferred.
"""
from __future__ import annotations

import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import secrets
import urllib.error
import urllib.request
import uuid

from gridcraft_outbound_worker import BASE, NoRedirect


class PairingError(RuntimeError):
    pass


class DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_ubyte))]


def dpapi(data: bytes, protect: bool) -> bytes:
    if os.name != "nt":
        raise PairingError("Windows DPAPI is required")
    if not isinstance(data, bytes) or len(data) > 4096:
        raise PairingError("invalid credential blob")
    backing = ctypes.create_string_buffer(data)
    input_blob = DATA_BLOB(len(data),ctypes.cast(backing,ctypes.POINTER(ctypes.c_ubyte)))
    output_blob = DATA_BLOB()
    method = ctypes.windll.crypt32.CryptProtectData if protect else ctypes.windll.crypt32.CryptUnprotectData
    method.restype = wintypes.BOOL
    method.argtypes = [
        ctypes.POINTER(DATA_BLOB),ctypes.c_void_p,ctypes.c_void_p,
        ctypes.c_void_p,ctypes.c_void_p,wintypes.DWORD,ctypes.POINTER(DATA_BLOB)
    ]
    flags = 0x1  # CRYPTPROTECT_UI_FORBIDDEN
    if not method(ctypes.byref(input_blob),None,None,None,None,flags,ctypes.byref(output_blob)):
        raise PairingError("Windows credential protection failed")
    try:
        return ctypes.string_at(output_blob.pbData,output_blob.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(ctypes.cast(output_blob.pbData,ctypes.c_void_p))


class DeviceStore:
    def __init__(self, folder:Path):
        self.path=Path(folder)/"device-credential.dpapi"

    def save(self,device_id:str,token:str):
        if not (isinstance(device_id,str) and device_id.startswith("gridcraft-") and
                isinstance(token,str) and len(token)==64 and all(ch in "0123456789abcdef" for ch in token)):
            raise PairingError("invalid device credentials")
        encrypted=dpapi(json.dumps({"device_id":device_id,"token":token},separators=(",",":")).encode(),True)
        self.path.parent.mkdir(parents=True,exist_ok=True)
        temporary=self.path.with_suffix(".dpapi.tmp")
        try:
            temporary.write_bytes(encrypted)
            os.replace(temporary,self.path)
        finally:
            if temporary.exists():temporary.unlink()

    def load(self):
        try:
            blob=self.path.read_bytes()
        except FileNotFoundError:
            return None
        try:
            raw=json.loads(dpapi(blob,False))
            if (not isinstance(raw,dict) or not isinstance(raw.get("device_id"),str)
                    or not isinstance(raw.get("token"),str) or len(raw["token"])!=64):
                raise PairingError("credential data invalid")
            return raw
        except (ValueError,UnicodeError,KeyError):
            raise PairingError("Windows credential cannot be unlocked") from None


def pair_one_time(code:str, *,send=None) -> tuple[str,str]:
    if not isinstance(code,str) or not len(code)==16 or not all(ch in "0123456789abcdefABCDEF" for ch in code):
        raise PairingError("配對碼格式應為 16 位十六進位")
    device_id="gridcraft-"+uuid.uuid4().hex
    token=secrets.token_hex(32)
    payload={"code":code.lower(),"deviceId":device_id,"deviceToken":token}
    if send is None:
        send=_post_pair
    try:
        reply=send(payload)
    except (OSError,urllib.error.HTTPError,urllib.error.URLError,TimeoutError,ValueError):
        raise PairingError("配對服務無法連線或代碼已失效") from None
    if not isinstance(reply,dict) or reply.get("ok") is not True or reply.get("deviceId")!=device_id:
        raise PairingError("配對服務未確認本人裝置")
    return device_id,token


def _post_pair(payload:dict):
    raw=json.dumps(payload,separators=(",",":")).encode("utf-8")
    request=urllib.request.Request(BASE+"/pair",data=raw,method="POST",
      headers={"Content-Type":"application/json","Accept":"application/json","Cache-Control":"no-store"})
    opener=urllib.request.build_opener(NoRedirect())
    with opener.open(request,timeout=7) as response:
        if response.status!=200:raise PairingError("PAIRING_UNAVAILABLE")
        result=response.read(2049)
        if len(result)>2048:raise PairingError("PAIRING_RESPONSE_LIMIT")
        return json.loads(result)


def revoke_local(store:DeviceStore):
    """Disconnect locally; server-side revocation is an independent owner action."""
    try:store.path.unlink()
    except FileNotFoundError:pass
