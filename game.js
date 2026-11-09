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
  { id: 'ignis', name: 'Ignis the Magma Drake', color: '#ef476f', wing: '#ffd166', belly: '#ff9f1c', element: 'Fire' },
  { id: 'volt', name: 'Voltscale the Redstone Wyvern', color: '#00bbf9', wing: '#fee440', belly: '#a8ffea', element: 'Storm' },
  { id: 'frost', name: 'Cryowing the Ice Dragon', color: '#4cc9f0', wing: '#e0fbfc', belly: '#90e0ef', element: 'Frost' },
  { id: 'terra', name: 'Terrahorn the Emerald Drake', color: '#06d6a0', wing: '#ffd166', belly: '#b7efc5', element: 'Earth' },
  { id: 'nebula', name: 'Nebulon the Starlight Wyrm', color: '#9b5de5', wing: '#f15bb5', belly: '#00f5d4', element: 'Cosmic' },
  { id: 'ender', name: 'Enderbyte the Quantum Dragon', color: '#7209b7', wing: '#00f5d4', belly: '#ffd166', element: 'Quantum' }
];

// --- VISIBLE GEAR & SURPRISES ---
const SURPRISES = [
  { id: 'crown_gold', name: 'Golden Crown of Equations', icon: '👑', type: 'crown', desc: 'Your Wizard now wears the Golden Royal Crown on screen!', fact: 'STEM Secret: Gold is so malleable that 1 ounce can be beaten into a sheet covering 100 square feet!' },
  { id: 'wings_aether', name: 'Aether Dragon Wings', icon: '🦋', type: 'wings', desc: 'Magical cyan wings equipped to your Wizard back!', fact: 'STEM Secret: Dragonflies can flap all 4 wings independently and fly backward at 30 mph!' },
  { id: 'staff_nether', name: 'Redstone Superconductor Staff', icon: '🪄', type: 'staff', desc: 'Doubles the size of your spell fireballs!', fact: 'STEM Secret: Lightning bolts are 5 times hotter than the surface of the Sun (around 50,000°F)!' },
  { id: 'pet_star', name: 'Mini Supernova Orbiting Star', icon: '🌟', type: 'orbit', desc: 'A glowing mini-star orbits your Wizard everywhere you walk!', fact: 'STEM Secret: A neutron star is so dense that 1 teaspoon of it weighs as much as a mountain!' }
];

// --- BIOMES / ISLANDS ---
const BIOMES = [
  { name: 'ISLAND 1 • EMERALD VOXEL WOODS', top: '#2ec4b6', left: '#1b9aaa', right: '#0f6b78', water: '#0b1d3a', bossId: 'frost' },
  { name: 'ISLAND 2 • REDSTONE MAGMA CITADEL', top: '#e76f51', left: '#b5381a', right: '#781d09', water: '#2a080c', bossId: 'volt' },
  { name: 'ISLAND 3 • CRYSTAL SKY SANCTUARY', top: '#4cc9f0', left: '#3a86ff', right: '#1d4ed8', water: '#0f172a', bossId: 'terra' },
  { name: 'ISLAND 4 • OBSIDIAN ENDER KEEP', top: '#9b5de5', left: '#6930c3', right: '#3c096c', water: '#090414', bossId: 'ender' }
];

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

