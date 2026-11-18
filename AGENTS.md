# Notes for any agent working on DUSTREACH

More than one agent works on this repo (Grok via Cursor, and Claude Code). Read this before building.

## Every push is tested before it goes live

`.github/workflows/pages.yml` runs `tests/smoke_test.py` on every push to `main`, and only deploys to GitHub Pages if it passes. For every profession, the test starts a fresh game, makes a character, plays a few seconds and opens each panel (pack, skills, journal, weave book, craft, help, map). It then checks that a save survives a reload. **Any page error or console error fails it.**

- After you push, check that the Actions run is green. If it's red, the live game is still on the previous build. Fix it and push again.
- Run it locally before pushing: `pip install playwright && python -m playwright install chromium && python tests/smoke_test.py`.
- The test relies on these hooks. Keep them, or update the test in the same commit if you change them:
  - `#bNew`, `#profCards .card[data-p=<prof>]`, `#nameIn`, `#bDeploy`, `#hud` (loses `.hidden` in play), `#bContinue`
  - `window.__dr.PROFS`, `window.__drSave`, `window.DR_BUILD`
  - keys I K L B J H M, Tab, Space, W
- Don't delete or weaken the test to get a build out. If it's failing for a reason that isn't a game bug (for example a new harmless console message from headless Chrome), add that message to `IGNORE` in the test and say why in the commit.

## The source lives in `src/`. Build from it, never edit the built files

The six files at the repo root (`index.html`, `three.min.js`, `sw.js`, `manifest.webmanifest`, `icon-180.png`, `icon-512.png`) are **build output**. GitHub Pages serves them, but they are generated from `src/`, and the next build overwrites any hand edit. Make every change in `src/` and rebuild.

- `src/game1.js` … `src/game35.js`: the game code. `build.js` joins these into one `<script>` **in a fixed order** (see `ORDER` in `build.js`; later files patch earlier ones and `game4.js` boots the game last). If you add a file, add it to `ORDER`.
- `src/template.html`: the page shell and all CSS. Placeholders: `__BUILD__`, `__ICON__`, `<script>__THREE__</script>`, `__GAME__`.
- `src/sw.js`: the service worker template (`__BUILD__`, `__THREE_URL__`).
- `src/icon.b64` (becomes `icon-180.png`) and `src/icon-512.png`.
- `src/vendor/three.min.js` + `THREE_VERSION`: Three.js r150 (0.150.1), vendored so the build needs no `npm install`.

### How to build

```
node build.js            # writes the 6 root files in place (Node 18+, no dependencies)
node build.js /tmp/out   # or into another folder, e.g. to compare builds
```

Each build gets a stamp `<UTC yyyymmddThhmmss>-<sha1 of the game code, 8 hex>`. It goes into `index.html` (`<meta name="dr-build">`, `window.DR_BUILD`) and into the `sw.js` cache name. That way every build installs a fresh offline cache and the in-game "New version" prompt fires. Commit the rebuilt root files together with the `src/` change that produced them.

### Tests

- `tests/smoke_test.py` (Python Playwright): the deploy gate run by `pages.yml`. Run it before every push (see above).
- `tests/smoke.js` (Node Playwright, `npm install` first): the builder's quick pre-publish check (iPad-sized touch viewport, save/reload).
- `tests/ci_smoke.mjs` (Node Playwright): info only, not run by CI. `SMOKE_ONLY=desktop|ipad|phone` runs one pass. The phone pass (750x342) includes a strict HUD-overlap check that still reports some overlaps on that very short screen; treat its result as information, not a gate.
- The builder's long regression suite (`test*.js`, about 40 Playwright scripts) is not in the repo yet: it is hard-wired to the builder's workspace layout.

Never commit `publish.sh`/uploader scripts, keys, tokens or e-mail credentials. Don't commit backups, screenshots, sim output or logs either.

## Pull before you build

Other agents push here too. Always `git pull --rebase` before starting, and never force-push. Before building, fold in any changes on `main` that aren't in your source.

Merged: branch `claude/phone-landscape-hud` (commit 497a139). Its `max-height:480px` media query for short landscape phone screens is now in `src/template.html` (end of the `<style>` block), not in the built file. That branch can be deleted.
