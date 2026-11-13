# Project Gel — status

A Blob Hero–style survivor game built as one self-contained HTML file (raw WebGL2, no engine).
Play it by opening `dist/project-gel.html` in a recent Chrome, Edge, Firefox or Safari.

Also in this folder: `project-gel-blueprint.html` (the design blueprint) and `last-ember.html` (the earlier prototype).

## Standing rules (apply to every change)
- **Text fills its space.** Every menu, title, button and label is sized to fill the box it sits in, never small
  text in a big box: titles and headers large (the PROJECT GEL logo largest of all), button text near the button's
  height, card text readable at a glance. A label that could overflow its box (a long stat name, a big number) is
  scaled to fit instead of spilling out. The reverse holds too: a box (card, row, panel) is no bigger than what is
  in it needs; tighten the box and grow the text rather than leave empty space. Check new UI in a screenshot
  (`test/_menus.mjs`, every menu at 1100x720) against this before committing.
- Buttons slide a little to the left under the pointer (CSS `translate`, so it stacks with each button's own
  `transform`); a new button with its own `transition` list must add `translate` to it.
- **Each new chapter power-up beats the last.** A power-up a chapter introduces (`from: N` in `SKILLS`) must be
  stronger, or plainly better, than the one before it: finding a new one should feel rewarding. Check a new one
  with `test/_dps.mjs` (IDS=its id plus the previous chapter's) and by playing it.

## Ship looks everywhere, new sea upgrades, body costumes and hats, boat details (latest)
- **Ship looks:**
  - Hull paint now reaches every big part in a ship's own hull color family (`paintLike` in 04l: bulwarks, castles,
    cabins, superstructure; decks, trim, windows and small fittings keep their colors). It shows plainly on all ten
    ships, not just along the waterline (it had looked as if only the Golden Ark took it).
  - The Ships tab lives on the ocean page only: the ground game's Blobs screen has no Ships tab, and from the ocean
    page the Blobs screen opens on it. Arrows over the list try the looks on any of the ten ships.
  - Paints, sails and flags have 3D pictures (the sloop wearing them, the flag on its pole: `shipLookIcons` in 13k);
    the wake trails have new drawings.
  - `test/_m1.mjs` checks all this.
- **Seven new sea upgrades** (13q-sea-more.js), each with its model, picture and evolution.
  - Weapons:
    - Whirlpool: pools that drag swimmers in and grind them.
    - Storm Cloud: a cloud over the ship strikes chained lightning.
    - Kraken Arms: tentacles rise under swimmers and slam down.
    - Dolphin Pod: dolphins leap onto swimmers.
  - Passives: Hull Plating +7% hull, Gunpowder +5% damage, Treasure Hunter +8% coins and +10% pickup reach.
  - Tuned beside the first weapons (`test/_seadps.mjs`, damage a second from a still sloop among 24 tough
    swimmers, level 1 / 10):

    | Weapon | Level 1 | Level 10 |
    |---|---|---|
    | Cannon | 4 | 80 |
    | Gulls | 2 | 53 |
    | Shark | 6 | 62 |
    | Whirlpool | about 7 | about 100 |
    | Storm Cloud | about 7 | 68 |
    | Kraken Arms | 4 | 88 |
    | Dolphin Pod | about 4 | about 50 |

  - The sea autopilot plays with them without errors.
  - Pictures still missing when a sea run starts are drawn once their models are in.
- **16 whole-body costumes and 12 hats** (10d-costumes2.js), listed and bought in the Blobs screen as usual
  (`test/_m3.mjs`).
  - Body costumes: knight and samurai armor, a turtle shell, a super cape, angel wings, fairy wings with a tutu, a
    jetpack, an adventurer's pack, a tuxedo, a hula skirt, a snowman, a captain's coat, a mech suit, a space suit, a
    duck float, a scarecrow.
  - Hats: graduation cap, fez, beret, hard hat, ball cap, traffic cone, tiara, pharaoh, bucket hat, light bulb,
    flower pot, a chick.
  - A body costume's picture shows the whole blob, from behind when it is worn on the back.
  - Long two-stat bonus labels on the Blobs cards shrink to fit.
- **Boats:**
  - The battleship and the carrier fly lines of signal flags from the mast to bow and stern.
  - The battleship has a second funnel and bridge windows.
  - Long ships are framed closer in the Ships tab and on the ocean page.
  - (Thin parts on the biggest ships must be at least about 0.15 thick: their meshes are coarse, 0.07-0.08 a cell.)

