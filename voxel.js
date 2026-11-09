// ============================================================================
// DragonCraft — procedural content: 10,000 dragons, taming foods, dimensions,
// endless islands and Minecraft-style voxel drawing helpers.
// Everything here is deterministic (same id/index -> same result), so saves only
// need to store dragon ids and an island number.
// ============================================================================
const DRAGON_TOTAL = 10000;
const ISLANDS_PER_DIM = 6;

function hashInt(a, b) {
  let h = Math.imul((a | 0) ^ 0x9e3779b1, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
}
function rng(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hslHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// TAMING FOODS — every dragon has a favourite (+big), a snack it likes (+medium);
// any other food barely helps. Clues tell the kid which food to try.
// ---------------------------------------------------------------------------
const FOODS = {
  beef:     { icon: '🥩', name: 'Raw Beef',        clue: 'smells smoky, hungry for meat', price: 30 },
  fish:     { icon: '🐟', name: 'Raw Salmon',      clue: 'loves the cold, salty sea', price: 30 },
  apple:    { icon: '🍎', name: 'Golden Apple',    clue: 'craves sweet fruit from the forest', price: 30 },
  carrot:   { icon: '🥕', name: 'Golden Carrot',   clue: 'likes crunchy roots from the ground', price: 30 },
  melon:    { icon: '🍉', name: 'Glistering Melon', clue: 'likes juicy, sun-warmed treats', price: 35 },
  honey:    { icon: '🍯', name: 'Honey Bottle',    clue: 'drawn to sticky, sweet nectar', price: 35 },
  redstone: { icon: '🔴', name: 'Redstone Dust',   clue: 'buzzes for sparks and power', price: 45 },
  coal:     { icon: '⚫', name: 'Blaze Coal',      clue: 'chews hot rocks and metal', price: 45 },
  bone:     { icon: '🦴', name: 'Old Bone',        clue: 'hungers for ancient, spooky things', price: 45 },
  amethyst: { icon: '💜', name: 'Amethyst Shard',  clue: 'hungers for sparkling crystal', price: 60 },
  pearl:    { icon: '🔮', name: 'Ender Pearl',     clue: 'hungers for strange, void-touched things', price: 70 },
  star:     { icon: '🌟', name: 'Nether Star',     clue: 'wants a rare cosmic snack', price: 90 }
};
const FOOD_IDS = Object.keys(FOODS);

// [element, icon, hue, favourite food, liked food]
const ELEMENTS = [
  ['Fire', '🔥', 8, 'beef', 'coal'], ['Nature', '🌿', 130, 'apple', 'carrot'], ['Storm', '⚡', 195, 'redstone', 'amethyst'],
  ['Frost', '❄️', 190, 'fish', 'honey'], ['Earth', '⛰️', 150, 'carrot', 'coal'], ['Cosmic', '⭐', 270, 'star', 'amethyst'],
  ['Quantum', '🔮', 280, 'pearl', 'star'], ['Ocean', '🐚', 12, 'fish', 'pearl'], ['Desert', '🏜️', 42, 'melon', 'bone'],
  ['Lava', '🌋', 2, 'coal', 'beef'], ['Lightning', '⚡', 52, 'redstone', 'honey'], ['Shadow', '🌑', 245, 'pearl', 'bone'],
  ['Crystal', '💎', 310, 'amethyst', 'star'], ['Sky', '☁️', 200, 'honey', 'apple'], ['Moon', '🌙', 225, 'star', 'honey'],
  ['Sun', '☀️', 32, 'melon', 'honey'], ['Swamp', '🐸', 100, 'bone', 'fish'], ['Ancient', '📜', 290, 'bone', 'pearl'],
  ['Metal', '⚙️', 210, 'coal', 'redstone'], ['Candy', '🍭', 340, 'honey', 'melon'], ['Water', '💧', 188, 'fish', 'melon'],
  ['Jungle', '🌴', 145, 'apple', 'melon'], ['Aurora', '🌌', 285, 'amethyst', 'fish'], ['Thunder', '⛈️', 250, 'redstone', 'coal'],
  ['Phoenix', '🪶', 22, 'star', 'beef'],
  ['Blaze', '🔥', 26, 'beef', 'coal'], ['Ember', '🕯️', 15, 'coal', 'beef'], ['Glacier', '🧊', 180, 'fish', 'amethyst'],
  ['Moss', '🍃', 115, 'apple', 'bone'], ['Void', '🕳️', 262, 'pearl', 'star'], ['Wither', '💀', 235, 'bone', 'coal'],
  ['Prism', '🌈', 320, 'amethyst', 'honey'], ['Coral', '🪸', 5, 'fish', 'melon'], ['Mushroom', '🍄', 330, 'carrot', 'bone'],
  ['Obsidian', '🪨', 265, 'coal', 'pearl'], ['Honey', '🐝', 45, 'honey', 'apple'], ['Redstone', '🔴', 0, 'redstone', 'coal'],
  ['Emerald', '💚', 140, 'apple', 'amethyst'], ['Diamond', '🔷', 185, 'amethyst', 'fish'], ['Echo', '🔊', 215, 'pearl', 'amethyst'],
  ['Cherry', '🌸', 335, 'apple', 'honey'], ['Dripstone', '🦇', 28, 'bone', 'carrot'], ['Warden', '👁️', 205, 'pearl', 'bone']
];
const ELEMENT_BY_NAME = {};
ELEMENTS.forEach(e => { ELEMENT_BY_NAME[e[0]] = e; });

const D_SYL = ['Zar', 'Kor', 'Vel', 'Mor', 'Thal', 'Ign', 'Sky', 'Bor', 'Nyx', 'Rax', 'Pyr', 'Gla', 'Sol', 'Lum', 'Drak', 'Ven', 'Oro', 'Quil', 'Fen', 'Tor', 'Ash', 'Cin', 'Eld', 'Ymir', 'Bel', 'Kra', 'Zyl', 'Hex', 'Tal', 'Wyn'];
const D_END = ['ix', 'on', 'ar', 'us', 'ith', 'or', 'ax', 'is', 'eth', 'oth', 'yn', 'ak', 'ul', 'ira'];
const D_SPECIES = ['Drake', 'Wyvern', 'Wyrm', 'Dragon', 'Serpent', 'Hydra', 'Behemoth', 'Phantom', 'Guardian', 'Stalker'];
const RARITIES = [
  { id: 'common', name: 'Common', color: '#9fb3c8', need: 100, hp: 1 },
  { id: 'rare', name: 'Rare', color: '#4cc9f0', need: 120, hp: 1.15 },
  { id: 'epic', name: 'Epic', color: '#c77dff', need: 150, hp: 1.35 },
  { id: 'legendary', name: 'Legendary', color: '#ffd166', need: 190, hp: 1.6 },
  { id: 'mythic', name: 'Mythic', color: '#ff5d8f', need: 240, hp: 2 }
];
function rarityOf(r) {
  return r < 0.58 ? 0 : r < 0.84 ? 1 : r < 0.95 ? 2 : r < 0.99 ? 3 : 4;
}

const _dragonCache = new Map();
function dragonIdx(id) {
  if (typeof id !== 'string') return -1;
  const i = DRAGONS.findIndex(d => d.id === id);
  if (i >= 0) return i;
  const m = /^x(\d{1,5})$/.exec(id);
  if (!m) return -1;
  const n = Number(m[1]);
  return n >= DRAGONS.length && n < DRAGON_TOTAL ? n : -1;
}
function isDragonId(id) { return dragonIdx(id) >= 0; }
function dragonIdAt(n) { return n < DRAGONS.length ? DRAGONS[n].id : 'x' + n; }

function getDragon(id) {
  if (_dragonCache.has(id)) return _dragonCache.get(id);
  const idx = dragonIdx(id);
  let d;
  if (idx < 0) d = getDragon(DRAGONS[0].id);
  else if (idx < DRAGONS.length) {
    d = DRAGONS[idx];
    const el = ELEMENT_BY_NAME[d.element] || ELEMENTS[idx % ELEMENTS.length];
    d.food = d.food || el[3]; d.food2 = d.food2 || el[4];
    d.rarity = d.rarity != null ? d.rarity : (idx < 12 ? 0 : idx < 20 ? 1 : 2);
    d.idx = idx;
  } else {
    const r = rng(hashInt(idx, 4242));
    const el = ELEMENTS[Math.floor(r() * ELEMENTS.length)];
    const hue = (el[2] + (r() - 0.5) * 36 + 360) % 360;
    const sat = 55 + r() * 35;
    const color = hslHex(hue, sat, 48 + r() * 12);
    const wing = hslHex((hue + 25 + r() * 160) % 360, 60 + r() * 30, 62 + r() * 18);
    const belly = hslHex((hue + 340 + r() * 40) % 360, 50 + r() * 40, 75 + r() * 12);
    const nm = D_SYL[Math.floor(r() * D_SYL.length)] + D_END[Math.floor(r() * D_END.length)];
    const sp = D_SPECIES[Math.floor(r() * D_SPECIES.length)];
    d = { id: 'x' + idx, idx, name: `${nm} the ${el[0]} ${sp}`, color, wing, belly, element: el[0], icon: el[1], food: el[3], food2: el[4], rarity: rarityOf(r()) };
  }
  _dragonCache.set(id, d);
  return d;
}
function rarityInfo(d) { return RARITIES[d.rarity || 0]; }

// How much a food helps taming this dragon: 2 = favourite, 1 = liked, 0 = meh
function foodMatch(dragon, foodId) { return foodId === dragon.food ? 2 : foodId === dragon.food2 ? 1 : 0; }

// Choose a themed dragon for an island (stays the same for that island)
function pickIslandDragon(island, salt, elems, minRar, maxRar) {
  const r = rng(hashInt(island, 900 + salt));
  let best = null;
  for (let k = 0; k < 120; k++) {
    const n = DRAGONS.length + Math.floor(r() * (DRAGON_TOTAL - DRAGONS.length));
    const d = getDragon('x' + n);
    if (d.rarity < minRar || d.rarity > maxRar) continue;
    if (elems.includes(d.element)) return d.id;
    if (!best) best = d.id;
  }
  return best || 'x' + (DRAGONS.length + Math.floor(r() * (DRAGON_TOTAL - DRAGONS.length)));
}

// ---------------------------------------------------------------------------
// DIMENSIONS & BIOMES — endless islands, six per dimension, ten dimensions
// ---------------------------------------------------------------------------
// biome template: [title, icon, top, deco, fluid, [dragon elements], goal icon, goal noun]
const DIMS = [
  { name: 'THE OVERWORLD', icon: '🌍', sky: '#3a7bd5', night: '#0b1d3a', amb: ['#ffffff', '#cfe8ff'], clouds: true, biomes: [
    ['EMERALD VOXEL WOODS', '🌲', '#4caf50', 'oak', 'water', ['Nature', 'Earth', 'Moss'], '💎', 'Mana Crystal'],
    ['GOLDEN SAND DUNES', '🏜️', '#e9c46a', 'cactus', null, ['Desert', 'Sun', 'Ancient'], '🏺', 'Sun Relic'],
    ['FROZEN SPRUCE TAIGA', '🌨️', '#dff3f7', 'spruce', 'water', ['Frost', 'Glacier', 'Aurora'], '❄️', 'Snow Gem'],
    ['MISTY MUSHROOM FIELDS', '🍄', '#8e6a9e', 'mushroom', 'water', ['Mushroom', 'Moss', 'Swamp'], '🍄', 'Glowing Mushroom'],
    ['MOONLIT JUNGLE RUINS', '🌴', '#2d8a4e', 'jungle', 'water', ['Jungle', 'Nature', 'Ancient'], '📜', 'Ancient Rune'],
    ['CHERRY BLOSSOM GROVE', '🌸', '#f4a3c0', 'cherry', 'water', ['Cherry', 'Candy', 'Nature'], '🌸', 'Petal Gem'] ] },
  { name: 'THE NETHER', icon: '🔥', sky: '#5a0f0f', night: '#1a0204', amb: ['#ff7b00', '#ffd166', '#ff3d00'], biomes: [
    ['CRIMSON FUNGUS FOREST', '🍄', '#a4243b', 'fungus', 'lava', ['Fire', 'Blaze', 'Ember'], '🔥', 'Fire Gem'],
    ['BASALT DELTAS', '🌋', '#4a4e5a', 'pillar', 'lava', ['Lava', 'Obsidian', 'Metal'], '🪨', 'Basalt Core'],
    ['SOUL SAND VALLEY', '👻', '#6b5b4b', 'bone', 'lava', ['Wither', 'Shadow', 'Ancient'], '💀', 'Lost Soul'],
    ['WARPED FOREST', '🌀', '#1f8a8a', 'fungus', 'lava', ['Void', 'Cosmic', 'Echo'], '🌀', 'Warp Crystal'],
    ['LAVA OCEAN FORTRESS', '🏰', '#7a2a2a', 'pillar', 'lava', ['Lava', 'Fire', 'Phoenix'], '🧱', 'Nether Brick'],
    ['GLOWSTONE CAVERNS', '💡', '#c08a2a', 'crystal', 'lava', ['Sun', 'Crystal', 'Prism'], '💡', 'Glowstone'] ] },
  { name: 'THE END', icon: '🔮', sky: '#2a1448', night: '#05010f', amb: ['#c77dff', '#00f5d4', '#ffffff'], stars: true, biomes: [
    ['OBSIDIAN ENDER KEEP', '🔮', '#6a4fa0', 'pillar', 'void', ['Quantum', 'Void', 'Shadow'], '🔮', 'Ender Portal'],
    ['CHORUS GARDEN ISLES', '🌺', '#c9b6e8', 'chorus', 'void', ['Cosmic', 'Echo', 'Aurora'], '🌺', 'Chorus Fruit'],
    ['END CITY SKYSHIPS', '🏙️', '#d7c8a0', 'pillar', 'void', ['Ancient', 'Metal', 'Void'], '🚀', 'Elytra Wing'],
    ['DRAGON EGG SPIRE', '🥚', '#3a3a5c', 'crystal', 'void', ['Quantum', 'Cosmic', 'Phoenix'], '🥚', 'Dragon Egg'],
    ['VOID EDGE FRAGMENTS', '🕳️', '#4b3a6b', 'chorus', 'void', ['Void', 'Warden', 'Echo'], '🕳️', 'Void Shard'],
    ['PURPUR PALACE', '🏯', '#b891d6', 'pillar', 'void', ['Crystal', 'Prism', 'Moon'], '🏯', 'Purpur Block'] ] },
  { name: 'THE SKYLANDS', icon: '☁️', sky: '#6ec6ff', night: '#14305a', amb: ['#ffffff', '#fff3b0'], clouds: true, biomes: [
    ['CRYSTAL SKY SANCTUARY', '☁️', '#e8f4ff', 'crystal', null, ['Sky', 'Crystal', 'Moon'], '☁️', 'Sky Crystal'],
    ['CLOUD CASTLE RUINS', '🏰', '#f2f2f2', 'pillar', null, ['Sky', 'Ancient', 'Sun'], '🏰', 'Cloud Brick'],
    ['RAINBOW BRIDGE ISLES', '🌈', '#ffd1f0', 'crystal', null, ['Prism', 'Candy', 'Sky'], '🌈', 'Rainbow Shard'],
    ['THUNDER STORM PEAK', '⛈️', '#9aa5c4', 'spike', null, ['Thunder', 'Storm', 'Lightning'], '⚡', 'Storm Orb'],
    ['SUNRISE HONEY HIVES', '🐝', '#ffcf5c', 'cherry', null, ['Honey', 'Sun', 'Sky'], '🍯', 'Honeycomb'],
    ['AURORA FLOATING MEADOW', '🌌', '#a8e6cf', 'oak', null, ['Aurora', 'Nature', 'Sky'], '🌌', 'Aurora Gem'] ] },
  { name: 'THE DEEP OCEAN', icon: '🌊', sky: '#0b5d8a', night: '#021726', amb: ['#a8ffea', '#4cc9f0'], biomes: [
    ['CORAL REEF LAGOON', '🪸', '#e8837a', 'coral', 'water', ['Coral', 'Ocean', 'Water'], '🦪', 'Pearl'],
    ['KELP FOREST DEPTHS', '🌿', '#2d7d5a', 'kelp', 'water', ['Water', 'Ocean', 'Moss'], '🌿', 'Kelp Bundle'],
    ['SUNKEN TEMPLE', '🏛️', '#5ba8a0', 'pillar', 'water', ['Ancient', 'Ocean', 'Warden'], '🔱', 'Trident Shard'],
    ['PRISMARINE MONUMENT', '💠', '#4fd1c5', 'crystal', 'water', ['Prism', 'Diamond', 'Ocean'], '💠', 'Sea Lantern'],
    ['GLOW SQUID TRENCH', '🦑', '#1f4a7a', 'coral', 'water', ['Shadow', 'Echo', 'Water'], '🦑', 'Glow Ink'],
    ['WARM OCEAN SHIPWRECK', '🚢', '#e0c17a', 'cactus', 'water', ['Ocean', 'Sun', 'Coral'], '🧭', 'Treasure Map'] ] },
  { name: 'THE CANDY REALM', icon: '🍭', sky: '#ff9ecb', night: '#3b0d2a', amb: ['#ffffff', '#ffd1f0', '#ffe66d'], biomes: [
    ['CANDY CLOUD KINGDOM', '🍭', '#ff8fab', 'lolly', null, ['Candy', 'Honey', 'Cherry'], '🍬', 'Candy Gem'],
    ['CHOCOLATE RIVER VALLEY', '🍫', '#7b4a2a', 'lolly', 'lava', ['Candy', 'Earth', 'Honey'], '🍫', 'Cocoa Bean'],
    ['GINGERBREAD VILLAGE', '🏠', '#c98a4a', 'pillar', null, ['Candy', 'Fire', 'Sun'], '🍪', 'Gingerbread'],
    ['ICE CREAM GLACIER', '🍦', '#fff1e6', 'spike', null, ['Frost', 'Candy', 'Glacier'], '🍦', 'Sprinkle'],
    ['JELLY SLIME SWAMP', '🟩', '#7ed957', 'mushroom', 'water', ['Swamp', 'Candy', 'Moss'], '🟩', 'Slime Ball'],
    ['COTTON CANDY SKIES', '☁️', '#ffc2e2', 'oak', null, ['Sky', 'Candy', 'Cherry'], '☁️', 'Cotton Puff'] ] },
  { name: 'THE CRYSTAL GEODE', icon: '💎', sky: '#4b1d7a', night: '#10041f', amb: ['#ff5ed2', '#7bf1ff', '#ffffff'], biomes: [
    ['AMETHYST GEODE CAVERN', '💜', '#8e5bd1', 'crystal', null, ['Crystal', 'Prism', 'Diamond'], '💜', 'Amethyst'],
    ['DIAMOND DEEPSLATE MINE', '💎', '#3b4458', 'crystal', 'lava', ['Diamond', 'Metal', 'Earth'], '💎', 'Diamond'],
    ['EMERALD TREASURE HOLLOW', '💚', '#2f8f5b', 'crystal', null, ['Emerald', 'Earth', 'Nature'], '💚', 'Emerald'],
    ['ECHO ANCIENT CITY', '🔊', '#1a2b3d', 'pillar', null, ['Echo', 'Warden', 'Ancient'], '🔊', 'Echo Shard'],
    ['DRIPSTONE CAVES', '🦇', '#8a6a4f', 'spike', 'water', ['Dripstone', 'Earth', 'Shadow'], '🦇', 'Dripstone Tip'],
    ['LUSH GLOW BERRY CAVES', '🍇', '#55a860', 'mushroom', 'water', ['Nature', 'Moss', 'Jungle'], '🫐', 'Glow Berry'] ] },
  { name: 'THE BADLANDS', icon: '🏺', sky: '#d9742e', night: '#2a1204', amb: ['#ffd166', '#ff9f1c'], biomes: [
    ['TERRACOTTA MESA', '🏺', '#c9703c', 'cactus', null, ['Desert', 'Earth', 'Sun'], '🏺', 'Clay Pot'],
    ['GOLD MINESHAFT CANYON', '⛏️', '#d4a640', 'pillar', null, ['Metal', 'Earth', 'Sun'], '🪙', 'Gold Nugget'],
    ['ERUPTING VOLCANO PEAK', '🌋', '#6b2b1f', 'pillar', 'lava', ['Lava', 'Fire', 'Phoenix'], '🌋', 'Magma Core'],
    ['CLOCKWORK STEEL FORGE', '⚙️', '#8d99ae', 'pillar', 'lava', ['Metal', 'Thunder', 'Storm'], '⚙️', 'Giant Gear'],
    ['SAVANNA ACACIA PLAINS', '🦁', '#c8b04a', 'oak', null, ['Sun', 'Earth', 'Nature'], '🦁', 'Lion Tooth'],
    ['PETRIFIED FOSSIL BED', '🦴', '#bfae8a', 'bone', null, ['Ancient', 'Dripstone', 'Desert'], '🦴', 'Fossil'] ] },
  { name: 'THE WITHER WASTES', icon: '💀', sky: '#2b2b3a', night: '#08080c', amb: ['#8d99ae', '#ffffff'], biomes: [
    ['HAUNTED DARK FOREST', '🌲', '#2a3a2a', 'spruce', null, ['Shadow', 'Wither', 'Swamp'], '👻', 'Ghost Wisp'],
    ['MISTY SWAMP HOLLOW', '🐸', '#4f7a3a', 'mushroom', 'water', ['Swamp', 'Moss', 'Water'], '🍄', 'Swamp Mushroom'],
    ['WOODLAND MANSION', '🏚️', '#5a4636', 'pillar', null, ['Ancient', 'Shadow', 'Warden'], '🗝️', 'Old Key'],
    ['PILLAGER OUTPOST', '🗼', '#6b6b6b', 'pillar', null, ['Metal', 'Shadow', 'Thunder'], '🗼', 'Banner'],
    ['SKELETON GRAVEYARD', '☠️', '#8a8a96', 'bone', null, ['Wither', 'Ancient', 'Moon'], '☠️', 'Skull'],
    ['DEEP DARK SCULK HOLLOW', '👁️', '#0f3a4a', 'crystal', null, ['Warden', 'Echo', 'Void'], '👁️', 'Sculk Catalyst'] ] },
  { name: 'THE LOST REALM', icon: '🌌', sky: '#1d2a6b', night: '#050818', amb: ['#ffd166', '#06d6a0', '#ffffff'], stars: true, biomes: [
    ['STARFALL COSMIC ISLE', '⭐', '#7b5bd1', 'crystal', 'void', ['Cosmic', 'Moon', 'Phoenix'], '⭐', 'Star Core'],
    ['MOON DUST CRATERS', '🌙', '#c9c9d6', 'spike', null, ['Moon', 'Cosmic', 'Aurora'], '🌙', 'Moon Rock'],
    ['SOLAR FLARE FORGE', '☀️', '#f08a24', 'pillar', 'lava', ['Sun', 'Phoenix', 'Fire'], '☀️', 'Sun Shard'],
    ['NORTHERN LIGHTS SUMMIT', '🌌', '#5ad1b4', 'spike', null, ['Aurora', 'Frost', 'Cosmic'], '🌌', 'Aurora Orb'],
    ['REDSTONE CIRCUIT CITADEL', '🔴', '#8a2a2a', 'pillar', null, ['Redstone', 'Storm', 'Metal'], '🔴', 'Redstone Core'],
    ['THE FINAL FRONTIER', '🚀', '#3a4a7a', 'crystal', 'void', ['Quantum', 'Cosmic', 'Void'], '🚀', 'Warp Engine'] ] }
];
const BIOME_ADJ = ['', 'ANCIENT', 'ENCHANTED', 'HAUNTED', 'FLOATING', 'SHATTERED', 'ROYAL', 'MYSTIC', 'FORGOTTEN', 'GLOWING', 'WILD', 'STORMY', 'GIANT', 'HIDDEN', 'CURSED', 'LEGENDARY', 'FROZEN', 'BLAZING', 'SPARKLING', 'ENDLESS'];

function dimOfIsland(i) { return Math.floor(i / ISLANDS_PER_DIM) % DIMS.length; }

const _biomeCache = new Map();
function biomeAt(i) {
  i = Math.max(0, Math.floor(Number(i)) || 0);
  if (_biomeCache.has(i)) return _biomeCache.get(i);
  const dimIdx = dimOfIsland(i);
  const lap = Math.floor(i / (ISLANDS_PER_DIM * DIMS.length));
  const dim = DIMS[dimIdx];
  const t = dim.biomes[i % ISLANDS_PER_DIM];
  const r = rng(hashInt(i, 31337));
  const adj = lap === 0 ? '' : BIOME_ADJ[1 + ((lap * 7 + dimIdx) % (BIOME_ADJ.length - 1))];
  const kinds = ['collect', 'combo', 'collect', 'single', 'collect', 'combo'];
  const kind = i === 0 ? 'single' : kinds[Math.floor(r() * kinds.length)];
  const n = kind === 'single' ? 1 : kind === 'combo' ? 3 + Math.min(2, lap + Math.floor(r() * 2)) : 3 + Math.floor(r() * 3);
  const focusOpts = ['mixed', 'math', 'english', 'science', 'mixed'];
  const focus = i === 0 ? 'mixed' : focusOpts[Math.floor(r() * focusOpts.length)];
  const fl = { math: ' (math!)', english: ' (English!)', science: ' (science!)', mixed: '' }[focus];
  const noun = t[7];
  const goal = { kind, n, icon: t[6], noun, focus, verb: 'Power up the ' + noun };
  goal.short = kind === 'single' ? `Mine the ${noun}` : kind === 'collect' ? `Collect ${n} ${noun}s${fl}` : `Power up the ${noun}: ${n}-spell combo${fl}`;
  const tint = f => shadeHex(t[2], f);
  const b = {
    index: i, dim: dim.name, dimIdx, dimIcon: dim.icon, lap,
    title: (adj ? adj + ' ' : '') + t[0], icon: t[1], top: t[2], left: tint(0.72), right: tint(0.5),
    dirt: dimIdx === 1 || dimIdx === 7 ? '#3a2a2a' : dimIdx === 2 ? '#2c2540' : dimIdx === 4 ? '#6e6a5a' : '#7a5230',
    sky: dim.sky, water: dim.night, amb: dim.amb, clouds: !!dim.clouds, stars: !!dim.stars,
    deco: t[3], fluid: t[4], elems: t[5], goal,
    name: `ISLAND ${i + 1} • ${dim.icon} ${adj ? adj + ' ' : ''}${t[0]}`
  };
  if (i === 0) { b.guardId = 'sprout'; b.bossId = 'terra'; }
  else {
    const hard = Math.min(1, Math.floor(i / 8));
    b.guardId = pickIslandDragon(i, 1, t[5], 0, Math.min(2, 1 + hard));
    b.bossId = pickIslandDragon(i, 2, t[5], Math.min(3, 1 + hard), 4);
  }
  _biomeCache.set(i, b);
  return b;
}

// ---------------------------------------------------------------------------
// ISLAND LAYOUT: terrain heights, decorations and fluid pools (9x9, deterministic)
// ---------------------------------------------------------------------------
function islandLayout(i, size, pathTiles) {
  const b = biomeAt(i);
  const r = rng(hashInt(i, 555));
  const onPath = (x, y) => pathTiles.some(p => p.x === x && p.y === y);
  const nearPath = (x, y) => pathTiles.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) <= 1);
  // smooth value noise from random lattice
  const lat = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => r()));
  const noise = (x, y) => {
    const fx = x / (size - 1) * 3, fy = y / (size - 1) * 3;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const x1 = Math.min(3, x0 + 1), y1 = Math.min(3, y0 + 1);
    const a = lat[y0][x0] * (1 - tx) + lat[y0][x1] * tx, c = lat[y1][x0] * (1 - tx) + lat[y1][x1] * tx;
    return a * (1 - ty) + c * ty;
  };
  const h = [], fluid = [];
  for (let x = 0; x < size; x++) {
    h[x] = []; fluid[x] = [];
    for (let y = 0; y < size; y++) {
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
      let v = noise(x, y);
      let lvl = v > 0.72 ? 3 : v > 0.55 ? 2 : v > 0.38 ? 1 : 0;
      let fl = false;
      if (b.fluid && v < 0.2 && edge >= 1 && !nearPath(x, y)) fl = true;
      if (onPath(x, y)) { lvl = 0; fl = false; }
      else if (nearPath(x, y)) lvl = Math.min(lvl, 1);
      h[x][y] = lvl; fluid[x][y] = fl;
    }
  }
  const decos = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
    if (onPath(x, y) || fluid[x][y]) continue;
    if (r() < 0.2) decos.push({ x, y, kind: b.deco, v: r() });
  }
  return { h, fluid, decos };
}

