"""DUSTREACH smoke test - runs on every push before GitHub Pages publishes.

For every profession: start a fresh game, make a character, play a few
seconds, open each panel. Then check a save survives a reload. Then a phone
pass at short landscape sizes (750x342, iPhone SE 667x375): make a character
by tapping, show a region banner and a tip, and fail if HUD elements overlap
(tracker/minimap/banner/tip vs the action buttons, banner vs tip, tip text vs
tracker and frames). Any page error or console error fails the run, so a
broken build never goes live.

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
# Phone landscape sizes checked for HUD overlaps (CSS width x height, touch, mobile).
PHONE_VIEWS = [(750, 342), (667, 375)]
PHONE_UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
            "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
# Measures the HUD the way the game shows it (game3.js banner()/toast()) and returns the overlapping pairs.
HUD_OVERLAP_JS = r"""() => {
  const b = document.querySelector('#banner'); b.innerHTML = 'Mirelight Fen<small>Lv 11-20</small>'; b.classList.add('on');
  const t = document.querySelector('#toast'); t.textContent = 'Tip: tap the map button to see your next story step'; t.classList.add('on');
  const TEXT = ['#banner', '#toast', '#log'];
  const textRect = el => { let L = 1e9, T = 1e9, R = -1e9, B = -1e9; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
      for (const q of r.getClientRects()) { L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } }
    return { left: L, top: T, width: Math.max(0, R - L), height: Math.max(0, B - T) }; };
  const vis = el => { if (!el || el.closest('.hidden')) return false;
    for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; }
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const box = sel => { const el = document.querySelector(sel); if (!vis(el)) return null; const tx = TEXT.includes(sel);
    if (tx && !el.textContent.trim()) return null; const r = tx ? textRect(el) : el.getBoundingClientRect();
    return { sel, x: r.left, y: r.top, w: r.width, h: r.height }; };
  const hit = (p, q) => { const ox = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), oy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
    return ox > 1 && oy > 1 ? Math.round(ox) + 'x' + Math.round(oy) : null; };
  const BTN = ['#bAtk', '#b0', '#b1', '#b2', '#b3', '#b4', '#b5', '#bQuick', '#quick', '#bMount'];
  const pairs = [];
  for (const a of ['#mtrack', '#topright', '#banner', '#toast']) for (const c of BTN) pairs.push([a, c]);
  pairs.push(['#banner', '#toast'], ['#log', '#banner'], ['#log', '#toast']);
  for (const a of ['#banner', '#toast']) for (const c of ['#mtrack', '#topbtns', '#pframe', '#tframe']) pairs.push([a, c]);
  pairs.push(['#mtrack', '#topbtns']);
  const out = [];
  for (const [a, c] of pairs) { const p = box(a), q = box(c); if (p && q) { const h = hit(p, q); if (h) out.push(a + ' overlaps ' + c + ' (' + h + ' px)'); } }
  return out;
}"""
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
        await ctx.close()

        for (w, h) in PHONE_VIEWS:
            where[0] = f"phone {w}x{h}"
            ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                            has_touch=True, is_mobile=True, user_agent=PHONE_UA)
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: bad("page error", str(e)))
            pg.on("console", lambda m: bad("console error", m.text) if m.type == "error" else None)
            pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await pg.goto(URL)
            await pg.wait_for_selector("#bNew", timeout=30000)
            await pg.tap("#bNew")
            await pg.wait_for_timeout(300)
            card = pg.locator('#profCards .card[data-p="vanguard"]')
            await card.scroll_into_view_if_needed(); await card.tap()
            await pg.fill("#nameIn", "Smoke phone")
            deploy = pg.locator("#bDeploy")
            await deploy.scroll_into_view_if_needed(); await deploy.tap()
            try:
                await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            except Exception:
                problems.append(f"[phone {w}x{h}] never reached the game screen")
                await ctx.close()
                continue
            await pg.wait_for_timeout(2000)
            overlaps = await pg.evaluate(HUD_OVERLAP_JS)
            if overlaps:
                problems.append(f"[phone {w}x{h}] HUD elements overlap: " + "; ".join(overlaps))
                if os.environ.get("SMOKE_SHOT_DIR"):
                    await pg.screenshot(path=os.path.join(os.environ["SMOKE_SHOT_DIR"], f"phone_{w}x{h}.png"))
            else:
                print(f"  ok  phone {w}x{h}: HUD has no overlaps")
            await ctx.close()
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