## Ground-game balance, big-enemy gems, power changes, a lighter blob in the menus
- **Ground game** (every chapter, Endless and Boss Rush; the sea is unchanged): constants at the top of the enemy
  section of 11-game.js.
  - **Bosses:** 20% less health (`LAND_BOSS_HP`), the Bagger too (4080, was 5100).
  - **Spawns:** 25% fewer enemies (`LAND_SPAWN`): steady spawning, swarms and surges. Measured: 29.5 groups a minute,
    was 39.5.
  - **Minibosses:** 40% less health and 30% less damage (`MINI_HP`, `MINI_DMG`). That counts the first bosses that
    return as minibosses (Charger, Twins, Conductor): their own attacks hit 30% softer too (`updateBoss` lowers
    `run.info.dmgMul` while a miniboss acts).
  - **Hurler:** left as it was last round in both roles (`spareHurler`).
  - **Nothing runs away:** no miniboss or boss moves away from the player now (the Hurler's hop was the only one).
  - **XP:** 15% more (`LAND_XP`).
  - **Scrolls:** 10% more. Every random scroll drop's odds are 10% higher, and a boss now and then drops a second.
- **Big enemies drop more gems, green and blue** (ground only, `dropGemMix`): enemies worth 3+ XP (axemen,
  shieldmen, brutes, knights, bison...) drop a handful (a green is worth two blues) worth about 2.2x their XP, was
  one blue. For example, a brute drops 2 green and 3 blue (11 in all), was one blue worth 5. An elite drops 3 green
  and 3 blue worth 30, was one green worth 25. Minibosses add 4 blue to their 4 green, bosses 6 blue to their 6.
- **Powers** (`test/_dps.mjs`, damage a second against 24 tough dummies, level 1 / level 10):
  - Sandstorm back to how it was before the last buff: 16 / 872.
  - Blob Ball 4 / 42 -> 7 / 113: more damage, quicker, up to 4 balls.
  - Neon Drone 3 / 118 -> 7 / 350: twice the damage, up to 4 drones, quicker zaps, longer range.
  - Blob Buddies 5 / 105 -> 15 / 310: twice the headbutt again, up to 5 buddies, a headbutt every 0.45 s (was 0.6).
  - Blob Fists a fifth more damage, punching a little sooner (7 -> 9 at level 10).
  - Regen 0.5% of max health a second per level (was 0.3%). Goo Leech 1.2% chance per level (was 1.5%).
- **The menus' blob draws about 5x faster.** The gear screen was slow because of the blob, not the page: the
  blob is ray-marched per pixel, drawn very big there, and with all its gear on it is about 50 shapes, every one
  evaluated at every march step of every pixel. Now each pixel first tests its ray against every shape's padded
  bounding sphere (once) and the march evaluates only the shapes it passes near (about 3 of 50), walking the
  set bits of a mask (`gMask0-2` in FS_HERO). SwiftShader, gear screen: 12.0 s -> 2.5 s a frame (blob left out:
  0.27 s); home 1.33 -> 1.03 s. The same blob state drawn by the old and new shader differs in 10 of 770,000
  pixels. The page itself costs little (script, style and layout under 10 ms a second, `test/_menuperf.mjs`).
- `test/_l.mjs` checks the balance numbers (HTML=an old build prints the old ones).

## Blob Buddies and Sandstorm buffs
- **Blob Buddies:** about twice the headbutt damage (4-12 after the power-up halving, was 2-5.5), a buddy more from
  level 3 (up to 4), and they last as long as the wait for the next batch (10-15 s, every 10-7.5 s; was 8-12 s every
  14-12 s).
- **Sandstorm:** about twice the damage per tick (3-8, was 1.5-4.5), a bit wider (1.6-2.5 m), lasting longer
  (4-7.5 s), sooner (every 7-4.8 s) and a second tornado from level 4 (third from level 8).
- `test/_dps.mjs` (24 tough dummies round the blob, 30 s): Buddies level 1 2 -> 5 damage a second, level 10 23 -> 107;
  Sandstorm level 1 14 -> 56, level 10 838 -> 2377 (its tornadoes pull the whole crowd in). Aura for scale: 95 and
  442.

## Hurler, aura, maxed powers, item colors
- **The Hurler** (chapter 2's boss and its three miniboss visits; also in Boss Rush):
  - It no longer hops away when the hero gets close; it only walks.
  - 25% less health (`hp` 1650, was 2200).
  - Its boulders land in circles 20% smaller (1.2 m, was 1.5 m), telegraph and hit alike.
- **Aura:** 1 less damage per tick at every level (5-23, was 6-24).
- **Maxed powers:** level-up cards never offered a maxed power (`test/_maxed.mjs` checks land and sea with everything
  maxed), but the chest's spinning strip showed them going past; it now shows only powers it could still give (or
  just its prize). The level-up card that takes a power to its max says "Takes it to max level".
- **Item colors.** Every item can be painted, free, in its card (right-click): its own color (the ↺ swatch) or ten
  others (`GEAR_COLORS`: red, orange, yellow, green, teal, blue, purple, pink, white, black).
  - The paint is per item type: all robes share one color. It is kept in `G.save.gear.colors`.
  - It goes on the item's main material and its shades (`GEAR_TINT`, `shadeTo`; each shade keeps how much lighter or
    darker it was):
    - weapons: the sword's blade, the wand's handle, the bow's wood;
    - armor: the robe's cloth, the plate's steel, the vest's leather;
    - rings: the band (the gem keeps its color);
    - necklaces: the chain.
  - It shows both on the blob (`gearLook` in `Hero.setGear`) and in the item's picture (`gearIcon`).
  - Mythic gear keeps cycling through the rainbow, so its card has no swatches.
  - `test/_k.mjs` checks all of this round's changes.

