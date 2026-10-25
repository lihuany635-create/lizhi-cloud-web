/* Lizhi Finance browser UI driver.
 * All actions use the existing FinanceHome UI and its ordinary validation / save
 * paths; never mutate IndexedDB or Supabase directly.
 *
 * IMPORTANT: this is a browser-side capability only. It does NOT establish a
 * remote MCP transport or allow a remote Site to call window functions.
 * Remote activation must require a first-party user-controlled session bridge.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LizhiFinanceUIAgent = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  const MAX_CONTROLS = 120;
  const MAX_TEXT = 140;
  const MAX_VALUE = 300;
  const LEASE_MS = 30 * 60 * 1000;
  const SENSITIVE = /(?:delete|remove|archive|clear|reset|confirm|commit|import|save|submit|wipe|revoke|刪|清除|重置|封存|匯入|確認|儲存)/i;
  const SECRET = /(?:password|passwd|token|secret|auth|credential|api.?key|card.?number|cvv|cvc|密碼|金鑰|完整卡號|驗證碼)/i;
  const CONTROL = "button,input:not([type=hidden]),textarea,select,[role=button],[data-finance-view]";
  let permitted = false, expires = 0, revision = "", handles = new Map(), active = false;
  let banner = null, timer = null, observer = null;
  const clean = x => String(x ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_TEXT);
  function userReady() {
    return Boolean(root.LizhiAuth?.user && root.LizhiAuth?.client);
  }
  function workspace() {
    return root.document?.querySelector("[data-finance-root]") ?? null;
  }
  function valid() {
    if (!permitted || Date.now() > expires || !userReady() || !workspace()) {
      if (permitted) stop();
      return false;
    }
    return true;
  }
  function visible(node) {
    if (!node?.isConnected || node.disabled || node.getAttribute("aria-hidden") === "true") return false;
    if (node.getAttribute("type") === "password" || node.getAttribute("type") === "file") return false;
    if (SECRET.test([node.name, node.id, node.autocomplete, node.getAttribute("aria-label")].join(" "))) return false;
    if (node.closest("[hidden],[inert],[aria-hidden=true]")) return false;
    if (!node.getClientRects().length) return false;
    const style = root.getComputedStyle?.(node);
    return style?.visibility !== "hidden" && style?.display !== "none";
  }
  function kind(node) {
    return node.tagName?.toLowerCase() === "select" ? "select" :
      /^(INPUT|TEXTAREA)$/.test(node.tagName ?? "") ? "input" : "click";
  }
  function label(node) {
    let text = node.getAttribute("aria-label") || node.getAttribute("title") ||
      node.labels?.[0]?.textContent || node.textContent || node.getAttribute("placeholder") ||
      node.name || node.dataset?.financeAction || node.dataset?.financeView || "";
    if (SECRET.test([node.name, node.id, node.autocomplete, text].join(" "))) return "[protected]";
    return clean(text);
  }
  function isSensitive(node) {
    if (node.closest("form")?.matches?.('[data-finance-form]') &&
        (node.type === "submit" || node.getAttribute("type") === "submit")) return true;
    return SENSITIVE.test([node.dataset?.financeAction,node.name,label(node),node.getAttribute("value")].join(" "));
  }
  function stop() {
    permitted = false;
    expires = 0;
    revision = "";
    handles.clear();
    if (timer) { clearTimeout(timer); timer = null; }
    renderButton();
    root.dispatchEvent?.(new root.CustomEvent("lizhi-finance-remote-consent",{detail:{enabled:false}}));
  }
  function startFromTrustedClick(event) {
    if (!event?.isTrusted) return {ok:false,code:"USER_GESTURE_REQUIRED"};
    if (!workspace() || !userReady()) return {ok:false,code:"FINANCE_LOGIN_REQUIRED"};
    if (permitted) { stop(); return {ok:true,enabled:false}; }
    permitted = true;
    expires = Date.now() + LEASE_MS;
    if (timer) clearTimeout(timer);
    timer = setTimeout(stop, LEASE_MS);
    renderButton();
    root.dispatchEvent?.(new root.CustomEvent("lizhi-finance-remote-consent",{detail:{enabled:true}}));
    return {ok:true,enabled:true,expires_at:new Date(expires).toISOString()};
  }
  function inspect() {
    if (!valid()) return {ok:false,code:"FINANCE_UI_NOT_AUTHORIZED_OR_OFFLINE"};
    const host = workspace();
    const list = [...host.querySelectorAll(CONTROL)].filter(visible).slice(0, MAX_CONTROLS);
    handles.clear();
    revision = root.crypto?.randomUUID?.() ?? String(Date.now()) + ":" + Math.random().toString(36).slice(2);
    const controls = list.map((node, i) => {
      const ref = "u" + i;
      handles.set(ref,node);
      const item = {ref,kind:kind(node),label:label(node),
        sensitive:isSensitive(node),disabled:!!node.disabled};
      if (kind(node) === "select")
        item.options = [...node.options].slice(0, 40).map(o=>({value:clean(o.value),label:clean(o.text)}));
      return item;
    });
    // Never return HTML, hidden controls, free-form transaction notes,
    // input values, credentials, financial record payloads or executable code.
    return {ok:true,revision,controls,control_count:controls.length,
      truncated:list.length >= MAX_CONTROLS,expires_at:new Date(expires).toISOString(),
      note:"在既有理財管家介面操作；提交、刪除及重大修改仍需本人確認。"};
  }
  function interact(command) {
    if (!valid()) return {ok:false,code:"FINANCE_UI_NOT_AUTHORIZED_OR_OFFLINE"};
    if (!command || typeof command !== "object" || Array.isArray(command))
      return {ok:false,code:"INVALID_COMMAND"};
    if (command.revision !== revision || !revision)
      return {ok:false,code:"STALE_UI_INSPECTION"};
    const node = handles.get(command.ref);
    if (!node || !node.isConnected || !workspace()?.contains(node) || !visible(node))
      return {ok:false,code:"UI_CONTROL_NOT_AVAILABLE"};
    if (!["click","fill","select"].includes(command.action))
      return {ok:false,code:"UNSUPPORTED_ACTION"};
    const type = kind(node);
    if ((command.action === "click" && type !== "click") ||
        (command.action === "fill" && type !== "input") ||
        (command.action === "select" && type !== "select"))
      return {ok:false,code:"UI_ACTION_TYPE_MISMATCH"};
    if (isSensitive(node) && command.action === "click") {
      if (command.confirm !== true) return {ok:false,code:"EXPLICIT_CONFIRMATION_REQUIRED",
        target:label(node)};
      // A remote JSON flag is NOT evidence of the human's approval.
      // Require a native browser confirmation for material changes.
      if (!root.confirm?.("允許 AI 執行理財管家操作：「" + label(node) + "」？"))
        return {ok:false,code:"USER_REJECTED"};
    }
    try {
      if (command.action === "click") node.click();
      else if (command.action === "fill") {
        if (node.readOnly || !["text","number","date","search","email","tel","textarea"].includes(
          node.tagName === "TEXTAREA" ? "textarea" : (node.type || "text")))
          return {ok:false,code:"FIELD_NOT_EDITABLE"};
        if (typeof command.value !== "string" || command.value.length > MAX_VALUE)
          return {ok:false,code:"VALUE_INVALID_OR_TOO_LONG"};
        const prop = node.tagName === "TEXTAREA" ? root.HTMLTextAreaElement?.prototype :
          root.HTMLInputElement?.prototype;
        const setter = Object.getOwnPropertyDescriptor(prop||{},"value")?.set;
        if (setter) setter.call(node,command.value);
        else node.value = command.value;
        node.dispatchEvent(new root.Event("input",{bubbles:true}));
        node.dispatchEvent(new root.Event("change",{bubbles:true}));
      } else {
        if (typeof command.value !== "string" ||
            ![...node.options].some(o=>o.value===command.value))
          return {ok:false,code:"SELECT_VALUE_NOT_ALLOWED"};
        node.value = command.value;
        node.dispatchEvent(new root.Event("change",{bubbles:true}));
      }
      // FinanceHome re-renders after some clicks. Require re-inspection.
      revision = "";
      handles.clear();
      return {ok:true,dispatched:true,completed:false,
        note:"僅代表 UI 事件已送出，不能宣稱財務交易已成功寫入；應重新檢視網站或交易紀錄。"};
    } catch {
      revision="";handles.clear();
      return {ok:false,code:"FINANCE_UI_INTERACTION_FAILED"};
    }
  }
  function renderButton() {
    if (!root.document?.body) return;
    if (!banner?.isConnected) {
      banner = root.document.createElement("button");
      banner.type = "button";
      banner.setAttribute("data-finance-remote-consent","");
      banner.setAttribute("aria-label","切換理財 AI 網頁操作授權");
      Object.assign(banner.style,{position:"fixed",bottom:"20px",right:"20px",
        zIndex:"2147483646",padding:"10px 14px",borderRadius:"20px",
        border:"1px solid #888",background:"#fff",color:"#222",fontSize:"14px"});
      banner.addEventListener("click", e=>{startFromTrustedClick(e);});
      root.document.body.append(banner);
    }
    const hide = !workspace();
    if (banner.hidden !== hide) banner.hidden = hide;
    const label = permitted ? "停止理財 AI 操作" : "允許理財 AI 操作";
    if (banner.textContent !== label) banner.textContent = label;
    const pressed = permitted ? "true" : "false";
    if (banner.getAttribute("aria-pressed") !== pressed) banner.setAttribute("aria-pressed",pressed);
  }
  function install() {
    if (active || !root.document || !root.MutationObserver) return;
    active = true;
    // Preserve opt-in when the user switches between the Finance tab and ChatGPT.
    root.addEventListener?.("pagehide",stop);
    root.addEventListener?.("lizhi-account-logout",stop);
    observer = new root.MutationObserver(()=>renderButton());
    observer.observe(root.document.body,{subtree:true,childList:true});
    renderButton();
  }
  const api = Object.freeze({install,inspect,interact,stop,
    get state() {return {enabled:valid(),expires_at:permitted?new Date(expires).toISOString():null,
      workspace_open:!!workspace()};}});
  return api;
});
