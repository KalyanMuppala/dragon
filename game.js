// ============================================================================
// DRAGONCRAFT: PRODIGY REALM — STEM RPG ENGINE FOR 9-YEAR-OLD INNOVATORS
// Combines Prodigy-style spell battles + Minecraft voxel exploration & crafting
// ============================================================================

const STORAGE_KEY = 'dragoncraft_stem_profiles_v1';
const ACTIVE_USER_KEY = 'dragoncraft_stem_active_user_v1';

// --- WEB AUDIO SYNTHESIZER (Zero external audio file dependencies) ---
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, delay = 0, vol = 0.12) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {}
  }
  spellSuccess() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, 'triangle', 0.18, i * 0.07, 0.15));
  }
  spellMiss() {
    [300, 220].forEach((f, i) => this.playTone(f, 'sawtooth', 0.22, i * 0.12, 0.1));
  }
  chestOpen() {
    [440, 554.37, 659.25, 880, 1108.73, 1318.5].forEach((f, i) => this.playTone(f, 'triangle', 0.22, i * 0.08, 0.16));
  }
  levelUp() {
    [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, 'square', 0.2, i * 0.09, 0.12));
  }
  mineBlock() {
    this.playTone(620, 'square', 0.08, 0, 0.1);
    this.playTone(880, 'triangle', 0.1, 0.06, 0.12);
  }
}

const sfx = new SoundFX();

// --- DRAGONS CATALOG ---
const DRAGONS = [
  {
    id: 'ignis',
    name: 'Ignis the Magma Drake',
    element: 'Fire / Thermal',
    rarity: 'Common',
    primary: '#ef476f',
    secondary: '#ffd166',
    hornColor: '#ff9f1c',
    baseHp: 110,
    power: 22,
    lore: 'Forged inside Redstone volcanoes! Uses multiplication heatwaves to melt obsidian.',
    unlockHint: 'Starter / Emerald Woods'
  },
  {
    id: 'voltscale',
    name: 'Voltscale the Redstone Wyvern',
    element: 'Lightning / Circuits',
    rarity: 'Common',
    primary: '#00bbf9',
    secondary: '#fee440',
    hornColor: '#f15bb5',
    baseHp: 115,
    power: 24,
    lore: 'Powered by parallel Redstone circuits and fast division bolts.',
    unlockHint: 'Starter / Redstone Caverns'
  },
  {
    id: 'cryowing',
    name: 'Cryowing the Frostisk',
    element: 'Ice / States of Matter',
    rarity: 'Common',
    primary: '#4cc9f0',
    secondary: '#e0fbfc',
    hornColor: '#7209b7',
    baseHp: 120,
    power: 21,
    lore: 'Freezes water molecules into crystalline hexagonal fractions!',
    unlockHint: 'Starter / Crystal Peaks'
  },
  {
    id: 'terrahorn',
    name: 'Terrahorn the Emerald Guardian',
    element: 'Earth / Geometry',
    rarity: 'Rare',
    primary: '#06d6a0',
    secondary: '#b7efc5',
    hornColor: '#ffd166',
    baseHp: 145,
    power: 28,
    lore: 'Shapes perfect cubic voxel fortresses using perimeter and area formulas.',
    unlockHint: 'Tame in Emerald Voxel Woods'
  },
  {
    id: 'nebulon',
    name: 'Nebulon the Cosmic Wyrm',
    element: 'Gravity / Astronomy',
    rarity: 'Rare',
    primary: '#9b5de5',
    secondary: '#f15bb5',
    hornColor: '#00f5d4',
    baseHp: 165,
    power: 32,
    lore: 'Orbits distant exoplanets and bends starlight with algebraic equations.',
    unlockHint: 'Tame in Redstone Caverns'
  },
  {
    id: 'solaria',
    name: 'Solaria the Sunstone Phoenix-Dragon',
    element: 'Solar / Photosynthesis',
    rarity: 'Epic',
    primary: '#ff9f1c',
    secondary: '#ffee32',
    hornColor: '#ef476f',
    baseHp: 190,
    power: 36,
    lore: 'Absorbs solar photons and converts light energy into golden shields.',
    unlockHint: 'Tame in Crystal Sky Citadel'
  },
  {
    id: 'hydracoil',
    name: 'Hydracoil the Abyssal Leviathan',
    element: 'Hydro / Density & Pressure',
    rarity: 'Epic',
    primary: '#118ab2',
    secondary: '#06d6a0',
    hornColor: '#ffd166',
    baseHp: 215,
    power: 40,
    lore: 'Masters ocean currents, buoyancy, and multi-step fraction whirlpools.',
    unlockHint: 'Unlock via Gilded or Arcane Chest'
  },
  {
    id: 'enderbyte',
    name: 'Enderbyte the Quantum Dragon',
    element: 'Quantum / Coding Logic',
    rarity: 'Mythic',
    primary: '#7209b7',
    secondary: '#00f5d4',
    hornColor: '#ffd166',
    baseHp: 260,
    power: 48,
    lore: 'Supreme ruler of the Obsidian Citadel. Speaks pure binary, logic gates, and order of operations!',
    unlockHint: 'Boss of Obsidian Ender Keep / Mythic Chest'
  }
];

// --- CHEST TYPES ---
const CHEST_TYPES = [
  {
    id: 'oak',
    name: 'Voxel Crafter Chest',
    rarity: 'common',
    rarityLabel: 'Common Surprise',
    costPoints: 120,
    colorTop: '#c97a3e',
    colorBase: '#8c4f20',
    trim: '#ffd166',
    desc: 'Packed with Voxel Ores, Dragon Berries, +50–120 Game Points, and STEM Collector Cards!'
  },
  {
    id: 'gilded',
    name: 'Gilded Prodigy Chest',
    rarity: 'rare',
    rarityLabel: 'Rare Surprise',
    costPoints: 260,
    colorTop: '#ffd166',
    colorBase: '#d9822b',
    trim: '#06d6a0',
    desc: 'Contains Rare Wizard Relics, high-tier Voxel Diamonds, +150–300 Points, and Rare Dragon Eggs!'
  },
  {
    id: 'arcane',
    name: 'Redstone Arcane Chest',
    rarity: 'epic',
    rarityLabel: 'Epic Surprise',
    costPoints: 450,
    colorTop: '#ef476f',
    colorBase: '#7209b7',
    trim: '#00f5d4',
    desc: 'Charged with Redstone magic! High chance of Epic Dragons, Netherite Wands, and +350 Points!'
  },
  {
    id: 'mythic',
    name: 'Mythic Dragon Egg Chest',
    rarity: 'mythic',
    rarityLabel: 'Mythic Surprise',
    costPoints: 750,
    colorTop: '#5a189a',
    colorBase: '#240046',
    trim: '#ffd166',
    desc: 'Ultimate prize chest! Guarantees Mythic Gear, Elder Dragon Evolution Stones, or Enderbyte Shards!'
  }
];

// --- SURPRISE COLLECTIBLES & RELICS ---
const SURPRISE_ITEMS = [
  { id: 'pickaxe_diamond', name: 'Diamond Equation Pickaxe', icon: '⛏️', bonus: '+15% Voxel Ore Mining', fact: 'STEM Fact: Diamonds are made of pure carbon atoms arranged in a super-strong crystal lattice!' },
  { id: 'wand_redstone', name: 'Redstone Capacitor Wand', icon: '🪄', bonus: '+10 Spell Crit Power', fact: 'STEM Fact: An electrical circuit needs a closed loop for electrons to flow from negative to positive!' },
  { id: 'crown_prime', name: 'Crown of Prime Numbers', icon: '👑', bonus: '+20% Game Points per Battle', fact: 'STEM Fact: 2 is the only even prime number in the entire universe!' },
  { id: 'wings_elytra', name: 'Aether Dragon Elytra Wings', icon: '🦋', bonus: 'Fast Map Gliding', fact: 'STEM Fact: Airplane and dragon wings create "lift" because air moves faster over the curved top surface!' },
  { id: 'shield_obsidian', name: 'Obsidian Bastion Shield', icon: '🛡️', bonus: '+25 Max Hero HP', fact: 'STEM Fact: Real obsidian is volcanic glass formed when lava cools super rapidly!' },
  { id: 'compass_magnet', name: 'Lodestone Magnetic Compass', icon: '🧭', bonus: 'Reveals Hidden Chests', fact: 'STEM Fact: Earth itself acts like a giant bar magnet because of liquid iron swirling in its outer core!' },
  { id: 'visor_quantum', name: 'Ender Logic Goggles', icon: '🥽', bonus: 'Free Hint in Every Battle', fact: 'STEM Fact: Computers think using billions of tiny switches called transistors that flip between 0 and 1!' },
  { id: 'orb_galaxy', name: 'Nebula Starlight Orb', icon: '🔮', bonus: '+25% Dragon Taming Chance', fact: 'STEM Fact: Light from the Sun takes about 8 minutes and 20 seconds to travel 93 million miles to Earth!' }
];

