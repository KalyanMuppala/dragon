// ============================================================================
// DRAGONCRAFT: PRODIGY REALM — 60FPS 2.5D ISOMETRIC VOXEL & DRAGON ENGINE
// Designed with zero UI clutter: 1-Click Entry, Guided Golden Path,
// Visual Diagram STEM Spell-Forge, and 3-Tap Interactive Surprise Chests!
// ============================================================================

const SAVE_KEY = 'dragoncraft_prodigy_save_v2';

// --- PROCEDURAL WEB AUDIO SYNTHESIZER (Chiptune + Magical SFX) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  tone(freq, type = 'triangle', dur = 0.15, delay = 0, vol = 0.14) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }
  step() {
    this.tone(240 + Math.random() * 60, 'sine', 0.05, 0, 0.05);
  }
  coin() {
    this.tone(987.77, 'sine', 0.08, 0, 0.1);
    this.tone(1318.51, 'triangle', 0.16, 0.06, 0.12);
  }
  spellCharge() {
    [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, 'triangle', 0.14, i * 0.05, 0.12));
  }
  laserBlast() {
    this.tone(180, 'sawtooth', 0.35, 0, 0.18);
    this.tone(520, 'square', 0.25, 0.05, 0.14);
    this.tone(110, 'sawtooth', 0.4, 0.12, 0.2);
  }
  wrongTry() {
    this.tone(240, 'sawtooth', 0.15, 0, 0.1);
    this.tone(190, 'sawtooth', 0.2, 0.1, 0.1);
  }
  chestTap(step) {
    const base = 330 + step * 140;
    this.tone(base, 'square', 0.12, 0, 0.15);
    this.tone(base * 1.5, 'triangle', 0.18, 0.05, 0.15);
  }
  chestExplode() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) =>
      this.tone(f, 'triangle', 0.28, i * 0.07, 0.18)
    );
  }
}

const sfx = new SoundEngine();

// --- DRAGONS ROSTER ---
const DRAGONS = [
  { id: 'ignis', name: 'Ignis the Magma Drake', color: '#ef476f', wing: '#ffd166', belly: '#ff9f1c', element: 'Fire', icon: '🔥' },
  { id: 'sprout', name: 'Sprig the Leaf Drake', color: '#52b788', wing: '#d8f3dc', belly: '#95d5b2', element: 'Nature', icon: '🌿' },
  { id: 'volt', name: 'Voltscale the Redstone Wyvern', color: '#00bbf9', wing: '#fee440', belly: '#a8ffea', element: 'Storm', icon: '⚡' },
  { id: 'frost', name: 'Cryowing the Ice Dragon', color: '#4cc9f0', wing: '#e0fbfc', belly: '#90e0ef', element: 'Frost', icon: '❄️' },
  { id: 'terra', name: 'Terrahorn the Emerald Drake', color: '#06d6a0', wing: '#ffd166', belly: '#b7efc5', element: 'Earth', icon: '⛰️' },
  { id: 'nebula', name: 'Nebulon the Starlight Wyrm', color: '#9b5de5', wing: '#f15bb5', belly: '#00f5d4', element: 'Cosmic', icon: '⭐' },
  { id: 'ender', name: 'Enderbyte the Quantum Dragon', color: '#7209b7', wing: '#00f5d4', belly: '#ffd166', element: 'Quantum', icon: '🔮' },
  { id: 'coral', name: 'Coralina the Reef Dragon', color: '#ff7f6e', wing: '#ffe5d9', belly: '#ffb4a2', element: 'Ocean', icon: '🐚' },
  { id: 'sandy', name: 'Dune the Sand Serpent', color: '#e9c46a', wing: '#f4a261', belly: '#fff3b0', element: 'Desert', icon: '🏜️' },
  { id: 'magma', name: 'Moltenjaw the Lava Dragon', color: '#d00000', wing: '#ffba08', belly: '#f48c06', element: 'Lava', icon: '🌋' },
  { id: 'shock', name: 'Zapwing the Lightning Dragon', color: '#ffd60a', wing: '#ffffff', belly: '#ffee93', element: 'Lightning', icon: '⚡' },
  { id: 'shadow', name: 'Umbra the Shadow Dragon', color: '#3a3a5c', wing: '#8d99ae', belly: '#2b2d42', element: 'Shadow', icon: '🌑' },
  { id: 'crystal', name: 'Prismara the Crystal Dragon', color: '#b5179e', wing: '#f72585', belly: '#ffc8dd', element: 'Crystal', icon: '💎' },
  { id: 'cloud', name: 'Nimbus the Sky Dragon', color: '#8ecae6', wing: '#ffffff', belly: '#caf0f8', element: 'Sky', icon: '☁️' },
  { id: 'pearl', name: 'Lunara the Moon Dragon', color: '#e0e1dd', wing: '#778da9', belly: '#fefae0', element: 'Moon', icon: '🌙' },
  { id: 'solar', name: 'Solaris the Sun Dragon', color: '#fb8500', wing: '#ffd166', belly: '#ffe8a3', element: 'Sun', icon: '☀️' },
  { id: 'swamp', name: 'Bogscale the Swamp Dragon', color: '#588157', wing: '#a3b18a', belly: '#dad7cd', element: 'Swamp', icon: '🐸' },
  { id: 'rune', name: 'Runeclaw the Ancient Dragon', color: '#6d597a', wing: '#e56b6f', belly: '#eaac8b', element: 'Ancient', icon: '📜' },
  { id: 'steel', name: 'Ironhide the Metal Dragon', color: '#6c757d', wing: '#ced4da', belly: '#adb5bd', element: 'Metal', icon: '⚙️' },
  { id: 'candy', name: 'Sugarwing the Candy Dragon', color: '#ff8fab', wing: '#ffc2d1', belly: '#fff0f3', element: 'Candy', icon: '🍭' },
  { id: 'bubble', name: 'Bubbletail the Water Dragon', color: '#48cae4', wing: '#ade8f4', belly: '#caf0f8', element: 'Water', icon: '💧' },
  { id: 'jungle', name: 'Vinefang the Jungle Dragon', color: '#2d6a4f', wing: '#95d5b2', belly: '#b7e4c7', element: 'Jungle', icon: '🌴' },
  { id: 'aurora', name: 'Auroris the Northern Lights Dragon', color: '#7b2cbf', wing: '#00f5d4', belly: '#c77dff', element: 'Aurora', icon: '🌌' },
  { id: 'thunder', name: 'Rumblehorn the Thunder Dragon', color: '#3a0ca3', wing: '#4cc9f0', belly: '#7209b7', element: 'Thunder', icon: '⛈️' },
  { id: 'phoenix', name: 'Phoenix the Rebirth Dragon', color: '#ff5400', wing: '#ffbd00', belly: '#ffdd00', element: 'Phoenix', icon: '🪶' }
];

// --- PLAYABLE HEROES ---
const CHARACTERS = [
  { name: 'Leo the Mage', robe: '#7209b7', hat: '#3c096c', skin: '#ffcdb2' },
  { name: 'Ember the Fire Witch', robe: '#e63946', hat: '#7f1d1d', skin: '#f1c27d' },
  { name: 'Forest Ranger', robe: '#2d6a4f', hat: '#1b4332', skin: '#d9a066' },
  { name: 'Frost Knight', robe: '#1d4ed8', hat: '#0f2a6b', skin: '#8d5524' },
  { name: 'Storm Sage', robe: '#f59e0b', hat: '#92400e', skin: '#ffdbac' },
  { name: 'Shadow Ninja', robe: '#1f2937', hat: '#111827', skin: '#c68642' }
];

// --- VISIBLE GEAR & SURPRISES ---
const SURPRISES = [
  { id: 'crown_gold', name: 'Golden Crown of Equations', icon: '👑', type: 'crown', desc: 'Your Wizard now wears the Golden Royal Crown on screen!', fact: 'STEM Secret: Gold is so malleable that 1 ounce can be beaten into a sheet covering 100 square feet!' },
  { id: 'wings_aether', name: 'Aether Dragon Wings', icon: '🦋', type: 'wings', desc: 'Magical cyan wings equipped to your Wizard back!', fact: 'STEM Secret: Dragonflies can flap all 4 wings independently and fly backward at 30 mph!' },
  { id: 'staff_nether', name: 'Redstone Superconductor Staff', icon: '🪄', type: 'staff', desc: 'Doubles the size of your spell fireballs!', fact: 'STEM Secret: Lightning bolts are 5 times hotter than the surface of the Sun (around 50,000°F)!' },
  { id: 'pet_star', name: 'Mini Supernova Orbiting Star', icon: '🌟', type: 'orbit', desc: 'A glowing mini-star orbits your Wizard everywhere you walk!', fact: 'STEM Secret: A neutron star is so dense that 1 teaspoon of it weighs as much as a mountain!' }
];

// --- BIOMES / ISLANDS ---
const BIOME_DEFS = [
  { title: 'EMERALD VOXEL WOODS', icon: '🌲', top: '#2ec4b6', water: '#0b1d3a', guardId: 'sprout', bossId: 'terra', goal: { kind: 'single', n: 1, icon: '💎', noun: 'Glowing Mana Crystal', focus: 'mixed', short: 'Mine the Mana Crystal' } },
  { title: 'REDSTONE MAGMA CITADEL', icon: '🌋', top: '#e76f51', water: '#2a080c', guardId: 'magma', bossId: 'volt', goal: { kind: 'collect', n: 3, icon: '🔥', noun: 'Fire Gem', focus: 'math', short: 'Collect 3 Fire Gems (math!)' } },
  { title: 'CRYSTAL SKY SANCTUARY', icon: '☁️', top: '#4cc9f0', water: '#0f172a', guardId: 'cloud', bossId: 'crystal', goal: { kind: 'collect', n: 3, icon: '☁️', noun: 'Sky Crystal', focus: 'mixed', short: 'Collect 3 Sky Crystals' } },
  { title: 'OBSIDIAN ENDER KEEP', icon: '🔮', top: '#9b5de5', water: '#090414', guardId: 'shadow', bossId: 'ender', goal: { kind: 'combo', n: 3, icon: '🔮', noun: 'Ender Portal', verb: 'Seal the Ender Portal', focus: 'mixed', short: 'Seal the portal: 3-spell combo' } },
  { title: 'GOLDEN SAND DUNES', icon: '🏜️', top: '#e9c46a', water: '#2b1d08', guardId: 'sandy', bossId: 'solar', goal: { kind: 'collect', n: 4, icon: '🏺', noun: 'Sun Relic', focus: 'math', short: 'Dig up 4 Sun Relics (math!)' } },
  { title: 'CORAL REEF LAGOON', icon: '🌊', top: '#38b6c9', water: '#052a3a', guardId: 'coral', bossId: 'bubble', goal: { kind: 'collect', n: 4, icon: '🦪', noun: 'Pearl', focus: 'mixed', short: 'Gather 4 Pearls' } },
  { title: 'FROZEN GLACIER PEAKS', icon: '❄️', top: '#a8dadc', water: '#0c1f33', guardId: 'frost', bossId: 'aurora', goal: { kind: 'combo', n: 3, icon: '🧊', noun: 'Ice Gate', verb: 'Melt the Ice Gate', focus: 'english', short: 'Melt the gate: 3 word spells (English!)' } },
  { title: 'MISTY SWAMP HOLLOW', icon: '🐸', top: '#6a994e', water: '#0d1f10', guardId: 'swamp', bossId: 'rune', goal: { kind: 'collect', n: 4, icon: '🍄', noun: 'Glowing Mushroom', focus: 'english', short: 'Pick 4 Mushrooms (English!)' } },
  { title: 'CANDY CLOUD KINGDOM', icon: '🍭', top: '#ff8fab', water: '#2a0f1d', guardId: 'candy', bossId: 'shock', goal: { kind: 'collect', n: 5, icon: '🍬', noun: 'Candy Gem', focus: 'mixed', short: 'Collect 5 Candy Gems' } },
  { title: 'CLOCKWORK STEEL FORGE', icon: '⚙️', top: '#8d99ae', water: '#10151c', guardId: 'steel', bossId: 'thunder', goal: { kind: 'combo', n: 4, icon: '⚙️', noun: 'Giant Gear', verb: 'Repair the Giant Gear', focus: 'math', short: 'Repair the gear: 4-spell combo (math!)' } },
  { title: 'MOONLIT JUNGLE RUINS', icon: '🌴', top: '#40916c', water: '#07170f', guardId: 'jungle', bossId: 'pearl', goal: { kind: 'collect', n: 5, icon: '📜', noun: 'Ancient Rune', focus: 'english', short: 'Find 5 Ancient Runes (English!)' } },
  { title: 'STARFALL COSMIC ISLE', icon: '⭐', top: '#7b2cbf', water: '#05010f', guardId: 'nebula', bossId: 'phoenix', goal: { kind: 'combo', n: 5, icon: '⭐', noun: 'Star Core', verb: 'Wake the Star Core', focus: 'mixed', short: 'Wake the Star Core: 5-spell combo' } }
];

