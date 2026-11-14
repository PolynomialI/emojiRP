# Project Gel: guide for whoever works on it next

Read this first, then the top of `STATUS.md` (its standing rules) and its latest few sections. This file explains
the *intent* behind the game: what it is for, what the owner cares about, the quality bar, how performance is
treated, how the code fits together, and what is still open. `STATUS.md` is the change log and reference;
`README.md` is the short how-to.

---

## 1. What the game is

A Blob Hero–style "survivor" game. You steer a goo blob, which attacks automatically. Waves of foes close in, you
collect gems for XP, and every level-up offers three power cards. Bosses end the chapters.

- **One file:** `dist/project-gel.html`, built from `src/`. Raw WebGL2, no engine, no assets: the models are signed
  distance fields meshed at start-up, and the sound and music are synthesized. It plays offline, except for the UI
  font.
- **Land mode:** 20 chapters, each with its own map theme, enemies, a miniboss that visits three times, and a boss.
  Chapter 20 ends in the Cave, an on-rails cover shooter against the Bagger.
  - Endless (survive as long as you can) and Boss Rush (all the bosses in a row, with medals).
- **Sea mode ("The Ocean Update"):** 20 oceans, sailed from the home screen's second page. The blob lounges on deck
  while you steer.
  - Upgrades are mounted on the ship. The ship itself levels up from a raft to the Golden Ark: ten ships.
  - Islands, sea bosses, weather fronts, treasure maps, a whale, and the drowned city in ocean 20.
- **Meta progression:**
  - coins; gear (artifacts from scroll chests, fused up through the rarities);
  - blob colors, each with its own level and stats; costumes, hats, goo trails; ship paints, sails, flags, wake
    trails;
  - achievements, the Codex, and Boss Rush medals.
- **Saves:** localStorage. Runs survive a reload or sleep (checkpoint and resume), and saves can be exported and
  imported.

## 2. What the owner wants (the goals)

The owner plays the game, sends long lists of changes, and judges by feel and by look. Recurring themes:

1. **Rewarding progression.** Every new chapter's power-up must be stronger, or plainly better, than the one before:
   finding one should feel exciting. Later content should feel bigger and better, never a side-grade.
2. **Fair but not tedious.** Every attack that can hurt you is telegraphed: lanes, circles and cones on the ground
   first. Hard is fine; "excruciating" is not. Example: the chapter 2 Hurlers jumping away from the player was
   called excruciating to kill. Minibosses and bosses were nerfed by request. When asked for specific numbers, use
   exactly those numbers.
3. **It must look good.** Models should be detailed and alive, not plain primitives:
   - islands were called "very circular, lifeless";
   - the squid costume was "too triangle and coney";
   - boats got several detail passes.
   Menus must be tidy: no misalignment, no wrapping, text that fills its box. The owner sends screenshots of anything
   wrong.
4. **It must run smoothly.** The owner noticed menu lag and asked for culling, and does not want big changes that
   "secretly impact performance". Target hardware: ordinary laptops and Chromebooks with integrated graphics. No
   phone-specific work for now; the owner said so.
5. **Lots of content, done thoroughly.** Requests come in big batches ("do all of these perfectly and in detail").
   Do every item, fully, and report on each one.
6. **Never lose progress.** Saves must be robust: the run survives sleep and reload, and saves can be exported.

## 3. How to work with the owner

- **Their standing preferences** (also in their profile):
  - State your assumptions before starting. If a request could mean two things, say which you picked, or ask
    when it really matters.
  - Push back if there is a simpler way, or a problem with the plan.
  - Keep changes minimal: no unrequested features, refactors or rewording of unrelated parts.
  - For big tasks, say what "done" means, then check against it.
- **Ambiguous requests:** the owner prefers progress over waiting. State the interpretation in one line and carry on.
  Examples: "five normal upgrade slots at sea" was taken as the Ship plus 5 weapons; "my last prompt" was taken as
  the previous request's scope.
- **Deliver every round:**
  - build, test, and look at screenshots of what changed;
  - update `STATUS.md`, with a new "(latest)" section at the top of the change log;
  - commit and push;
  - send `dist/project-gel.html` to the owner (and screenshots of the visible changes);
  - end with a short report: what changed, assumptions, anything untested or estimated.
