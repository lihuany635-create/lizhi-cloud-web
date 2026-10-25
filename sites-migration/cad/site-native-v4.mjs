/**
 * The existing private Site may expose its own native MCP registration API.
 * Bind getCadSiteV4Tools/invokeCadSiteV4Tool THERE, inside its existing /mcp.
 * Do not mount site-mcp-route.mjs as a competing second handler.
 *
 * trustedAuth must come from the Site's verified server session. No client
 * header, browser input or MCP argument may supply the identity or secrets.
 */
import {cadSiteTools,handleCadSiteTool} from "./site-tools.mjs";
import {cadEntityReadToolsCandidate,handleCadEntityReadSiteTool} from "./site-entity-read.mjs";
const err=code=>({isError:true,content:[{type:"text",text:code}]});
const allowedOwner=(auth,secrets)=>
  auth?.signedIn===true &&
  typeof auth.verifiedUserEmail==="string" &&
  typeof secrets?.ownerEmail==="string" &&
  !!secrets.ownerEmail.trim() &&
  auth.verifiedUserEmail.trim().toLowerCase()===secrets.ownerEmail.trim().toLowerCase();

const orig=new Set(cadSiteTools.map(t=>t.name));
const reads=new Set(cadEntityReadToolsCandidate.map(t=>t.name));

/** Only call after Site PRIVATE owner-auth has been evaluated server-side. */
export function getCadSiteV4Tools(trustedAuth,secrets){
  if(!allowedOwner(trustedAuth,secrets))return [];
  return secrets?.entityReadEnabled===true
    ? [...cadSiteTools,...cadEntityReadToolsCandidate]
    : [...cadSiteTools];
}

/**
 * Delegate one call only. Disabled reads NEVER fall back to original six-tool
 * write dispatch and are never forwarded to Supabase.
 */
export async function invokeCadSiteV4Tool(name,args,trustedAuth,secrets,fetcher=fetch){
  if(!allowedOwner(trustedAuth,secrets))return err("OWNER_AUTH_REQUIRED");
  if(reads.has(name))
    return secrets?.entityReadEnabled===true
      ? handleCadEntityReadSiteTool(name,args,trustedAuth,secrets,fetcher)
      : err("CAD_READ_NOT_ENABLED");
  if(orig.has(name))return handleCadSiteTool(name,args,trustedAuth,secrets,fetcher);
  return err("UNKNOWN_CAD_TOOL");
}
