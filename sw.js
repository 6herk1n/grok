/* DUSTREACH service worker: lets the Home Screen app open offline.
   The cache name carries the build number, so every new build installs a fresh cache and deletes the old one.
   Pages (index.html) are network-first, so the in-game "New version" prompt keeps working; the cached copy is used when offline. */
const BUILD='20261123T150656-ae83acbe';
const CACHE='dustreach-'+BUILD;
const CORE=['./','./index.html','./three.min.js?v=r150-a4240da3'];
const EXTRA=['./manifest.webmanifest','./icon-180.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all([
  ...CORE.map(u=>fetch(u,{cache:'reload'}).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return c.put(u,r);})),
  ...EXTRA.map(u=>fetch(u,{cache:'reload'}).then(r=>r.ok?c.put(u,r):null).catch(()=>null))])).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('dustreach-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function isPage(req,url){return req.mode==='navigate'||/\/(index\.html)?$/.test(url.pathname);}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
  if(isPage(req,url)){
    // network first (3.5 s), refresh the cache with a good copy, fall back to the cached game when offline
    e.respondWith(new Promise(resolve=>{let done=false;const fallback=()=>caches.open(CACHE).then(c=>c.match('./index.html')).then(r=>r||caches.match(req,{ignoreSearch:true}));
      const t=setTimeout(()=>{fallback().then(r=>{if(r&&!done){done=true;resolve(r);}});},3500);
      fetch(req).then(r=>{if(r.ok&&r.type==='basic'&&!url.search){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}clearTimeout(t);if(!done){done=true;resolve(r);}})
      .catch(()=>{clearTimeout(t);fallback().then(r=>{if(!done){done=true;resolve(r||new Response('DUSTREACH is offline and not cached yet. Open it once while online.',{status:503,headers:{'Content-Type':'text/plain'}}));}});});}));
    return;}
  // other same-origin files (three.min.js?v=…, manifest, icons): exact cache hit first, then network, then any cached copy when offline
  e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&r.type==='basic')c.put(req,r.clone());return r;})
    .catch(err=>c.match(req,{ignoreSearch:true}).then(h=>h||caches.match(req,{ignoreSearch:true})).then(h=>{if(h)return h;throw err;})))));});
