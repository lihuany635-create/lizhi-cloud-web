/** Test-only Node ESM resolver for existing Deno-style extensionless .ts imports.
 * No network resolution, no production deployment, no package installation.
 */
export async function resolve(specifier,context,nextResolve){
 try{return await nextResolve(specifier,context);}
 catch(err){
  if(err?.code!=='ERR_MODULE_NOT_FOUND'||!specifier.startsWith('./')&&!specifier.startsWith('../'))throw err;
  return nextResolve(specifier+'.ts',context);
 }
}
