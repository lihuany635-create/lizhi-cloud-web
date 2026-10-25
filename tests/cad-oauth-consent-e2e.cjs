"use strict";
const { chromium }=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const origin=process.env.CAD_TEST_ORIGIN||"http://127.0.0.1:8771";
const out=path.resolve(process.env.CAD_BROWSER_EVIDENCE||"cad-browser-evidence");
async function scenario(browser,{grantCad,deny}){
  const context=await browser.newContext();
  const page=await context.newPage();
  const recorded=[];
  await page.exposeBinding("__consentAudit",(_source,detail)=>{recorded.push(detail);});
  await page.addInitScript(()=>{
    window.LIZHI_SUPABASE_URL="https://example.invalid";
    window.LIZHI_SUPABASE_PUBLISHABLE_KEY="mock-public-key";
    window.supabase={createClient(){
      return {auth:{
        getUser:async()=>({data:{user:{email:"lihuany635@gmail.com",email_confirmed_at:"2026-01-01T00:00:00Z"}},error:null}),
        oauth:{
          getAuthorizationDetails:async()=>({data:{authorization_id:"safe-consent-id-123456",client:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",name:"Test CAD App"},redirect_uri:"https://chatgpt.com/cad/done",scope:"email"},error:null}),
          approveAuthorization:async()=>{window.__consentAudit({action:"approve"});return {data:{redirect_url:"https://chatgpt.com/cad/done"},error:null};},
          denyAuthorization:async()=>{window.__consentAudit({action:"deny"});return {data:{redirect_url:"https://chatgpt.com/cad/denied"},error:null};}
        },
      },rpc:async(name,params)=>{window.__consentAudit({action:"grant",name,params});return {data:true,error:null};}};
    }};
  });
  await page.route("https://cdn.jsdelivr.net/**",r=>r.fulfill({status:200,contentType:"text/javascript",body:""}));
  await page.route("https://chatgpt.com/cad/**",r=>r.fulfill({status:200,contentType:"text/html",body:"<title>OAuth return</title>"}));
  try {
    const response=await page.goto(origin+"/oauth/consent/?authorization_id=safe-consent-id-123456",{waitUntil:"domcontentloaded",timeout:30000});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.querySelector("#approve")?.disabled===false,null,{timeout:10000});
    assert.match(await page.locator("body").innerText(),/CAD/);
    assert.equal(await page.locator("#cad-write-consent").isChecked(),false);
    if(grantCad)await page.locator("#cad-write-consent").check();
    const target=deny?"https://chatgpt.com/cad/denied":"https://chatgpt.com/cad/done";
    await Promise.all([
      page.waitForURL(target,{timeout:12000}),
      page.locator(deny?"#deny":"#approve").click()
    ]);
    const actions=recorded.map(e=>e.action);
    assert.equal(actions.includes("grant"),grantCad&&!deny,JSON.stringify(recorded));
    assert.equal(actions.includes("approve"),!deny,JSON.stringify(recorded));
    if(grantCad&&!deny){
      assert.deepEqual(actions.slice(0,2),["approve","grant"],"CAD grant must occur only after an approved consent");
      const item=recorded.find(e=>e.action==="grant");
      assert.equal(item.name,"lizhi_cad_grant_oauth_client");
      assert.equal(item.params.p_client,"cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    }
    return {grantCad,deny,passed:true,actions};
  }catch(error){
    await page.screenshot({path:path.join(out,"cad-consent-failed-"+Number(grantCad)+"-"+Number(deny)+".png")}).catch(()=>{});
    throw error;
  }finally{await context.close();}
}
async function main(){
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  let results;
  try {
    results=[
      await scenario(browser,{grantCad:false,deny:false}),
      await scenario(browser,{grantCad:true,deny:false}),
      await scenario(browser,{grantCad:true,deny:true})
    ];
  }finally{await browser.close();}
  await fs.writeFile(path.join(out,"cad-oauth-consent-e2e.json"),JSON.stringify({mockedAuthorizationProvider:true,productionOAuthVerified:false,results},null,2));
  console.log("LIZHI_CAD_CONSENT_BROWSER_E2E",JSON.stringify(results));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
