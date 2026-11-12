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
20 chapters, none repeated: each has its own map, obstacles, boss, unique enemy, miniboss and power-up. The game ends
after chapter 20 (`CHAPTER_COUNT` = `ARENAS.length`).

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
| 10 | Wild West Town: the map is the town, a 14-wide Main Street walled by two unbroken rows of joined false-front buildings, opening at its north end onto a town square (chapel, bank, bandstand, well) and closed by a rail fence at the south end; oil slicks you slide on; rattlesnakes, wild horses, gunslingers, pack mules, charging bison; Thunder Bison miniboss | The Outlaw | Black Hole (skill) | done |
| 11 | Haunted Graveyard (mist slows, jack-o'-lanterns, will-o'-wisps) | Pumpkin King | Spirit Wisps (skill) | done |
| 12 | Crystal Caverns (glowing crystal veins, crystal pools) | Geode Titan | Prism Beam (skill) | done |
| 13 | Sky Islands (cloud floor, rainbows, updrafts speed you up) | Storm King | Gale Crescents (skill) | done |
| 14 | Toy Workshop (play rugs, toy slime slows, wind-up cars) | Jack-in-the-Box | Yo-Yo (skill) | done |
| 15 | Coral Reef (caustic light, kelp beds slow, ink puddles) | Kraken + Twins | Bubble Trap (skill) | done |
| 16 | Clockwork Factory (turntables carry you round, oil, gear stacks, presses) | Clockwork Colossus | Clockwork Turret (skill) | done |
| 17 | Mushroom Forest (spore zones, toadstools, logs) | Mycelium Monarch | Spore Cloud (skill) | done |
| 18 | Dino Valley (tar pits, cycads, ribcages, nests) | Goo T-Rex | Ptero Strike (skill) | done |
| 19 | Giant Kitchen (burners, grease, pots, cheese) | Chef Cleaver | Rolling Pin (skill) | done |
| 20 | The Crater (rough rock, craters you can't enter, ground-colored boulders, mine carts, ore, the cave mouth at the top) → the cave | The Bagger (inside the cave) | Fissure (skill) | done |

Boss mechanics in short:
- Sand Worm: burrows and breaches under you.
- Wrecking Bot: ball swings, rocket barrages and lane slams.
- Big Bounce: hops, pinball rolls and rubber balls.
- Jelly Queen: jelly spirals, slime summons and sticky flops.
- Frost Yeti: a breath sweep that chills, icicles that leave spikes, and a spike ring with gaps.
- Magma Golem: lava fissures and magma lobs; after its eruption it is cooled and takes extra damage.
- Vine Hydra: heads snap along lanes and spit seeds, and roots snare you.
- Captain Crab: claw snaps, a walking cannon line, homing bubbles and a sideways dash.
- The Outlaw: keeps his distance and circles; fans the hammer (a marked cone of bullets, 2-3 volleys), lobs dynamite on marked circles, and whistles up a bison stampede along marked lanes with gaps to stand in. Buildings, hay and wagons stop his bullets.
- Pumpkin King: jack-o'-lantern bombs, rings of red ghosts with a gap, and fading into the mist to pounce on a marked spot.
- Geode Titan: fans of crystal shards, lines of crystal spikes that stay as walls, and sweeping prism lasers.
- Storm King: lightning on marked circles in waves, a wind gust along a lane that shoves you, and twisters that chase you. It floats, and its face stays turned to the camera.
- Jack-in-the-Box: hops after you, punches its head out on the spring along a lane, pounces on a marked circle, and flings toy blocks that land as walls.
- Kraken: tentacle slams along lanes, ink blobs that leave slowing puddles, and a whirlpool that drags you toward its core.
- Colossus, Monarch, T-Rex and Chef: see their files (`src/13e`-`13h`).
- The Bagger: see "The cave" below.

Every boss has a rage phase below half health.

Other additions:
- Tall scenery fades when it hides the hero.
- Frozen enemies (from Frost Nova or the yeti's breath) stand still and do no harm. Enemies caught by Bubble Trap (`e.bubbled`) do the same, without the icy tint.

Where things live:
- Data: `ARENAS`, `PROP_KINDS`, `ZONE_KINDS`, `BOSS_TYPES`, `CHAPTER_BOSSES`, and `from:` on `SKILLS`/`PASSIVES` in `src/10-data.js`.
- Scenery and boss meshes: `src/04a-theme-models.js` (chapters 1-10) and `src/04b-theme-models2.js` (11-15). Both are also fed to the mesh worker by `build.mjs`.
- Arena building, obstacles and zones: `src/11a-arena.js`.
- Per-theme set pieces and moving parts (`ARENA_LAYOUTS`, `ARENA_FEATURES`): `src/11b-themes.js` (1-10) and `src/11d-themes2.js` (11-15).
- Chapter power-ups: `src/12a-new-skills.js` (2-10) and `src/12b-skills2.js` (11-15).
- Boss AI and drawing (`BOSS_AI`, `BOSS_DRAW`), plus `tempZone`/`tempProp`: `src/13a-bosses.js` (2-10) and `src/13b-bosses2.js` (11-15). New enemy shot kinds draw through `SHOT_DRAW[kind]`; lobbed shots set `lob: true` and an optional `onLand(s)`.
- Floor styles 0-14, the zone shader, and impostors 32-47: `src/05-glsl.js`. Impostors 43-47 are the wisp (red with P1.x for enemy ghosts), prism, wind crescent, yo-yo and bubble cluster; type 27 with P1.x is a black ink blob and type 32 with P1.x a white twister.
- Telegraph kinds: `circle`, `lane`, and `cone` (decal type 10).

## The cave (chapter 20)

**Outside** (`src/11f-crater.js`): the crater is a long bowl (56 x 80, `ARENAS` crater `boxes`). Floor style 19 is
rough broken rock; craters are blocking zones drawn by the zone shader's style 5 (a bowl with a lip). Boulders are
faceted `crag` meshes tinted the ground's color. The mole miner (`burrow` in `ENEMY_TYPES`, `burrowAI` in
`src/11-game.js`) tunnels unseen as a moving mound and bursts up to lunge; the Mole Foreman is the miniboss. Fissure
(`SKILL_HOOKS.fissure`, `src/12c-skills3.js`) sends cracks at enemies that burst into rock spikes; it evolves with
Reach into Great Rift. There is no boss on the crater floor: at 85% of the bar (`CRATER.open`, 255 s) the rubble in
the mouth bursts out, the bar stops at 85% and reads ENTER THE CAVE, and glowing floor arrows lead in. The camera
may look further past the top edge here (`topPad`) so the mountainside and mouth are on screen.

**Inside** (`src/13i-cave.js`): walking into the mouth (`caveEnter`) clears the crater, swings the camera down
behind the hero with the red vignette pulsing, and fades into the cave. The arena game stops (`updateRun` hands over
to `updateCave`; `updateCamera`, `renderFrame` and the overlay hand over too). The cave is a chain of pieces
(tunnel, room, bend, fork, boss hall), each with its own frame; room play happens in room-local coordinates.
- Rooms: A/D or the arrows slide along a rail behind low rock walls. The blob crouches (`hero.crouch`) unless it
  has clicked in the last 0.55 s; each click pops it up and fires one goo shot at what the mouse crosshair ray hits
  (0.26 s cooldown). Rocks have health and crumble. Crossbowmen pop up (or lean out) from behind their rocks with a
  red aim line that locks before the shot; armored spearmen work forward rock by rock throwing spears onto marked
  circles, then stab; shieldmen walk in behind tower shields (head shots and shots while they bash get through);
  moles burst from the walls and rush in. Head shots do double. Waves come in as each one thins out.
- Torch light: up to 8 point lights (`uTorch`/`uTorchCol` in `GLSL_FRAME`, added in `atmos`); floor style 20 is
  wet cave stone. The pieces near the hero are drawn; the camera eases between positions (`cvSetCam`).
- The fork is seen in first person: the view pans left then right, an arrow glows on the floor down each way, and
  there is no text. Left: four more rooms (each cleared one adds 12% shot damage), and the Bagger then pays 60% of
  the chapter reward extra plus a scroll. Right: two rooms. Every room cleared heals 20% and pays coins.
- Dying starts the cave over from the mouth (the fork is chosen again).

**The Bagger** (`src/13j-bagger.js`, meshes in `src/04j-bagger-models.js`): a goo-and-steel bucket-wheel excavator
drawn from six meshes (crawlers, the goo house, two lattice masts, the counterweight boom, the boom with a pitch
clip, the spinning wheel with a spin clip), with live cables, hydraulic rams, beacons, smoke and a glowing goo heart.
It stands three-quarters on so its face and heart are clear of the wheel. Entering, the four arrow keys show for
1.5 s with left and right lit. Attacks: goo spit at head height (duck), a rock barrage onto marked circles (move), a
beam from the heart that sweeps the rail at knee height (get behind a rock), a drill-rock that shatters the rock you
hide behind (rockfalls rebuild it), and its horn calls minions from the side alcoves. Stage 2 at half health. Its
heart takes 2.5x damage, the body 1x, the steel very little. Boss Rush leaves it out (`RUSH_BOSSES`).

**Save migration** (`loadGame`, `content: 2`): saves from before chapters 16-20 were remade, if past chapter 15,
go back to chapter 15 with 15 to beat again; coins, cosmetics, gear, upgrades and scrolls are kept.

**Mesher** (`src/03-sdfmesh.js`): a coarse pass skips empty space, and models with many parts sample only the parts
near each point (`binnedSdf`); the meshes come out the same, about twice as fast. `crag` is a faceted rock shape.

**Tests:** `test/_cave.mjs` plays chapter 20 end to end (BR=L or R) with screenshots; `test/_save.mjs` checks the
migration (both git-ignored scratch).

## The Ocean Update (in progress)

A second game mode on the home screen's second page. Done so far:
- **Home:** "The Ocean Update" sits under the title on both pages. A sideways swipe turns the page (anywhere but the
  buttons; on the blob's stage only a long, quick swipe, since a drag there spins the blob). Once chapter 20 is
  beaten, page dots and an edge arrow show too, with a note the first time. The ocean page keeps the menu buttons;
  Play becomes SAIL, the picker lists the ocean's chapters (`save.sea`), and the stage shows the blob lounging on
  the biggest ship it has sailed, rocking on the water.
- **Sailing** (`src/13k-ocean.js`): runs reuse the land's run object (`G.run.sea`), gems, cards, chests, revive and
  results; `updateRun`, `updateCamera`, `renderFrame`, `heroDown`, `reviveHero` and `recomputeStats` hand over.
  The stick points where to go: the ship turns toward it (better under way), eases off while turning hard, and
  drifts only a little. The sea is open (islands are scattered by area, about one 46 m square in three, and block
  the ship). Floor style 21 is the water: soft swells, thin drifting light lines in patches, glints; `uSea` carries
  roughness and storm for later chapters. A foam wake trails in a V.
- **The blob** lies back on deck (`hero.lounge`, `src/07-hero.js`): one leg out, one knee up, a hand behind its
  head, the weapon hand at its side. The whole rig pitches back about the pelvis, so costumes, hats and gear stay on.
- **Swimmers** (`src/04k-sea-models.js`): goo pirates in bandanas with eye patches, striped shirts and hooks, treading
  water. Arm-band and inner-tube floaters soak up damage until the floats pop (`e.shell`). They swim for the hull;
  a fast enough hull rams them away (damage grows with closing speed and ship), otherwise they climb on and hack at
  it. Turning hard flings boarders off.
- **Upgrades** (`src/13l-sea-upgrades.js`): the Ship (always slot 1; levels are the seven ships) and the Homing
  Cannon (starting weapon: deck cannons that turn and lob homing balls). Mount points per ship (`SHIP_MOUNTS`).
- **Sinking:** the raft breaks into three pieces that drift apart and keel over (`tilt` clip), the blob drops in,
  flails and goes under. Reviving rebuilds the ship.
- Test: `test/_sea.mjs` (git-ignored scratch; `ONLY=home|run`).

Still to come: the other six ships and fourteen upgrades, more sea enemies, miniboss canoes and rafts, themed
islands, rougher water and storms, ten chapters with boss vehicles, and ocean cosmetics.

## Upgrade cap, Endless and Boss Rush economy (latest)
- Every permanent upgrade stops at level 20 (`META_MAX`). Saves past 20 are set back to 20 and refunded the coins
  for the levels above it (save `content: 3`).
- Endless and Boss Rush: 40% of the XP (`gainXp`), a quarter of the coins (half of what they paid before), a quarter
  of the scroll odds, and Boss Rush starts with 3 free picks and gets 1 per boss (was 8 and 3). Both start on a
  random chapter's map.

## Evolutions, Golden Gooblin, Endless

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

**Goo Dash** was removed at the player's request, along with the "Move with WASD..." hint at the start of a run.

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

## Startup freeze fix (latest)

The build with chapters 11-15 froze the whole of Chrome when opened on Windows. The likely cause is shader compilation. Windows Chrome turns WebGL shaders into Direct3D ones and inlines every function call, and the goo-object shader (`FS_IMP`) called its 48-object shape function `mapImp` 8 times, so the compiler received 8 copies of every object. Each chapter's new objects grew all 8. That compile runs in the browser's GPU process, which also draws Chrome's own windows, so a long one stalls them all. The test browser is Linux, so this could not be reproduced. The fixes below each stand on their own:
- **One copy of each shape function.** In `FS_IMP`, the march, the four normal taps, the material, thickness and occlusion samples all run in one loop. The loop starts at `uZero`, a uniform that is never set and is therefore always 0, so the compiler cannot unroll it. `FS_HERO` does the same: march, taps and color in one loop around `mapH`. The impostor shader's compile cost in the test browser fell from 2.4 s to 0.3 s (2.1 s in the last build that worked). Rendered icons and hero portraits are unchanged. Keep any new `mapImp`/`mapH` sampling inside these loops, never as extra calls.
- **Background compile.** `GLX.programStart` / `programReady` / `programFinish` (`src/01-gl.js`): every program is handed to the driver at `R.init`, and boot waits with `KHR_parallel_shader_compile` until they finish (`R.programsReady`). No status is queried before then, because a query would block on the spot. `test/check-parallel.mjs` fakes the extension, which the test browser lacks.
- **Cheaper blob.** The hero's bounding sphere is now centered on its shapes' box rather than the body, and rays also have to pass through that box (`boxLo`/`boxHi`). A hat used to inflate the sphere and double the blob's GPU cost. The ground darkening uses `aoY`, so it does not move with the bounds. Test-browser frame times, before → after: home 1034 → 875 ms, Blobs 934 → 605 ms, a crowded run 1787 → 1357 ms; the home blob with a hat and gear 1537 → 801 ms.
- **Boot guard.** `projectGel.booting` in localStorage marks a start that has not yet drawn 3 s of the home screen. If the browser freezes or is killed during a start, the next start switches Graphics to Ultra low and says so. Closing the tab clears the mark. The test harness turns it off (`__noBootGuard`).

## Goals, Boss Rush, hats, gear on the blob, boss intros

**Goals** (`src/14c-goals.js`; the Goals button on the home menu):
- 35 goals across fighting, chapters, modes, collecting and gear. Each reads one number through `GOAL_VALUE` and has a target `n`.
- Reaching a goal shows a toast once (`sv.goals.seen`), on the home screen or the results.
- Claiming pays coins and scrolls (`sv.goals.claimed`). A red dot on the button means something can be claimed.
- Three goals give colors that cannot be bought: Champion (clear 15 chapters), Cosmic (20 minutes in Endless) and Inferno (every boss in one Boss Rush). These are the `SKINS` entries with a `goal` field, listed last on the Blobs screen as "Goal".
- Runs add bosses, elites, Gooblins, evolutions, best level and coins earned to `sv.stats` (`goalsAddRun` in `finishRun`); fusing counts as it happens. Old saves get one boss per cleared chapter.

**Boss Rush** (`RUSH` and helpers in `src/11c-events.js`):
- Every chapter boss in order (`RUSH_BOSSES`: all but the cave's Bagger), on the selected chapter's map, each a little tougher.
- It starts on a random chapter's map with 3 free picks. Each boss down gives 1 more pick, 35% health back, a chest and a 5 s breather; every third boss may carry a scroll.
- The best is the most bosses beaten; a full clear also keeps its fastest time.

**Hats** (`HAT_IDS`, `costumesOf(slot)` in `src/10-data.js`): a hood costume and a hat can be worn together (the Blobs screen has Colors, Costumes and Hats tabs). Over a bulky hood, such as the astronaut helmet, the shark or the lion's mane, a hat sits higher (`hatLift` in `setCostume`). Old saves wearing a hat as their costume move it to the hat slot.

**Gear on the blob** (`setGear`, `GEAR_LOOK`): the weapon in the first hand (sword, wand, bow), armor on the chest (plate or vest; the cloak is a cape with a collar), a ring gem on the other fist and a pendant. Gear is drawn last, within `HERO_MAXP` 48 shapes.

**Boss intros and sounds:** a card (portrait, "WARNING", name, one line about its attacks from `BOSS_HINTS`) slides in when a boss arrives. New boss sounds: thunder, boing, roar, splash, ghost, crystal, wind, cackle.

**Home menu:** six buttons (Goals added). On phones they are 3 to a row. In short wide windows (a phone on its side) they are 2 to a row with a smaller chapter picker, so PLAY stays on screen.

## Home screen, balance pass, cosmetics

**Home screen** (markup and CSS in `src/index.html`; scene code `updateHome`, `homeFoes`, `emitHomeFoes`, `homeCamera` in `src/17-main.js`):
- Wide screens: the blob's stage on the left with the chapter picker under it (big arrows, the boss portrait, name and best time), and a column of big buttons on the right (Play, Endless, Upgrades, Gear, Blobs, Chapters, Settings).
- Phones: title, blob, chapter picker, then Play and five big tiles on the white wave.
- Dragging the stage spins the blob all the way round, with a little spin kept on release; a tap still pokes it.
- Faded orange and purple grunts walk in from behind the blob (as the camera sees it); every 1.3-2.8 s it turns, shoots goo at the nearest one and pops it.
- The camera frames the hero inside `#heroTap`, the same way the gear screen frames `#gearStage`.

**Balance pass:**
- Aura: 6-24 damage per tick every 0.4 s, 30-60% slow, radius 1.8-2.8 m.
- Evolutions now give modest boosts (about +10-25%) instead of large ones.
- Rarity multipliers: 1, 1.5, 2.1, 2.8, 3.6.
- Some artifact stats were evened out.
- Fusing takes two of the same artifact and rarity (`FUSE_N` in `src/14a-gear.js`).
- Cosmetics cost about 40% less.
- Scrolls drop a bit more often (`SCROLL_CHANCE` 0.028).

**Cosmetics:**
- 33 colors, 38 costumes (hoods, faces, tails, wings) and 26 hats. A costume and a hat can be worn together.
  The latest batch added the duck, hamster, sheep, monkey, cow, raccoon, axolotl, fawn, snail, butterfly,
  ladybug, alien, bat, robot and dragon, and the pom beanie, big bow, propeller cap, sun hat, santa hat, rain
  cloud, pirate hat, birthday cake, ice cream, jester hat, sombrero and kabuto. Costume parts are SDF shapes on the raymarched hero; keep each costume to 8 parts or fewer (`HERO_MAXP` is 40 shapes in all).
- Hero icons are drawn a few at a time by `pumpHeroIcons` (`src/16-icons.js`): in the background on the home screen while frames are quick, and two a frame while the Blobs screen waits. Only the Blobs tile icon is drawn at boot.
- `test/_cos.mjs` (git-ignored scratch) renders a contact sheet of costumes from four angles (`IDS=fox,owl`), or the colors (`SKINS=1`).

**High quality:** caps resolution at 1.5x, keeps MSAA and bloom, and lowers resolution toward 1x if frames run slow. It used to render at full device resolution without adapting, which made the screen stutter.

## Balance (bot results; the bot is a mediocre player who dodges poorly)
- Chapter bosses hit `BOSS_DMG` (2.5) times as hard as the rest of their chapter: contact, every attack, shot and lob (applied in `updateBoss` around `bossThink`). Minibosses are unchanged. The bot results below were measured before this.

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

With Goo Dash (since removed), evolutions and the flatter boss health:

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

Chapters 11-15 after the theme-enemy and boss tuning (no dash; bot at upgrade level 10):

| Chapter | Bot wins | Notes |
|---|---|---|
| 11 | 2/4 | losses before the boss, among ghosts and zombies |
| 12 | 3/6 | crystal bugs were the main early threat: now 28 health, from 45 s |
| 13 | 2/2 | |
| 14 | 4/4 | |
| 15 | 3/4 | |

The dodge audit (`test/check-dodge.mjs`) now shows the Kraken's rage at 12 damage per 30 s (234 before: its whirlpool core is marked the whole time) and the Geode Titan at 53/71 (calm/rage), next to the UFO (74/41) and the Crab (56/14).

Runs reach about level 33-36. Chapter scaling lives in `chapterInfo()` in `src/10-data.js`, and the spawn curve in `RATE_KEYS` in `src/11-game.js`.

## Next steps (optional)
1. Confirm on a Windows PC and a Chromebook that the startup freeze is gone; the test browser cannot reproduce it.
2. Measure performance on a real phone, which can't be done here.
3. A lower-detail stickman mesh if big crowds struggle on phones.
4. Tune the scroll drop rate and goal rewards after real play.

## Build and test
- **Build:**
  - `node build.mjs` writes `dist/project-gel.html`, the single playable file. It also injects `00-util.js`, `03-sdfmesh.js`, `04-models.js`, `04a-theme-models.js` and `04b-theme-models2.js` as the mesh worker source.
  - `node build.mjs visual` writes `test/visual.html`, an engine-only test scene. Screenshot it with `node test/visual.mjs [scene|close|punch|bosses|items|arenas]`.
- **Game tests:** `node test/game.mjs <mode> ...` (Playwright from `/opt/node22/lib/node_modules/playwright`, headless Chromium with SwiftShader).
  - `boot [--phone]`: the home screen and each menu.
  - `play <chapter> [--runs=N] [--shots]`: bot playthroughs with a win rate and damage sources.
    - `META=<level>` sets the permanent upgrades.
    - `NOREVIVE=1` skips the revive.
    - `MAP=<size>` sets the arena width for the runs (default 100).
  - `skills [--group=a,b] [--phone]`: every skill at max level against a crowd.
  - `bosses` (`ONLY=6` limits it): each chapter's boss fight, chapters 1-15.
  - `powerups` (`IDS=frostnova,meteor`, `FRAMES=150`): each chapter power-up at max level in its own chapter, with a crowd.
  - `evos` (`IDS=ball,fists,...`, `FRAMES=240`): for each skill, maxes it and its partner, opens the golden chest, and watches the evolved form against a crowd.
  - `perf` accepts `CH=<chapter>` to measure the run on that chapter's map.
- **Standalone checks** (`node test/<name>.mjs`):
  - `check-gooblin.mjs`: appears, flees, edge arrow, loot when caught, escape.
  - `check-endless.mjs`: the unlock, tiers, a boss that doesn't end the run, results and best time.
  - `check-home.mjs [wide|phone|chromebook]`: drag-to-spin, the blob shooting the background foes, the chapter arrows, and a screenshot.
  - `check-goals.mjs [wide|phone]`: run counters, the toast and menu dot, claiming once, the goal colors not for sale, screenshots.
  - `check-rush.mjs`: Boss Rush (open from a fresh save) through all 15 bosses (cards, picks, healing) to CHAMPION, then a lost rush.
  - `check-parallel.mjs`: fakes `KHR_parallel_shader_compile`, then checks that every shader finishes in the background and that nothing queries one early.
- **Scratch scripts** (git-ignored `test/_*.mjs`, recreate as needed): `_west.mjs` photographs the Wild West town from several spots, its creatures attacking and each of The Outlaw's attacks; `_boss.mjs` (`CH=13 STEPS=60,75,90`) forces each attack of a chapter's boss and photographs it; `_cos.mjs` renders costume or color sheets; `_icon.mjs` (`IDS=gale,yoyo`) shows skill icons; `_chap.mjs` (`CH=13`) photographs the Chapters screen.
  - `flows`: chest, melt, revive, victory, results, purchases, offline earnings and the Low preset.
  - `input`: keyboard, drag joystick, Esc and number keys.
  - `roster`: every enemy type in a row, plain and elite.
  - `blob`: the Choose your blob screen, including a purchase.
  - `gear`: the inventory, a scroll chest, the two-slot fuse screen and equipping, then checks the run picks up the bonuses.
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
