"use strict";
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { verifyAndRecord } = require("./cad-artifact-manifest.cjs");
class CadCliError extends Error {
  constructor(code, message) { super(message); this.name = "CadCliError"; this.code = code; }
}
const MAX_BYTES = 100 * 1024 * 1024;
function validateScript(script) {
  if (typeof script !== "string" || script.length > 300000 || script.length < 8 || script.includes("\r") || script.includes("\0"))
    throw new CadCliError("CAD_SCRIPT_INVALID", "Invalid compiled drawing script");
  const lines = script.trimEnd().split("\n");
  let i = 0;
  if (lines[0] === "_-LAYER" && lines[1] === "_M" && lines[2] === "FURNITURE" && lines[3] === "") i = 4;
  let polygons = 0;
  while (i < lines.length) {
    if (lines[i++] !== "_PLINE") throw new CadCliError("CAD_SCRIPT_DENIED", "Only compiled polylines are allowed");
    let points = 0;
    while (i < lines.length && lines[i] !== "_C") {
      const m = /^(-?(?:\d+\.?\d*|\.\d+))\,(-?(?:\d+\.?\d*|\.\d+))$/.exec(lines[i++]);
      if (!m || ![+m[1], +m[2]].every(x => Number.isFinite(x) && Math.abs(x) <= 1e6))
        throw new CadCliError("CAD_SCRIPT_DENIED", "Unsafe coordinate");
      if (++points > 10000) throw new CadCliError("CAD_SCRIPT_DENIED", "Too many points");
    }
    if (points < 3 || lines[i++] !== "_C") throw new CadCliError("CAD_SCRIPT_DENIED", "Polyline must be closed");
    if (++polygons > 10000) throw new CadCliError("CAD_SCRIPT_DENIED", "Too many polylines");
  }
  if (polygons === 0) throw new CadCliError("CAD_SCRIPT_DENIED", "No geometry");
  return polygons;
}
function subprocess(bin, args, { cwd, timeoutMs, spawnImpl }) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(bin, args, { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"], env: { PATH: process.env.PATH || "", HOME: cwd, CADCRAFT_CONFIG_DIR: cwd } });
    let settled = false, stderr = "";
    const timeout = setTimeout(() => { child.kill("SIGKILL"); finish(new CadCliError("CAD_CLI_TIMEOUT", "CADCraft operation timed out")); }, timeoutMs);
    const finish = (error) => { if (settled) return; settled = true; clearTimeout(timeout); error ? reject(error) : resolve(); };
    child.on("error", error => finish(new CadCliError("CAD_CLI_LAUNCH", error.message)));
    child.stderr?.on("data", chunk => { stderr = (stderr + chunk.toString("utf8")).slice(-4096); });
    child.stdout?.on("data", () => {});
    child.on("close", (code, signal) => finish(code === 0 ? null : new CadCliError("CAD_CLI_FAILED", "CADCraft exit=" + code + " signal=" + signal + ": " + stderr.slice(-200))));
  });
}
async function runPreparedExport({ job, sourceDxf = null, binPath = "cadcraft-cli", timeoutMs = 60000, spawnImpl = spawn } = {}) {
  if (!job || typeof job.job_key !== "string" || !/^[a-f0-9]{64}$/.test(job.job_key) || job.status !== "prepared_not_executed")
    throw new CadCliError("CAD_JOB_INVALID", "Invalid prepared export job");
  const count = validateScript(job.script);
  if (count !== job.expected_entities) throw new CadCliError("CAD_ENTITY_MISMATCH", "Compiled entity count mismatch");
  if (sourceDxf !== null && (!Buffer.isBuffer(sourceDxf) || sourceDxf.length === 0 || sourceDxf.length > MAX_BYTES))
    throw new CadCliError("CAD_SOURCE_INVALID", "Invalid source DXF");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 300000)
    throw new CadCliError("CAD_TIMEOUT_INVALID", "Invalid timeout");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lizhi-cad-"));
  try {
    const target = path.join(dir, "drawing.dxf");
    const args = ["run"];
    if (sourceDxf) { const input = path.join(dir, "source.dxf"); await fs.writeFile(input, sourceDxf, { mode: 0o600 }); args.push(input); }
    else args.push("--metric");
    args.push("--script", job.script, "--save", target);
    await subprocess(binPath, args, { cwd: dir, timeoutMs, spawnImpl });
    const dxf = await fs.readFile(target);
    if (!dxf.length || dxf.length > MAX_BYTES) throw new CadCliError("CAD_OUTPUT_INVALID", "Invalid DXF output size");
    const outputs = { dxf };
    for (const format of ["svg", "png"]) {
      const output = path.join(dir, "drawing." + format);
      await subprocess(binPath, ["convert", target, output], { cwd: dir, timeoutMs, spawnImpl });
      const bytes = await fs.readFile(output);
      if (!bytes.length || bytes.length > MAX_BYTES) throw new CadCliError("CAD_OUTPUT_INVALID", "Invalid " + format + " output size");
      outputs[format] = bytes;
    }
    for (const [format, bytes] of Object.entries(outputs)) verifyAndRecord({job,format,bytes,revision:Math.max(1,job.source_identity?.revision||0)});
    return Object.freeze({ job_key: job.job_key, entity_count: count,
      artifacts: Object.freeze(Object.fromEntries(Object.entries(outputs).map(([format, bytes]) => [format, Object.freeze({ bytes, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), byte_size: bytes.length })]))),
      verification: "CLI_CONVERT_ONLY_NOT_GEOMETRY_ROUNDTRIP" });
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}
module.exports = Object.freeze({ CadCliError, validateScript, runPreparedExport });
