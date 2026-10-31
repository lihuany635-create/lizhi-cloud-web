// Prepare the EXISTING Site checkout only. No push, save, deployment or Secrets mutation.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {encodeJpeg} from '../../../supabase/functions/lizhi-viewer-cloud/jpeg-encoder.mjs';
const root=dirname(fileURLToPath(import.meta.url)),checkout=process.argv[2];
if(!checkout)throw Error('EXISTING_SITE_CHECKOUT_REQUIRED');
const path=p=>resolve(checkout,p),read=p=>readFileSync(path(p),'utf8');
const manifest=JSON.parse(read('.openai/hosting.json'));
if(manifest.project_id!=='appgprj_6ae0c336243881919e9ba2bbf450f1fb')throw Error('WRONG_SITE_PROJECT_STOP');
const base=execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim();
if(base!=='bd47852ea5c68da150fb459f25d92cf97970b1a4')throw Error('SITE_SOURCE_VERSION_MISMATCH_STOP');
for(const name of ['site-cloud-direct-tools.mjs','site-cloud-direct-mcp.mjs'])writeFileSync(path('upstream/cloud-nav-v9/'+name),readFileSync(resolve(root,'..',name)));
writeFileSync(path('upstream/cloud-site-server.mjs'),readFileSync(resolve(root,'cloud-site-server.mjs'),'utf8').replaceAll("'../site-cloud-direct", "'./cloud-nav-v9/site-cloud-direct"));
writeFileSync(path('upstream/cloud-page.html'),readFileSync(resolve(root,'cloud-page.html')));
// Retain the original Site's full authentication/navigation/error regression suite.
let tests=execFileSync('git',['show','HEAD:tests/cloud-direct.test.mjs'],{cwd:checkout,encoding:'utf8'});
tests=tests.replace("const ORIGIN=", "const TEST_JPEG=(await readFile(new URL('./fixtures/640x360.jpg',import.meta.url))).toString('base64');\nconst ORIGIN=");
const model="{model_key:'lahudi-academy',model_sha:'b'.repeat(64)}";
tests=tests.replaceAll("call('viewer_get_screenshot')", "call('viewer_get_screenshot',"+model+")").replaceAll("invoke('viewer_get_screenshot',{},", "invoke('viewer_get_screenshot',"+model+",");
tests=tests.replace("real_screenshot:true,...args", "real_screenshot:true,render_attested:true,source:'cloud_cpu_render',requires_browser:false,camera:{mode:'first',width:640,height:360,position:[0,1.6,0],target:[0,1.6,1]},limitations:'Synthetic unit fixture only',...args").replace("'/9j/'+'A'.repeat(1100)", 'TEST_JPEG');
writeFileSync(path('tests/cloud-direct.test.mjs'),tests);
mkdirSync(path('tests/fixtures'),{recursive:true});writeFileSync(path('tests/fixtures/640x360.jpg'),encodeJpeg(new Uint8Array(640*360*4).fill(128),640,360,60));
let contracts=readFileSync(resolve(root,'cloud-site-server.test.mjs'),'utf8');
contracts=contracts.replace(/import \{encodeJpeg\}[^;]+;\nconst TEST_JPEG=[^;]+;/,"const TEST_JPEG=(await readFile(new URL('./fixtures/640x360.jpg',import.meta.url))).toString('base64');").replace("'./cloud-site-server.mjs'","'../upstream/cloud-site-server.mjs'");
writeFileSync(path('tests/cloud-render-contract.test.mjs'),contracts);
const pkg=JSON.parse(read('package.json'));pkg.scripts.test='node --test tests/cloud-direct.test.mjs tests/cloud-render-contract.test.mjs';writeFileSync(path('package.json'),JSON.stringify(pkg,null,2)+'\n');
console.log(JSON.stringify({project_id:manifest.project_id,source_base:base,prepared:true,published:false}));