- **Commit often**, with clear messages, and no model names in commits. Never open a pull request unless asked.
- **Repositories:** the project lives in `polynomiali/projectgel` (`main`) with its full history. It was also
  developed in `polynomiali/emojiRP` on branch `claude/brave-turing-9ccfts`, folder `project-gel/`. At the hand-off
  both were identical. Use the one the owner names; if it is projectgel, work on `main` there and stop syncing.
- **Be honest in reports:**
  - "verified" means a test or a screenshot showed it;
  - say when something is an estimate (for example the Boss Rush medal times), or cannot be checked here (the
    music, which nobody has listened to);
  - say when a request turned out to be already done, or half done, in the code (for example the shield-bearers,
    splitters and moles that already existed).

## 4. Design intent, area by area

### Combat and feel
- The blob attacks by itself; skill is in movement, positioning and build choice.
- **Hits should feel good:** squash on the blob and on enemies, damage numbers, bursts, screen shake (switchable),
  and a sound for everything.
- **Slots:** 4 skills and 4 passives on land. At sea, 6 skills (the Ship plus 5 weapons) and 4 passives. The HUD
  slot bar stays on one row.
- **Evolutions:** a skill at max level plus its partner passive can evolve, by chance, from a chest. Level-up cards
  show the partner icons, so players don't pick passives blind.
- **Abilities:** five skills, once maxed, also give an ability you fire yourself (keys 1-5 or the buttons).
- **Danger is telegraphed:**
  - `addTele` lanes, circles and cones (13-enemies.js);
  - `teleShot` holds a land volley 0.5 s on its lanes; `seaBall` does the same at sea;
  - ranged foes show an aim lane;
  - slow, visible projectile rings and spirals act as their own warning.
- **Boss weak points:** after a boss's big telegraphed attack lands, it is open for 2 s and takes double damage.
  This rewards staying close (13r-boss-extras.js).

### Balance (land)
Multipliers in 11-game.js, each the result of owner requests:

| Constant | Value | What it scales |
|---|---|---|
| `LAND_SPAWN` | 0.75 | spawn rate |
| `LAND_XP` | 1.15 | XP |
| `LAND_BOSS_HP` | 0.8 | boss health |
| `MINI_HP` | 0.6 | miniboss health |
| `MINI_DMG` | 0.7 | miniboss damage |
| `ENEMY_HP` | 0.7 | enemy health |
| `MAX_ALIVE` | 300 | the hard enemy cap; never raise it casually |

- A chapter is about 300 s to its boss (`RATE_KEYS`).
- Bigger foes drop green and blue gem mixes; elites drop a chest.
- Each chapter power-up (`from: N` in SKILLS) must beat the previous one. Check with `test/_dps.mjs` and by playing.
- The Hurlers are deliberately spared some nerfs (`spareHurler`).
- Leave existing tuning alone unless asked. When asked, apply the requested numbers exactly and mention any side
  effects.

### Sea
- **Steering:** tank controls on the keyboard (W/S throttle, A/D turn); the stick points where to go.
- **Danger:** swimmers board the ship and hack at the hull. Ramming, turning hard and the mounted weapons deal with
  them.
- **Islands:** every island kind has its own outline (lobes, `ISLE_LOBES`), its own life (gulls, ambient effects)
  and its own decorations. Collisions use the real outline.
- **Ocean 20, the drowned city:** ruined, overgrown office towers set in city blocks with canals between them.
- **Weather fronts** per ocean (fog banks, tailwinds, squalls), treasure maps, and a whale whose spout heals.

### Cosmetics and economy
- **Body colors:** each has its own level (up to 20) and stats.
- **Costumes:** must change the body, not only the head; the owner asked for many body costumes. Hats are separate.
- Gear shows on the blob. Each gear item type can be recolored.
- **Ship looks** apply to every ship, and never show on land.
- Some cosmetics are trophies (achievements and boss kills), not for sale.
- **Coins** come from runs (Endless and Boss Rush pay a quarter), achievements and treasure.

### UI
- **Big, chunky, friendly:**
  - jelly buttons; the Fredoka font;
  - text that fills its box, and boxes no bigger than their content;
  - buttons slide left on hover (CSS `translate`).
- The home screen has two pages, land and sea (swipe or arrow). The blob stands on stage, spins when dragged,
  shoots the background grunts, and dozes if left alone.
- Wide layout: stage on the left, the menu stacked on the right. Narrow: stacked. Check both when changing menus.

### Saves
- `localStorage` key `projectGel.save.v1`. `loadGame` merges stored data over `defaultSave()`, so **every new save
  field needs a default there**.
