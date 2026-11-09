// Monkey test: random (seeded) user actions against the real UI, with invariants checked after every step.
// Run via:  bash tests/run-monkey.sh [seed] [steps]
const params = new URLSearchParams(location.search);
const SEED = Number(params.get('seed') || 1), STEPS = Number(params.get('steps') || 300);
let _s = SEED >>> 0;
const R = () => { _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const pickR = arr => arr[Math.floor(R() * arr.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const vis = id => !$(id).classList.contains('hidden');

const errors = [];
window.addEventListener('error', e => errors.push('JS error: ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
window.addEventListener('unhandledrejection', e => errors.push('Promise rejection: ' + (e.reason && e.reason.message || e.reason)));
const _w = console.warn, _e = console.error;
console.warn = (...a) => { errors.push('warn: ' + a.join(' ')); _w.apply(console, a); };
console.error = (...a) => { errors.push('error: ' + a.join(' ')); _e.apply(console, a); };

const violations = [];
const counts = {};
const note = k => { counts[k] = (counts[k] || 0) + 1; };
let step = 0, lastAction = '';

function invariants(g) {
  const bad = m => { if (violations.length < 25) violations.push(`step ${step} after "${lastAction}": ${m}`); };
  const st = g.state;
  const nums = [st.level, st.xp, st.xpNext, st.coins, st.qCount, st.islandIndex, st.maxIsland, st.stageOnIsland, st.goalProgress, st.run, st.bestRun, st.stats.totalMs, st.stats.sessions];
  if (nums.some(n => !Number.isFinite(n))) bad('non-finite number in state ' + nums.join(','));
  if (st.coins < 0 || st.level < 1 || st.xp < 0) bad(`bad coins/level/xp ${st.coins}/${st.level}/${st.xp}`);
  if (st.stageOnIsland < 0 || st.stageOnIsland > 2) bad('stage out of range');
  if (st.maxIsland < st.islandIndex) bad('maxIsland < islandIndex');
  if (st.squad.length < 1 || st.squad.length > 3 || st.squad.some(id => !st.dragons.includes(id)) || new Set(st.squad).size !== st.squad.length) bad('bad squad ' + st.squad);
  if (new Set(st.dragons).size !== st.dragons.length) bad('duplicate dragons');
  if (st.review.length > 12) bad('review queue too long ' + st.review.length);
  Object.entries(st.dragonLevels).forEach(([id, d]) => { if (!(d.lvl >= 1 && d.lvl <= 10) || !Number.isFinite(d.xp) || d.xp < 0) bad('dragon level ' + id + JSON.stringify(d)); });
  Object.entries(st.skills).forEach(([k, s]) => { if (!(s.tier >= 1 && s.tier <= 5) || s.recent.length > 8) bad('skill ' + k + JSON.stringify(s)); });
  Object.entries(st.stats.daily).forEach(([k, d]) => { if (![d.ms, d.q, d.first].every(Number.isFinite) || d.first > d.q) bad('daily ' + k + JSON.stringify(d)); });
  Object.entries(st.stats.byCat).forEach(([k, c]) => { if (c.first > c.asked || c.tries < c.asked - 0 && c.tries < 0) bad('byCat ' + k + JSON.stringify(c)); });
  // overlays / modes
  if (vis('spellForgeOverlay') && vis('chestOverlay')) bad('forge and chest open together');
  if (vis('spellForgeOverlay')) {
    const bs = [...document.querySelectorAll('.rune-stone-btn')];
    if (bs.length !== 3 || !g.activeChallenge) bad('forge open without 3 buttons/challenge');
    if (bs.filter(b => b.classList.contains('correct')).length > 1) bad('multiple correct buttons');
  }
  if (g.mode === 'WORLD' && vis('battleDock')) bad('battle dock visible in WORLD mode');
  if (g.mode === 'BATTLE' && !vis('battleDock') && !g.battle.over) bad('battle without dock');
  if (g.qWrong < 0) bad('negative qWrong');
  if (g.state.settings.limitMin < 0) bad('limit');
  if (errors.length) bad('JS problem: ' + errors[0]);
}

async function answerForge(g) {
  const ch = g.activeChallenge;
  const bs = [...document.querySelectorAll('.rune-stone-btn')];
  const ok = bs.find(b => b.dataset.val === String(ch.correct));
  const wrongs = bs.filter(b => b !== ok && !b.disabled);
  if (R() < 0.4 && wrongs.length) { pickR(wrongs).click(); note('wrong-click'); }
  if (!vis('spellForgeOverlay')) return; // dragon napped
  if (R() < 0.15 && wrongs.length > 1) { wrongs[wrongs.length - 1].click(); }
  if (!vis('spellForgeOverlay')) return;
  const ok2 = [...document.querySelectorAll('.rune-stone-btn')].find(b => b.dataset.val === String(ch.correct));
  ok2.click();
  if (R() < 0.3) ok2.click(); // double-tap
  if (R() < 0.3) { const o = [...document.querySelectorAll('.rune-stone-btn')].find(b => b !== ok2); if (o) o.click(); }
  note('answered');
  await sleep(ri(700, 1500));
}

async function handleLock(g) {
  const kind = g.lockKind;
  note('lock:' + kind);
  if (kind === 'break') { await sleep(61500); const b = document.querySelector('#lockActions .pd-btn'); if (b && !b.disabled) b.click(); return; }
  document.querySelector('#lockActions .pd-btn').click();
  const pin = document.querySelector('#lockActions .pd-pin');
  pin.value = '1234'; document.querySelector('#lockActions .pd-go').click();
  const btns = [...document.querySelectorAll('#lockActions .pd-btn')];
  const ext = btns.find(b => /\+/.test(b.textContent));
  (ext || btns[0]).click();
  g.state.settings.limitMin = 0; g.state.settings.bedtimeOn = false;
}

async function oneStep(g) {
  step++;
  if (vis('lockOverlay')) { lastAction = 'lock'; await handleLock(g); return; }
  if (vis('tutorialOverlay')) { lastAction = 'tutorial'; $('tutNext').click(); return; }
  if (vis('parentOverlay')) {
    lastAction = 'parent';
    const tabs = [...document.querySelectorAll('.ptab')];
    if (R() < 0.6 && tabs.length) { pickR(tabs).click(); note('parent-tab'); }
    if (document.getElementById('setLimit') && R() < 0.5) {
      const sel = pickR(['setGoal', 'setFocus', 'setBreak', 'setGrade']).replace(/^/, '');
      const el = $(sel);
      if (el && el.tagName === 'SELECT') { const o = pickR([...el.options]); el.value = o.value; el.dispatchEvent(new Event('change')); note('setting'); }
    }
    if (R() < 0.45) { g.closeParent(); note('parent-close'); }
    return;
  }
  if (vis('chestOverlay')) { lastAction = 'chest'; for (let i = 0; i < ri(2, 5); i++) g.handleChestTap(); if (!$('btnContinueFromChest').classList.contains('hidden')) $('btnContinueFromChest').click(); return; }
  if (vis('spellForgeOverlay')) { lastAction = 'answer'; await answerForge(g); return; }
  if (vis('menuOverlay')) {
    lastAction = 'menu';
    const els = [...document.querySelectorAll('#menuBody .mini-btn, #menuBody .menu-item:not(.locked)')];
    if (els.length && R() < 0.7) pickR(els).click();
    if (R() < 0.35) g.closeMenu();
    note('menu-action');
    return;
  }
  if (g.mode === 'BATTLE') {
    lastAction = 'battle';
    if (g.battle.busy || g.battle.over) { await sleep(ri(300, 900)); return; }
    if (R() < 0.15) { $('btnCastSpell').click(); $('btnCastSpell').click(); } // button mashing
    else $(R() < 0.7 ? 'btnCastSpell' : 'btnTameDragon').click();
    return;
  }
  // WORLD
  const r = R();
  if (r < 0.62 && g.currentTarget) {
    lastAction = 'walk';
    g.hero.x = g.hero.targetX = g.currentTarget.x; g.hero.y = g.hero.targetY = g.currentTarget.y; g.nextForgeAt = 0;
    g.checkObjectiveReached(); // headless virtual time does not run animation frames, so trigger it directly
    note('walk-to-target');
    await sleep(ri(200, 600));
  } else if (r < 0.72) {
    lastAction = 'open-menu';
    g.openMenu(pickR(['hero', 'dragons', 'islands', 'badges'])); note('open-menu');
  } else if (r < 0.755) {
    lastAction = 'parent-open';
    g.parentAuthed = true; g.openParent(true); note('parent-open');
  } else if (r < 0.82) {
    lastAction = 'ticks';
    for (let i = 0; i < ri(1, 30); i++) g.tick(); note('ticks');
  } else if (r < 0.85) {
    lastAction = 'trigger-limit';
    g.state.settings.limitMin = 1; (g.state.stats.daily[dayKey()] || (g.state.stats.daily[dayKey()] = { ms: 0, q: 0, first: 0 })).ms = 61000; g.checkLocks(false); note('trigger-limit');
  } else if (r < 0.88) {
    lastAction = 'trigger-break';
    g.state.settings.breakMin = 1; g.sinceBreakMs = 61000; g.checkLocks(false); g.state.settings.breakMin = 0; note('trigger-break');
  } else if (r < 0.90) {
    lastAction = 'joystick';
    g.joy = { x: R() * 2 - 1, y: R() * 2 - 1, id: 1 }; await sleep(ri(100, 400)); g.joy = { x: 0, y: 0, id: null }; note('joystick');
  } else if (r < 0.93) {
    lastAction = 'orb';
    $('questOrb').click(); await sleep(ri(300, 1500)); note('orb');
  } else if (r < 0.96) {
    lastAction = 'save-reload';
    g.save(); const re = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); if (JSON.stringify(normalizeSave(re)) !== JSON.stringify(re)) violations.push(`step ${step}: normalizeSave not idempotent`); note('save-reload');
  } else {
    lastAction = 'wait';
    await sleep(ri(100, 800));
  }
}

window.addEventListener('load', async () => {
  const g = window.game;
  const out = { seed: SEED, steps: 0, violations, errors, counts };
  try {
    g.setPin('1234');
    $('btnPlayNow').click();
    for (let i = 0; i < STEPS; i++) {
      await oneStep(g);
      await sleep(30);
      invariants(g);
      out.steps = step;
      if (violations.length >= 10) break;
    }
    // final: persisted state must reload cleanly
    g.save();
    const re = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    out.final = { qCount: re.qCount, level: re.level, dragons: re.dragons.length, maxIsland: re.maxIsland, badges: Object.keys(re.achievements).length, review: re.review.length };
  } catch (e) {
    violations.push('monkey crashed at step ' + step + ' (' + lastAction + '): ' + (e && e.stack || e));
  }
  document.title = 'MONKEY:' + btoa(unescape(encodeURIComponent(JSON.stringify(out))));
});
