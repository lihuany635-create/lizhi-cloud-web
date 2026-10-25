'use client';
import {useEffect,useState} from 'react';
import {BookOpen,ClipboardList,ExternalLink,ShieldCheck} from 'lucide-react';

type DocId='handbook'|'interview';
const DOCS:Record<DocId,{title:string;version:string;path:string;summary:string;highlights:string[]}> = {
 handbook:{
  title:'AI 員工守則',version:'v1.0',path:'docs/AI_EMPLOYEE_HANDBOOK_v1.0.md',
  summary:'所有 AI 接手專案前必讀：先查工作台、依權限執行、用證據驗證、留下可接續紀錄。',
  highlights:['「繼續」應接續已有任務，不重新規劃','送出指令不等於完成，無證據不得標 PASS','留下完成事項、測試範圍、阻礙與下一步']
 },
 interview:{
  title:'App 開發需求訪談規範與問題模板',version:'v1.0',path:'docs/APP_REQUIREMENTS_INTERVIEW_v1.0.md',
  summary:'要開發新 App、網站或工具，先訪談使用者，再產出可核對的需求確認單。',
  highlights:['先問用途、使用者、平台、流程與第一版重點','逐輪追問資料、AI 權限、成本、離線和驗收','36 個標準問題；依回答選問，不重問已確定事項']
 }
};
function basePath(path:string){return new URL(path,new URL('./',window.location.href)).href;}
function renderContent(markdown:string){
 const lines=markdown.split(/\r?\n/),result:React.ReactNode[]=[];let fenced=false,code:string[]=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trimEnd(),t=line.trim();
  if(t.startsWith('```')){if(fenced){result.push(<pre key={'code'+i} className="essentials-code">{code.join('\n')}</pre>);code=[];}fenced=!fenced;continue;}
  if(fenced){code.push(line);continue;}
  if(!t){continue;}
  if(/^---+$/.test(t)){result.push(<hr key={i}/>);continue;}
  const heading=t.match(/^(#{1,3})\s+(.+)$/);
  if(heading){const text=heading[2];result.push(heading[1].length===1?<h2 key={i}>{text}</h2>:heading[1].length===2?<h3 key={i}>{text}</h3>:<h4 key={i}>{text}</h4>);continue;}
  if(t.startsWith('|')){let rows=[line],j=i+1;while(j<lines.length&&lines[j].trim().startsWith('|'))rows.push(lines[j++]);result.push(<pre key={i} className="essentials-code">{rows.join('\n')}</pre>);i=j-1;continue;}
  if(t.startsWith('>')){result.push(<blockquote key={i}>{t.replace(/^>\s?/,'')}</blockquote>);continue;}
  const bullet=t.match(/^[-*]\s+(.+)$/),number=t.match(/^(\d+)\.\s+(.+)$/);
  if(bullet||number){result.push(<p key={i} className="essentials-list">{number?number[1]+'. ':'• '}{bullet?bullet[1]:number?.[2]}</p>);continue;}
  result.push(<p key={i}>{t}</p>);
 }
 return result;
}
export default function EmployeeEssentials(){
 const [selected,setSelected]=useState<DocId>('handbook');
 const [texts,setTexts]=useState<Partial<Record<DocId,string>>>({});
 const [errors,setErrors]=useState<Partial<Record<DocId,string>>>({});
 useEffect(()=>{
  const controller=new AbortController();
  (Object.keys(DOCS) as DocId[]).forEach(async id=>{
   try{
    const r=await fetch(basePath(DOCS[id].path),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const text=await r.text();if(!text.includes(id==='handbook'?'LIZHI-AI-RULES':'LIZHI-APP-INTAKE'))throw new Error('文件版本或內容不符');
    if(!controller.signal.aborted)setTexts(prev=>({...prev,[id]:text}));
   }catch(e){if(!controller.signal.aborted)setErrors(prev=>({...prev,[id]:'目前無法載入全文（'+(e as Error).message+'），請使用下方原始文件連結。'}));}
  });
  return()=>controller.abort();
 },[]);
 const doc=DOCS[selected];
 return <section className="essentials-root" aria-label="員工必知">
  <div className="page-heading"><div><div className="eyebrow">立之雲端庫 · 共用規範</div><h1>員工必知</h1><p>讓每位接手工作的 AI 使用相同規範。文件存放在 GitHub，更新須保留版本；正式工作前仍須由 AI 實際讀取。</p></div></div>
  <div className="essentials-grid">
   {(Object.keys(DOCS) as DocId[]).map(id=><button type="button" key={id} className={'essentials-card '+(selected===id?'selected':'')} onClick={()=>setSelected(id)} aria-pressed={selected===id}>
    {id==='handbook'?<ShieldCheck size={23}/>:<ClipboardList size={23}/>}
    <span><b>{DOCS[id].title}</b><small>{DOCS[id].version} · {DOCS[id].summary}</small></span>
   </button>)}
  </div>
  <article className="wide-card essentials-document">
   <div className="section-title"><div><h2><BookOpen size={19}/>{doc.title}</h2><p>文件編號：{selected==='handbook'?'LIZHI-AI-RULES':'LIZHI-APP-INTAKE'} · {doc.version}</p></div><a className="btn" href={basePath(doc.path)} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>開啟原始文件</a></div>
   <div className="essentials-highlights">{doc.highlights.map(t=><p key={t}>✓ {t}</p>)}</div>
   {errors[selected]&&<p role="status" className="essentials-warning">{errors[selected]}</p>}
   {texts[selected]?<div className="essentials-fulltext">{renderContent(texts[selected]!)}</div>:!errors[selected]&&<p className="muted">正在讀取正式文件全文…</p>}
  </article>
  <p className="muted">此頁是規則查閱入口，不代表所有外部 AI 都已自動收到或遵守。個別 AI 須在接手任務時自行讀取並驗證版本。</p>
 </section>;
}
