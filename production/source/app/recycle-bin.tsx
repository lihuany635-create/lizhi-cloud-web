'use client';
import {useEffect,useState} from 'react';
import {Trash2,RotateCcw,RefreshCw} from 'lucide-react';
type Requester=(resource:string,path:string,body?:unknown)=>Promise<any>;
type Item={id:string;kind:'project'|'record'|'image';title:string;projectId:string;projectName:string;at:string;by:string;projectRevision?:number;parentDeleted:boolean;purging?:boolean;canPurge:boolean};
const label={project:'專案',record:'工作紀錄',image:'圖片'};
export default function RecycleBin({request,onChange}:{request:Requester;onChange:()=>void}){
 const [data,setData]=useState<{revision:number;items:Item[]}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setBusy(true);try{setData(await request('trash',''));setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 useEffect(()=>{void load();},[request]);
 async function act(item:Item,action:'restore'|'purge'){
  let confirm='';if(action==='purge'){confirm=window.prompt('永久刪除「'+item.title+'」後無法從工作台還原。既有備份與異動歷史仍保留。請輸入「永久刪除」確認。')??'';if(confirm!=='永久刪除')return;}
  setBusy(true);setError('');try{const next=await request('trash','',{action,trashId:item.id,projectId:item.projectId,projectRevision:item.projectRevision,revision:data?.revision,key:crypto.randomUUID(),confirm});setData(next);setNotice(action==='restore'?'已還原，原有資料已保留':'已永久刪除此項目');onChange();}catch(e){setError((e as Error).message);try{setData(await request('trash',''));}catch{}}finally{setBusy(false);}
 }
 return <section className="wide-card recycle-bin"><div className="section-title"><div><h1><Trash2 size={24}/>垃圾桶</h1><p>刪除的專案、圖片和紀錄會先留在這裡，可以還原。永久刪除需再次確認。</p></div><button className="btn" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/>重新整理</button></div>{error&&<p role="alert" className="modal-error">{error}</p>}{notice&&<p role="status">{notice}</p>}{data&&!data.items.length&&<div className="empty">垃圾桶是空的。</div>}{!data&&!error&&<p>讀取中…</p>}{data?.items.map(item=><article className="journal-card" key={item.id}><span className="status">{label[item.kind]}</span><h3>{item.title}</h3><p>{item.projectName} · {new Date(item.at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}</p>{item.parentDeleted&&<p className="muted">請先還原所屬專案，再處理此項目。</p>}{item.purging&&<p role="status">原圖永久刪除清理尚未完成；可以重試清理，無法還原。</p>}{!item.canPurge&&<p className="muted">此專案連結動畫專業資料，或仍有圖片／垃圾桶項目。請保留於垃圾桶，或還原後先整理內容。</p>}<div className="heading-actions"><button className="btn" disabled={busy||item.parentDeleted||item.purging} onClick={()=>void act(item,'restore')}><RotateCcw size={16}/>還原</button><button className="btn danger" disabled={busy||item.parentDeleted||!item.canPurge} onClick={()=>void act(item,'purge')}><Trash2 size={16}/>{item.purging?'重試永久刪除':'永久刪除'}</button></div></article>)}</section>;
}
