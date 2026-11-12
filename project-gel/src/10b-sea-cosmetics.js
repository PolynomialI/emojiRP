// ============================================================
// The Ocean Update's cosmetics: sea colors, sea costumes and sea hats (same formats as SKINS / COSTUMES in
// 10-data.js). Two costumes replace the legs (legs: 'tentacles' or 'tail', drawn by Hero.buildPrims in the
// costume's legsCol color); back: true moves a back piece (the shark fin) round to the front while the blob
// lounges on deck, so it sticks up instead of into the planks.
// ============================================================
SKINS.push(
  { id: 'shark', name: 'Shark', cost: 900, base: '#eef4f8', top: '#6a8aa8', accent: '#2a4a6a', rim: '#d8ecff', boost: { dmg: 4 } },
  { id: 'greatwhite', name: 'Great White', cost: 1800, base: '#f6f8fa', top: '#4a5a6a', accent: '#1c2a3a', rim: '#ffffff', boost: { dmg: 6 } },
  { id: 'hammerhead', name: 'Hammerhead', cost: 1400, base: '#c8d0b8', top: '#6a7a5a', accent: '#3a4a2a', rim: '#eef4e0', boost: { armor: 4 } },
  { id: 'tigershark', name: 'Tiger Shark', cost: 1600, base: '#e8c890', top: '#7a5a3a', accent: '#4a3020', rim: '#fff0d0', boost: { speed: 4 } },
  { id: 'coral', name: 'Coral', cost: 700, base: '#ff7a6a', top: '#ffc0a8', accent: '#e8285a', rim: '#ffe0d8', boost: { hp: 4 } },
  { id: 'jelly', name: 'Jellyfish', cost: 1100, base: '#c890ff', top: '#ffb8f0', accent: '#7a4ad8', rim: '#ffe8ff', boost: { cd: 4 } },
  { id: 'deepsea', name: 'Deep Sea', cost: 2200, base: '#1a2a5a', top: '#2fe8d0', accent: '#4ad8ff', rim: '#a8fff0', boost: { xp: 6 } },
  { id: 'seafoam', name: 'Sea Foam', cost: 800, base: '#9af0d8', top: '#e8fff8', accent: '#2fb8a8', rim: '#ffffff', boost: { regen: 0.04 } },
  { id: 'pearl', name: 'Pearl', cost: 2000, base: '#f4ecf0', top: '#ffffff', accent: '#c8a0d8', rim: '#ffffff', boost: { gold: 6 } },
  { id: 'tropical', name: 'Tropical Fish', cost: 1000, base: '#ffa02a', top: '#ffe14a', accent: '#2a6aff', rim: '#fff0c0', boost: { speed: 3 } },
  { id: 'octopus', name: 'Octopus', cost: 1200, base: '#e8504a', top: '#ff9a7a', accent: '#9a1a3a', rim: '#ffd0c0', boost: { area: 4 } },
  { id: 'turtle', name: 'Sea Turtle', cost: 900, base: '#5ab04a', top: '#c8e07a', accent: '#2a6a3a', rim: '#e0ffc0', boost: { hp: 5 } },
);
// the deeper oceans' colors
SKINS.push(
  { id: 'glowtide', name: 'Glowtide', cost: 2400, base: '#0a2a3a', top: '#5affd8', accent: '#2affb8', rim: '#a8fff0', boost: { cd: 6 } },
  { id: 'sargasso', name: 'Sargasso', cost: 1600, base: '#5a7a2a', top: '#c8e8a0', accent: '#3a5a1a', rim: '#e8ffc8', boost: { regen: 0.05 } },
  { id: 'maelstrom', name: 'Maelstrom', cost: 1800, base: '#2a5a62', top: '#d0f0f0', accent: '#12303a', rim: '#ffffff', boost: { speed: 5 } },
  { id: 'atlantean', name: 'Atlantean', cost: 2600, base: '#18b4cc', top: '#f2c440', accent: '#0a6a7e', rim: '#e8fff8', boost: { armor: 6 } },
  { id: 'cherrysoda', name: 'Cherry Soda', cost: 2000, base: '#e8306a', top: '#ffb8d8', accent: '#a8104a', rim: '#fff0f8', boost: { gold: 6 } },
  { id: 'triangle', name: 'Bermuda', cost: 2200, base: '#1c6656', top: '#a8ffd8', accent: '#0c3634', rim: '#e0fff0', boost: { xp: 6 } },
  { id: 'cloudnine', name: 'Cloud Nine', cost: 1800, base: '#e8f0ff', top: '#ffffff', accent: '#a8c8ff', rim: '#ffffff', boost: { magnet: 10 } },
  { id: 'abyssal', name: 'Abyssal', cost: 3000, base: '#040c1a', top: '#2a4a8a', accent: '#ff8a2a', rim: '#7ab8e0', boost: { dmg: 7 } },
);
SKINS.sort((a, b) => (a.goal ? 1e9 : a.cost) - (b.goal ? 1e9 : b.cost));

