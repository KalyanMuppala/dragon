// ============================================================================
// DRAGONCRAFT: PRODIGY REALM — 60FPS 2.5D ISOMETRIC VOXEL & DRAGON ENGINE
// Designed with zero UI clutter: 1-Click Entry, Guided Golden Path,
// Visual Diagram STEM Spell-Forge, and 3-Tap Interactive Surprise Chests!
// ============================================================================

const SAVE_KEY = 'dragoncraft_prodigy_save_v2';  // unchanged so earlier progress carries over

// --- PROCEDURAL WEB AUDIO SYNTHESIZER (Chiptune + Magical SFX + gentle background music) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicNote = 2;
    // Never keep playing in the background
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      try {
        if (document.visibilityState === 'hidden') this.ctx.suspend();
        else if (!this.muted) this.ctx.resume();
      } catch (e) {}
    });
  }
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended' && document.visibilityState === 'visible') {
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
  // Soft pentatonic background music (random-walk melody over a slow C - Am - F - G bass)
  startMusic() {
    if (this.musicTimer) return;
    this.musicTimer = setInterval(() => this.musicTick(), 650);
  }
  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
  musicTick() {
    if (this.muted || !this.musicEnabled || !this.ctx || document.visibilityState !== 'visible') return;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const bass = [130.81, 110.0, 87.31, 98.0];
    this.musicStep++;
    if (this.musicStep % 4 === 1) this.tone(bass[Math.floor(this.musicStep / 4) % 4], 'triangle', 1.6, 0, 0.05);
    const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
    this.musicNote = Math.max(0, Math.min(scale.length - 1, this.musicNote + move));
    if (Math.random() < 0.8) this.tone(scale[this.musicNote], 'sine', 1.1, 0, 0.035);
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

function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// SHARED HELPERS, SAVE MODEL, FUN FACTS & BADGES
// (Question generation lives in questions.js; parent tools live in parent.js)
// ============================================================================
const APP_VERSION = (() => {
  const m = document.querySelector('meta[name="app-version"]');
  const v = m ? m.content : '';
  return !v || v.includes('__V__') ? 'dev' : v;
})();

// Older iPad Safari (< 16) has no roundRect: add a safe fallback
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(Array.isArray(r) ? r[0] : (r || 0), w / 2, h / 2);
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
  };
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const FACTS = [
  'Honey never spoils — edible honey has been found in ancient Egyptian tombs!',
  'A day on Venus is longer than a year on Venus.',
  'Octopuses have three hearts.',
  'Bananas are berries, but strawberries are not!',
  'Lightning is about five times hotter than the surface of the Sun.',
  'Babies are born with about 300 bones, but grown-ups have 206.',
  'A group of flamingos is called a "flamboyance".',
  'Sound travels about four times faster in water than in air.',
  'The Moon drifts about 3.8 cm (1.5 inches) farther from Earth every year.',
  'Sharks have been around longer than trees!',
  'A fluffy cloud can weigh as much as 100 elephants.',
  'Butterflies taste with their feet.',
  'Your brain uses about as much power as a small light bulb.',
  'Dolphins sleep with half of their brain awake.',
  'Polar bear fur is see-through — their skin is black!',
  'Ants can lift 10 to 50 times their own body weight.',
  'The centre of the Earth is about as hot as the surface of the Sun.',
  'The Eiffel Tower grows a few inches taller in summer when the iron heats up.'
];

const ACHIEVEMENTS = [
  { id: 'first_spell', icon: '✨', name: 'First Spell', desc: 'Answer your first question', test: g => g.state.qCount >= 1 },
  { id: 'q10', icon: '🪄', name: 'Apprentice', desc: 'Answer 10 questions', test: g => g.state.qCount >= 10 },
  { id: 'q50', icon: '📚', name: 'Spell Scholar', desc: 'Answer 50 questions', test: g => g.state.qCount >= 50 },
  { id: 'q100', icon: '🧙', name: 'Grand Wizard', desc: 'Answer 100 questions', test: g => g.state.qCount >= 100 },
  { id: 'q300', icon: '👑', name: 'Legend', desc: 'Answer 300 questions', test: g => g.state.qCount >= 300 },
  { id: 'run5', icon: '🔥', name: 'Combo Starter', desc: '5 first-try answers in a row', test: g => (g.state.bestRun || 0) >= 5 },
  { id: 'run10', icon: '⚡', name: 'Unstoppable', desc: '10 first-try answers in a row', test: g => (g.state.bestRun || 0) >= 10 },
  { id: 'run20', icon: '💎', name: 'Flawless', desc: '20 first-try answers in a row', test: g => (g.state.bestRun || 0) >= 20 },
  { id: 'tame1', icon: '🐲', name: 'Dragon Tamer', desc: 'Tame your first wild dragon', test: g => g.state.dragons.length >= 2 },
  { id: 'tame5', icon: '🐉', name: 'Dragon Keeper', desc: 'Own 5 dragons', test: g => g.state.dragons.length >= 5 },
  { id: 'tame12', icon: '🏆', name: 'Dragon Master', desc: 'Own 12 dragons', test: g => g.state.dragons.length >= 12 },
  { id: 'tame25', icon: '🌟', name: 'Dragon Legend', desc: 'Own 100 dragons', test: g => g.state.dragons.length >= 100 },
  { id: 'isl3', icon: '🧭', name: 'Explorer', desc: 'Reach Island 3', test: g => g.state.maxIsland >= 2 },
  { id: 'isl6', icon: '⛵', name: 'Voyager', desc: 'Reach Island 6', test: g => g.state.maxIsland >= 5 },
  { id: 'isl12', icon: '🌍', name: 'World Traveler', desc: 'Reach Island 12', test: g => g.state.maxIsland >= 11 },
  { id: 'dlvl5', icon: '🥋', name: 'Dragon Trainer', desc: 'Get a dragon to Level 5', test: g => Object.values(g.state.dragonLevels).some(d => d.lvl >= 5) },
  { id: 'dlvl10', icon: '🏅', name: 'Dragon Champion', desc: 'Get a dragon to Level 10', test: g => Object.values(g.state.dragonLevels).some(d => d.lvl >= 10) },
  { id: 'math_whiz', icon: '➗', name: 'Math Whiz', desc: '25 math questions, 80%+ right first try', test: g => { const s = g.subjectStat('Math'); return s.asked >= 25 && s.first / s.asked >= 0.8; } },
  { id: 'word_wiz', icon: '📖', name: 'Word Wizard', desc: '25 English questions, 80%+ right first try', test: g => { const s = g.subjectStat('English'); return s.asked >= 25 && s.first / s.asked >= 0.8; } },
  { id: 'sci_star', icon: '🔬', name: 'Science Star', desc: '15 science questions, 80%+ right first try', test: g => { const s = g.subjectStat('Science'); return s.asked >= 15 && s.first / s.asked >= 0.8; } },
  { id: 'all_round', icon: '🎓', name: 'All-Rounder', desc: '10+ questions each in Math, English and Science', test: g => ['Math', 'English', 'Science'].every(x => g.subjectStat(x).asked >= 10) },
  { id: 'skill4', icon: '🧗', name: 'Skill Climber', desc: 'Reach Level 4 in any skill', test: g => Object.values(g.state.skills).some(x => x.tier >= 4) },
  { id: 'skill5', icon: '🧠', name: 'Master Learner', desc: 'Reach Level 5 in any skill', test: g => Object.values(g.state.skills).some(x => x.tier >= 5) },
  { id: 'days3', icon: '📅', name: 'Come-Back Hero', desc: 'Play on 3 different days', test: g => Object.values(g.state.stats.daily).filter(x => (x.q || 0) > 0).length >= 3 },
  { id: 'week', icon: '🗓️', name: 'Week Warrior', desc: 'Play 7 days in a row', test: g => (g.state.daily.best || 0) >= 7 },
  { id: 'goal_day', icon: '🎯', name: 'Daily Champion', desc: 'Reach your daily question goal', test: g => Object.values(g.state.stats.daily).some(x => x.goal) },
  { id: 'comeback', icon: '🔁', name: 'Comeback Kid', desc: 'Fix 5 earlier mistakes on review questions', test: g => (g.state.stats.reviewFixed || 0) >= 5 },
  { id: 'squad3', icon: '🛡️', name: 'Squad Goals', desc: 'Equip 3 dragons at once', test: g => g.state.squad.length >= 3 },
  { id: 'looks', icon: '🎭', name: 'New Look', desc: 'Change your hero', test: g => !!g.state.charChanged },
  { id: 'chef', icon: '🍖', name: 'Dragon Chef', desc: 'Feed a dragon', test: g => (g.state.stats.feeds || 0) >= 1 },
  { id: 'hunter', icon: '🗝️', name: 'Treasure Hunter', desc: 'Find all 4 magic treasures', test: g => g.state.gear.length >= SURPRISES.length },
  { id: 'rich', icon: '💰', name: 'Rich Wizard', desc: 'Collect 1,000 ⭐', test: g => g.state.coins >= 1000 }
];