## Ocean map, tank steering, slower sea leveling, blob levels, a faster cave
- **Ocean map.** On the ocean page the Chapters button opens a map of the twenty oceans (`renderOceans`, 14-ui.js):
  the sea boss's portrait, the ocean's name, its boss and best time; oceans not reached yet are locked. It used to
  show the land chapters.
- **Tank steering at sea.** W / up sails ahead the way the bow points, S / down backs astern at 40%, A / D turn the bow
  left and right (`seaSteer`, 13k-ocean.js). The touch stick and a gamepad still point the way to go.
- **Slower sea leveling, longer and busier oceans** (every ocean):
  - Its own XP curve (`xpForSea`, 10-data.js): `12 + 6L + 0.5L^2`, about three times land's early on and six times
    by level 20.
  - Big ships no longer pull in gems from far off (magnet `1.6 + length x 0.2`, was `length x 0.45`), which with the
    old curve gave ten levels at once when the boss came.
  - The boss comes at 7:30 (was 5:00), with the swarms spread to match and 50% more foes throughout (`SEA_BOSS_T`,
    `seaEvents`).
  - One more skill slot at sea (`slotLimit`, 5 instead of 4).
  - Homing cannons hit 40% softer and fire a little slower (count unchanged, up to 4); the battleship gunner hits
    about half as hard and fires a little slower.
  - Autopilot (takes the first card, no revive): ocean 1 sank at 4:01 on level 10 (another try lived to 6:43, level
    18); ocean 5 sank at 5:10 on level 15. No upgrade went past level 4 of 10 before the boss.
- **Blob levels.** A blob color has one level (`G.save.blobLv[color]`, 0-20) instead of three stats bought one by one:
  - A level raises all three of that color's stats at once, each by its own amount (`BLOB_UPS`: a speed color gains
    the most speed, Classic plain damage, health and armor).
  - Each color keeps its own level.
  - A level costs about three of the old single-stat steps (`blobUpCost`).
  - Old saves convert each color's per-stat levels to their average.
  - The Gear > Upgrade window shows the level, the three stats (per level and in total) and one LEVEL UP button. The
    two blob-level goals ask for 10 and 30 levels.
- **The cave runs much lighter.** It drew about 3.9 million triangles a frame in a room and 4.9 million in the Bagger's
  hall (a chapter arena draws about 0.5 million); the rock wall meshes alone were 62-66 thousand triangles each, about
  40 at a time. Now:
  - Coarser rock meshes: walls 0.06 (were 0.03), stalactites, stalagmites, boulders, pillars, rubble, cover and mine
    beams a third to a half coarser, the Bagger's body and wheel a little. The rock looks the same (`test/shots/perf-*`).
  - Rock out of the camera's view, or lost in the fog, is not drawn (`cvViewPlanes`, `cvInView` in `emitCave`).
  - Models that only stand still skip the bone lookups in the vertex shader (`uStatic`).
  - Result: a room is about 1.1 million triangles, the walk between rooms 1.0 million and the Bagger's hall 1.8
    million. `test/_caveperf.mjs` times each part of a frame and lists the triangles by model (SwiftShader's timings
    are dominated by pixel shading, so compare the triangle counts).

## Ship upgrade without the freeze, harder seas
- **No freeze on the Ship upgrade.** Picking it used to build the new hull's (and rigging's) meshes on the main thread
  (`ensureMeshNow`): 3-14 s a ship on the test machine, about 20 s for a hull and its rig. Now nothing is built on the
  spot: the Ship level rises at once, and the new ship (stats, hull, mounts, the splash and banner) takes to the
  water the moment the mesh workers have it (`OC.wantStage`, `seaShipReady`, `seaShipArrives`; a toast says it is on
  its way if it is not built yet). Every hull is queued early in a sea run, so it is normally ready. A miniboss's raft
  or canoe is queued, not built on the spot. `ensureMeshNow` reuses the prepared model definitions.
  `test/_shipfreeze.mjs` times the pick (0 ms) and waits for the ship to arrive.
- **Harder seas.** Everything at sea hits harder (`seaThreat` in `hurtHero`): x1.1 on the raft, +0.1 per ship, x2.0 on
  the Golden Ark; and the hull grows with the ship at 70% of the old rate (`160 * (1 + hull * 0.7)`). Autopilot (a weak
  player, revive on), before -> after: ocean 5 won at 69% lowest hull -> lost at the boss; ocean 10 won at 77% ->
  sank at 2:45 after rushing to the Golden Ark; ocean 1 is won but the hull dips to a few percent.
