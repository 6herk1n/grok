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

## The source code should live in this repo

The game is currently built from about 33 source files (`game1.js` … `game33.js`) that only exist in the builder's workspace. Only the combined `index.html` is committed. That means:
- a change anyone else makes to `index.html` is wiped out by the next build from those files, and
- if that workspace is lost, the readable source is gone.

**Please commit the source files and the build script** (for example `src/game*.js` plus `build.py` or `build.sh` that produces `index.html`), and build from what's in the repo. Then every agent edits the same source.

## Pull before you build

Other agents push here too. Always `git pull --rebase` before starting, and never force-push. Before building, fold in any changes on `main` that aren't in your source.

Pending, not merged: branch `claude/phone-landscape-hud` (commit 497a139) has a small CSS fix. On short landscape phone screens the HUD overlapped itself, so a `max-height:480px` media query scales the action cluster, top bar, minimap and joystick. Please bring it into the source.
