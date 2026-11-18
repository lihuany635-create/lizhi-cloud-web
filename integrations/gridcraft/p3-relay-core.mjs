// P3 candidate GridCraft relay contract — test-only ephemeral implementation.
// IMPORTANT: Memory state is not durable on Cloudflare Workers/Supabase Edge.
// Do NOT deploy this in production or advertise MCP until an approved durable
// owner/device queue, cryptographic pairing and live identity checks are in place.

const A1 = /^([A-Z]{1,3})([1-9][0-9]{0,5})(?::([A-Z]{1,3})([1-9][0-9]{0,5}))?$/;
const DOC = /^[A-Za-z0-9._:-]{1,100}$/;
const REQ = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,95}$/;
const TOOLS = new Set(["gridcraft_status", "gridcraft_list_workbooks", "gridcraft_read_range"]);
const MAX_JSON_RESULT = 24 * 1024;

export class RelayFault extends Error {
  constructor(code) { super(code); this.code = code; }
}

const isObj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const hex64 = x => typeof x === "string" && /^[a-f0-9]{64}$/i.test(x);
const nowMs = () => Date.now();

async function digest(input) {
  const arr = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(arr)].map(x => x.toString(16).padStart(2, "0")).join("");
}

// Avoid short-circuit hash prefix differences even in test adapters.
function equalDigest(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let delta = 0;
  for (let i = 0; i < a.length; i++) delta |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return delta === 0;
}

function a1bounds(range) {
  if (typeof range !== "string" || range.length > 22) throw new RelayFault("INVALID_RANGE");
  const m = A1.exec(range);
  if (!m) throw new RelayFault("INVALID_RANGE");
  const col = value => [...value].reduce((n, x) => n * 26 + x.charCodeAt(0) - 64, 0);
  const r1 = Number(m[2]), r2 = Number(m[4] || m[2]);
  const c1 = col(m[1]), c2 = col(m[3] || m[1]);
  if (r2 < r1 || c2 < c1 || r2 - r1 + 1 > 50 || c2 - c1 + 1 > 20 ||
      (r2 - r1 + 1) * (c2 - c1 + 1) > 200) throw new RelayFault("RANGE_LIMIT");
  return {r1, r2, c1, c2};
}

export const GRIDCRAFT_TOOLS = Object.freeze([
  {name: "gridcraft_status", description: "查詢本人的 Windows GridCraft 代理狀態；電腦關機即回報 DEVICE_OFFLINE。",
    inputSchema: {type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:true}},
  {name: "gridcraft_list_workbooks", description: "列出本人已授權的 GridCraft 桌面工作簿（限 20 本）。",
    inputSchema: {type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:true}},
  {name: "gridcraft_read_range", description: "從本機授權 GridCraft 工作簿讀取指定工作表 A1 範圍；最多 200 格。",
    inputSchema: {type:"object",properties:{
      doc:{type:"string",minLength:1,maxLength:100,description:"從 gridcraft_list_workbooks 取得的 doc ID"},
      sheet:{type:"string",minLength:1,maxLength:80},
      range:{type:"string",minLength:2,maxLength:22,description:"例如 B2:D6"}
    },required:["doc","sheet","range"],additionalProperties:false}, annotations:{readOnlyHint:true}}
]);

export function validateCall(name, args) {
  if (!TOOLS.has(name)) throw new RelayFault("METHOD_DENIED");
  if (!isObj(args)) throw new RelayFault("INVALID_ARGS");
  if (name === "gridcraft_status" || name === "gridcraft_list_workbooks") {
    if (Object.keys(args).length) throw new RelayFault("INVALID_ARGS");
    return {};
  }
  if (Object.keys(args).sort().join("|") !== "doc|range|sheet") throw new RelayFault("INVALID_ARGS");
  if (typeof args.doc !== "string" || !DOC.test(args.doc)) throw new RelayFault("INVALID_DOC");
  if (typeof args.sheet !== "string" || args.sheet.length < 1 || args.sheet.length > 80 ||
      /[\r\n\x00-\x1f]/.test(args.sheet)) throw new RelayFault("INVALID_SHEET");
  a1bounds(args.range);
  return {doc:args.doc,sheet:args.sheet,range:args.range};
}