- **Propellers** give +7% speed a level (was 5%). The land Speed passive is unchanged (+4%).
- **Gear eye buttons:** the rules placing the bottom-row slot boxes also caught the buttons inside them (they share
  `data-slot`), so the necklace's eye sat under its picture and the ring's beside it; now only `.eqw` is placed.

## Polish: menus, icons, mounts, ship details, deep balance
- **Menus fit their contents.** Level-up cards are narrower with a 124px icon, 28px names and 19px numbers, and
  their contents centered; pause rows are 430px wide with 48px icons and 23px names; settings rows 21px with bigger
  switches; results numbers 34px and the coin line 42px; achievements, the chapter map, skin and ship-look tiles,
  item info and chest results all have larger text in tighter boxes. A level-up name keeps its star on its line.
- **Small animations.** Screens slide in (`.enter`), lists cascade in one after another (`UI.stagger`: skins,
  ship looks, gear, achievements, chapter map), level-up cards deal in, the coin pill bumps and counts up to its
  new total (`UI.syncCoins`), taps leave a ripple, the Play button breathes. All off under reduced motion.
- **Usability.** Escape goes back from any menu (`UI.back`), R rerolls on a level-up, HUD slots have tooltips, the
  pause line says Ocean N on sea runs, level-up cards show up to two changed stats.
- **Sea upgrade icons** are sticker-style (a dark outline and a soft shadow, `iconSticker`) on ocean tiles
  (weapons) and brass tiles (passives), and framed in two passes: drawn once, measured, and drawn again centered
  and zoomed to fill 80% of the square (`iconFit` in 13k-ocean.js, `iconCapture(..., 'measure')`).
- **Mount weapons rebuilt** in far more detail (04m): every cannon, musket, harpoon, gunner, anchor flail, barrel
  mine, lamp, net rack, gull, shark, water cannon, figurehead, fort plating, crew, a new outboard motor
  (Propellers) and a square bellied sail (Gust Sails).
- **Ship details** (04l, shared helpers `sideX`, `portholes`, `anchor`, `wheel`, `lifeRing`, `hatch`, `rudder`,
  `shrouds`): plank seams on the wooden hulls, anchors at every bow, ship's wheels and rudders on the pirate ships,
  rope shrouds on every mast, cannon muzzles on the sloop, a skull prow on the galleon; running lights, a radar
  bar, aerials, a jet ski and an ensign on the yacht; portholes, balcony dividers, davits, satellite domes and a
  funnel band on the cruise ship; draft marks, bridge wings, life rings and a freefall lifeboat on the cargo ship;
  portholes, AA guns, searchlights and a rangefinder on the battleship; arrestor wires, catapult tracks, an
  elevator, hangar bays and deck crew on the carrier; gold wave scrolls, gem portholes, column capitals, golden
  anchors, rudder and a stern lantern on the Ark; stripes, lashings, a mat and a fishing rod on the canoe; bark
  rings on the raft's logs. `test/_shipgal.mjs` shoots every ship close up from two sides.
- **Deep balance** (autopilot, a weak player: `CHS=11,15,20 CAP=600 node test/_seabot.mjs`). Past ocean 10 the
  player's power stops growing (the Golden Ark, maxed mounts), so the boss multiplier stops its 12%-an-ocean climb
  there and adds 5% an ocean instead, and the deep bosses were rebased (11k health at ocean 11 to 16.6k at 20).
  The deep steps are gentle early and steep late (health x1.04 at ocean 11 to x1.6 at 20; damage x1.03 to x1.4).
  Last run: ocean 11 won (needed the revive), ocean 15 won at 67% lowest hull, ocean 20 sank at 3:12 after a revive.
- **Home screen fixed.** The Ocean Update had left a `#home { position: relative }` rule that overrode the
  screens' full-window positioning, so the home screen was only as tall as its contents (bunched at the top with
  empty space below). Removed; the stage fills the height again, the menu is centered. Coins and the settings gear
  are back in the top left. The menu column is a little wider than before the ocean (up to 460px, was 390px) with
  slightly taller buttons. A page button sits beside the title, always shown (the ocean is always one swipe away):
  on the right of PROJECT GEL to the ocean, on the left of it on the ocean page to go back.
- **Small fixes.** The page arrows and the settings gear are plain white icons on a clear background (no box),
  the gear level with the coin count and the arrows level with the PROJECT GEL line. Sell and Mythic share the
  gear panel's second row. Dragging spins the blob on the Gear screen too (as on home and Blobs). The home menu
  column has room round it so a button's slide to the left on hover is no longer cut off by its scroll box.
