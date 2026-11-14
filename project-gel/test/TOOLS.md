# Test tools

Everything here runs from the project folder (`project-gel/`). The browser tools use Playwright
from `/opt/node22/lib/node_modules/playwright` with headless Chromium on software graphics (SwiftShader).
That is slow but deterministic.

Rules:
- Run **one browser tool at a time**. Under CPU contention, waits for models time out.
- Don't rebuild `dist/` while a test is reloading pages.
- Screenshots go to `test/shots/` (git-ignored). Open them and look.

The very first model build after a start takes minutes on software graphics. A tool that needs a chapter waits for
that chapter's models.

## Start here

| Command | What it does |
|---|---|
| `node build.mjs && node test/syntax.mjs` | Build, then compile-check the game and the mesh worker (seconds). Do this after every change. |
| `node test/shoot.mjs [--land N\|--sea N\|--rush\|--endless\|--tab X] [--eval js] [--frames n] [--out f.png]` | Go anywhere, do anything, step frames and take a screenshot, with a state summary and page errors. The quickest way to look at something or reproduce a bug. Run it without options for help. |
| `node test/game.mjs` | The full regression, about 5-6 min: boots, builds every model, checks for NaN meshes and page errors. Other modes (`play`, `bosses`, `powerups`, `evos`, `perf`, `flows`, `skills`...) are listed in STATUS.md, "Build and test". |
| `node test/_features.mjs` (`ONLY=face,settings,menus,land,rush,sea,city`) | The newest features, each checked and photographed. |

## Models (no browser, seconds)

| Command | What it does |
|---|---|
| `node test/meshtime.mjs [model ...]` | Build time, triangles and part count per model (`HASH=1` to compare meshes before and after a mesher change) |
| `node test/sdf.mjs parts <model>` | Its parts by shape, bounds, cell size, clips, and the thinnest part against the 2-cell rule |
| `node test/sdf.mjs at <model> x y z` | The field at a point, and which parts are nearest (which part colors a vertex there) |
| `node test/sdf.mjs slice <model> y [z]` | Where the surface is along x at a height: how wide the model really is there |
| `node test/sdf.mjs field <model>` | Does the mesher's fast binned field agree with the exact one where it matters? |
| `node test/sdf.mjs evals <model>` | Which kind of part a model's build time goes to |

## Features and fixes (browser; each prints `ok` / `FAIL` lines and writes screenshots)

| Script | What it checks |
|---|---|
| `_resume.mjs` | Runs survive a reload, a boss fight keeps its health, and lost graphics reload into the run |
| `_tele.mjs` | Attack warnings: archer lanes, a miniboss fan, held volleys, musket pirates, merfolk tridents |
| `_evo.mjs` | "Evolves with" icons on level-up cards (land and sea), and the one-row slot bar at sea |
| `_maxed.mjs` | Nothing at max level is ever offered again (cards and chest) |
| `_equip.mjs` | Tapping gear equips or swaps it |
| `_stageA/B/C.mjs`, `_j1234.mjs`, `_k.mjs`, `_l.mjs`, `_m1.mjs`, `_m3.mjs`, `_meta.mjs`, `_fixes.mjs`, `_cos2.mjs` | Older rounds' checks (each file's first line says what) |
| `_cave.mjs`, `_cavefoes.mjs` | Chapter 20 end to end: the crater, the cave rooms, the fork, the Bagger |
| `_shipfreeze.mjs` | Picking the Ship upgrade never stalls the game |
| `_resist.mjs` | Every boss's immunities and weaknesses are valid skill ids |
| `check-*.mjs` | Gooblin, Endless, Boss Rush, goals, the home screen, dodging, parallel shader compile |

## Looking at things (screenshots)

| Script | What it shows |
|---|---|
| `_menus.mjs` (`TAG=`), `_shots.mjs`, `_homesizes.mjs`, `_fixes.mjs` | Every menu, and the home screen at several window sizes (check that text fills its boxes) |
| `_isles.mjs` (`KINDS=`, `EACH=1`, `CH=`) | Islands in a grid, then close-ups |
| `_seaview.mjs`, `_seach.mjs` (`CHS=`) | An ocean chapter: ship, island, swimmers, miniboss, every boss attack |
| `_ships.mjs`, `_shipgal.mjs`, `_seahome.mjs`, `_seaicons.mjs` | Ships and their looks, the ocean page, sea upgrade icons |
| `_cos.mjs` (`IDS=`, `LOUNGE=1`, `GEAR=`), `_trophies.mjs`, `_gearlook.mjs`, `_robe.mjs`, `_art.mjs` | Costumes, hats, gear on the blob, item art |
| `_bounds.mjs` (`M=`) | Mesh bounds of some models |
| `node build.mjs visual && node test/visual.mjs [scene\|close\|punch\|bosses\|items\|arenas]` | The engine-only test scene |
| `node test/montage.mjs out.png <cols> a.png b.png ...` | Tile screenshots into one sheet |

## Balance and bots

| Script | What it measures |
|---|---|
| `node test/game.mjs play <chapter> [--runs=N]` | A kiting bot plays chapters; win rate and damage sources |
| `_seabot.mjs` (`CHS=1,5`) | An autopilot plays whole ocean chapters |
| `_dps.mjs` (`IDS=a,b`), `_seadps.mjs` | One power's damage in 30 s against a standing crowd, level 1 and 10. Use it to check each new chapter power-up beats the last |

## Performance

| Script | What it measures |
|---|---|
| `node test/game.mjs perf` | Frame cost in menus and a crowded run, with features switched off one at a time |
| `_cull.mjs`, `_cullfps.mjs` | Off-screen culling: instances skipped, and frame time on vs off |
| `_menuperf.mjs` | A menu frame's main-thread cost (script, style, layout, paint) |
| `_caveperf.mjs` | Where a cave frame's time goes |
| `_homerate.mjs` | Home screen frame rate |
| `caps.mjs` | What WebGL2 the test browser offers |

The test GPU is software: compare builds against each other, and don't read the numbers as real-GPU timings.

## Harness (`harness.js`, injected into every browser tool)

- `__manual()` takes over the frame loop. Then call `if (!__rafQ.length) requestAnimationFrame(loop)` once, and
  `__frames(n, dt, render)` steps it; with `render = true` it draws the last frame.
- `__bot` is a kiting bot (`__bot.on = true`).
- The game's globals are `const`: use `G`, not `window.G` (that is `undefined`). Across reloads, test with
  `typeof G !== 'undefined'`.
- After `__manual()`, Playwright's `waitForFunction` needs `{ polling: 100 }` or similar.
- Useful game handles:
  - `beginChapter(n)`, `beginSeaChapter(n)`, `beginBossRush()`, `goHome()`;
  - `spawnEnemy(type, x, z)`, `seaFoe(type, x, z)`, `startBoss()`, `addOrLevel(id)`, `killEnemy(e)`, `hurtEnemy(e, dmg)`;
  - `DEV.god = true`; `G.run`, `OC` (the sea), `UI.openTab(name)`.