// --- ACHIEVEMENTS (Every single achievement grants a Free Surprise Chest!) ---
const ACHIEVEMENTS = [
  { id: 'first_spell', title: 'Apprentice Spellcaster', icon: '⚡', desc: 'Solve your very first STEM spell equation in battle.', chestReward: 'oak', check: p => p.stats.correctAnswers >= 1 },
  { id: 'streak_5', title: '5x Prodigy Streak!', icon: '🔥', desc: 'Solve 5 STEM challenges in a row without a miss.', chestReward: 'gilded', check: p => p.stats.bestStreak >= 5 },
  { id: 'streak_10', title: 'Grandmaster of Equations', icon: '🌟', desc: 'Reach an unstoppable 10x answer streak!', chestReward: 'arcane', check: p => p.stats.bestStreak >= 10 },
  { id: 'dragon_tamer', title: 'Dragon Whisperer', icon: '🐉', desc: 'Collect or tame 3 different Elemental Dragons.', chestReward: 'gilded', check: p => p.dragons.length >= 3 },
  { id: 'dragon_master', title: 'Lord of the Dragon Sanctuary', icon: '👑', desc: 'Collect 6 or more Elemental Dragons in your Codex.', chestReward: 'mythic', check: p => p.dragons.length >= 6 },
  { id: 'voxel_miner', title: 'Master Voxel Miner', icon: '⛏️', desc: 'Mine 10 glowing STEM Ore Blocks across the world map.', chestReward: 'oak', check: p => p.stats.blocksMined >= 10 },
  { id: 'chest_hunter', title: 'Treasure Chest Explorer', icon: '🎁', desc: 'Unbox 5 Surprise Treasure Chests.', chestReward: 'gilded', check: p => p.stats.chestsOpened >= 5 },
  { id: 'level_3', title: 'Rising Sky Crafter (Lv. 3)', icon: '🚀', desc: 'Reach Hero Level 3 through STEM mastery.', chestReward: 'gilded', check: p => p.level >= 3 },
  { id: 'level_5', title: 'Arcane STEM Champion (Lv. 5)', icon: '💎', desc: 'Reach Hero Level 5 and unlock the Crystal Citadel.', chestReward: 'arcane', check: p => p.level >= 5 },
  { id: 'dragon_evolver', title: 'Dragon Evolutionist', icon: '🧬', desc: 'Evolve any Dragon to Stage 2 (Elder Form) in the Sanctuary.', chestReward: 'arcane', check: p => Object.values(p.dragonLevels || {}).some(v => v >= 2) },
  { id: 'architect_craft', title: 'Voxel STEM Architect', icon: '🏰', desc: 'Craft 3 Voxel Monuments using mined blocks.', chestReward: 'gilded', check: p => (p.craftedBuilds || []).length >= 3 },
  { id: 'stem_25', title: '25 Brain-Power Victories', icon: '🧠', desc: 'Solve 25 total STEM equations and science puzzles.', chestReward: 'mythic', check: p => p.stats.correctAnswers >= 25 }
];

// --- VOXEL CRAFTING PROJECTS ---
const CRAFT_PROJECTS = [
  { id: 'beacon_math', name: 'Redstone Math Beacon', icon: '🚨', req: { emerald: 3, redstone: 3 }, rewardPoints: 200, desc: 'Boosts all spell damage by +10% permanently!' },
  { id: 'incubator_egg', name: 'Thermal Dragon Egg Incubator', icon: '🥚', req: { diamond: 2, gold: 4 }, rewardPoints: 250, desc: 'Hatches a free Gilded Prodigy Chest immediately!' },
  { id: 'observatory', name: 'Galactic Voxel Observatory', icon: '🔭', req: { emerald: 4, diamond: 3, amethyst: 2 }, rewardPoints: 350, desc: 'Unlocks Cosmic Starlight bonus (+15 XP per problem)!' },
  { id: 'throne_ender', name: 'Obsidian Dragon Portal', icon: '🌌', req: { diamond: 5, redstone: 5, amethyst: 4 }, rewardPoints: 600, desc: 'Summons a Mythic Dragon Egg Chest + +600 Game Points!' }
];

// --- REALMS / BIOMES ---
const REALMS = [
  { id: 0, name: 'Emerald Voxel Woods', icon: '🌲', minLevel: 1, bg: '#132a1e', gridColor: '#1f4430', dragonPool: ['ignis', 'terrahorn', 'cryowing'] },
  { id: 1, name: 'Redstone Magma Caverns', icon: '🌋', minLevel: 2, bg: '#2b1216', gridColor: '#4a1e24', dragonPool: ['ignis', 'voltscale', 'nebulon'] },
  { id: 2, name: 'Crystal Sky Citadel', icon: '💎', minLevel: 4, bg: '#112238', gridColor: '#1e3c62', dragonPool: ['cryowing', 'solaria', 'hydracoil'] },
  { id: 3, name: 'Obsidian Ender Keep', icon: '🌌', minLevel: 6, bg: '#1a0f2e', gridColor: '#321c57', dragonPool: ['nebulon', 'solaria', 'enderbyte'] }
];

// --- SVG GENERATORS FOR POLISHED ILLUSTRATIONS ---
function renderDragonSVG(dragon, size = 180, isFlipped = false) {
  const flip = isFlipped ? 'transform="scale(-1,1) translate(-200,0)"' : '';
  return `
  <svg viewBox="0 0 200 170" width="${size}" height="${Math.round(size * 0.85)}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow_${dragon.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${dragon.secondary}" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="${dragon.primary}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="body_${dragon.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${dragon.primary}"/>
        <stop offset="100%" stop-color="#191f3a"/>
      </linearGradient>
    </defs>
    <g ${flip}>
      <!-- Magical Aura -->
      <circle cx="100" cy="95" r="72" fill="url(#glow_${dragon.id})"/>
      <!-- Back Wing -->
      <path d="M85 80 L30 22 L52 68 L22 58 L55 92 Z" fill="${dragon.secondary}" opacity="0.75" stroke="#fff" stroke-width="1.5"/>
      <!-- Tail with Voxel Spikes -->
      <path d="M70 125 Q30 140 18 110 Q32 122 58 112 Z" fill="url(#body_${dragon.id})" stroke="${dragon.secondary}" stroke-width="2"/>
      <polygon points="20,112 10,102 26,105" fill="${dragon.hornColor}"/>
      <!-- Voxel-styled Dragon Body & Chest Plates -->
      <rect x="65" y="72" width="58" height="58" rx="16" fill="url(#body_${dragon.id})" stroke="${dragon.secondary}" stroke-width="2.5"/>
      <rect x="85" y="82" width="32" height="40" rx="8" fill="${dragon.secondary}" opacity="0.85"/>
      <line x1="85" y1="95" x2="117" y2="95" stroke="#111" stroke-width="2"/>
      <line x1="85" y1="108" x2="117" y2="108" stroke="#111" stroke-width="2"/>
      <!-- Front Wing -->
      <path d="M96 86 L45 15 L72 65 L35 45 L72 95 Z" fill="${dragon.primary}" stroke="${dragon.secondary}" stroke-width="2.5"/>
      <!-- Dragon Neck & Head -->
      <rect x="102" y="38" width="46" height="40" rx="11" fill="url(#body_${dragon.id})" stroke="${dragon.secondary}" stroke-width="2.5"/>
      <!--Snout & Jaw -->
      <rect x="135" y="48" width="28" height="24" rx="7" fill="${dragon.primary}" stroke="${dragon.secondary}" stroke-width="2"/>
      <!-- Voxel Horns -->
      <polygon points="108,38 92,14 120,34" fill="${dragon.hornColor}" stroke="#fff" stroke-width="1"/>
      <polygon points="122,36 114,10 134,34" fill="${dragon.secondary}" stroke="#fff" stroke-width="1"/>
      <!-- Glowing Eye -->
      <rect x="128" y="46" width="11" height="9" rx="3" fill="#fff"/>
      <rect x="132" y="48" width="6" height="6" rx="2" fill="${dragon.hornColor}"/>
      <!-- Elemental Breath Spark -->
      <circle cx="174" cy="58" r="9" fill="${dragon.secondary}" opacity="0.9"/>
      <polygon points="164,58 188,48 180,62 194,66 168,66" fill="${dragon.hornColor}"/>
      <!-- Claws / Feet -->
      <rect x="72" y="126" width="18" height="12" rx="4" fill="${dragon.hornColor}"/>
      <rect x="104" y="126" width="18" height="12" rx="4" fill="${dragon.hornColor}"/>
    </g>
  </svg>`;
}

