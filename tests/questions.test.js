// Run with:  node tests/questions.test.js
// Verifies the question engine: every math answer is re-computed independently,
// choices are valid, diagrams draw, seeds are deterministic, spelling items are
// checked against the system dictionary (if available), and banks are well-formed.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'questions.js'), 'utf8') +
  '\n;globalThis.__Q = { GENERATORS, KIND_META, BANK, ALL_KINDS, MATH_KINDS, SCIENCE_KINDS, ENGLISH_KINDS, buildChallenge, validateChallenge, seedRng, LEGACY_CATS, fmtN, gcd, get failures() { return QUESTION_FAILURES; } };';
const ctxObj = { console, Math, Set, Map, Array, Object, String, Number, JSON, Proxy };
vm.createContext(ctxObj);
vm.runInContext(src, ctxObj);
const Q = ctxObj.__Q;

let failures = 0, warnings = 0;
const fail = m => { failures++; if (failures <= 40) console.log('  ✗ FAIL:', m); };
const warn = m => { warnings++; console.log('  ! warn:', m); };
const num = s => Number(String(s).replace(/,/g, ''));

function mockCtx() {
  const calls = [];
  const target = { measureText: t => ({ width: String(t).length * 9 }) };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === '__calls') return calls;
      return (...a) => { calls.push(k); return (k === 'createRadialGradient' || k === 'createLinearGradient') ? { addColorStop() {} } : undefined; };
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

function verify(ch, tag) {
  const m = ch.meta || {};
  const exp = (v, why) => { if (String(ch.correct).replace(/,/g, '') !== String(v)) fail(`${tag}: ${why} expected ${v} but correct=${ch.correct} | ${ch.prompt}`); };
  switch (m.op) {
    case 'mult': exp(m.a * m.b, 'mult'); break;
    case 'div': exp(m.ask === 'rem' ? m.total % m.n : Math.floor(m.total / m.n), 'div'); break;
    case 'add': exp(m.a + m.b, 'add'); break;
    case 'sub': exp(m.a - m.b, 'sub'); if (m.a - m.b <= 0) fail(`${tag}: non-positive subtraction`); break;
    case 'multi': exp(m.A + m.B - m.C, 'multi'); if (m.A + m.B - m.C <= 0) fail(`${tag}: multi non-positive`); break;
    case 'algebra': {
      const total = m.sub ? m.m * m.egg - m.extra : m.m * m.egg + m.extra;
      if (total <= 0) fail(`${tag}: algebra non-positive total`);
      if (!ch.prompt.includes(`= ${total}.`)) fail(`${tag}: algebra prompt total mismatch ${ch.prompt}`);
      exp(m.egg, 'algebra'); break;
    }
    case 'frac_id': if (ch.correct !== `${m.k}/${m.d}`) fail(`${tag}: frac_id`); break;
    case 'frac_add': if (ch.correct !== `${m.a + m.b}/${m.d}`) fail(`${tag}: frac_add`); if (m.a + m.b > m.d) fail(`${tag}: frac_add over 1`); break;
    case 'frac_max': {
      const best = m.fr.reduce((a, b) => (b.n * a.d > a.n * b.d ? b : a));
      if (ch.correct !== `${best.n}/${best.d}`) fail(`${tag}: frac_max`);
      break;
    }
    case 'frac_eq': exp(m.k * m.f, 'frac_eq'); if (m.n * m.f !== m.m) fail(`${tag}: frac_eq denominators`); break;
    case 'frac_add2': case 'frac_sub2': {
      const f = m.D / m.d1;
      const n = m.op === 'frac_add2' ? m.a * f + m.b : m.a * f - m.b;
      if (ch.correct !== `${n}/${m.D}`) fail(`${tag}: ${m.op} ${ch.correct} vs ${n}/${m.D}`);
      if (n <= 0 || n >= m.D || Q.gcd(n, m.D) !== 1) fail(`${tag}: ${m.op} not lowest terms/in range`);
      break;
    }
    case 'area': exp(m.w * m.h, 'area'); break;
    case 'perim': exp(2 * (m.w + m.h), 'perim'); break;
    case 'miss_area': exp(m.h, 'miss_area'); break;
    case 'miss_perim': exp(m.h, 'miss_perim'); if (!ch.prompt.includes(`${2 * (m.w + m.h)} m of fence`)) fail(`${tag}: miss_perim prompt`); break;
    case 'digit_value': exp(m.ans, 'digit_value'); if (!ch.prompt.includes(`${m.n}`)) fail(`${tag}: digit prompt`); break;
    case 'round': {
      exp(m.ans, 'round'); if (m.ans % m.unit !== 0) fail(`${tag}: round not multiple`);
      if (Math.abs(m.n - m.ans) > m.unit / 2) fail(`${tag}: rounded too far`);
      break;
    }
    case 'place_shift': exp(m.ans, 'place_shift'); break;
    case 'expanded': exp(m.ans, 'expanded'); break;
    case 'clock': {
      const t = `${m.h}:${String(m.m).padStart(2, '0')}`;
      if (ch.correct !== t) fail(`${tag}: clock ${ch.correct} vs ${t}`);
      break;
    }
    case 'elapsed': {
      const tot = m.h * 60 + m.m + m.delta; const H = ((Math.floor(tot / 60) - 1) % 12 + 12) % 12 + 1; const M = tot % 60;
      if (ch.correct !== `${H}:${String(M).padStart(2, '0')}`) fail(`${tag}: elapsed`);
      break;
    }
    case 'pattern': {
      exp(m.terms[m.missing], 'pattern');
      if (m.terms.some(x => !Number.isInteger(x) || x < 0)) fail(`${tag}: pattern term invalid ${m.terms}`);
      break;
    }
    case 'circuit': if (ch.correct.startsWith('Yes') !== m.closed) fail(`${tag}: circuit logic`); break;
    default:
      if (m.bank) {
        const row = Q.BANK[m.kind][m.idx];
        if (ch.correct !== row.a) fail(`${tag}: bank answer mismatch`);
      }
  }
  // exactly one choice may equal the correct answer by value
  const cs = ch.choices;
  if (cs.every(c => /^\d+\/\d+$/.test(c))) {
    const eq = cs.filter(c => { const [a, b] = c.split('/').map(Number), [x, y] = ch.correct.split('/').map(Number); return a * y === x * b; });
    if (eq.length !== 1) fail(`${tag}: equivalent fractions among choices ${cs} (correct ${ch.correct})`);
  }
}

