// tests/smoke.js: the builder's pre-publish smoke test (Node + Playwright), run from the repo layout.
// Serves the repo root over http (as GitHub Pages does), loads the built game on an iPad-sized touch viewport (1180x820),
// creates a Vanguard, walks, opens the pack and map, saves, reloads. Fails (exit 1) on any console error, page error,
// failed request or broken save. Complements tests/smoke_test.py (the CI gate, which covers every profession).
// usage (after `node build.js`): npm install && node tests/smoke.js [siteDir]     siteDir defaults to the repo root
const {chromium}=require('playwright');const path=require('path');const http=require('http');const fs=require('fs');
const SITE=path.resolve(process.argv[2]||path.join(__dirname,'..'));
function serve(dir){const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
  return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(dir,p);
    if(!f.startsWith(dir)||!fs.existsSync(f)){r.writeHead(404);r.end('nf');return;}r.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(0,'127.0.0.1',()=>res(s));});}
async function run(b,label,url){const ctx=await b.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true});const page=await ctx.newPage();const errs=[];
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});page.on('pageerror',e=>errs.push('pageerror: '+e.message));
  page.on('requestfailed',r=>{const ft=(r.failure()||{}).errorText||'';/* the in-page update check (?v=<time>) reads only the build meta tag then cancels the body on purpose */if(/[?&]v=\d+$/.test(r.url())&&/ERR_ABORTED/.test(ft))return;if(!/favicon/.test(r.url()))errs.push('requestfailed: '+r.url()+' '+(r.failure()||{}).errorText);});
  page.on('response',r=>{if(r.status()>=400)errs.push('http '+r.status()+': '+r.url());});page.on('dialog',d=>d.accept());
  const checks=[];const ok=(c,m)=>{checks.push([!!c,m]);console.log((c?'  ok   ':'  FAIL ')+label+': '+m);};
  await page.goto(url);await page.waitForFunction(()=>window.__dr&&document.querySelector('#bNew'),null,{timeout:30000});
  ok(await page.evaluate(()=>typeof THREE!=='undefined'&&!!window.DR_BUILD&&!/__BUILD__/.test(window.DR_BUILD)),'page loads, Three.js present, build '+await page.evaluate(()=>window.DR_BUILD));
  await page.evaluate(()=>{localStorage.clear();});await page.reload();await page.waitForFunction(()=>window.__dr&&document.querySelector('#bNew'),null,{timeout:30000});
  await page.tap('#bNew');await page.waitForTimeout(300);await page.tap('.card[data-p="vanguard"]');await page.fill('#nameIn','Smoke Test');await page.tap('#bDeploy');
  await page.waitForFunction(()=>__dr.state==='play'||(window.__dr&&!document.querySelector('#hud').classList.contains('hidden')),null,{timeout:20000});
  ok(await page.evaluate(()=>__dr.P.name==='Smoke Test'),'character created and in game');
  const p0=await page.evaluate(()=>[__dr.P.pos.x,__dr.P.pos.z]);
  await page.keyboard.down('KeyW');await page.waitForTimeout(2500);await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');await page.waitForTimeout(400);await page.keyboard.press('KeyI');await page.waitForTimeout(400);await page.keyboard.press('Escape');await page.waitForTimeout(400);
  await page.keyboard.press('KeyM');await page.waitForTimeout(400);await page.keyboard.press('KeyM');await page.waitForTimeout(1500);
  const p1=await page.evaluate(()=>[__dr.P.pos.x,__dr.P.pos.z]);ok(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])>0.5,'player moves ('+Math.hypot(p1[0]-p0[0],p1[1]-p0[1]).toFixed(1)+' m)');
  ok(await page.evaluate(()=>__dr.renderer.info.render.frame>20),'rendering frames');
  await page.evaluate(()=>__dr.save());
  const sv=await page.evaluate(()=>{try{const r=JSON.parse(localStorage.getItem('dustreach_roster_v1'));const c=r.chars.find(c=>c.name==='Smoke Test');return c?{pos:c.pos,lvl:c.level}:null;}catch(e){return 'ERR '+e;}});
  ok(sv&&sv.pos&&Math.abs(sv.pos[0]-p1[0])<3,'save written ('+JSON.stringify(sv)+')');
  await page.reload();await page.waitForFunction(()=>window.__dr&&document.querySelector('#titleBtns'),null,{timeout:30000});await page.waitForTimeout(500);
  ok(await page.evaluate(()=>[...document.querySelectorAll('.rslot b')].some(b=>b.textContent==='Smoke Test')),'character still there after reload');
  ok(errs.length===0,'no console/page/request errors'+(errs.length?' -> '+errs.slice(0,5).join(' | '):''));
  await ctx.close();return checks.every(c=>c[0]);}
(async()=>{let good=true,srv=null;const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    srv=await serve(SITE);good=await run(b,'site','http://127.0.0.1:'+srv.address().port+'/')&&good;
  }catch(e){console.error(e);good=false;}finally{await b.close();if(srv)srv.close();}
  if(!good){console.error('\n#############################################\n###  SMOKE TEST FAILED: DO NOT PUBLISH  ###\n#############################################\n');process.exit(1);}
  console.log('SMOKE OK');process.exit(0);})();