- **Gear on the blob reworked** (07-hero.js, the gear block of `buildPrims`). Steel Plate: a breastplate with a
  gold gorget, rim and rivets, domed pauldrons, a belt and buckle, two tassets. Leather Vest: a jerkin over chest
  and belly with a dark collar, shoulder pads, crossed laces and brass studs, a belt. Necklaces hang on a cord or
  chain round the neck (over any armor) to a pendant on its own spring (`updateNeck`: lags, swings, bounces with
  the steps): a skull with a jaw and eye sockets, a crescent moon with a blue bead, a four-leaf clover. Rings are a
  band round the second fist (square to the forearm) with a gem on a bezel: green (gold), blue (silver), red (ruby).
  The bow is a recurve with a leather grip and a string; the star wand has a pommel, a wrapped grip, a banded
  shaft, a gold collar and a five-pointed star; the sword has round guard ends, a gem and a pommel; the robe has a
  hood, a clasp, front trim and a sash. Gear colors: weapon 4, armor 3, ring 2, necklace 3 (`GEAR_PAL`, palette
  8-19, color weights 18-29), each with its own metalness (`GEAR_MAT`, `uGearMat[3]`). The blob's shape budget is
  set at start from the GPU's uniform room (`HERO_MAXP`, 72, at least 48); a full set uses about 47-56 shapes.