console.log('1) Generating & verifying math questions (every kind × tier × 400 seeds)...');
let made = 0;
const sample = {};
for (const kind of Q.ALL_KINDS) {
  for (let tier = 1; tier <= 5; tier++) {
    const prompts = new Set();
    for (let seed = 1; seed <= 400; seed++) {
      Q.seedRng(seed * 7919 + tier);
      let ch;
      try { ch = Q.GENERATORS[kind](tier); } catch (e) { fail(`${kind} t${tier} seed ${seed} threw: ${e.message}`); continue; }
      const tag = `${kind} t${tier} seed ${seed}`;
      if (!Q.validateChallenge(ch)) { fail(`${tag}: invalid challenge ${JSON.stringify({ p: ch.prompt, c: ch.choices, a: ch.correct })}`); continue; }
      verify(ch, tag);
      try { const c = mockCtx(); ch.draw(c); if (!c.__calls.length) fail(`${tag}: diagram drew nothing`); } catch (e) { fail(`${tag}: draw threw ${e.message}`); }
      prompts.add(ch.prompt + '|' + ch.passage + '|' + ch.correct + '|' + [...ch.choices].sort().join(','));
      made++;
    }
    sample[`${kind}.${tier}`] = prompts.size;
  }
}
console.log(`   checked ${made} questions`);

