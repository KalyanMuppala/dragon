// End-to-end test, run in headless Chrome against the real page.
const results = [];
const jsErrors = [];
window.addEventListener('error', e => jsErrors.push('JS error: ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
window.addEventListener('unhandledrejection', e => jsErrors.push('Promise rejection: ' + (e.reason && e.reason.message || e.reason)));
const _warn = console.warn, _err = console.error;
console.warn = (...a) => { jsErrors.push('console.warn: ' + a.join(' ')); _warn.apply(console, a); };
console.error = (...a) => { jsErrors.push('console.error: ' + a.join(' ')); _err.apply(console, a); };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const vis = id => !$(id).classList.contains('hidden');
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
async function t(name, fn) {
  try { await fn(); results.push([name, true, '']); }
  catch (e) { results.push([name, false, String(e && e.message || e)]); }
}
const btns = () => [...document.querySelectorAll('.rune-stone-btn')];
const correctBtn = g => btns().find(b => b.dataset.val === String(g.activeChallenge.correct));
const wrongBtn = g => btns().find(b => b.dataset.val !== String(g.activeChallenge.correct) && !b.disabled);
function toTarget(g) {
  g.hero.x = g.hero.targetX = g.currentTarget.x;
  g.hero.y = g.hero.targetY = g.currentTarget.y;
  g.nextForgeAt = 0;
  g.checkObjectiveReached();
}
async function feedAndAnswer(g, wrong) {
  const e = g.battle.enemy;
  g.state.foods[e.food] = Math.max(3, g.state.foods[e.food] || 0);
  $('btnTameDragon').click();
  assert(vis('foodOverlay'), 'food picker should open');
  const fb = [...document.querySelectorAll('#foodRow .food-btn')].find(b => b.textContent.includes(FOODS[e.food].name));
  assert(fb, 'favourite food button');
  fb.click();
  assert(vis('spellForgeOverlay') && !vis('foodOverlay'), 'forge should open after picking food');
  (wrong ? wrongBtn(g) : correctBtn(g)).click();
}
async function tapChest(g) {
  for (let i = 0; i < 3; i++) g.handleChestTap();
  assert(!$('rewardRevealBox').classList.contains('hidden'), 'reward not revealed');
  $('btnContinueFromChest').click();
  assert(!vis('chestOverlay'), 'chest not closed');
}

window.addEventListener('load', async () => {
  const g = window.game;

  await t('A1 boots with fresh defaults and no errors', () => {
    assert(g && vis('titleOverlay'), 'title not visible');
    assert(g.state.settings.grade === 4 && g.state.settings.focus === 'balanced', 'bad defaults');
    assert($('versionTag').textContent.includes('dev'), 'version tag: ' + $('versionTag').textContent);
    assert($('welcomeBack').textContent.length > 3, 'welcome text');
    assert(g.state.stats.sessions === 0, 'sessions not 0');
  });

  await t('A2 dashboard renders for a brand-new profile with no data (no NaN / undefined / errors)', () => {
    const R = g.report(g.state);
    const views = ['pvOverview', 'pvSkills', 'pvActivity', 'pvSettings', 'pvReports'].map(f => g[f](g.state, R, false));
    views.forEach((h, i) => assert(typeof h === 'string' && h.length > 100 && !/NaN|undefined|\[object|Infinity/.test(h), `empty-state view ${i}: ` + (h.match(/.{30}(NaN|undefined|\[object|Infinity).{30}/) || [''])[0]));
    assert(!/NaN|undefined/.test(g.buildSummaryText(g.state)) && g.buildCsv(g.state).split('\n').length === 1, 'summary/csv for empty state');
    assert(g.insights(g.state, R).length >= 1, 'insights');
  });

  // ------------------------------------------------------------- onboarding + daily chest
  await t('B1 Play shows the tutorial on first run', async () => {
    $('btnPlayNow').click();
    assert(!vis('titleOverlay'), 'title still visible');
    assert(vis('tutorialOverlay'), 'tutorial not visible');
    assert(g.state.stats.sessions === 1, 'session not counted');
  });
  await t('B2 tutorial steps through and closes; daily chest appears', async () => {
    for (let i = 0; i < 3; i++) $('tutNext').click();
    assert(!vis('tutorialOverlay'), 'tutorial still open');
    assert(g.state.seenTutorial === true, 'seenTutorial not saved');
    assert(vis('chestOverlay'), 'daily chest not shown');
    assert(g.state.daily.streak === 1 && g.state.daily.last === dayKey(), 'daily streak wrong');
    const before = g.state.coins;
    await tapChest(g);
    assert(g.state.coins === before, 'coins are granted when chest opens, not twice');
  });
  await t('B3 daily streak logic: yesterday continues, gap resets, same day unchanged', () => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    g.state.daily = { last: dayKey(y), streak: 3, best: 3, pendingChest: false };
    g.onSessionStart();
    assert(g.state.daily.streak === 4 && g.state.daily.pendingChest, 'streak should continue to 4');
    g.state.daily.pendingChest = false;
    g.onSessionStart();
    assert(g.state.daily.streak === 4 && !g.state.daily.pendingChest, 'same day should not change');
    const old = new Date(); old.setDate(old.getDate() - 5);
    g.state.daily = { last: dayKey(old), streak: 9, best: 9, pendingChest: false };
    g.onSessionStart();
    assert(g.state.daily.streak === 1 && g.state.daily.best === 9, 'gap should reset streak to 1, keep best');
    assert(g.effectiveStreak() === 1, 'effective streak');
    g.state.daily.pendingChest = false;
  });

  // ------------------------------------------------------------- question card + recording
  await t('C1 forge opens with passage/hint/skill info and 3 buttons', () => {
    g.state.stageOnIsland = 0; g.state.goalProgress = 0; g.setupIslandEncounters();
    toTarget(g);
    assert(vis('spellForgeOverlay'), 'forge not open');
    const ch = g.activeChallenge;
    assert(ALL_KINDS.includes(ch.kind), 'bad kind');
    assert(btns().length === 3, 'need 3 buttons');
    assert($('forgeSkill').textContent.includes('Level'), 'skill label');
    assert($('forgeQuestionPrompt').textContent === ch.prompt, 'prompt text');
    assert($('forgePassage').classList.contains('hidden') === !ch.passage, 'passage visibility');
    assert($('forgeHelperTip').classList.contains('hidden'), 'hint should be hidden at first');
  });
  await t('C1b the answer timer pauses while the app is hidden / a lock or the dashboard is open', async () => {
    const q0 = g.qStart;
    g.pauseQuestionClock('lock'); g.pauseQuestionClock('parent');
    await sleep(3000);
    g.resumeQuestionClock('lock');
    await sleep(2000);
    assert(g.qStart === q0, 'timer must stay paused while ANY reason is still active');
    g.resumeQuestionClock('parent');
    assert(g.qStart - q0 >= 4500, 'start time should shift by the paused time, shifted ' + Math.round(g.qStart - q0) + 'ms');
    g.resumeQuestionClock('parent'); // extra resume is harmless
    assert(g._pauseReasons.size === 0, 'no reasons should remain');
  });
  await t('C2 wrong answer: first tap is final, all runes lock, answer revealed, penalty applied and saved', async () => {
    g.state.coins = 100; g.state.xp = 40;
    const orig = g.applyPenalty.bind(g); let seen = null;
    g.applyPenalty = () => { const c = g.state.coins, x = g.state.xp; const r = orig(); seen = { c, x, r }; return r; };
    const w = wrongBtn(g);
    w.click();
    g.applyPenalty = orig;
    assert(btns().every(b => b.disabled), 'every rune must lock after the first tap');
    assert(w.classList.contains('wrong') && btns().some(b => b.classList.contains('correct')), 'wrong + correct shown');
    assert(!$('forgeHelperTip').classList.contains('hidden') && $('forgeHelperTip').textContent.includes('answer was'), 'answer not revealed');
    assert(g.state.stats.mistakes.length === 1 && g.state.stats.mistakes[0].picked === w.dataset.val, 'mistake not logged');
    assert(g.state.qCount === 1 && g.qWrong === 1, 'miss must be recorded once');
    assert(seen && seen.r.lossC === 60 && seen.r.lossX === 40 && g.state.coins === seen.c - 60 && g.state.xp === 0, `penalty: ${JSON.stringify(seen)} coins ${g.state.coins} xp ${g.state.xp}`);
    assert(JSON.parse(localStorage.getItem(SAVE_KEY)).coins === g.state.coins, 'penalty must be saved immediately');
    // spamming other runes (even the right one) must not count
    const cNow = g.state.coins;
    btns().forEach(b => b.click());
    assert(g.state.qCount === 1 && g.state.coins === cNow && g.state.stats.mistakes.length === 1, 'extra taps were counted');
    await sleep(2400);
    assert(!vis('spellForgeOverlay'), 'forge should close after the miss');
  });
  await t('C3 correct answer counted exactly once even when mashed; earlier miss queued for review', async () => {
    const missed = g.state.stats.log[0];
    assert(missed.first === 0 && missed.tries === 1 && g.state.review.length === 1, 'miss log/review');
    g.state.stageOnIsland = 0; g.nextForgeAt = 0; g.setupIslandEncounters(); toTarget(g);
    assert(vis('spellForgeOverlay'), 'forge should reopen');
    const ok = correctBtn(g);
    ok.click(); ok.click();
    btns().forEach(b => b.click());
    assert(g.state.qCount === 2, 'qCount should be 2, was ' + g.state.qCount);
    await sleep(900);
    assert(!vis('spellForgeOverlay'), 'forge should close');
    assert(g.state.stats.log.length === 2 && g.state.stats.log[1].first === 1 && g.state.stats.log[1].tries === 1, 'log entry');
    assert(g.state.achievements.first_spell, 'first_spell badge');
    if (vis('chestOverlay')) $('chestOverlay').classList.add('hidden');
  });

  await t('E1 every question kind × tier renders in the real forge and can be answered', async () => {
    const realNext = g.nextChallenge;
    const problems = [];
    let n = 0;
    for (const kind of ALL_KINDS) {
      for (let tier = 1; tier <= 5; tier++) {
        g.state.stageOnIsland = 0; g.state.goalProgress = 0; g.setupIslandEncounters();
        g.nextChallenge = () => buildChallenge({ kind, tier, seed: 1000 + tier * 7 + kind.length });
        g.hero.x = g.hero.targetX = g.currentTarget.x; g.hero.y = g.hero.targetY = g.currentTarget.y;
        g.nextForgeAt = 0; g.checkObjectiveReached();
        const tag = `${kind} t${tier}`;
        if (!vis('spellForgeOverlay')) { problems.push(tag + ': forge did not open'); continue; }
        if (btns().length !== 3) problems.push(tag + ': ' + btns().length + ' buttons');
        const cv = $('stemDiagramCanvas'), px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let ink = 0; for (let i = 3; i < px.length; i += 4 * 40) if (px[i] > 0) ink++;
        if (ink < 3) problems.push(tag + ': diagram blank');
        const ok = correctBtn(g);
        if (!ok) { problems.push(tag + ': no correct button in DOM'); g.closeForge(); continue; }
        // answers with quotes/apostrophes must survive the DOM
        if (btns().some(b => b.dataset.val !== b.textContent.replace(/^🔮 /, ''))) problems.push(tag + ': button text mismatch');
        ok.click();
        await sleep(700);
        n++;
        if (vis('spellForgeOverlay')) problems.push(tag + ': forge stuck open');
        if (vis('chestOverlay')) { $('chestOverlay').classList.add('hidden'); }
      }
    }
    g.nextChallenge = realNext;
    assert(problems.length === 0, `${problems.length} problems (of ${n} cycles): ` + problems.slice(0, 6).join(' | '));
  });

  // ------------------------------------------------------------- battle guards
  await t('F1 battle: double-tapped Cast opens one card; buttons lock until the enemy replies', async () => {
    g.state.stageOnIsland = 1; g.state.goalProgress = 0; g.setupIslandEncounters();
    toTarget(g);
    assert(g.mode === 'BATTLE' && vis('battleDock'), 'battle did not start');
    g.battle.enemyHp = g.battle.enemyMaxHp = 5000; // sturdy enemy: lets us test the counter-attack
    $('btnCastSpell').click(); $('btnCastSpell').click();
    assert(document.querySelectorAll('#spellForgeOverlay').length === 1 && vis('spellForgeOverlay'), 'forge');
    const ch = g.activeChallenge;
    correctBtn(g).click();
    assert(g.battle.busy === true && $('battleDock').classList.contains('busy'), 'dock should be busy after answering');
    await sleep(700);
    $('btnCastSpell').click(); // still resolving the spell: must be ignored
    await sleep(700);
    assert(g.activeChallenge === ch || !vis('spellForgeOverlay') || g.battle.busy === false, 'state');
    assert(g.battle.heroHp < 100, 'enemy counter-attack should have hurt: hp=' + g.battle.heroHp);
    assert(g.battle.busy === false && !$('battleDock').classList.contains('busy'), 'dock should wake up after counter-attack');
  });
  await t('F2 taming needs the right food + several correct answers; wrong food barely helps; then chest', async () => {
    g.state.stageOnIsland = 1; g.setupIslandEncounters(); toTarget(g); g.battle.enemyHp = g.battle.enemyMaxHp = 5000;
    const before = g.state.dragons.length, b = g.battle, e = b.enemy;
    assert(!g.state.dragons.includes(e.id), 'enemy should be untamed');
    const food0 = g.state.foods[e.food] = 4;
    await feedAndAnswer(g, false);
    await sleep(800);
    assert(b.tame === 25 && g.state.foods[e.food] === food0 - 1, 'favourite food = +25 trust and uses 1 food: tame=' + b.tame);
    assert(!g.state.dragons.includes(e.id) && g.state.dragons.length === before, 'one answer must NOT tame the dragon');
    await sleep(1200);
    assert(b.busy === false, 'dock should wake after counter-attack');
    // a food it does not care about only gives a little trust
    const meh = FOOD_IDS.find(id => id !== e.food && id !== e.food2);
    g.state.foods[meh] = 2; $('btnTameDragon').click();
    [...document.querySelectorAll('#foodRow .food-btn')].find(x => x.textContent.includes(FOODS[meh].name)).click();
    const t0 = b.tame; correctBtn(g).click(); await sleep(800);
    assert(b.tame === t0 + 5, 'wrong food gives +5, got ' + (b.tame - t0));
    await sleep(1200);
    // a wrong answer while taming costs trust and points
    const c0 = g.state.coins; b.heroHp = 100;
    await feedAndAnswer(g, true);
    await sleep(2400);
    assert(b.tame === Math.max(0, t0 + 5 - 30), 'trust should drop: ' + b.tame);
    assert(g.state.coins <= c0, 'penalty');
    // finish: top the meter up and feed the favourite
    b.tame = b.tameNeed - 10; b.heroHp = 100; b.busy = false; g.updateDock();
    await feedAndAnswer(g, false);
    await sleep(800);
    assert(b.over === true && $('battleDock').classList.contains('busy'), 'should be locked after the win');
    $('btnCastSpell').click();
    assert(!vis('spellForgeOverlay'), 'cast must be ignored after the enemy is beaten');
    await sleep(1400);
    assert(g.mode === 'WORLD' && vis('chestOverlay'), 'did not return to the map with a chest');
    assert(g.state.dragons.length === before + 1 && g.state.dragons.includes(e.id) && g.state.squad.length >= 2, 'dragon not tamed/equipped');
    assert(g.state.stageOnIsland === 2, 'stage should advance to boss');
    await tapChest(g);
  });
  await t('F3 hero naps at 0 HP: miss recorded, HP restored, no stuck card, boss tamed afterwards', async () => {
    toTarget(g);
    assert(g.mode === 'BATTLE', 'boss battle should start');
    g.battle.enemyHp = g.battle.enemyMaxHp = 5000;
    const q0 = g.state.qCount;
    $('btnCastSpell').click();
    g.battle.heroHp = 15;
    wrongBtn(g).click();
    assert(g.state.qCount === q0 + 1 && g.state.stats.log[g.state.stats.log.length - 1].first === 0, 'miss not recorded');
    await sleep(2400);
    assert(!vis('spellForgeOverlay'), 'forge should close when the dragon naps');
    assert(g.battle.heroHp === 100, 'hp restored: ' + g.battle.heroHp);
    assert(g.battle.busy === false, 'busy should clear');
    g.battle.tame = g.battle.tameNeed - 10;
    await feedAndAnswer(g, false);
    await sleep(2400);
    assert(g.mode === 'WORLD' && vis('chestOverlay'), 'boss chest');
    assert(g.state.islandIndex === 1 && g.state.maxIsland === 1 && g.state.stageOnIsland === 0, 'island did not advance');
    await tapChest(g);
  });
  await t('F4 closing the game mid-question counts as a miss on the next load', async () => {
    g.state.coins = 100; g.state.xp = 30; g.state.stageOnIsland = 0; g.nextForgeAt = 0; g.setupIslandEncounters(); toTarget(g);
    assert(vis('spellForgeOverlay') && JSON.parse(localStorage.getItem(SAVE_KEY)).pendingQ === 1, 'pending flag should be saved');
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    const s2 = normalizeSave(raw);
    assert(s2.pendingQ === 1, 'pendingQ survives normalize');
    g.closeForge(); g.state.pendingQ = 0;
  });
  await t('F6 duel: two players on a stub channel play 5 rounds, wrong answers cost, winner paid', async () => {
    g.mode = 'WORLD';
    const A = new Duel(g), B = new Duel(g); // both drive the same page's DOM, so test the logic via state, not DOM
    const mk = (me, other) => ({ readyState: 'open', send(m) { setTimeout(() => other.onmessage({ data: m }), 0); } });
    const chA = mk(A, B), chB = mk(B, A);
    A.role = 'host'; B.role = 'join';
    chA.onmessage = null; chB.onmessage = null;
    A.ch = chA; B.ch = chB;
    chA.send = m => setTimeout(() => B.onMsg(JSON.parse(m)), 0);
    chB.send = m => setTimeout(() => A.onMsg(JSON.parse(m)), 0);
    A.send({ t: 'hello', name: 'Alice' }); B.send({ t: 'hello', name: 'Bob' });
    await sleep(20);
    assert(A.oppName === 'Bob' && B.oppName === 'Alice', 'hello names');
    const rounds = Array.from({ length: 5 }, (_, k) => ({ kind: ALL_KINDS[k], tier: 2, seed: 100 + k }));
    assert(JSON.stringify(buildChallenge(rounds[0]).choices) === JSON.stringify(buildChallenge(rounds[0]).choices), 'same seed => same choices');
    // simulate results directly: A always right and faster, B always wrong
    A.rounds = B.rounds = rounds; A.me = A.opp = B.me = B.opp = 0;
    for (let i = 0; i < 5; i++) {
      A.i = B.i = i; A.mine = { ok: true, ms: 1000 }; B.mine = { ok: false, ms: 2000 };
      A.theirs = B.mine; B.theirs = A.mine; A.maybeResolve(); B.maybeResolve();
    }
    assert(A.me === 75 && A.opp === -75 && B.me === -75 && B.opp === 75, `scoring ${A.me}/${A.opp}`);
    const c0 = g.state.coins; A.me = 75; A.opp = -75; A.finish();
    assert(g.state.coins === c0 + 100 && /WIN/.test($('duelResult').textContent), 'winner paid');
    $('duelOverlay').classList.add('hidden');
  });
  await t('F5 voxel world: 10,000 dragons, foods, endless dimensions', () => {
    assert(DRAGON_TOTAL === 10000 && getDragon('x9999').id === 'x9999' && getDragon('x5000').name === getDragon('x5000').name, 'dragons');
    assert(!isDragonId('x10000') && !isDragonId('zzz'), 'invalid ids');
    assert(biomeAt(0).dim !== biomeAt(ISLANDS_PER_DIM).dim && biomeAt(10000).title.length > 3, 'dimensions');
    g.state.islandIndex = 6; g.layout = null; g.setupIslandEncounters();
    assert(g.layout && g.layout.h.length === 9, 'layout built');
    g.state.islandIndex = 1; g.layout = null; g.setupIslandEncounters();
  });

  // ------------------------------------------------------------- leveling, badges, feeding, menus
  g.closeForge(); g.nextForgeAt = performance.now() + 1e9; g.hero.x = g.hero.targetX = 0; g.hero.y = g.hero.targetY = 0; // stand clear of the objective so no question pops up mid-menu test
  await t('G1 level-up gives a toast and coin bonus', () => {
    const lvl = g.state.level, coins = g.state.coins;
    g.gainXP(100000);
    assert(g.state.level > lvl && g.state.coins > coins, 'level-up not applied');
    assert(document.querySelectorAll('#toastLayer .toast').length > 0, 'no toast');
  });
  g.closeForge();
  await t('G2 feeding a dragon costs coins and levels it', () => {
    g.state.coins = 500;
    g.state.dragonLevels.ignis = { lvl: 2, xp: 10 }; // earlier tests may have maxed it out
    g.openMenu('dragons');
    assert(vis('menuOverlay'), 'menu closed: mode=' + g.mode + ' open=' + [...document.querySelectorAll('.overlay-screen:not(.hidden)')].map(e => e.id));
    const before = JSON.stringify(g.dragonInfo('ignis'));
    const feed = document.querySelector('.mini-btn.feed[data-id="ignis"]');
    assert(feed && !feed.disabled, 'feed button missing');
    feed.click();
    // 500 - 80 for the food, +50 if this feed unlocked the Dragon Chef badge
    assert(g.state.coins === 420 || g.state.coins === 470, 'coins should be 420 (or 470 with the badge bonus), was ' + g.state.coins);
    assert(JSON.stringify(g.dragonInfo('ignis')) !== before, 'dragon xp unchanged');
    assert(g.state.achievements.chef, 'chef badge');
    g.state.dragonLevels.ignis = { lvl: 10, xp: 0 }; g.renderMenu();
    const maxFeed = document.querySelector('.mini-btn.feed[data-id="ignis"]');
    assert(maxFeed && maxFeed.disabled && /MAX/.test(maxFeed.textContent), 'max-level dragon should show a disabled MAX button');
    g.state.dragonLevels.ignis = { lvl: 3, xp: 0 }; g.state.coins = 0; g.renderMenu();
    const lvlBefore = JSON.stringify(g.dragonInfo('ignis'));
    document.querySelector('.mini-btn.feed[data-id="ignis"]').click();
    assert(g.state.coins === 0 && JSON.stringify(g.dragonInfo('ignis')) === lvlBefore, 'cannot feed without coins');
  });
  await t('G3 equip cap of 3, lead switching, hero change badge', () => {
    ['volt', 'frost', 'terra', 'nebula'].forEach(id => { if (!g.state.dragons.includes(id)) g.state.dragons.push(id); });
    g.state.squad = ['ignis'];
    g.openMenu('dragons');
    ['volt', 'frost', 'terra'].forEach(id => { const b = document.querySelector(`.mini-btn[data-act="equip"][data-id="${id}"]`); b.click(); });
    assert(g.state.squad.length === 3, 'squad should cap at 3: ' + g.state.squad);
    assert(g.state.achievements.squad3, 'squad3 badge');
    document.querySelector('.mini-btn[data-act="lead"][data-id="frost"]').click();
    assert(g.state.squad[0] === 'frost', 'lead not switched');
    g.menuTab = 'hero'; g.renderMenu();
    document.querySelectorAll('#menuBody .menu-item')[2].click();
    assert(g.state.character === 2 && g.state.achievements.looks, 'hero change');
  });
  await t('G4 islands + badges tabs render', () => {
    g.menuTab = 'islands'; g.renderMenu();
    assert(document.querySelectorAll('#menuBody .menu-item').length === 6, '6 islands per dimension page');
    g.menuTab = 'food'; g.renderMenu();
    assert(document.querySelectorAll('#menuBody .menu-item').length === FOOD_IDS.length, 'food cards');
    g.state.coins = 100; const hb = g.state.foods.honey;
    document.querySelector('[data-buy="honey"]').click();
    assert(g.state.foods.honey === hb + 1 && g.state.coins === 100 - FOODS.honey.price, 'buying food');
    g.state.coins = 1; document.querySelector('[data-buy="star"]').click();
    assert(g.state.foods.star === (g.state.foods.star), 'cannot buy without coins'); 
    g.menuTab = 'badges'; g.renderMenu();
    assert(document.querySelectorAll('#menuBody .menu-item').length === ACHIEVEMENTS.length, 'badge cards');
    assert($('menuBody').textContent.includes('First Spell'), 'badge name');
    g.closeMenu();
  });

  // ------------------------------------------------------------- save model
  await t('H1 normalizeSave upgrades an old save and survives garbage', () => {
    const old = { name: 'Old', level: 5, xp: 10, xpNext: 200, coins: 300, dragons: ['ignis', 'volt'], activeDragonIdx: 1, gear: ['crown_gold'],
      stats: { sessions: 2, totalMs: 1000, daily: {}, log: [{ t: 1, cat: 'Area & Geometry', subj: 'Math', tries: 1, ms: 1000 }],
        byCat: { 'Area & Geometry': { subj: 'Math', asked: 4, first: 3, tries: 5, ms: 4000 }, 'Vocabulary: synonyms': { subj: 'English', asked: 3, first: 1, tries: 5, ms: 3000 }, 'Vocabulary: opposites': { subj: 'English', asked: 2, first: 2, tries: 2, ms: 1000 } } } };
    const n = normalizeSave(old);
    assert(n.stats.byCat['Area & Perimeter'].asked === 4, 'area rename');
    assert(n.stats.byCat['Vocabulary'].asked === 5 && n.stats.byCat['Vocabulary'].first === 3, 'vocab merge');
    assert(n.stats.log[0].cat === 'Area & Perimeter', 'log rename');
    assert(n.squad[0] === 'volt', 'lead from activeDragonIdx');
    assert(n.settings.grade === 4 && n.settings.dailyGoalQ === 10 && Array.isArray(n.review), 'defaults filled');
    [null, undefined, 'x', 42, [], { coins: 'abc', dragons: 'no', skills: [], settings: { grade: 99, focus: 'zzz', limitMin: -5, bedStart: 'xx' }, stats: 5, level: -3, islandIndex: -2, character: 99 }].forEach(bad => {
      const s = normalizeSave(bad);
      assert(s.settings.grade >= 2 && s.settings.grade <= 5 && s.settings.focus === 'balanced' && s.settings.limitMin >= 0, 'settings clamp');
      assert(s.level >= 1 && s.islandIndex >= 0 && s.character >= 0 && s.character < CHARACTERS.length && s.dragons.length >= 1, 'numbers clamp');
      assert(/^\d{2}:\d{2}$/.test(s.settings.bedStart), 'bedStart');
    });
    const once = normalizeSave(JSON.parse(JSON.stringify(g.state)));
    assert(JSON.stringify(normalizeSave(once)) === JSON.stringify(once), 'normalize must be idempotent');
  });
  await t('H2 progress persists to localStorage and reloads identically', () => {
    g.save();
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    const re = normalizeSave(raw);
    assert(re.qCount === g.state.qCount && re.level === g.state.level && re.dragons.length === g.state.dragons.length, 'reload mismatch');
  });
  await t('H3 time tracking adds play time to the right day', () => {
    const S = g.state.stats, dk = dayKey();
    const t0 = S.totalMs, d0 = (S.daily[dk] || {}).ms || 0;
    for (let i = 0; i < 12; i++) g.tick();
    assert(S.totalMs === t0 + 12000 && S.daily[dk].ms === d0 + 12000, 'tick accounting');
  });
  await t('H4 read-aloud text cleaner', () => {
    const c = g.cleanForSpeech('3 × 4 = ? 🐉 Add 2/5 + ___ and 9 ÷ 3 − 1');
    assert(/times/.test(c) && /equals/.test(c) && /2 over 5/.test(c) && /blank/.test(c) && /divided by/.test(c) && /minus/.test(c), c);
    assert(!/[🐉×÷−]/u.test(c), 'symbols left: ' + c);
  });

  // ------------------------------------------------------------- parent: PIN, settings, dashboard
  await t('P1 PIN setup requires 4 digits and a matching confirmation', async () => {
    g.state.stageOnIsland = 0; g.setupIslandEncounters();
    $('titleOverlay').classList.remove('hidden');
    $('btnParents').click();
    assert(vis('parentOverlay') && g.parentView === 'setup', 'setup view expected');
    let input = document.querySelector('#parentBody .pd-pin');
    input.value = '12'; document.querySelector('#parentBody .pd-go').click();
    assert(/exactly 4 digits/.test(document.querySelector('#parentBody .pd-msg').textContent), 'digit validation');
    input.value = '1234'; document.querySelector('#parentBody .pd-go').click();
    input = document.querySelector('#parentBody .pd-pin');
    assert(/again/i.test($('parentBody').textContent), 'confirm step expected');
    input.value = '9999'; document.querySelector('#parentBody .pd-go').click();
    assert(/did not match/.test($('parentBody').textContent), 'mismatch message');
    await sleep(1100);
    input = document.querySelector('#parentBody .pd-pin');
    input.value = '1234'; document.querySelector('#parentBody .pd-go').click();
    input = document.querySelector('#parentBody .pd-pin');
    input.value = '1234'; document.querySelector('#parentBody .pd-go').click();
    assert(g.parentView === 'dash' && g.getPin(), 'PIN not created');
    assert(document.querySelectorAll('.ptab').length === 5, 'tab count');
  });
  await t('P2 settings apply instantly and save', () => {
    const set = g.state.settings;
    const change = (id, v) => { const el = $(id); if (el.type === 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new Event('change')); };
    g.parentTab = 'settings'; g.renderParent();
    change('setLimit', '20'); change('setBreak', '15'); change('setGoal', '5'); change('setFocus', 'math'); change('setFocusSkill', 'div');
    assert(set.focusSkill === 'div', 'extra practice skill not saved');
    change('setRead', false); change('setMusic', false); change('setBedOn', true); change('setBedStart', '21:15'); change('setBedEnd', '06:45');
    assert(set.limitMin === 20 && set.breakMin === 15 && set.dailyGoalQ === 5 && set.focus === 'math', 'select settings');
    assert(set.music === false && set.bedtimeOn === true && set.bedStart === '21:15' && set.bedEnd === '06:45', 'toggle settings');
    assert(JSON.parse(localStorage.getItem(SAVE_KEY)).settings.limitMin === 20, 'not persisted');
    change('setGrade', '5');
    assert(set.grade === 5 && Object.values(g.state.skills).every(s => s.tier === 4), 'grade should reset all skills to tier 4');
    change('setFocusSkill', ''); change('setLimit', '0'); change('setBreak', '0'); change('setGoal', '10'); change('setFocus', 'balanced'); change('setBedOn', false); change('setGrade', '4');
    assert(set.grade === 4 && Object.values(g.state.skills).every(s => s.tier === 3), 'grade 4 -> tier 3');
  });
  await t('P3 all dashboard tabs render with real content', () => {
    const must = { overview: ['Insights', 'Math', 'English', 'Science', 'Last 7 days'], skills: ['Level', 'Multiplication'], activity: ['Last 28 days', 'Recent mistakes', 'Review queue'], settings: ['Daily play-time limit', 'Bedtime lock'], reports: ['Weekly summary', 'Share report'] };
    for (const [tab, words] of Object.entries(must)) {
      g.parentTab = tab; g.renderParent();
      const txt = $('parentBody').textContent;
      words.forEach(w => assert(txt.includes(w), `${tab} tab missing "${w}"`));
      assert(!/NaN|undefined|\[object/.test(txt), `${tab} tab has bad text`);
    }
  });
  await t('P4 report numbers match the underlying data', () => {
    const R = g.report(g.state);
    const asked = Object.values(g.state.stats.byCat).reduce((a, c) => a + c.asked, 0);
    assert(R.asked === asked && asked > 0, 'asked total');
    assert(R.pct >= 0 && R.pct <= 100, 'pct');
    assert(R.days28.length === 28 && R.days7.length === 7 && R.weeks.length === 8, 'windows');
    const todayQ = (g.state.stats.daily[dayKey()] || {}).q || 0;
    assert(R.today.q === todayQ, 'today q');
    const txt = g.buildSummaryText(g.state);
    assert(txt.includes('Math') && txt.includes('English') && txt.includes('Science') && txt.includes(g.state.name), 'summary text');
    const csv = g.buildCsv(g.state).split('\n');
    assert(csv.length === g.state.stats.log.length + 1 && csv[0].startsWith('time,subject,skill'), 'csv rows');
  });
  await t('P5 backup → read-only view round trip; print report builds', () => {
    const payload = JSON.parse(JSON.stringify(g.exportPayload(g.state)));
    assert(payload.app === 'DragonCraft' && payload.state.stats, 'payload shape');
    const ns = normalizeSave(payload.state);
    g.viewState = ns; g.viewMeta = payload.exportedAt; g.parentTab = 'overview'; g.renderParent();
    assert($('parentBody').textContent.includes('read-only') && $('parentBody').textContent.includes('exported'), 'banner should say read-only and when it was exported');
    assert(![...document.querySelectorAll('.ptab')].some(b => b.dataset.tab === 'settings'), 'settings must be hidden in read-only');
    g.viewState = null; g.renderParent();
    const realPrint = window.print; let printed = 0; window.print = () => { printed++; };
    g.printReport(g.state, g.report(g.state));
    assert($('printReport').innerHTML.includes('DragonCraft progress report') && $('printReport').innerHTML.includes('Skills'), 'print html');
    window.print = realPrint;
    $('printReport').innerHTML = '';
  });
  await t('P5b damaged / hand-edited report files never crash the viewer', () => {
    const hostile = [
      { stats: { log: [null, 5, {}, { t: 'x', cat: 7 }], byCat: { x: 5, y: { asked: 'a' } }, daily: { '2020-01-01': 'bad' }, mistakes: [null] }, settings: 'oops' },
      { stats: {}, dragons: ['nope'], skills: { a: null, b: { tier: 'x' } }, review: [{ kind: 'zzz' }, null] },
      { name: '<img src=x onerror=alert(1)>', stats: { byCat: { 'Fractions': { subj: 'Math', asked: 3, first: 9, tries: 1, ms: -5 } } } }
    ];
    hostile.forEach((h, i) => {
      g.viewState = normalizeSave(h); g.viewMeta = 'not a date';
      ['overview', 'skills', 'activity', 'reports'].forEach(tab => {
        g.parentTab = tab; g.parentView = 'dash'; g.renderParent();
        const body = $('parentBody').innerHTML;
        assert(!/<img src=x/i.test(body), 'name must be HTML-escaped');
        assert(!/NaN|undefined|\[object/.test($('parentBody').textContent), `hostile ${i} ${tab}: bad text`);
      });
    });
    g.viewState = null; g.viewMeta = null; g.parentTab = 'overview'; g.renderParent();
  });
  await t('P6 wrong PINs lock out after 5 tries (and stay locked across reloads)', () => {
    g.closeParent();
    $('btnParents').click();
    assert(g.parentView === 'login', 'login view');
    for (let i = 0; i < 5; i++) {
      const input = document.querySelector('#parentBody .pd-pin');
      input.value = '0000'; document.querySelector('#parentBody .pd-go').click();
    }
    assert(/Locked|wait/.test(document.querySelector('#parentBody .pd-msg').textContent), 'no lockout message: ' + document.querySelector('#parentBody .pd-msg').textContent);
    const input = document.querySelector('#parentBody .pd-pin');
    input.value = '1234'; document.querySelector('#parentBody .pd-go').click();
    assert(g.parentView === 'login' && /wait/.test(document.querySelector('#parentBody .pd-msg').textContent), 'correct PIN must be refused while locked');
    assert(g.getLockUntil() > Date.now(), 'lock not persisted');
    g.setLockUntil(0);
    const i2 = document.querySelector('#parentBody .pd-pin');
    i2.value = '1234'; document.querySelector('#parentBody .pd-go').click();
    assert(g.parentView === 'dash', 'should unlock with correct PIN after lockout expires');
    g.closeParent();
  });

  // ------------------------------------------------------------- locks
  await t('L1 daily limit locks the game; parent PIN adds time', () => {
    $('titleOverlay').classList.add('hidden');
    const S = g.state.stats, dk = dayKey(), set = g.state.settings;
    set.limitMin = 1; (S.daily[dk] || (S.daily[dk] = { ms: 0, q: 0, first: 0 })).ms = 61000;
    assert(g.checkLocks(false) === true && vis('lockOverlay') && g.lockKind === 'limit', 'limit lock expected');
    assert($('lockText').textContent.includes('1 minutes') || $('lockText').textContent.includes('1 minute'), 'lock text');
    document.querySelector('#lockActions .pd-btn').click();
    const pin = document.querySelector('#lockActions .pd-pin');
    pin.value = '0000'; document.querySelector('#lockActions .pd-go').click();
    assert(vis('lockOverlay') && /Wrong/.test(document.querySelector('#lockActions .pd-msg').textContent), 'wrong PIN should not unlock');
    pin.value = '1234'; document.querySelector('#lockActions .pd-go').click();
    const add = [...document.querySelectorAll('#lockActions .pd-btn')].find(b => b.textContent === '+15 min');
    assert(add, 'extension buttons missing');
    add.click();
    assert(!vis('lockOverlay') && S.extra[dk] === 15 * 60000, 'time not added');
    assert(g.checkLocks(false) === false, 'should be unlocked now');
    set.limitMin = 0;
  });
  await t('L2 bedtime locks during the window and can be overridden', () => {
    const set = g.state.settings, now = new Date();
    const hm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const a = new Date(now.getTime() - 3600000), b = new Date(now.getTime() + 3600000);
    set.bedtimeOn = true; set.bedStart = hm(a); set.bedEnd = hm(b);
    assert(g.inBedtime(now) === true, 'now should be inside the window');
    assert(g.checkLocks(false) === true && g.lockKind === 'bedtime', 'bedtime lock expected');
    document.querySelector('#lockActions .pd-btn').click();
    const pin = document.querySelector('#lockActions .pd-pin'); pin.value = '1234'; document.querySelector('#lockActions .pd-go').click();
    [...document.querySelectorAll('#lockActions .pd-btn')].find(x => x.textContent.includes('+30')).click();
    assert(!vis('lockOverlay') && g.checkLocks(false) === false, 'override failed');
    // window crossing midnight
    set.bedStart = '22:00'; set.bedEnd = '07:00';
    const at = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };
    assert(g.inBedtime(at(23, 30)) && g.inBedtime(at(3, 0)) && !g.inBedtime(at(12, 0)) && !g.inBedtime(at(7, 0)) && g.inBedtime(at(22, 0)), 'overnight window logic');
    set.bedtimeOn = false; g.bedOverrideUntil = 0;
  });
  await t('L3 break reminder shows a 60s countdown, then lets the child continue', async () => {
    const set = g.state.settings;
    set.breakMin = 1; g.sinceBreakMs = 61000;
    assert(g.checkLocks(false) === true && g.lockKind === 'break', 'break lock expected');
    const go = [...document.querySelectorAll('#lockActions .pd-btn')][0];
    assert(go.disabled && !$('lockCountdown').classList.contains('hidden'), 'button should be disabled during the countdown');
    await sleep(61500);
    assert(!go.disabled, 'button should enable after the countdown');
    go.click();
    assert(!vis('lockOverlay') && g.sinceBreakMs === 0, 'break did not end');
    set.breakMin = 0;
  });
  await t('L4 parents can still open the dashboard while a lock is active', () => {
    const S = g.state.stats, dk = dayKey(), set = g.state.settings;
    set.limitMin = 1; S.daily[dk].ms = 999999; S.extra[dk] = 0;
    assert(g.checkLocks(false) === true, 'locked');
    document.querySelector('#lockActions .pd-btn').click();
    const pin = document.querySelector('#lockActions .pd-pin'); pin.value = '1234'; document.querySelector('#lockActions .pd-go').click();
    [...document.querySelectorAll('#lockActions .pd-btn')].find(x => x.textContent === 'Open dashboard').click();
    assert(vis('parentOverlay') && !vis('lockOverlay') && g.parentView === 'dash', 'dashboard should open');
    g.tick(); g.tick();
    assert(!vis('lockOverlay'), 'lock must not cover the dashboard');
    g.state.settings.limitMin = 0;
    g.closeParent();
    assert(!vis('lockOverlay'), 'no lock once the limit is removed');
  });

  // ------------------------------------------------------------- misc
  await t('M1 title screen reflects returning player', () => {
    g.refreshTitle();
    assert($('welcomeBack').textContent.startsWith('Welcome back'), $('welcomeBack').textContent);
  });
  await t('M2 goal pill shows progress and completes the daily goal once', () => {
    const set = g.state.settings, dk = dayKey();
    set.dailyGoalQ = 3;
    g.state.stats.daily[dk] = { ms: 0, q: 0, first: 0 };
    const coins0 = g.state.coins;
    for (let i = 0; i < 4; i++) {
      g.activeChallenge = { cat: 'Division', subj: 'Math', kind: 'div', tier: 3, seed: 5000 + i, recorded: false, prompt: 'p', correct: '1', choices: ['1', '2', '3'] };
      g.qWrong = 0; g.qStart = performance.now(); g.recordAnswer(false);
    }
    assert(g.state.stats.daily[dk].goal === 1, 'goal flag');
    assert($('goalText').textContent.includes('3 / 3'), 'pill: ' + $('goalText').textContent);
    assert(g.state.coins - coins0 >= 100 && g.state.coins - coins0 < 400, 'bonus once only: +' + (g.state.coins - coins0));
    assert(g.state.achievements.goal_day, 'goal badge');
    set.dailyGoalQ = 10;
  });
  await t('M3 music/sound controls', () => {
    const before = g.state.settings.music;
    $('btnMusic').click();
    assert(g.state.settings.music === !before && sfx.musicEnabled === !before, 'music toggle');
    $('btnMusic').click();
    sfx.stopMusic();
    assert(sfx.musicTimer === null, 'music timer should stop');
  });
  await t('Z1 no JavaScript errors or generator warnings during the whole run', () => {
    assert(jsErrors.length === 0, jsErrors.slice(0, 5).join(' || '));
    assert(typeof QUESTION_FAILURES === 'number' && QUESTION_FAILURES === 0, 'QUESTION_FAILURES=' + QUESTION_FAILURES);
  });

  const out = JSON.stringify(results);
  document.title = 'E2E:' + btoa(unescape(encodeURIComponent(out)));
});
