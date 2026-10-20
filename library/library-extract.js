// 立之圖書館：在瀏覽器裡把檔案轉成 Claude 讀得到的文字或縮圖。
// 檔案本體另外存到 Storage；這裡只產生「讓 Claude 判斷怎麼整理」用的摘錄。
(function(global){
  "use strict";

  const MAX_TEXT=60000;          // 摘錄上限（字元），夠 Claude 判斷內容又不會撐爆資料表
  const THUMB_EDGE=640;          // 圖片縮圖長邊
  const PDF_PAGES=30;            // PDF 最多讀幾頁
  const CDN={
    pdf:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfWorker:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    mammoth:"https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
    xlsx:"https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    jszip:"https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
  };
  const loaded=new Map();

  function loadScript(src){
    if(!loaded.has(src))loaded.set(src,new Promise((resolve,reject)=>{
      const el=document.createElement("script");el.src=src;el.async=true;
      el.onload=()=>resolve();el.onerror=()=>{loaded.delete(src);reject(new Error("無法載入解析工具"));};
      document.head.append(el);
    }));
    return loaded.get(src);
  }

  const ext=name=>(/\.([a-z0-9]{1,8})$/i.exec(name||"")||[])[1]?.toLowerCase()||"";
  const tidy=text=>String(text||"").replace(/\r\n?/g,"\n").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
  function clip(text){
    const value=tidy(text);
    return value.length>MAX_TEXT?{text:value.slice(0,MAX_TEXT),partial:true}:{text:value,partial:false};
  }

  async function readPlain(file){return clip(await file.text());}

  async function readPdf(file){
    await loadScript(CDN.pdf);
    const lib=global.pdfjsLib;lib.GlobalWorkerOptions.workerSrc=CDN.pdfWorker;
    const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=Math.min(pdf.numPages,PDF_PAGES),parts=[];
    for(let i=1;i<=pages;i++){
      const content=await (await pdf.getPage(i)).getTextContent();
      parts.push(`［第 ${i} 頁］\n`+content.items.map(item=>item.str+(item.hasEOL?"\n":"")).join(""));
      if(parts.join("\n").length>MAX_TEXT)break;
    }
    const result=clip(parts.join("\n\n"));
    if(pdf.numPages>pages)result.partial=true;
    if(!result.text.replace(/［第 \d+ 頁］/g,"").trim())return {text:"",partial:false,note:"PDF 沒有可抽出的文字（可能是掃描檔）"};
    return {...result,note:`共 ${pdf.numPages} 頁`};
  }

  async function readDocx(file){
    await loadScript(CDN.mammoth);
    const out=await global.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return clip(out.value);
  }

  async function readSheet(file){
    await loadScript(CDN.xlsx);
    const book=global.XLSX.read(await file.arrayBuffer(),{type:"array"});
    const parts=book.SheetNames.map(name=>`［工作表：${name}］\n`+global.XLSX.utils.sheet_to_csv(book.Sheets[name],{blankrows:false}));
    return {...clip(parts.join("\n\n")),note:`${book.SheetNames.length} 個工作表`};
  }

  async function readPptx(file){
    await loadScript(CDN.jszip);
    const zip=await global.JSZip.loadAsync(await file.arrayBuffer());
    const slides=Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a,b)=>Number(/\d+/.exec(a.split("/").pop()))-Number(/\d+/.exec(b.split("/").pop())));
    const parts=[];
    for(const [index,name] of slides.entries()){
      const xml=await zip.file(name).async("string");
      const text=[...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(match=>match[1]).join(" ")
        .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
      parts.push(`［投影片 ${index+1}］\n${text}`);
    }
    return {...clip(parts.join("\n\n")),note:`${slides.length} 張投影片`};
  }

  async function thumbnail(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error("圖片無法讀取"));el.src=url;});
      const scale=Math.min(1,THUMB_EDGE/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      for(const quality of [0.78,0.6,0.45]){
        const data=canvas.toDataURL("image/jpeg",quality);
        if(data.length<=250000)return {thumb:data,note:`${img.naturalWidth}×${img.naturalHeight}`};
      }
      return {thumb:null,note:"縮圖太大，已略過"};
    }finally{URL.revokeObjectURL(url);}
  }

  // 回傳 {text, thumb, status: ok|partial|none|error, note}
  async function extract(file){
    const type=file.type||"",kind=ext(file.name);
    try{
      if(type.startsWith("image/")){
        const out=await thumbnail(file);
        return {text:null,thumb:out.thumb,status:out.thumb?"ok":"none",note:out.note};
      }
      let out=null;
      if(kind==="pdf"||type==="application/pdf")out=await readPdf(file);
      else if(kind==="docx")out=await readDocx(file);
      else if(["xlsx","xls","ods"].includes(kind))out=await readSheet(file);
      else if(kind==="pptx")out=await readPptx(file);
      else if(type.startsWith("text/")||["txt","md","markdown","csv","tsv","json","html","htm","xml","yaml","yml","log","js","ts","py","css","sql"].includes(kind))out=await readPlain(file);
      if(!out)return {text:null,thumb:null,status:"none",note:"這種格式只保存檔案，Claude 會依檔名整理"};
      if(!out.text)return {text:null,thumb:null,status:"none",note:out.note||"沒有可讀的文字"};
      return {text:out.text,thumb:null,status:out.partial?"partial":"ok",note:out.note||(out.partial?"內容較長，只保留前段":"")};
    }catch(error){
      return {text:null,thumb:null,status:"error",note:`解析失敗：${error?.message||error}`};
    }
  }

  global.LibraryExtract=Object.freeze({extract,ext});
})(window);
