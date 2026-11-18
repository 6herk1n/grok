// tests/ci_smoke.mjs: DUSTREACH pre-deploy smoke test (GitHub Actions and local).
//   node tests/ci_smoke.mjs [siteDir]      siteDir defaults to the repo root (where index.html lives)
//   SMOKE_ONLY=desktop|ipad|phone          run one pass only
// Pass "ipad" (1180x820 landscape, touch): same flow and HUD layout check as the phone pass.
// Info only: this file is NOT run by .github/workflows/pages.yml (tests/smoke_test.py is the deploy gate).
// Pass 1 "desktop" (1280x800, mouse): load, create a character, deploy, walk; fail on any pageerror,
//   console error or failed request.
// Pass 2 "phone" (750x342 landscape, touch, isMobile): same flow with taps, same error rules, plus a HUD
//   layout check: fails if any visible top/centre HUD element (#mtrack, #topright, #banner text, #toast text)
//   overlaps any visible action button (#bAtk, #b0-#b5, #bQuick, #quick, #bMount), or banner text overlaps
//   toast text, or the left-hand tip text (#log) overlaps the banner/toast text. Hidden / zero-size elements are skipped.
// Exit 0 = all good, 1 = failure (deploy must not happen).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const ONLY = process.env.SMOKE_ONLY || 'all';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

function serve(dir) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('nf'); return; }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(s));
  });
}

const HUD_TOP = ['#mtrack', '#topright', '#banner', '#toast'];
const HUD_BTN = ['#bAtk', '#b0', '#b1', '#b2', '#b3', '#b4', '#b5', '#bQuick', '#quick', '#bMount'];