- `content < 4` saves are reset, from an old economy change. Bump `content` only for a deliberate wipe.
- **Run checkpoint:** key `projectGel.run.v1` (15a-resume.js).
  - Written every 4 s and on hide or close; cleared by finishing, quitting, or falling.
  - Restores the mode, chapter, time, powers, health, coins, position and boss health; fresh foes replace the
    swarm.
  - Anything a run must keep across a reload has to go in `runSnapshot` and `applyResume`.

## 5. The quality bar

**Standing rules** (from the top of STATUS.md, which keeps the full text):
1. UI text fills its space; boxes are no bigger than their content.
2. Buttons slide left on hover via CSS `translate`; a button with its own `transition` must add `translate` to it.
3. Never blend thin flat shapes: SDF parts thinner than about 2 mesh cells vanish or smear (see 7).
4. Each new chapter power-up beats the last.

**In practice:**
- **Look at it.** Every visible change gets a screenshot (`test/shots/`) that you actually open and inspect.
  Contact sheets help (`test/montage.mjs`, or Python PIL).
- **Telegraph every new attack.** A new enemy or boss move needs its warning.
- **Finish the feature:** UI, save fields with defaults, resume support if it is run state, Codex names for new
  enemies (`CODEX_NAMES` or `ENEMY_TYPES[k].name`), STATUS.md, and a test.
- **No silent behavior changes** to systems you were not asked to touch.
- **Comments explain why, in plain words,** like the rest of the code. Section comments at the top of each file
  describe what the file holds; keep them true.

## 6. Performance and optimization

**Where the time goes:**
- **Per-pixel work dominates the frame:**
  - the hero, ray-marched shapes with a per-ray mask of the few shapes near the ray;
  - goo impostors (pickups, projectiles);
  - the floor and water shader, bloom and MSAA.
  More pixels cost more than more enemies.
- **Enemy and scenery meshes are instanced** (`pushEnemy` streams) and culled when off screen (`R.cullBegin`,
  `cullSphere`). Measured gain: 9% with 260 foes on land, 2% at sea.

**Start-up and chapter loads:**
- Every model is meshed from SDF parts in up to 3 background workers at start-up: about 4-5 minutes on the
  software test GPU, much less on a real CPU.
- Picking a chapter moves its models to the front of the queue. The run waits, with a progress bar, until they are
  built.
- So **mesh build time is a real cost.** Measure with `node test/meshtime.mjs <models>`: time, triangles and parts,
  with no browser.

**Keeping meshes cheap:**
- Fewer parts.
- The coarsest cell that still holds the thinnest part (`THEME_CELLS`). Islands use 0.1, the ruins 0.12, the whale
  0.07, small foes about 0.03.
- Paint detail instead of modelling it (`win:` window grids on boxes).
- Boxes, spheres, cylinders and plain capsules get exact-distance bin culling in the mesher. Long flat parts used to
  be the slow case.

**Runtime limits:**
- `MAX_ALIVE` = 300 enemies.
- Particle, decal and droplet caps per graphics preset (`QUALITY_CAPS` in 17-main.js).
- Cosmetic emitters (trails, island ambience) are rate-limited.

**Presets:** Auto (adapts resolution, then MSAA, then bloom), High, Medium, Low, Ultra low (30 fps). There is an
FPS counter in Settings.

**Deliberately not done** (they would cost per-pixel time):
- real-time shadows per enemy;
- water reflections or refraction;
- extra full-screen passes;
- more enemies on screen;
- high-resolution meshes.

**Hot loops:** reuse arrays (see `STEER`, `_io`, `_ws`), avoid allocating per enemy per frame, and keep per-frame
`querySelectorAll` and DOM writes out of the game loop: write to the HUD only when a value changes.

**Measure, don't guess.**
- Compare before and after with the same test: `test/_cullfps.mjs`, `test/_menuperf.mjs`, `test/game.mjs perf`, or
  `meshtime`.
- Report real numbers, and say when a gain is small.
- The test GPU is software (SwiftShader), so compare builds against each other rather than reading absolute
  timings.

**Ideas not built yet:**
- Cache built meshes in IndexedDB, keyed by a hash of each model's source. Instant loads after the first visit; the
  biggest load-time win available.
- Build the home screen's and last-played chapter's models first.

## 7. How the code fits together

