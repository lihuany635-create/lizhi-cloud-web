/**
 * P3 isolated owner-scoped MCP HTTP host candidate.
 * NOT A DEPLOYED WORKER.  Requires a trusted server to provide verified user
 * session and bearer token. No environment secrets, OAuth callbacks or cron.
 */
import {createHash, randomUUID} from 'node:crypto';
import {WorkbenchReadOnlyBridge} from './workbench-readonly.mjs';

const TOOLS = Object.freeze(['list_projects', 'get_project_context', 'get_project_handoff']);
const validId = x => typeof x === 'string' && /^[\w-]{1,128}$/.test(x);
const assert = (ok, code) => {if (!ok) throw new HostError(code);};
const clone = x => structuredClone(x);
const safeHash = s => createHash('sha256').update(s).digest('hex');

export class HostError extends Error {
  constructor(code) {super(code); this.name='HostError'; this.code=code;}
}

/**
 * Direct HTTP MCP transport with exactly three hard-coded read methods.
 * Auth is injected by the trusted SERVER, never caller input.
 * HTTP / JSON-RPC errors are collapsed to safe public codes (no secret leak).
 */
export class TrustedMcpHttp {
  constructor({endpoint, trustedOrigin, getBearerToken, fetchImpl=fetch, timeoutMs=8000}) {
    let url;
    try {url = new URL(endpoint);} catch {throw new HostError('ENDPOINT_INVALID');}
    assert(url.protocol === 'https:' && url.pathname.endsWith('/mcp') &&
      url.username === '' && url.password === '' && !url.search && !url.hash &&
      url.origin === trustedOrigin, 'ENDPOINT_NOT_TRUSTED');
    assert(typeof getBearerToken === 'function' && typeof fetchImpl === 'function', 'HOST_NOT_CONFIGURED');
    assert(Number.isSafeInteger(timeoutMs) && timeoutMs>=100 && timeoutMs<=30000, 'TIMEOUT_INVALID');
    this.endpoint=url.href; this.getBearerToken=getBearerToken;
    this.fetchImpl=fetchImpl; this.timeoutMs=timeoutMs;
  }
  async call(name, args={}) {
    assert(TOOLS.includes(name), 'WRITE_TOOL_DENIED');
    assert(args && typeof args==='object' && !Array.isArray(args), 'ARGUMENTS_INVALID');
    if(name === 'list_projects') assert(Object.keys(args).length===0, 'ARGUMENTS_INVALID');
    else assert(Object.keys(args).length===1 && validId(args.projectId), 'ARGUMENTS_INVALID');
    let token;
    try {token=await this.getBearerToken();} catch {throw new HostError('CREDENTIAL_UNAVAILABLE');}
    assert(typeof token==='string' && token.length>=16 && !/[\r\n\s]/.test(token), 'CREDENTIAL_UNAVAILABLE');
    const id=randomUUID();
    const payload={jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:clone(args)}};
    let res;
    try {
      res=await this.fetchImpl(this.endpoint,{
        method:'POST', redirect:'manual', cache:'no-store', referrerPolicy:'no-referrer',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload), signal:AbortSignal.timeout(this.timeoutMs),
      });
    } catch {throw new HostError('MCP_TRANSPORT_FAILED');}
    assert(res && typeof res.status==='number', 'MCP_TRANSPORT_FAILED');
    if(res.status===401 || res.status===403) throw new HostError('MCP_AUTH_DENIED');
    // Do not follow 3xx redirects, including HTTP-to-HTTPS or host changes.
    if(res.status>=300 && res.status<400) throw new HostError('MCP_REDIRECT_DENIED');
    if(res.status!==200) throw new HostError('MCP_HTTP_FAILED');
    let data;
    try {
      const raw=await res.text();
      assert(raw.length<=131072, 'MCP_RESPONSE_TOO_LARGE');
      data=JSON.parse(raw);
    } catch(e) {
      if(e instanceof HostError)throw e;
      throw new HostError('MCP_RESPONSE_INVALID');
    }
    assert(data && data.jsonrpc==='2.0' && data.id===id && !('error' in data), 'MCP_PROTOCOL_INVALID');
    const result=data.result;
    assert(result && result.isError===false &&
      Array.isArray(result.content) && result.content.length===1 &&
      result.content[0]?.type==='text' && typeof result.content[0].text==='string',
      'MCP_READ_FAILED');
    // Existing workbench bridge accepts a text envelope.
    return {text:result.content[0].text};
  }
}

/**
 * No caller-supplied authenticated flag is accepted.
 * verifyOwnerSession MUST be a server-installed authorization callback,
 * validating the current subject and session expiry on every MCP operation.
 * This library cannot authenticate a person on its own.
 */
export class OwnerScopedReadHost {
  constructor({projectId, expectedOwnerSubject, verifyOwnerSession, transport, now=Date.now}) {
    assert(validId(projectId) && validId(expectedOwnerSubject), 'HOST_NOT_CONFIGURED');
    assert(typeof verifyOwnerSession==='function' && transport instanceof TrustedMcpHttp && typeof now==='function',
      'HOST_NOT_CONFIGURED');
    this.projectId=projectId;this.ownerSubject=expectedOwnerSubject;
    this.verify=verifyOwnerSession;this.transport=transport;this.now=now;
    this.bridge=new WorkbenchReadOnlyBridge({
      allowedProjectIds:[projectId],
      invoke:async(name,args)=>{
        await this._checkSession();
        return this.transport.call(name,args);
      },
    });
  }
  async _checkSession() {
    let info;
    try {info=await this.verify();} catch {throw new HostError('OWNER_SESSION_UNVERIFIED');}
    assert(info && info.authenticated===true && info.subjectId===this.ownerSubject &&
      Number.isSafeInteger(info.expiresAt) && info.expiresAt>this.now(), 'OWNER_SESSION_UNVERIFIED');
    return info;
  }
  async runOnce({projectId,mode='MANUAL'}={}) {
    assert(projectId===this.projectId, 'PROJECT_NOT_ALLOWED');
    assert(mode==='MANUAL', 'AUTO_DISABLED');
    // Session is checked at start and again before every actual tool call.
    const info=await this._checkSession();
    const receipt=await this.bridge.snapshot(projectId);
    const review=await this.bridge.reviewFresh(receipt);
    const draft=this.bridge.handoffDraft(receipt,review);
    const sessionId=randomUUID();
    return {
      sessionReceipt:{
        sessionId, ownerDigest:safeHash(sessionId+':'+info.subjectId), projectId,
        revision:receipt.revision,expiresAt:info.expiresAt,verifiedAt:this.now(),
        method:'server-verified-injected-session',authorApproved:false
      },
      snapshot:receipt,review,handoffDraft:draft,
      executedTools:this.bridge.allowedTools(),
      invokedReadCount:5,
      status:'READ_ONLY_DRAFT',paidApiUsed:false,writingEnabled:false,
    };
  }
}