async function pass(browser, url, name, opts) {
  const ctx = await browser.newContext(opts.ctx); const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => {
    const ft = (r.failure() || {}).errorText || '';
    // the in-page update check (?v=<time>) reads only the build meta tag, then cancels the body on purpose
    if (/[?&]v=\d+$/.test(r.url()) && /ERR_ABORTED/.test(ft)) return;
    if (!/favicon/.test(r.url())) errs.push('requestfailed: ' + r.url() + ' ' + ft);
  });
  page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push('http ' + r.status() + ': ' + r.url()); });
  page.on('dialog', d => d.accept());
  const results = []; const ok = (c, m) => { results.push(!!c); console.log((c ? '  ok   ' : '  FAIL ') + name + ': ' + m); };
  const click = sel => opts.touch ? page.tap(sel) : page.click(sel);
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.__dr && document.querySelector('#bNew'), null, { timeout: 45000 });
    await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.waitForFunction(() => window.__dr && document.querySelector('#bNew'), null, { timeout: 45000 });
    ok(await page.evaluate(() => typeof THREE !== 'undefined' && !!window.DR_BUILD && !/__BUILD__/.test(window.DR_BUILD)),
      'page loads, Three.js present, build ' + await page.evaluate(() => window.DR_BUILD));
    await click('#bNew'); await page.waitForTimeout(400);
    await page.locator('.card[data-p="vanguard"]').scrollIntoViewIfNeeded(); await click('.card[data-p="vanguard"]');
    await page.fill('#nameIn', 'CI Smoke');
    await page.locator('#bDeploy').scrollIntoViewIfNeeded(); await click('#bDeploy');
    await page.waitForFunction(() => window.__dr && __dr.state === 'play' && !document.querySelector('#hud').classList.contains('hidden'), null, { timeout: 30000 });
    ok(await page.evaluate(() => __dr.P.name === 'CI Smoke'), 'character created and deployed into the world');
    await page.keyboard.down('KeyW'); await page.waitForTimeout(1500); await page.keyboard.up('KeyW');
    await page.waitForTimeout(1000);
    ok(await page.evaluate(() => __dr.renderer.info.render.frame > 20), 'rendering frames');
    if (opts.layout) {
      // show a region banner and a tip toast the way the game does (game3.js banner()/toast()), then measure
      const rep = await page.evaluate(({ TOP, BTN }) => {
        const b = document.querySelector('#banner'); b.innerHTML = 'Mirelight Fen<small>Lv 11-20</small>'; b.classList.add('on');
        const t = document.querySelector('#toast'); t.textContent = 'Tip: tap the map button to see your next story step'; t.classList.add('on');
        const textRect = el => { // union of the rendered text only (not the full-width block boxes around it)
          let L = 1e9, T = 1e9, R = -1e9, Bt = -1e9; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
            for (const q of r.getClientRects()) { L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); Bt = Math.max(Bt, q.bottom); } }
          return { left: L, top: T, width: Math.max(0, R - L), height: Math.max(0, Bt - T) }; };
        const vis = el => {
          if (!el) return false; if (el.closest('.hidden')) return false;
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          for (let e = el; e; e = e.parentElement) if (getComputedStyle(e).display === 'none') return false;
          const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
        };
        const box = sel => {
          const el = document.querySelector(sel); if (!vis(el)) return null;
          const textOnly = sel === '#banner' || sel === '#toast' || sel === '#log';
          if (textOnly && !el.textContent.trim()) return null;
          const r = textOnly ? textRect(el) : el.getBoundingClientRect();
          return { sel, x: r.left, y: r.top, w: r.width, h: r.height };
        };
        const A = TOP.map(box).filter(Boolean), B = BTN.map(box).filter(Boolean);
        const hit = (p, q) => { const ox = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), oy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y); return ox > 1 && oy > 1 ? Math.round(ox) + 'x' + Math.round(oy) : null; };
        const out = [];
        for (const p of A) for (const q of B) { const h = hit(p, q); if (h) out.push(p.sel + ' overlaps ' + q.sel + ' (' + h + ' px)'); }
        const bn = A.find(a => a.sel === '#banner'), ts = A.find(a => a.sel === '#toast');
        if (bn && ts) { const h = hit(bn, ts); if (h) out.push('#toast overlaps #banner (' + h + ' px)'); }
        const lg = box('#log'); // the left-hand tip/log text vs the centred region banner and toast
        for (const c of [bn, ts]) if (lg && c) { const h = hit(lg, c); if (h) out.push('#log tip text overlaps ' + c.sel + ' (' + h + ' px)'); }
        return { overlaps: out, measured: A.concat(B).map(r => r.sel + '@' + [r.x, r.y, r.w, r.h].map(Math.round).join(',')) };
      }, { TOP: HUD_TOP, BTN: HUD_BTN });
      console.log('  info ' + name + ': measured ' + rep.measured.join(' '));
      if (process.env.SMOKE_SHOT) await page.screenshot({ path: process.env.SMOKE_SHOT });
      ok(rep.overlaps.length === 0, 'HUD has no overlapping elements at ' + opts.ctx.viewport.width + 'x' + opts.ctx.viewport.height +
        (rep.overlaps.length ? ' -> ' + rep.overlaps.join('; ') : ''));
    }
  } catch (e) { ok(false, 'flow threw: ' + (e && e.message ? e.message.split('\n')[0] : e)); }
  ok(errs.length === 0, 'no console/page/request errors' + (errs.length ? ' -> ' + errs.slice(0, 6).join(' | ') : ''));
  await ctx.close(); return results.every(Boolean);
}

const srv = await serve(ROOT); const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let good = true;
try {
  if (ONLY === 'all' || ONLY === 'desktop')
    good = await pass(browser, url, 'desktop', { touch: false, layout: false, ctx: { viewport: { width: 1280, height: 800 } } }) && good;
  if (ONLY === 'all' || ONLY === 'ipad')
    good = await pass(browser, url, 'ipad', { touch: true, layout: true, ctx: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } }) && good;
  if (ONLY === 'all' || ONLY === 'phone')
    good = await pass(browser, url, 'phone', { touch: true, layout: true, ctx: { viewport: { width: 750, height: 342 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } }) && good;
} finally { await browser.close(); srv.close(); }
console.log(good ? 'CI SMOKE OK' : 'CI SMOKE FAILED: do not deploy');
process.exit(good ? 0 : 1);
