import asyncio,subprocess,time,base64,json,os
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python","-m","http.server","8870","-d","/w/fbxconv"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
        await pg.goto("http://localhost:8870/index.html");await pg.wait_for_function("window.ready===true",timeout=20000)
        os.makedirs("/w/fbxconv/out",exist_ok=True);meta={}
        for f in sorted(os.listdir("/w/fbxconv/fbx")):
            n=f[:-4]
            try:
                r=await pg.evaluate("n=>conv(n)",n);open(f"/w/fbxconv/out/{n}.glb","wb").write(base64.b64decode(r['b64']));meta[n]={'size':[round(x,3) for x in r['size']],'min':[round(x,3) for x in r['min']]};print(n,len(r['b64'])*3//4,meta[n])
            except Exception as e: print(n,"FAIL",str(e)[:200])
        json.dump(meta,open("/w/fbxconv/out/meta.json","w"));print(errs[:5]);await b.close()
try: asyncio.run(main())
finally: srv.terminate()
