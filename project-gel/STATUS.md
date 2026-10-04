# Project Gel — status

A Blob Hero–style survivor game built as one self-contained HTML file (raw WebGL2, no engine).
Play it by opening `dist/project-gel.html` in a recent Chrome, Edge, Firefox or Safari.

Also in this folder: `project-gel-blueprint.html` (the design blueprint) and `last-ember.html` (the earlier prototype).

## Done
- **Rendering:**
  - The hero is a raymarched blob with spring physics. Arms stretch to punch, and skills grow and pinch off goo buds.
  - Enemies are single meshes generated from SDF models, with baked AO and GPU-skinned animation.
  - Six arena floors.
  - Goo pickups and projectiles, decals, particles and ribbons.
  - HDR bloom and tonemapping.
- **Gameplay:**
  - Keyboard, touch-stick and gamepad movement.
  - 13 skills, 10 passives, 7 enemy types plus elites, and 5 bosses. Every 5th chapter is a double boss.
  - Endless chapters across 6 arenas.
  - Level-up cards with rerolls, chests, one free revive, and the victory and results screens.
- **Meta:**
  - Coins and 5 permanent upgrades.
  - 6 skins, a chapter map, offline earnings and settings.
  - Saves to localStorage.
- **Verified in headless Chromium:**
  - Boot and every menu, at desktop and phone sizes.
  - All 13 skills at max level, and all 5 boss fights.
  - Chest roulette, melt and revive, victory and results screens.
  - Upgrade and skin purchases, chapter unlocks, offline earnings, and the Low quality preset.
  - Keyboard, arrow keys, drag joystick, Esc pause, and number keys on level-up.
  - No script errors, and nothing sent to the GPU contains NaN.
- **Fixed during testing:**
  - A NaN enemy tint that blew out the bloom into white blocks.
  - An endless Conductor fight: the boss now follows the hero.
  - The chest roulette landing between tiles.
  - Bosses spawning off-screen: they now drop in on screen.
  - Hit flash stuck solid white on bosses.
  - Olive Aura tint, now a cyan rim glow.
  - Elite brutes appearing in chapter 1.

## Balance (bot results; the bot is a mediocre player)

| Chapter | Upgrades | Bot wins |
|---|---|---|
| 1 | none | 4/4 (earlier 8/8) |
| 2 | none | 3/4 |
| 3 | none | 3/4 |
| 3 | level 6 | 3/4 |
| 5 | none | 1/4 |
| 5 | level 3 | 3/4 |
| 5 | level 6 | 3/4 |

- Chapter 5 is the first double-boss chapter and is meant to need some upgrades.
- Chapter scaling is in `chapterInfo()` in `src/10-data.js`:
  - `hpMul = 1 + 0.12k + 0.004k²`
  - `dmgMul = 1 + 0.08k`
  - `rateMul = min(1.8, 1 + 0.035k)`
- The chapter's extra HP and spawn rate ease in over the first 90 s (HP) and 120 s (spawn rate). See `spawnEnemy` and `updateRun` in `src/11-game.js`.
- Ch1 runs reach level 21–23 with about 2,000 kills and 50–110 enemies on screen at peak. One win pays about 280–320 coins.

## Resolved: slow boss meshes
- Boss meshes used to arrive 48–54 s after load. The cause was each boss portrait being rendered with a GPU readback the moment its mesh arrived, which blocked the main thread.
- Portraits are now drawn only when the chapter map opens. All 17 meshes are ready about 1.7 s after the home screen appears (measured in headless Chromium).

## Next steps
1. Optional: balance chapter 10 with upgrades.
2. Final visual pass:
   - The hero close up.
   - Each arena in a real run.
   - The loading screen.
3. Deliver: send `dist/project-gel.html` and summarise. Real-phone performance is unmeasured: there's no LOD mesh, and the Auto preset scales resolution.

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
- Screenshots go to `test/shots/`, and logs to `test/*.log`; git ignores both. Combine screenshots with `node test/montage.mjs out.png <cols> a.png b.png ...`.
- **Harness notes (`test/harness.js`):**
  - It replaces `requestAnimationFrame` so `__frames(n, dt, render)` can step the real game loop.
    - After `__manual()`, Playwright's `waitForFunction` needs `{ polling: 100 }`, because rAF polling never fires.
  - Game globals are `const`s, so use `G`, not `window.G`.
  - To stop stray test processes, use `pkill -f "[n]ode test/game.mjs"`. The bracket keeps the pattern from matching the shell running the command.

## Known limits
- Performance on real phones hasn't been measured. There are Auto, High and Low quality presets, and Auto scales resolution.
- The UI font (Fredoka) loads from Google Fonts. Offline, it falls back to the system rounded font.