export class EphemeralP3Relay {
  constructor({ownerId,deviceId,deviceToken,clock=nowMs,ttlMs=12000,heartbeatMs=12000}) {
    if (typeof ownerId !== "string" || ownerId.length < 8 ||
        typeof deviceId !== "string" || !DOC.test(deviceId) || !hex64(deviceToken)) {
      throw new Error("Missing verified owner/device bootstrap");
    }
    this.ownerId = ownerId;
    this.deviceId = deviceId;
    this.expectedToken = null;
    this.deviceToken = deviceToken; // ONLY for isolated test; production stores hash in a private table.
    this.clock = clock;
    this.ttlMs = ttlMs;
    this.heartbeatMs = heartbeatMs;
    this.lastSeen = -Infinity;
    this.deviceState = "DEVICE_OFFLINE";
    this.queue = [];
    this.inflight = null;
    this.issued = new Map();
  }

  authorizeSite(owner) {
    if (typeof owner !== "string" || owner !== this.ownerId) throw new RelayFault("UNAUTHORIZED");
  }

  async authorizeDevice(deviceId, token) {
    if (deviceId !== this.deviceId || !hex64(token) ||
        !equalDigest(await digest(token), await digest(this.deviceToken))) {
      throw new RelayFault("UNAUTHORIZED");
    }
  }

  state() {
    if (this.clock() - this.lastSeen > this.heartbeatMs) return "DEVICE_OFFLINE";
    return this.deviceState;
  }

  async heartbeat({deviceId,deviceToken,status}) {
    await this.authorizeDevice(deviceId,deviceToken);
    if (!["READY","GRIDCRAFT_OFFLINE","UNAUTHORIZED","CONTROL_ERROR"].includes(status)) {
      throw new RelayFault("INVALID_STATUS");
    }
    this.deviceState = status;
    this.lastSeen = this.clock();
    return {state:this.state()};
  }

  async dispatch({verifiedOwner,name,args={},requestId,waitMs=12000}) {
    this.authorizeSite(verifiedOwner);
    const body = validateCall(name,args);
    if (name === "gridcraft_status") return {status:this.state(),backend:"desktop",write_enabled:false};
    if (this.state() !== "READY") throw new RelayFault(this.state());
    if (typeof requestId !== "string" || !REQ.test(requestId)) throw new RelayFault("INVALID_REQUEST_ID");
    if (!Number.isInteger(waitMs) || waitMs < 1 || waitMs > this.ttlMs) throw new RelayFault("INVALID_WAIT");
    const prior = this.issued.get(requestId);
    if (prior) throw new RelayFault("REPLAY_DENIED"); // read-only, but never run duplicate jobs.
    if (this.queue.length >= 6 || this.inflight) throw new RelayFault("DEVICE_BUSY");
    const at = this.clock();
    let finish;
    const finished = new Promise(resolve => {finish=resolve;});
    const job = {id:requestId,name,args:body,at,expires:at+this.ttlMs,finish,state:"QUEUED"};
    this.issued.set(requestId,job);
    this.queue.push(job);
    const timer = setTimeout(() => {
      if (job.state === "QUEUED" || job.state === "CLAIMED") {
        job.state="EXPIRED";
        finish({error:"DEVICE_TIMEOUT"});
        if (this.inflight === job) this.inflight = null;
      }
    }, waitMs);
    try {
      const result = await finished;
      if (result.error) throw new RelayFault(result.error);
      return result.result;
    } finally {
      clearTimeout(timer);
      this.queue = this.queue.filter(x=>x!==job);
    }
  }

  async poll({deviceId,deviceToken}) {
    await this.authorizeDevice(deviceId,deviceToken);
    if (this.state() !== "READY") return {job:null,status:this.state()};
    if (this.inflight) return {job:null,status:"BUSY"};
    const job = this.queue.shift();
    if (!job || job.state !== "QUEUED" || this.clock() > job.expires) {
      if (job && job.state === "QUEUED") {job.state="EXPIRED";job.finish({error:"DEVICE_TIMEOUT"});}
      return {job:null,status:"IDLE"};
    }
    job.state="CLAIMED";
    this.inflight=job;
    return {job:{id:job.id,name:job.name,args:job.args,expiresAt:job.expires},status:"CLAIMED"};
  }

  async complete({deviceId,deviceToken,id,result}) {
    await this.authorizeDevice(deviceId,deviceToken);
    const job=this.inflight;
    if (!job || job.id !== id || job.state!=="CLAIMED" || this.clock()>job.expires) {
      throw new RelayFault("UNKNOWN_OR_EXPIRED_REQUEST");
    }
    const serialized=JSON.stringify(result);
    if (!serialized || serialized.length>MAX_JSON_RESULT || !isObj(result)) {
      throw new RelayFault("RESULT_LIMIT");
    }
    job.state="DONE";
    this.inflight=null;
    job.finish({result});
    return {accepted:true};
  }
}