function defaultSaveState() {
  return {
    v: 3,
    name: 'Leo the Dragonborn',
    level: 1, xp: 0, xpNext: 100, coins: 100, streak: 1, run: 0, bestRun: 0,
    islandIndex: 0, stageOnIsland: 0, goalProgress: 0, maxIsland: 0,
    dragons: ['ignis'], activeDragonIdx: 0, squad: ['ignis'], dragonLevels: {},
    gear: [], character: 0, charChanged: false,
    foods: { beef: 3, fish: 3, apple: 3, carrot: 2, honey: 2, melon: 2 },  // taming foods
    pendingQ: 0,         // 1 while a question is open: closing the app counts as a miss
    qCount: 0,
    skills: {},          // skill name -> { tier 1-5, recent [1/0 ...], seen }
    review: [],          // missed questions to re-ask later: { seed, kind, tier, due, n }
    recentSigs: [],      // last questions asked (avoid immediate repeats)
    achievements: {},    // badge id -> unlocked timestamp
    daily: { last: '', streak: 0, best: 0, pendingChest: false },
    seenTutorial: false,
    lastBackup: 0,
    settings: { grade: 4, focus: 'balanced', focusSkill: '', dailyGoalQ: 10, limitMin: 0, bedtimeOn: false, bedStart: '20:30', bedEnd: '07:00', breakMin: 25, autoRead: false, music: true },
    stats: { sessions: 0, totalMs: 0, byCat: {}, daily: {}, log: [], mistakes: [], extra: {}, reviewFixed: 0, feeds: 0, penalties: 0, tamed: 0, firstPlayed: Date.now() }
  };
}