function renderHeroSVG(heroClass = 'mage', size = 175) {
  const colors = {
    mage: { robe: '#9b5de5', trim: '#ffd166', orb: '#00f5d4' },
    knight: { robe: '#118ab2', trim: '#06d6a0', orb: '#ffd166' },
    alchemist: { robe: '#06d6a0', trim: '#f15bb5', orb: '#ffee32' },
    ranger: { robe: '#ef476f', trim: '#ffd166', orb: '#4cc9f0' }
  }[heroClass] || { robe: '#9b5de5', trim: '#ffd166', orb: '#00f5d4' };

  return `
  <svg viewBox="0 0 180 170" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${colors.orb}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${colors.robe}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="90" cy="95" r="65" fill="url(#heroGlow)"/>
    <!-- Cape -->
    <path d="M58 75 L34 142 L88 135 Z" fill="${colors.trim}" opacity="0.8"/>
    <!-- Voxel Body Armor -->
    <rect x="62" y="74" width="48" height="56" rx="8" fill="${colors.robe}" stroke="${colors.trim}" stroke-width="3"/>
    <!-- Belt & Rune Buckle -->
    <rect x="62" y="106" width="48" height="10" fill="#1b2442"/>
    <rect x="80" y="104" width="12" height="14" rx="2" fill="${colors.trim}"/>
    <!-- Voxel Head -->
    <rect x="66" y="34" width="40" height="38" rx="7" fill="#ffcdb2" stroke="#2b1d14" stroke-width="2.5"/>
    <!-- Eyes -->
    <rect x="74" y="48" width="7" height="9" rx="2" fill="#141b2d"/>
    <rect x="92" y="48" width="7" height="9" rx="2" fill="#141b2d"/>
    <rect x="75" y="49" width="3" height="3" fill="#fff"/>
    <rect x="93" y="49" width="3" height="3" fill="#fff"/>
    <!-- Wizard Hat / Voxel Helm -->
    <polygon points="48,38 124,38 86,4" fill="${colors.robe}" stroke="${colors.trim}" stroke-width="3"/>
    <!-- Magic Staff / Voxel Wand -->
    <line x1="130" y1="36" x2="122" y2="142" stroke="#c97a3e" stroke-width="7" stroke-linecap="round"/>
    <circle cx="132" cy="30" r="14" fill="${colors.orb}" stroke="#fff" stroke-width="2.5"/>
    <polygon points="132,12 137,26 148,30 137,35 132,48 127,35 116,30 127,26" fill="#fff" opacity="0.85"/>
    <!-- Boots -->
    <rect x="66" y="130" width="16" height="14" rx="4" fill="#2b3863" stroke="${colors.trim}" stroke-width="2"/>
    <rect x="90" y="130" width="16" height="14" rx="4" fill="#2b3863" stroke="${colors.trim}" stroke-width="2"/>
  </svg>`;
}

function renderChestSVG(chest, isOpen = false) {
  const lidOffset = isOpen ? 'transform="translate(0,-18) rotate(-12 60 40)"' : '';
  return `
  <svg viewBox="0 0 120 110" width="120" height="110" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="chestGlow_${chest.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${chest.trim}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${chest.colorBase}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="52" fill="url(#chestGlow_${chest.id})"/>
    <!-- Chest Base -->
    <rect x="20" y="52" width="80" height="44" rx="8" fill="${chest.colorBase}" stroke="${chest.trim}" stroke-width="3.5"/>
    <line x1="38" y1="52" x2="38" y2="96" stroke="${chest.trim}" stroke-width="3"/>
    <line x1="82" y1="52" x2="82" y2="96" stroke="${chest.trim}" stroke-width="3"/>
    ${isOpen ? `<ellipse cx="60" cy="52" rx="34" ry="12" fill="#fff3b0"/><polygon points="60,18 68,42 90,42 72,54 78,76 60,62 42,76 48,54 30,42 52,42" fill="#ffd166"/>` : ''}
    <!-- Chest Lid -->
    <g ${lidOffset}>
      <path d="M18 52 Q60 20 102 52 Z" fill="${chest.colorTop}" stroke="${chest.trim}" stroke-width="3.5"/>
      <rect x="18" y="44" width="84" height="12" rx="4" fill="${chest.colorTop}" stroke="${chest.trim}" stroke-width="3"/>
      <!-- Crystal Lock -->
      <rect x="51" y="43" width="18" height="22" rx="5" fill="${chest.trim}" stroke="#111" stroke-width="2"/>
      <circle cx="60" cy="54" r="4" fill="#00f5d4"/>
    </g>
  </svg>`;
}

// --- STEM PROBLEM GENERATOR ENGINE (Elementary Grade 3-5 / Age 9 Focus) ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumericOptions(correct, spread = 6) {
  const set = new Set([String(correct)]);
  while (set.size < 4) {
    const delta = randInt(1, spread) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = Number(correct) + delta;
    if (candidate >= 0) set.add(String(candidate));
  }
  return shuffleArray([...set]);
}

function generateSTEMQuestion(topicFilter = 'all', gradeLevel = '4') {
  const topics = ['equations', 'multiplication', 'geometry', 'fractions', 'science', 'logic'];
  const chosenTopic = topicFilter === 'all' ? topics[randInt(0, topics.length - 1)] : topicFilter;
  const scale = gradeLevel === '3' ? 0.75 : gradeLevel === '5' ? 1.35 : 1;

  if (chosenTopic === 'equations') {
    const x = randInt(2, Math.round(9 * scale));
    const a = randInt(2, 6);
    const b = randInt(3, 15);
    const total = a * x + b;
    const ans = String(x);
    return {
      category: '🔮 Algebraic Dragon Equation',
      prompt: `Solve for the Mystery Dragon Rune (🐉):  ${a} × 🐉 + ${b} = ${total}`,
      visual: `Scale Hint: Subtract ${b} from ${total} first (${total} - ${b} = ${total - b}), then divide by ${a}!`,
      hint: `Step 1: ${total} - ${b} = ${total - b}. Step 2: What times ${a} equals ${total - b}?`,
      correct: ans,
      options: makeNumericOptions(x, 4)
    };
  }

  if (chosenTopic === 'multiplication') {
    const isDiv = Math.random() > 0.45;
    const a = randInt(3, Math.round(11 * scale));
    const b = randInt(3, 9);
    if (!isDiv) {
      const prod = a * b;
      return {
        category: '⚡ Power Array Multiplication',
        prompt: `Your dragon fires ${a} volleys of ${b} Redstone fireballs each. How many fireballs in total? (${a} × ${b})`,
        visual: `Voxel Grid: ${a} rows of ${b} blocks = ${a} × ${b}`,
        hint: `Break it apart! (${a} × ${b - 1}) + ${a} = ${prod}`,
        correct: String(prod),
        options: makeNumericOptions(prod, 8)
      };
    } else {
      const prod = a * b;
      return {
        category: '💎 Crystal Division Split',
        prompt: `You mined ${prod} Mana Emeralds and share them equally among ${b} Dragons. How many emeralds does each get? (${prod} ÷ ${b})`,
        visual: `Think inverse: ${b} × ? = ${prod}`,
        hint: `Count by ${b}s until you reach ${prod}, or recall ${b} × ${a} = ${prod}!`,
        correct: String(a),
        options: makeNumericOptions(a, 5)
      };
    }
  }

  if (chosenTopic === 'geometry') {
    const isArea = Math.random() > 0.45;
    const w = randInt(4, 12);
    const h = randInt(3, 10);
    if (isArea) {
      const area = w * h;
      return {
        category: '🏰 Minecraft Voxel Architecture (Area)',
        prompt: `You build a rectangular Dragon Sanctuary floor that is ${w} blocks long and ${h} blocks wide. What is the Area in square blocks?`,
        visual: `📐 Area Formula: Length × Width (${w} × ${h})`,
        hint: `Multiply length (${w}) by width (${h}) to count all floor blocks inside!`,
        correct: String(area),
        options: makeNumericOptions(area, 8)
      };
    } else {
      const perim = 2 * (w + h);
      return {
        category: '🛡️ Voxel Fortress Fence (Perimeter)',
        prompt: `A Dragon Hatchery is ${w} blocks long and ${h} blocks wide. How many fence blocks do you need to go all the way around its Perimeter?`,
        visual: `📐 Perimeter = ${w} + ${h} + ${w} + ${h}`,
        hint: `Add Length + Width (${w} + ${h} = ${w + h}), then double it!`,
        correct: String(perim),
        options: makeNumericOptions(perim, 6)
      };
    }
  }

  if (chosenTopic === 'fractions') {
    const denoms = [4, 6, 8, 10];
    const d = denoms[randInt(0, denoms.length - 1)];
    const n1 = randInt(1, d - 2);
    const n2 = randInt(1, d - n1);
    const sum = `${n1 + n2}/${d}`;
    const opts = new Set([sum, `${n1 + n2}/${d * 2}`, `${Math.max(1, n1 + n2 - 1)}/${d}`, `${n1 + n2 + 1}/${d}`]);
    return {
      category: '🧪 Alchemist Potion Fractions',
      prompt: `To brew a Dragon Heal Elixir, you mix ${n1}/${d} bottle of Starlight Dew with ${n2}/${d} bottle of Phoenix Nectar. How full is the bottle?`,
      visual: `Potion Slices: [${'🟦'.repeat(n1)}${'🟪'.repeat(n2)}${'⬜'.repeat(d - n1 - n2)}] (${d} equal parts)`,
      hint: `When denominators (bottom numbers) are the same (${d}), add the top numerators (${n1} + ${n2}) and keep ${d} on the bottom!`,
      correct: sum,
      options: shuffleArray([...opts])
    };
  }

  if (chosenTopic === 'logic') {
    constlogicBank = [
      {
        prompt: 'Redstone Pattern Lock! Find the next number in the dragon code:  4,  9,  14,  19,  ?',
        visual: 'Pattern Jump: +5 each step → 4 (+5) 9 (+5) 14 (+5) 19 (+5) ?',
        hint: 'Add 5 to 19!',
        correct: '24',
        options: ['22', '24', '25', '29']
      },
      {
        prompt: 'A Redstone AND Gate only opens the Dragon Vault if BOTH switches are ON (1). If Switch A = 1 and Switch B = 0, what happens?',
        visual: 'Logic Gate: [Switch A: ON] + [Switch B: OFF] ➔ [AND Gate]',
        hint: 'An AND gate requires BOTH inputs to be 1 (ON)!',
        correct: 'Vault stays CLOSED (0)',
        options: ['Vault stays CLOSED (0)', 'Vault OPENS (1)', 'Both switches break', 'It turns into water']
      },
      {
        prompt: 'Coding Loop Spell: If your Wizard runs "REPEAT 4 TIMES: [Move 3 blocks forward]", how many blocks does he move in total?',
        visual: 'Loop Trace: 3 + 3 + 3 + 3',
        hint: 'Multiply 4 repeats × 3 blocks per repeat!',
        correct: '12 blocks',
        options: ['7 blocks', '12 blocks', '9 blocks', '15 blocks']
      },
      {
        prompt: 'Double Growth Sequence! Find the missing Dragon Power level:  3,  6,  12,  24,  ?',
        visual: 'Multiplier Rule: Each number is multiplied by 2!',
        hint: 'What is 24 × 2?',
        correct: '48',
        options: ['36', '48', '30', '52']
      }
    ];
    const item = constlogicBank[randInt(0, constlogicBank.length - 1)];
    return {
      category: '🤖 Redstone Coding & Logic',
      prompt: item.prompt,
      visual: item.visual,
      hint: item.hint,
      correct: item.correct,
      options: shuffleArray(item.options)
    };
  }

  // Science bank (Physics, Earth, Space, Biology for 9yo)
  const scienceBank = [
    {
      prompt: 'When Ignis the Dragon heats solid ice cubes until they melt into liquid water and then boil into steam, what causes the change of state?',
      visual: '🧊 Solid Ice ➔ (+Heat Energy) ➔ 💧 Liquid Water ➔ (+Heat Energy) ➔ ☁️ Gas Steam',
      hint: 'Adding thermal (heat) energy makes molecules move faster!',
      correct: 'Adding thermal (heat) energy',
      options: ['Adding thermal (heat) energy', 'Removing gravity', 'Turning off magnetic poles', 'Freezing the atoms']
    },
    {
      prompt: 'Which planet in our Solar System is famous for its giant system of icy rings and dozens of moons?',
      visual: '☀️ Sun ➔ Mercury, Venus, Earth, Mars, Jupiter, 🪐 [Ringed Giant], Uranus, Neptune',
      hint: 'It is the 6th planet from the Sun!',
      correct: 'Saturn',
      options: ['Saturn', 'Mars', 'Mercury', 'Venus']
    },
    {
      prompt: 'Green plants in the Emerald Voxel Woods use sunlight, water, and carbon dioxide to make their own food. What is this process called?',
      visual: '☀️ Sunlight + 💧 Water + CO₂ ➔ 🌿 Plant Sugar + Oxygen',
      hint: '"Photo" means light, and "synthesis" means putting together!',
      correct: 'Photosynthesis',
      options: ['Photosynthesis', 'Condensation', 'hibernation', 'Magnetism']
    },
    {
      prompt: 'You use a long wooden plank balanced on a stone block (fulcrum) to lift a heavy Dragon Egg. Which simple machine are you using?',
      visual: '🪨 [Egg] ━━━━━━▲━━━━━━ ⬇️ [Push Down]',
      hint: 'A seesaw or crowbar is an example of this simple machine!',
      correct: 'A Lever',
      options: ['A Lever', 'A Pulley', 'A Wedge', 'A Gear']
    },
    {
      prompt: 'What invisible force pulls jumped Minecraft blocks and flying dragons back down toward the ground?',
      visual: '🐉 ⬇️ 🌍 Earth pulls objects toward its center',
      hint: 'Sir Isaac Newton studied this force when watching a falling apple!',
      correct: 'Gravity',
      options: ['Gravity', 'Friction', 'Static Electricity', 'Photosynthesis']
    },
    {
      prompt: 'When two magnets have their NORTH poles pushed directly toward each other (N ➡️ ⬅️ N), what happens?',
      visual: '🧲 [S | N]  ⚡  [N | S] 🧲',
      hint: 'Opposite poles attract, but LIKE poles push apart!',
      correct: 'They repel (push away from each other)',
      options: ['They repel (push away from each other)', 'They stick tightly together', 'They melt into lava', 'They lose all weight']
    }
  ];
  const sci = scienceBank[randInt(0, scienceBank.length - 1)];
  return {
    category: '🔬 Elemental STEM Science',
    prompt: sci.prompt,
    visual: sci.visual,
    hint: sci.hint,
    correct: sci.correct,
    options: shuffleArray(sci.options)
  };
}

