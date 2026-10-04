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
- **Testing:**
  - Headless boot and menu screenshots.
  - Bot playthroughs.
  - A detector for NaN values sent to the GPU.

## In progress
- **Balance:** bot results with no upgrades:

  | Chapter | Bot wins |
  |---|---|
  | 1 | 8/8 |
  | 2 | 3/4 |
  | 3 | 1/4 |

  Later chapters' extra enemy HP and spawn rate now ease in over the first 1.5–2 minutes. Chapters 3 and 5 are being re-tested with and without upgrades.
- **Visual review:** every skill at max level, and every boss attack. This follows a fix for a NaN bug that blew out the bloom.

## Next steps
1. Review the skills and bosses screenshots and fix any visual problems.
2. Check the in-run HUD at phone size.
3. Performance with big crowds: possibly add a lower-detail stickman mesh, and check the quality presets.
4. Polish, then deliver the final HTML.

## Build and test
- **Build:**
  - `node build.mjs` writes `dist/project-gel.html`, the single playable file.
  - `node build.mjs visual` writes `test/visual.html`, an engine-only test scene. Screenshot it with `node test/visual.mjs [scene|close|punch|bosses|items|arenas]`.
- **Game tests:**
  - `node test/game.mjs boot [--phone]`: screenshots of the home screen and menus.
  - `node test/game.mjs play <chapter> [--runs=N] [--shots]`: bot playthroughs.
    - `META=<level>` sets the permanent upgrades.
    - `NOREVIVE=1` skips the revive.
  - `node test/game.mjs skills` and `node test/game.mjs bosses`: screenshots of each skill and boss.
- Screenshots go to `test/shots/`, which git ignores.
- The tests use Playwright from `/opt/node22/lib/node_modules/playwright` with headless Chromium (SwiftShader).

## Known limits
- Performance on real phones hasn't been measured. There are Auto, High and Low quality presets, and Auto scales resolution.
- The UI font (Fredoka) loads from Google Fonts. Offline, it falls back to the system rounded font.
