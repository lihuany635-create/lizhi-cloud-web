/** SQLite queue worker claim CLI used by tests; only points to a local test sqlite file. */
import { DurableSandboxQueue } from './durable-queue.mjs';
const [filename,jobId,projectId,revision,at,leaseMs,workerId]=process.argv.slice(2);
const q=new DurableSandboxQueue(filename);
try{
 const j=q.claim({jobId,projectId,workerId,expectedRevision:Number(revision),at:Number(at),leaseMs:Number(leaseMs)});
 console.log(JSON.stringify({workerId,state:j.state,revision:j.revision}));
} catch(e){console.error(e.code??String(e));process.exitCode=2;}
finally {q.close();}