const SEA_COSTUMES = [
  // ---------- costumes ----------
  { id: 'sharksuit', name: 'Shark Suit', cost: 1600, boost: { dmg: 5 }, back: true, pal: ['#6a8aa8', '#eef4f8', '#1c1820'], parts: [
    ['ell', 'head', [0, 0.07, -0.03], [0.245, 0.2, 0.245], 0.02, 0],
    ['sph', 'head', [0.19, 0.06, 0.1], 0.032, 0.005, 2], ['sph', 'head', [-0.19, 0.06, 0.1], 0.032, 0.005, 2],
    ['cap', 'chest', [0, 0.06, -0.24], [0, 0.42, -0.42], 0.11, 0.015, 0.03, 0],
    ['ell', 'chest', [0.33, -0.06, 0.02], [0.13, 0.03, 0.08], 0.02, 0], ['ell', 'chest', [-0.33, -0.06, 0.02], [0.13, 0.03, 0.08], 0.02, 0],
    ['cap', 'pelvis', [0, 0.0, -0.24], [0, 0.12, -0.46], 0.08, 0.03, 0.03, 0],
    ['cap', 'pelvis', [0, 0.12, -0.44], [0, 0.32, -0.56], 0.05, 0.015, 0.02, 0, 0.02],
  ] },
  { id: 'piranha', name: 'Piranha Teeth', cost: 1300, boost: { dmg: 4 }, pal: ['#fbf6ee', '#c8283a', '#ff6a3a'], parts: [
    ['ell', 'head', [0, -0.12, 0.15], [0.17, 0.07, 0.11], 0.02, 1],
    ...[-0.1, -0.05, 0, 0.05, 0.1].map(x => ['cap', 'head', [x, -0.06, 0.205], [x, -0.12, 0.215], 0.022, 0.004, 0.005, 0]),
    ...[-0.075, -0.025, 0.025, 0.075].map(x => ['cap', 'head', [x, -0.17, 0.2], [x, -0.115, 0.21], 0.02, 0.004, 0.005, 0]),
    ['ell', 'head', [0.22, -0.02, -0.02], [0.03, 0.08, 0.1], 0.02, 2], ['ell', 'head', [-0.22, -0.02, -0.02], [0.03, 0.08, 0.1], 0.02, 2],
  ] },
  { id: 'squid', name: 'Squid', cost: 2000, boost: { cd: 5 }, legs: 'tentacles', legsCol: 0, pal: ['#ff8ac0', '#ffd0e8'], parts: [
    ['cap', 'head', [0, 0.12, -0.02], [0, 0.56, -0.08], 0.21, 0.05, 0.05, 0],
    ['ell', 'head', [0.14, 0.44, -0.06], [0.11, 0.07, 0.03], 0.02, 0], ['ell', 'head', [-0.14, 0.44, -0.06], [0.11, 0.07, 0.03], 0.02, 0],
    ['sph', 'head', [0.09, 0.3, 0.1], 0.03, 0.01, 1], ['sph', 'head', [-0.07, 0.38, 0.08], 0.025, 0.01, 1],
  ] },
  { id: 'mermaid', name: 'Mermaid Tail', cost: 2200, boost: { speed: 6 }, legs: 'tail', legsCol: 0, pal: ['#2fc4a8', '#7af0d8', '#ffd34a', '#ff9ac8'], parts: [
    ['sph', 'head', [0.18, 0.12, 0.06], 0.05, 0.01, 2], ['sph', 'head', [0.21, 0.08, 0.1], 0.035, 0.01, 3],
    ['ell', 'pelvis', [0, 0.02, 0], [0.3, 0.06, 0.28], 0.03, 0],
  ] },
  { id: 'octohood', name: 'Octopus Hood', cost: 1500, boost: { area: 5 }, pal: ['#e8504a', '#ffb8a0'], parts: [
    ['ell', 'head', [0, 0.1, -0.04], [0.26, 0.26, 0.27], 0.02, 0],
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = -1.9 + i * 0.76; return ['cap', 'head', [Math.sin(a) * 0.22, -0.04, Math.cos(a) * 0.22 - 0.04], [Math.sin(a) * 0.33, -0.22, Math.cos(a) * 0.3 - 0.08], 0.05, 0.02, 0.02, 0, 0.03]; }),
    ['sph', 'head', [0.1, 0.28, 0.12], 0.035, 0.01, 1], ['sph', 'head', [-0.12, 0.22, 0.16], 0.03, 0.01, 1], ['sph', 'head', [0.0, 0.33, -0.05], 0.035, 0.01, 1],
  ] },
  { id: 'diver', name: 'Diving Helmet', cost: 1700, boost: { armor: 6 }, pal: ['#d8a040', '#9fe6ff', '#6a4a2a'], parts: [
    ['sph', 'head', [0, 0.03, 0], 0.29, 0.01, 0],
    ['ell', 'head', [0, 0.03, 0.22], [0.15, 0.15, 0.08], 0.01, 1],
    ['ell', 'head', [0, 0.03, 0.21], [0.19, 0.19, 0.07], 0.01, 0],
    ['sph', 'head', [0.26, 0.05, 0.05], 0.06, 0.01, 1], ['sph', 'head', [-0.26, 0.05, 0.05], 0.06, 0.01, 1],
    ['ell', 'chest', [0, 0.2, 0], [0.33, 0.06, 0.28], 0.02, 0],
    ['cap', 'chest', [0, 0.16, -0.25], [0.1, -0.15, -0.34], 0.035, 0.035, 0.01, 2],
  ] },
  { id: 'snorkel', name: 'Snorkel Mask', cost: 800, boost: { xp: 4 }, pal: ['#35c4e8', '#9fe6ff', '#ffd34a'], parts: [
    ['ell', 'head', [0, 0.04, 0], [0.235, 0.05, 0.235], 0.01, 0],
    ['ell', 'head', [0, 0.04, 0.2], [0.15, 0.075, 0.05], 0.01, 1],
    ['cap', 'head', [0.2, -0.06, 0.12], [0.24, 0.36, 0.0], 0.035, 0.035, 0.01, 2],
    ['cap', 'head', [0.2, -0.06, 0.12], [0.04, -0.09, 0.2], 0.03, 0.03, 0.01, 2],
  ] },
  { id: 'lifering', name: 'Life Ring', cost: 700, boost: { hp: 5 }, pal: ['#e8414a', '#fbf6ee'], parts:
    Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return ['sph', 'pelvis', [Math.cos(a) * 0.31, 0.06, Math.sin(a) * 0.31], 0.11, 0.03, i % 2]; }) },
  { id: 'crab', name: 'Crab', cost: 1400, boost: { armor: 5 }, pal: ['#e8503a', '#1c1820', '#ff9a7a'], parts: [
    ['ell', 'chest', [0, 0.02, -0.2], [0.34, 0.26, 0.14], 0.02, 0],
    ['cap', 'head', [0.08, 0.14, 0.08], [0.11, 0.42, 0.12], 0.025, 0.02, 0.01, 0, 0.02], ['cap', 'head', [-0.08, 0.14, 0.08], [-0.11, 0.42, 0.12], 0.025, 0.02, 0.01, 0, 0.02],
    ['sph', 'head', [0.11, 0.45, 0.12], 0.045, 0.01, 1, 0.02], ['sph', 'head', [-0.11, 0.45, 0.12], 0.045, 0.01, 1, 0.02],
    ['ell', 'chest', [0.36, 0.1, 0.06], [0.1, 0.07, 0.12], 0.02, 2], ['ell', 'chest', [-0.36, 0.1, 0.06], [0.1, 0.07, 0.12], 0.02, 2],
  ] },
  { id: 'turtleshell', name: 'Turtle Shell', cost: 1200, boost: { hp: 7 }, pal: ['#5a8a3a', '#c8b070', '#3a6a2a'], parts: [
    ['ell', 'chest', [0, 0.0, -0.21], [0.38, 0.34, 0.16], 0.02, 0],
    ...[[0, 0.08], [0.16, -0.05], [-0.16, -0.05], [0.1, 0.2], [-0.1, 0.2]].map(([x, y]) => ['sph', 'chest', [x, y, -0.35], 0.07, 0.02, 2]),
    ['ell', 'chest', [0, -0.03, 0.2], [0.24, 0.24, 0.06], 0.02, 1],
  ] },
  // ---------- hats ----------
  { id: 'sharkfin', name: 'Shark Fin', cost: 1000, boost: { dmg: 4 }, back: true, pal: ['#6a8aa8', '#eef4f8'], parts: [
    ['cap', 'chest', [0, 0.06, -0.24], [0, 0.52, -0.42], 0.11, 0.015, 0.03, 0],
    ['cap', 'chest', [0, 0.06, -0.24], [0, 0.16, -0.46], 0.07, 0.02, 0.03, 0],
    ['cap', 'chest', [0, 0.12, -0.25], [0, 0.4, -0.37], 0.04, 0.01, 0.01, 1],
  ] },
  { id: 'captain', name: "Captain's Cap", cost: 900, boost: { gold: 5 }, pal: ['#fbf8f2', '#1c2a4a', '#e8b84a'], parts: [
    ['ell', 'head', [0, 0.22, 0], [0.26, 0.08, 0.26], 0.02, 0],
    ['ell', 'head', [0, 0.15, 0], [0.235, 0.055, 0.235], 0.01, 1],
    ['ell', 'head', [0, 0.13, 0.19], [0.17, 0.02, 0.1], 0.01, 1],
    ['sph', 'head', [0, 0.18, 0.235], 0.04, 0.01, 2],
  ] },
  { id: 'sailor', name: 'Sailor Cap', cost: 600, boost: { speed: 3 }, pal: ['#fbf8f2', '#2f5fb8'], parts: [
    ['ell', 'head', [0, 0.17, 0], [0.2, 0.1, 0.2], 0.02, 0],
    ['ell', 'head', [0, 0.13, 0], [0.24, 0.045, 0.24], 0.01, 0],
    ['ell', 'head', [0, 0.16, 0], [0.205, 0.025, 0.205], 0.01, 1],
  ] },
  { id: 'bicorne', name: 'Admiral Bicorne', cost: 1500, boost: { armor: 5 }, pal: ['#1c1820', '#e8b84a', '#fbf8f2'], parts: [
    ['ell', 'head', [0, 0.23, 0], [0.42, 0.14, 0.12], 0.02, 0],
    ['ell', 'head', [0, 0.15, 0], [0.42, 0.035, 0.13], 0.01, 1],
    ['sph', 'head', [0.2, 0.26, 0.1], 0.05, 0.01, 2],
  ] },
  { id: 'angler', name: 'Angler Lure', cost: 1300, boost: { magnet: 8 }, pal: ['#5a4a6a', '#ffe86a'], parts: [
    ['cap', 'head', [0, 0.2, 0.04], [0, 0.5, 0.28], 0.03, 0.022, 0.01, 0, 0.02],
    ['cap', 'head', [0, 0.5, 0.28], [0, 0.48, 0.44], 0.022, 0.018, 0.01, 0, 0.03],
    ['sph', 'head', [0, 0.45, 0.48], 0.075, 0.01, 1, 0.03],
  ] },
  { id: 'jellyhat', name: 'Jellyfish', cost: 1400, boost: { cd: 4 }, pal: ['#c890ff', '#ffd8ff'], parts: [
    ['ell', 'head', [0, 0.22, 0], [0.29, 0.18, 0.29], 0.03, 0],
    ...[0, 1, 2, 3, 4].map(i => { const a = Math.PI * 0.6 + i * 0.5; return ['cap', 'head', [Math.sin(a) * 0.24, 0.12, Math.cos(a) * 0.24], [Math.sin(a) * 0.3, -0.25, Math.cos(a) * 0.3], 0.03, 0.012, 0.01, 1, 0.04]; }),
  ] },
  { id: 'starfish', name: 'Starfish', cost: 700, boost: { xp: 4 }, pal: ['#ff8a3a', '#ffd0a0'], parts: [
    ['sph', 'head', [0, 0.24, 0], 0.07, 0.02, 0],
    ...[0, 1, 2, 3, 4].map(i => { const a = i / 5 * TAU; return ['cap', 'head', [0, 0.24, 0], [Math.sin(a) * 0.2, 0.2, Math.cos(a) * 0.2], 0.06, 0.025, 0.02, 0]; }),
    ...[0, 1, 2, 3, 4].map(i => { const a = i / 5 * TAU; return ['sph', 'head', [Math.sin(a) * 0.1, 0.275, Math.cos(a) * 0.1], 0.018, 0.005, 1]; }),
  ] },
  { id: 'coralcrown', name: 'Coral Crown', cost: 1800, boost: { hp: 6 }, pal: ['#ff7aa8', '#ffd34a', '#c86aff'], parts: [
    ['ell', 'head', [0, 0.16, 0], [0.22, 0.04, 0.22], 0.02, 1],
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * TAU; return ['cap', 'head', [Math.sin(a) * 0.19, 0.17, Math.cos(a) * 0.19], [Math.sin(a + 0.3) * 0.24, 0.38 + (i % 2) * 0.08, Math.cos(a + 0.3) * 0.24], 0.04, 0.02, 0.02, i % 3 === 1 ? 2 : 0]; }),
  ] },
  { id: 'narwhal', name: 'Narwhal Horn', cost: 1600, boost: { dmg: 5 }, pal: ['#f4ecdc', '#c8b898'], parts: [
    ['cap', 'head', [0, 0.18, 0.1], [0, 0.72, 0.3], 0.065, 0.008, 0.02, 0],
    ...[0.32, 0.46, 0.6].map(y => ['sph', 'head', [0, y, 0.15 + (y - 0.18) * 0.37], 0.04 - (y - 0.3) * 0.06, 0.01, 1]),
  ] },
  { id: 'seaweed', name: 'Seaweed Hair', cost: 600, boost: { regen: 0.03 }, pal: ['#3a9a4a', '#6ac85a'], parts:
    [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI * 0.45 + i * 0.45; return ['cap', 'head', [Math.sin(a) * 0.15, 0.18, Math.cos(a) * 0.15], [Math.sin(a) * 0.3, -0.12, Math.cos(a) * 0.3], 0.05, 0.02, 0.02, i % 2, 0.04]; }) },
];
// ---------- trophies: one for sinking each boss of oceans 11-20, given by its achievement (goal: 'sea<n>', 14c-goals.js) ----------
const SEA_TROPHIES = [
  { id: 'anglerhood', name: 'Angler Hood', cost: 0, goal: 'sea11', boost: { cd: 7 }, pal: ['#1e2a44', '#f4f0e0', '#e8ff7a'], parts: [
    ['ell', 'head', [0, 0.09, -0.08], [0.27, 0.27, 0.27], 0.02, 0],
    ...[-0.14, -0.08, -0.02, 0.04, 0.1, 0.16].map(x => ['cap', 'head', [x, 0.2 - Math.abs(x) * 0.6, 0.15], [x, 0.13 - Math.abs(x) * 0.6, 0.19], 0.02, 0.004, 0.005, 1]),
    ['cap', 'head', [0, 0.33, -0.02], [0, 0.56, 0.2], 0.026, 0.02, 0.01, 0, 0.02], ['cap', 'head', [0, 0.56, 0.2], [0, 0.5, 0.36], 0.02, 0.018, 0.01, 0, 0.03],
    ['sph', 'head', [0, 0.46, 0.42], 0.075, 0.01, 2, 0.03],
  ] },
  { id: 'witchhat', name: 'Weed Witch Hat', cost: 0, goal: 'sea12', boost: { regen: 0.06 }, pal: ['#2a2a36', '#4a8a3a', '#7aff5a'], parts: [
    ['ell', 'head', [0, 0.17, 0], [0.38, 0.03, 0.38], 0.01, 0],
    ['cap', 'head', [0, 0.18, 0], [0.04, 0.58, -0.07], 0.18, 0.04, 0.02, 0], ['cap', 'head', [0.04, 0.58, -0.07], [0.16, 0.66, -0.16], 0.04, 0.012, 0.02, 0, 0.02],
    ['ell', 'head', [0, 0.23, 0], [0.18, 0.035, 0.18], 0.01, 1], ['sph', 'head', [0, 0.23, 0.17], 0.035, 0.005, 2],
  ] },
  { id: 'wyrmhorns', name: 'Wyrm Horns', cost: 0, goal: 'sea13', boost: { speed: 7 }, pal: ['#2a8a7a', '#ff7a5a', '#e8e0c8'], parts: [
    ...[1, -1].flatMap(sx => [['cap', 'head', [sx * 0.11, 0.17, 0.02], [sx * 0.22, 0.36, -0.14], 0.04, 0.02, 0.01, 2], ['cap', 'head', [sx * 0.22, 0.36, -0.14], [sx * 0.24, 0.4, -0.3], 0.02, 0.006, 0.01, 2],
      ['ell', 'head', [sx * 0.21, 0.0, -0.04], [0.025, 0.11, 0.09], 0.01, 1]]),
    ...[0, 1, 2].map(i => ['cap', 'head', [0, 0.21 - i * 0.05, -0.08 - i * 0.08], [0, 0.3 - i * 0.05, -0.12 - i * 0.08], 0.03, 0.008, 0.01, 0]),
  ] },
  { id: 'titanhelm', name: 'Titan Helm', cost: 0, goal: 'sea14', boost: { armor: 8 }, pal: ['#c08a4a', '#d83a3a', '#5ab8a0'], parts: [
    ['ell', 'head', [0, 0.11, -0.03], [0.255, 0.21, 0.26], 0.02, 0],
    ...[1, -1].map(sx => ['ell', 'head', [sx * 0.17, -0.04, 0.1], [0.04, 0.1, 0.08], 0.01, 0]),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = 0.3 + i * 0.45; return ['sph', 'head', [0, 0.12 + Math.sin(a) * 0.24, -0.03 - Math.cos(a) * 0.26], 0.06, 0.02, 1]; }),
    ['ell', 'head', [0, 0.06, 0.2], [0.17, 0.02, 0.04], 0.01, 2],
  ] },
  { id: 'cakehat', name: 'Birthday Cake', cost: 0, goal: 'sea15', boost: { gold: 8 }, pal: ['#f2c890', '#ff9ac8', '#e8283c', '#fff4f8'], parts: [
    ['ell', 'head', [0, 0.25, 0], [0.2, 0.065, 0.2], 0.01, 0], ['ell', 'head', [0, 0.31, 0], [0.21, 0.025, 0.21], 0.01, 1],
    ['ell', 'head', [0, 0.36, 0], [0.15, 0.05, 0.15], 0.01, 0], ['ell', 'head', [0, 0.41, 0], [0.16, 0.022, 0.16], 0.01, 1],
    ['sph', 'head', [0, 0.47, 0], 0.055, 0.01, 2], ['cap', 'head', [0, 0.5, 0], [0.03, 0.56, -0.03], 0.008, 0.006, 0.005, 1],
    ...[0, 1, 2, 3].map(i => { const a = i / 4 * TAU + 0.4; return ['sph', 'head', [Math.sin(a) * 0.18, 0.31, Math.cos(a) * 0.18], 0.025, 0.005, 3]; }),
  ] },
  { id: 'ufohat', name: 'Little Saucer', cost: 0, goal: 'sea16', boost: { xp: 8 }, pal: ['#c8d0dc', '#8ae8ff', '#7ad86a', '#ffd34a'], parts: [
    ['ell', 'head', [0, 0.44, 0], [0.26, 0.05, 0.26], 0.01, 0], ['sph', 'head', [0, 0.49, 0], 0.11, 0.01, 1],
    ['sph', 'head', [0, 0.48, 0.02], 0.045, 0.005, 2],
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * TAU; return ['sph', 'head', [Math.sin(a) * 0.24, 0.44, Math.cos(a) * 0.24], 0.025, 0.005, 3, 0.02]; }),
  ] },
  { id: 'cloudhat', name: 'Cloud Nine', cost: 0, goal: 'sea17', boost: { magnet: 12 }, pal: ['#ffffff', '#e8eef8', '#ff6a6a', '#5ab0ff'], parts: [
    ['sph', 'head', [0, 0.27, 0], 0.13, 0.04, 0], ['sph', 'head', [0.12, 0.23, 0.03], 0.1, 0.04, 1], ['sph', 'head', [-0.12, 0.23, -0.02], 0.1, 0.04, 1], ['sph', 'head', [0.02, 0.25, -0.13], 0.1, 0.04, 0],
    ...[0, 1, 2, 3, 4].map(i => { const a = 0.4 + i * 0.58; return ['sph', 'head', [Math.cos(a) * 0.24, 0.3 + Math.sin(a) * 0.2, 0.06], 0.028, 0.01, 2]; }),
    ...[0, 1, 2, 3, 4].map(i => { const a = 0.45 + i * 0.56; return ['sph', 'head', [Math.cos(a) * 0.19, 0.3 + Math.sin(a) * 0.15, 0.06], 0.026, 0.01, 3]; }),
  ] },
  { id: 'levihood', name: 'Leviathan Skull', cost: 0, goal: 'sea18', boost: { dmg: 8 }, pal: ['#1e3a4a', '#f4f0e0', '#ff8a2a'], parts: [
    ['ell', 'head', [0, 0.09, -0.08], [0.27, 0.27, 0.27], 0.02, 0],
    ...[1, -1].map(sx => ['sph', 'head', [sx * 0.11, 0.25, 0.14], 0.035, 0.005, 2, 0.02]),
    ...[0, 1, 2, 3].map(i => ['cap', 'head', [0, 0.34 - i * 0.04, -0.04 - i * 0.08], [0, 0.46 - i * 0.05, -0.08 - i * 0.1], 0.04, 0.008, 0.01, 0]),
    ...[-0.13, -0.065, 0, 0.065, 0.13].map(x => ['cap', 'head', [x, -0.15, 0.17], [x, -0.08, 0.19], 0.022, 0.004, 0.005, 1]),
  ] },
  { id: 'jonesbeard', name: "Davy's Beard", cost: 0, goal: 'sea19', boost: { hp: 9 }, pal: ['#3a8a7a', '#2a6a5a', '#7affa8'], parts: [
    ...[-0.12, -0.07, -0.02, 0.03, 0.08, 0.13].map((x, i) => ['cap', 'head', [x, -0.12, 0.15], [x * 1.3, -0.36 - (i % 2) * 0.08, 0.18 + (i % 3) * 0.03], 0.035, 0.015, 0.015, i % 2]),
    ['ell', 'head', [0, -0.1, 0.13], [0.15, 0.05, 0.06], 0.02, 0], ['sph', 'head', [0.02, -0.43, 0.2], 0.022, 0.005, 2, 0.02],
  ] },
  { id: 'neptunecrown', name: "Neptune's Crown", cost: 0, goal: 'sea20', boost: { dmg: 6, armor: 4 }, pal: ['#f2c440', '#5ad8ff', '#fff4dc'], parts: [
    ['ell', 'head', [0, 0.18, 0], [0.225, 0.05, 0.225], 0.01, 0],
    ...[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * TAU; return ['cap', 'head', [Math.sin(a) * 0.21, 0.2, Math.cos(a) * 0.21], [Math.sin(a) * 0.23, 0.36 + (i % 2) * 0.06, Math.cos(a) * 0.23], 0.035, 0.008, 0.01, 0]; }),
    ['sph', 'head', [0, 0.22, 0.22], 0.045, 0.01, 1, 0.02], ...[1, -1].map(sx => ['sph', 'head', [sx * 0.15, 0.2, 0.16], 0.025, 0.005, 2]),
  ] },
];
SEA_COSTUMES.push(...SEA_TROPHIES);
COSTUMES.push(...SEA_COSTUMES);
HAT_IDS.push('sharkfin', 'captain', 'sailor', 'bicorne', 'angler', 'jellyhat', 'starfish', 'coralcrown', 'narwhal', 'seaweed', 'witchhat', 'wyrmhorns', 'titanhelm', 'cakehat', 'ufohat', 'cloudhat', 'neptunecrown');
for (const c of SEA_COSTUMES) c.slot = HAT_IDS.includes(c.id) ? 'hat' : 'hood';
COSTUMES.sort((a, b) => a.cost - b.cost);
