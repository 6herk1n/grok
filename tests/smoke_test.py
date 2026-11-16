"""DUSTREACH smoke test - runs on every push before GitHub Pages publishes.

For every profession: start a fresh game, make a character, play a few
seconds, open each panel. Then check a save survives a reload. Any page
error or console error fails the run, so a broken build never goes live.

Run locally:  pip install playwright && playwright install chromium
              python tests/smoke_test.py          (from the repo root)
"""
import asyncio
import functools
import http.server
import os
import sys
import threading

from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765
URL = f"http://localhost:{PORT}/index.html"
PANEL_KEYS = ["KeyI", "KeyK", "KeyL", "KeyB", "KeyJ", "KeyH"]  # pack, skills, journal, weave book, craft, help
# Messages that aren't game bugs: headless Chrome's software WebGL warns about these.
IGNORE = ("GPU stall", "WebGL", "GL_", "swiftshader", "Automatic fallback to software WebGL")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("localhost", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def main():
    problems = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader",
                                                "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        where = ["loading"]

        def bad(kind, text):
            if not any(s in text for s in IGNORE):
                problems.append(f"[{where[0]}] {kind}: {text[:400]}")

        async def fresh():
            """A brand-new browser profile (empty storage) with the game loaded on the title screen."""
            ctx = await browser.new_context(viewport={"width": 1180, "height": 820}, has_touch=True)
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: bad("page error", str(e)))
            pg.on("console", lambda m: bad("console error", m.text) if m.type == "error" else None)
            pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await pg.goto(URL)
            await pg.wait_for_selector("#bNew", timeout=30000)
            return ctx, pg

        ctx, page = await fresh()
        build = await page.evaluate("window.DR_BUILD || ''")
        profs = await page.evaluate("Object.keys((window.__dr && window.__dr.PROFS) || {})")
        print(f"build {build}, {len(profs)} professions")
        if not profs:
            problems.append("window.__dr.PROFS is empty - the game script didn't finish loading")

        for k in profs:
            where[0] = k
            await ctx.close()
            ctx, page = await fresh()
            await page.click("#bNew")
            await page.click(f'#profCards .card[data-p="{k}"]')
            await page.fill("#nameIn", "Smoke " + k[:8])
            await page.click("#bDeploy")
            try:
                await page.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            except Exception:
                problems.append(f"[{k}] never reached the game screen")
                continue
            await page.wait_for_timeout(2500)
            await page.keyboard.down("KeyW"); await page.wait_for_timeout(1500); await page.keyboard.up("KeyW")
            for _ in range(3):
                await page.keyboard.press("Tab"); await page.keyboard.press("Space"); await page.wait_for_timeout(300)
            for key in PANEL_KEYS:
                await page.keyboard.press(key); await page.wait_for_timeout(250)
                await page.keyboard.press("Escape"); await page.wait_for_timeout(150)
            await page.keyboard.press("KeyM"); await page.wait_for_timeout(300); await page.keyboard.press("KeyM")
            print(f"  ok  {k}")

        where[0] = "save/reload"
        await page.evaluate("window.__drSave && window.__drSave()")
        await page.goto(URL)
        try:
            await page.wait_for_selector("#bContinue", timeout=20000)
            label = await page.text_content("#bContinue")
            if "Smoke" not in (label or ""):
                problems.append(f"[save/reload] Continue button doesn't show the saved character: {label!r}")
        except Exception:
            problems.append("[save/reload] no Continue button after reload - the save didn't stick")
        await browser.close()
    return problems


if __name__ == "__main__":
    srv = serve()
    try:
        problems = asyncio.run(main())
    finally:
        srv.shutdown()
    if problems:
        print(f"\nFAILED - {len(problems)} problem(s):")
        for pr in problems[:50]:
            print(" -", pr)
        sys.exit(1)
    print("\nPASSED")