- **Cave overhaul (chapter 20).**
  - Outside: once the cave opens, a big gold arrow bobs over its mouth when it is on screen, or points to it from
    the screen's edge when it is not (14-ui.js, after the boss arrows).
  - The original cave foes hit 40% harder; walking between rooms is three times as fast (`CAVE.walk` 13.8).
  - Every room's rocks crash down from the ceiling one after another when it starts, bounce and settle in dust
    (`cvDropCovers`, `cvCoverDrops`, `cvDropY`); the first wave waits for them.
  - See-through rock: any wall slab, boulder, pillar or brazier between the camera and the blob (or what the camera
    looks at) fades out like the city's buildings (`cvSeeThrough`).
  - The deep mine's crowd (models in 04i, behaviour in `cvFoeDeep`): cave spiders drop from the ceiling on silk and
    skitter in to bite; bats weave in high and swoop at your head; goblin sappers throw dynamite from behind rocks (it
    lands, the fuse burns, it blasts you and your rocks); ogres hurl two boulders, then come in to smash with a
    club; crystal golems fire fans of crystal shards, and only the glowing core in their chest takes full damage
    (their body takes a quarter). Every room has its own mix of the old and new crowd; the Bagger calls them too.
  - The Bagger (13j-bagger.js) has half again its health and four stages at 100/75/50/25%, each fought from another
    side of it (`BAG_STAGES`: a frame turned about the machine, `bagStageSetup`; the hall is now 42 wide and 58 deep).
    Stage 1 from the front: goo spit, rock barrage, minions. Stage 2 from its left: the heart beam, the drill-smash
    and quake (lanes of rock spikes erupting out to the rail). Stage 3 from its right: goo rain (gobs sweeping along
    the rail), spin (the upper works turn a full circle spraying rocks across the rail) and the drill volley (a
    drill-rock at every rock at once). Stage 4 from behind, red-hot: all of them. Between stages it roars, the view
    goes dark and the hero comes back on the new side with fresh rocks dropping in (`bagShift`).
  - Its fall: the heart cracks in a moment of slow motion, the bucket wheel snaps off and rolls away bouncing,
    explosions run over it as the boom droops and the masts sink, then the heart bursts in a blast of goo and the
    machine melts into the floor while rock rains from the ceiling; the camera circles it throughout.
  - Reach: a goblin is shorter than its rock, so it hops up on top to throw (that is when to hit it); a spider is
    lower than the hero's rocks, so where one is in its way it climbs up on it and bites down from there. The
    Bagger's crawlers stay square to the hall (only its upper works turn), so each stage shows it from a new side.
  - Model names are global: the cave golem is `cgolem` (`golem` is the Magma Golem's), and the goblins throw the
    Wild West's `dynamite`. A duplicate in MESH_ORDER keeps the mesh count from ever completing.
  - `test/_cave.mjs` plays chapter 20 through (BR=L|R) with shots of each stage; `test/_cavefoes.mjs` lines up the
    new crowd. Last run (R): rooms 14 s, 13 s, 138 s; the Bagger's stages about 16 s each for a perfect-aim bot; no errors.
- **Ocean home foes.** Pirates (swimmers, float and tube riders, sized and tinted as in a run, head and shoulders
  out of the water) swim in round the ship and hack at its side, rocking the blob; tap the water to lob goo at the
  nearest, and the blob throws now and then itself (`seaHomeFoes`, `emitSeaHomeFoes`; shots shared with the land
  page in `homeShots`). `test/_homesizes.mjs` shoots both pages at four window sizes.
- **Tests brought up to date.** `game.mjs boot` and `flows` still clicked the old Upgrades tab and used offline
  earnings (both gone since the blob upgrades); they use Achievements, Gear > Upgrade and the offline popup now.
  The full mesh build takes about 3.5 minutes on the (software GPU) test machine, so the checks wait up to 400 s.
  Last pass: check-home, check-goals, check-endless, check-rush, game.mjs boot, flows and input, no page errors.

## The Deep: oceans 11-20, new ships, ship looks
- **Weight in the water.** Everything in the sea has a dark mass under the surface (decal type 12, `seaShadow` in
  13k-ocean.js): swimmers, divers, minibosses, bosses, the ship and its wreck pieces, mines and kegs, shark
  escorts, rising tentacles; islands have a dark drop-off round their shallows. The color is the chapter's deep
  water, darkened.
- **Islands rebuilt.** The iceberg, volcano, ghost isle, spire, wreck, fort and kelp rock were single faceted
  crags (huge flat slabs); they are now blended masses of lumpy boulders (`rockMass` in 04k) with surface layers,
  detail and pebbles round the shore.
- **Ship deck fix.** Every hull's two thin deck plates were blended, and thin flat shapes have a poor distance
  estimate off their plane, so the blend smeared the deck out into a wide flat skirt (the sloop and galleon looked
  like barges). They are joined without a blend now. Rule: never blend (k > 0) two thin flat shapes.
- **Three new ships** after the Cargo Ship: the Battleship (teak deck, three twin turrets, the blob lounging on
  the raised one), the Aircraft Carrier (flight deck, island tower, jets, a helicopter) and the Golden Ark
  (ivory and gold, a domed temple, gem lanterns, an angel figurehead, white and gold sails). Ship goes to level 10.
- **Oceans 11-20** (13o-sea-deep.js; models 04o): Glowtide Lagoon, Sargasso Snarl, Maelstrom Reach, Sunken
  Atlantis, Soda Sea, Bermuda Triangle, Sky Sea, Leviathan Trench, Davy Jones' Locker, World's Edge. Each has its
  own water (the shader's `uSea.z`: 1 glowing night water, 2 fizzy soda, 3 a sea of clouds, 4 ghost-lit water,
  5 golden water), light and sky, islands, crowd, miniboss and a mechanic (`DEEP_SPAWN`, `seaDeepTick`): glowing
  jellyfish, drifting weed mats, whirlpools (decal 13), columns bursting up, fizz geysers, warp rifts (decal 14),
  wind lanes, a leviathan's shadow that breaches, cursed ghost-fire, and a mix of them at the World's Edge. New
  swimmers: glowing jellyfish (sting the hull), weed-tangled pirates (slow the ship while aboard), merfolk (throw
  tridents from range), gummy bears (split in two), lost pilots (blink closer), balloon pirates (float overhead
  and drop bombs; only shot down), anglerfish (lunge and bite), skeletons (pull themselves back together once).
  Oceans 11-20 are steeper (`seaInfo`; see the deep balance note above).
- **Ten new bosses** (13p-sea-deep-bosses.js; models 04p): the Lantern Angler, the Weed Witch, the Whirl Wyrm,
  the Trident Titan, Captain Sugarbeard, the Triangle Saucer, the Cloud Whale, the Leviathan, Davy Jones and
  Neptune, on the shared sea-boss brain with new moves in `SEA_BOSS_ATK` (lure, hex, coils, trident lanes, tidal
  wave, sprinkles, cherry bombs, tractor beam, zap lines, gusts, dive and breach, maw, tail slams, cursed pearls,
  ghost fire). Creature bosses have no rider (`noRider`) and some carry lights (`glow`).
- **Trophies:** sinking each of those bosses unlocks an achievement (group `ocean`) whose reward is a hat or
  costume that cannot be bought; achievements can reward costumes now. Eight new sea colors.
- **Ship looks** (the Ships tab on the Blobs screen, 10c-ship-cosmetics.js): 9 hull paints, 7 sail colors,
  7 flags and 7 wake trails, tried on a ship on open water. Paint uses a third vertex color mode (`paint: true`
  parts keep their color and shading, multiplied by the tint; the tint is paint / the ship's own color). The
  boss ships built from the galleon opt out (`paint: false`). `specimen` unlocks every look too.
- Tests (scratch): `test/_seaview.mjs` (a quick look at a chapter, a ship stage and its boss), `test/_isles.mjs`
  (every island in a grid), `test/_ships.mjs` (the Ships tab), `test/_cos2.mjs` (trophies), `test/_seach.mjs`
  with CHS=11..20.

## Blob upgrades, boss immunities, abilities
- **Fresh start.** Saves from before this update (`content` < 4) are reset to a new save; settings are kept.
- **Upgrades moved to the blob.** The Upgrades tab is gone and the old permanent upgrades no longer count. In Gear,
  the Upgrade button under the blob opens that color's own upgrades (`BLOB_UPS`, 10-data.js): three stats each,
  up to level 20, matched to the color's bonus (a speed color gets a lot of speed and less health; Classic gets
  plain damage, health and armor). The cost is `blobUpCost`. (Now one level per color raising all three; see the latest section.)
- **Selling gear.** Gear has a Sell button: tap an item to sell it for `SELL_PRICE` by rarity (5, 12, 30, 60, 120,
  300 coins).
- **Restart run** in the pause menu (with a confirm); it starts the same chapter, sea chapter, Endless or Boss Rush.
- **Boss immunities.** 18 bosses (`BOSS_RESIST`, 10-data.js) shrug off one or two attacks (an IMMUNE tag, no
  damage) and take 1.8x from others (orange numbers); every boss immune to something is weak to something. The
  skill dealing damage is tracked in `DMG_SRC` (set around each skill, its projectiles and blasts). The boss card
  lists both.
- **Balance.** At most 300 enemies at once. Goo Snack heals 12%, and when everything is maxed it is offered every
  other level only. Goo Wave, Laser and Bouncy Ball were cut harder; Regen, Thick Goo, Armor and Thorns were raised.
  New passives: Lucky Splat (crits), Goo Leech (heal on kill), Slippery (dodge), Second Wind (a heal when you
  drop under 30% health, once every 45 s).
- **Evolutions are rarer.** A chest is a random roll: an evolution you are ready for comes up 1 time in 8, and skills
  already at level 8 or more are offered less often, in chests and in level-ups. Reaching an evolution shows a toast;
  it no longer drops a golden chest.
- **Abilities** (12d-abilities.js). A maxed Blob Mine, Lightning, Meteor, Frost Nova or Bubble Shield gives an
  ability, fired with keys 1-5 or its button at the bottom left: Mega Mine (45 s), Storm Call (40 s), Starfall (50 s),
  Deep Freeze (60 s), Bubble Fortress (55 s). The cooldowns are fixed. An ability with nothing to hit is refused and
  keeps its charge. Land runs only.
- `specimen` (dev console) also opens every sea chapter and gives a mythic of every gear item; `ocean <n>` opens sea
  chapters up to n.
- **Home stage shooting.** A tap or click on the home stage shoots goo at the grunt nearest the tap (`homeShoot`,
  17-main.js). Grunts walk all the way up and shove the blob until shot; the blob also shoots by itself, slowly.
- **The Hero Cloak is a full robe** (07-hero.js): mantle, sleeves, a wrapped body and eight pleated skirt panels.
  The hem hangs on damped springs (`updateRobe`): it trails when running, sways to rest on stopping, twists behind
  turns and menu spins, flutters at speed, and the striding feet push the front panels out. 13 of the hero's 48
  shapes; the thighs are not drawn under it.
- **Art.** Every gear icon and the scroll are redrawn to fill their tiles, with gradient shading and highlights; the
  scroll chest has wood grain, gold bands with rivets, a keyhole lock, a lid gem, and a glow inside when it opens.
- Menu text is larger throughout and the chapter picker shows the boss name without "Boss:".
- Testing note: `__frames(n)` in test/harness.js does not render unless its third argument is true; render one frame
  (`__frames(1, 1 / 60, true)`) before taking a screenshot after stepping manually.

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

## The Ocean Update

A second game mode with twenty chapters of its own (11-20: see The Deep, above), on the home screen's second page.
- **Home:** "The Ocean Update" sits under the title on both pages. A sideways swipe turns the page (anywhere but the
  buttons; on the blob's stage only a long, quick swipe, since a drag there spins the blob). Once chapter 20 is
  beaten, page dots and an edge arrow show too, with a note the first time. The ocean page keeps the menu buttons;
  Play becomes SAIL, the picker lists the ocean's chapters and bosses (`save.sea`), and the stage shows the blob
  lounging on the biggest ship it has sailed. Coins, cosmetics, gear and permanent upgrades are shared.
- **Sailing** (`src/13k-ocean.js`): runs reuse the land's run object (`G.run.sea`), gems, cards, chests, revive and
  results; `updateRun`, `updateCamera`, `renderFrame`, `heroDown`, `reviveHero` and `recomputeStats` hand over.
  The stick points where to go: the ship turns toward it (better under way), eases off while turning hard, and
  drifts a little. The sea is open; islands are scattered by area (about one 46 m square in three) and block the
  ship. Floor style 21 is the water (soft swells, drifting light lines, glints; `uSea` carries roughness and storm).
  A foam wake trails in a V and grows with the ship. The camera pulls back as the ship grows.
- **The blob** lies back on deck (`hero.lounge`, `src/07-hero.js`): one leg out, one knee up, a hand behind its
  head, the weapon hand at its side. The whole rig pitches back about the pelvis, so costumes, hats and gear stay
  on; pieces worn on the back (`back: true`, the shark fin) move to the front while lounging so they stick up.
- **Ships** (`src/04l-ship-models.js`): raft, canoe, pirate sloop, black galleon, yacht, cruise ship, cargo ship.
  Each has a hull mesh that rocks (less the bigger it is), three pieces it breaks into, and the pirate ships a
  separate rig (masts and sails) that fades while it stands between the camera and the blob. The Ship upgrade is
  always in the first slot; each level is the next ship (more hull, harder rams).
- **Upgrades** (`src/13l-sea-upgrades.js`, models in `src/04m-mount-models.js`): Homing Cannon (the starting weapon),
  Musket Ball Pile, Harpoon Gun (reels its catch in), Battleship Gunner (rare: a third as likely), Anchor Flail,
  Barrel Mines, Lighthouse Lamp, Fishing Net (netted swimmers take 1.5x ram damage), Seagull Squadron, Shark
  Escort, Water Cannon (washes boarders off), Goo Figurehead (harder rams that splash); passives Fortifications
  (plating and spikes that hurt boarders), Propellers, Repair Crew (little sailors who patch the hull and bonk
  boarders) and Gust Sails. Each ship lists where every mount goes (`SHIP_MOUNTS`), so they all move to the next
  ship. Every weapon evolves with a passive. Land and sea cards never mix (`sea: true`).
- **Swimmers and folk** (`src/04k-sea-models.js`, `src/13m-sea-folk.js`): goo pirates in bandanas with hooks,
  arm-band and inner-tube floaters (floats soak up damage until they pop), tricorn pirates with cutlasses, snorkel
  divers (under water and untargetable until close), keg pushers (the keg blows up on the hull), parka pirates,
  ghost pirates, and musketeers who come out of island huts and forts to shoot. Swimmers ram away from a fast hull;
  otherwise they climb on and hack at it, and turning hard flings them off.
- **Chapters** (`SEA_CHAPTERS`, `SEA_THEMES`): each has its own water colors, roughness, crowd, islands (palm, coral,
  kelp, smuggler huts, icebergs, volcanoes that spit lava, ghost isles, lightning spires, wrecks, forts with cannon),
  current, fog and weather. Storms (rain, darker light, thunder) blow in later chapters, some only once the boss
  arrives; Thunder Sea and Pirate Fortress have lightning strikes on marked circles.
- **Minibosses:** captains on their own rafts and canoes, three visits a chapter: they circle, charge down a marked
  lane, lob bombs, fire volleys and call swimmers.
- **Bosses** (`src/13n-sea-bosses.js`, vehicles in `src/04n-sea-boss-models.js`): Captain Flamingo (inflatable
  flamingo, water jet), the Coral Queen (clam boat, rings of pearls), Kelpbeard (rowboat, kelp snares), the
  Smuggler King (speedboat, keg runs), Admiral Frost (icebreaker, ice floes and frost), the Magma Mariner (lava-rock
  galleon, lava rain), the Phantom Captain (ghost ship, vanishes and reappears), the Thunder Admiral (ironclad,
  lightning), the Kraken (tentacles and ink), the Pirate King (flagship, everything). One shared brain with an
  attack cycle each; enraged at half health.
- **Sinking:** the ship breaks into three pieces that drift apart and keel over, the blob drops in, flails and goes
  under. Reviving rebuilds the ship.
- **Cosmetics** (`src/10b-sea-cosmetics.js`): 12 sea colors (sharks, coral, jellyfish, deep sea...), 10 costumes
  (Shark Suit, Piranha Teeth, Squid with tentacle legs, Mermaid Tail, Octopus Hood, Diving Helmet, Snorkel Mask,
  Life Ring, Crab, Turtle Shell) and 10 hats (Shark Fin worn on the back, Captain's Cap, Sailor Cap, Admiral
  Bicorne, Angler Lure, Jellyfish, Starfish, Coral Crown, Narwhal Horn, Seaweed Hair). Costumes can replace the
  legs (`legs: 'tentacles' | 'tail'`).
- **Balance** (`seaInfo`, the autopilot in `test/_seabot.mjs`, which takes the first card offered and never revives):
  every run starts on a raft, so the chapters climb gently (health +8%/chapter plus a little, damage +4.5%, spawns
  +5%). Swimmers can only climb aboard while the ship is below 60% of its top speed, and hook blows do 70% damage;
  a raft holds 4 boarders, a cargo ship 14. The next ship is offered 1.8x as often as other upgrades. While a boss
  is out, swimmers come at under half the rate and every other cannon locks onto it. Sea bosses have half their
  table health (x1.12 per chapter: the Pirate King about 6,100). Autopilot results: ocean 1 won (lowest hull 61%),
  ocean 5 won (12%), ocean 9 and 10 held (67% and 39%) but their bosses outlasted the run cap before the last
  boss health cut.
- **Meshes:** the sea's meshes are big and build in the background workers after the land's; SAIL waits only for
  the chapter's own swimmers and islands, and the rest are moved to the front of the queue.
- Tests (git-ignored scratch): `test/_seach.mjs` (each chapter's crowd, island, miniboss and boss),
  `test/_seabot.mjs` (an autopilot plays whole chapters).

## Upgrade cap, Endless and Boss Rush economy
- Every permanent upgrade stops at level 20 (`META_MAX`). Saves past 20 are set back to 20 and refunded the coins
  for the levels above it (save `content: 3`). (Since replaced: the permanent upgrades no longer count; see the
  per-blob upgrades above.)
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
