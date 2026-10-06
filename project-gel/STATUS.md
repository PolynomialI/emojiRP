# Project Gel — status

A Blob Hero–style survivor game built as one self-contained HTML file (raw WebGL2, no engine).
Play it by opening `dist/project-gel.html` in a recent Chrome, Edge, Firefox or Safari.

Also in this folder: `project-gel-blueprint.html` (the design blueprint) and `last-ember.html` (the earlier prototype).

## Done
- **Rendering:**
  - The hero is a raymarched jelly blob with spring physics: soft translucency, a bright candy rim, arms that stretch to punch, and goo buds for skills.
  - The hero has long two-segment legs (the knee is placed by simple IK) and takes long strides: one gait cycle covers 1.8 units, about 5 steps a second at top speed.
  - Enemies and bosses are SDF meshes with baked AO and GPU-skinned animation.
  - Boulders are meshes too; pools are animated liquids.
  - HDR bloom.
- **Arena:** a walled, rounded-square map, 100x100 (the dev console's `map` command resizes it).
  - Boulders and pools block movement, and enemies steer around them. Obstacle counts scale with the floor area, and obstacle lookups use a coarse grid.
  - Floors are calm, low-contrast bricks in each of the six arena palettes.
- **Skills:**
  - 13 skills with 10 levels each. Passives ("blob abilities") also have 10 levels, except Projectile Count (2).
  - A run holds at most 4 different skills and 4 different passives, shown as two groups of boxes in the HUD. Once a group is full, level-ups only offer upgrades for it.
  - Projectile Count (formerly Multishot) adds projectiles to Blob Ball, Blob Missile and Goo Axe only. Haste is 4% per level.
  - The Blob Mine is a little goo blob with eyes and a blinking fuse sprout, and hits harder (18-46 damage, 1.7-2.6 m blast). Grenades and the magnet no longer draw radius circles.
  - Treasure chests from elites give exactly one upgrade.
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
- **Drops:**
  - Killed enemies no longer leave splats, so gems stay visible.
  - Basic enemies (stickman, sprinter, mini) drop a small blue crystal.
  - Tougher enemies (tier 2 and up) have a 10% chance of a big square green emerald instead, worth 3x their XP + 2. Elites and bosses always drop emeralds.
  - Scrolls: every elite and every boss drops one, and tougher enemies drop one 2% of the time. A full chapter 1 run gave 6 in each of three bot runs. The magnet pulls scrolls in like coins, and they are kept even when a run is lost.
  - Health hearts are drawn much larger.
- **Customization:** a "Choose your blob" screen with 12 body colors (3 gradients) and 9 costumes, bought with coins and saved.
  - Every color and costume except Classic and No costume gives a small bonus, shown on its card (for example +4% damage, +6% max health, +25% pickup radius).
- **Gear (inventory tab):** laid out after the reference screenshot.
  - An INVENTORY ribbon, the hero between four slots (weapon, armor, ring, necklace), attack and health totals, then BY RARITY/BY SLOT, CHEST and FUSE, and a 5-column grid of rarity-colored cards with a slot badge and the number owned.
  - 12 artifacts in 5 rarities: gray common, green uncommon, blue rare, purple epic, gold legendary. Rarity multiplies the stats by 1, 1.6, 2.4, 3.5 and 5.
    - Weapons: Goo Sword (damage and health), Star Wand (more damage than the skull), Twig Bow (damage and faster skills).
    - Armor: Hero Cloak (most health), Steel Plate (less damage taken), Leather Vest (health and speed).
    - Rings: Gold Ring (health, less than the cloak), Silver Ring (XP), Ruby Ring (regen).
    - Necklaces: Skull Necklace (damage), Moon Pendant (faster skills), Clover Charm (coins).
  - CHEST spends a scroll on a treasure chest that reveals one artifact (odds 62/25/9.5/3/0.5%).
  - FUSE opens three slots: tap three of the same artifact and rarity from the inventory below (other items dim), then Fuse turns them into one of the next rarity. An item's card has a Fuse button that opens it with that item filled in. An equipped item that gets fused is replaced by the result.
  - All bonuses (color, costume, artifacts) are fixed at the start of each run.
- **Performance safeguards:**
  - The loop is paced to about 60 frames a second on any screen; 120-240 Hz screens used to get 2-4x the GPU work.
  - Auto quality never raises the resolution above where it starts. When frames are slow, it lowers the resolution down to 0.6, then turns MSAA off, then bloom.
  - If the browser draws WebGL without the graphics card (SwiftShader, llvmpipe and the like), Auto uses the lightest settings and a message names the renderer the browser reported. This can happen with the browser's acceleration setting on, when the browser has blocked the graphics driver or turned the GPU off after graphics crashes.
  - Graphics: Ultra low renders at 0.4x, with no MSAA or bloom, fewer particles, and 30 frames a second.
  - The dev console's `perf` command shows the graphics card, frame rate, render size and quality settings.
- **Dev console:** typing `specimen` anywhere unlocks it (saved) and opens it; after that the backtick key opens and closes it. The run freezes while it is open. Type `help` for the commands.
- **HUD and menus:** follow the reference screenshots:
  - pause button, skill tiles, coins
  - a CHAPTER bar that becomes the boss bar
  - a faded hot-red XP bar with a LEVEL badge
  - a bright blue and white bubbly menu style
- **Meta:**
  - Coins and 5 upgrades.
  - Chapter map, offline earnings, settings and saving.
- **Verified in headless Chromium:** every test mode below runs with no script errors and nothing invalid sent to the GPU.

## Balance (bot results; the bot is a mediocre player who dodges poorly)

Measured after the 100x100 arena, emeralds and long legs:

| Chapter | Upgrades | Bot wins |
|---|---|---|
| 1 | none | 4/4 |
| 3 | level 3 | 1/8 (the build before these changes: 2/8 on the same test) |
| 5 | level 6 | 0/4 |

An A/B run of chapter 3 at upgrade level 3 shows no real change in difficulty from the bigger map: average survival was 318 s now against 304 s before. Small samples swing a lot; the earlier 2/4 results were partly luck.

Runs reach about level 33-36. Chapter scaling lives in `chapterInfo()` in `src/10-data.js`, and the spawn curve in `RATE_KEYS` in `src/11-game.js`.

## Next steps (optional)
1. Balance chapter 10 and later.
2. Measure performance on a real phone, which can't be done here.
3. A lower-detail stickman mesh if big crowds struggle on phones.
4. Show equipped artifacts on the 3D hero. Today they only change stats.
5. Tune the scroll drop rate after real play (now elites and bosses always, tougher enemies 2%).

## Build and test
- **Build:**
  - `node build.mjs` writes `dist/project-gel.html`, the single playable file. It also injects `00-util.js`, `03-sdfmesh.js` and `04-models.js` as the mesh worker source.
  - `node build.mjs visual` writes `test/visual.html`, an engine-only test scene. Screenshot it with `node test/visual.mjs [scene|close|punch|bosses|items|arenas]`.
- **Game tests:** `node test/game.mjs <mode> ...` (Playwright from `/opt/node22/lib/node_modules/playwright`, headless Chromium with SwiftShader).
  - `boot [--phone]`: the home screen and each menu.
  - `play <chapter> [--runs=N] [--shots]`: bot playthroughs with a win rate and damage sources.
    - `META=<level>` sets the permanent upgrades.
    - `NOREVIVE=1` skips the revive.
    - `MAP=<size>` sets the arena width for the runs (default 100).
  - `skills [--group=a,b] [--phone]`: every skill at max level against a crowd.
  - `bosses`: each boss fight.
  - `flows`: chest, melt, revive, victory, results, purchases, offline earnings and the Low preset.
  - `input`: keyboard, drag joystick, Esc and number keys.
  - `roster`: every enemy type in a row, plain and elite.
  - `blob`: the Choose your blob screen, including a purchase.
  - `gear`: the inventory, a scroll chest, the three-slot fuse screen and equipping, then checks the run picks up the bonuses.
  - `dev`: unlocks the dev console by typing, toggles it with backtick and runs commands at home and in a run.
  - `drops`: crystals, emeralds, a scroll, the other pickups, two blob mines and a grenade up close.
  - `gait`: the hero running in place on the home screen, one stride as a contact sheet.
  - `perf`: frame cost with the GPU work included, on the menus and in a crowded run, with the hero, bloom, MSAA and gems switched off one at a time. The test GPU is software, so compare builds with it rather than reading the numbers as real-GPU timings.
  - `SOFTGL=1` before any mode makes the game treat the test browser as a machine without a GPU; normally the tests skip that check.
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