function createVisualSTEMChallenge(level = 1) {
  const types = ['array_mult', 'balance_eq', 'potion_frac', 'voxel_area', 'science_circuit'];
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
      if (raw) return JSON.parse(raw);
    } catch (e) {}
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
      gear: [] // 'crown_gold', 'wings_aether', 'staff_nether', 'pet_star'
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

    const stageTargets = [
      { x: 4, y: 4, label: '✨ Walk along the Golden Tiles to the Glowing Mana Crystal!' },
      { x: 4, y: 2, label: '⚔️ Approach the Wild Guardian Dragon on the Golden Path!' },
      { x: 7, y: 2, label: '👑 Challenge the Island Boss Dragon to unlock the Giant Chest!' }
    ];

    const s = Math.min(2, this.state.stageOnIsland || 0);
    this.currentTarget = stageTargets[s];
    this.updateHUD();
  }

  bindEvents() {
    // 1-Click Play Button
    const nameInput = document.getElementById('heroNameInput');
    nameInput.value = this.state.name;

    document.getElementById('btnPlayNow').addEventListener('click', () => {
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
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    // Cycle active lead dragon
    document.getElementById('btnSwapDragon').addEventListener('click', () => {
      this.state.activeDragonIdx = (this.state.activeDragonIdx + 1) % this.state.dragons.length;
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

    const activeId = this.state.dragons[this.state.activeDragonIdx % this.state.dragons.length] || 'ignis';
    const dObj = DRAGONS.find(d => d.id === activeId) || DRAGONS[0];
    document.getElementById('hudDragonText').textContent = `${dObj.name.split(' ')[0]} (${this.state.dragons.length} Following)`;
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
    ctx.fillStyle = '#7209b7';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-14, -36 + bob, 28, 34);
    ctx.strokeRect(-14, -36 + bob, 28, 34);

    // Voxel Head
    ctx.fillStyle = '#ffcdb2';
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
      ctx.fillStyle = '#3c096c';
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

      if (this.state.stageOnIsland === 0) {
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
        const bossDragon = DRAGONS.find(d => d.id === biome.bossId) || DRAGONS[1];
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
    this.state.dragons.forEach((dId, idx) => {
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
    const enemyDragon = isBoss
      ? DRAGONS.find(d => d.id === biome.bossId) || DRAGONS[2]
      : DRAGONS[(this.state.islandIndex + 1) % DRAGONS.length];

    const loop = Math.floor(this.state.islandIndex / BIOMES.length);
    const hpMult = Math.pow(1.2, loop);

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
    const leadId = this.state.dragons[this.state.activeDragonIdx % this.state.dragons.length] || 'ignis';
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
    const challenge = createVisualSTEMChallenge(this.state.level);
    this.activeChallenge = challenge;

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
      sfx.spellCharge();
      this.state.streak++;

      setTimeout(() => {
        document.getElementById('spellForgeOverlay').classList.add('hidden');
        this.executeSuccessfulSpell();
      }, 480);
    } else {
      // Zero-shame instant visual scaffold! Keep modal open so they see the visual hint & succeed!
      btn.classList.add('wrong');
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
    const earnedCoins = 25 * this.state.streak;
    this.state.coins += earnedCoins;
    this.gainXP(40);

    if (this.pendingAction === 'CRYSTAL') {
      // Shatter crystal on Island Stage 0!
      sfx.laserBlast();
      this.triggerScreenShake(12, 14);
      const tp = this.isoToScreen(this.currentTarget.x, this.currentTarget.y, 0.5);
      this.spawnBurst(tp.x, tp.y, '#06d6a0', 32);
      this.spawnFloatText(tp.x, tp.y - 40, `+${earnedCoins} GOLD & MANA!`, '#ffd166');

      this.state.stageOnIsland = 1;
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
      const dmg = 60 + (this.state.gear.includes('staff_nether') ? 35 : 0);
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
      if (this.state.islandIndex === 3) {
        this.openInteractiveChest('🎉 FINAL REALM CELEBRATION CHEST!', 'You conquered all 4 realms! Now looping into Master Islands with +20% stronger dragons!');
      } else if (this.state.islandIndex > 3) {
        this.openInteractiveChest('👑 MASTER REALM MYSTERY CHEST!', `You conquered the looping island realm! (+20% Enemy HP loop active)`);
      } else {
        this.openInteractiveChest('👑 ISLAND BOSS MYSTERY CHEST!', `You conquered the Island and reached a new realm!`);
      }
      this.state.islandIndex++;
      this.state.stageOnIsland = 0;
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
      const d = unownedDragons[0];
      this.state.dragons.push(d.id);
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
