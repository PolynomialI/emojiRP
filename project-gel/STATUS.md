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

## Chapter themes
Each chapter of a 10-chapter cycle gets its own map, boss and power-up; chapters 11+ repeat them with stronger stats.
Every 5th chapter adds one of the original bosses (Hurler, Charger, Twins, Conductor) as a second boss.

| Ch | Map | Boss | New power-up (offered from this chapter on) | State |
|---|---|---|---|---|
| 1 | Stone Plaza | Big Stomper | — | done |
| 2 | Desert Dunes (quicksand, tumbleweeds) | Sand Worm | Sandstorm (skill) | done |
| 3 | Neon City (blocks, a huge tower that fades when you're behind it) | Wrecking Bot | Neon Drone (skill) | done |
| 4 | Bounce House (ball pits with ball physics, bumpers) | Big Bounce | Bouncy Ball (skill) | done |
| 5 | Candy Land (chocolate puddles) | Jelly Queen + Hurler | Sugar Rush (ability) | done |
| 6 | Frozen Tundra (slippery ice, snowfall) | Frost Yeti | Frost Nova (skill) | done |
| 7 | Volcano (lava burns, erupting vents) | Magma Golem | Meteor (skill) | done |
| 8 | Jungle Swamp (swamp slows, fireflies) | Vine Hydra | Thorns (ability) | done |
| 9 | Pirate Beach (tide pools, shipwreck) | Captain Crab | Tidal Wave (skill) | done |
| 10 | Moon Base (energy pads speed you up) | UFO Overlord + Charger | Black Hole (skill) | done |

Boss mechanics in short:
- Sand Worm: burrows and breaches under you.
- Wrecking Bot: ball swings, rocket barrages and lane slams.
- Big Bounce: hops, pinball rolls and rubber balls.
- Jelly Queen: jelly spirals, slime summons and sticky flops.
- Frost Yeti: a breath sweep that chills, icicles that leave spikes, and a spike ring with gaps.
- Magma Golem: lava fissures and magma lobs; after its eruption it is cooled and takes extra damage.
- Vine Hydra: heads snap along lanes and spit seeds, and roots snare you.
- Captain Crab: claw snaps, a walking cannon line, homing bubbles and a sideways dash.
- UFO Overlord: a tractor beam, sweeping lasers and beamed-down invaders.

Every boss has a rage phase below half health.

Other additions:
- Tall scenery fades when it hides the hero.
- Frozen enemies (from Frost Nova or the yeti's breath) stand still and do no harm.

Where things live:
- Data: `ARENAS`, `PROP_KINDS`, `ZONE_KINDS`, `BOSS_TYPES`, `CHAPTER_BOSSES`, and `from:` on `SKILLS`/`PASSIVES` in `src/10-data.js`.
- Scenery and boss meshes: `src/04a-theme-models.js`.
- Arena building, obstacles and zones: `src/11a-arena.js`.
- Per-theme set pieces and moving parts (`ARENA_LAYOUTS`, `ARENA_FEATURES`): `src/11b-themes.js`.
- New power-ups: `src/12a-new-skills.js`.
- Boss AI and drawing (`BOSS_AI`, `BOSS_DRAW`), plus `tempZone`/`tempProp`: `src/13a-bosses.js`.
- Floor styles 0-9, the zone shader, and impostors 32-39: `src/05-glsl.js`.
- Telegraph kinds: `circle`, `lane`, and `cone` (decal type 10).

## Evolutions, Goo Dash, Golden Gooblin, Endless

**Evolutions** (`EVOLUTIONS` in `src/10-data.js`; logic in `src/11-game.js`):
- Each of the 12 abilities pairs with one skill. A skill at max level plus its partner evolves, through a chest, into a named form with boosted stats.
- Pairs:

  | Skill | Partner ability | Evolved form |
  |---|---|---|
  | Blob Ball | Projectile Count | Goo Gatling |
  | Fists | Power | Titan Fists |
  | Grenade | Reach | Cluster Bomb |
  | Missile | Haste | Missile Swarm |
  | Blade | Speed | Buzzsaw Halo |
  | Lightning | Magnet | Thunder God |
  | Aura | Thick Goo | Toxic Bog |
  | Frost Nova | Armor | Absolute Zero (frozen enemies take +50%) |
  | Meteor | Growth | Armageddon |
  | Tidal Wave | Regen | Tsunami (heals per hit) |
  | Bouncy Ball | Sugar Rush | Jawbreaker |
  | Goo Axe | Thorns | Bramble Axes |

- The first time an evolution becomes possible, a glowing golden chest drops near the hero. Any chest gives a ready evolution before a normal upgrade.
- Level-up cards name each pairing. Evolved HUD tiles get a gold frame, and Goo Gatling and Missile Swarm shots turn gold.
- `skillL(s)` returns a slot's current stats (its level row, or the evolved row).

**Goo Dash:**
- Triggered by Space, Shift, the gamepad A button, or the on-screen button at bottom right.
- Moves the blob about 4.2 m in 0.18 s, with 0.32 s of invulnerability and a goo trail.
- 3 s cooldown, shown as a wedge on the button. Tuned in `DASH` in `src/11-game.js`.
- The test bot dashes out of telegraphed attacks.

**Golden Gooblin** (`src/11c-events.js`):
- Most runs get one between 70 s and 230 s. It pops up nearby and flees.
- Each hit staggers it and drops a coin. Catching it bursts its sack into 16 coin piles, a chest and a scroll.
- It escapes after 18 s. A gold arrow at the screen edge points to it when it is off screen.

**Endless** (`src/11c-events.js`):
- Unlocks once chapter 3 is cleared: an ENDLESS button under PLAY, which shows your best time.
- Uses a random map from the chapters reached, and offers every power-up unlocked so far.
- Every 50 s enemies take on the next chapter's toughness ("danger" tiers). The spawn rate keeps climbing; swarms, elites and Gooblins repeat.
- A boss arrives every 2 minutes, cycling through all ten; every third visit adds a guest. A beaten boss drops a chest and the run continues.
- Results pay 1 coin per 3 s survived and record the best time.

**Fixes in this round:**
- Auto quality no longer blanks a frame when it changes resolution (the resize now happens at the start of the next frame).
- Blob Ball level 2 now does something.
- Neon Drone zaps chain to nearby enemies.
- New-boss health is flatter (3400-4200 base).

## Balance (bot results; the bot is a mediocre player who dodges poorly)

Measured after the 100x100 arena, emeralds and long legs:

| Chapter | Upgrades | Bot wins |
|---|---|---|
| 1 | none | 4/4 |
| 3 | level 3 | 1/8 (the build before these changes: 2/8 on the same test) |
| 5 | level 6 | 0/4 |

An A/B run of chapter 3 at upgrade level 3 shows no real change in difficulty from the bigger map: average survival was 318 s now against 304 s before. Small samples swing a lot; the earlier 2/4 results were partly luck.

After the ten chapter themes (new bosses with base health 3400-4200; chapter scaling multiplies boss health by 1.17 per chapter):

| Chapter | Upgrades | Bot wins | Notes |
|---|---|---|---|
| 1 | none | 2/2 | Big Stomper down in about 50 s, no deaths |
| 2 | level 3 | 1/2 | the Sand Worm fight took about 85 s (at base health 3900; now 3400) |
| 6 | level 6 | 1/2, then 0/3 | most losses come before the boss; at base health 6100 one Yeti fight took 213 s, so health was lowered |

With Goo Dash, evolutions and the flatter boss health:

| Chapter | Upgrades | Bot wins | Notes |
|---|---|---|---|
| 1 | none | 2/2 | no deaths |
| 6 | level 6 | 1/2 | the win beat the Frost Yeti in about 67 s with no deaths; the loss died at level 10 before the boss |

Simulation cost per frame, without rendering, with 150 enemies (test machine):

| Chapter | Average | 90th percentile | Notes |
|---|---|---|---|
| 1 | 1.7 ms | 4.2 ms | |
| 4 | 2.0 ms | 4.8 ms | down from 3.0 / 9 ms; distant ball-pit balls now sleep |
| 10 | 1.5 ms | 4.2 ms | |

The JS heap stays around 35 MB.

Boss fight length is the main thing to tune after real play: lower `hp` in `BOSS_TYPES` to shorten a fight.

Runs reach about level 33-36. Chapter scaling lives in `chapterInfo()` in `src/10-data.js`, and the spawn curve in `RATE_KEYS` in `src/11-game.js`.

## Next steps (optional)
1. Balance chapter 10 and later.
2. Measure performance on a real phone, which can't be done here.
3. A lower-detail stickman mesh if big crowds struggle on phones.
4. Show equipped artifacts on the 3D hero. Today they only change stats.
5. Tune the scroll drop rate after real play (now elites and bosses always, tougher enemies 2%).

## Build and test
- **Build:**
  - `node build.mjs` writes `dist/project-gel.html`, the single playable file. It also injects `00-util.js`, `03-sdfmesh.js`, `04-models.js` and `04a-theme-models.js` as the mesh worker source.
  - `node build.mjs visual` writes `test/visual.html`, an engine-only test scene. Screenshot it with `node test/visual.mjs [scene|close|punch|bosses|items|arenas]`.
- **Game tests:** `node test/game.mjs <mode> ...` (Playwright from `/opt/node22/lib/node_modules/playwright`, headless Chromium with SwiftShader).
  - `boot [--phone]`: the home screen and each menu.
  - `play <chapter> [--runs=N] [--shots]`: bot playthroughs with a win rate and damage sources.
    - `META=<level>` sets the permanent upgrades.
    - `NOREVIVE=1` skips the revive.
    - `MAP=<size>` sets the arena width for the runs (default 100).
  - `skills [--group=a,b] [--phone]`: every skill at max level against a crowd.
  - `bosses` (`ONLY=6` limits it): each chapter's boss fight, chapters 1-10.
  - `powerups` (`IDS=frostnova,meteor`, `FRAMES=150`): each chapter power-up at max level in its own chapter, with a crowd.
  - `evos` (`IDS=ball,fists,...`, `FRAMES=240`): for each skill, maxes it and its partner, opens the golden chest, and watches the evolved form against a crowd.
  - `perf` accepts `CH=<chapter>` to measure the run on that chapter's map.
- **Standalone checks** (`node test/<name>.mjs`):
  - `check-dash.mjs`: distance, invulnerability, cooldown and the button.
  - `check-gooblin.mjs`: appears, flees, edge arrow, loot when caught, escape.
  - `check-endless.mjs`: the unlock, tiers, a boss that doesn't end the run, results and best time.
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
  - `arenas` (`ONLY=5` limits it to one chapter): each chapter's map mid-run, plus a wide view from high up.
- Screenshots go to `test/shots/`, and logs to `test/*.log`; git ignores both. Combine screenshots with `node test/montage.mjs out.png <cols> a.png b.png ...`.
- **Harness notes (`test/harness.js`):**
  - It replaces `requestAnimationFrame` so `__frames(n, dt, render)` can step the real game loop.
    - After `__manual()`, Playwright's `waitForFunction` needs `{ polling: 100 }`, because rAF polling never fires.
  - Game globals are `const`s, so use `G`, not `window.G`.
  - To stop stray test processes, use `pkill -f "[n]ode test/game.mjs"`. The bracket keeps the pattern from matching the shell running the command.

## Known limits
- Performance on real phones hasn't been measured. There are Auto, High and Low quality presets, and Auto scales resolution.
- The UI font (Fredoka) loads from Google Fonts. Offline, it falls back to the system rounded font.