console.log('2) Determinism (same seed → identical question)...');
for (const kind of Q.ALL_KINDS) {
  for (let tier = 1; tier <= 5; tier++) {
    for (let seed = 1; seed <= 25; seed++) {
      const a = Q.buildChallenge({ kind, tier, seed }), b = Q.buildChallenge({ kind, tier, seed });
      if (a.prompt !== b.prompt || a.correct !== b.correct || JSON.stringify(a.choices) !== JSON.stringify(b.choices) || a.passage !== b.passage) fail(`not deterministic: ${kind} t${tier} seed ${seed}`);
      const c = Q.buildChallenge({ kind, tier, seed: a.seed });
      if (c.prompt !== a.prompt || JSON.stringify(c.choices) !== JSON.stringify(a.choices)) fail(`seed round-trip differs: ${kind} t${tier} seed ${seed}`);
    }
  }
}
if (Q.failures > 0) fail(`buildChallenge hit ${Q.failures} generator failures (invalid/throwing)`);

console.log('3) Word banks...');
let dict = null;
try { dict = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').toLowerCase().split('\n')); } catch (e) { warn('no system dictionary — spelling words not machine-checked'); }
let bankCount = 0;
for (const [kind, rows] of Object.entries(Q.BANK)) {
  const seen = new Set();
  rows.forEach((r, i) => {
    bankCount++;
    const tag = `${kind}[${i}] "${r.q.slice(0, 40)}"`;
    if (!Number.isInteger(r.d) || r.d < 1 || r.d > 5) fail(`${tag}: bad difficulty`);
    if (![r.q, r.h, r.a, r.w1, r.w2].every(x => typeof x === 'string' && x.trim())) fail(`${tag}: empty field`);
    if (new Set([r.a, r.w1, r.w2]).size !== 3) fail(`${tag}: duplicate choices`);
    if (kind === 'reading' && !r.passage) fail(`${tag}: reading item without passage`);
    if (kind === 'reading' && r.passage.split(/[.!?]/).filter(Boolean).length < 2) fail(`${tag}: passage too short`);
    const key = r.q + '|' + r.big + '|' + r.passage + '|' + r.a;
    if (seen.has(key)) fail(`${tag}: duplicate item`); seen.add(key);
    if (/NaN|undefined/.test(JSON.stringify(r))) fail(`${tag}: bad text`);
    if (kind === 'spelling' && dict) {
      if (!dict.has(r.a.toLowerCase())) fail(`${tag}: correct spelling "${r.a}" NOT in dictionary`);
      for (const w of [r.w1, r.w2]) if (dict.has(w.toLowerCase())) fail(`${tag}: wrong spelling "${w}" IS a dictionary word`);
    }
  });
  for (let t = 1; t <= 5; t++) {
    const near = rows.filter(r => Math.abs(r.d - t) <= 1).length;
    if (near < 2) warn(`bank "${kind}" has only ${near} items near tier ${t}`);
  }
}
console.log(`   ${bankCount} bank items checked`);

console.log('4) Answer position is not predictable...');
const pos = [0, 0, 0]; let n = 0;
for (const kind of Q.ALL_KINDS) {
  for (let seed = 1; seed <= 300; seed++) {
    const ch = Q.buildChallenge({ kind, tier: 1 + (seed % 5), seed: seed * 31 });
    pos[ch.choices.indexOf(ch.correct)]++; n++;
  }
}
pos.forEach((p, i) => { const pct = p / n; if (pct < 0.27 || pct > 0.40) fail(`correct answer lands in slot ${i + 1} ${Math.round(pct * 100)}% of the time`); });
console.log(`   slot distribution: ${pos.map(p => Math.round((p / n) * 100) + '%').join(' / ')}`);

console.log('5) Variety (unique questions out of 400 seeds per tier)...');
for (const kind of Q.ALL_KINDS) console.log(`   ${kind.padEnd(10)} tiers 1-5: ${[1, 2, 3, 4, 5].map(t => sample[`${kind}.${t}`]).join(' / ')}`);

console.log(failures ? `\n✗ ${failures} FAILURES, ${warnings} warnings` : `\n✓ ALL QUESTION TESTS PASSED (${warnings} warnings)`);
process.exit(failures ? 1 : 0);