function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

const BIOMES = BIOME_DEFS.map((b, i) => ({
  ...b,
  name: `ISLAND ${i + 1} • ${b.title}`,
  left: shadeHex(b.top, 0.72),
  right: shadeHex(b.top, 0.5)
}));

// ============================================================================
// VISUAL STEM PROBLEM & DIAGRAM GENERATOR (Age 9 / Grade 3-4-5)
// Draws actual visual block arrays, balance scales, potion flasks & circuits!
// ============================================================================
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function make3Choices(correct) {
  const set = new Set([String(correct)]);
  while (set.size < 3) {
    const offset = rand(1, 5) * (Math.random() > 0.5 ? 1 : -1);
    const val = Number(correct) + offset;
    if (val > 0) set.add(String(val));
  }
  return [...set].sort(() => Math.random() - 0.5);
}

// ============================================================================
// ENGLISH / LANGUAGE ARTS CHALLENGES (Grade 3-5): vocab, spelling, grammar, rhymes
// ============================================================================
const ENGLISH_BANK = [
  // [topic, prompt, hint, correct, wrong1, wrong2, bigText]
  ['📖 DRAGON SYNONYMS', 'Which word means the SAME as "enormous"?', 'Enormous means very, very big!', 'huge', 'tiny', 'quiet', 'enormous = ?'],
  ['📖 DRAGON SYNONYMS', 'Which word means the SAME as "swift"?', 'Swift means moving very fast!', 'fast', 'slow', 'heavy', 'swift = ?'],
  ['📖 DRAGON SYNONYMS', 'Which word means the SAME as "brave"?', 'A brave knight is not afraid!', 'fearless', 'shy', 'sleepy', 'brave = ?'],
  ['📖 DRAGON SYNONYMS', 'Which word means the SAME as "glad"?', 'Glad means feeling happy!', 'happy', 'angry', 'tired', 'glad = ?'],
  ['📖 DRAGON SYNONYMS', 'Which word means the SAME as "ancient"?', 'Ancient means very, very old!', 'very old', 'brand new', 'shiny', 'ancient = ?'],
  ['🔄 OPPOSITE RUNES', 'Which word is the OPPOSITE of "ancient"?', 'Opposite means totally different. Think of old vs...', 'modern', 'old', 'dusty', 'ancient ↔ ?'],
  ['🔄 OPPOSITE RUNES', 'Which word is the OPPOSITE of "brave"?', 'Think of someone who is scared!', 'cowardly', 'mighty', 'kind', 'brave ↔ ?'],
  ['🔄 OPPOSITE RUNES', 'Which word is the OPPOSITE of "generous"?', 'A generous person shares. The opposite does not!', 'selfish', 'friendly', 'wealthy', 'generous ↔ ?'],
  ['🔄 OPPOSITE RUNES', 'Which word is the OPPOSITE of "expand"?', 'Expand means grow bigger. The opposite makes it smaller!', 'shrink', 'stretch', 'grow', 'expand ↔ ?'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'Say it slowly: "dra-gon"... then check each letter!', 'dragon', 'dragin', 'dragun', 'dr_g_n'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'Remember: "i before e, except after c" — rec-EI-ve!', 'receive', 'recieve', 'receeve', 'rec_ve'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'It has a silent "w" at the start!', 'wizard', 'wizzard', 'wisard', 'wiz_rd'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'There is a "gh" in the middle, and it is silent!', 'knight', 'nite', 'knite', 'k__ght'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'Think of "friend" — you will see "end" at the finish!', 'friend', 'freind', 'frend', 'fr_end'],
  ['✏️ SPELLING SPELL', 'Which spelling is CORRECT?', 'It sounds like "ad-ven-chur" but is spelled differently!', 'adventure', 'advencher', 'adventur', 'adven_ure'],
  ['🧩 PLURAL POWER', 'More than one "mouse" is...', 'Mouse is special! It does not just add an "s".', 'mice', 'mouses', 'mices', '1 mouse → ?'],
  ['🧩 PLURAL POWER', 'More than one "tooth" is...', 'Tooth changes its vowels: teeth!', 'teeth', 'tooths', 'teeths', '1 tooth → ?'],
  ['🧩 PLURAL POWER', 'More than one "wolf" is...', 'Words ending in "f" often change to "ves"!', 'wolves', 'wolfs', 'wolfes', '1 wolf → ?'],
  ['🧩 PLURAL POWER', 'More than one "child" is...', 'Child is special — it becomes a different word!', 'children', 'childs', 'childrens', '1 child → ?'],
  ['🏷️ WORD TYPE', 'In "The dragon ROARED loudly", what kind of word is ROARED?', 'A verb is an ACTION word — what did the dragon DO?', 'verb', 'noun', 'adjective', 'ROARED = ?'],
  ['🏷️ WORD TYPE', 'In "The SHINY crown fell", what kind of word is SHINY?', 'An adjective DESCRIBES a noun — how does the crown look?', 'adjective', 'verb', 'noun', 'SHINY = ?'],
  ['🏷️ WORD TYPE', 'In "The WIZARD cast a spell", what kind of word is WIZARD?', 'A noun is a person, place or thing!', 'noun', 'verb', 'adjective', 'WIZARD = ?'],
  ['🏷️ WORD TYPE', 'In "The knight ran QUICKLY", what kind of word is QUICKLY?', 'An adverb tells HOW something is done (it often ends in -ly)!', 'adverb', 'noun', 'adjective', 'QUICKLY = ?'],
  ['🧱 FILL THE GAP', 'Pick the right word: "The dragons ___ flying over the castle."', 'Dragons is plural (more than one), so use "are"!', 'are', 'is', 'am', 'The dragons ___ flying'],
  ['🧱 FILL THE GAP', 'Pick the right word: "Yesterday, the wizard ___ a new spell."', 'Yesterday means the past — the past of "learn" is...', 'learned', 'learn', 'learning', 'Yesterday he ___'],
  ['🧱 FILL THE GAP', 'Pick the right word: "I saw ___ dragon in the sky."', 'Use "a" before consonant sounds, "an" before vowel sounds — dragon starts with "d"!', 'a', 'an', 'two', 'I saw ___ dragon'],
  ['🧱 FILL THE GAP', 'Pick the right word: "Their castle is bigger than ___ ."', 'Use "ours" for something that belongs to us!', 'ours', 'our', "we's", 'bigger than ___'],
  ['🎵 RHYME TIME', 'Which word RHYMES with "flame"?', 'Rhymes sound alike at the end: fl-AME, g-AME!', 'game', 'floor', 'flute', 'flame ≈ ?'],
  ['🎵 RHYME TIME', 'Which word RHYMES with "night"?', 'Night, light, fight — they end with "-ight"!', 'light', 'nut', 'name', 'night ≈ ?'],
  ['🎵 RHYME TIME', 'Which word RHYMES with "spell"?', 'Spell, bell, well — they end with "-ell"!', 'bell', 'spill', 'spoon', 'spell ≈ ?']
];

function createEnglishChallenge() {
  const [topic, prompt, hint, correct, w1, w2, big] = ENGLISH_BANK[rand(0, ENGLISH_BANK.length - 1)];
  return {
    topic,
    prompt,
    hint,
    correct,
    choices: shuffle([correct, w1, w2]),
    drawDiagram: ctx => {
      ctx.clearRect(0, 0, 540, 150);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 44px sans-serif';
      ctx.fillText(big, 270, 82);
      ctx.fillStyle = '#9b5de5';
      ctx.fillRect(170, 98, 200, 5);
      ctx.fillStyle = '#06d6a0';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('📚 ✨ 🐉', 270, 138);
    }
  };
}