- **Build:** `node build.mjs` concatenates `src/*.js` **sorted by filename** into one script inside `src/index.html`,
  which holds the markup and all the CSS, and writes `dist/project-gel.html`.
  - Every top-level name is a global. Duplicate top-level names break the whole bundle; a second `KRAKEN` once
  did.
  - The mesh worker runs only the files listed in `build.mjs` (`00-util`, `03-sdfmesh`, `04*`). Model code must not
    touch the DOM, `G`, `UI` or `R`.
  - After building, `node test/syntax.mjs` compiles both scripts and points at any syntax error.
- **File map** (each file's header comment says more):

| Files | What they hold |
|---|---|
| `00`–`03` | utilities, GL helpers, procedural textures, the SDF mesher (surface nets, part shapes, rotated boxes, window paint) |
| `04*` | all models, as SDF parts: humanoids with an 11-bone skeleton and baked clips (`makeHumanoid`), and props (`prop(defs, name, parts)`) |
| `05`–`06` | GLSL (the hero, impostors, decals, particles, floor and water, post) and the renderer (passes, instance streams, camera, culling) |
| `07` | the hero rig: spring-driven shapes, costumes and gear on the body, and the painted face |
| `08`–`09a` | effects, sound, music |
| `10*` | data: SKILLS, PASSIVES, EVOLUTIONS, ENEMY_TYPES, ENEMY_MIX, BOSS_TYPES, ARENAS, chapters, skins, costumes, ship looks, trails |
| `11*` | game state and runs, arenas and themes, events, the West town, the crater |
| `12*` | skills and abilities |
| `13*` | enemies and bosses (land), the cave and the Bagger, the whole sea (`13k`–`13q`, `13s`), boss extras (`13r`) |
| `14*` | UI, gear, the dev console, achievements and the Codex |
| `15*` | saves, resume |
| `16` | icons |
| `17` | boot, mesh workers, input, the home scene, the main loop, settings |

**Model conventions:**
- Parts: `{ s: 'sph'|'cap'|'ell'|'box'|'cyl'|'tor'|'crag'|'rock'|'gable', c, r, rr, hs, a, b, r2, col, k, sub, bone, rot, win, paint }`.
  `k` is the smooth-blend radius; `sub` carves; `rot` turns a box; `win` paints a window grid.
- Registering a model:
  - add its name to `MESH_ORDER`, which sets build order;
  - give it a clip list in `THEME_CLIPS` (at least `['still']`) and a cell size in `THEME_CELLS`;
  - add it to the worker file list in `build.mjs` if it lives in a new file.
- World scale: land model units are about one hero leg. Sea models are world units: +z is forward, y = 0 the
  waterline.

**Drawing API**, called from the `emit*` functions each frame:
- `pushEnemy(model, elite, x, y, z, yaw, row, scale, squash, dead, flash, aura, r, g, b, fade)` draws any mesh. `row`
  picks the animation frame.
- `pushDecal(x, z, sx, sz, rot, type, seed, t, r, g, b, a, additive)` draws on the ground or water. Types:
  - 0 goo splat; 1 soft disc; 2 scorch; 3 ring; 4 filling warning circle; 7 dirt mound;
  - 10 cone warning; 11 glowing arrow (pointing along `rot`: 0 is +z); 12 dark mass under water; 13 whirlpool;
    14 rift;
  - see `FS_DECAL` in 05-glsl.js for the rest.
- `pushImp(...)` draws goo impostors (gems, coins, chests, scroll type 30...).
- `FX.part`, `FX.glow`, `FX.smoke`, `FX.ring`, `FX.decal` are particles. `FX.part` types: 0 glow, 1 soft blob,
  2 smoke, 3 star, 4 ring, 5 heart, 6 snowflake.
- `R.ribStrip` draws ribbons and `addBolt` draws beams.
- Telegraphs: `addTele({ kind: 'circle'|'lane'|'cone', x, z, r, len, rot, dur, hold })`. `TELE_OWNER` marks a boss's
  own warnings, which drive weak points.

**State machine:** `G.state` is one of `loading`, `home`, `run`, `pause`, `levelup`, `chest`, `victory`, `dying`,
`revive`, `results`. A run is `G.run`: `startRun` on land, `startSea` at sea; both end with `applyResume` when a
checkpoint is being loaded. A chapter's timeline is `run.events`, fired by `runEvent` or `seaEvent`. Each frame runs
`updateRun` (or `updateOcean`, or `updateCave`) and then draws with `emitRunScene` (or `emitSea`, or `emitCave`).
**UI:** the `UI` object in 14-ui.js shows and hides `<section>` screens from index.html. `UI.toast` and `UI.banner`
show messages.

**Pitfalls seen before:**
- Game globals are `const`. In tests use `G`, never `window.G` (that is `undefined`), and `typeof G !== 'undefined'`
  across reloads.
- After `__manual()` in a test, pump the loop with `if (!__rafQ.length) requestAnimationFrame(loop)` before
  `__frames(n)`, or nothing runs.
- Rebuilding `dist/` while a browser test is running changes what that test's reloads load.
- Never run two browser tests at once: under CPU contention, mesh waits time out.
- Audio scheduling uses the audio clock, which barely moves while a test fast-forwards frames. Check
  `MUSIC.wantMood` and layer levels, not `MUSIC.mood`.

## 8. Testing

**`test/TOOLS.md` lists every tool with its command.** The two to reach for first: `node test/shoot.mjs` (go anywhere in
the game, run a snippet, take a screenshot) and `node test/sdf.mjs` (look inside a model with no browser).

- **Fast checks:** `node build.mjs && node test/syntax.mjs`, then `node test/meshtime.mjs <models>` if models
  changed.
- **The full regression:** `node test/game.mjs`, about 5-6 minutes, mostly waiting for every mesh. It reports mesh
  time, NaN meshes and page errors. Its other modes (play, bosses, powerups, evos, perf...) are listed in STATUS.md
  under "Build and test".
- **Feature scripts** are `test/_*.mjs` (all committed). The recent ones:
  - `_features.mjs` (`ONLY=face,settings,menus,land,rush,sea,city`): the newest features, with screenshots;
  - `_resume.mjs`: runs surviving reloads and lost graphics;
  - `_tele.mjs`: attack warnings;
  - `_evo.mjs`: the evolution hints and the slot bar;
  - `_isles.mjs` (`EACH=1`, `CH=20`): island close-ups;
  - `_dps.mjs` and `_seadps.mjs`: damage comparisons for balancing.
- **Tools:** Playwright from `/opt/node22/lib/node_modules/playwright`, headless Chromium with SwiftShader
  (`--use-angle=swiftshader`). The harness is `test/harness.js`: `__manual`, `__frames(n, dt, render)`, and a bot.
  Screenshots go to `test/shots/` (git-ignored).
- **When to run what:**
  - After any change: the syntax check plus the closest feature test.
  - Before delivering a round: `game.mjs` plus the feature tests for what changed.
  - For visual work: screenshots, inspected.

## 9. Where things stand (at the hand-off)

**Most recent round** (see the "(latest)" section of STATUS.md):
- runs that survive sleep and reload; save export and import;
- the Codex; Boss Rush medals and the Rush Crown; boss weak points; the goo medic; burrower warnings;
- the blob's face; music; goo trails; the Medium preset and FPS counter;
- sea weather fronts, treasure maps, the whale, the drowned city's streets.

**Not verified, or estimated:**
- The music has never been listened to. Check the tunes, mix and volume by ear.
- The Boss Rush medal times are estimates from each boss's health curve, not from play.
- The goo medic, the weather fronts and the treasure reward are tuned by reasoning and short tests only, not by
  long play.
- Real-phone performance has never been measured (and phones are out of scope for now).

**Backlog** of ideas the owner has seen but not asked for (from a brainstorm; build them only when asked):
- **Runs:** banish and lock on level-up cards; duo bonuses for skill pairs; chapter modifiers; heat tiers per
  chapter; mid-chapter events; shrines; champion affixes for elites; ultimate forms of evolved skills; playable blob
  species.
- **Progression:** a run summary with damage per skill; a daily seeded run; weapon mastery; hosting on GitHub Pages
  for a stable address.
- **Sea:** a harbour stop mid-ocean; capturable forts; castaways to rescue; a drift turn and a ram meter.
- **Bosses:** a phase change at 50% health (an "ENRAGED" stage already exists for some); Boss Rush is already done.
- **Feel:** hit-stop; a combo counter; damage-number options; better pickup feel.
- **UI:** a build overview in pause; HUD slot tooltips; full gamepad support (a basic stick read exists); colour-blind
  and reduced-motion options; a coin reroll; first-time tips.
- **Content:** pets; victory poses; seasonal events; photo mode.
- **Tech:** the IndexedDB mesh cache (the top pick); a benchmark mode; smarter build order.
