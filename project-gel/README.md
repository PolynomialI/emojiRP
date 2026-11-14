# Project Gel

A survivor-style action game about a goo blob, in one self-contained HTML file (raw WebGL2, no engine). The ground
game has 20 chapters (the last ending in the cave and the Bagger); the Ocean Update adds 20 oceans played from a ship.

## Play

Open `dist/project-gel.html` in a recent Chrome, Edge, Firefox or Safari. Progress is saved in the browser.

## Build

```
node build.mjs
```

bundles `src/*.js` and `src/index.html` into `dist/project-gel.html` (Node 18 or newer; no dependencies). Model
files (`src/04*.js`) are also built into the mesh workers: a new one must be listed in `build.mjs`.

## Test

The tests drive the built game in a headless Chromium through Playwright (SwiftShader, so they are slow; compare
numbers between builds rather than reading them as real frame rates):

- `node test/game.mjs`: the main flow (menus, a run, purchases), with screenshots in `test/shots/`.
- `test/_*.mjs`: focused checks and tools, e.g. `_seabot.mjs` (an autopilot for the oceans), `_dps.mjs` and
  `_seadps.mjs` (damage a second of each power), `_cave.mjs` (chapter 20's cave end to end), `_menus.mjs` (every
  menu), `_cullfps.mjs` (frame times).

## Notes

`STATUS.md` is the running design and change log: what every system does, the balance numbers and how they were
measured, and the standing rules for UI work.
