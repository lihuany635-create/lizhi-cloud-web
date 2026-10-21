export function exportName(value) {
  const name=String(value || 'export').normalize('NFC').replace(/[\\/\u0000-\u001f\u007f]/g,'_').replace(/^\.+/,'_');
  return name.slice(0,120) || 'export';
}

// Chunked bridge writes avoid base64-encoding an entire video in JS memory.
export async function saveBlob(blob, name, { filesystem, share, directory, id }) {
  const path='exports/'+id+'/'+exportName(name);
  await filesystem.mkdir({path:'exports/'+id,directory,recursive:true});
  let wrote=false;
  const chunkSize=512*1024;
  for(let start=0;start<blob.size || !wrote;start+=chunkSize) {
    const bytes=new Uint8Array(await blob.slice(start,start+chunkSize).arrayBuffer());
    let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const args={path,directory,data:btoa(binary)};
    if(!wrote)await filesystem.writeFile(args);else await filesystem.appendFile(args);
    wrote=true;
  }
  const {uri}=await filesystem.getUri({path,directory});
  await share.share({title:exportName(name),files:[uri],dialogTitle:'儲存或分享匯出檔'});
  return uri;
}
