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

        # Build Q crafting: gather a world node, then craft Field Stims through the Tradeskills panel's own buttons
        where[0] = "crafting"
        got = await page.evaluate("""() => { const d = window.__dr, P = d.P; let n = null;
            for (let r = 1; r < 14 && !n; r++) for (let ix = -r; ix <= r && !n; ix++) for (let iz = -r; iz <= r; iz++) { const m = d.nodeAt(ix, iz); if (m) { n = m; break; } }
            if (!n) return 'no node';
            const before = d.bag().reduce((a, o) => a + o.n, 0); P.pos.set(n.x + 1.6, 0, n.z); d.qRefresh();
            const g = d.gatherInteract(P.pos); if (!g) return 'no gather prompt';
            d.gatherNode(g.n); const after = d.bag().reduce((a, o) => a + o.n, 0);
            d.bagAdd({kind: 'mat', mt: 'bloom', ql: 5}, 2); return after > before ? 'ok' : 'gather gave nothing'; }""")
        if got != "ok":
            problems.append(f"[crafting] gathering failed: {got}")
        await page.keyboard.press("KeyJ"); await page.wait_for_timeout(300)
        stims0 = await page.evaluate("window.__dr.P.stims")
        try:
            await page.click('#pbody [data-act="ctab"][data-t="rec"]'); await page.wait_for_timeout(200)
            await page.click('#pbody [data-act="qrec"][data-r="d_stims"]'); await page.wait_for_timeout(200)
            await page.click("#craftGo"); await page.wait_for_timeout(300)
            stims1 = await page.evaluate("window.__dr.P.stims")
            if stims1 != stims0 + 2:
                problems.append(f"[crafting] Field Stims craft didn't add 2 stims ({stims0} -> {stims1})")
        except Exception as e:
            problems.append(f"[crafting] Tradeskills panel buttons missing: {str(e)[:200]}")
        await page.keyboard.press("Escape"); await page.wait_for_timeout(150)
        print("  ok  crafting" if not any(x.startswith("[crafting]") for x in problems) else "  FAIL crafting")

        # Build R random missions: open the 🎲 board (N), accept a supply run with its own button, deliver, claim at the terminal
        where[0] = "missions"
        try:
            await page.evaluate("() => { const d = window.__dr; d.rmFill(); const o = d.rmi().offers[0]; o.type = 'gather'; o.mt = 'ore'; }")
            await page.keyboard.press("KeyN"); await page.wait_for_timeout(300)
            oid = await page.evaluate("window.__dr.rmi().offers[0].oid")
            await page.click(f'#pbody [data-act="rmacc"][data-o="{oid}"]'); await page.wait_for_timeout(300)
            st = await page.evaluate("""() => { const d = window.__dr; const q = d.rmList()[0]; if (!q) return 'not accepted';
                const s = d.curStep(q); d.bagAdd({kind: 'mat', mt: 'ore', ql: 500}, s.n); return 'ok'; }""")
            if st != "ok":
                problems.append(f"[missions] {st}")
            await page.wait_for_timeout(1200)
            res = await page.evaluate("""() => { const d = window.__dr, q = d.rmList()[0]; if (!q || q.stage !== 'return') return 'supply run did not complete: ' + (q && d.objText(q));
                d.P.pos.set(-7, 0, -7); d.closePanel(); d.openTerminal(); const w0 = d.rmi().writs;
                const b = document.querySelector('#pbody [data-act="rmclaim"]'); if (!b) return 'no Claim button at the terminal'; b.click(); d.closePanel();
                return d.rmList().length === 0 && d.rmi().writs > w0 ? 'ok' : 'claim paid no writs'; }""")
            if res != "ok":
                problems.append(f"[missions] {res}")
        except Exception as e:
            problems.append(f"[missions] mission board buttons missing: {str(e)[:200]}")
        print("  ok  missions" if not any(x.startswith("[missions]") for x in problems) else "  FAIL missions")

        # Build S hard modes: after one Normal clear, pick Hard on the Hollowvein Mine door with its own button, enter with the
        # door's Enter button, check the run is scaled, has a timer and shows in the tracker, then leave. Polls (slow CI: dt capped).
        where[0] = "hard modes"
        try:
            await page.evaluate("""() => { const d = window.__dr, P = d.P; P.level = Math.max(P.level, 6);
                P.story.done = [...new Set([...(P.story.done || []), 's1', 's2', 's3', 's4'])]; P.dunClears.mine = 1; d.closePanel(); d.openDoor('mine'); }""")
            await page.click('#pbody [data-act="hmsel"][data-k="d:mine"][data-t="1"]', timeout=8000)
            await page.wait_for_function("() => { const h = window.__dr.P.hm; return !!h && h.sel['d:mine'] === 1; }", timeout=8000)
            await page.click('#pbody [data-act="denter"][data-id="mine"]', timeout=8000)
            await page.wait_for_function("""() => { const d = window.__dr; return !!(d.DUN && d.DUN.mode.hm && d.DUN.mode.hm.tier === 1
                && document.querySelector('#hmTrack')); }""", timeout=20000)
            res = await page.evaluate("""() => { const d = window.__dr, D = d.DUN, h = D.mode.hm;
                if (!(h.par > 0)) return 'no timer'; if (!(D.mode.hp > 1.2 && D.mode.dmg > 1.05)) return 'enemies not scaled';
                d.exitDungeon(true); return d.DUN ? 'could not leave' : 'ok'; }""")
            if res != "ok":
                problems.append(f"[hard modes] {res}")
        except Exception as e:
            problems.append(f"[hard modes] difficulty picker / hard run failed: {str(e)[:200]}")
        await page.evaluate("() => { const d = window.__dr; if (d.DUN) d.exitDungeon(true); d.closePanel(); }")
        print("  ok  hard modes" if not any(x.startswith("[hard modes]") for x in problems) else "  FAIL hard modes")

        # Build T apartment: go home, buy a rug and place it in slot A with the Home panel's own buttons, then check
        # rested XP shows on the XP bar. Polls for every state change (slow CI: dt capped at 0.05 s).
        where[0] = "apartment"
        try:
            await page.evaluate("() => { const d = window.__dr; if (d.DUN) d.exitDungeon(true); d.closePanel(); d.P.credits = Math.max(d.P.credits, 2000); d.enterApartment(); }")
            await page.wait_for_function("() => { const d = window.__dr; return !!(d.DUN && d.DUN.apt); }", timeout=15000)
            await page.evaluate("() => window.__dr.openHome('shop')")
            await page.click('#pbody [data-act="hbuy"][data-k="rug"]', timeout=8000)
            await page.wait_for_function("() => (window.__dr.aptLoad().own.rug | 0) >= 1", timeout=8000)
            await page.click('#pbody [data-act="htab"][data-t="furnish"]', timeout=8000)
            await page.click('#pbody [data-act="hslot"][data-s="A"]', timeout=8000)
            await page.click('#pbody [data-act="hput"][data-s="A"][data-k="rug"]', timeout=8000)
            await page.wait_for_function("() => window.__dr.aptLoad().slots.A === 'rug'", timeout=8000)
            await page.evaluate("() => { const d = window.__dr, h = d.homi(); h.t = Date.now() - 2 * 3600e3; h.at = 1; d.restTick(true); }")
            await page.wait_for_function("""() => { const d = window.__dr, el = document.querySelector('.bar.xp .rbar');
                return d.homi().pool > 0 && !!el && el.style.display !== 'none' && parseFloat(el.style.width) > 0; }""", timeout=10000)
        except Exception as e:
            problems.append(f"[apartment] Home panel / rested XP failed: {str(e)[:200]}")
        await page.evaluate("() => { const d = window.__dr; d.closePanel(); if (d.DUN) d.exitDungeon(true); }")
        print("  ok  apartment" if not any(x.startswith("[apartment]") for x in problems) else "  FAIL apartment")

        # Build U achievements: open the 🏅 panel with O, earn "Thousand Cuts" (1,000 kills) and check its popup, then open the
        # Collection (boss drop grid) and Wardrobe tabs with their own buttons. Polls (slow CI; achievements are checked every ~2 s).
        where[0] = "achievements"
        try:
            await page.evaluate("() => { const d = window.__dr; if (d.DUN) d.exitDungeon(true); d.closePanel(); }")
            await page.keyboard.press("o")
            await page.wait_for_selector('#pbody [data-act="atab"][data-t="coll"]', timeout=10000)
            await page.evaluate("() => { window.__dr.P.kills = Math.max(window.__dr.P.kills | 0, 1000); }")
            await page.wait_for_function("""() => { const d = window.__dr, el = document.getElementById('achPop');
                return !!(d.P.ach && d.P.ach.got.k1k) && !!el && /Thousand Cuts/.test(el.textContent); }""", timeout=20000)
            await page.click('#pbody [data-act="atab"][data-t="coll"]', timeout=8000)
            await page.click('#pbody [data-act="asub"][data-s="boss"]', timeout=8000)
            await page.wait_for_selector('#pbody [data-act="acell"]', timeout=8000)
            await page.click('#pbody [data-act="atab"][data-t="ward"]', timeout=8000)
            await page.wait_for_selector('#pbody [data-act="aslot"][data-s="weapon"]', timeout=8000)
            if await page.evaluate("() => window.__dr.achPts() < 10"):
                problems.append("[achievements] no points after earning Thousand Cuts")
        except Exception as e:
            problems.append(f"[achievements] achievements panel / popup failed: {str(e)[:200]}")
        await page.evaluate("() => window.__dr.closePanel()")
        print("  ok  achievements" if not any(x.startswith("[achievements]") for x in problems) else "  FAIL achievements")

        # Build V Vigil Stair: press U, start at floor 1 with the panel's button, clear the floor's waves, pick a boon with the
        # boon panel's own button, check floor 2 begins, then leave and check the record and marks. Polls (slow CI).
        where[0] = "vigil stair"
        try:
            await page.evaluate("() => { const d = window.__dr; if (d.DUN) d.exitDungeon(true); d.closePanel(); if (d.P.level < 10) d.P.level = 10; }")
            await page.keyboard.press("u")
            await page.click('#pbody [data-act="vgstart"][data-f="1"]', timeout=10000)
            await page.wait_for_function("() => { const d = window.__dr, r = d.vgRun; return !!r && r.phase === 'fight' && d.enemies.some(e => !e.dead); }", timeout=30000)
            for _ in range(60):
                ph = await page.evaluate("""() => { const d = window.__dr, r = d.vgRun; if (!r) return 'gone'; if (r.phase === 'pick') return 'pick';
                    for (const e of d.enemies) if (!e.dead) { e.hp = 0; d.killEnemy(e); } return r.phase; }""")
                if ph in ("pick", "gone"):
                    break
                await page.wait_for_timeout(500)
            await page.wait_for_selector('#pbody [data-act="vgpick"]', timeout=15000)
            await page.click('#pbody [data-act="vgpick"]', timeout=8000)
            await page.wait_for_function("() => { const r = window.__dr.vgRun; return !!r && r.f === 2 && (r.phase === 'count' || r.phase === 'fight'); }", timeout=15000)
            res = await page.evaluate("""() => { const d = window.__dr; if ((d.P.vg.best | 0) < 1) return 'floor 1 not recorded'; if (!(d.P.vg.mk > 0)) return 'no Vigil Marks';
                d.vgLeave(false); return d.DUN ? 'could not leave' : 'ok'; }""")
            if res != "ok":
                problems.append(f"[vigil stair] {res}")
        except Exception as e:
            problems.append(f"[vigil stair] tower run failed: {str(e)[:200]}")
        await page.evaluate("() => { const d = window.__dr; d.closePanel(); if (d.vgRun) d.vgLeave(false); else if (d.DUN) d.exitDungeon(true); }")
        print("  ok  vigil stair" if not any(x.startswith("[vigil stair]") for x in problems) else "  FAIL vigil stair")

        # Build W1 Weave loadouts: open the HUD loadout list, switch to Attack with one tap, flip the bar to page 2 and back
        # with the page chip, and open the Weave Book with B and filter it by family.
        where[0] = "weave loadouts"
        try:
            await page.evaluate("() => { const d = window.__dr; if (d.DUN) d.exitDungeon(true); d.closePanel(); }")
            await page.click("#bLo", timeout=8000)
            await page.click('#loPop [data-lo="1"]', timeout=8000)
            await page.wait_for_function("() => { const d = window.__dr; return d.P.wv.cur === 1 && d.P.slots.some(Boolean); }", timeout=8000)
            await page.click("#bPg", timeout=8000)
            await page.wait_for_function("() => window.__dr.P.wv.pg === 1", timeout=5000)
            await page.click("#bPg", timeout=8000)
            await page.wait_for_function("() => window.__dr.P.wv.pg === 0", timeout=5000)
            await page.keyboard.press("b")
            await page.click('#pbody [data-act="wvfam"][data-f="nuke"]', timeout=8000)
            res = await page.evaluate("""() => { const d = window.__dr; const rows = [...document.querySelectorAll('#pbody [data-act="bsel"]')];
                if (!rows.length) return 'no nukes listed'; if (!rows.every(e => d.wvFam(d.WEAVES[e.dataset.w]) === 'nuke')) return 'filter shows other families';
                if (!document.querySelector('#pbody .wvmx')) return 'no Matrix bar'; return 'ok'; }""")
            if res != "ok":
                problems.append(f"[weave loadouts] {res}")
        except Exception as e:
            problems.append(f"[weave loadouts] failed: {str(e)[:200]}")
        await page.evaluate("() => { const d = window.__dr; d.closePanel(); d.wvFilt = 'all'; }")
        print("  ok  weave loadouts" if not any(x.startswith("[weave loadouts]") for x in problems) else "  FAIL weave loadouts")

        # Build W2 Weave library + spell effects: the first 7 professions have 40-60 Weaves each, and a top-rank AoE effect
        # plays (pooled pieces appear) and clears again.
        where[0] = "spell effects"
        try:
            res = await page.evaluate("""() => { const d = window.__dr; const P = d.P;
                for (const p of ['vanguard','weaver','mender','flux','runner','wright','wild']) { const n = d.wv2Count(p); if (n < 40 || n > 60) return p + ' has ' + n + ' Weaves'; }
                d.fx2Demo('pyre4', P.pos.x, P.pos.z + 8); return d.fx2Live() > 0 ? 'ok' : 'no effect pieces spawned'; }""")
            if res != "ok":
                problems.append(f"[spell effects] {res}")
            else:
                await page.wait_for_function("() => window.__dr.fx2Live() === 0", timeout=15000)
        except Exception as e:
            problems.append(f"[spell effects] failed: {str(e)[:200]}")
        print("  ok  spell effects" if not any(x.startswith("[spell effects]") for x in problems) else "  FAIL spell effects")


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

        # HD look (game44.js): models load from hd/, the player and nearby NPCs get skinned bodies, Classic restores the rigs
        where[0] = "hd look"
        ctx = await browser.new_context(viewport={"width": 1180, "height": 820}, has_touch=True)
        await ctx.add_init_script("try{localStorage.setItem('dustreach_look_v1','hd')}catch(e){}")
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: bad("page error", str(e)))
        pg.on("console", lambda m: bad("console error", m.text) if m.type == "error" else None)
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(URL)
        await pg.wait_for_selector("#bNew", timeout=30000)
        await pg.click("#bNew")
        await pg.click('#profCards .card[data-p="shade"]')
        await pg.click('#bodyRow [data-bs="f"]')
        await pg.fill("#nameIn", "Smoke hd")
        await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            await pg.wait_for_function("window.__dr && window.__dr.HD && (window.__dr.HD.state==='ready'||window.__dr.HD.state==='error') && window.__dr.hdPlayer", timeout=60000)
            await pg.keyboard.down("KeyW"); await pg.wait_for_timeout(1200); await pg.keyboard.up("KeyW")
            await pg.evaluate("window.__dr.P.atkAnim=0.35")
            # the weapon model attaches on the next animated frame; CI frames are slow, so poll for it
            try:
                await pg.wait_for_function("(()=>{const H=window.__dr.hdPlayer;return !!(H&&H.gun&&H.gun.userData.wt)})()", timeout=30000)
            except Exception:
                pass
            st = await pg.evaluate("""(()=>{const d=window.__dr,H=d.hdPlayer;return {state:d.HD.state,err:d.HD.err,sex:H&&H.sex,
              gun:!!(H&&H.gun&&H.gun.userData.wt==='blade'),npcs:d.HD_NPCS.filter(R=>R.hd).length};})()""")
            if st["state"] != "ready" or st["sex"] != "f" or not st["gun"]:
                problems.append(f"[hd look] HD player not set up: {st}")
            elif st["npcs"] < 1:
                problems.append(f"[hd look] no NPC near Halden's Rest got an HD body: {st}")
            # HD enemies: a raider next to the player gets an HD body with a rifle, and dies with the Death01 clip
            await pg.evaluate("(()=>{const d=window.__dr;window.__hdE=d.makeEnemy('raider',d.P.pos.x+4,d.P.pos.z+4,5,true);})()")
            try:
                await pg.wait_for_function("(()=>{const e=window.__hdE;return !!(e.R.hd&&e.R.hd.gun)})()", timeout=30000)
                await pg.evaluate("(()=>{const d=window.__dr,e=window.__hdE;e.hp=1;d.killEnemy(e);})()")
                await pg.wait_for_function("(()=>{const H=window.__hdE.R.hd;return H&&H.dead&&H.cur.U==='Death01'})()", timeout=20000)
            except Exception as e:
                st2 = await pg.evaluate("(()=>{const e=window.__hdE;return {reg:!!e.R.hdSeed,hd:!!e.R.hd,dead:e.dead}})()")
                problems.append(f"[hd look] HD enemy not built/animated: {st2} {str(e)[:120]}")
            # HD robots and hounds: a Combine Sentry (mech) and an Ash Hound (wolf) get their models at a sane size; the hound dies with its Death clip
            await pg.evaluate("(()=>{const d=window.__dr;window.__hdB=[d.makeEnemy('sentry',d.P.pos.x-4,d.P.pos.z+4,5,true),d.makeEnemy('ashhound',d.P.pos.x+3,d.P.pos.z-4,5,true)];})()")
            try:
                await pg.wait_for_function("window.__hdB.every(e=>e.R.hd&&e.R.hd.beast)", timeout=30000)
                # posed height (measured from the skinned vertices) times the applied scale must land on the type's target height
                hs = await pg.evaluate("window.__hdB.map(e=>{const B=e.R.hdB,D=window.__dr.HD_BEAST_DIM[B.n];return D?+(D.h*e.R.hd.o.scale.y/B.h).toFixed(2):0;})")
                if not all(0.9 < h < 1.1 for h in hs):
                    problems.append(f"[hd look] HD robot/hound size off (height / target {hs})")
                await pg.evaluate("(()=>{const d=window.__dr,e=window.__hdB[1];e.hp=1;d.killEnemy(e);})()")
                await pg.wait_for_function("(()=>{const H=window.__hdB[1].R.hd;return H&&H.dead&&H.cur==='Death'})()", timeout=20000)
            except Exception as e:
                st3 = await pg.evaluate("window.__hdB.map(e=>({reg:!!e.R.hdB,hd:!!e.R.hd,dead:e.dead,cur:e.R.hd&&e.R.hd.cur}))")
                problems.append(f"[hd look] HD robot/hound not built/animated: {st3} {str(e)[:120]}")
            # HD monsters (Bestiary): a Dune Mauler (Lycan) and an Ash Spawn (Imp) borrow the humans' clips; every clip must keep
            # most of its tracks (bone names in the shared file carry loader suffixes) and the size must land on target
            await pg.evaluate("(()=>{const d=window.__dr;window.__hdM=[d.makeEnemy('mauler',d.P.pos.x-5,d.P.pos.z-3,5,true),d.makeEnemy('ashspawn',d.P.pos.x+5,d.P.pos.z+2,5,true)];})()")
            try:
                await pg.wait_for_function("window.__hdM.every(e=>e.R.hd&&e.R.hd.beast)", timeout=30000)
                ms = await pg.evaluate("window.__hdM.map(e=>{const H=e.R.hd,B=e.R.hdB,D=window.__dr.HD_BEAST_DIM[B.n];return {n:B.n,h:D?+(D.h*H.o.scale.y/B.h).toFixed(2):0,tr:Math.min(...Object.values(H.clips).map(c=>c.tracks.length))};})")
                if not all(0.9 < m["h"] < 1.1 and m["tr"] >= 40 for m in ms):
                    problems.append(f"[hd look] HD monster size or clips off: {ms}")
                await pg.evaluate("(()=>{const d=window.__dr,e=window.__hdM[0];e.hp=1;d.killEnemy(e);})()")
                await pg.wait_for_function("(()=>{const H=window.__hdM[0].R.hd;return H&&H.dead&&H.cur==='Death01'})()", timeout=20000)
            except Exception as e:
                st4 = await pg.evaluate("window.__hdM.map(e=>({reg:!!e.R.hdB,hd:!!e.R.hd,dead:e.dead,cur:e.R.hd&&e.R.hd.cur}))")
                problems.append(f"[hd look] HD monster not built/animated: {st4} {str(e)[:120]}")
            # HD sci-fi dungeons: Vault Theta-9 (a steel-panel theme) gets the MegaKit dressing merged into a few meshes per area.
            # Level/story are restored afterwards.
            try:
                kit = await pg.evaluate("""(()=>{const d=window.__dr,P=d.P,D=d.DUNGEONS.vault;window.__kitSave={lv:P.level,sd:(P.story.done||[]).slice()};
                  for(const e of d.enemies.slice())d.removeEnemy(e);P.level=D.lvl[0]+1;P.story.done=[...new Set([...(P.story.done||[]),'vault'].concat(Array.from({length:40},(_,i)=>'s'+(i+1))))];return d.enterDungeon('vault',{});})()""")
                if not kit:
                    problems.append("[hd look] could not enter Vault Theta-9 for the HD kit check")
                else:
                    await pg.wait_for_function("!!(window.__dr.DUN&&window.__dr.DUN.hdKit)", timeout=90000)
                    hk = await pg.evaluate("(()=>{const D=window.__dr.DUN;let m=0;for(const a of D.areas)a.g.traverse(o=>{if(o.userData.hdKit)m++;});return {m,k:D.hdKit};})()")
                    if hk["m"] < 40 or hk["k"]["pieces"] < 300:
                        problems.append(f"[hd look] HD sci-fi dungeon dressing too thin: {hk}")
            except Exception as e:
                st5 = await pg.evaluate("(()=>{const d=window.__dr;return {dun:!!d.DUN,st:d.HDK.state,err:d.HDK.err}})()")
                problems.append(f"[hd look] HD sci-fi dungeon not dressed: {st5} {str(e)[:120]}")
            finally:
                await pg.evaluate("(()=>{const d=window.__dr;if(d.DUN)d.exitDungeon(true);const s=window.__kitSave;if(s){d.P.level=s.lv;d.P.story.done=s.sd;}})()")
            # Shimmerveil on the HD body: the lattice must be skinned copies on the HD skeleton (not a rest-pose blob) and the ring visible
            await pg.evaluate("(()=>{const d=window.__dr;d.P.buffs=d.P.buffs.filter(b=>b.id!=='veil1');d.addBuff('veil1','Shimmerveil','💠',60,{evade:80,dr:10});})()")
            try:
                await pg.wait_for_function("(()=>{const P=window.__dr.PM;return P.veil&&P.veilHd})()", timeout=10000)
                vs = await pg.evaluate("(()=>{const PM=window.__dr.PM;const sk=PM.veil.filter(m=>m.isSkinnedMesh);return {sk:sk.length,bad:sk.filter(m=>m.skeleton!==m.parent.skeleton).length,ring:PM.veilRing.visible,dr:window.__dr.S.dr}})()")
                if not vs["sk"] or vs["bad"] or not vs["ring"]:
                    problems.append(f"[hd look] Shimmerveil not wrapped on the HD body: {vs}")
            except Exception as e:
                problems.append(f"[hd look] Shimmerveil never built on the HD body: {str(e)[:120]}")
            await pg.evaluate("(()=>{const d=window.__dr;d.P.buffs=d.P.buffs.filter(b=>b.id!=='veil1');d.calcStats();})()")
            await pg.evaluate("window.__dr.setLook('classic')")
            try:
                await pg.wait_for_function("!window.__dr.hdPlayer && !window.__dr.HD_NPCS.some(R=>R.hd)", timeout=15000)
            except Exception:
                pass
            if await pg.evaluate("!!window.__dr.hdPlayer || window.__dr.HD_NPCS.some(R=>R.hd)"):
                problems.append("[hd look] switching to Classic left HD bodies behind")
        except Exception as e:
            problems.append(f"[hd look] {str(e)[:200]}")
        print("  ok  hd look" if not any(x.startswith("[hd look]") for x in problems) else "  FAIL hd look")
        await ctx.close()

        # symbiants (game45): pieces drop, assemble in the panel, summon at the Cinderwell shrine, the pocket boss drops a symbiant
        where[0] = "symbiants"
        ctx, pg = await fresh()
        await pg.click("#bNew"); await pg.fill("#nameIn", "Smoke sym"); await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            await pg.evaluate("""(()=>{const d=window.__dr;const c=d.simChar('vanguard',12,2,undefined,'Smoke sym');d.startGame(c);
              for(let i=0;i<300;i++)d.symOnKill({lv:12,boss:true});d.openSym('pat');})()""")
            await pg.click('#pbody [data-act="symasm"][data-id="hesk"]')
            await pg.evaluate("""(()=>{const d=window.__dr;d.closePanel();const s=d.SYM.shrines.find(q=>q.id==='hesk');d.P.pos.set(s.x+1.5,d.P.pos.y,s.z);d.openSym('pat','hesk');})()""")
            await pg.click('#symSum')
            await pg.wait_for_function("window.__dr.SYM.live && window.__dr.SYM.live.e", timeout=10000)
            await pg.evaluate("(()=>{const d=window.__dr,e=d.SYM.live.e;d.P.pos.set(e.pos.x+4,d.P.pos.y,e.pos.z);e.hp=1;d.killEnemy(e);})()")
            await pg.wait_for_function("(window.__dr.P.sym.kills.hesk|0)>=1 && (window.__dr.loots||[]).some(l=>l.item&&l.item.sym)", timeout=30000)
            # Collection log page: hold the dropped symbiant, scan, the sym sub-tab shows the boss and the symbiant as collected
            await pg.evaluate("(()=>{const d=window.__dr;const l=d.loots.find(l=>l.item&&l.item.sym);d.P.inv.push(l.item);d.colScan(false);d.openAch('coll');})()")
            await pg.click('#pbody [data-act="asub"][data-s="sym"]')
            got = await pg.evaluate("(()=>{const t=document.querySelector('#pbody').innerText;return /POCKET BOSSES 1\\/10/i.test(t)&&Object.keys(window.__dr.P.sym.got).length===1;})()")
            if not got:
                problems.append("[symbiants] Collection log page doesn't show the kill / collected symbiant")
        except Exception as e:
            problems.append(f"[symbiants] {str(e)[:200]}")
        print("  ok  symbiants" if not any(x.startswith("[symbiants]") for x in problems) else "  FAIL symbiants")
        await ctx.close()

        # invasions (game46): force one at Cinderwell, clear 3 waves and the General, check it pays out
        where[0] = "invasions"
        ctx, pg = await fresh()
        await pg.click("#bNew"); await pg.fill("#nameIn", "Smoke inv"); await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            r = await pg.evaluate("""(()=>{const d=window.__dr;d.startGame(d.simChar('vanguard',12,2,undefined,'Smoke inv'));
              if(!d.invStart('cinderwell'))return 'did not start';const E=d.INV.ev;d.P.pos.set(E.x+20,d.P.pos.y,E.z);
              for(let k=0;k<400&&d.INV.ev;k++){d.invTick();const V=d.INV.ev;if(!V)break;for(const e of V.live.concat(V.gen?[V.gen]:[]))if(!e.dead){e.hp=1;d.killEnemy(e);}d.simStep(0.5);}
              return d.INV.ev?'still running':(d.P.inva.won===1?'ok':'not won');})()""")
            if r != "ok":
                problems.append(f"[invasions] {r}")
        except Exception as e:
            problems.append(f"[invasions] {str(e)[:200]}")
        print("  ok  invasions" if not any(x.startswith("[invasions]") for x in problems) else "  FAIL invasions")
        await ctx.close()

        # research (game47): at the level cap XP becomes research ranks; the panel's XP split buttons work
        where[0] = "research"
        ctx, pg = await fresh()
        await pg.click("#bNew"); await pg.fill("#nameIn", "Smoke rs"); await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            r = await pg.evaluate("""(()=>{const d=window.__dr;d.startGame(d.simChar('weaver',100,2,undefined,'Smoke rs'));const hp0=d.S.maxHp;
              d.rschi().sel='hp';d.gainXp(d.rschCost(1)+5);return {rank:d.rschRank('hp'),grew:d.S.maxHp>hp0};})()""")
            if r["rank"] != 1 or not r["grew"]:
                problems.append(f"[research] level-cap XP did not become a Constitution rank: {r}")
            await pg.evaluate("window.__dr.startGame(window.__dr.simChar('mender',30,2,undefined,'Smoke rs2'));window.__dr.openResearch()")
            await pg.click('#pbody [data-act="rspct"][data-p="50"]')
            if await pg.evaluate("window.__dr.rschi().pct") != 50:
                problems.append("[research] the 50% button did not set the XP split")
        except Exception as e:
            problems.append(f"[research] {str(e)[:200]}")
        print("  ok  research" if not any(x.startswith("[research]") for x in problems) else "  FAIL research")
        await ctx.close()

        # init & aggdef (game48): the stance buttons in the Skills summary change Init and damage reduction
        where[0] = "aggdef"
        ctx, pg = await fresh()
        await pg.click("#bNew"); await pg.fill("#nameIn", "Smoke agg"); await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            await pg.keyboard.press("KeyK")
            await pg.click('#pbody [data-act="aggdef"][data-v="2"]')
            r = await pg.evaluate("({ag:window.__dr.P.aggdef,init:window.__dr.S.init,dr:window.__dr.S.dr})")
            if r["ag"] != 2 or not (r["init"] >= 12) or r["dr"] != -8:
                problems.append(f"[aggdef] Aggressive++ not applied: {r}")
        except Exception as e:
            problems.append(f"[aggdef] {str(e)[:200]}")
        print("  ok  aggdef" if not any(x.startswith("[aggdef]") for x in problems) else "  FAIL aggdef")
        await ctx.close()

        # conduit splice (game50): Glintrunner Weaves open the Conduit map from anywhere; picking a node starts a still cast;
        # the emergency one works in combat and isn't broken by damage; cancelling spends nothing
        where[0] = "conduit splice"
        ctx, pg = await fresh()
        await pg.click("#bNew"); await pg.fill("#nameIn", "Smoke splice"); await pg.click("#bDeploy")
        try:
            await pg.wait_for_selector("#hud:not(.hidden)", timeout=20000)
            r = await pg.evaluate("""(()=>{const d=window.__dr,P=d.P,o={};for(const e of d.enemies.slice())d.removeEnemy(e);
              o.w=['splice','splice2','jackin','jackin2'].every(id=>d.WEAVES[id]&&d.WEAVES[id].prof==='runner');
              P.pos.set(60,P.pos.y,60);const bar=d.barIds();bar[0]='splice';P.lastCombat=-100;P.en=d.S.maxEn;
              o.open=d.useAbility(0)&&d.panelOpen==='conduit';d.closePanel();d.conduitTravel('town');o.cast=!!(P.cast&&P.cast.still&&P.cast.fragile&&/Splicing/.test(P.cast.label));
              d.cancelCast();o.free=!P.cds.splice;P.lastCombat=d.T;o.blocked=!d.useAbility(0);
              bar[0]='jackin';o.em=d.useAbility(0);d.closePanel();d.conduitTravel('town');o.emCast=!!(P.cast&&!P.cast.fragile);d.cancelCast();return o;})()""")
            if not all(r.values()):
                problems.append(f"[conduit splice] {r}")
        except Exception as e:
            problems.append(f"[conduit splice] {str(e)[:200]}")
        print("  ok  conduit splice" if not any(x.startswith("[conduit splice]") for x in problems) else "  FAIL conduit splice")
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