// ---------------------------------------------------------------------------
// VOXEL DRAWING (isometric boxes with pixel-speckle textures)
// ---------------------------------------------------------------------------
function vxSpeckle(ctx, x, y, hw, hh, seed, col, n) {
  const r = rng(seed);
  const s = Math.max(2, Math.round(hw / 9));
  ctx.fillStyle = col;
  for (let k = 0; k < n; k++) {
    const u = r(), v = r();
    ctx.fillRect(Math.round(x + (u - v) * hw * 0.85 - s / 2), Math.round(y - hh + (u + v) * hh * 0.85 + hh * 0.08 - s / 2), s, s);
  }
}
function vxBox(ctx, x, y, hw, depth, top, left, right, o) {
  o = o || {};
  const hh = hw / 2;
  ctx.beginPath();
  ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath();
  ctx.fillStyle = top; ctx.fill();
  if (o.seed != null) {
    vxSpeckle(ctx, x, y, hw, hh, o.seed, shadeHex(top, 1.12), 9);
    vxSpeckle(ctx, x, y, hw, hh, o.seed + 9, shadeHex(top, 0.86), 9);
  }
  ctx.beginPath();
  ctx.moveTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + depth); ctx.lineTo(x - hw, y + depth); ctx.closePath();
  ctx.fillStyle = left; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + depth); ctx.lineTo(x + hw, y + depth); ctx.closePath();
  ctx.fillStyle = right; ctx.fill();
  if (o.cap) { // grass fringe on the sides
    const cd = Math.min(depth * 0.4, Math.max(3, hw * 0.2));
    ctx.fillStyle = shadeHex(o.cap, 0.72);
    ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + cd); ctx.lineTo(x - hw, y + cd); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shadeHex(o.cap, 0.52);
    ctx.beginPath(); ctx.moveTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + cd); ctx.lineTo(x + hw, y + cd); ctx.closePath(); ctx.fill();
  }
  if (o.seed != null && depth > 6) { // pixel speckles on the sides
    const rr = rng(o.seed + 77), sz = Math.max(2, Math.round(hw / 9));
    for (let k = 0; k < 6; k++) {
      const u = rr(), v = rr();
      ctx.fillStyle = k % 2 ? shadeHex(left, 0.8) : shadeHex(left, 1.18);
      ctx.fillRect(Math.round(x - hw + u * hw * 0.9), Math.round(y + u * hh + (o.cap ? depth * 0.4 : 0) + v * (depth * 0.6)), sz, sz);
      ctx.fillStyle = k % 2 ? shadeHex(right, 0.8) : shadeHex(right, 1.18);
      ctx.fillRect(Math.round(x + (1 - u) * hw * 0.9 - sz), Math.round(y + u * hh + (o.cap ? depth * 0.4 : 0) + (1 - v) * (depth * 0.6)), sz, sz);
    }
  }
}
function vxPoly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
// Decorations stand on a tile whose top-centre is (x,y); s = screen scale
function vxDeco(ctx, kind, x, y, s, v, time) {
  const box = (bx, by, hw, d, c) => vxBox(ctx, bx, by, hw * s, d * s, c, shadeHex(c, 0.72), shadeHex(c, 0.52));
  switch (kind) {
    case 'oak': case 'jungle': case 'cherry': {
      const big = kind === 'jungle' ? 1.35 : 1;
      const leaf = kind === 'cherry' ? '#f7a8c8' : kind === 'jungle' ? '#2e8b3d' : '#3f9b3f';
      box(x, y - 2 * s, 6 * big, 34 * big, '#6b4423');
      box(x, y - 34 * s * big, 21 * big, 14 * big, leaf);
      box(x, y - 46 * s * big, 14 * big, 12 * big, shadeHex(leaf, 1.1));
      break;
    }
    case 'spruce': {
      box(x, y - 2 * s, 5, 22, '#4e3420');
      box(x, y - 18 * s, 22, 10, '#2f6b45'); box(x, y - 30 * s, 15, 10, '#2f6b45'); box(x, y - 41 * s, 8, 10, '#e8f6ff');
      break;
    }
    case 'cactus': box(x, y - 2 * s, 6, 38 + v * 10, '#3c8d40'); box(x + 12 * s, y - 22 * s, 4, 14, '#3c8d40'); break;
    case 'mushroom': box(x, y - 2 * s, 6, 18, '#efe6d6'); box(x, y - 18 * s, 22, 11, v > 0.5 ? '#d62828' : '#b5651d'); break;
    case 'fungus': box(x, y - 2 * s, 6, 26, '#5b2a2a'); box(x, y - 26 * s, 21, 14, v > 0.5 ? '#c1121f' : '#1fa3a3'); break;
    case 'pillar': box(x, y - 2 * s, 13, 28 + v * 24, '#26203a'); box(x, y - (30 + v * 24) * s, 15, 5, '#7a4fd0'); break;
    case 'bone': box(x, y - 2 * s, 5, 22 + v * 8, '#e8e4d4'); box(x, y - (24 + v * 8) * s, 9, 5, '#e8e4d4'); break;
    case 'chorus': box(x, y - 2 * s, 5, 30, '#9b6bb5'); box(x + 10 * s, y - 24 * s, 5, 14, '#9b6bb5'); box(x, y - 32 * s, 8, 8, '#e0b6ff'); break;
    case 'spike': case 'crystal': {
      const col = kind === 'spike' ? '#cfeaff' : ['#b57bff', '#5ce1e6', '#ff7bd5', '#7bff9a'][Math.floor(v * 4)];
      const hgt = (30 + v * 26) * s, w = 12 * s, sway = Math.sin(time * 0.004 + x) * 1.5;
      vxPoly(ctx, [[x - w, y], [x + sway, y - hgt], [x, y + 4 * s]], shadeHex(col, 0.75));
      vxPoly(ctx, [[x + w, y], [x + sway, y - hgt], [x, y + 4 * s]], col);
      if (kind === 'crystal') { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14; vxPoly(ctx, [[x - 5 * s, y - 6 * s], [x + sway, y - hgt * 0.8], [x + 5 * s, y - 6 * s]], '#ffffffaa'); ctx.restore(); }
      break;
    }
    case 'coral': case 'kelp': {
      const col = kind === 'kelp' ? '#2e9d57' : ['#ff6f91', '#ffb347', '#a66cff', '#4dd0e1'][Math.floor(v * 4)];
      const sw = Math.sin(time * 0.004 + x) * 3 * s;
      box(x, y - 2 * s, 5, 20 + v * 12, col); box(x + 8 * s + sw, y - 14 * s, 4, 14, shadeHex(col, 1.15)); box(x - 8 * s - sw, y - 10 * s, 4, 10, shadeHex(col, 0.9));
      break;
    }
    case 'lolly': {
      box(x, y - 2 * s, 3, 30, '#fff'); ctx.beginPath(); ctx.arc(x, y - 38 * s, 13 * s, 0, 7);
      ctx.fillStyle = ['#ff5d8f', '#ffd166', '#4cc9f0', '#9b5de5'][Math.floor(v * 4)]; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(x, y - 38 * s, 7 * s, 0, 4.7); ctx.stroke();
      break;
    }
    default: box(x, y - 2 * s, 9, 12, '#7d8b99');
  }
}
