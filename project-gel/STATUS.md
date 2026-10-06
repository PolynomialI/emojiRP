# Project Gel — status

A Blob Hero–style survivor game built as one self-contained HTML file (raw WebGL2, no engine).
Play it by opening `dist/project-gel.html` in a recent Chrome, Edge, Firefox or Safari.

Also in this folder: `project-gel-blueprint.html` (the design blueprint) and `last-ember.html` (the earlier prototype).

## Done
- **Rendering:**
  - The hero is a raymarched jelly blob with spring physics: soft translucency, a bright candy rim, arms that stretch to punch, and goo buds for skills.
  - Enemies and bosses are SDF meshes with baked AO and GPU-skinned animation.
  - Boulders are meshes too; pools are animated liquids.
  - HDR bloom.
- **Arena:** a walled, rounded-square map, 40x40.
  - Boulders and pools block movement, and enemies steer around them.
  - Floors are calm, low-contrast bricks in each of the six arena palettes.
- **Skills:**
  - 13 skills with 10 levels each. Passives also have 10 levels, except Multishot (2).
  - Nerfed heavily since the first build.
  - The Grenade is a fused bomb dropped at your feet: about 2-4 kills per blast early on.
  - Effects are bigger and chunkier.
- **Enemies:** 12 types, all a bit shorter than the hero:
  - stickman, sprinter and helmet
  - spearman (lunges) and axeman (chops)
  - brute with a club, archer, javelin thrower (arcing throws)
  - splitter, shield, bomber (explodes) and knight
  - Types unlock by chapter and time, with no announcements (only the boss warning remains). Elites wear crowns.
- **Bosses:** one at the end of every chapter, two every 5th chapter. All are cartoon characters with faces:
  - pink ogre (Big Stomper)
  - purple cyclops (Hurler)
  - red bull (Charger)
  - pink and violet imps (Twins)
  - pink devil (Conductor)
  - They drop in on screen. Off-screen bosses get an edge arrow showing their face.
- **Customization:** a "Choose your blob" screen with 12 body colors (3 gradients) and 9 costumes, bought with coins and saved.
- **HUD and menus:** follow the reference screenshots:
  - pause button, skill tiles, coins
  - a CHAPTER bar that becomes the boss bar
  - an XP bar with a LEVEL badge
  - a bright blue and white bubbly menu style
- **Meta:**
  - Coins and 5 upgrades.
  - Chapter map, offline earnings, settings and saving.
- **Verified in headless Chromium:** every test mode below runs with no script errors and nothing invalid sent to the GPU.

## Balance (bot results; the bot is a mediocre player who dodges poorly)

| Chapter | Upgrades | Bot wins |
|---|---|---|
| 1 | none | 3/4 to 4/4 |
| 3 | none | 0/4 |
| 3 | level 3 | 2/4 |
| 5 | level 3 | 1/4 |
| 5 | level 6 | 2/4 |

Runs reach about level 33-36. Chapter scaling lives in `chapterInfo()` in `src/10-data.js`, and the spawn curve in `RATE_KEYS` in `src/11-game.js`.

## Next steps (optional)
1. Balance chapter 10 and later.
2. Measure performance on a real phone, which can't be done here.
3. A lower-detail stickman mesh if big crowds struggle on phones.

## Build and test
- **Build:**
  - `node build.mjs` writes `dist/project-gel.html`, the single playable file. It also injects `00-util.js`, `03-sdfmesh.js` and `04-models.js` as the mesh worker source.
  - `node build.mjs visual` writes `test/visual.html`, an engine-only test scene. Screenshot it with `node test/visual.mjs [scene|close|punch|bosses|items|arenas]`.
- **Game tests:** `node test/game.mjs <mode> ...` (Playwright from `/opt/node22/lib/node_modules/playwright`, headless Chromium with SwiftShader).
  - `boot [--phone]`: the home screen and each menu.
  - `play <chapter> [--runs=N] [--shots]`: bot playthroughs with a win rate and damage sources.
    - `META=<level>` sets the permanent upgrades.
    - `NOREVIVE=1` skips the revive.
  - `skills [--group=a,b] [--phone]`: every skill at max level against a crowd.
  - `bosses`: each boss fight.
  - `flows`: chest, melt, revive, victory, results, purchases, offline earnings and the Low preset.
  - `input`: keyboard, drag joystick, Esc and number keys.
  - `roster`: every enemy type in a row, plain and elite.
  - `blob`: the Choose your blob screen, including a purchase.
  - `play` also accepts `PREFER=<skill>`: the bot favors that skill and logs kills per blast.
  - `arenas` (`ONLY=21` limits it to one chapter): the first chapter of each arena, mid-run.
- Screenshots go to `test/shots/`, and logs to `test/*.log`; git ignores both. Combine screenshots with `node test/montage.mjs out.png <cols> a.png b.png ...`.
- **Harness notes (`test/harness.js`):**
  - It replaces `requestAnimationFrame` so `__frames(n, dt, render)` can step the real game loop.
    - After `__manual()`, Playwright's `waitForFunction` needs `{ polling: 100 }`, because rAF polling never fires.
  - Game globals are `const`s, so use `G`, not `window.G`.
  - To stop stray test processes, use `pkill -f "[n]ode test/game.mjs"`. The bracket keeps the pattern from matching the shell running the command.

## Known limits
- Performance on real phones hasn't been measured. There are Auto, High and Low quality presets, and Auto scales resolution.
- The UI font (Fredoka) loads from Google Fonts. Offline, it falls back to the system rounded font.