// Skill category + subject for the parent dashboard (matched on the topic badge text)
function challengeInfo(topic) {
  const t = [
    ['POWER ARRAY', 'Multiplication', 'Math'], ['BALANCE SCALE', 'Algebra (find the unknown)', 'Math'],
    ['POTION', 'Fractions', 'Math'], ['BLUEPRINT', 'Area & Geometry', 'Math'],
    ['THERMAL', 'Science: states of matter', 'Science'], ['CIRCUIT', 'Science: circuits', 'Science'],
    ['SYNONYMS', 'Vocabulary: synonyms', 'English'], ['OPPOSITE', 'Vocabulary: opposites', 'English'],
    ['SPELLING', 'Spelling', 'English'], ['PLURAL', 'Grammar: plurals', 'English'],
    ['WORD TYPE', 'Grammar: parts of speech', 'English'], ['FILL THE GAP', 'Grammar: usage', 'English'],
    ['RHYME', 'Phonics: rhymes', 'English']
  ];
  const hit = t.find(x => (topic || '').toUpperCase().includes(x[0]));
  return hit ? [hit[1], hit[2]] : ['Other', 'Math'];
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createVisualSTEMChallenge(level = 1, focus = 'mixed') {
  // focus: 'english' = all English, 'math' = no English, 'mixed' = ~40% English
  if (focus === 'english' || (focus !== 'math' && Math.random() < 0.4)) return createEnglishChallenge();
  const types = focus === 'math'
    ? ['array_mult', 'balance_eq', 'potion_frac', 'voxel_area']
    : ['array_mult', 'balance_eq', 'potion_frac', 'voxel_area', 'science_circuit'];
  const type = types[rand(0, types.length - 1)];

  if (type === 'array_mult') {
    const rows = rand(2, 4);
    const cols = rand(3, 6);
    const ans = rows * cols;
    return {
      topic: '⚡ VOXEL POWER ARRAY',
      prompt: `Count the Dragon Energy Cubes: ${rows} rows of ${cols} cubes! (${rows} × ${cols} = ?)`,
      hint: `Add the ${rows} rows together: ${Array(rows).fill(cols).join(' + ')} = ${ans}!`,
      correct: String(ans),
      choices: make3Choices(ans),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        const cubeS = 26;
        const gap = 8;
        const startX = (540 - (cols * (cubeS + gap))) / 2;
        const startY = (150 - (rows * (cubeS + gap))) / 2;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = startX + c * (cubeS + gap);
            const y = startY + r * (cubeS + gap);
            ctx.fillStyle = '#06d6a0';
            ctx.fillRect(x, y, cubeS, cubeS);
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x, y, cubeS, cubeS);
          }
        }
      }
    };
  }

  if (type === 'balance_eq') {
    const mult = rand(2, 4);
    const eggVal = rand(3, 8);
    const extra = rand(2, 9);
    const total = mult * eggVal + extra;
    return {
      topic: '⚖️ DRAGON EGG BALANCE SCALE',
      prompt: `Balance the Scale!  ${mult} × 🥚 + ${extra} = ${total}.  What is 1 🥚 worth?`,
      hint: `First take away ${extra} from both sides (${total} - ${extra} = ${total - extra}), then split equally among ${mult} eggs!`,
      correct: String(eggVal),
      choices: make3Choices(eggVal),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        // Balance beam
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(90, 95);
        ctx.lineTo(450, 95);
        ctx.stroke();
        // Fulcrum triangle
        ctx.fillStyle = '#9b5de5';
        ctx.beginPath();
        ctx.moveTo(270, 95);
        ctx.lineTo(250, 138);
        ctx.lineTo(290, 138);
        ctx.closePath();
        ctx.fill();
        // Left side eggs + weight
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${'🥚'.repeat(mult)}  +  [${extra}]`, 170, 72);
        ctx.fillStyle = '#ffd166';
        ctx.fillText('=', 270, 75);
        // Right side total weight
        ctx.fillStyle = '#06d6a0';
        ctx.fillRect(335, 42, 90, 42);
        ctx.fillStyle = '#04241b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${total}`, 380, 70);
      }
    };
  }

  if (type === 'potion_frac') {
    const denom = [4, 6, 8][rand(0, 2)];
    const a = rand(1, denom - 2);
    const b = rand(1, denom - a);
    const ans = `${a + b}/${denom}`;
    const cSet = new Set([ans, `${a + b + 1}/${denom}`, `${a + b}/${denom * 2}`]);
    if (a + b > 1) cSet.add(`${a + b - 1}/${denom}`);
    while (cSet.size < 3) cSet.add(`${rand(1, denom)}/${denom}`);
    return {
      topic: '🧪 ALCHEMIST DRAGON POTION',
      prompt: `You pour ${a}/${denom} Blue Mana and ${b}/${denom} Purple Mana into the flask. How full is it?`,
      hint: `Count the glowing filled bars out of ${denom}: ${a} + ${b} = ${a + b}, so ${a + b}/${denom}!`,
      correct: ans,
      choices: shuffle([ans, ...[...cSet].filter(x => x !== ans).slice(0, 2)]),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        const barW = 46;
        const startX = (540 - denom * (barW + 6)) / 2;
        for (let i = 0; i < denom; i++) {
          const x = startX + i * (barW + 6);
          ctx.fillStyle = i < a ? '#00bbf9' : i < a + b ? '#9b5de5' : '#182246';
          ctx.fillRect(x, 42, barW, 65);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, 42, barW, 65);
        }
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${a} Blue + ${b} Purple out of ${denom} equal parts`, 270, 132);
      }
    };
  }

  if (type === 'voxel_area') {
    const w = rand(4, 8);
    const h = rand(3, 5);
    const area = w * h;
    return {
      topic: '🏰 MINECRAFT FORTRESS BLUEPRINT',
      prompt: `This Dragon Landing Pad is ${w} blocks wide and ${h} blocks tall. How many total floor blocks is its Area?`,
      hint: `Area = Length × Width ➔ ${w} × ${h} = ${area} blocks!`,
      correct: String(area),
      choices: make3Choices(area),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        const s = 22;
        const sx = (540 - w * s) / 2;
        const sy = (150 - h * s) / 2 + 8;
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#ffd166' : '#f4a261';
            ctx.fillRect(sx + c * s, sy + r * s, s - 2, s - 2);
          }
        }
        ctx.fillStyle = '#06d6a0';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Width: ${w} blocks`, 270, sy - 8);
        ctx.fillText(`Height: ${h}`, sx - 45, sy + (h * s) / 2);
      }
    };
  }

  // Science visual challenge
  const sciVisuals = [
    {
      topic: '🔬 THERMAL DRAGON SCIENCE',
      prompt: 'When Ignis heats Solid Ice Cubes with dragon fire, what state of matter does ice melt into first?',
      hint: 'Follow the arrow: Solid Ice melts into Liquid Water before boiling into Gas Steam!',
      correct: 'Liquid Water 💧',
      choices: shuffle(['Liquid Water 💧', 'Solid Rock 🪨', 'Magnetic Iron 🧲']),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4cc9f0';
        ctx.fillText('🧊 Solid Ice', 110, 80);
        ctx.fillStyle = '#ff9f1c';
        ctx.fillText('🔥 +Heat ➔', 240, 80);
        ctx.fillStyle = '#ffd166';
        ctx.fillText('❓ [ ? ]', 380, 80);
      }
    },
    {
      topic: '⚡ REDSTONE CIRCUIT SCIENCE',
      prompt: 'To make the Redstone Dragon Lamp glow, what must be true about the circuit loop?',
      hint: 'Electricity only flows when the loop is completely CLOSED with no gaps!',
      correct: 'The loop is CLOSED ⚡',
      choices: shuffle(['The loop is CLOSED ⚡', 'The wire is cut in half ✂️', 'The battery is removed 🔋']),
      drawDiagram: ctx => {
        ctx.clearRect(0, 0, 540, 150);
        // Battery on left
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔋 Battery', 90, 80);

        // Wire loop with visible gap at top
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = 5;
        // Bottom wire
        ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(410, 95); ctx.stroke();
        // Left vertical wire
        ctx.beginPath(); ctx.moveTo(130, 45); ctx.lineTo(130, 95); ctx.stroke();
        // Right vertical wire
        ctx.beginPath(); ctx.moveTo(410, 45); ctx.lineTo(410, 95); ctx.stroke();
        // Top wire with visible gap
        ctx.beginPath(); ctx.moveTo(130, 45); ctx.lineTo(235, 45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(305, 45); ctx.lineTo(410, 45); ctx.stroke();

        ctx.fillStyle = '#ef476f';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('✂️ OPEN GAP', 270, 40);

        // Dark Lamp (Off) on right
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(410, 70, 22, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#cbd5e0'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('💡 Dark Lamp (Off)', 410, 122);
      }
    }
  ];
  return sciVisuals[rand(0, sciVisuals.length - 1)];
}

// ============================================================================
// MAIN FULLSCREEN GAME ENGINE
// ============================================================================
class DragonCraftWorld {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Load or initialize player save
    this.state = this.loadSave();

    // Game Modes: 'WORLD' | 'BATTLE'
    this.mode = 'WORLD';
    this.shakeTime = 0;
    this.shakeMag = 0;

    // Isometric Map Grid (9x9 floating island)
    this.gridSize = 9;
    this.hero = {
      x: 1,
      y: 4,
      targetX: 1,
      targetY: 4,
      trail: []
    };

    // Curated 3-Step Island Encounters along the Golden Path!
    this.setupIslandEncounters();

