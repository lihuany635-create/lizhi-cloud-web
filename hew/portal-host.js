/* Hew 3D production portal host; no credentials, keys or postMessage bridge.
 * GitHub Pages hosts BOTH the Lizhi Cloud parent and the reviewed Hew WASM
 * bundle on the same origin. The child reads the parent's existing Supabase
 * client in memory, then independently verifies auth.getUser() and owner RLS.
 * Not enabled in main until native Hew assets actually exist at /hew-editor/.
 */
(() => {
  const route='hew3d'
  const root=new URL('./hew-editor/',location.origin+location.pathname)
  const html=new URL('index.html',root)
  const source=new URL(root)
  source.searchParams.set('lizhi-model-queue','1')
  const uid=(user)=>typeof user?.id==='string' && /^[0-9a-f-]{36}$/i.test(user.id)
  const error=(root,message)=>{
    const p=document.createElement('p')
    p.setAttribute('role','status')
    p.textContent=message
    root.replaceChildren(p)
  }
  let loading=false
  async function mount(panel) {
    const host=panel.querySelector('#lizhi-hew-editor-root')
    if(!host||host.dataset.lizhiMounted||loading)return
    loading=true
    try {
      const auth=window.LizhiAuth
      if(typeof auth?.client?.auth?.getUser!=='function'){
        error(host,'Hew 編輯器需要先在立之雲端庫登入本人帳號。')
        return
      }
      const {data,err:unused,error:loginError}=await auth.client.auth.getUser()
      if(loginError||!uid(data?.user)||
         String(data.user.email??'').trim().toLowerCase()!==String(auth.allowedEmail??'').trim().toLowerCase()){
        error(host,'未通過本人登入驗證，拒絕載入 AI 建模。')
        return
      }
      // Do not point at a separate model Site. The Hew WASM editor is SAME-ORIGIN.
      const r=await fetch(html,{method:'HEAD',cache:'no-store',redirect:'manual'})
      if(r.status!==200||!String(r.headers.get('content-type')??'').includes('text/html')){
        error(host,'Hew 原生 3D 編輯器尚未部署在此網站；請先驗收嵌入版 WASM。既有 3D 模型檢視器不受影響。')
        return
      }
      const frame=document.createElement('iframe')
      frame.id='lizhi-hew-editor-frame'
      frame.title='Hew 3D 建模編輯器'
      frame.src=source.href
      frame.referrerPolicy='same-origin'
      frame.allow='fullscreen'
      frame.style.cssText='width:100%;height:min(82vh,960px);border:0;display:block;background:#161616'
      host.replaceChildren(frame)
      host.dataset.lizhiMounted='true'
    } catch {
      error(host,'Hew 編輯器目前無法安全載入。請檢查已發布資源與網路狀態。')
    } finally {loading=false}
  }
  window.LizhiHewEditor={mount}
})()