// Turn ANY saved/imported object into a safe, complete save (fills gaps, clamps numbers, upgrades old names)
function normalizeSave(raw) {
  const d = defaultSaveState();
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const s = Object.assign({}, d, r);
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  s.settings = Object.assign({}, d.settings, obj(r.settings));
  s.stats = Object.assign({}, d.stats, obj(r.stats));
  s.daily = Object.assign({}, d.daily, obj(r.daily));
  if (typeof s.name !== 'string' || !s.name.trim()) s.name = d.name;
  s.name = s.name.slice(0, 20);
  ['dragons', 'gear', 'review', 'recentSigs'].forEach(k => { if (!Array.isArray(s[k])) s[k] = d[k].slice(); });
  ['skills', 'achievements', 'dragonLevels'].forEach(k => { s[k] = obj(s[k]); });
  ['log', 'mistakes'].forEach(k => { if (!Array.isArray(s.stats[k])) s.stats[k] = []; });
  ['byCat', 'daily', 'extra'].forEach(k => { s.stats[k] = obj(s.stats[k]); });
  ['level', 'xp', 'xpNext', 'coins', 'streak', 'run', 'bestRun', 'islandIndex', 'stageOnIsland', 'goalProgress', 'maxIsland', 'qCount', 'character'].forEach(k => {
    if (!Number.isFinite(s[k])) s[k] = d[k];
  });
  s.level = Math.max(1, Math.floor(s.level));
  s.xpNext = Math.max(50, s.xpNext);
  s.coins = Math.max(0, Math.floor(s.coins));
  s.islandIndex = Math.max(0, Math.floor(s.islandIndex));
  s.stageOnIsland = clamp(Math.floor(s.stageOnIsland), 0, 2);
  s.maxIsland = Math.max(Math.floor(s.maxIsland), s.islandIndex);
  s.character = clamp(Math.floor(s.character), 0, CHARACTERS.length - 1);

  const st = s.settings;
  const num = (v, lo, hi, def) => { const n = Number(v); return Number.isFinite(n) ? clamp(Math.round(n), lo, hi) : def; };
  st.grade = num(st.grade, 2, 5, 4);
  if (!['balanced', 'math', 'english', 'science'].includes(st.focus)) st.focus = 'balanced';
  if (!ALL_KINDS.includes(st.focusSkill)) st.focusSkill = '';
  st.dailyGoalQ = num(st.dailyGoalQ, 0, 100, 10);
  st.limitMin = num(st.limitMin, 0, 600, 0);
  st.breakMin = num(st.breakMin, 0, 120, 25);
  st.bedtimeOn = !!st.bedtimeOn; st.autoRead = !!st.autoRead; st.music = st.music !== false;
  if (!/^\d{2}:\d{2}$/.test(st.bedStart || '')) st.bedStart = '20:30';
  if (!/^\d{2}:\d{2}$/.test(st.bedEnd || '')) st.bedEnd = '07:00';

  // ---- sanitise statistics (a damaged/hand-edited save or report must never show NaN or crash) ----
  const fin = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
  const nn = v => Math.max(0, fin(v));
  const mapCat = c => (typeof LEGACY_CATS !== 'undefined' && LEGACY_CATS[c]) || String(c);
  const SUBJECTS = ['Math', 'English', 'Science'];
  const subjOfCat = {};
  Object.values(KIND_META).forEach(m => { subjOfCat[m.cat] = m.subj; });
  const subjFor = (cat, hint) => subjOfCat[cat] || (SUBJECTS.includes(hint) ? hint : 'Math');

  const bc = {};
  Object.entries(s.stats.byCat).forEach(([k, v]) => {
    if (!v || typeof v !== 'object') return;
    const nk = mapCat(k);
    const e = bc[nk] || (bc[nk] = { subj: subjFor(nk, v.subj), asked: 0, first: 0, tries: 0, ms: 0 });
    e.asked += Math.floor(nn(v.asked)); e.first += Math.floor(nn(v.first)); e.tries += Math.floor(nn(v.tries)); e.ms += nn(v.ms);
  });
  Object.keys(bc).forEach(k => {
    const e = bc[k];
    e.first = Math.min(e.first, e.asked);
    if (e.asked <= 0) delete bc[k];
  });
  s.stats.byCat = bc;

  s.stats.log = s.stats.log
    .filter(l => l && typeof l === 'object' && typeof l.cat === 'string' && Number.isFinite(Number(l.t)))
    .map(l => {
      const cat = mapCat(l.cat);
      const tries = Math.max(0, Math.floor(fin(l.tries, 1)));
      return { t: Number(l.t), cat, subj: subjFor(cat, l.subj), tries, ms: clamp(fin(l.ms), 0, 120000), first: l.first !== undefined ? (l.first ? 1 : 0) : (tries === 1 ? 1 : 0), tier: clamp(Math.round(fin(l.tier, 0)), 0, 5), review: l.review ? 1 : 0, skip: l.skip ? 1 : 0, island: Math.max(0, Math.floor(fin(l.island))) };
    });
  s.stats.mistakes = s.stats.mistakes
    .filter(l => l && typeof l === 'object' && typeof l.cat === 'string' && Number.isFinite(Number(l.t)))
    .map(l => ({ t: Number(l.t), cat: mapCat(l.cat), subj: subjFor(mapCat(l.cat), l.subj), q: String(l.q == null ? '' : l.q).slice(0, 200), picked: String(l.picked == null ? '' : l.picked).slice(0, 80), correct: String(l.correct == null ? '' : l.correct).slice(0, 80), island: Math.max(0, Math.floor(fin(l.island))) }));
  const dly = {};
  Object.entries(s.stats.daily).forEach(([k, v]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== 'object') return;
    const q = Math.floor(nn(v.q));
    dly[k] = { ms: nn(v.ms), q, first: Math.min(Math.floor(nn(v.first)), q) };
    if (v.goal) dly[k].goal = 1;
  });
  s.stats.daily = dly;
  const ext = {};
  Object.entries(s.stats.extra).forEach(([k, v]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(Number(v)) && Number(v) > 0) ext[k] = Number(v); });
  s.stats.extra = ext;
  ['sessions', 'totalMs', 'reviewFixed', 'feeds'].forEach(k => { s.stats[k] = nn(s.stats[k]); });
  s.stats.firstPlayed = fin(s.stats.firstPlayed, Date.now());
  s.daily.last = typeof s.daily.last === 'string' ? s.daily.last : '';
  s.daily.streak = Math.floor(nn(s.daily.streak)); s.daily.best = Math.floor(nn(s.daily.best)); s.daily.pendingChest = !!s.daily.pendingChest;
  s.lastBackup = nn(s.lastBackup);
  s.seenTutorial = !!s.seenTutorial; s.charChanged = !!s.charChanged;
  // badges: known ids only, valid timestamps
  const ach = {};
  ACHIEVEMENTS.forEach(a => { const t = Number(s.achievements[a.id]); if (s.achievements[a.id] && Number.isFinite(t) && t > 0) ach[a.id] = t; });
  s.achievements = ach;
  // dragon levels: known dragons only
  const dl = {};
  Object.entries(s.dragonLevels).forEach(([id, v]) => { if (isDragonId(id) && v && typeof v === 'object') dl[id] = { lvl: clamp(Math.round(fin(v.lvl, 1)), 1, 10), xp: nn(v.xp) }; });
  s.dragonLevels = dl;
  s.recentSigs = s.recentSigs.filter(x => typeof x === 'string').slice(-14);
  const sk = {};
  Object.entries(s.skills).forEach(([k, v]) => {
    if (!v || typeof v !== 'object') return;
    const nk = mapCat(k);
    sk[nk] = { tier: clamp(Math.round(fin(v.tier, 3)), 1, 5), recent: Array.isArray(v.recent) ? v.recent.slice(-8).map(x => (x ? 1 : 0)) : [], seen: Math.floor(nn(v.seen)) };
  });
  s.skills = sk;
  s.review = s.review.filter(r => r && ALL_KINDS.includes(r.kind) && Number.isFinite(r.seed)).slice(-12);

  // dragons / squad / gear
  s.dragons = [...new Set(s.dragons.filter(id => isDragonId(id)))];
  if (!s.dragons.length) s.dragons = ['ignis'];
  if (!Array.isArray(r.squad)) s.squad = []; // saves from before squads existed: rebuild from owned dragons
  let sq = Array.isArray(s.squad) ? s.squad.filter(id => s.dragons.includes(id)) : [];
  if (!sq.length) {
    const lead = s.dragons[(s.activeDragonIdx || 0) % s.dragons.length];
    sq = [lead, ...s.dragons.filter(id => id !== lead)];
  }
  s.squad = [...new Set(sq)].slice(0, 3);
  s.gear = s.gear.filter(id => SURPRISES.some(g => g.id === id));
  const fd = {};
  FOOD_IDS.forEach(id => { fd[id] = clamp(Math.floor(nn(obj(r.foods)[id])), 0, 999); });
  s.foods = r.foods && typeof r.foods === 'object' ? fd : d.foods;
  s.pendingQ = s.pendingQ ? 1 : 0;
  s.v = 3;
  return s;
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
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));

    // Load or initialize player save
    this.storageOK = true;
    this.state = this.loadSave();
    this.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}

    // Game Modes: 'WORLD' | 'BATTLE'
    this.mode = 'WORLD';
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.lastKind = '';
    this.qStart = 0;
    this.qWrong = 0;
    this.forgeLocked = false;

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
      enemy: getDragon('sprout'),
      enemyHp: 100,
      enemyMaxHp: 100,
      heroHp: 100,
      heroMaxHp: 100,
      laserAnim: 0,
      tameAnim: 0,
      enemyAnim: 0,
      heroFlash: 0,
      busy: false,
      over: false,
      isBoss: false
    };

    // 3-Tap Chest state
    this.chestState = {
      taps: 0,
      opened: false,
      shake: 0,
      pendingReward: null
    };

    sfx.musicEnabled = !!this.state.settings.music;
    // The "time to answer" clock stops while the app is in the background, a lock screen is up or the parent dashboard is open
    this._pauseReasons = new Set();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.pauseQuestionClock('hidden'); else this.resumeQuestionClock('hidden');
    });
    this.bindEvents();
    this.announceDimension();
    if (this.state.pendingQ) { // the game was closed in the middle of a question: that counts as a miss
      this.state.pendingQ = 0;
      const pen = this.applyPenalty();
      this.save();
      this.toast(`⚠️ A question was left unanswered: -${pen.lossC}⭐ -${pen.lossX} XP`, 5000);
    }
    this.updateHUD();
    this.refreshTitle();
    this.checkAchievements();
    if (!this.storageOK) this.toast('⚠️ This browser cannot save progress (private mode?).', 6000);
    requestAnimationFrame(t => this.loop(t));
  }

  loadSave() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { raw = null; }
    try {
      localStorage.setItem(SAVE_KEY + '_probe', '1');
      localStorage.removeItem(SAVE_KEY + '_probe');
    } catch (e) { this.storageOK = false; }
    return normalizeSave(raw);
  }

  pauseQuestionClock(reason) {
    if (!this._pauseReasons.size) this._pausedAt = performance.now();
    this._pauseReasons.add(reason);
  }

  resumeQuestionClock(reason) {
    if (!this._pauseReasons.delete(reason)) return;
    if (!this._pauseReasons.size && this._pausedAt != null) {
      this.qStart += performance.now() - this._pausedAt; // shift the start so paused time is not counted
      this._pausedAt = null;
    }
  }

  equipNew(id) {
    if (this.state.squad.length < 3 && !this.state.squad.includes(id)) this.state.squad.push(id);
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      this.storageOK = true;
    } catch (e) {
      this.storageOK = false;
    }
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

    const biome = biomeAt(this.state.islandIndex);
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
    if (!this.layout || this.layout.idx !== this.state.islandIndex) {
      this.layout = islandLayout(this.state.islandIndex, this.gridSize, [...this.goldenPath, ...pool]);
      this.layout.idx = this.state.islandIndex;
    }
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

  // Returns the NEW level if the dragon levelled up (else 0)
  gainDragonXP(amount, id = this.leadDragonId()) {
    if (!this.state.dragonLevels) this.state.dragonLevels = {};
    let { lvl, xp } = this.dragonInfo(id);
    if (lvl >= 10) return 0;
    xp += amount;
    let leveled = 0;
    while (lvl < 10 && xp >= 50 + 25 * lvl) {
      xp -= 50 + 25 * lvl;
      lvl++;
      leveled = lvl;
    }
    this.state.dragonLevels[id] = { lvl, xp: lvl >= 10 ? 0 : xp };
    return leveled;
  }

  announceDragonLevel(id, lvl) {
    const d = getDragon(id);
    sfx.chestExplode();
    this.toast(`🐉 <b>${esc(d ? d.name.split(' ')[0] : 'Your dragon')}</b> reached Level ${lvl}! +${lvl * 6}% spell power`, 3600);
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
    if (!document.getElementById('lockOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('tutorialOverlay').classList.contains('hidden')) return;
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
        this.state.charChanged = true;
        sfx.coin(); this.checkAchievements(); this.save(); this.renderMenu();
      }));
      body.querySelectorAll('canvas[data-pc]').forEach(cv => previews.push(() => {
        this.previewChar = Number(cv.dataset.pc);
        this.drawOn(cv, () => { this.ctx.translate(130, 190); this.drawWizardSprite(0, 0, t, 2.1); });
        this.previewChar = null;
      }));
    } else if (this.menuTab === 'dragons') {
      const PER = 12;
      const ownedList = [...this.state.dragons].sort((x, y) => dragonIdx(x) - dragonIdx(y));
      const pages = Math.max(1, Math.ceil(ownedList.length / PER));
      this.bookPage = clamp(this.bookPage || 0, 0, pages - 1);
      const shown = ownedList.slice(this.bookPage * PER, this.bookPage * PER + PER).map(id => getDragon(id));
      body.innerHTML = `<div class="menu-note">Dragon Book: ${ownedList.length} / ${DRAGON_TOTAL.toLocaleString()} found — feed wild dragons their favourite food to tame them! Equip up to 3 (${this.state.squad.length}/3 equipped).</div>
        <div class="pager"><button class="mini-btn" data-pg="-1" ${this.bookPage <= 0 ? 'disabled' : ''}>◀ Prev</button><span>Page ${this.bookPage + 1} / ${pages}</span><button class="mini-btn" data-pg="1" ${this.bookPage >= pages - 1 ? 'disabled' : ''}>Next ▶</button></div><div class="menu-grid">` +
        shown.map(d => {
          const inf = this.dragonInfo(d.id);
          const eq = this.state.squad.includes(d.id);
          const lead = this.leadDragonId() === d.id;
          const ri = rarityInfo(d);
          return `<div class="menu-item ${lead ? 'selected' : ''}" data-id="${d.id}">
            <canvas width="260" height="240" data-dc="${d.id}"></canvas>
            <div class="nm">${esc(d.name.split(' ')[0])}</div>
            <div class="sub"><span style="color:${ri.color}">${ri.name}</span> • ${d.icon} ${esc(d.element)} • Lv ${inf.lvl}${inf.lvl >= 10 ? ' MAX' : ''}</div>
            <div class="sub goal">Loves ${FOODS[d.food].icon} ${FOODS[d.food].name}</div>
            <div class="bar"><i style="width:${inf.lvl >= 10 ? 100 : Math.round((inf.xp / inf.need) * 100)}%"></i></div>
            ${lead ? '<div class="tag">LEAD</div>' : eq ? '<div class="tag">FOLLOWING</div>' : ''}
            <div class="btn-row"><button class="mini-btn" data-act="equip" data-id="${d.id}">${eq ? 'Unequip' : 'Equip'}</button>${eq && !lead ? `<button class="mini-btn gold" data-act="lead" data-id="${d.id}">⭐ Lead</button>` : ''}</div>
            <div class="btn-row"><button class="mini-btn feed" data-act="feed" data-id="${d.id}" ${inf.lvl >= 10 ? 'disabled' : ''}>${inf.lvl >= 10 ? 'MAX LEVEL' : '🍖 Feed 80⭐'}</button></div></div>`;
        }).join('') + '</div><div class="menu-sec">🎒 Treasure Collection</div><div class="gear-row">' +
        SURPRISES.map(g => `<div class="gear-chip ${this.state.gear.includes(g.id) ? '' : 'locked'}">${this.state.gear.includes(g.id) ? g.icon + ' ' + g.name : '🔒 Mystery chest item'}</div>`).join('') + '</div>';
      body.querySelectorAll('[data-pg]').forEach(btn => btn.addEventListener('click', () => { this.bookPage += Number(btn.dataset.pg); sfx.coin(); this.renderMenu(); }));
      body.querySelectorAll('.mini-btn').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const sq = this.state.squad;
        if (btn.dataset.act === 'feed') {
          if (this.dragonInfo(id).lvl >= 10) { sfx.wrongTry(); return; }
          if (this.state.coins < 80) { sfx.wrongTry(); this.toast('Not enough ⭐ yet — answer more questions to earn coins!'); return; }
          this.state.coins -= 80;
          this.state.stats.feeds = (this.state.stats.feeds || 0) + 1;
          const up = this.gainDragonXP(45, id);
          sfx.coin();
          if (up) this.announceDragonLevel(id, up); else this.toast('🍖 Yum! Your dragon gained 45 XP!');
          this.checkAchievements(); this.save(); this.updateHUD(); this.renderMenu();
          return;
        }
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
        sfx.coin(); this.checkAchievements(); this.save(); this.renderMenu();
      }));
      body.querySelectorAll('canvas[data-dc]').forEach(cv => previews.push(() => {
        const d = getDragon(cv.dataset.dc);
        this.drawOn(cv, () => {
          this.ctx.translate(130, 170);
          this.drawDragonSprite(0, 0, d, t, 1.9, false);
        });
      }));
    } else if (this.menuTab === 'badges') {
      const got = ACHIEVEMENTS.filter(a => this.state.achievements[a.id]).length;
      body.innerHTML = `<div class="menu-note">Badges: ${got} / ${ACHIEVEMENTS.length} earned — keep playing to unlock them all! 🏆</div><div class="menu-grid">` +
        ACHIEVEMENTS.map(a => {
          const t = this.state.achievements[a.id];
          return `<div class="menu-item ${t ? '' : 'locked'}"><div class="island-big">${t ? a.icon : '🔒'}</div><div class="nm">${esc(a.name)}</div><div class="sub">${esc(a.desc)}</div>${t ? `<div class="sub goal">Earned ${new Date(t).toLocaleDateString()}</div>` : ''}</div>`;
        }).join('') + '</div>';
    } else if (this.menuTab === 'food') {
      body.innerHTML = `<div class="menu-note">🍖 Taming Foods — every dragon has a favourite! Read the clue in battle and feed it the right food. You have ⭐ ${this.state.coins}. Winning battles drops free food too.</div><div class="menu-grid">` +
        FOOD_IDS.map(id => {
          const f = FOODS[id];
          return `<div class="menu-item"><div class="island-big">${f.icon}</div><div class="nm">${f.name}</div><div class="sub">You have: ${this.state.foods[id] || 0}</div><div class="sub goal">A dragon that ${f.clue}</div><div class="btn-row"><button class="mini-btn gold" data-buy="${id}">Buy ${f.price}⭐</button></div></div>`;
        }).join('') + '</div>';
      body.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        const f = FOODS[btn.dataset.buy];
        if (this.state.coins < f.price) { sfx.wrongTry(); this.toast('Not enough ⭐ yet — answer questions to earn coins!'); return; }
        this.state.coins -= f.price;
        this.state.foods[btn.dataset.buy] = Math.min(999, (this.state.foods[btn.dataset.buy] || 0) + 1);
        sfx.coin(); this.save(); this.updateHUD(); this.renderMenu();
      }));
    } else {
      const maxBlock = Math.floor((this.state.maxIsland || 0) / ISLANDS_PER_DIM);
      if (this.islandPage == null) this.islandPage = Math.floor(this.state.islandIndex / ISLANDS_PER_DIM);
      this.islandPage = clamp(this.islandPage, 0, maxBlock + 1);
      const base = this.islandPage * ISLANDS_PER_DIM;
      const dim = DIMS[dimOfIsland(base)];
      body.innerHTML = `<div class="menu-note">${dim.icon} <b>${dim.name}</b> — islands ${base + 1}–${base + ISLANDS_PER_DIM}. Beat each island's boss to open the next. New dimensions keep appearing forever!</div>
        <div class="pager"><button class="mini-btn" data-pg="-1" ${this.islandPage <= 0 ? 'disabled' : ''}>◀ Back</button><span>${dim.icon} Dimension ${this.islandPage + 1}</span><button class="mini-btn" data-pg="1" ${this.islandPage >= maxBlock + 1 ? 'disabled' : ''}>Next ▶</button></div><div class="menu-grid">` +
        Array.from({ length: ISLANDS_PER_DIM }, (_, k) => {
          const idx = base + k, b = biomeAt(idx);
          const unlocked = idx <= this.state.maxIsland;
          const here = idx === this.state.islandIndex;
          return `<div class="menu-item ${unlocked ? '' : 'locked'} ${here ? 'selected' : ''}" data-i="${idx}">
            <div class="island-big">${unlocked ? b.icon : '🔒'}</div>
            <div class="nm">${idx + 1}. ${esc(b.title)}</div>
            <div class="sub">${unlocked ? (here ? 'You are here' : 'Tap to sail!') : 'Beat the previous boss'}</div>
            <div class="sub goal">${b.goal.icon} ${esc(b.goal.short)}</div>
            ${here ? '<div class="tag">HERE</div>' : ''}</div>`;
        }).join('') + '</div>';
      body.querySelectorAll('[data-pg]').forEach(btn => btn.addEventListener('click', () => { this.islandPage += Number(btn.dataset.pg); sfx.coin(); this.renderMenu(); }));
      body.querySelectorAll('.menu-item:not(.locked)').forEach(el => el.addEventListener('click', () => {
        const target = Number(el.dataset.i);
        if (target !== this.state.islandIndex) {
          this.state.islandIndex = target;
          this.state.stageOnIsland = 0;
          this.state.goalProgress = 0;
          this.hero.x = this.hero.targetX = 1;
          this.hero.y = this.hero.targetY = 4;
          this.hero.trail = [];
          this.setupIslandEncounters();
          this.announceDimension();
          sfx.spellCharge();
        }
        this.save();
        this.closeMenu();
      }));
    }
    previews.forEach(fn => fn());
  }

  // ==========================================================================
  // LEARNING ENGINE: adaptive difficulty, spaced review, progress recording
  // ==========================================================================
  baseTier() { return clamp((this.state.settings.grade || 4) - 1, 1, 5); }

  tierFor(kind) {
    const sk = this.state.skills[KIND_META[kind].cat];
    return sk ? sk.tier : this.baseTier();
  }

  allowedKinds(focus) {
    if (focus === 'math') return MATH_KINDS;
    if (focus === 'english') return ENGLISH_KINDS;
    if (focus === 'science') return SCIENCE_KINDS;
    return ALL_KINDS;
  }

  kindWeight(kind) {
    const sk = this.state.skills[KIND_META[kind].cat];
    let w = 1;
    if (!sk || sk.seen < 3) w += 0.8; // explore skills not tried yet
    else if (sk.recent.length) {
      const acc = sk.recent.reduce((a, b) => a + b, 0) / sk.recent.length;
      if (acc < 0.6) w += 1.6; else if (acc < 0.8) w += 0.6; // weaker skills come up more
    }
    if (kind === this.lastKind) w *= 0.15;
    return w;
  }

  pickWeighted(items, weightFn) {
    const ws = items.map(weightFn);
    let x = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x <= 0) return items[i]; }
    return items[items.length - 1];
  }

  nextChallenge(contextFocus = 'mixed') {
    const st = this.state;
    const parentFocus = st.settings.focus;
    const focus = parentFocus === 'balanced' ? contextFocus : parentFocus;
    const kinds = this.allowedKinds(focus);

    // 1) spaced review of questions missed earlier
    const dueIdx = st.review.findIndex(r => r.due <= st.qCount && kinds.includes(r.kind));
    if (dueIdx >= 0 && Math.random() < 0.8) {
      const r = st.review.splice(dueIdx, 1)[0];
      const ch = buildChallenge({ kind: r.kind, tier: r.tier, seed: r.seed });
      ch.review = r;
      this.lastKind = ch.kind;
      return ch;
    }

    // 2) a skill the parent chose for extra practice gets about a third of the questions
    const fs = st.settings.focusSkill;
    const forced = !!fs && kinds.includes(fs) && Math.random() < 0.35;

    // 3) otherwise pick a subject, then a skill (skills the child finds harder come up more often)
    const SUBJ_W = { Math: 0.45, English: 0.35, Science: 0.2 };
    const subjects = [...new Set(kinds.map(k => KIND_META[k].subj))];
    const subj = this.pickWeighted(subjects, x => SUBJ_W[x]);
    const pool = forced ? [fs] : kinds.filter(k => KIND_META[k].subj === subj);
    let ch = null;
    for (let i = 0; i < 10; i++) {
      const kind = this.pickWeighted(pool, k => this.kindWeight(k));
      const c = buildChallenge({ kind, tier: this.tierFor(kind), seed: randomSeed() });
      if (!st.recentSigs.includes(c.sig) || i === 9) { ch = c; break; }
    }
    this.lastKind = ch.kind;
    st.recentSigs.push(ch.sig);
    if (st.recentSigs.length > 14) st.recentSigs.shift();
    return ch;
  }

  subjectStat(subj) {
    let asked = 0, first = 0;
    Object.values(this.state.stats.byCat).forEach(c => { if (c.subj === subj) { asked += c.asked || 0; first += c.first || 0; } });
    return { asked, first };
  }

  recordAnswer(abandoned = false, missed = false) {
    const ch = this.activeChallenge;
    if (!ch || ch.recorded) return;
    ch.recorded = true;
    const st = this.state, S = st.stats;
    const wrong = missed ? 1 : (this.qWrong || 0);
    const firstTry = !abandoned && wrong === 0;
    const tries = missed ? 1 : wrong + (abandoned ? 0 : 1);
    const ms = Math.min(120000, Math.round(performance.now() - (this.qStart || performance.now())));

    const c = S.byCat[ch.cat] || (S.byCat[ch.cat] = { subj: ch.subj, asked: 0, first: 0, tries: 0, ms: 0 });
    c.subj = ch.subj; c.asked++; c.tries += tries; c.ms += ms; if (firstTry) c.first++;
    const dk = dayKey();
    const d = S.daily[dk] || (S.daily[dk] = { ms: 0, q: 0, first: 0 });
    d.q++; if (firstTry) d.first++;
    S.log.push({ t: Date.now(), cat: ch.cat, subj: ch.subj, tries, ms, first: firstTry ? 1 : 0, tier: ch.tier, review: ch.review ? 1 : 0, skip: abandoned ? 1 : 0, island: st.islandIndex + 1 });
    if (S.log.length > 400) S.log.shift();
    st.qCount++;

    // run of first-try answers
    st.run = firstTry ? (st.run || 0) + 1 : 0;
    st.bestRun = Math.max(st.bestRun || 0, st.run);

    // adaptive difficulty: 5 first-try answers in a row -> level up; 4 misses out of 5 -> ease off
    const sk = st.skills[ch.cat] || (st.skills[ch.cat] = { tier: this.baseTier(), recent: [], seen: 0 });
    sk.seen++;
    sk.recent.push(firstTry ? 1 : 0);
    if (sk.recent.length > 8) sk.recent.shift();
    const last5 = sk.recent.slice(-5);
    if (last5.length === 5) {
      const sum = last5.reduce((a, b) => a + b, 0);
      if (sum === 5 && sk.tier < 5) { sk.tier++; sk.recent = []; this.onSkillUp(ch.cat, sk.tier); }
      else if (sum <= 1 && sk.tier > 1) { sk.tier--; sk.recent = []; }
    }

    // spaced review: a missed question comes back a few questions later (up to 3 times)
    if (!firstTry) {
      const n = ch.review ? ch.review.n : 0;
      if (n < 3 && !st.review.some(r => r.seed === ch.seed && r.kind === ch.kind)) {
        st.review.push({ seed: ch.seed, kind: ch.kind, tier: ch.tier, due: st.qCount + 4 + Math.floor(Math.random() * 4), n: n + 1 });
        if (st.review.length > 12) st.review.shift();
      }
    } else if (ch.review) {
      S.reviewFixed = (S.reviewFixed || 0) + 1;
    }

    // daily goal
    const goal = st.settings.dailyGoalQ;
    if (goal > 0 && d.q >= goal && !d.goal) {
      d.goal = 1;
      st.coins += 100;
      this.toast(`🎯 <b>Daily goal complete!</b> ${goal} questions answered today! +100⭐`, 3800);
      sfx.chestExplode();
    }
    this.checkAchievements();
    this.updateGoalPill();
    this.save();
  }

  onSkillUp(cat, tier) {
    this.state.coins += 30;
    sfx.chestExplode();
    this.toast(`⭐ <b>${esc(cat)}</b> is now Level ${tier}! +30⭐`, 3600);
  }

  // ==========================================================================
  // BADGES, TOASTS, DAILY STREAK, TUTORIAL, READ-ALOUD
  // ==========================================================================
  checkAchievements() {
    const st = this.state;
    for (const a of ACHIEVEMENTS) {
      if (st.achievements[a.id]) continue;
      let ok = false;
      try { ok = !!a.test(this); } catch (e) { ok = false; }
      if (ok) {
        st.achievements[a.id] = Date.now();
        st.coins += 50;
        this.toast(`🏆 Badge unlocked: <b>${esc(a.name)}</b> ${a.icon} +50⭐`, 3800);
        sfx.chestExplode();
      }
    }
  }

  toast(html, ms = 2800) {
    const layer = document.getElementById('toastLayer');
    if (!layer) return;
    while (layer.children.length >= 4) layer.removeChild(layer.firstChild);
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    layer.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
  }

  effectiveStreak() {
    const d = this.state.daily, y = new Date();
    y.setDate(y.getDate() - 1);
    return d.last === dayKey() || d.last === dayKey(y) ? d.streak : 0;
  }

  onSessionStart() {
    const d = this.state.daily, today = dayKey();
    if (d.last !== today) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      d.streak = d.last === dayKey(y) ? (d.streak || 0) + 1 : 1;
      d.best = Math.max(d.best || 0, d.streak);
      d.last = today;
      d.pendingChest = true;
    }
  }

  randomFact() { return 'STEM Secret: ' + FACTS[Math.floor(Math.random() * FACTS.length)]; }

  openDailyChest() {
    const d = this.state.daily;
    d.pendingChest = false;
    const coins = 50 + 25 * Math.min(d.streak, 7);
    this.state.coins += coins;
    this.openInteractiveChest('🌅 DAILY DRAGON GIFT!', `Welcome back! Day ${d.streak} in a row 🔥`, {
      icon: '🎁',
      name: `+${coins} ⭐ Daily Bonus!`,
      desc: d.streak > 1 ? `${d.streak} days in a row — amazing! Come back tomorrow for an even bigger gift.` : 'Come back tomorrow for another gift and start a streak!',
      fact: this.randomFact()
    });
    this.checkAchievements();
  }

  refreshTitle() {
    const st = this.state, w = document.getElementById('welcomeBack');
    const streak = this.effectiveStreak();
    if ((st.stats.sessions || 0) > 0) {
      w.textContent = `Welcome back! ⭐ Level ${st.level} • 🐉 ${st.dragons.length} dragon${st.dragons.length === 1 ? '' : 's'}${streak > 1 ? ` • 🔥 ${streak}-day streak` : ''}`;
    } else {
      w.textContent = 'A brand-new adventure begins!';
    }
    document.getElementById('heroNameInput').value = st.name;
    document.getElementById('versionTag').textContent = `v${APP_VERSION}${this.storageOK ? '' : '  •  ⚠️ cannot save in private browsing'}`;
  }

  startPlaying() {
    const typed = document.getElementById('heroNameInput').value.trim();
    sfx.init();
    if (typed) this.state.name = typed.slice(0, 20);
    if (this.checkLocks && this.checkLocks(true)) return; // time limit / bedtime: stay on the title screen
    sfx.spellCharge();
    const S = this.state.stats;
    S.sessions = (S.sessions || 0) + 1;
    this.onSessionStart();
    this.sinceBreakMs = 0;
    this.save();
    this.updateHUD();
    document.getElementById('titleOverlay').classList.add('hidden');
    sfx.musicEnabled = !!this.state.settings.music;
    if (sfx.musicEnabled) sfx.startMusic();
    if (this.state.settings.autoRead) this.primeSpeech();
    const next = () => { if (this.state.daily.pendingChest) this.openDailyChest(); };
    if (!this.state.seenTutorial) this.showTutorial(next); else next();
    this.checkAchievements();
  }

  showTutorial(done) {
    const steps = [
      { icon: '🕹️', title: 'Move around!', text: 'Drag the round stick (bottom-left) to walk — or just tap the island. Tap the big ✨ GO! button to run straight to the glowing goal.' },
      { icon: '🔮', title: 'Solve to cast spells!', text: 'Every spell is powered by a question — math, science or English. Wrong answer? No problem! You get a hint and can try again.' },
      { icon: '🐉', title: 'Collect dragons!', text: 'Beat guardians and bosses, then tame their dragons. Level them up, fill your Dragon Book and earn shiny badges!' }
    ];
    let i = 0;
    const ov = document.getElementById('tutorialOverlay');
    const render = () => {
      const s = steps[i];
      document.getElementById('tutIcon').textContent = s.icon;
      document.getElementById('tutTitle').textContent = s.title;
      document.getElementById('tutText').textContent = s.text;
      document.getElementById('tutDots').innerHTML = steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      document.getElementById('tutNext').textContent = i === steps.length - 1 ? "Let's go! 🚀" : 'Next ▶';
    };
    const finish = () => {
      ov.classList.add('hidden');
      this.state.seenTutorial = true;
      this.save();
      if (done) done();
    };
    document.getElementById('tutNext').onclick = () => { sfx.coin(); if (i >= steps.length - 1) finish(); else { i++; render(); } };
    document.getElementById('tutSkip').onclick = finish;
    render();
    ov.classList.remove('hidden');
  }

  updateGoalPill() {
    const el = document.getElementById('goalPill');
    if (!el) return;
    const goal = this.state.settings.dailyGoalQ || 0;
    const q = (this.state.stats.daily[dayKey()] || {}).q || 0;
    el.classList.toggle('hidden', goal <= 0 || this.mode !== 'WORLD');
    el.classList.toggle('done', goal > 0 && q >= goal);
    document.getElementById('goalText').textContent = goal > 0 ? `${Math.min(q, goal)} / ${goal}${q >= goal ? ' ✅' : ''}` : String(q);
  }

  // ---- read-aloud (helps kids who are still building reading confidence) ----
  cleanForSpeech(text) {
    return String(text)
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍]/gu, ' ')
      .replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ')
      .replace(/(\d+)\/(\d+)/g, '$1 over $2').replace(/=/g, ' equals ').replace(/_{2,}/g, ' blank ')
      .replace(/\s+/g, ' ').trim();
  }
  speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(this.cleanForSpeech(text));
      u.rate = 0.9; u.pitch = 1.05; u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  primeSpeech() {
    try { if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); } catch (e) {}
  }
  stopSpeaking() { try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {} }
  speakChallenge() {
    const ch = this.activeChallenge;
    if (ch) this.speak(`${ch.passage ? ch.passage + ' ' : ''}${ch.prompt}`);
  }

  bindEvents() {
    this.bindParentEvents(); // parent dashboard, time limits (parent.js)
    // ---- Side menu (Hero / Dragon Book / Islands) ----
    document.querySelectorAll('.side-btn').forEach(b => b.addEventListener('click', () => { sfx.init(); sfx.coin(); this.openMenu(b.dataset.tab); }));
    document.querySelectorAll('.menu-tab').forEach(b => b.addEventListener('click', () => { this.menuTab = b.dataset.tab; sfx.coin(); this.renderMenu(); }));
    document.getElementById('menuClose').addEventListener('click', () => this.closeMenu());
    // 1-Click Play Button
    const nameInput = document.getElementById('heroNameInput');
    nameInput.value = this.state.name;

    document.getElementById('btnPlayNow').addEventListener('click', () => this.startPlaying());

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
      if (!document.getElementById('lockOverlay').classList.contains('hidden')) return;
      if (!document.getElementById('tutorialOverlay').classList.contains('hidden')) return;
      if (!document.getElementById('parentOverlay').classList.contains('hidden')) return;
      if (!document.getElementById('chestOverlay').classList.contains('hidden')) return;

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
    // Block page scroll/rubber-band, but let the menu lists and the question card scroll
    document.addEventListener('touchmove', e => {
      if (!e.target.closest || !e.target.closest('.menu-body, .spellforge-card, .tutorial-card')) e.preventDefault();
    }, { passive: false });
    // iOS ignores user-scalable=no: kill double-tap-to-zoom (thumbstick, canvas, anywhere)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
      const now = Date.now();
      const interactive = e.target.closest && e.target.closest('button, input, select, label, summary, a, .menu-item');
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
      if (sfx.muted) this.stopSpeaking();
    });

    // Music button
    document.getElementById('btnMusic').addEventListener('click', () => {
      sfx.init();
      const set = this.state.settings;
      set.music = !set.music;
      sfx.musicEnabled = set.music;
      if (set.music) sfx.startMusic(); else sfx.stopMusic();
      document.getElementById('btnMusic').classList.toggle('off', !set.music);
      this.save();
    });

    // Read-aloud button in the question card
    document.getElementById('forgeSpeak').addEventListener('click', () => this.speakChallenge());

    // Battle Action Buttons
    document.getElementById('btnCastSpell').addEventListener('click', () => {
      this.openSpellForge('ATTACK');
    });
    document.getElementById('btnTameDragon').addEventListener('click', () => this.openFoodPicker());
    document.getElementById('foodCancel').addEventListener('click', () => document.getElementById('foodOverlay').classList.add('hidden'));

    // 3-Tap Chest Canvas Interaction
    document.getElementById('chestCanvas').addEventListener('pointerdown', () => {
      this.handleChestTap();
    });

    document.getElementById('btnContinueFromChest').addEventListener('click', () => {
      document.getElementById('chestOverlay').classList.add('hidden');
      this.updateHUD();
      this.checkAchievements();
      this.save();
    });
  }

  updateHUD() {
    const biome = biomeAt(this.state.islandIndex);
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
    const dObj = getDragon(activeId);
    document.getElementById('hudDragonText').textContent = `${dObj.name.split(' ')[0]} Lv${this.dragonInfo(activeId).lvl} (${this.state.squad.length}/3)`;
    const sm = document.getElementById('sideMenu');
    if (sm) sm.classList.toggle('hidden', this.mode !== 'WORLD');
    const mb = document.getElementById('btnMusic');
    if (mb) mb.classList.toggle('off', !this.state.settings.music);
    this.updateGoalPill();
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
    if (!document.getElementById('lockOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('tutorialOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('titleOverlay').classList.contains('hidden')) return;
    if (!document.getElementById('parentOverlay').classList.contains('hidden')) return;
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
    const biome = biomeAt(this.state.islandIndex);

    // Sky backdrop for this dimension
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, biome.sky);
    bgGrad.addColorStop(1, biome.water);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    if (biome.stars) {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 60; k++) {
        const r0 = hashInt(k, 99);
        ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(time * 0.002 + k));
        ctx.fillRect((r0 % 1000) / 1000 * W, ((r0 >>> 10) % 1000) / 1000 * H * 0.8, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
    if (biome.clouds) { // blocky drifting clouds
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let k = 0; k < 6; k++) {
        const cx = ((time * 0.012 * (0.5 + (k % 3) * 0.4) + k * 260) % (W + 300)) - 150;
        const cy = H * (0.08 + (k * 0.11) % 0.5);
        ctx.fillRect(cx, cy, 90, 18); ctx.fillRect(cx + 16, cy - 14, 54, 16); ctx.fillRect(cx + 30, cy + 18, 60, 12);
      }
    }

    // Drifting ambient particles (embers, snow, sparkles by dimension)
    this.ambientEmbers.forEach(e => {
      e.y += e.vy;
      if (e.y < 0) e.y = H;
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.r * 1.6, e.r * 1.6);
    });

    // Floating-island underside (stone layers that taper down)
    const L = this.layout;
    const sc = this.scale;
    const gridN = this.gridSize;
    const lvlAt = (x, y) => {
      const gx = clamp(Math.round(x), 0, gridN - 1), gy = clamp(Math.round(y), 0, gridN - 1);
      return L.fluid[gx][gy] ? -0.35 : L.h[gx][gy] * 0.45;
    };
    for (let d = 3; d >= 1; d--) {
      for (let gx = d; gx < gridN - d; gx++) {
        for (let gy = d; gy < gridN - d; gy++) {
          const p = this.isoToScreen(gx, gy, -d * 0.72);
          vxBox(ctx, p.x, p.y, 38 * sc, 26 * sc, shadeHex(biome.dirt, 0.6 - d * 0.08), shadeHex(biome.dirt, 0.5 - d * 0.07), shadeHex(biome.dirt, 0.36 - d * 0.05));
        }
      }
    }

    // Draw the isometric voxel island (back-to-front painter's algorithm)
    const decoAt = {};
    L.decos.forEach(d => { decoAt[d.x * 100 + d.y] = d; });
    for (let gx = 0; gx < gridN; gx++) {
      for (let gy = 0; gy < gridN; gy++) {
        const isGolden = this.goldenPath.some(p => p.x === gx && p.y === gy);
        const isTarget = this.currentTarget && this.currentTarget.x === gx && this.currentTarget.y === gy;
        const wave = Math.sin(time * 0.003 + (gx + gy) * 0.5) * 0.06;
        const seed = hashInt(gx * 9 + gy, this.state.islandIndex);

        if (L.fluid[gx][gy]) { // water / lava pool, or a hole in the void
          if (biome.fluid === 'void') continue;
          const p = this.isoToScreen(gx, gy, -0.35 + wave);
          const lava = biome.fluid === 'lava';
          const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + gx * 1.3 + gy);
          const top = lava ? shadeHex('#ff5a1f', 0.85 + 0.3 * pulse) : shadeHex('#2f7fe0', 0.85 + 0.25 * pulse);
          vxBox(ctx, p.x, p.y, 38 * sc, 10 * sc, top, shadeHex(top, 0.7), shadeHex(top, 0.5), { seed });
          if (lava) { ctx.save(); ctx.globalAlpha = 0.25 * pulse; ctx.fillStyle = '#ffd166'; ctx.fillRect(p.x - 14 * sc, p.y - 4 * sc, 28 * sc, 8 * sc); ctx.restore(); }
          continue;
        }

        const lvl = L.h[gx][gy];
        const p = this.isoToScreen(gx, gy, wave + lvl * 0.45);
        const depth = (26 + lvl * 16) * sc;
        if (isGolden) {
          const top = isTarget ? '#ffee32' : '#ffd166';
          vxBox(ctx, p.x, p.y, 38 * sc, depth, top, '#d9822b', '#a35814', { seed });
        } else {
          vxBox(ctx, p.x, p.y, 38 * sc, depth, biome.top, shadeHex(biome.dirt, 0.95), shadeHex(biome.dirt, 0.7), { seed, cap: biome.top });
        }
        if (isTarget) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 19 * sc); ctx.lineTo(p.x + 38 * sc, p.y); ctx.lineTo(p.x, p.y + 19 * sc); ctx.lineTo(p.x - 38 * sc, p.y); ctx.closePath(); ctx.stroke();
        }

        const dc = decoAt[gx * 100 + gy];
        if (dc && !isGolden) vxDeco(ctx, dc.kind, p.x, p.y, sc, dc.v, time);
      }
    }
    this.heroLift = (this.heroLift || 0) + (lvlAt(this.hero.x, this.hero.y) - (this.heroLift || 0)) * 0.2;

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
        const bossDragon = getDragon(this.state.stageOnIsland === 2 ? biome.bossId : biome.guardId);
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
      const dObj = getDragon(dId);
      const trailStep = Math.min(this.hero.trail.length - 1, (idx + 1) * 8);
      const pos = this.hero.trail[trailStep] || { x: this.hero.x - 0.7 * (idx + 1), y: this.hero.y };
      const sp = this.isoToScreen(pos.x, pos.y, 0.65 + (this.heroLift || 0));
      this.drawDragonSprite(sp.x - 18 * this.scale, sp.y, dObj, time + idx * 400, 0.72 * this.scale, false);
    });

    // Draw Player Wizard Hero
    const hp = this.isoToScreen(this.hero.x, this.hero.y, 0.4 + (this.heroLift || 0));
    this.drawWizardSprite(hp.x, hp.y, time, 1.05 * this.scale);
  }

  // ==========================================================================
  // CINEMATIC PRODIGY DRAGON BATTLE ARENA
  // ==========================================================================
  startDragonBattle(isBoss) {
    this.mode = 'BATTLE';
    const biome = biomeAt(this.state.islandIndex);
    const enemyDragon = getDragon(isBoss ? biome.bossId : biome.guardId);

    const hpMult = (1 + 0.05 * Math.min(60, this.state.islandIndex)) * rarityInfo(enemyDragon).hp;

    this.battle = {
      enemy: enemyDragon,
      enemyHp: isBoss ? Math.round(120 * hpMult) : Math.round(80 * hpMult),
      enemyMaxHp: isBoss ? Math.round(120 * hpMult) : Math.round(80 * hpMult),
      heroHp: 100,
      heroMaxHp: 100,
      laserAnim: 0,
      tameAnim: 0,
      enemyAnim: 0,
      heroFlash: 0,
      busy: false,
      over: false,
      isBoss,
      tame: 0,
      tameNeed: rarityInfo(enemyDragon).need + (isBoss ? 20 : 0),
      lastFood: ''
    };

    sfx.spellCharge();
    this.joy = { x: 0, y: 0, id: null };
    document.getElementById('joystick').classList.add('hidden');
    document.getElementById('questOrb').classList.add('hidden');
    document.getElementById('battleDock').classList.remove('hidden');
    this.updateDock();
    this.updateHUD();
  }

  updateDock() {
    const dock = document.getElementById('battleDock');
    dock.classList.toggle('busy', !!(this.battle && (this.battle.busy || this.battle.over)));
  }

  renderBattle(time, W, H) {
    const ctx = this.ctx;

    // Dramatic Arcane Arena Sky
    const bz = biomeAt(this.state.islandIndex);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, shadeHex(bz.sky, 0.7));
    grad.addColorStop(1, bz.water);
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
    ctx.fillStyle = shadeHex(bz.top, 0.6);
    ctx.strokeStyle = bz.top;
    ctx.beginPath();
    ctx.ellipse(rightX, platY + 25, 135, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Hero + Lead Companion Dragon on Left Platform
    const leadId = this.leadDragonId();
    const leadDragon = getDragon(leadId);
    this.drawWizardSprite(leftX - 55, platY + 8, time, 1.35);
    this.drawDragonSprite(leftX + 35, platY - 12, leadDragon, time, 1.35, false);

    // Draw Wild Enemy Dragon on Right Platform
    const enemyScale = this.battle.isBoss ? 1.65 : 1.4;
    this.drawDragonSprite(rightX, platY - 10, this.battle.enemy, time, enemyScale, true);

    // Draw Floating Overhead Health Bars
    this.drawOverheadHealthBar(ctx, leftX, platY - 155, `${this.state.name} & ${leadDragon.name.split(' ')[0]}`, this.battle.heroHp, this.battle.heroMaxHp, '#06d6a0');
    this.drawOverheadHealthBar(ctx, rightX, platY - 155, `${this.battle.isBoss ? '👑 BOSS: ' : ''}${this.battle.enemy.name}`, this.battle.enemyHp, this.battle.enemyMaxHp, '#ef476f');

    // Trust meter (taming progress) under the enemy's health bar
    if (!this.state.dragons.includes(this.battle.enemy.id) || this.battle.tame > 0) {
      const bt = this.battle, tw = 200, tx = rightX - tw / 2, ty = platY - 155 + 46;
      ctx.save();
      ctx.fillStyle = 'rgba(9,13,26,0.85)'; ctx.fillRect(tx - 6, ty - 18, tw + 12, 36);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`💗 TRUST ${Math.round(bt.tame)} / ${bt.tameNeed} — loves ${FOODS[bt.enemy.food].icon}?`, rightX, ty - 4);
      ctx.fillStyle = '#2a1f3a'; ctx.fillRect(tx, ty + 2, tw, 9);
      ctx.fillStyle = '#ff5d8f'; ctx.fillRect(tx, ty + 2, tw * Math.min(1, bt.tame / bt.tameNeed), 9);
      ctx.restore();
    }

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

    // Enemy fireball flying toward the hero when the enemy hits back
    if (this.battle.enemyAnim > 0) {
      const p = 1 - this.battle.enemyAnim / 28;
      this.battle.enemyAnim--;
      const ex = rightX - 30 + (leftX + 20 - (rightX - 30)) * p;
      const ey = platY - 50 - Math.sin(p * Math.PI) * 34;
      ctx.save();
      ctx.fillStyle = this.battle.enemy.wing;
      ctx.shadowColor = this.battle.enemy.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ex, ey, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (this.battle.heroFlash > 0) {
      this.battle.heroFlash--;
      if (!this.reduceMotion) {
        ctx.save();
        ctx.globalAlpha = (this.battle.heroFlash / 14) * 0.28;
        ctx.fillStyle = '#ef476f';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
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
    if (this.mode === 'BATTLE' && this.battle && (this.battle.busy || this.battle.over)) return;
    if (!document.getElementById('spellForgeOverlay').classList.contains('hidden')) return;
    this.pendingAction = actionType;
    this.qStart = performance.now();
    this.qWrong = 0;
    this.forgeLocked = false;
    this.state.pendingQ = 1; // if the app is closed before answering, it counts as a miss
    this.save();

    const biomeNow = biomeAt(this.state.islandIndex);
    const ch = this.nextChallenge(actionType === 'CRYSTAL' ? biomeNow.goal.focus : 'mixed');
    this.activeChallenge = ch;

    document.getElementById('forgeTopicBadge').textContent = ch.topic;
    document.getElementById('forgeReviewBadge').classList.toggle('hidden', !ch.review);
    document.getElementById('forgeStreakText').textContent = actionType === 'TAME' && this.tameFood ? `${FOODS[this.tameFood].icon} Feeding ${FOODS[this.tameFood].name}` : `🔥 Combo: ${this.state.streak}x`;
    document.getElementById('forgeSkill').textContent = `${ch.cat} • Level ${ch.tier} ${'⭐'.repeat(ch.tier)}`;

    const pass = document.getElementById('forgePassage');
    pass.textContent = ch.passage || '';
    pass.classList.toggle('hidden', !ch.passage);
    document.getElementById('forgeQuestionPrompt').textContent = ch.prompt;

    const tipEl = document.getElementById('forgeHelperTip');
    tipEl.classList.add('hidden');
    tipEl.classList.remove('ok');
    tipEl.textContent = `💡 Hint: ${ch.hint}`;

    // Diagram, drawn sharp on Retina screens (skipped for reading/punctuation: the text is the point)
    const cv = document.getElementById('stemDiagramCanvas');
    cv.classList.toggle('hidden', ch.kind === 'reading' || ch.kind === 'punct');
    const dpr = this.dpr || 1;
    cv.width = Math.round(540 * dpr);
    cv.height = Math.round(150 * dpr);
    const dctx = cv.getContext('2d');
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    try { ch.draw(dctx); } catch (e) { /* the picture is a helper; never block the question */ }

    // 3 giant rune buttons (built with the DOM API because answers can contain quotes)
    const row = document.getElementById('runeChoicesRow');
    row.textContent = '';
    ch.choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'rune-stone-btn';
      b.dataset.val = c;
      b.textContent = `🔮 ${c}`;
      b.addEventListener('click', () => this.handleRuneChoice(b, c));
      row.appendChild(b);
    });

    document.getElementById('spellForgeOverlay').classList.remove('hidden');
    if (this.state.settings.autoRead) this.speakChallenge();
  }

  closeForge() {
    document.getElementById('spellForgeOverlay').classList.add('hidden');
    this.stopSpeaking();
  }

  // Wrong answers cost something real. Saved immediately, so closing the game can't undo it.
  applyPenalty() {
    const st = this.state;
    const lossC = Math.min(st.coins, 20);
    const lossX = Math.min(st.xp, 15);
    st.coins -= lossC;
    st.xp -= lossX;
    const id = this.leadDragonId();
    const dl = st.dragonLevels && st.dragonLevels[id];
    let lossD = 0;
    if (dl && dl.lvl < 10) { lossD = Math.min(dl.xp, 10); dl.xp -= lossD; }
    st.stats.penalties = (st.stats.penalties || 0) + 1;
    st.streak = 1;
    return { lossC, lossX, lossD };
  }

  handleRuneChoice(btn, val) {
    const ch = this.activeChallenge;
    if (!ch || this.forgeLocked || btn.disabled) return;
    // The FIRST tap is the answer. Every other rune goes dead at once, so several fast taps can never both count.
    this.forgeLocked = true;
    const all = [...document.querySelectorAll('.rune-stone-btn')];
    all.forEach(b => { b.disabled = true; });
    const tipEl = document.getElementById('forgeHelperTip');
    const ok = String(val) === String(ch.correct);
    this.state.pendingQ = 0;

    if (ok) {
      btn.classList.add('correct');
      this.qWrong = 0;
      this.recordAnswer(false);
      sfx.spellCharge();
      this.state.streak++;
      tipEl.textContent = ['Perfect! ⭐', 'Brilliant! ✨', 'Spot on! 🎯', 'You nailed it! 💪'][Math.floor(Math.random() * 4)];
      tipEl.classList.add('ok');
      tipEl.classList.remove('hidden');
      if (this.mode === 'BATTLE' && this.battle) { this.battle.busy = true; this.updateDock(); }
      this.save();
      setTimeout(() => {
        this.closeForge();
        this.executeSuccessfulSpell();
      }, 650);
      return;
    }

    // Wrong: show the right answer, take the penalty, and the spell fizzles
    btn.classList.add('wrong');
    const right = all.find(b => b.dataset.val === String(ch.correct));
    if (right) right.classList.add('correct');
    this.qWrong = 1;
    const S = this.state.stats;
    S.mistakes.push({ t: Date.now(), cat: ch.cat, subj: ch.subj, q: (ch.passage ? '[reading] ' : '') + ch.prompt.slice(0, 140), picked: String(val), correct: String(ch.correct), island: this.state.islandIndex + 1 });
    if (S.mistakes.length > 150) S.mistakes.shift();
    this.recordAnswer(false, true);
    const pen = this.applyPenalty();
    sfx.wrongTry();
    const lost = [pen.lossC ? `-${pen.lossC}⭐` : '', pen.lossX ? `-${pen.lossX} XP` : '', pen.lossD ? `-${pen.lossD} dragon XP` : ''].filter(Boolean).join('  ');
    tipEl.textContent = `Not quite — the answer was ${ch.correct}. ${lost ? lost : ''} 💡 ${ch.hint}`;
    tipEl.classList.remove('hidden', 'ok');
    this.updateHUD();
    this.save();

    const b = this.battle;
    const inBattle = this.mode === 'BATTLE' && b;
    if (inBattle) {
      b.busy = true; this.updateDock();
      b.heroHp = Math.max(0, b.heroHp - 15);
      b.enemyAnim = 28;
      b.heroFlash = 14;
      if (this.pendingAction === 'TAME') b.tame = Math.max(0, b.tame - 20);
      this.triggerScreenShake(8, 10);
      this.spawnFloatText(this.vw * 0.27, this.vh * 0.62 - 80, '💥 -15 HP', '#ef476f');
    }
    setTimeout(() => {
      this.closeForge();
      if (this.mode === 'WORLD') this.nextForgeAt = performance.now() + 1500;
      if (inBattle && this.battle === b) {
        if (b.heroHp <= 0) this.handleHeroNaps(); else { b.busy = false; this.updateDock(); }
      }
    }, 2200);
  }

  handleHeroNaps() {
    sfx.wrongTry();
    this.spawnFloatText(this.vw / 2, this.vh / 2 - 40, '💤 Dragon naps — try again!', '#ffd166');
    this.battle.heroHp = this.battle.heroMaxHp;
    this.battle.busy = false;
    this.updateDock();
  }

  dropFoods(b) {
    if (!b) return;
    const e = b.enemy, got = [];
    for (let k = 0; k < (b.isBoss ? 2 : 1); k++) {
      const id = Math.random() < 0.5 ? e.food : FOOD_IDS[Math.floor(Math.random() * FOOD_IDS.length)];
      this.state.foods[id] = Math.min(999, (this.state.foods[id] || 0) + 1);
      got.push(FOODS[id].icon);
    }
    this.toast(`🍖 Food dropped: ${got.join(' ')}`, 2600);
  }

  announceDimension() {
    const b = biomeAt(this.state.islandIndex);
    const key = b.dimIdx + ':' + b.lap;
    const first = this._lastDimKey == null;
    this._lastDimKey = key;
    this.ambientEmbers.forEach((e, i) => { e.color = b.amb[i % b.amb.length]; });
    if (!first) this.toast(`${b.dimIcon} <b>${esc(b.dim)}</b> — ${esc(b.title)}`, 3200);
  }

  // ---- Taming: pick a food, then answer a question to win the dragon's trust ----
  openFoodPicker() {
    const b = this.battle;
    if (this.mode !== 'BATTLE' || !b || b.busy || b.over) return;
    if (this.state.dragons.includes(b.enemy.id)) {
      this.toast(`🐉 ${esc(b.enemy.name.split(' ')[0])} is already in your Dragon Book — cast spells to beat it!`, 3200);
      return;
    }
    const have = FOOD_IDS.filter(id => (this.state.foods[id] || 0) > 0);
    if (!have.length) {
      sfx.wrongTry();
      this.toast('🍖 No food left! Win battles for drops or buy some in the Food menu.', 4200);
      return;
    }
    const e = b.enemy;
    document.getElementById('foodTitle').textContent = `Feed ${e.name.split(' ')[0]} — trust ${Math.round(b.tame)} / ${b.tameNeed}`;
    document.getElementById('foodClue').textContent = `${rarityInfo(e).name} ${e.icon} ${e.element} dragon. It ${FOODS[e.food].clue}.`;
    const row = document.getElementById('foodRow');
    row.textContent = '';
    have.forEach(id => {
      const f = FOODS[id];
      const btn = document.createElement('button');
      btn.className = 'food-btn';
      btn.innerHTML = `<span class="fi">${f.icon}</span><span class="fn">${esc(f.name)}</span><span class="fc">x${this.state.foods[id]}</span>`;
      btn.addEventListener('click', () => {
        if (!(this.state.foods[id] > 0) || b.busy) return;
        this.state.foods[id]--;
        this.tameFood = id;
        b.lastFood = id;
        document.getElementById('foodOverlay').classList.add('hidden');
        this.save();
        this.openSpellForge('TAME');
      });
      row.appendChild(btn);
    });
    document.getElementById('foodOverlay').classList.remove('hidden');
  }

  executeSuccessfulSpell() {
    const W = this.vw;
    const H = this.vh;

    // Award coins & XP
    const earnedCoins = 25 * Math.min(this.state.streak, 10);
    this.state.coins += earnedCoins;
    this.gainXP(40);
    const dragonUp = this.gainDragonXP(35);
    if (dragonUp) this.announceDragonLevel(this.leadDragonId(), dragonUp);

    if (this.pendingAction === 'CRYSTAL') {
      const goal = biomeAt(this.state.islandIndex).goal;
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
      this.checkAchievements();
      this.save();
      return;
    }

    // In Battle!
    const b = this.battle;
    const rightX = W * 0.73;
    const platY = H * 0.62;

    if (this.pendingAction === 'TAME') {
      const enemyId = b.enemy.id;
      const m = foodMatch(b.enemy, this.tameFood);
      const gain = m === 2 ? 45 : m === 1 ? 25 : 8;
      b.tame = Math.min(b.tameNeed, b.tame + gain);
      const verdict = m === 2 ? '😍 FAVOURITE!' : m === 1 ? '🙂 Tasty!' : '😐 Meh...';
      this.spawnFloatText(rightX, platY - 90, `${verdict} +${gain} trust`, m === 2 ? '#00f5d4' : '#ffd166');
      this.spawnBurst(rightX, platY - 30, m === 2 ? '#ff5d8f' : '#ffd166', m === 2 ? 40 : 14);
      sfx.coin();
      if (b.tame >= b.tameNeed) {
        if (!this.state.dragons.includes(enemyId)) {
          this.state.dragons.push(enemyId);
          this.state.stats.tamed = (this.state.stats.tamed || 0) + 1;
          this.equipNew(enemyId);
        }
        this.spawnFloatText(rightX, platY - 130, `🐉 TAMED ${b.enemy.name.split(' ')[0].toUpperCase()}!`, '#00f5d4');
        sfx.chestExplode();
        this.spawnBurst(rightX, platY - 30, '#00f5d4', 55);
        b.enemyHp = 0;
        b.tamedNow = true;
      }
    } else {
      // Fire Dragon Laser Attack!
      sfx.laserBlast();
      b.laserAnim = 22;
      this.triggerScreenShake(16, 18);
      const lvl = this.dragonInfo(this.leadDragonId()).lvl;
      const dmg = Math.round((60 + (this.state.gear.includes('staff_nether') ? 35 : 0)) * (1 + 0.06 * lvl));
      b.enemyHp = Math.max(0, b.enemyHp - dmg);
      this.spawnBurst(rightX, platY - 30, '#ffd166', 38);
      this.spawnFloatText(rightX, platY - 80, `💥 -${dmg} SUPER SPELL!`, '#ffd166');
    }

    if (b.enemyHp <= 0) {
      b.over = true;
      b.busy = true;
      this.updateDock();
      setTimeout(() => this.finishBattleVictory(), 950);
    } else {
      // Enemy gentle counter-attack, then the buttons wake up again
      setTimeout(() => {
        if (this.mode !== 'BATTLE' || this.battle !== b) return;
        b.enemyAnim = 28;
        b.heroFlash = 14;
        b.heroHp = Math.max(0, b.heroHp - 18);
        this.triggerScreenShake(8, 10);
        if (b.heroHp <= 0) this.handleHeroNaps();
        else { b.busy = false; this.updateDock(); }
      }, 550);
    }

    this.checkAchievements();
    this.save();
    this.updateHUD();
  }

  finishBattleVictory() {
    document.getElementById('battleDock').classList.add('hidden');
    document.getElementById('joystick').classList.remove('hidden');
    document.getElementById('questOrb').classList.remove('hidden');
    this.mode = 'WORLD';
    this.battle.busy = false;
    this.battle.over = false;
    this.updateDock();
    this.dropFoods(this.battle);

    if (this.state.stageOnIsland === 1) {
      this.state.stageOnIsland = 2;
      this.setupIslandEncounters();
      this.openInteractiveChest('🎁 GUARDIAN VICTORY CHEST!', 'You defeated the Bridge Guardian!');
    } else {
      if (this.state.islandIndex % ISLANDS_PER_DIM === ISLANDS_PER_DIM - 1) {
        this.openInteractiveChest('🌌 DIMENSION CONQUERED!', `You cleared all ${ISLANDS_PER_DIM} islands of ${biomeAt(this.state.islandIndex).dim}! A portal opens to a NEW dimension…`);
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
      this.announceDimension();
    }
    this.checkAchievements();
    this.save();
  }

  gainXP(amount) {
    const st = this.state;
    st.xp += amount;
    let up = 0;
    while (st.xp >= st.xpNext) {
      st.xp -= st.xpNext;
      st.level++;
      st.xpNext = Math.round(st.xpNext * 1.25);
      up++;
    }
    if (up) this.onLevelUp();
  }

  onLevelUp() {
    const st = this.state;
    const bonus = 40 * st.level;
    st.coins += bonus;
    sfx.chestExplode();
    this.toast(`⭐ <b>LEVEL UP!</b> You are now Level ${st.level}! +${bonus}⭐`, 3800);
    this.spawnBurst(this.vw / 2, this.vh * 0.4, '#ffd166', 50);
  }

  // ==========================================================================
  // INTERACTIVE "TAP 3 TIMES TO BREAK OPEN!" VOXEL CHEST
  // ==========================================================================
  openInteractiveChest(headline, subtext, forcedReward) {
    // Pick an unowned gear surprise or dragon!
    const unownedGear = SURPRISES.filter(g => !this.state.gear.includes(g.id));
    let reward;
    const rollDragon = () => {
      const biome = biomeAt(this.state.islandIndex);
      for (let k = 0; k < 40; k++) {
        const n = DRAGONS.length + Math.floor(Math.random() * (DRAGON_TOTAL - DRAGONS.length));
        const d = getDragon('x' + n);
        if (!this.state.dragons.includes(d.id) && d.rarity <= 2 && (k > 25 || biome.elems.includes(d.element))) return d;
      }
      return null;
    };
    const rolled = !forcedReward && !unownedGear.length && Math.random() < 0.3 ? rollDragon() : null;
    if (forcedReward) {
      reward = forcedReward;
    } else if (unownedGear.length > 0) {
      const g = unownedGear[0];
      this.state.gear.push(g.id);
      reward = { icon: g.icon, name: g.name, desc: g.desc, fact: g.fact };
    } else if (rolled) {
      const d = rolled;
      this.state.dragons.push(d.id);
      this.equipNew(d.id);
      reward = {
        icon: '🐉',
        name: `New Dragon: ${d.name}`,
        desc: `${d.name} (${rarityInfo(d).name}) now flies behind you on every island!`,
        fact: 'STEM Secret: Flying creatures have hollow, lightweight bones to soar through the sky!'
      };
    } else if (Math.random() < 0.6) {
      const id = FOOD_IDS[Math.floor(Math.random() * FOOD_IDS.length)];
      this.state.foods[id] = Math.min(999, (this.state.foods[id] || 0) + 3);
      reward = { icon: FOODS[id].icon, name: `3 x ${FOODS[id].name}!`, desc: 'Taming food for your next wild dragon!', fact: this.randomFact() };
    } else {
      this.state.coins += 250;
      reward = {
        icon: '💎',
        name: '250 Mythic Voxel Gems!',
        desc: 'Supercharged your Wizard Level & Dragon Power!',
        fact: this.randomFact()
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
    if (this.reduceMotion) return;
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
