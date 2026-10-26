import {createRoot,type Root} from 'react-dom/client';
import ProjectWorkspace from '../app/project-workspace';
import styles from 'virtual:native-workspace-styles';
const API='https://hrdzywkihfqggiwjgavi.supabase.co/functions/v1/lizhi-production';
const roots=new WeakMap<Element,Root>();
const transport=async(resource:string,path:string,body?:unknown)=>{
 const auth=(window as any).LizhiAuth;if(!auth?.client)throw new Error('請先登入立之雲端庫');
 const {data,error}=await auth.client.auth.getSession();if(error||!data.session?.access_token)throw new Error('登入已失效，請重新登入雲端庫');
 return fetch(API+'/'+resource+path,{cache:'no-store',headers:{Authorization:'Bearer '+data.session.access_token,apikey:(window as any).LIZHI_SUPABASE_PUBLISHABLE_KEY,...body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}},...body?{method:'POST',body:body instanceof FormData?body:JSON.stringify(body)}:{}});
};
export function mount(host:Element){if(roots.has(host))return;const shadow=host.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=styles;shadow.append(style);const container=document.createElement('div');container.className='native-production';shadow.append(container);const root=createRoot(container);roots.set(host,root);root.render(<ProjectWorkspace nativeTransport={transport}/>);}
export function unmount(host:Element){roots.get(host)?.unmount();roots.delete(host);}