    // Particles & Floating Texts
    this.particles = [];
    this.floatTexts = [];
    this.ambientEmbers = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 2 + Math.random() * 3,
      vy: -0.4 - Math.random() * 0.8,
      color: Math.random() > 0.5 ? '#ffd166' : '#06d6a0'
    }));

    // Battle state
    this.battle = {
      enemy: DRAGONS[1],
      enemyHp: 100,
      enemyMaxHp: 100,
      heroHp: 100,
      heroMaxHp: 100,
      laserAnim: 0,
      tameAnim: 0,
      isBoss: false
    };

    // 3-Tap Chest state
    this.chestState = {
      taps: 0,
      opened: false,
      shake: 0,
      pendingReward: null
    };

    this.bindEvents();
    this.updateHUD();
    requestAnimationFrame(t => this.loop(t));
  }

  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const st = Object.assign(this.defaultSave(), saved);
        if (!saved.stats) st.stats = this.defaultSave().stats;
        if (!Array.isArray(saved.squad)) st.squad = []; // old save: rebuild from owned dragons
        return this.fixSquad(st);
      }
    } catch (e) {}
    return this.defaultSave();
  }

  fixSquad(st) {
    let sq = Array.isArray(st.squad) ? st.squad.filter(id => st.dragons.includes(id)) : [];
    if (!sq.length) {
      // old saves: lead first, then others, max 3
      const lead = st.dragons[(st.activeDragonIdx || 0) % st.dragons.length];
      sq = [lead, ...st.dragons.filter(id => id !== lead)];
    }
    st.squad = [...new Set(sq)].slice(0, 3);
    return st;
  }

  equipNew(id) {
    if (this.state.squad.length < 3 && !this.state.squad.includes(id)) this.state.squad.push(id);
  }

  defaultSave() {
    return {
      name: 'Leo the Dragonborn',
      level: 1,
      xp: 0,
      xpNext: 100,
      coins: 100,
      streak: 1,
      islandIndex: 0,
      stageOnIsland: 0, // 0: Crystal, 1: Guardian Dragon, 2: Boss Dragon + Chest
      dragons: ['ignis'],
      activeDragonIdx: 0,
      gear: [], // 'crown_gold', 'wings_aether', 'staff_nether', 'pet_star'
      stats: { sessions: 0, totalMs: 0, byCat: {}, daily: {}, log: [], firstPlayed: Date.now() },
      goalProgress: 0, // progress through this island's mini-goal
      squad: ['ignis'], // up to 3 equipped dragons that follow you; squad[0] is the lead
      character: 0,
      maxIsland: 0,
      dragonLevels: {} // id -> { lvl, xp }
    };
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  resize() {
    // Sharp on Retina iPads: backing store at devicePixelRatio, drawing in CSS pixels.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    // Fit the 9x9 island on any screen (portrait iPad too)
    this.scale = Math.max(0.55, Math.min(1.25, this.vw / 760, this.vh / 620));
  }

  setupIslandEncounters() {
    // A clear, curated Golden Path from (1,4) -> (4,4) -> (4,2) -> (7,2)
    this.goldenPath = [
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 }, // Stage 0: Redstone Mana Crystal
      { x: 4, y: 3 },
      { x: 4, y: 2 }, // Stage 1: Wild Guardian Dragon
      { x: 5, y: 2 },
      { x: 6, y: 2 },
      { x: 7, y: 2 }  // Stage 2: Island Boss Dragon & Mystery Chest
    ];

    const biome = BIOMES[this.state.islandIndex % BIOMES.length];
    const goal = biome.goal;
    const prog = this.state.goalProgress || 0;
    // Waypoint pool for "collect" goals (rotated per island so each island feels different)
    const pool = [{ x: 3, y: 2 }, { x: 6, y: 3 }, { x: 2, y: 6 }, { x: 6, y: 7 }, { x: 5, y: 5 }, { x: 1, y: 7 }, { x: 7, y: 1 }, { x: 3, y: 6 }];
    const off = (this.state.islandIndex * 3) % pool.length;
    let first;
    if (goal.kind === 'collect') {
      const w = pool[(off + Math.min(prog, goal.n - 1)) % pool.length];
      first = { x: w.x, y: w.y, label: `${goal.icon} Find the ${goal.noun}! (${prog}/${goal.n})` };
    } else if (goal.kind === 'combo') {
      first = { x: 4, y: 4, label: `${goal.icon} ${goal.verb}! Answer ${goal.n} spells in a row (${prog}/${goal.n})` };
    } else {
      first = { x: 4, y: 4, label: '✨ Walk along the Golden Tiles to the Glowing Mana Crystal!' };
    }

    const stageTargets = [
      first,
      { x: 4, y: 2, label: '⚔️ Approach the Wild Guardian Dragon on the Golden Path!' },
      { x: 7, y: 2, label: '👑 Challenge the Island Boss Dragon to unlock the Giant Chest!' }
    ];

    const s = Math.min(2, this.state.stageOnIsland || 0);
    this.currentTarget = stageTargets[s];
    this.updateHUD();
  }

  // ==========================================================================
  // DRAGON LEVELS, HERO PICKER, DRAGON BOOK & ISLAND MAP
  // ==========================================================================
  dragonInfo(id) {
    const d = (this.state.dragonLevels && this.state.dragonLevels[id]) || { lvl: 1, xp: 0 };
    return { lvl: d.lvl || 1, xp: d.xp || 0, need: 50 + 25 * (d.lvl || 1) };
  }

  leadDragonId() {
    return (this.state.squad && this.state.squad[0]) || this.state.dragons[0] || 'ignis';
  }

  gainDragonXP(amount) {
    const id = this.leadDragonId();
    if (!this.state.dragonLevels) this.state.dragonLevels = {};
    const info = this.dragonInfo(id);
    let { lvl, xp } = info;
    if (lvl >= 10) return;
    xp += amount;
    let leveled = false;
    while (lvl < 10 && xp >= 50 + 25 * lvl) {
      xp -= 50 + 25 * lvl;
      lvl++;
      leveled = true;
    }
    this.state.dragonLevels[id] = { lvl, xp };
    if (leveled) {
      const dn = DRAGONS.find(d => d.id === id).name.split(' ')[0];
      sfx.chestExplode();
      this.spawnFloatText(this.vw * 0.27 + 60, this.vh * 0.62 - 120, `🐉 ${dn} LEVEL ${lvl}! +${lvl * 6}% power`, '#00f5d4');
    }
  }

  whereIs(id) {
    const i = BIOMES.findIndex(b => b.guardId === id || b.bossId === id);
    return i < 0 ? 'Starter dragon' : `Find me: ${BIOMES[i].icon} Island ${i + 1}`;
  }

  drawOn(canvas, fn) {
    const old = this.ctx;
    this.ctx = canvas.getContext('2d');
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    try { fn(); } finally { this.ctx = old; }
  }

  openMenu(tab) {
    if (this.mode !== 'WORLD') return;
    if (!document.getElementById('titleOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('spellForgeOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('chestOverlay').classList.contains('hidden')) return;
    this.menuTab = tab || 'hero';
    this.joy = { x: 0, y: 0, id: null };
    document.getElementById('menuOverlay').classList.remove('hidden');
    this.renderMenu();
  }

  closeMenu() {
    document.getElementById('menuOverlay').classList.add('hidden');
    this.previewChar = null;
    this.updateHUD();
  }

  renderMenu() {
    const body = document.getElementById('menuBody');
    document.querySelectorAll('.menu-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === this.menuTab));
    const t = performance.now();
    const previews = [];

    if (this.menuTab === 'hero') {
      body.innerHTML = '<div class="menu-note">Tap a hero to wear their look! 🎭</div><div class="menu-grid">' +
        CHARACTERS.map((c, i) => `<div class="menu-item ${i === this.state.character ? 'selected' : ''}" data-i="${i}">
          <canvas width="260" height="240" data-pc="${i}"></canvas><div class="nm">${c.name}</div>
          ${i === this.state.character ? '<div class="tag">YOU</div>' : ''}</div>`).join('') + '</div>';
      body.querySelectorAll('.menu-item').forEach(el => el.addEventListener('click', () => {
        this.state.character = Number(el.dataset.i);
        sfx.coin(); this.save(); this.renderMenu();
      }));
      body.querySelectorAll('canvas[data-pc]').forEach(cv => previews.push(() => {
        this.previewChar = Number(cv.dataset.pc);
        this.drawOn(cv, () => { this.ctx.translate(130, 190); this.drawWizardSprite(0, 0, t, 2.1); });
        this.previewChar = null;
      }));
    } else if (this.menuTab === 'dragons') {
      const owned = DRAGONS.filter(d => this.state.dragons.includes(d.id)).length;
      body.innerHTML = `<div class="menu-note">Dragon Book: ${owned} / ${DRAGONS.length} found — tame wild dragons on every island! Equip up to 3 to follow you (${this.state.squad.length}/3 equipped).</div><div class="menu-grid">` +
        DRAGONS.map(d => {
          const has = this.state.dragons.includes(d.id);
          const inf = this.dragonInfo(d.id);
          const eq = has && this.state.squad.includes(d.id);
          const lead = has && this.leadDragonId() === d.id;
          return `<div class="menu-item ${has ? '' : 'locked'} ${lead ? 'selected' : ''}" data-id="${d.id}">
            <canvas width="260" height="240" data-dc="${d.id}"></canvas>
            <div class="nm">${has ? d.name.split(' ')[0] : '???'}</div>
            <div class="sub">${has ? `${d.element} • Level ${inf.lvl}${inf.lvl >= 10 ? ' MAX' : ''} • +${inf.lvl * 6}% power` : this.whereIs(d.id)}</div>
            ${has ? `<div class="bar"><i style="width:${inf.lvl >= 10 ? 100 : Math.round((inf.xp / inf.need) * 100)}%"></i></div>` : ''}
            ${lead ? '<div class="tag">LEAD</div>' : eq ? '<div class="tag">FOLLOWING</div>' : ''}
            ${has ? `<div class="btn-row"><button class="mini-btn" data-act="equip" data-id="${d.id}">${eq ? 'Unequip' : 'Equip'}</button>${eq && !lead ? `<button class="mini-btn gold" data-act="lead" data-id="${d.id}">⭐ Lead</button>` : ''}</div>` : ''}</div>`;
        }).join('') + '</div><div class="menu-sec">🎒 Treasure Collection</div><div class="gear-row">' +
        SURPRISES.map(g => `<div class="gear-chip ${this.state.gear.includes(g.id) ? '' : 'locked'}">${this.state.gear.includes(g.id) ? g.icon + ' ' + g.name : '🔒 Mystery chest item'}</div>`).join('') + '</div>';
      body.querySelectorAll('.mini-btn').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const sq = this.state.squad;
        if (btn.dataset.act === 'lead') {
          this.state.squad = [id, ...sq.filter(x => x !== id)];
        } else if (sq.includes(id)) {
          if (sq.length <= 1) { sfx.wrongTry(); return; }
          this.state.squad = sq.filter(x => x !== id);
        } else if (sq.length >= 3) {
          sfx.wrongTry();
          document.querySelector('.menu-note').textContent = '🐉 Squad is full (3/3)! Unequip a dragon first.';
          return;
        } else {
          sq.push(id);
        }
        sfx.coin(); this.save(); this.renderMenu();
      }));
      body.querySelectorAll('canvas[data-dc]').forEach(cv => previews.push(() => {
        const d = DRAGONS.find(x => x.id === cv.dataset.dc);
        const has = this.state.dragons.includes(d.id);
        this.drawOn(cv, () => {
          this.ctx.translate(130, 170);
          this.drawDragonSprite(0, 0, d, t, 1.9, false);
        });
      }));
    } else {
      const base = Math.floor(this.state.islandIndex / BIOMES.length) * BIOMES.length;
      body.innerHTML = `<div class="menu-note">Pick an island to sail to! Beat each island's boss to unlock the next. Switching restarts that island's quest.</div><div class="menu-grid">` +
        BIOMES.map((b, i) => {
          const unlocked = base + i <= this.state.maxIsland;
          const here = base + i === this.state.islandIndex;
          return `<div class="menu-item ${unlocked ? '' : 'locked'} ${here ? 'selected' : ''}" data-i="${i}">
            <div class="island-big">${unlocked ? b.icon : '🔒'}</div>
            <div class="nm">${i + 1}. ${b.title}</div>
            <div class="sub">${unlocked ? (here ? 'You are here' : 'Tap to sail!') : 'Beat the previous boss'}</div>
            <div class="sub goal">${b.goal.icon} ${b.goal.short}</div>
            ${here ? '<div class="tag">HERE</div>' : ''}</div>`;
        }).join('') + '</div>';
      body.querySelectorAll('.menu-item:not(.locked)').forEach(el => el.addEventListener('click', () => {
        const target = base + Number(el.dataset.i);
        if (target !== this.state.islandIndex) {
          this.state.islandIndex = target;
          this.state.stageOnIsland = 0;
          this.state.goalProgress = 0;
          this.hero.x = this.hero.targetX = 1;
          this.hero.y = this.hero.targetY = 4;
          this.hero.trail = [];
          this.setupIslandEncounters();
          sfx.spellCharge();
        }
        this.save();
        this.closeMenu();
      }));
    }
    previews.forEach(fn => fn());
  }

  // ==========================================================================
  // PARENT DASHBOARD: real on-device tracking (no data leaves this iPad)
  // ==========================================================================
  recordAnswer() {
    const st = this.state.stats;
    const ch = this.activeChallenge;
    if (!st || !ch) return;
    const ms = Math.min(120000, performance.now() - (this.qStart || performance.now()));
    const wrong = this.qWrong || 0;
    const c = st.byCat[ch.cat] || (st.byCat[ch.cat] = { subj: ch.subj, asked: 0, first: 0, tries: 0, ms: 0 });
    c.subj = ch.subj; c.asked++; c.tries += wrong + 1; c.ms += ms; if (wrong === 0) c.first++;
    const d = st.daily[dayKey()] || (st.daily[dayKey()] = { ms: 0, q: 0, first: 0 });
    d.q++; if (wrong === 0) d.first++;
    st.log.push({ t: Date.now(), cat: ch.cat, subj: ch.subj, tries: wrong + 1, ms: Math.round(ms), island: this.state.islandIndex + 1 });
    if (st.log.length > 300) st.log.shift();
    this.save();
  }

  startTimeTracking() {
    setInterval(() => {
      const hidden = id => document.getElementById(id).classList.contains('hidden');
      if (document.visibilityState !== 'visible' || !hidden('parentOverlay') || !hidden('titleOverlay')) return;
      const st = this.state.stats;
      st.totalMs += 5000;
      (st.daily[dayKey()] || (st.daily[dayKey()] = { ms: 0, q: 0, first: 0 })).ms += 5000;
      this.save();
    }, 5000);
  }

  pinKey() { return 'dragoncraft_parent_pin_v1'; }
  getPin() { try { return localStorage.getItem(this.pinKey()); } catch (e) { return null; } }
  setPin(p) { try { localStorage.setItem(this.pinKey(), btoa('dc:' + p)); } catch (e) {} }
  checkPin(p) { return this.getPin() === btoa('dc:' + p); }

  openParent() {
    document.getElementById('parentOverlay').classList.remove('hidden');
    this.parentView = this.getPin() ? 'login' : 'setup';
    this.renderParent();
  }

  renderParent() {
    const body = document.getElementById('parentBody');
    if (this.parentView === 'setup' || this.parentView === 'login') {
      const setup = this.parentView === 'setup';
      body.innerHTML = `<div class="pd-center">
        <div class="menu-note">${setup ? 'Create a 4-digit Parent PIN. You will need it to see the dashboard.' : 'Enter your 4-digit Parent PIN'}</div>
        <input id="pdPin" class="pd-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" />
        <div class="pd-actions" style="justify-content:center"><button id="pdGo" class="pd-btn">${setup ? 'Save PIN' : 'Unlock'}</button></div>
        <div id="pdMsg" class="menu-note" style="margin-top:12px;color:#ef476f"></div>
        <div class="menu-note" style="font-size:.75rem;margin-top:14px">This is a casual kid-lock, not bank-grade security. Data is stored only on this device.</div></div>`;
      const go = () => {
        const v = document.getElementById('pdPin').value.trim();
        if (!/^\d{4}$/.test(v)) { document.getElementById('pdMsg').textContent = 'Please enter exactly 4 digits.'; return; }
        if (setup) { this.setPin(v); this.parentView = 'dash'; this.renderParent(); }
        else if (this.checkPin(v)) { this.parentView = 'dash'; this.renderParent(); }
        else { document.getElementById('pdMsg').textContent = 'Wrong PIN.'; document.getElementById('pdPin').value = ''; }
      };
      document.getElementById('pdGo').addEventListener('click', go);
      document.getElementById('pdPin').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      return;
    }
    body.innerHTML = this.parentDashboardHTML();
    document.getElementById('pdCsv').addEventListener('click', () => this.downloadFile('dragoncraft-answers.csv', this.buildCsv(), 'text/csv'));
    document.getElementById('pdJson').addEventListener('click', () => this.downloadFile('dragoncraft-report.json', JSON.stringify({ exportedAt: new Date().toISOString(), state: this.state }, null, 2), 'application/json'));
    document.getElementById('pdCopy').addEventListener('click', async () => {
      const txt = this.buildSummaryText();
      try { await navigator.clipboard.writeText(txt); document.getElementById('pdCopy').textContent = '✅ Copied!'; }
      catch (e) { document.getElementById('pdCopy').textContent = 'Copy not allowed here'; }
    });
    document.getElementById('pdPinChange').addEventListener('click', () => { this.parentView = 'setup'; this.renderParent(); });
    document.getElementById('pdReset').addEventListener('click', () => {
      if (confirm('Erase ALL game progress and parent stats on this device? This cannot be undone.')) {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
        location.reload();
      }
    });
  }

  fmtMin(ms) {
    const m = Math.round(ms / 60000);
    if (ms > 0 && m === 0) return '<1 min';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  }

  parentStats() {
    const st = this.state.stats;
    const cats = Object.entries(st.byCat).map(([name, c]) => ({ name, ...c, pct: c.asked ? Math.round((c.first / c.asked) * 100) : 0, avgS: c.asked ? c.ms / c.asked / 1000 : 0 }));
    const asked = cats.reduce((a, c) => a + c.asked, 0);
    const first = cats.reduce((a, c) => a + c.first, 0);
    const ms = cats.reduce((a, c) => a + c.ms, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const rec = st.daily[dayKey(d)] || { ms: 0, q: 0, first: 0 };
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), ...rec });
    }
    return { cats, asked, first, pct: asked ? Math.round((first / asked) * 100) : 0, avgS: asked ? ms / asked / 1000 : 0, days, week: days.reduce((a, d) => a + d.ms, 0), today: days[6].ms };
  }

  statusOf(c) {
    if (c.asked < 5) return ['Not enough data yet', 'pd-ok', '#8ea0d6'];
    if (c.pct >= 85) return ['Strong', 'pd-good', '#06d6a0'];
    if (c.pct >= 65) return ['Doing OK', 'pd-ok', '#ffd166'];
    return ['Needs practice', 'pd-bad', '#ef476f'];
  }

  subjectPerfHTML(sub) {
    const st = this.state.stats;
    const cs = this.parentStats().cats.filter(c => c.subj === sub);
    const a = cs.reduce((x, c) => x + c.asked, 0), f = cs.reduce((x, c) => x + c.first, 0);
    if (a < 5) return `<div class="pd-card" style="text-align:left"><b style="font-size:1.2rem">${sub}</b><span>Needs a few more questions (${a} so far) to show how it's going.</span></div>`;
    const pct = Math.round((f / a) * 100);
    const label = pct >= 85 ? ['Excellent', 'pd-good'] : pct >= 70 ? ['Going well', 'pd-good'] : pct >= 55 ? ['Getting there', 'pd-ok'] : ['Needs practice', 'pd-bad'];
    const mine = st.log.filter(r => r.subj === sub);
    const first = r => r.tries === 1;
    let trend = '';
    if (mine.length >= 12) {
      const recent = mine.slice(-8), before = mine.slice(-16, -8);
      if (before.length >= 4) {
        const d = Math.round((recent.filter(first).length / recent.length - before.filter(first).length / before.length) * 100);
        trend = d >= 10 ? `📈 Improving (+${d} points recently)` : d <= -10 ? `📉 Slipping (${d} points recently)` : '➡️ Steady';
      }
    }
    const ranked = cs.filter(c => c.asked >= 3).sort((x, y) => y.pct - x.pct);
    const best = ranked[0], weak = ranked.length > 1 ? ranked[ranked.length - 1] : null;
    const avgS = cs.reduce((x, c) => x + c.ms, 0) / a / 1000;
    return `<div class="pd-card" style="text-align:left">
      <b style="font-size:1.25rem">${sub}: <span class="${label[1]}">${label[0]}</span></b>
      <div class="pd-bar" style="margin:8px 0"><i style="width:${pct}%;background:#06d6a0"></i></div>
      <span style="display:block;line-height:1.6">${pct}% right on the first try across ${a} questions<br>
      Average ${avgS.toFixed(0)}s per question${trend ? '<br>' + trend : ''}
      ${best ? `<br>⭐ Strongest: ${best.name} (${best.pct}%)` : ''}${weak && weak.pct < 80 ? `<br>🎯 Practice: ${weak.name} (${weak.pct}%)` : ''}</span></div>`;
  }

  parentDashboardHTML() {
    const S = this.parentStats();
    const st = this.state.stats;
    const subjects = ['Math', 'Science', 'English'].map(sub => {
      const cs = S.cats.filter(c => c.subj === sub);
      const a = cs.reduce((x, c) => x + c.asked, 0), f = cs.reduce((x, c) => x + c.first, 0);
      return { sub, a, pct: a ? Math.round((f / a) * 100) : 0 };
    });
    const maxMs = Math.max(60000, ...S.days.map(d => d.ms));
    const ranked = S.cats.filter(c => c.asked >= 5).sort((a, b) => a.pct - b.pct);
    const tips = [];
    if (ranked.length) {
      ranked.slice(0, 2).filter(c => c.pct < 85).forEach(c => tips.push(`Practice <b>${c.name}</b> together — first-try accuracy is ${c.pct}%.`));
      const best = ranked[ranked.length - 1]; if (best.pct >= 85) tips.push(`Praise <b>${best.name}</b> — a real strength (${best.pct}% first try).`);
    } else tips.push('Play a few more rounds — tips appear after 5 questions in a skill.');
    const slow = S.cats.filter(c => c.asked >= 5).sort((a, b) => b.avgS - a.avgS)[0];
    if (slow && slow.avgS > 25) tips.push(`<b>${slow.name}</b> takes the longest (~${Math.round(slow.avgS)}s per question) — a good topic to work through on paper.`);
    if (S.week > 0) tips.push(`Average play this week: ${this.fmtMin(S.week / 7)} per day.`);
    const rec = st.log.slice(-12).reverse();
    return `
      <div class="pd-cards">
        <div class="pd-card"><b>${this.fmtMin(S.today)}</b><span>Played today</span></div>
        <div class="pd-card"><b>${this.fmtMin(S.week)}</b><span>Last 7 days</span></div>
        <div class="pd-card"><b>${this.fmtMin(st.totalMs)}</b><span>Total play time</span></div>
        <div class="pd-card"><b>${S.asked}</b><span>Questions answered</span></div>
        <div class="pd-card"><b>${S.pct}%</b><span>Right on first try</span></div>
        <div class="pd-card"><b>${S.avgS ? S.avgS.toFixed(1) + 's' : '–'}</b><span>Avg time / question</span></div>
        <div class="pd-card"><b>${st.sessions || 0}</b><span>Play sessions</span></div>
      </div>
      <div class="pd-sec">📅 Play time — last 7 days</div>
      <div class="pd-chart">${S.days.map(d => `<div class="pd-col"><span>${Math.round(d.ms / 60000)}m</span><i style="height:${Math.round((d.ms / maxMs) * 70)}px"></i>${d.label}</div>`).join('')}</div>
      <div class="pd-sec">📚 By subject (first-try accuracy)</div>
      <table class="pd-table"><tr><th>Subject</th><th>Questions</th><th>Accuracy</th><th></th></tr>
      ${subjects.map(x => `<tr><td>${x.sub}</td><td>${x.a}</td><td>${x.a ? x.pct + '%' : '–'}</td><td><div class="pd-bar"><i style="width:${x.pct}%;background:#06d6a0"></i></div></td></tr>`).join('')}</table>
      <div class="pd-sec">🎯 Skills</div>
      <table class="pd-table"><tr><th>Skill</th><th>Qs</th><th>First try</th><th>Avg time</th><th>Status</th></tr>
      ${S.cats.length ? S.cats.sort((a, b) => a.name.localeCompare(b.name)).map(c => { const [lab, cls, col] = this.statusOf(c); return `<tr><td>${c.name}</td><td>${c.asked}</td><td>${c.pct}% <div class="pd-bar"><i style="width:${c.pct}%;background:${col}"></i></div></td><td>${c.avgS.toFixed(1)}s</td><td class="${cls}">${lab}</td></tr>`; }).join('') : '<tr><td colspan="5">No questions answered yet.</td></tr>'}</table>
      <div class="pd-sec">💡 What to do next</div>
      <ul class="pd-list">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="pd-sec">🎮 Game progress</div>
      <div class="pd-cards">
        <div class="pd-card"><b>${this.state.level}</b><span>Hero level</span></div>
        <div class="pd-card"><b>${Math.min(this.state.maxIsland + 1, BIOMES.length)} / ${BIOMES.length}</b><span>Islands reached</span></div>
        <div class="pd-card"><b>${this.state.dragons.length} / ${DRAGONS.length}</b><span>Dragons tamed</span></div>
        <div class="pd-card"><b>${this.state.gear.length} / ${SURPRISES.length}</b><span>Treasures found</span></div>
      </div>
      <div class="pd-sec">🕒 Recent questions</div>
      <table class="pd-table"><tr><th>When</th><th>Skill</th><th>Tries</th><th>Time</th></tr>
      ${rec.length ? rec.map(r => `<tr><td>${new Date(r.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>${r.cat}</td><td class="${r.tries === 1 ? 'pd-good' : 'pd-bad'}">${r.tries === 1 ? '✔ first try' : r.tries + ' tries'}</td><td>${(r.ms / 1000).toFixed(1)}s</td></tr>`).join('') : '<tr><td colspan="4">Nothing yet.</td></tr>'}</table>
      <div class="pd-sec">📈 How is ${this.state.name} doing? Math vs English</div>
      <div class="pd-cards" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${['Math', 'English'].map(sub => this.subjectPerfHTML(sub)).join('')}</div>
      <div class="pd-actions">
        <button id="pdCopy" class="pd-btn">📋 Copy summary</button>
        <button id="pdCsv" class="pd-btn">⬇️ Answers (CSV)</button>
        <button id="pdJson" class="pd-btn">⬇️ Full data (JSON)</button>
        <button id="pdPinChange" class="pd-btn">🔑 Change PIN</button>
        <button id="pdReset" class="pd-btn danger">🗑️ Erase all data</button>
      </div>`;
  }

  buildSummaryText() {
    const S = this.parentStats();
    const lines = [`DragonCraft report — ${this.state.name} — ${new Date().toLocaleDateString()}`,
      `Play time: today ${this.fmtMin(S.today)}, 7 days ${this.fmtMin(S.week)}, total ${this.fmtMin(this.state.stats.totalMs)}`,
      `Questions: ${S.asked}, right on first try: ${S.pct}%, avg ${S.avgS.toFixed(1)}s each`,
      `Progress: level ${this.state.level}, islands ${Math.min(this.state.maxIsland + 1, BIOMES.length)}/${BIOMES.length}, dragons ${this.state.dragons.length}/${DRAGONS.length}`, 'Skills:'];
    S.cats.forEach(c => lines.push(`  - ${c.name}: ${c.pct}% first try (${c.asked} qs, ${c.avgS.toFixed(1)}s avg) — ${this.statusOf(c)[0]}`));
    return lines.join('\n');
  }

  buildCsv() {
    const rows = [['time', 'subject', 'skill', 'tries', 'seconds', 'island']];
    this.state.stats.log.forEach(r => rows.push([new Date(r.t).toISOString(), r.subj, `"${r.cat}"`, r.tries, (r.ms / 1000).toFixed(1), r.island]));
    return rows.map(r => r.join(',')).join('\n');
  }

  downloadFile(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  bindEvents() {
    document.getElementById('btnParents').addEventListener('click', () => this.openParent());
    document.getElementById('parentClose').addEventListener('click', () => document.getElementById('parentOverlay').classList.add('hidden'));
    this.startTimeTracking();
    // ---- Side menu (Hero / Dragon Book / Islands) ----
    document.querySelectorAll('.side-btn').forEach(b => b.addEventListener('click', () => { sfx.init(); sfx.coin(); this.openMenu(b.dataset.tab); }));
    document.querySelectorAll('.menu-tab').forEach(b => b.addEventListener('click', () => { this.menuTab = b.dataset.tab; sfx.coin(); this.renderMenu(); }));
    document.getElementById('menuClose').addEventListener('click', () => this.closeMenu());
    // 1-Click Play Button
    const nameInput = document.getElementById('heroNameInput');
    nameInput.value = this.state.name;

    document.getElementById('btnPlayNow').addEventListener('click', () => {
      this.state.stats.sessions = (this.state.stats.sessions || 0) + 1;
      sfx.init();
      sfx.spellCharge();
      const typed = nameInput.value.trim();
      if (typed) this.state.name = typed;
      this.save();
      this.updateHUD();
      document.getElementById('titleOverlay').classList.add('hidden');
    });

    // Click anywhere on canvas to walk along the island (or click directly on the glowing objective!)
    this.canvas.addEventListener('pointerdown', e => {
      if (this.mode !== 'WORLD') return;
      sfx.init();

      // Convert screen click to isometric grid or step toward target!
      const iso = this.screenToIso(e.clientX, e.clientY);
      if (iso.gx >= 0 && iso.gx < this.gridSize && iso.gy >= 0 && iso.gy < this.gridSize) {
        this.hero.targetX = iso.gx;
        this.hero.targetY = iso.gy;
      } else if (this.currentTarget) {
        this.hero.targetX = this.currentTarget.x;
        this.hero.targetY = this.currentTarget.y;
      }
    });

    // Keyboard WASD / Arrows also move directly toward target or grid
    window.addEventListener('keydown', e => {
      if (this.mode !== 'WORLD') return;
      if (!document.getElementById('titleOverlay').classList.contains('hidden')) return;
      if (!document.getElementById('spellForgeOverlay').classList.contains('hidden')) return;
      if (!document.getElementById('menuOverlay').classList.contains('hidden')) return;

      const map = {
        ArrowUp: [0, -1], KeyW: [0, -1],
        ArrowDown: [0, 1], KeyS: [0, 1],
        ArrowLeft: [-1, 0], KeyA: [-1, 0],
        ArrowRight: [1, 0], KeyD: [1, 0]
      };
      if (map[e.code]) {
        e.preventDefault();
        this.hero.targetX = Math.max(0, Math.min(this.gridSize - 1, Math.round(this.hero.x) + map[e.code][0]));
        this.hero.targetY = Math.max(0, Math.min(this.gridSize - 1, Math.round(this.hero.y) + map[e.code][1]));
      }
    });

    // ---- iPad thumbstick (multi-touch safe: tracks its own pointer id) ----
    this.joy = { x: 0, y: 0, id: null };
    const joyEl = document.getElementById('joystick');
    const knob = document.getElementById('joystickKnob');
    const R = 52;
    const joyMove = e => {
      const r = joyEl.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      this.joy.x = dx / R;
      this.joy.y = dy / R;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const joyEnd = e => {
      if (e.pointerId !== this.joy.id) return;
      this.joy = { x: 0, y: 0, id: null };
      knob.style.transform = '';
      joyEl.classList.remove('active');
    };
    joyEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      sfx.init();
      this.joy.id = e.pointerId;
      joyEl.setPointerCapture(e.pointerId);
      joyEl.classList.add('active');
      joyMove(e);
    });
    joyEl.addEventListener('pointermove', e => { if (e.pointerId === this.joy.id) joyMove(e); });
    joyEl.addEventListener('pointerup', joyEnd);
    joyEl.addEventListener('pointercancel', joyEnd);

    // ---- 1-tap quest orb: auto-walk to the current objective ----
    document.getElementById('questOrb').addEventListener('click', () => {
      sfx.init();
      sfx.coin();
      if (this.mode === 'WORLD' && this.currentTarget) {
        this.hero.targetX = this.currentTarget.x;
        this.hero.targetY = this.currentTarget.y;
      }
    });

    // Block Safari pinch / double-tap zoom
    ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault()));
    // Block page scroll/rubber-band, but let the menu lists scroll
    document.addEventListener('touchmove', e => {
      if (!e.target.closest || !e.target.closest('.menu-body')) e.preventDefault();
    }, { passive: false });
    // iOS ignores user-scalable=no: kill double-tap-to-zoom (thumbstick, canvas, anywhere)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
      const now = Date.now();
      const interactive = e.target.closest && e.target.closest('button, input, .menu-item');
      if (now - lastTouchEnd < 350 && !interactive) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
    document.addEventListener('dblclick', e => e.preventDefault());

    // Cycle active lead dragon
    document.getElementById('btnSwapDragon').addEventListener('click', () => {
      const sq = this.state.squad;
      if (sq.length > 1) this.state.squad = [...sq.slice(1), sq[0]];
      sfx.coin();
      this.save();
      this.updateHUD();
    });

    // Mute button
    document.getElementById('btnSound').addEventListener('click', () => {
      sfx.muted = !sfx.muted;
      document.getElementById('btnSound').textContent = sfx.muted ? '🔇' : '🔊';
    });

    // Battle Action Buttons
    document.getElementById('btnCastSpell').addEventListener('click', () => {
      this.openSpellForge('ATTACK');
    });
    document.getElementById('btnTameDragon').addEventListener('click', () => {
      this.openSpellForge('TAME');
    });

    // 3-Tap Chest Canvas Interaction
    document.getElementById('chestCanvas').addEventListener('pointerdown', () => {
      this.handleChestTap();
    });

    document.getElementById('btnContinueFromChest').addEventListener('click', () => {
      document.getElementById('chestOverlay').classList.add('hidden');
      this.updateHUD();
    });
  }

  updateHUD() {
    const biome = BIOMES[this.state.islandIndex % BIOMES.length];
    document.getElementById('hudLevelStar').textContent = this.state.level;
    document.getElementById('hudHeroName').textContent = this.state.name;
    document.getElementById('hudCoins').textContent = `⭐ ${this.state.coins}`;
    document.getElementById('hudXpFill').style.width = `${Math.min(100, (this.state.xp / this.state.xpNext) * 100)}%`;

    document.getElementById('questRealmLabel').textContent = biome.name;
    if (this.mode === 'WORLD' && this.currentTarget) {
      document.getElementById('questObjectiveText').textContent = this.currentTarget.label;
    } else if (this.mode === 'BATTLE') {
      document.getElementById('questObjectiveText').textContent = `⚔️ Cast STEM Spells to defeat or tame ${this.battle.enemy.name}!`;
    }

    const activeId = this.leadDragonId();
    const dObj = DRAGONS.find(d => d.id === activeId) || DRAGONS[0];
    document.getElementById('hudDragonText').textContent = `${dObj.name.split(' ')[0]} Lv${this.dragonInfo(activeId).lvl} (${this.state.squad.length}/3)`;
    const sm = document.getElementById('sideMenu');
    if (sm) sm.classList.toggle('hidden', this.mode !== 'WORLD');
  }

  // ==========================================================================
  // ISOMETRIC 3D VOXEL PROJECTION HELPERS
  // ==========================================================================
  isoToScreen(gx, gy, gz = 0) {
    const tileW = 76 * this.scale;
    const tileH = 38 * this.scale;
    const originX = this.vw / 2;
    const originY = this.vh * 0.5 - (this.gridSize * tileH) / 2 + tileH * 0.5;
    const sx = originX + (gx - gy) * (tileW / 2);
    const sy = originY + (gx + gy) * (tileH / 2) - gz * 36 * this.scale;
    return { x: sx, y: sy };
  }

  screenToIso(sx, sy) {
    const tileW = 76 * this.scale;
    const tileH = 38 * this.scale;
    const dx = sx - this.vw / 2;
    const dy = sy - (this.vh * 0.5 - (this.gridSize * tileH) / 2 + tileH * 0.5);
    const gx = Math.round((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
    const gy = Math.round((dy / (tileH / 2) - dx / (tileW / 2)) / 2);
    return { gx, gy };
  }

  drawIsoBlock(gx, gy, gz, heightPx, topColor, leftColor, rightColor, glowOutline = false) {
    const ctx = this.ctx;
    const p = this.isoToScreen(gx, gy, gz);
    const w = 38 * this.scale;
    const h = 19 * this.scale;
    heightPx *= this.scale;

    // Top diamond face
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - h);
    ctx.lineTo(p.x + w, p.y);
    ctx.lineTo(p.x, p.y + h);
    ctx.lineTo(p.x - w, p.y);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    if (glowOutline) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Left face
    ctx.beginPath();
    ctx.moveTo(p.x - w, p.y);
    ctx.lineTo(p.x, p.y + h);
    ctx.lineTo(p.x, p.y + h + heightPx);
    ctx.lineTo(p.x - w, p.y + heightPx);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();

    // Right face
    ctx.beginPath();
    ctx.moveTo(p.x + w, p.y);
    ctx.lineTo(p.x, p.y + h);
    ctx.lineTo(p.x, p.y + h + heightPx);
    ctx.lineTo(p.x + w, p.y + heightPx);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
  }

  // ==========================================================================
  // CHARACTER & DRAGON SPRITE RENDERERS (Animated 60fps Canvas Art)
  // ==========================================================================
  drawWizardSprite(sx, sy, time, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    const bob = Math.sin(time * 0.008) * 4;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Unlocked Aether Wings!
    if (this.state.gear.includes('wings_aether')) {
      const flap = Math.sin(time * 0.012) * 10;
      ctx.fillStyle = '#00f5d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      // Left wing
      ctx.beginPath();
      ctx.moveTo(-8, -28 + bob);
      ctx.lineTo(-42, -52 + bob + flap);
      ctx.lineTo(-32, -16 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(8, -28 + bob);
      ctx.lineTo(42, -52 + bob + flap);
      ctx.lineTo(32, -16 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Voxel Wizard Robe
    const ch = CHARACTERS[(this.previewChar != null ? this.previewChar : this.state.character) % CHARACTERS.length];
    ctx.fillStyle = ch.robe;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-14, -36 + bob, 28, 34);
    ctx.strokeRect(-14, -36 + bob, 28, 34);

    // Voxel Head
    ctx.fillStyle = ch.skin;
    ctx.fillRect(-12, -58 + bob, 24, 22);
    ctx.strokeRect(-12, -58 + bob, 24, 22);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, -50 + bob, 4, 6);
    ctx.fillRect(3, -50 + bob, 4, 6);

    // Hat or Unlocked Golden Crown!
    if (this.state.gear.includes('crown_gold')) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(-14, -58 + bob);
      ctx.lineTo(-14, -74 + bob);
      ctx.lineTo(-6, -65 + bob);
      ctx.lineTo(0, -76 + bob);
      ctx.lineTo(6, -65 + bob);
      ctx.lineTo(14, -74 + bob);
      ctx.lineTo(14, -58 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = ch.hat;
      ctx.beginPath();
      ctx.moveTo(-20, -58 + bob);
      ctx.lineTo(20, -58 + bob);
      ctx.lineTo(0, -86 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing Magic Staff
    const hasSuperStaff = this.state.gear.includes('staff_nether');
    ctx.strokeStyle = hasSuperStaff ? '#ef476f' : '#c97a3e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(18, -4 + bob);
    ctx.lineTo(24, -56 + bob);
    ctx.stroke();

    ctx.fillStyle = hasSuperStaff ? '#ffd166' : '#00f5d4';
    ctx.beginPath();
    ctx.arc(24, -60 + bob, hasSuperStaff ? 10 : 7, 0, Math.PI * 2);
    ctx.fill();

    // Unlocked Orbiting Mini-Star!
    if (this.state.gear.includes('pet_star')) {
      const ox = Math.cos(time * 0.006) * 36;
      const oy = Math.sin(time * 0.006) * 14 - 40 + bob;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawDragonSprite(sx, sy, dragon, time, scale = 1, flipX = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(flipX ? -scale : scale, scale);

    const hover = Math.sin(time * 0.007 + sx) * 7;
    const wingFlap = Math.sin(time * 0.015) * 18;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura glow
    const grad = ctx.createRadialGradient(0, -28 + hover, 4, 0, -28 + hover, 48);
    grad.addColorStop(0, dragon.wing + '66');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -28 + hover, 48, 0, Math.PI * 2);
    ctx.fill();

    // Back Wing
    ctx.fillStyle = dragon.wing;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -34 + hover);
    ctx.lineTo(-42, -68 + hover + wingFlap);
    ctx.lineTo(-28, -22 + hover);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.strokeStyle = dragon.color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, -18 + hover);
    ctx.quadraticCurveTo(-42, -10 + hover, -48, -28 + hover - wingFlap * 0.3);
    ctx.stroke();

    // Voxel Dragon Body
    ctx.fillStyle = dragon.color;
    ctx.strokeStyle = dragon.wing;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-20, -42 + hover, 40, 32, 10);
    ctx.fill();
    ctx.stroke();

    // Belly plate
    ctx.fillStyle = dragon.belly;
    ctx.fillRect(-6, -36 + hover, 20, 22);
    if (dragon.icon) {
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dragon.icon, 4, -19 + hover);
    }

    // Front Wing
    ctx.fillStyle = dragon.wing;
    ctx.beginPath();
    ctx.moveTo(0, -34 + hover);
    ctx.lineTo(-32, -74 + hover + wingFlap);
    ctx.lineTo(-14, -22 + hover);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dragon Head & Snout
    ctx.fillStyle = dragon.color;
    ctx.beginPath();
    ctx.roundRect(8, -62 + hover, 30, 24, 7);
    ctx.fill();
    ctx.stroke();

    // Horns
    ctx.fillStyle = dragon.wing;
    ctx.beginPath();
    ctx.moveTo(12, -62 + hover);
    ctx.lineTo(2, -78 + hover);
    ctx.lineTo(20, -62 + hover);
    ctx.closePath();
    ctx.fill();

    // Glowing Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, -56 + hover, 7, 7);
    ctx.fillStyle = '#090d1a';
    ctx.fillRect(27, -54 + hover, 4, 4);

    // Flame breath spark
    ctx.fillStyle = dragon.wing;
    ctx.beginPath();
    ctx.arc(44, -48 + hover, 5 + Math.sin(time * 0.02) * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================================================
  // MAIN GAME LOOP (World Exploration & Cinematic Battle)
  // ==========================================================================
  loop(time) {
    const ctx = this.ctx;
    const W = this.vw;
    const H = this.vh;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.shakeTime > 0) {
      this.shakeTime--;
      const dx = (Math.random() - 0.5) * this.shakeMag;
      const dy = (Math.random() - 0.5) * this.shakeMag;
      ctx.translate(dx, dy);
    }

    if (this.mode === 'WORLD') {
      this.updateWorld(time);
      this.renderWorld(time, W, H);
    } else if (this.mode === 'BATTLE') {
      this.renderBattle(time, W, H);
    }

    this.updateAndDrawParticles(ctx);
    ctx.restore();

    requestAnimationFrame(t => this.loop(t));
  }

  updateWorld(time) {
    // Thumbstick: screen direction -> isometric grid direction
    const jm = this.joy ? Math.hypot(this.joy.x, this.joy.y) : 0;
    if (jm > 0.2) {
      const vgx = (this.joy.x / 38 + this.joy.y / 19) / 2;
      const vgy = (this.joy.y / 19 - this.joy.x / 38) / 2;
      const vl = Math.hypot(vgx, vgy) || 1;
      const sp = 0.075 * Math.min(1, jm);
      const lim = this.gridSize - 1;
      this.hero.x = Math.max(0, Math.min(lim, this.hero.x + (vgx / vl) * sp));
      this.hero.y = Math.max(0, Math.min(lim, this.hero.y + (vgy / vl) * sp));
      this.hero.targetX = this.hero.x;
      this.hero.targetY = this.hero.y;
      if (Math.random() > 0.5) {
        this.hero.trail.unshift({ x: this.hero.x, y: this.hero.y });
        if (this.hero.trail.length > 60) this.hero.trail.pop();
      }
      if (Math.random() > 0.85) sfx.step();
      this.checkObjectiveReached();
      return;
    }

    // Smoothly move hero toward target tile
    const dx = this.hero.targetX - this.hero.x;
    const dy = this.hero.targetY - this.hero.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.05) {
      const speed = 0.065;
      this.hero.x += (dx / dist) * Math.min(speed, dist);
      this.hero.y += (dy / dist) * Math.min(speed, dist);

      // Record trail for dragon followers!
      if (Math.random() > 0.45) {
        this.hero.trail.unshift({ x: this.hero.x, y: this.hero.y });
        if (this.hero.trail.length > 60) this.hero.trail.pop();
      }
      if (Math.random() > 0.82) sfx.step();
    } else {
      this.hero.x = this.hero.targetX;
      this.hero.y = this.hero.targetY;
      this.checkObjectiveReached();
    }
  }

  checkObjectiveReached() {
    if (!this.currentTarget) return;
    if (!document.getElementById('spellForgeOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('chestOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('menuOverlay').classList.contains('hidden')) return;
    if (performance.now() < (this.nextForgeAt || 0)) return;

    const d = Math.hypot(this.hero.x - this.currentTarget.x, this.hero.y - this.currentTarget.y);
    if (d < 0.35) {
      if (this.state.stageOnIsland === 0) {
        // Stage 0: Mine the Glowing STEM Crystal!
        this.openSpellForge('CRYSTAL');
      } else if (this.state.stageOnIsland === 1) {
        // Stage 1: Wild Guardian Dragon Battle!
        this.startDragonBattle(false);
      } else if (this.state.stageOnIsland === 2) {
        // Stage 2: Island Boss Battle!
        this.startDragonBattle(true);
      }
    }
  }

  renderWorld(time, W, H) {
    const ctx = this.ctx;
    const biome = BIOMES[this.state.islandIndex % BIOMES.length];

    // Sky / Ocean Backdrop
    const bgGrad = ctx.createRadialGradient(W / 2, H * 0.35, 50, W / 2, H / 2, W * 0.8);
    bgGrad.addColorStop(0, '#1e2c5e');
    bgGrad.addColorStop(1, biome.water);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Drifting ambient embers
    this.ambientEmbers.forEach(e => {
      e.y += e.vy;
      if (e.y < 0) e.y = H;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Isometric 9x9 Voxel Island Tiles (Back-to-Front painter's algorithm)
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const isGolden = this.goldenPath.some(p => p.x === gx && p.y === gy);
        const isTarget = this.currentTarget && this.currentTarget.x === gx && this.currentTarget.y === gy;
        const wave = Math.sin(time * 0.003 + (gx + gy) * 0.5) * 0.08;

        let topCol = biome.top;
        let leftCol = biome.left;
        let rightCol = biome.right;

        if (isGolden) {
          topCol = isTarget ? '#ffee32' : '#ffd166';
          leftCol = '#d9822b';
          rightCol = '#a35814';
        }

        this.drawIsoBlock(gx, gy, wave, 26, topCol, leftCol, rightCol, isTarget);

        // Decorative Voxel Trees on border tiles
        if (!isGolden && ((gx === 1 && gy === 1) || (gx === 7 && gy === 6) || (gx === 2 && gy === 7) || (gx === 6 && gy === 5))) {
          this.drawIsoBlock(gx, gy, 0.7 + wave, 22, '#06d6a0', '#04966f', '#025941', false);
        }
      }
    }

    // Draw Current Curated Objective Marker + Pulsing Golden Arrow!
    if (this.currentTarget) {
      const tp = this.isoToScreen(this.currentTarget.x, this.currentTarget.y, 0.5);
      const bounce = Math.sin(time * 0.008) * 10;

      if (this.state.stageOnIsland === 0 && biome.goal.kind !== 'single') {
        ctx.save();
        ctx.translate(tp.x, tp.y - 22 + bounce * 0.4);
        ctx.font = `${Math.round(54 * this.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 24;
        ctx.fillText(biome.goal.icon, 0, 0);
        ctx.restore();
      } else if (this.state.stageOnIsland === 0) {
        // Giant Glowing Redstone/Emerald Crystal Spire
        ctx.save();
        ctx.translate(tp.x, tp.y - 24 + bounce * 0.4);
        ctx.fillStyle = '#ef476f';
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(24, -10);
        ctx.lineTo(0, 18);
        ctx.lineTo(-24, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Wild Dragon or Boss Dragon waiting on the island!
        const bossDragon = DRAGONS.find(d => d.id === (this.state.stageOnIsland === 2 ? biome.bossId : biome.guardId)) || DRAGONS[1];
        this.drawDragonSprite(tp.x, tp.y - 10, bossDragon, time, (this.state.stageOnIsland === 2 ? 1.15 : 0.9) * this.scale, true);
      }

      // Giant Bouncing Golden "CLICK HERE!" Arrow above the active target
      ctx.save();
      ctx.translate(tp.x, tp.y - 95 + bounce);
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#2b1400';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -24);
      ctx.lineTo(16, -24);
      ctx.lineTo(16, -4);
      ctx.lineTo(28, -4);
      ctx.lineTo(0, 22);
      ctx.lineTo(-28, -4);
      ctx.lineTo(-16, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw Flying Dragon Followers behind the Hero!
    this.state.squad.forEach((dId, idx) => {
      const dObj = DRAGONS.find(d => d.id === dId) || DRAGONS[0];
      const trailStep = Math.min(this.hero.trail.length - 1, (idx + 1) * 8);
      const pos = this.hero.trail[trailStep] || { x: this.hero.x - 0.7 * (idx + 1), y: this.hero.y };
      const sp = this.isoToScreen(pos.x, pos.y, 0.65);
      this.drawDragonSprite(sp.x - 18 * this.scale, sp.y, dObj, time + idx * 400, 0.72 * this.scale, false);
    });

    // Draw Player Wizard Hero
    const hp = this.isoToScreen(this.hero.x, this.hero.y, 0.4);
    this.drawWizardSprite(hp.x, hp.y, time, 1.05 * this.scale);
  }

  // ==========================================================================
  // CINEMATIC PRODIGY DRAGON BATTLE ARENA
  // ==========================================================================
  startDragonBattle(isBoss) {
    this.mode = 'BATTLE';
    const biome = BIOMES[this.state.islandIndex % BIOMES.length];
    const enemyDragon = DRAGONS.find(d => d.id === (isBoss ? biome.bossId : biome.guardId)) || DRAGONS[2];

    const loop = Math.floor(this.state.islandIndex / BIOMES.length);
    const hpMult = Math.pow(1.2, loop) * (1 + 0.06 * (this.state.islandIndex % BIOMES.length));

    this.battle = {
      enemy: enemyDragon,
      enemyHp: isBoss ? Math.round(120 * hpMult) : Math.round(80 * hpMult),
      enemyMaxHp: isBoss ? Math.round(120 * hpMult) : Math.round(80 * hpMult),
      heroHp: 100,
      heroMaxHp: 100,
      laserAnim: 0,
      tameAnim: 0,
      isBoss
    };

    sfx.spellCharge();
    this.joy = { x: 0, y: 0, id: null };
    document.getElementById('joystick').classList.add('hidden');
    document.getElementById('questOrb').classList.add('hidden');
    document.getElementById('battleDock').classList.remove('hidden');
    this.updateHUD();
  }

  renderBattle(time, W, H) {
    const ctx = this.ctx;

    // Dramatic Arcane Arena Sky
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H / 2, W * 0.75);
    grad.addColorStop(0, '#3c096c');
    grad.addColorStop(1, '#090c1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const leftX = W * 0.27;
    const rightX = W * 0.73;
    const platY = H * 0.62;

    // Left Hero Floating Voxel Platform
    ctx.fillStyle = '#1b9aaa';
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(leftX, platY + 25, 135, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Enemy Floating Voxel Platform
    ctx.fillStyle = '#781d09';
    ctx.strokeStyle = '#ef476f';
    ctx.beginPath();
    ctx.ellipse(rightX, platY + 25, 135, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Hero + Lead Companion Dragon on Left Platform
    const leadId = this.leadDragonId();
    const leadDragon = DRAGONS.find(d => d.id === leadId) || DRAGONS[0];
    this.drawWizardSprite(leftX - 55, platY + 8, time, 1.35);
    this.drawDragonSprite(leftX + 35, platY - 12, leadDragon, time, 1.35, false);

    // Draw Wild Enemy Dragon on Right Platform
    const enemyScale = this.battle.isBoss ? 1.65 : 1.4;
    this.drawDragonSprite(rightX, platY - 10, this.battle.enemy, time, enemyScale, true);

    // Draw Floating Overhead Health Bars
    this.drawOverheadHealthBar(ctx, leftX, platY - 155, `${this.state.name} & ${leadDragon.name.split(' ')[0]}`, this.battle.heroHp, this.battle.heroMaxHp, '#06d6a0');
    this.drawOverheadHealthBar(ctx, rightX, platY - 155, `${this.battle.isBoss ? '👑 BOSS: ' : ''}${this.battle.enemy.name}`, this.battle.enemyHp, this.battle.enemyMaxHp, '#ef476f');

    // Animated Dragon Fire / Laser Beam during Spell Attack!
    if (this.battle.laserAnim > 0) {
      this.battle.laserAnim--;
      ctx.save();
      ctx.strokeStyle = leadDragon.wing;
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(leftX + 65, platY - 45);
      ctx.lineTo(rightX - 20, platY - 45);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawOverheadHealthBar(ctx, x, y, title, hp, maxHp, color) {
    const w = 230;
    const h = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 13, 28, 0.88)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 30, w, 58, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x, y - 9);

    ctx.fillStyle = '#090d1a';
    ctx.fillRect(x - w / 2 + 14, y, w - 28, h);

    const ratio = Math.max(0, hp / maxHp);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2 + 14, y, (w - 28) * ratio, h);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${hp} / ${maxHp} HP`, x, y + 16);
    ctx.restore();
  }

  // ==========================================================================
  // INTERACTIVE VISUAL STEM SPELL-FORGE
  // ==========================================================================
  openSpellForge(actionType) {
    this.pendingAction = actionType;
    this.qStart = performance.now();
    this.qWrong = 0;
    const biomeNow = BIOMES[this.state.islandIndex % BIOMES.length];
    const challenge = createVisualSTEMChallenge(this.state.level, actionType === 'CRYSTAL' ? biomeNow.goal.focus : 'mixed');
    this.activeChallenge = challenge;
    const ci = challengeInfo(challenge.topic);
    challenge.cat = ci[0];
    challenge.subj = ci[1];

    document.getElementById('forgeTopicBadge').textContent = challenge.topic;
    document.getElementById('forgeStreakText').textContent = `🔥 Combo: ${this.state.streak}x`;
    document.getElementById('forgeQuestionPrompt').textContent = challenge.prompt;

    const tipEl = document.getElementById('forgeHelperTip');
    tipEl.classList.add('hidden');
    tipEl.textContent = `💡 Visual Hint: ${challenge.hint}`;

    // Draw the visual diagram on #stemDiagramCanvas!
    const diagCanvas = document.getElementById('stemDiagramCanvas');
    const diagCtx = diagCanvas.getContext('2d');
    challenge.drawDiagram(diagCtx);

    // Render 3 Giant Tactile Rune Stone Buttons
    const row = document.getElementById('runeChoicesRow');
    row.innerHTML = challenge.choices
      .map(c => `<button class="rune-stone-btn" data-val="${c}">🔮 ${c}</button>`)
      .join('');

    row.querySelectorAll('.rune-stone-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleRuneChoice(btn, btn.dataset.val));
    });

    document.getElementById('spellForgeOverlay').classList.remove('hidden');
  }

  handleRuneChoice(btn, val) {
    const ch = this.activeChallenge;
    if (!ch) return;

    if (String(val) === String(ch.correct)) {
      btn.classList.add('correct');
      this.recordAnswer();
      sfx.spellCharge();
      this.state.streak++;

      setTimeout(() => {
        document.getElementById('spellForgeOverlay').classList.add('hidden');
        this.executeSuccessfulSpell();
      }, 480);
    } else {
      // Zero-shame instant visual scaffold! Keep modal open so they see the visual hint & succeed!
      btn.classList.add('wrong');
      this.qWrong = (this.qWrong || 0) + 1;
      this.state.streak = 1;
      sfx.wrongTry();
      document.getElementById('forgeHelperTip').classList.remove('hidden');

      if (this.mode === 'BATTLE' && this.battle) {
        this.battle.heroHp = Math.max(0, this.battle.heroHp - 15);
        this.triggerScreenShake(8, 10);
        this.spawnFloatText(this.vw * 0.27, this.vh * 0.62 - 80, '💥 -15 HP Wrong Try!', '#ef476f');
        if (this.battle.heroHp <= 0) {
          this.handleHeroNaps();
        }
      }
    }
  }

  handleHeroNaps() {
    sfx.wrongTry();
    this.spawnFloatText(this.vw / 2, this.vh / 2 - 40, '💤 Dragon naps — try again!', '#ffd166');
    this.battle.heroHp = this.battle.heroMaxHp;
    document.getElementById('spellForgeOverlay').classList.add('hidden');
  }

  executeSuccessfulSpell() {
    const W = this.vw;
    const H = this.vh;

    // Award coins & XP
    const earnedCoins = 25 * Math.min(this.state.streak, 10);
    this.state.coins += earnedCoins;
    this.gainXP(40);
    this.gainDragonXP(35);

    if (this.pendingAction === 'CRYSTAL') {
      const goal = BIOMES[this.state.islandIndex % BIOMES.length].goal;
      sfx.laserBlast();
      this.triggerScreenShake(12, 14);
      const tp = this.isoToScreen(this.currentTarget.x, this.currentTarget.y, 0.5);
      this.spawnBurst(tp.x, tp.y, '#06d6a0', 32);
      this.state.goalProgress = (this.state.goalProgress || 0) + 1;
      this.nextForgeAt = performance.now() + 1100;

      if (this.state.goalProgress < goal.n) {
        this.spawnFloatText(tp.x, tp.y - 40, `${goal.icon} ${this.state.goalProgress} / ${goal.n}!`, '#ffd166');
      } else {
        this.spawnFloatText(tp.x, tp.y - 40, `+${earnedCoins} GOLD & MANA! GOAL DONE!`, '#ffd166');
        this.state.goalProgress = 0;
        this.state.stageOnIsland = 1;
      }
      this.setupIslandEncounters();
      this.save();
      return;
    }

    // In Battle!
    const rightX = W * 0.73;
    const platY = H * 0.62;

    if (this.pendingAction === 'TAME') {
      // Tame the wild dragon if not already owned!
      const enemyId = this.battle.enemy.id;
      if (!this.state.dragons.includes(enemyId)) {
        this.state.dragons.push(enemyId);
        this.equipNew(enemyId);
      }
      sfx.chestExplode();
      this.spawnBurst(rightX, platY - 30, '#00f5d4', 45);
      this.spawnFloatText(rightX, platY - 90, `🐉 TAMED ${this.battle.enemy.name.toUpperCase()}!`, '#00f5d4');
      this.battle.enemyHp = 0;
    } else {
      // Fire Dragon Laser Attack!
      sfx.laserBlast();
      this.battle.laserAnim = 22;
      this.triggerScreenShake(16, 18);
      const lvl = this.dragonInfo(this.leadDragonId()).lvl;
      const dmg = Math.round((60 + (this.state.gear.includes('staff_nether') ? 35 : 0)) * (1 + 0.06 * lvl));
      this.battle.enemyHp = Math.max(0, this.battle.enemyHp - dmg);
      this.spawnBurst(rightX, platY - 30, '#ffd166', 38);
      this.spawnFloatText(rightX, platY - 80, `💥 -${dmg} SUPER SPELL!`, '#ffd166');
    }

    if (this.battle.enemyHp <= 0) {
      setTimeout(() => this.finishBattleVictory(), 950);
    } else {
      // Enemy gentle counter-attack
      setTimeout(() => {
        this.battle.heroHp = Math.max(0, this.battle.heroHp - 18);
        this.triggerScreenShake(8, 10);
        if (this.battle.heroHp <= 0) {
          this.handleHeroNaps();
        }
      }, 550);
    }

    this.save();
    this.updateHUD();
  }

  finishBattleVictory() {
    document.getElementById('battleDock').classList.add('hidden');
    document.getElementById('joystick').classList.remove('hidden');
    document.getElementById('questOrb').classList.remove('hidden');
    this.mode = 'WORLD';

    if (this.state.stageOnIsland === 1) {
      this.state.stageOnIsland = 2;
      this.setupIslandEncounters();
      this.openInteractiveChest('🎁 GUARDIAN VICTORY CHEST!', 'You defeated the Bridge Guardian!');
    } else {
      if (this.state.islandIndex % BIOMES.length === BIOMES.length - 1) {
        this.openInteractiveChest('🎉 FINAL REALM CELEBRATION CHEST!', 'You conquered all 12 realms! Now looping into Master Islands with +20% stronger dragons!');
      } else if (this.state.islandIndex >= BIOMES.length) {
        this.openInteractiveChest('👑 MASTER REALM MYSTERY CHEST!', `You conquered the looping island realm! (+20% Enemy HP loop active)`);
      } else {
        this.openInteractiveChest('👑 ISLAND BOSS MYSTERY CHEST!', `You conquered the Island and reached a new realm!`);
      }
      this.state.islandIndex++;
      this.state.maxIsland = Math.max(this.state.maxIsland || 0, this.state.islandIndex);
      this.state.stageOnIsland = 0;
      this.state.goalProgress = 0;
      this.hero.x = 1;
      this.hero.y = 4;
      this.hero.targetX = 1;
      this.hero.targetY = 4;
      this.setupIslandEncounters();
    }
    this.save();
  }

  gainXP(amount) {
    this.state.xp += amount;
    while (this.state.xp >= this.state.xpNext) {
      this.state.xp -= this.state.xpNext;
      this.state.level++;
      this.state.xpNext = Math.round(this.state.xpNext * 1.25);
    }
  }

  // ==========================================================================
  // INTERACTIVE "TAP 3 TIMES TO BREAK OPEN!" 3D VOXEL CHEST
  // ==========================================================================
  openInteractiveChest(headline, subtext) {
    // Pick an unowned gear surprise or dragon!
    const unownedGear = SURPRISES.filter(g => !this.state.gear.includes(g.id));
    const unownedDragons = DRAGONS.filter(d => !this.state.dragons.includes(d.id));

    let reward;
    if (unownedGear.length > 0) {
      const g = unownedGear[0];
      this.state.gear.push(g.id);
      reward = { icon: g.icon, name: g.name, desc: g.desc, fact: g.fact };
    } else if (unownedDragons.length > 0) {
      const d = unownedDragons[Math.floor(Math.random() * unownedDragons.length)];
      this.state.dragons.push(d.id);
      this.equipNew(d.id);
      reward = {
        icon: '🐉',
        name: `New Dragon: ${d.name}`,
        desc: `${d.name} now flies behind you on every island!`,
        fact: 'STEM Secret: Flying creatures have hollow, lightweight bones to soar through the sky!'
      };
    } else {
      this.state.coins += 250;
      reward = {
        icon: '💎',
        name: '250 Mythic Voxel Gems!',
        desc: 'Supercharged your Wizard Level & Dragon Power!',
        fact: 'STEM Secret: Emeralds get their bright green color from trace amounts of chromium and vanadium!'
      };
    }

    this.chestState = { taps: 0, opened: false, shake: 0, pendingReward: reward };

    document.getElementById('chestHeadline').textContent = headline;
    document.getElementById('chestSubtext').textContent = subtext;
    document.getElementById('chestTapPrompt').classList.remove('hidden');
    document.getElementById('chestTapPrompt').textContent = '👆 TAP THE CHEST 3 TIMES TO BREAK IT OPEN!';
    document.getElementById('rewardRevealBox').classList.add('hidden');
    document.getElementById('btnContinueFromChest').classList.add('hidden');
    document.getElementById('chestOverlay').classList.remove('hidden');

    this.drawChestCanvas();
    this.save();
  }

  handleChestTap() {
    if (this.chestState.opened) return;
    this.chestState.taps++;
    const left = 3 - this.chestState.taps;

    if (left > 0) {
      sfx.chestTap(this.chestState.taps);
      document.getElementById('chestTapPrompt').textContent = `💥 CRACK! TAP ${left} MORE TIME${left > 1 ? 'S' : ''}!`;
      this.drawChestCanvas();
    } else {
      // BOOM! Unbox the surprise!
      this.chestState.opened = true;
      sfx.chestExplode();
      document.getElementById('chestTapPrompt').classList.add('hidden');

      const r = this.chestState.pendingReward;
      document.getElementById('rewardBigIcon').textContent = r.icon;
      document.getElementById('rewardNameText').textContent = r.name;
      document.getElementById('rewardPowerText').textContent = r.desc;
      document.getElementById('rewardFactText').textContent = r.fact;

      document.getElementById('rewardRevealBox').classList.remove('hidden');
      document.getElementById('btnContinueFromChest').classList.remove('hidden');
      this.drawChestCanvas();
    }
  }

  drawChestCanvas() {
    const c = document.getElementById('chestCanvas');
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    const cx = c.width / 2;
    const cy = c.height / 2 + 15;
    const taps = this.chestState.taps;
    const opened = this.chestState.opened;

    // Radial light burst behind chest (grows with each tap!)
    const radius = opened ? 115 : 55 + taps * 22;
    const grad = ctx.createRadialGradient(cx, cy - 15, 5, cx, cy - 15, radius);
    grad.addColorStop(0, '#ffee32');
    grad.addColorStop(0.5, '#ff9f1c88');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy - 15, radius, 0, Math.PI * 2);
    ctx.fill();

    // Chest Base Box
    ctx.fillStyle = '#7209b7';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cx - 65, cy - 20, 130, 72, 12);
    ctx.fill();
    ctx.stroke();

    // Glowing cracks when tapped
    if (taps > 0 && !opened) {
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx - 18, cy + 12);
      ctx.lineTo(cx + 12, cy + 32);
      ctx.stroke();
    }

    // Chest Lid (Flies open when opened!)
    ctx.save();
    if (opened) {
      ctx.translate(0, -38);
      ctx.rotate(-0.18);
    }
    ctx.fillStyle = '#ef476f';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cx - 70, cy - 55, 140, 38, 12);
    ctx.fill();
    ctx.stroke();

    // Golden Lock Emblem
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(cx - 14, cy - 30, 28, 28);
    ctx.restore();
  }

  // ==========================================================================
  // JUICY PARTICLES, SCREEN SHAKE & FLOATING NUMBERS
  // ==========================================================================
  triggerScreenShake(frames, magnitude) {
    this.shakeTime = frames;
    this.shakeMag = magnitude;
  }

  spawnBurst(x, y, color, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 5 + Math.random() * 7,
        color: i % 2 === 0 ? color : '#ffd166',
        life: 35 + Math.random() * 20
      });
    }
  }

  spawnFloatText(x, y, text, color) {
    this.floatTexts.push({ x, y, text, color, life: 55 });
  }

  updateAndDrawParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y -= 1.2;
      ft.life--;
      ctx.save();
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#090d1a';
      ctx.lineWidth = 5;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      if (ft.life <= 0) this.floatTexts.splice(i, 1);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new DragonCraftWorld();
});