// ============================================================================
// MAIN GAME STATE & CONTROLLER
// ============================================================================
class DragonCraftGame {
  constructor() {
    this.profiles = this.loadProfiles();
    this.player = null;
    this.selectedClass = 'mage';
    this.selectedStarter = 'ignis';

    // World Map state
    this.currentRealm = 0;
    this.gridCols = 16;
    this.gridRows = 10;
    this.heroPos = { x: 2, y: 5 };
    this.worldEntities = [];
    this.particles = [];

    // Battle state
    this.battle = {
      active: false,
      enemy: null,
      enemyHp: 100,
      enemyMaxHp: 100,
      heroHp: 120,
      heroMaxHp: 120,
      pendingSpell: null,
      currentQuestion: null,
      usedHint: false
    };

    this.initDOM();
    this.renderSavedProfiles();
  }

  loadProfiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  saveProfiles() {
    if (this.player) {
      this.profiles[this.player.username.toLowerCase()] = this.player;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
        localStorage.setItem(ACTIVE_USER_KEY, this.player.username.toLowerCase());
      } catch (e) {}
    }
  }

  createFreshProfile(username, pin, heroClass, starterDragon) {
    return {
      username,
      pin: pin || '1234',
      heroClass,
      level: 1,
      xp: 0,
      xpToNext: 100,
      points: 150, // Starter bonus points so he can open a chest or explore right away!
      streak: 0,
      activeDragon: starterDragon,
      dragons: [starterDragon],
      dragonLevels: { [starterDragon]: 1 },
      ores: { emerald: 2, redstone: 2, diamond: 1, gold: 2, amethyst: 1 },
      chestsOwned: { oak: 1, gilded: 0, arcane: 0, mythic: 0 }, // 1 Free Starter Surprise Chest!
      relics: [],
      achievements: [],
      craftedBuilds: [],
      settings: { grade: '4', topic: 'all' },
      stats: {
        correctAnswers: 0,
        totalAttempts: 0,
        bestStreak: 0,
        dragonsDefeated: 0,
        blocksMined: 0,
        chestsOpened: 0
      }
    };
  }

  initDOM() {
    // Class picker
    document.querySelectorAll('.class-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.class-option').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        this.selectedClass = el.dataset.class;
      });
    });

    // Starter dragon picker
    document.querySelectorAll('.dragon-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.dragon-option').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        this.selectedStarter = el.dataset.dragon;
      });
    });

    // Login button
    document.getElementById('btnStartAdventure').addEventListener('click', () => this.handleLogin());
    document.getElementById('btnQuickDemo').addEventListener('click', () => {
      document.getElementById('loginUsername').value = 'DragonMasterLeo';
      document.getElementById('loginPin').value = '7777';
      this.handleLogin();
    });

    // Nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // World Canvas & Controls
    this.canvas = document.getElementById('worldCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('click', e => this.handleCanvasClick(e));

    window.addEventListener('keydown', e => {
      if (!this.player || !document.getElementById('tab-world').classList.contains('active')) return;
      if (!document.getElementById('stemModal').classList.contains('hidden')) return;
      const keyMap = {
        ArrowUp: [0, -1], KeyW: [0, -1],
        ArrowDown: [0, 1], KeyS: [0, 1],
        ArrowLeft: [-1, 0], KeyA: [-1, 0],
        ArrowRight: [1, 0], KeyD: [1, 0]
      };
      if (keyMap[e.code]) {
        e.preventDefault();
        this.moveHero(keyMap[e.code][0], keyMap[e.code][1]);
      }
    });

    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (dir === 'up') this.moveHero(0, -1);
        if (dir === 'down') this.moveHero(0, 1);
        if (dir === 'left') this.moveHero(-1, 0);
        if (dir === 'right') this.moveHero(1, 0);
      });
    });

    // Battle Spells
    document.querySelectorAll('.spell-card').forEach(card => {
      card.addEventListener('click', () => this.initiateSpell(card.dataset.spell));
    });

    document.getElementById('btnNewWildDragon').addEventListener('click', () => this.spawnRandomBattle());
    document.getElementById('btnShowHint').addEventListener('click', () => this.showQuestionHint());
    document.getElementById('btnCloseStemModal').addEventListener('click', () => {
      document.getElementById('stemModal').classList.add('hidden');
    });

    document.getElementById('btnCloseSurprise').addEventListener('click', () => {
      document.getElementById('surpriseModal').classList.add('hidden');
    });

    document.getElementById('btnSoundToggle').addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      document.getElementById('btnSoundToggle').textContent = sfx.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    });

    document.getElementById('btnSwitchHero').addEventListener('click', () => {
      document.getElementById('loginOverlay').classList.remove('hidden');
      this.renderSavedProfiles();
    });

    // Parent / Curriculum settings
    document.getElementById('selectGradeLevel').addEventListener('change', e => {
      if (this.player) {
        this.player.settings.grade = e.target.value;
        this.saveProfiles();
        this.showToast(`📚 Curriculum tuned to Grade ${e.target.value} STEM!`);
      }
    });
    document.getElementById('selectTopicFocus').addEventListener('change', e => {
      if (this.player) {
        this.player.settings.topic = e.target.value;
        this.saveProfiles();
        this.showToast(`🎯 Spell Topic Filter updated!`);
      }
    });

    // Start animation loop
    requestAnimationFrame(() => this.animateWorldLoop());
  }

  renderSavedProfiles() {
    const list = document.getElementById('savedProfilesList');
    const keys = Object.keys(this.profiles);
    if (keys.length === 0) {
      document.getElementById('savedProfilesWrap').style.display = 'none';
      return;
    }
    document.getElementById('savedProfilesWrap').style.display = 'block';
    list.innerHTML = keys.map(k => {
      const p = this.profiles[k];
      return `<button class="profile-pill" data-user="${p.username}">🧙 ${p.username} (Lv.${p.level} • ⭐ ${p.points})</button>`;
    }).join('');
    list.querySelectorAll('.profile-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.user;
        const prof = this.profiles[u.toLowerCase()];
        if (prof) {
          document.getElementById('loginUsername').value = prof.username;
          document.getElementById('loginPin').value = prof.pin;
          this.handleLogin();
        }
      });
    });
  }

  handleLogin() {
    const rawName = document.getElementById('loginUsername').value.trim() || 'ProdigyCrafter';
    const pin = document.getElementById('loginPin').value.trim() || '1234';
    const key = rawName.toLowerCase();

    if (this.profiles[key]) {
      this.player = this.profiles[key];
      this.showToast(`✨ Welcome back, ${this.player.username}! Ready for Dragon STEM quests!`);
    } else {
      this.player = this.createFreshProfile(rawName, pin, this.selectedClass, this.selectedStarter);
      this.saveProfiles();
      this.showToast(`🎉 Hero Profile Created! Check your Chests Vault for a Free Starter Chest!`);
    }

    sfx.spellSuccess();
    document.getElementById('loginOverlay').classList.add('hidden');
    this.generateRealmEntities();
    this.spawnRandomBattle();
    this.updateAllUI();
  }

  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
    this.updateAllUI();
  }

  // --- WORLD MAP LOGIC ---
  generateRealmEntities() {
    this.worldEntities = [];
    const realm = REALMS[this.currentRealm];

    // Spawn 4 Wild Dragons on the map
    for (let i = 0; i < 4; i++) {
      const dId = realm.dragonPool[i % realm.dragonPool.length];
      this.worldEntities.push({
        type: 'dragon',
        dragonId: dId,
        x: randInt(3, this.gridCols - 2),
        y: randInt(1, this.gridRows - 2),
        label: DRAGONS.find(d => d.id === dId).name.split(' ')[0]
      });
    }

    // Spawn 6 STEM Voxel Ore Blocks
    const oreTypes = [
      { id: 'emerald', color: '#06d6a0', label: 'Emerald Ore' },
      { id: 'redstone', color: '#ef476f', label: 'Redstone Ore' },
      { id: 'diamond', color: '#4cc9f0', label: 'Diamond Ore' },
      { id: 'gold', color: '#ffd166', label: 'Gold Ore' },
      { id: 'amethyst', color: '#9b5de5', label: 'Amethyst Ore' }
    ];
    for (let i = 0; i < 6; i++) {
      const ore = oreTypes[i % oreTypes.length];
      this.worldEntities.push({
        type: 'ore',
        oreId: ore.id,
        color: ore.color,
        label: ore.label,
        x: randInt(1, this.gridCols - 2),
        y: randInt(1, this.gridRows - 2)
      });
    }

    // Spawn 2 Mystery World Chests
    for (let i = 0; i < 2; i++) {
      this.worldEntities.push({
        type: 'chest',
        x: randInt(4, this.gridCols - 2),
        y: randInt(1, this.gridRows - 2)
      });
    }
  }

  moveHero(dx, dy) {
    const nx = Math.max(0, Math.min(this.gridCols - 1, this.heroPos.x + dx));
    const ny = Math.max(0, Math.min(this.gridRows - 1, this.heroPos.y + dy));
    this.heroPos = { x: nx, y: ny };
    this.checkWorldCollision();
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const tileW = this.canvas.width / this.gridCols;
    const tileH = this.canvas.height / this.gridRows;
    const gx = Math.floor(cx / tileW);
    const gy = Math.floor(cy / tileH);

    const dx = Math.sign(gx - this.heroPos.x);
    const dy = Math.sign(gy - this.heroPos.y);
    if (dx !== 0 || dy !== 0) {
      this.heroPos.x = gx;
      this.heroPos.y = gy;
      this.checkWorldCollision();
    }
  }

  checkWorldCollision() {
    const idx = this.worldEntities.findIndex(ent => ent.x === this.heroPos.x && ent.y === this.heroPos.y);
    if (idx === -1) return;
    const ent = this.worldEntities[idx];

    if (ent.type === 'ore') {
      // Trigger quick STEM mining challenge!
      this.worldEntities.splice(idx, 1);
      this.openStemChallenge({
        mode: 'mine',
        oreId: ent.oreId,
        oreLabel: ent.label
      });
    } else if (ent.type === 'chest') {
      this.worldEntities.splice(idx, 1);
      this.openStemChallenge({
        mode: 'world_chest'
      });
    } else if (ent.type === 'dragon') {
      this.worldEntities.splice(idx, 1);
      this.spawnRandomBattle(ent.dragonId);
      this.switchTab('battle');
      this.showToast(`⚔️ Wild ${ent.label} appeared! Cast STEM Spells to battle or tame!`);
    }

    if (this.worldEntities.length <= 2) {
      this.generateRealmEntities();
    }
  }

  animateWorldLoop() {
    if (this.ctx && this.player) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const tileW = w / this.gridCols;
      const tileH = h / this.gridRows;
      const realm = REALMS[this.currentRealm];

      this.ctx.fillStyle = realm.bg;
      this.ctx.fillRect(0, 0, w, h);

      // Draw Voxel Grid
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          this.ctx.strokeStyle = realm.gridColor;
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(c * tileW, r * tileH, tileW, tileH);
          if ((r + c) % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.02)';
            this.ctx.fillRect(c * tileW, r * tileH, tileW, tileH);
          }
        }
      }

      const time = performance.now() * 0.004;

      // Draw Entities
      this.worldEntities.forEach(ent => {
        const px = ent.x * tileW + tileW / 2;
        const py = ent.y * tileH + tileH / 2 + Math.sin(time + ent.x) * 3;

        if (ent.type === 'ore') {
          this.ctx.fillStyle = ent.color;
          this.ctx.fillRect(px - 14, py - 14, 28, 28);
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(px - 14, py - 14, 28, 28);
          this.ctx.font = '14px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('💎', px, py + 5);
        } else if (ent.type === 'chest') {
          this.ctx.fillStyle = '#ffd166';
          this.ctx.fillRect(px - 15, py - 12, 30, 24);
          this.ctx.strokeStyle = '#8c4f20';
          this.ctx.lineWidth = 2.5;
          this.ctx.strokeRect(px - 15, py - 12, 30, 24);
          this.ctx.font = '18px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('🎁', px, py + 6);
        } else if (ent.type === 'dragon') {
          const dObj = DRAGONS.find(d => d.id === ent.dragonId) || DRAGONS[0];
          this.ctx.beginPath();
          this.ctx.arc(px, py, 19, 0, Math.PI * 2);
          this.ctx.fillStyle = dObj.primary;
          this.ctx.fill();
          this.ctx.lineWidth = 2.5;
          this.ctx.strokeStyle = dObj.secondary;
          this.ctx.stroke();
          this.ctx.font = '20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('🐉', px, py + 7);
        }
      });

      // Draw Player Hero + Companion Dragon
      const hx = this.heroPos.x * tileW + tileW / 2;
      const hy = this.heroPos.y * tileH + tileH / 2;

      this.ctx.beginPath();
      this.ctx.arc(hx, hy, 21, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffd166';
      this.ctx.fill();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#06d6a0';
      this.ctx.stroke();
      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🧙', hx, hy + 8);
    }
    requestAnimationFrame(() => this.animateWorldLoop());
  }

  // --- PRODIGY BATTLE ENGINE ---
  spawnRandomBattle(forceDragonId = null) {
    const realm = REALMS[this.currentRealm];
    const pool = realm.dragonPool;
    const chosenId = forceDragonId || pool[randInt(0, pool.length - 1)];
    const enemyTemplate = DRAGONS.find(d => d.id === chosenId) || DRAGONS[0];
    const levelScale = 1 + (this.player.level - 1) * 0.18;

    const maxEnemyHp = Math.round(enemyTemplate.baseHp * levelScale);
    const maxHeroHp = 120 + (this.player.level - 1) * 20 + (this.player.relics.includes('shield_obsidian') ? 25 : 0);

    this.battle = {
      active: true,
      enemy: enemyTemplate,
      enemyHp: maxEnemyHp,
      enemyMaxHp: maxEnemyHp,
      heroHp: maxHeroHp,
      heroMaxHp: maxHeroHp,
      pendingSpell: null,
      currentQuestion: null,
      usedHint: false
    };

    this.updateBattleUI();
  }

  updateBattleUI() {
    if (!this.battle.enemy || !this.player) return;
    const companion = DRAGONS.find(d => d.id === this.player.activeDragon) || DRAGONS[0];
    const compLv = (this.player.dragonLevels && this.player.dragonLevels[companion.id]) || 1;

    document.getElementById('heroBattleName').textContent = `${this.player.username} & ${companion.name.split(' ')[0]} (Lv.${compLv})`;
    document.getElementById('heroHpText').textContent = `${this.battle.heroHp} / ${this.battle.heroMaxHp} HP`;
    document.getElementById('heroHpBar').style.width = `${Math.max(0, (this.battle.heroHp / this.battle.heroMaxHp) * 100)}%`;

    document.getElementById('enemyBattleName').textContent = `Wild ${this.battle.enemy.name}`;
    document.getElementById('enemyHpText').textContent = `${this.battle.enemyHp} / ${this.battle.enemyMaxHp} HP`;
    document.getElementById('enemyHpBar').style.width = `${Math.max(0, (this.battle.enemyHp / this.battle.enemyMaxHp) * 100)}%`;

    document.getElementById('heroFighterArt').innerHTML = renderDragonSVG(companion, 195, false);
    document.getElementById('enemyFighterArt').innerHTML = renderDragonSVG(this.battle.enemy, 195, true);
  }

  initiateSpell(spellType) {
    this.openStemChallenge({
      mode: 'battle',
      spellType
    });
  }

  openStemChallenge(context) {
    this.challengeContext = context;
    const q = generateSTEMQuestion(this.player.settings.topic, this.player.settings.grade);
    this.battle.currentQuestion = q;
    this.battle.usedHint = false;

    document.getElementById('stemCategoryBadge').textContent = q.category;
    document.getElementById('stemStreakBadge').textContent = `🔥 Streak: ${this.player.streak}x`;
    document.getElementById('stemPromptText').textContent = q.prompt;
    document.getElementById('stemVisualBox').textContent = q.visual;
    document.getElementById('stemHintBox').classList.add('hidden');
    document.getElementById('stemHintBox').textContent = `💡 Wizard Hint: ${q.hint}`;

    // If player owns Ender Logic Goggles relic, show hint automatically!
    if (this.player.relics.includes('visor_quantum')) {
      document.getElementById('stemHintBox').classList.remove('hidden');
    }

    const grid = document.getElementById('stemAnswersGrid');
    grid.innerHTML = q.options.map(opt => `<button class="answer-btn" data-ans="${opt}">${opt}</button>`).join('');

    grid.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => this.evaluateStemAnswer(btn, btn.dataset.ans));
    });

    document.getElementById('stemModal').classList.remove('hidden');
  }

  showQuestionHint() {
    document.getElementById('stemHintBox').classList.remove('hidden');
    this.battle.usedHint = true;
  }

  evaluateStemAnswer(btnEl, chosenAns) {
    const q = this.battle.currentQuestion;
    if (!q) return;

    const allBtns = document.querySelectorAll('#stemAnswersGrid .answer-btn');
    allBtns.forEach(b => (b.disabled = true));

    this.player.stats.totalAttempts++;
    const isCorrect = String(chosenAns) === String(q.correct);

    if (isCorrect) {
      btnEl.classList.add('correct');
      sfx.spellSuccess();
      this.player.streak++;
      this.player.stats.correctAnswers++;
      if (this.player.streak > this.player.stats.bestStreak) {
        this.player.stats.bestStreak = this.player.streak;
      }

      setTimeout(() => {
        document.getElementById('stemModal').classList.add('hidden');
        this.resolveChallengeSuccess();
      }, 650);
    } else {
      btnEl.classList.add('wrong');
      allBtns.forEach(b => {
        if (String(b.dataset.ans) === String(q.correct)) b.classList.add('correct');
      });
      sfx.spellMiss();
      this.player.streak = 0;

      setTimeout(() => {
        document.getElementById('stemModal').classList.add('hidden');
        this.resolveChallengeFailure(q.correct);
      }, 1250);
    }
  }

  resolveChallengeSuccess() {
    const ctx = this.challengeContext;
    const streakBonus = Math.min(3, 1 + this.player.streak * 0.15);
    const crownBonus = this.player.relics.includes('crown_prime') ? 1.2 : 1;
    const earnedPoints = Math.round(35 * streakBonus * crownBonus);
    const earnedXp = Math.round(30 + (this.player.craftedBuilds.includes('observatory') ? 15 : 0));

    this.player.points += earnedPoints;

    if (ctx.mode === 'mine') {
      const qty = this.player.relics.includes('pickaxe_diamond') ? 3 : 2;
      this.player.ores[ctx.oreId] = (this.player.ores[ctx.oreId] || 0) + qty;
      this.player.stats.blocksMined++;
      sfx.mineBlock();
      this.showToast(`⛏️ Mined +${qty} ${ctx.oreLabel} & +${earnedPoints} Game Points!`);
      this.grantXP(earnedXp);
      this.checkAchievements();
      this.updateAllUI();
      return;
    }

    if (ctx.mode === 'world_chest') {
      this.player.chestsOwned.oak = (this.player.chestsOwned.oak || 0) + 1;
      this.grantXP(earnedXp);
      this.triggerSurpriseModal('🗺️ World Mystery Chest Unlocked!', 'oak', 'You solved the Ancient Voxel Lock on the map!');
      this.checkAchievements();
      this.updateAllUI();
      return;
    }

    // Battle mode resolution
    const companion = DRAGONS.find(d => d.id === this.player.activeDragon) || DRAGONS[0];
    const compLv = (this.player.dragonLevels && this.player.dragonLevels[companion.id]) || 1;
    const beaconMult = this.player.craftedBuilds.includes('beacon_math') ? 1.15 : 1;
    const wandBonus = this.player.relics.includes('wand_redstone') ? 10 : 0;

    let baseDmg = Math.round((companion.power + compLv * 6 + wandBonus) * streakBonus * beaconMult);

    if (ctx.spellType === 'fireball') {
      this.battle.enemyHp = Math.max(0, this.battle.enemyHp - baseDmg);
      document.getElementById('battleLogText').textContent = `🔥 Direct Hit! Your STEM Spell dealt ${baseDmg} damage (+${earnedPoints} pts)!`;
    } else if (ctx.spellType === 'lightning') {
      const critDmg = Math.round(baseDmg * 1.25);
      this.battle.enemyHp = Math.max(0, this.battle.enemyHp - critDmg);
      document.getElementById('battleLogText').textContent = `⚡ Redstone Surge! Critical ${critDmg} damage (+${earnedPoints} pts)!`;
    } else if (ctx.spellType === 'heal') {
      const healAmt = Math.round(this.battle.heroMaxHp * 0.42);
      this.battle.heroHp = Math.min(this.battle.heroMaxHp, this.battle.heroHp + healAmt);
      const chipDmg = Math.round(baseDmg * 0.6);
      this.battle.enemyHp = Math.max(0, this.battle.enemyHp - chipDmg);
      document.getElementById('battleLogText').textContent = `💚 Restored +${healAmt} HP and splashed ${chipDmg} arcane damage!`;
    } else if (ctx.spellType === 'tame') {
      const enemyId = this.battle.enemy.id;
      const alreadyOwned = this.player.dragons.includes(enemyId);
      const hpRatio = this.battle.enemyHp / this.battle.enemyMaxHp;
      if (!alreadyOwned && (hpRatio <= 0.65 || this.player.relics.includes('orb_galaxy'))) {
        this.player.dragons.push(enemyId);
        this.player.dragonLevels[enemyId] = 1;
        this.player.chestsOwned.gilded = (this.player.chestsOwned.gilded || 0) + 1;
        this.grantXP(earnedXp + 25);
        this.triggerSurpriseModal(`🐉 NEW DRAGON TAMED: ${this.battle.enemy.name}!`, 'gilded', `You bonded with ${this.battle.enemy.name} using STEM mastery!`);
        this.spawnRandomBattle();
        this.checkAchievements();
        this.updateAllUI();
        return;
      } else {
        this.battle.enemyHp = Math.max(0, this.battle.enemyHp - baseDmg);
        document.getElementById('battleLogText').textContent = alreadyOwned
          ? `✨ You already tamed ${this.battle.enemy.name}! Spell dealt ${baseDmg} bonus damage!`
          : `🔮 Dragon Crystal weakened ${this.battle.enemy.name} by ${baseDmg} HP! Try taming again when its HP is lower!`;
      }
    }

    // Check if wild dragon defeated
    if (this.battle.enemyHp <= 0) {
      this.player.stats.dragonsDefeated++;
      this.player.points += 80;
      this.player.ores.emerald += 2;
      this.player.ores.diamond += 1;
      this.player.chestsOwned.oak = (this.player.chestsOwned.oak || 0) + 1;
      this.showToast(`🏆 Victory! Defeated ${this.battle.enemy.name} (+80 Bonus Points + 1 Chest)!`);
      this.grantXP(earnedXp + 35);
      this.spawnRandomBattle();
    } else {
      // Enemy counter-attack
      const enemyHit = randInt(10, 18 + this.currentRealm * 4);
      this.battle.heroHp = Math.max(10, this.battle.heroHp - enemyHit);
      this.grantXP(earnedXp);
    }

    this.checkAchievements();
    this.updateBattleUI();
    this.updateAllUI();
  }

  resolveChallengeFailure(correctAnswer) {
    this.showToast(`💡 Good try! The correct answer was ${correctAnswer}. Keep going!`);
    if (this.challengeContext && this.challengeContext.mode === 'battle') {
      const enemyHit = randInt(8, 14);
      this.battle.heroHp = Math.max(15, this.battle.heroHp - enemyHit);
      document.getElementById('battleLogText').textContent = `🛡️ Spell fizzled! Correct answer was ${correctAnswer}. Dragon grazed you for ${enemyHit} HP.`;
      this.updateBattleUI();
    }
    this.updateAllUI();
  }

  grantXP(amount) {
    this.player.xp += amount;
    let leveledUp = false;
    while (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext;
      this.player.level++;
      this.player.xpToNext = Math.round(this.player.xpToNext * 1.25);
      leveledUp = true;
    }

    if (leveledUp) {
      sfx.levelUp();
      const chestReward = this.player.level >= 5 ? 'arcane' : 'gilded';
      this.player.chestsOwned[chestReward] = (this.player.chestsOwned[chestReward] || 0) + 1;
      this.player.points += 150;
      this.triggerSurpriseModal(
        `🎉 LEVEL UP! YOU REACHED LEVEL ${this.player.level}!`,
        chestReward,
        `Every new level unlocks a special Level-Up Surprise Chest + 150 Bonus Points!`
      );
    }
    this.saveProfiles();
  }

  checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (!this.player.achievements.includes(ach.id) && ach.check(this.player)) {
        this.player.achievements.push(ach.id);
        this.player.chestsOwned[ach.chestReward] = (this.player.chestsOwned[ach.chestReward] || 0) + 1;
        this.player.points += 100;
        this.saveProfiles();
        this.triggerSurpriseModal(
          `🏆 ACHIEVEMENT UNLOCKED: ${ach.title}!`,
          ach.chestReward,
          `${ach.desc} — Here is your Achievement Surprise Reward!`
        );
        break; // Show one celebration at a time
      }
    }
  }

  // --- SURPRISE CHEST UNBOXING ENGINE ---
  triggerSurpriseModal(headline, chestId, subtitle) {
    sfx.chestOpen();
    const chest = CHEST_TYPES.find(c => c.id === chestId) || CHEST_TYPES[0];
    this.player.stats.chestsOpened++;

    // Roll rewards: Relic or Dragon or Bonus Gems + STEM Fact
    let rewardTitle = '';
    let rewardDesc = '';
    let stemFact = '';

    const unownedRelics = SURPRISE_ITEMS.filter(r => !this.player.relics.includes(r.id));
    const unownedDragons = DRAGONS.filter(d => !this.player.dragons.includes(d.id));

    if ((chestId === 'mythic' || chestId === 'arcane') && unownedDragons.length > 0 && Math.random() > 0.35) {
      const newDragon = unownedDragons[randInt(0, unownedDragons.length - 1)];
      this.player.dragons.push(newDragon.id);
      this.player.dragonLevels[newDragon.id] = 1;
      rewardTitle = `🐉 HATCHED NEW DRAGON: ${newDragon.name}!`;
      rewardDesc = `Element: ${newDragon.element} • Base Power: ${newDragon.power}`;
      stemFact = newDragon.lore;
    } else if (unownedRelics.length > 0) {
      const relic = unownedRelics[randInt(0, unownedRelics.length - 1)];
      this.player.relics.push(relic.id);
      rewardTitle = `${relic.icon} ${relic.name}`;
      rewardDesc = `Permanent Passive Boost: ${relic.bonus}`;
      stemFact = relic.fact;
    } else {
      const bonusPts = chestId === 'mythic' ? 400 : chestId === 'arcane' ? 250 : 140;
      this.player.points += bonusPts;
      this.player.ores.diamond += 2;
      this.player.ores.emerald += 3;
      const randomFactItem = SURPRISE_ITEMS[randInt(0, SURPRISE_ITEMS.length - 1)];
      rewardTitle = `💎 Jackpot Gem Cache (+${bonusPts} Game Points!)`;
      rewardDesc = `Plus +2 Diamonds and +3 Emeralds added to your Voxel Inventory!`;
      stemFact = randomFactItem.fact;
    }

    document.getElementById('surpriseHeadline').textContent = headline;
    document.getElementById('surpriseSubtitle').textContent = subtitle;
    document.getElementById('surpriseChestArt').innerHTML = renderChestSVG(chest, true);
    document.getElementById('surpriseRewardTitle').textContent = rewardTitle;
    document.getElementById('surpriseRewardDesc').textContent = rewardDesc;
    document.getElementById('surpriseStemFact').textContent = stemFact;

    document.getElementById('surpriseModal').classList.remove('hidden');
    this.saveProfiles();
    this.updateAllUI();
  }

  openChestFromVault(chestId, usePoints = false) {
    const chest = CHEST_TYPES.find(c => c.id === chestId);
    if (!chest) return;

    const ownedCount = (this.player.chestsOwned && this.player.chestsOwned[chestId]) || 0;
    if (!usePoints && ownedCount > 0) {
      this.player.chestsOwned[chestId]--;
      this.triggerSurpriseModal(`🎁 Unboxed ${chest.name}!`, chestId, 'Opened from your Treasure Vault!');
    } else if (usePoints) {
      if (this.player.points < chest.costPoints) {
        this.showToast(`⚠️ Need ${chest.costPoints} Game Points! Solve more STEM spells to earn points!`);
        return;
      }
      this.player.points -= chest.costPoints;
      this.triggerSurpriseModal(`✨ Purchased & Unboxed ${chest.name}!`, chestId, `Redeemed with ${chest.costPoints} hard-earned STEM Game Points!`);
    }
  }

  // --- UI RENDERING ---
  updateAllUI() {
    if (!this.player) return;

    // Top HUD
    const avatarIcons = { mage: '🧙‍♂️', knight: '⚔️', alchemist: '🧪', ranger: '🏹' };
    document.getElementById('hudAvatarIcon').textContent = avatarIcons[this.player.heroClass] || '🧙‍♂️';
    document.getElementById('hudLevelPill').textContent = `Lv.${this.player.level}`;
    document.getElementById('hudHeroName').textContent = this.player.username;
    document.getElementById('hudXpFill').style.width = `${Math.min(100, (this.player.xp / this.player.xpToNext) * 100)}%`;
    document.getElementById('hudXpText').textContent = `${this.player.xp} / ${this.player.xpToNext} XP to Level ${this.player.level + 1}`;

    document.getElementById('hudPoints').textContent = this.player.points;
    document.getElementById('hudStreak').textContent = `${this.player.streak}x`;
    document.getElementById('hudDragonsCount').textContent = `${this.player.dragons.length}/${DRAGONS.length}`;
    document.getElementById('hudSolvedCount').textContent = this.player.stats.correctAnswers;

    const totalChestsOwned = Object.values(this.player.chestsOwned || {}).reduce((a, b) => a + b, 0);
    const chestBadge = document.getElementById('navChestBadge');
    chestBadge.textContent = totalChestsOwned;
    chestBadge.style.display = totalChestsOwned > 0 ? 'inline-block' : 'none';

    // Realm selector buttons
    const realmBar = document.getElementById('realmSelectorBar');
    realmBar.innerHTML = REALMS.map(r => {
      const unlocked = this.player.level >= r.minLevel;
      const active = this.currentRealm === r.id ? 'active' : '';
      return `<button class="realm-btn ${active} ${unlocked ? '' : 'locked'}" data-realm="${r.id}">
        ${r.icon} ${r.name} ${unlocked ? '' : `(Lv.${r.minLevel})`}
      </button>`;
    }).join('');
    realmBar.querySelectorAll('.realm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = Number(btn.dataset.realm);
        const realm = REALMS[rid];
        if (this.player.level < realm.minLevel) {
          this.showToast(`🔒 Reach Level ${realm.minLevel} by solving STEM equations to unlock ${realm.name}!`);
          return;
        }
        this.currentRealm = rid;
        this.generateRealmEntities();
        this.updateAllUI();
      });
    });

    // Voxel Inventory
    const oreColors = { emerald: '#06d6a0', redstone: '#ef476f', diamond: '#4cc9f0', gold: '#ffd166', amethyst: '#9b5de5' };
    document.getElementById('voxelInventoryGrid').innerHTML = Object.entries(this.player.ores).map(([k, v]) => `
      <div class="voxel-slot">
        <span class="voxel-cube" style="background:${oreColors[k]}"></span>
        <span>${k.charAt(0).toUpperCase() + k.slice(1)}: <strong>${v}</strong></span>
      </div>
    `).join('');

    // Active Quests
    document.getElementById('activeQuestsList').innerHTML = `
      <div class="quest-item ${this.player.stats.correctAnswers >= 5 ? 'done' : ''}">
        <strong>🔮 Spellcaster Warmup</strong>
        <div>Solve 5 STEM equations in battle or mining</div>
        <div class="quest-progress">${Math.min(5, this.player.stats.correctAnswers)} / 5 Completed</div>
      </div>
      <div class="quest-item ${this.player.stats.blocksMined >= 5 ? 'done' : ''}">
        <strong>⛏️ Voxel Ore Collector</strong>
        <div>Walk onto 5 glowing Ore Blocks on the World Map</div>
        <div class="quest-progress">${Math.min(5, this.player.stats.blocksMined)} / 5 Mined</div>
      </div>
      <div class="quest-item ${this.player.dragons.length >= 3 ? 'done' : ''}">
        <strong>🐉 Dragon Tamer Quest</strong>
        <div>Tame or hatch 3 Elemental Dragons</div>
        <div class="quest-progress">${Math.min(3, this.player.dragons.length)} / 3 Dragons</div>
      </div>
    `;

    this.renderChestsTab();
    this.renderDragonsTab();
    this.renderAchievementsTab();
    this.updateBattleUI();
  }

  renderChestsTab() {
    const grid = document.getElementById('chestsVaultGrid');
    grid.innerHTML = CHEST_TYPES.map(c => {
      const count = (this.player.chestsOwned && this.player.chestsOwned[c.id]) || 0;
      return `
      <div class="chest-card">
        <div>
          <span class="rarity-tag rarity-${c.rarity}">${c.rarityLabel}</span>
          <div class="chest-svg-wrap ${count > 0 ? 'chest-shake' : ''}">${renderChestSVG(c, false)}</div>
          <h3>${c.name}</h3>
          <p style="font-size:0.84rem;color:var(--text-muted);margin:8px 0 14px;">${c.desc}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${count > 0
            ? `<button class="btn-voxel btn-gold btn-open-owned" data-chest="${c.id}">🎁 Open Free Chest (${count} Owned)</button>`
            : `<button class="btn-voxel btn-purple btn-buy-chest" data-chest="${c.id}">⭐ Unlock for ${c.costPoints} Points</button>`
          }
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.btn-open-owned').forEach(btn => {
      btn.addEventListener('click', () => this.openChestFromVault(btn.dataset.chest, false));
    });
    grid.querySelectorAll('.btn-buy-chest').forEach(btn => {
      btn.addEventListener('click', () => this.openChestFromVault(btn.dataset.chest, true));
    });

    // Render Relics Collection
    const relicsGrid = document.getElementById('relicsCollectionGrid');
    relicsGrid.innerHTML = SURPRISE_ITEMS.map(item => {
      const owned = this.player.relics.includes(item.id);
      return `
      <div class="ach-card" style="opacity:${owned ? '1' : '0.45'}">
        <div style="font-size:2.2rem;margin-bottom:6px;">${item.icon}</div>
        <h4>${item.name}</h4>
        <p style="color:var(--accent-gold);font-size:0.82rem;font-weight:800;margin:4px 0;">${item.bonus}</p>
        <p style="font-size:0.78rem;color:var(--text-muted);">${owned ? item.fact : '🔒 Unbox Surprise Chests to discover this relic & STEM fact!'}</p>
      </div>`;
    }).join('');
  }

  renderDragonsTab() {
    const grid = document.getElementById('dragonsSanctuaryGrid');
    grid.innerHTML = DRAGONS.map(d => {
      const owned = this.player.dragons.includes(d.id);
      const isSelected = this.player.activeDragon === d.id;
      const lv = (this.player.dragonLevels && this.player.dragonLevels[d.id]) || 1;
      const evolveCost = lv * 120;

      return `
      <div class="dragon-card" style="opacity:${owned ? '1' : '0.52'}; border-color:${isSelected ? 'var(--accent-gold)' : '#344375'}">
        <div>
          <span class="rarity-tag rarity-${d.rarity.toLowerCase()}">${d.rarity} • ${d.element}</span>
          <div style="margin:6px auto;">${renderDragonSVG(d, 155, false)}</div>
          <h3>${d.name} ${owned ? `(Stage ${lv})` : '🔒'}</h3>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:6px 0 12px;">${d.lore}</p>
        </div>
        ${owned ? `
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button class="btn-voxel btn-sm ${isSelected ? 'btn-gold' : ''} btn-select-dragon" data-dragon="${d.id}">
              ${isSelected ? '⭐ Active Partner' : 'Equip Partner'}
            </button>
            <button class="btn-voxel btn-purple btn-sm btn-evolve-dragon" data-dragon="${d.id}">
              🧬 Evolve (${evolveCost} pts)
            </button>
          </div>
        ` : `<div style="font-size:0.8rem;color:var(--accent-gold);font-weight:800;">📍 ${d.unlockHint}</div>`}
      </div>`;
    }).join('');

    grid.querySelectorAll('.btn-select-dragon').forEach(btn => {
      btn.addEventListener('click', () => {
        this.player.activeDragon = btn.dataset.dragon;
        this.saveProfiles();
        this.showToast(`🐉 Equipped new Dragon Partner!`);
        this.updateAllUI();
      });
    });

    grid.querySelectorAll('.btn-evolve-dragon').forEach(btn => {
      btn.addEventListener('click', () => {
        const dId = btn.dataset.dragon;
        const lv = (this.player.dragonLevels && this.player.dragonLevels[dId]) || 1;
        const cost = lv * 120;
        if (this.player.points < cost) {
          this.showToast(`⚠️ Need ${cost} Game Points to evolve this dragon!`);
          return;
        }
        this.player.points -= cost;
        this.player.dragonLevels[dId] = lv + 1;
        sfx.levelUp();
        this.showToast(`🧬 Dragon evolved to Stage ${lv + 1}! Spell power increased!`);
        this.checkAchievements();
        this.saveProfiles();
        this.updateAllUI();
      });
    });

    // Voxel Crafting Builds
    const craftGrid = document.getElementById('voxelCraftingGrid');
    craftGrid.innerHTML = CRAFT_PROJECTS.map(proj => {
      const built = (this.player.craftedBuilds || []).includes(proj.id);
      const reqStr = Object.entries(proj.req).map(([k, q]) => `${q} ${k} (have ${this.player.ores[k] || 0})`).join(', ');
      return `
      <div class="chest-card">
        <div>
          <div style="font-size:2.4rem;margin-bottom:6px;">${proj.icon}</div>
          <h3>${proj.name}</h3>
          <p style="font-size:0.83rem;color:var(--text-muted);margin:6px 0;">${proj.desc}</p>
          <p style="font-size:0.78rem;color:var(--accent-gold);margin-bottom:12px;">Requires: ${reqStr}</p>
        </div>
        ${built
          ? `<button class="btn-voxel btn-sm" disabled>✅ Monument Built</button>`
          : `<button class="btn-voxel btn-gold btn-sm btn-craft-build" data-build="${proj.id}">🔨 Craft (+${proj.rewardPoints} pts)</button>`
        }
      </div>`;
    }).join('');

    craftGrid.querySelectorAll('.btn-craft-build').forEach(btn => {
      btn.addEventListener('click', () => {
        const proj = CRAFT_PROJECTS.find(p => p.id === btn.dataset.build);
        if (!proj) return;
        for (const [ore, qty] of Object.entries(proj.req)) {
          if ((this.player.ores[ore] || 0) < qty) {
            this.showToast(`⛏️ Need more ${ore}! Mine glowing Ore Blocks on the World Map!`);
            return;
          }
        }
        for (const [ore, qty] of Object.entries(proj.req)) {
          this.player.ores[ore] -= qty;
        }
        this.player.craftedBuilds.push(proj.id);
        this.player.points += proj.rewardPoints;
        this.player.chestsOwned.gilded = (this.player.chestsOwned.gilded || 0) + 1;
        this.triggerSurpriseModal(`🏰 Crafted ${proj.name}!`, 'gilded', `${proj.desc} (+${proj.rewardPoints} Game Points!)`);
        this.checkAchievements();
        this.saveProfiles();
        this.updateAllUI();
      });
    });
  }

  renderAchievementsTab() {
    const acc = this.player.stats.totalAttempts > 0
      ? Math.round((this.player.stats.correctAnswers / this.player.stats.totalAttempts) * 100)
      : 100;
    document.getElementById('statAccuracy').textContent = `${acc}%`;
    document.getElementById('statBestStreak').textContent = `${this.player.stats.bestStreak}x`;
    document.getElementById('statChestsOpened').textContent = this.player.stats.chestsOpened;

    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = ACHIEVEMENTS.map(a => {
      const unlocked = this.player.achievements.includes(a.id);
      return `
      <div class="ach-card" style="border-color:${unlocked ? 'var(--accent-gold)' : '#2e3d6b'}; opacity:${unlocked ? '1' : '0.6'}">
        <div>
          <div style="font-size:2.3rem;margin-bottom:6px;">${unlocked ? a.icon : '🔒'}</div>
          <h3>${a.title}</h3>
          <p style="font-size:0.84rem;color:var(--text-muted);margin:8px 0;">${a.desc}</p>
        </div>
        <div class="rarity-tag rarity-${unlocked ? 'mythic' : 'common'}">
          ${unlocked ? '✅ Claimed + Surprise Chest' : `🎁 Reward: ${a.chestReward.toUpperCase()} Chest`}
        </div>
      </div>`;
    }).join('');
  }

  showToast(msg) {
    const toast = document.getElementById('toastBanner');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 3400);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dragonGame = new DragonCraftGame();
});
