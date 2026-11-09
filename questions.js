// ============================================================================
// DRAGONCRAFT QUESTION ENGINE
//  - Seeded: the same (kind, tier, seed) always rebuilds the SAME question, so a
//    missed question can be re-asked later (spaced review).
//  - Tiered: every skill has 5 difficulty tiers (1 ≈ Grade 2 ... 5 ≈ Grade 6).
//  - Self-checking: every challenge is validated (3 distinct choices, correct
//    answer present, no NaN/undefined text). Invalid ones are rebuilt.
// Pure logic + canvas drawing only (no DOM), so it can be tested in Node.
// ============================================================================

// ---------- seeded random ----------
let _rng = Math.random;
function seedRng(seed) {
  let a = (seed >>> 0) || 1;
  _rng = function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randomSeed() { return (Math.random() * 4294967296) >>> 0; }
function rand(min, max) { return Math.floor(_rng() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function fmtN(n) { return Number(n).toLocaleString('en-US'); }

// ---------- answer-choice builders ----------
function numChoices(correct, extras = [], opts = {}) {
  const min = opts.min !== undefined ? opts.min : 0;
  const spread = opts.spread || 5;
  const step = opts.step || 1;
  const fmt = opts.fmt || String;
  const set = new Set([correct]);
  for (const e of shuffle(extras)) {
    if (set.size >= 3) break;
    if (Number.isInteger(e) && e >= min && !set.has(e)) set.add(e);
  }
  let guard = 0;
  while (set.size < 3 && guard++ < 300) {
    const v = correct + rand(1, spread) * step * (rand(0, 1) ? 1 : -1);
    if (v >= min && !set.has(v)) set.add(v);
  }
  let v = correct + step;
  while (set.size < 3) { if (!set.has(v)) set.add(v); v += step; }
  return shuffle([...set].map(fmt));
}

function parseFrac(s) { const [n, d] = String(s).split('/').map(Number); return { n, d }; }
function fracEq(a, b) { const x = parseFrac(a), y = parseFrac(b); return x.n * y.d === y.n * x.d; }
function fracChoices(correct, cands) {
  const out = [correct];
  const ok = c => /^\d+\/\d+$/.test(c) && parseFrac(c).n > 0 && parseFrac(c).d > 0 && !out.includes(c) && !fracEq(c, correct);
  for (const c of shuffle(cands)) { if (out.length >= 3) break; if (ok(c)) out.push(c); }
  for (let d = 2; out.length < 3 && d <= 12; d++) {
    for (let n = 1; out.length < 3 && n <= d; n++) { const c = `${n}/${d}`; if (ok(c)) out.push(c); }
  }
  return shuffle(out);
}
function timeChoices(correct, cands) {
  const out = [correct];
  for (const c of shuffle(cands)) { if (out.length >= 3) break; if (!out.includes(c)) out.push(c); }
  for (let h = 1; out.length < 3 && h <= 12; h++) { const c = fmtTime(h, 0); if (!out.includes(c)) out.push(c); }
  return shuffle(out);
}

// ---------- diagram drawing (canvas logical size 540 x 150) ----------
const DW = 540, DH = 150;
function dgFrame(ctx) { ctx.clearRect(0, 0, DW, DH); }
function dgText(ctx, text, x, y, size, color, align = 'center', weight = '900') {
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(String(text), x, y);
}
function dgFit(ctx, text, x, y, maxW, size, color, weight = '900') {
  let s = size;
  ctx.font = `${weight} ${s}px sans-serif`;
  while (s > 12 && ctx.measureText(String(text)).width > maxW) { s -= 2; ctx.font = `${weight} ${s}px sans-serif`; }
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(String(text), x, y);
}
function dgWrap(ctx, text, cx, cy, maxW, startSize, color) {
  const words = String(text).split(' ');
  let size = startSize, lines = [];
  for (; size >= 14; size -= 2) {
    ctx.font = `900 ${size}px sans-serif`;
    lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    lines.push(line);
    if (lines.length * size * 1.25 <= 118 && lines.every(l => ctx.measureText(l).width <= maxW)) break;
  }
  const lh = size * 1.25;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  lines.forEach((l, i) => ctx.fillText(l, cx, cy - ((lines.length - 1) * lh) / 2 + i * lh + size * 0.35));
}
function drawBig(ctx, text, fallbackIcon) {
  dgFrame(ctx);
  dgWrap(ctx, text || fallbackIcon, DW / 2, 70, 490, 36, '#ffd166');
  ctx.fillStyle = '#9b5de5';
  ctx.fillRect(170, 130, 200, 5);
}
function drawArray(ctx, rows, cols) {
  dgFrame(ctx);
  const gap = 6;
  const cell = Math.max(8, Math.floor(Math.min(26, (130 - gap * (rows - 1)) / rows, (500 - gap * (cols - 1)) / cols)));
  const w = cols * cell + (cols - 1) * gap, h = rows * cell + (rows - 1) * gap;
  const sx = (DW - w) / 2, sy = (DH - h) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = '#06d6a0';
      ctx.fillRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + c * (cell + gap), sy + r * (cell + gap), cell, cell);
    }
  }
}
function drawAreaModel(ctx, tens, ones, b) {
  dgFrame(ctx);
  const total = 440;
  const tw = Math.max(110, Math.min(total - 70, total * tens / (tens + ones)));
  const ow = total - tw;
  const x0 = 70, y0 = 40, h = 70;
  ctx.fillStyle = '#00bbf9'; ctx.fillRect(x0, y0, tw, h);
  ctx.fillStyle = '#9b5de5'; ctx.fillRect(x0 + tw, y0, ow, h);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.strokeRect(x0, y0, tw, h); ctx.strokeRect(x0 + tw, y0, ow, h);
  dgText(ctx, tens, x0 + tw / 2, 30, 20, '#ffd166');
  dgText(ctx, ones, x0 + tw + ow / 2, 30, 20, '#ffd166');
  dgText(ctx, b, 45, y0 + h / 2 + 8, 22, '#ffd166');
  dgFit(ctx, `${tens} × ${b}`, x0 + tw / 2, y0 + h / 2 + 8, tw - 10, 22, '#04141f');
  dgFit(ctx, `${ones} × ${b}`, x0 + tw + ow / 2, y0 + h / 2 + 8, ow - 10, 20, '#ffffff');
  dgText(ctx, 'Split the big number into tens + ones!', DW / 2, 138, 14, '#b8c7f0', 'center', '800');
}
function drawShare(ctx, total, n) {
  dgFrame(ctx);
  if (total <= 40) {
    const perRow = 10;
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / perRow), c = i % perRow;
      const rows = Math.ceil(total / perRow);
      ctx.fillStyle = '#ffe8a3';
      ctx.beginPath();
      ctx.ellipse(32 + c * 21, 75 - ((rows - 1) * 22) / 2 + r * 22, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    dgText(ctx, `🥚 ${total}`, 120, 85, 40, '#ffe8a3');
  }
  dgText(ctx, '➜', 262, 82, 30, '#ffd166');
  const gap = 8;
  const bw = Math.min(52, (240 - gap * (n - 1)) / n);
  const sx = 290 + (240 - (n * bw + (n - 1) * gap)) / 2;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = '#7a4a1e';
    ctx.fillRect(sx + i * (bw + gap), 52, bw, 46);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.strokeRect(sx + i * (bw + gap), 52, bw, 46);
    dgText(ctx, '?', sx + i * (bw + gap) + bw / 2, 84, 24, '#ffffff');
  }
  dgText(ctx, `${n} nests`, 410, 124, 15, '#b8c7f0', 'center', '800');
}
function drawBarModel(ctx, wholeLabel, parts) {
  dgFrame(ctx);
  const total = 440, x0 = 50;
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x0, 26, total, 36);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x0, 26, total, 36);
  dgText(ctx, wholeLabel, x0 + total / 2, 52, 24, '#2b1400');
  const sum = parts.reduce((a, p) => a + p.v, 0) || 1;
  let w1 = Math.max(80, Math.min(total - 80, total * parts[0].v / sum));
  const ws = [w1, total - w1];
  let x = x0;
  parts.forEach((p, i) => {
    ctx.fillStyle = p.unknown ? '#ef476f' : (i === 0 ? '#00bbf9' : '#9b5de5');
    ctx.fillRect(x, 86, ws[i], 36);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(x, 86, ws[i], 36);
    dgText(ctx, p.label, x + ws[i] / 2, 112, 22, '#ffffff');
    x += ws[i];
  });
  dgText(ctx, 'The top bar is the TOTAL. The bottom bars are its PARTS.', DW / 2, 142, 13, '#b8c7f0', 'center', '800');
}
function drawBalance(ctx, m, op, extra, total) {
  dgFrame(ctx);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(50, 100); ctx.lineTo(490, 100); ctx.stroke();
  ctx.fillStyle = '#9b5de5';
  ctx.beginPath(); ctx.moveTo(270, 100); ctx.lineTo(250, 138); ctx.lineTo(290, 138); ctx.closePath(); ctx.fill();
  const eggs = m === 1 ? '🥚' : (m <= 5 ? '🥚'.repeat(m) : `${m} × 🥚`);
  dgFit(ctx, `${eggs}  ${op}  [${extra}]`, 160, 78, 230, 24, '#ffffff');
  dgText(ctx, '=', 270, 80, 26, '#ffd166');
  ctx.fillStyle = '#06d6a0'; ctx.fillRect(345, 46, 100, 46);
  dgText(ctx, total, 395, 80, 26, '#04241b');
}
function fracBar(ctx, x, y, w, h, parts, shaded, color) {
  const pw = w / parts;
  for (let i = 0; i < parts; i++) {
    ctx.fillStyle = i < shaded ? color : '#182246';
    ctx.fillRect(x + i * pw, y, pw, h);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(x + i * pw, y, pw, h);
  }
}
function fracPie(ctx, cx, cy, r, parts, shaded, color) {
  for (let i = 0; i < parts; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2 + (i * 2 * Math.PI) / parts, -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / parts);
    ctx.closePath();
    ctx.fillStyle = i < shaded ? color : '#182246';
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.stroke();
  }
}
function drawGrid(ctx, w, h) {
  dgFrame(ctx);
  const s = Math.floor(Math.min(22, 100 / h, 440 / w));
  const sx = (DW - w * s) / 2, sy = (DH - h * s) / 2 + 8;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffd166' : '#f4a261';
      ctx.fillRect(sx + c * s, sy + r * s, s - 2, s - 2);
    }
  }
  dgText(ctx, `Length: ${w} blocks`, DW / 2, sy - 8, 16, '#06d6a0');
  dgText(ctx, `Width: ${h}`, sx - 46, sy + (h * s) / 2 + 5, 16, '#06d6a0');
}
function drawRectLabeled(ctx, w, h, top, left, inside) {
  dgFrame(ctx);
  const sc = Math.min(330 / w, 84 / h);
  const rw = w * sc, rh = h * sc;
  const x0 = (DW - rw) / 2, y0 = (DH - rh) / 2 + 6;
  ctx.fillStyle = '#1d4e89'; ctx.fillRect(x0, y0, rw, rh);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, rw, rh);
  dgText(ctx, top, DW / 2, y0 - 8, 20, '#06d6a0');
  dgText(ctx, left, x0 - 28, y0 + rh / 2 + 7, 20, '#06d6a0');
  if (inside) dgFit(ctx, inside, DW / 2, y0 + rh / 2 + 7, rw - 12, 20, '#ffffff');
}
function drawPlaceChart(ctx, heads, digits, hi) {
  dgFrame(ctx);
  const n = heads.length, w = Math.min(110, 440 / n), x0 = (DW - n * w) / 2;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i === hi ? '#ffd166' : '#1d2b5a';
    ctx.fillRect(x0 + i * w + 3, 22, w - 6, 100);
    dgText(ctx, heads[i], x0 + i * w + w / 2, 42, 14, i === hi ? '#2b1400' : '#b8c7f0', 'center', '800');
    dgText(ctx, digits[i], x0 + i * w + w / 2, 100, 48, i === hi ? '#2b1400' : '#ffffff');
  }
}
function drawNumberLine(ctx, lo, hi, n) {
  dgFrame(ctx);
  const x0 = 60, x1 = 480, y = 82;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  const mid = (lo + hi) / 2;
  [[lo, x0], [mid, (x0 + x1) / 2], [hi, x1]].forEach(([v, x]) => {
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke();
    dgText(ctx, fmtN(v), x, y + 38, 18, v === mid ? '#8ea0d6' : '#06d6a0');
  });
  const px = x0 + ((n - lo) / (hi - lo)) * (x1 - x0);
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(px, y, 10, 0, Math.PI * 2); ctx.fill();
  dgText(ctx, fmtN(n), px, y - 22, 22, '#ffd166');
}
function drawSequence(ctx, terms, missing) {
  dgFrame(ctx);
  const n = terms.length, bw = Math.min(78, 490 / n - 10), gap = 10;
  const sx = (DW - (n * bw + (n - 1) * gap)) / 2;
  terms.forEach((t, i) => {
    const x = sx + i * (bw + gap);
    ctx.fillStyle = i === missing ? '#ef476f' : '#1d4e89';
    ctx.fillRect(x, 48, bw, 54);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(x, 48, bw, 54);
    dgFit(ctx, i === missing ? '?' : fmtN(t), x + bw / 2, 84, bw - 8, 26, '#ffffff');
  });
  dgText(ctx, 'Find the rule, then find the mystery number!', DW / 2, 132, 14, '#b8c7f0', 'center', '800');
}
function drawClock(ctx, h, m, caption) {
  dgFrame(ctx);
  const cx = DW / 2, cy = 76, r = 64;
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30, big = i % 5 === 0;
    ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = big ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * (r - (big ? 10 : 5)), cy - Math.cos(a) * (r - (big ? 10 : 5)));
    ctx.lineTo(cx + Math.sin(a) * (r - 2), cy - Math.cos(a) * (r - 2));
    ctx.stroke();
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6;
    dgText(ctx, i, cx + Math.sin(a) * (r - 22), cy - Math.cos(a) * (r - 22) + 5, 14, '#2b2d42');
  }
  const ha = ((h % 12) + m / 60) * (Math.PI / 6), ma = m * (Math.PI / 30);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7209b7'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ha) * 32, cy - Math.cos(ha) * 32); ctx.stroke();
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ma) * 50, cy - Math.cos(ma) * 50); ctx.stroke();
  ctx.fillStyle = '#2b2d42';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'butt';
  if (caption) dgText(ctx, caption, 440, 80, 16, '#b8c7f0', 'center', '800');
}
function drawCircuit(ctx, closed) {
  dgFrame(ctx);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const L = 150, R = 400, T = 40, B = 110;
  ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R, T + 20); ctx.lineTo(R, B); ctx.stroke();
  if (closed) {
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(R, T); ctx.lineTo(R, T + 20); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(250, T); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(310, T); ctx.lineTo(R, T); ctx.lineTo(R, T + 20); ctx.stroke();
    dgText(ctx, '✂️', 280, T + 6, 20, '#ef476f');
  }
  ctx.lineCap = 'butt';
  // the battery sits ON the left wire so the loop is truly complete
  ctx.fillStyle = '#0b1022'; ctx.fillRect(L - 21, 56, 42, 46);
  dgText(ctx, '🔋', L, 92, 32, '#ffd166');
  ctx.fillStyle = closed ? '#ffee32' : '#334155';
  ctx.beginPath(); ctx.arc(R, 70, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = closed ? '#fff3a0' : '#64748b'; ctx.lineWidth = 3; ctx.stroke();
  if (closed) {
    ctx.strokeStyle = '#ffee32'; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(R + Math.cos(a) * 28, 70 + Math.sin(a) * 28);
      ctx.lineTo(R + Math.cos(a) * 38, 70 + Math.sin(a) * 38);
      ctx.stroke();
    }
  }
  dgText(ctx, '💡 Lamp', 470, 126, 15, '#b8c7f0', 'center', '800');
}

// ---------- helpers for time ----------
function fmtTime(h, m) {
  const hh = ((((h - 1) % 12) + 12) % 12) + 1;
  return `${hh}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
}

// ============================================================================
// MATH GENERATORS (tier 1..5)
// ============================================================================
function genMult(t) {
  if (t <= 3) {
    const rg = t === 1 ? [2, 3, 2, 5] : t === 2 ? [2, 5, 3, 6] : [3, 9, 3, 9];
    const rows = rand(rg[0], rg[1]), cols = rand(rg[2], rg[3]);
    const ans = rows * cols;
    return {
      topic: '⚡ VOXEL POWER ARRAY',
      prompt: `Count the Dragon Energy Cubes: ${rows} rows of ${cols} cubes! (${rows} × ${cols} = ?)`,
      hint: `Add the ${rows} rows together: ${Array(rows).fill(cols).join(' + ')} = ${ans}!`,
      correct: String(ans),
      choices: numChoices(ans, [ans + rows, ans - rows, ans + cols, ans - cols, rows + cols], { min: 1 }),
      draw: ctx => drawArray(ctx, rows, cols),
      meta: { op: 'mult', a: rows, b: cols }
    };
  }
  let a;
  do { a = t === 4 ? rand(12, 25) : rand(26, 59); } while (a % 10 === 0);
  const b = t === 4 ? rand(2, 6) : rand(3, 9);
  const tens = a - (a % 10), ones = a % 10, ans = a * b;
  return {
    topic: '⚡ VOXEL POWER ARRAY',
    prompt: `A trainer packs ${b} bags with ${a} dragon gems in each bag. How many gems in all? (${a} × ${b} = ?)`,
    hint: `Split ${a} into ${tens} + ${ones}: ${tens} × ${b} = ${tens * b} and ${ones} × ${b} = ${ones * b}. Add them: ${tens * b} + ${ones * b} = ${ans}!`,
    correct: String(ans),
    choices: numChoices(ans, [ans + 10, ans - 10, tens * b + ones, ans + b, ans - b, a + b], { min: 1, spread: 12 }),
    draw: ctx => drawAreaModel(ctx, tens, ones, b),
    meta: { op: 'mult', a, b }
  };
}

function genDiv(t) {
  let n, q, r = 0;
  if (t === 1) { n = rand(2, 5); q = rand(2, 5); }
  else if (t === 2) { n = rand(2, 6); q = rand(3, 8); }
  else if (t === 3) { n = rand(3, 9); q = rand(3, 9); }
  else if (t === 4) { n = rand(3, 9); q = rand(10, Math.min(25, Math.floor(99 / n))); }
  else { n = rand(3, 9); q = rand(4, 12); r = rand(1, n - 1); }
  const total = n * q + r;
  const askRem = r > 0 && rand(0, 1) === 1;
  let prompt, hint, ans, choices;
  if (askRem) {
    prompt = `${total} dragon eggs are shared equally among ${n} nests. How many eggs are LEFT OVER?`;
    hint = `${n} × ${q} = ${n * q} is the biggest times-table fact that does not go over ${total}. Then ${total} − ${n * q} = ${r} eggs are left over!`;
    ans = r;
    choices = numChoices(r, [r + 1, r - 1, n - r, q, 0], { min: 0, spread: 3 });
  } else {
    prompt = r > 0
      ? `${total} dragon eggs are shared equally among ${n} nests, with a few left over. How many eggs does each nest get?`
      : `${total} dragon eggs are shared equally among ${n} nests. How many eggs are in each nest? (${total} ÷ ${n} = ?)`;
    hint = r > 0
      ? `Think: ${n} × ${q} = ${n * q}. That is the most we can share equally, so each nest gets ${q} (and ${r} are left over).`
      : `Think of it backwards: ${n} × ${q} = ${total}, so ${total} ÷ ${n} = ${q}!`;
    ans = q;
    choices = numChoices(q, [q + 1, q - 1, q + 2, q - 2, n], { min: 1 });
  }
  return {
    topic: '🥚 DRAGON EGG NESTS',
    prompt, hint,
    correct: String(ans),
    choices,
    draw: ctx => drawShare(ctx, total, n),
    meta: { op: 'div', total, n, ask: askRem ? 'rem' : 'quot' }
  };
}

function genAddSub(t) {
  const item = pick(['gems', 'coins', 'crystals', 'scrolls', 'potions']);
  const who = pick(['A wizard', 'A dragon trainer', 'The knight', 'A young hero']);
  if (t === 5) {
    const A = rand(150, 800), B = rand(50, 300), C = rand(20, Math.min(A + B - 40, 400));
    const ans = A + B - C;
    return {
      topic: '🧮 TREASURE MATH',
      prompt: `${who} had ${A} ${item}, found ${B} more, then gave ${C} to a friend. How many ${item} are left?`,
      hint: `Do it in two steps: ${A} + ${B} = ${A + B}, then ${A + B} − ${C} = ${ans}.`,
      correct: String(ans),
      choices: numChoices(ans, [A + B, A - C, ans + 10, ans - 10, ans + 100], { min: 0, spread: 20 }),
      draw: ctx => {
        dgFrame(ctx);
        dgFit(ctx, `${A} + ${B} − ${C} = ?`, DW / 2, 80, 480, 44, '#ffd166');
        dgText(ctx, 'Work left to right, one step at a time!', DW / 2, 130, 15, '#b8c7f0', 'center', '800');
      },
      meta: { op: 'multi', A, B, C }
    };
  }
  const add = rand(0, 1) === 1;
  let a, b;
  if (t === 1) {
    if (add) {
      const o1 = rand(1, 8), o2 = rand(1, 9 - o1);
      a = rand(1, 4) * 10 + o1; b = rand(1, 4) * 10 + o2;
    } else {
      const tA = rand(3, 9), oA = rand(2, 9), tB = rand(1, tA - 1), oB = rand(0, oA);
      a = tA * 10 + oA; b = tB * 10 + oB;
    }
  } else if (t === 2) {
    let tries = 0;
    if (add) {
      do { a = rand(25, 95); b = rand(25, 95); } while ((a % 10) + (b % 10) < 10 && tries++ < 40);
    } else {
      do { a = rand(50, 150); b = rand(15, a - 10); } while ((b % 10) <= (a % 10) && tries++ < 40);
    }
  } else if (t === 3) {
    if (add) { a = rand(120, 799); b = rand(110, 999 - a); } else { a = rand(300, 999); b = rand(110, a - 50); }
  } else {
    if (add) { a = rand(1200, 7999); b = rand(300, 9999 - a); } else { a = rand(2500, 9999); b = rand(300, a - 200); }
  }
  const ans = add ? a + b : a - b;
  const f = t >= 4 ? fmtN : String;
  const prompt = add
    ? `${who} collected ${f(a)} ${item} in the morning and ${f(b)} more in the evening. How many ${item} in all?`
    : `${who} had ${f(a)} ${item} and spent ${f(b)} of them in the shop. How many ${item} are left?`;
  const hint = `Line up the digits and ${add ? 'add' : 'subtract'} column by column (${add ? 'carry when you reach 10' : 'borrow if you need to'}): ${f(a)} ${add ? '+' : '−'} ${f(b)} = ${f(ans)}.`;
  const extras = t === 1 ? [ans + 10, ans - 10, ans + 1, ans - 1] : [ans + 10, ans - 10, ans + 100, ans - 100, add ? Math.abs(a - b) : a + b];
  return {
    topic: '🧮 TREASURE MATH',
    prompt, hint,
    correct: f(ans),
    choices: numChoices(ans, extras, { min: 0, spread: t === 1 ? 4 : 20, fmt: f }),
    draw: ctx => add
      ? drawBarModel(ctx, '?', [{ v: a, label: f(a) }, { v: b, label: f(b) }])
      : drawBarModel(ctx, f(a), [{ v: b, label: f(b) }, { v: a - b, label: '?', unknown: true }]),
    meta: { op: add ? 'add' : 'sub', a, b }
  };
}

function genAlgebra(t) {
  let m, egg, extra, sub = false;
  if (t === 1) { m = 1; egg = rand(2, 12); extra = rand(2, 9); }
  else if (t === 2) { m = rand(2, 4); egg = rand(3, 8); extra = rand(2, 9); }
  else if (t === 3) { m = rand(3, 6); egg = rand(4, 12); extra = rand(5, 20); }
  else if (t === 4) { m = rand(2, 6); egg = rand(4, 12); extra = rand(3, 15); sub = true; }
  else { m = rand(4, 9); egg = rand(5, 15); extra = rand(5, 25); sub = rand(0, 1) === 1; }
  if (sub && m * egg - extra < 3) extra = Math.max(1, m * egg - 6);
  const total = sub ? m * egg - extra : m * egg + extra;
  const op = sub ? '−' : '+';
  const eggs = m === 1 ? '🥚' : `${m} × 🥚`;
  const hint = sub
    ? `First add ${extra} to both sides (${total} + ${extra} = ${total + extra})${m > 1 ? `, then split equally among ${m} eggs` : ''}: 1 🥚 = ${egg}!`
    : `First take away ${extra} from both sides (${total} − ${extra} = ${total - extra})${m > 1 ? `, then split equally among ${m} eggs` : ''}: 1 🥚 = ${egg}!`;
  return {
    topic: '⚖️ DRAGON EGG BALANCE SCALE',
    prompt: `Balance the Scale!  ${eggs} ${op} ${extra} = ${total}.  What is 1 🥚 worth?`,
    hint,
    correct: String(egg),
    choices: numChoices(egg, [sub ? total + extra : total - extra, Math.round(total / m), egg + 1, egg - 1, egg + 2], { min: 1 }),
    draw: ctx => drawBalance(ctx, m, op, extra, total),
    meta: { op: 'algebra', m, egg, extra, sub }
  };
}

function genFrac(t) {
  const TOPIC = '🧪 ALCHEMIST DRAGON POTION';
  if (t === 1) {
    const d = pick([2, 3, 4, 5, 6, 8]), k = rand(1, d - 1);
    const pie = d <= 8 && rand(0, 1) === 1;
    const ans = `${k}/${d}`;
    return {
      topic: '🍰 FRACTION SHIELD',
      prompt: `${k} of the ${d} equal parts of the dragon shield are glowing. What fraction is glowing?`,
      hint: `The bottom number counts ALL the equal parts (${d}). The top number counts the glowing ones (${k}): ${k}/${d}.`,
      correct: ans,
      choices: fracChoices(ans, [`${d - k}/${d}`, `${k}/${d + 1}`, `${k + 1}/${d}`, `${d}/${k}`, `${k}/${d - 1}`]),
      draw: ctx => { dgFrame(ctx); if (pie) fracPie(ctx, DW / 2, 76, 58, d, k, '#00bbf9'); else fracBar(ctx, 70, 45, 400, 60, d, k, '#00bbf9'); },
      meta: { op: 'frac_id', k, d }
    };
  }
  if (t === 2) {
    const d = pick([4, 6, 8]), a = rand(1, d - 2), b = rand(1, d - a);
    const ans = `${a + b}/${d}`;
    return {
      topic: TOPIC,
      prompt: `You pour ${a}/${d} Blue Mana and ${b}/${d} Purple Mana into the flask. How full is it?`,
      hint: `Same-sized parts: just add the tops! ${a} + ${b} = ${a + b}, so ${a + b}/${d}.`,
      correct: ans,
      choices: fracChoices(ans, [`${a + b}/${d * 2}`, `${a + b + 1}/${d}`, `${a + b - 1}/${d}`, `${a + b}/${d + d}`, `${a * b}/${d}`]),
      draw: ctx => {
        dgFrame(ctx);
        const bw = 46, sx = (DW - d * (bw + 6)) / 2;
        for (let i = 0; i < d; i++) {
          ctx.fillStyle = i < a ? '#00bbf9' : i < a + b ? '#9b5de5' : '#182246';
          ctx.fillRect(sx + i * (bw + 6), 38, bw, 66);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(sx + i * (bw + 6), 38, bw, 66);
        }
        dgText(ctx, `${a} Blue + ${b} Purple out of ${d} equal parts`, DW / 2, 130, 16, '#ffd166');
      },
      meta: { op: 'frac_add', a, b, d }
    };
  }
  if (t === 3) {
    let fr, hint, prompt = 'Which fraction is the BIGGEST?';
    if (rand(0, 1) === 0) {
      const d = pick([5, 6, 8, 10, 12]);
      const nums = new Set();
      while (nums.size < 3) nums.add(rand(1, d - 1));
      fr = [...nums].map(n => ({ n, d }));
      hint = `The bottoms are all the same, so the biggest TOP number is the biggest fraction.`;
    } else {
      const n = pick([1, 2, 3]);
      const ds = shuffle([4, 5, 6, 8, 10, 12]).slice(0, 3);
      fr = ds.map(d => ({ n, d }));
      hint = `The tops are the same, so look at the bottoms: the SMALLER the bottom, the BIGGER each piece is!`;
    }
    const best = fr.reduce((a, b) => (b.n * a.d > a.n * b.d ? b : a));
    const strs = fr.map(f => `${f.n}/${f.d}`);
    return {
      topic: TOPIC, prompt, hint,
      correct: `${best.n}/${best.d}`,
      choices: shuffle(strs),
      draw: ctx => {
        dgFrame(ctx);
        fr.forEach((f, i) => {
          dgText(ctx, `${f.n}/${f.d}`, 58, 50 + i * 40, 20, '#ffd166');
          fracBar(ctx, 100, 32 + i * 40, 380, 26, f.d, f.n, ['#00bbf9', '#9b5de5', '#06d6a0'][i]);
        });
      },
      meta: { op: 'frac_max', fr }
    };
  }
  if (t === 4) {
    const n = pick([2, 3, 4, 5]), k = rand(1, n - 1), f = rand(2, 4), m = n * f, ans = k * f;
    return {
      topic: '🍰 EQUAL SLICES',
      prompt: `Make equal slices! ${k}/${n} = ?/${m}`,
      hint: `Cut every slice into ${f} smaller slices. Multiply the top AND bottom by ${f}: ${k}×${f} = ${ans} and ${n}×${f} = ${m}.`,
      correct: String(ans),
      choices: numChoices(ans, [ans + 1, ans - 1, k + f, k + (m - n), ans + 2], { min: 1 }),
      draw: ctx => {
        dgFrame(ctx);
        dgText(ctx, `${k}/${n}`, 50, 52, 20, '#ffd166');
        fracBar(ctx, 90, 30, 400, 34, n, k, '#00bbf9');
        dgText(ctx, `?/${m}`, 50, 112, 20, '#ffd166');
        fracBar(ctx, 90, 90, 400, 34, m, ans, '#06d6a0');
      },
      meta: { op: 'frac_eq', k, n, f, m }
    };
  }
  // t === 5: unlike denominators (answer always in lowest terms)
  const pairs = [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9], [5, 10], [2, 10]];
  let d1, D, a, b, num, add, found = false;
  for (let i = 0; i < 200 && !found; i++) {
    [d1, D] = pick(pairs);
    a = rand(1, d1 - 1); b = rand(1, D - 1);
    add = rand(0, 1) === 1;
    num = add ? a * (D / d1) + b : a * (D / d1) - b;
    found = num > 0 && num < D && gcd(num, D) === 1;
  }
  if (!found) { d1 = 2; D = 4; a = 1; b = 1; num = 3; add = true; }
  const ans = `${num}/${D}`;
  return {
    topic: TOPIC,
    prompt: add
      ? `A flask is ${a}/${d1} full of blue mana. You add ${b}/${D} of a flask of purple mana. How full is it now?`
      : `A flask is ${a}/${d1} full. Ignis drinks ${b}/${D} of the flask. How much is left?`,
    hint: `Make the bottoms match: ${a}/${d1} = ${a * (D / d1)}/${D}. Then ${add ? 'add' : 'subtract'} the tops: ${a * (D / d1)} ${add ? '+' : '−'} ${b} = ${num}, so ${ans}.`,
    correct: ans,
    choices: fracChoices(ans, [`${a + b}/${d1 + D}`, `${num + 1}/${D}`, `${num - 1}/${D}`, `${a + b}/${D}`, `${Math.abs(a - b)}/${D}`]),
    draw: ctx => {
      dgFrame(ctx);
      fracBar(ctx, 20, 38, 220, 36, d1, a, '#00bbf9');
      dgText(ctx, add ? '+' : '−', 262, 66, 30, '#ffd166');
      fracBar(ctx, 290, 38, 220, 36, D, b, '#9b5de5');
      dgText(ctx, `${a}/${d1}  ${add ? '+' : '−'}  ${b}/${D}  =  ?`, DW / 2, 122, 22, '#ffffff');
    },
    meta: { op: add ? 'frac_add2' : 'frac_sub2', a, d1, b, D }
  };
}

function genArea(t) {
  const mode = t <= 2 ? 'area_grid' : t === 3 ? 'perim' : t === 4 ? (rand(0, 1) ? 'perim' : 'area_rect') : (rand(0, 1) ? 'miss_area' : 'miss_perim');
  if (mode === 'area_grid') {
    const w = t === 1 ? rand(2, 5) : rand(4, 8), h = t === 1 ? rand(2, 4) : rand(3, 5), ans = w * h;
    return {
      topic: '🏰 MINECRAFT FORTRESS BLUEPRINT',
      prompt: `This Dragon Landing Pad is ${w} blocks long and ${h} blocks wide. How many floor blocks does it cover? (That is its Area.)`,
      hint: `Area = length × width ➔ ${w} × ${h} = ${ans} blocks!`,
      correct: String(ans),
      choices: numChoices(ans, [w + h, 2 * (w + h), ans + w, ans - w, ans + h], { min: 1 }),
      draw: ctx => drawGrid(ctx, w, h),
      meta: { op: 'area', w, h }
    };
  }
  if (mode === 'area_rect') {
    const w = rand(6, 15), h = rand(4, 12), ans = w * h;
    return {
      topic: '🏰 MINECRAFT FORTRESS BLUEPRINT',
      prompt: `A dragon landing pad is ${w} blocks long and ${h} blocks wide. What is its AREA in square blocks?`,
      hint: `Area = length × width ➔ ${w} × ${h} = ${ans} square blocks!`,
      correct: String(ans),
      choices: numChoices(ans, [2 * (w + h), w + h, ans + w, ans - h, ans + 10], { min: 1, spread: 10 }),
      draw: ctx => drawRectLabeled(ctx, w, h, `${w}`, `${h}`, 'Area = ?'),
      meta: { op: 'area', w, h }
    };
  }
  if (mode === 'perim') {
    const w = t === 3 ? rand(3, 9) : rand(6, 15), h = t === 3 ? rand(2, 7) : rand(4, 12), ans = 2 * (w + h);
    return {
      topic: '📐 DRAGON PEN FENCE',
      prompt: `A fence goes all the way around a dragon pen that is ${w} m long and ${h} m wide. How long is the fence in total, in m? (Perimeter)`,
      hint: `Perimeter = add ALL four sides: ${w} + ${h} + ${w} + ${h} = ${ans} m!`,
      correct: String(ans),
      choices: numChoices(ans, [w * h, w + h, 2 * w + h, ans + 2, ans - 2, ans + 4], { min: 1 }),
      draw: ctx => drawRectLabeled(ctx, w, h, `${w} m`, `${h} m`, 'Fence = ?'),
      meta: { op: 'perim', w, h }
    };
  }
  if (mode === 'miss_area') {
    const w = rand(4, 12), h = rand(3, 12), A = w * h;
    return {
      topic: '🏰 MINECRAFT FORTRESS BLUEPRINT',
      prompt: `A landing pad has an area of ${A} square blocks and is ${w} blocks long. How many blocks wide is it?`,
      hint: `Area = length × width, so width = ${A} ÷ ${w} = ${h} blocks!`,
      correct: String(h),
      choices: numChoices(h, [A - w, w, h + 1, h - 1, h + 2], { min: 1 }),
      draw: ctx => drawRectLabeled(ctx, w, h, `${w}`, '?', `Area = ${A}`),
      meta: { op: 'miss_area', w, h }
    };
  }
  const w = rand(4, 14), h = rand(3, 12), P = 2 * (w + h);
  return {
    topic: '📐 DRAGON PEN FENCE',
    prompt: `A rectangular dragon pen has ${P} m of fence all the way around. One side is ${w} m long. How long is the side next to it, in m?`,
    hint: `Two sides add up to half the fence: ${P} ÷ 2 = ${P / 2}. Then ${P / 2} − ${w} = ${h} m!`,
    correct: String(h),
    choices: numChoices(h, [P - w, P / 2, h + 1, h - 1, h + 2 * w], { min: 1 }),
    draw: ctx => drawRectLabeled(ctx, w, h, `${w} m`, '?', `Fence = ${P} m`),
    meta: { op: 'miss_perim', w, h }
  };
}

function genPlace(t) {
  const TOPIC = '🔢 NUMBER CRYSTALS';
  if (t === 1) {
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    const n = ds[0] * 100 + ds[1] * 10 + ds[2];
    const p = rand(0, 2), digit = ds[p], mult = [100, 10, 1][p];
    const names = ['hundreds', 'tens', 'ones'];
    return {
      topic: TOPIC,
      prompt: `In the number ${n}, what is the value of the digit ${digit}?`,
      hint: `The digit ${digit} is in the ${names[p]} place, so it is worth ${digit * mult}.`,
      correct: String(digit * mult),
      choices: shuffle([String(digit), String(digit * 10), String(digit * 100)]),
      draw: ctx => drawPlaceChart(ctx, ['Hundreds', 'Tens', 'Ones'], ds.map(String), p),
      meta: { op: 'digit_value', n, digit, ans: digit * mult }
    };
  }
  if (t === 2 || t === 3 || (t === 4 && rand(0, 2) === 0)) {
    const unit = t === 2 ? 10 : t === 3 ? 100 : 1000;
    let n;
    do { n = t === 2 ? rand(11, 99) : t === 3 ? rand(101, 999) : rand(1001, 9999); } while (n % unit === 0);
    const ans = Math.round(n / unit) * unit;
    const lo = Math.floor(n / unit) * unit, hi = lo + unit, other = ans === lo ? hi : lo;
    const name = unit === 10 ? 'ten' : unit === 100 ? 'hundred' : 'thousand';
    const nearTen = Math.round(n / 10) * 10;
    return {
      topic: '🔢 ROUNDING RUNES',
      prompt: `Round ${fmtN(n)} to the nearest ${name}.`,
      hint: `Look at the digit to the right. 5 or more rounds UP, 4 or less stays DOWN. ${fmtN(n)} is closer to ${fmtN(ans)}!`,
      correct: fmtN(ans),
      choices: numChoices(ans, [other, ans + unit, ans - unit, nearTen], { min: 0, step: unit, spread: 3, fmt: fmtN }),
      draw: ctx => drawNumberLine(ctx, lo, hi, n),
      meta: { op: 'round', n, unit, ans }
    };
  }
  if (t === 4) {
    const v = rand(0, 1);
    const n = rand(1000, 8899);
    const delta = v === 0 ? 1000 : 100;
    const more = rand(0, 1) === 1;
    const ans = more ? n + delta : n - delta;
    return {
      topic: TOPIC,
      prompt: `What number is ${fmtN(delta)} ${more ? 'MORE' : 'LESS'} than ${fmtN(n)}?`,
      hint: `${fmtN(delta)} changes the ${v === 0 ? 'thousands' : 'hundreds'} digit by 1: ${fmtN(n)} ${more ? '+' : '−'} ${fmtN(delta)} = ${fmtN(ans)}.`,
      correct: fmtN(ans),
      choices: numChoices(ans, [more ? n + delta / 10 : n - delta / 10, more ? n + delta * 10 : n - delta * 10, ans + (v === 0 ? 100 : 1000), ans - (v === 0 ? 100 : 1000)], { min: 0, step: delta, spread: 3, fmt: fmtN }),
      draw: ctx => drawPlaceChart(ctx, ['Thousands', 'Hundreds', 'Tens', 'Ones'], String(n).padStart(4, '0').split(''), v === 0 ? 0 : 1),
      meta: { op: 'place_shift', n, delta, more, ans }
    };
  }
  // t === 5: expanded form
  const th = rand(1, 9), h = rand(1, 9), te = rand(1, 9), o = rand(1, 9);
  const n = th * 1000 + h * 100 + te * 10 + o;
  return {
    topic: TOPIC,
    prompt: `${fmtN(th * 1000)} + ${h * 100} + ${te * 10} + ${o} = ?`,
    hint: `Add each place value: ${fmtN(th * 1000)} + ${h * 100} = ${fmtN(th * 1000 + h * 100)}, then + ${te * 10} + ${o} = ${fmtN(n)}.`,
    correct: fmtN(n),
    choices: numChoices(n, [th * 1000 + te * 100 + h * 10 + o, th * 100 + h * 10 + te * 10 + o, th * 1000 + h * 10 + te + o, n + 100, n - 100, n + 10], { min: 0, spread: 9, fmt: fmtN }),
    draw: ctx => drawPlaceChart(ctx, ['Thousands', 'Hundreds', 'Tens', 'Ones'], [th, h, te, o].map(String), -1),
    meta: { op: 'expanded', th, h, te, o, ans: n }
  };
}

function genClock(t) {
  const TOPIC = '🕰️ DRAGON CLOCK TOWER';
  let h = rand(1, 12), m;
  if (t === 1) m = 0;
  else if (t === 2) m = pick([0, 15, 30, 45]);
  else if (t === 3) m = rand(0, 11) * 5;
  else if (t === 4) m = rand(1, 59);
  else m = rand(0, 11) * 5;
  if (t === 5) {
    const delta = pick([20, 25, 30, 35, 40, 45, 50, 55, 65, 75]);
    const total = h * 60 + m + delta;
    const H = Math.floor(total / 60), M = total % 60;
    const ans = fmtTime(H, M);
    return {
      topic: TOPIC,
      prompt: `The clock shows ${fmtTime(h, m)}. What time will it be in ${delta} minutes?`,
      hint: delta >= 60 ? `${delta} minutes is 1 hour and ${delta - 60} minutes. From ${fmtTime(h, m)}, add 1 hour, then the extra ${delta - 60} minutes: ${ans}!` : `Count on ${delta} minutes from ${fmtTime(h, m)}: that makes ${ans}!`,
      correct: ans,
      choices: timeChoices(ans, [fmtTime(H + 1, M), fmtTime(H - 1, M), fmtTime(H, M + 10), fmtTime(H, M + 50), fmtTime(h, m + delta)]),
      draw: ctx => drawClock(ctx, h, m, ''),
      meta: { op: 'elapsed', h, m, delta, ans }
    };
  }
  const ans = fmtTime(h, m);
  const cands = [fmtTime(h + 1, m), fmtTime(h - 1, m), fmtTime(h, m + 5), fmtTime(h, m + 55), fmtTime(h, m + 30)];
  if (m % 5 === 0) cands.push(fmtTime(m === 0 ? 12 : m / 5, h * 5));
  return {
    topic: TOPIC,
    prompt: 'What time does the dragon clock show?',
    hint: `The SHORT purple hand shows the hour: it is the last number it has passed (${h}). The LONG red hand shows the minutes — each number is 5 minutes, so it shows ${m} minutes: ${ans}.`,
    correct: ans,
    choices: timeChoices(ans, cands),
    draw: ctx => drawClock(ctx, h, m, ''),
    meta: { op: 'clock', h, m, ans }
  };
}

function genPattern(t) {
  let terms, missing, rule;
  if (t === 1) {
    const k = pick([2, 5, 10]), s = rand(0, 4) * k;
    terms = [0, 1, 2, 3, 4].map(i => s + i * k); missing = 4; rule = `It goes up by ${k} each time.`;
  } else if (t === 2) {
    const k = pick([3, 4, 6, 9]), s = rand(1, 10);
    terms = [0, 1, 2, 3, 4].map(i => s + i * k); missing = rand(1, 4); rule = `It goes up by ${k} each time.`;
  } else if (t === 3) {
    const k = pick([7, 8, 11, 12, 25, 50, 100]), down = rand(0, 1) === 1;
    const s = down ? 5 * k + rand(0, k) : rand(10, 200);
    terms = [0, 1, 2, 3, 4].map(i => (down ? s - i * k : s + i * k)); missing = rand(1, 4);
    rule = `It goes ${down ? 'down' : 'up'} by ${k} each time.`;
  } else if (t === 4) {
    const m = pick([2, 3]), s = rand(1, 5);
    terms = [0, 1, 2, 3, 4].map(i => s * Math.pow(m, i)); missing = rand(2, 4);
    rule = `Each number is ${m} times the one before it (× ${m}).`;
  } else {
    const v = rand(0, 3);
    if (v === 0) {
      const a = rand(2, 6), b = rand(a + 1, 9), s = rand(1, 9);
      terms = [s, s + a, s + a + b, s + 2 * a + b, s + 2 * a + 2 * b]; missing = rand(2, 4);
      rule = `It goes +${a}, then +${b}, then +${a}, then +${b} (two steps repeating).`;
    } else if (v === 1) {
      const s = rand(1, 3);
      terms = [s]; for (let i = 0; i < 4; i++) terms.push(terms[i] * 2 + 1);
      missing = rand(3, 4); rule = `Double the number, then add 1 (× 2 + 1).`;
    } else if (v === 2) {
      const n = rand(1, 6);
      terms = [0, 1, 2, 3, 4].map(i => (n + i) * (n + i)); missing = rand(2, 4);
      rule = `These are square numbers: ${n}×${n}, ${n + 1}×${n + 1}, ${n + 2}×${n + 2} ...`;
    } else {
      const n = rand(1, 4);
      terms = [0, 1, 2, 3, 4].map(i => ((n + i) * (n + i + 1)) / 2); missing = rand(2, 4);
      rule = `The jumps grow by 1 each time (+${n + 1}, +${n + 2}, +${n + 3} ...).`;
    }
  }
  const ans = terms[missing];
  const seq = terms.map((x, i) => (i === missing ? '?' : fmtN(x))).join(', ');
  return {
    topic: '🔁 PATTERN PORTAL',
    prompt: `What number is missing? ${seq}`,
    hint: `${rule} So the mystery number is ${fmtN(ans)}!`,
    correct: fmtN(ans),
    choices: numChoices(ans, [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10], { min: 0, spread: 6, fmt: fmtN }),
    draw: ctx => drawSequence(ctx, terms, missing),
    meta: { op: 'pattern', terms, missing, ans }
  };
}

// ============================================================================
// WORD BANKS (English + Science). Row: [difficulty 1-5, question, hint, correct, wrong1, wrong2, big text, passage]
// ============================================================================
const B = rows => rows.map(r => ({ d: r[0], q: r[1], h: r[2], a: r[3], w1: r[4], w2: r[5], big: r[6] || '', passage: r[7] || '' }));

const BANK = {
  vocab: B([
    [1, `Which word means the SAME as "big"?`, `Big and large both mean "not small".`, `large`, `tiny`, `quiet`, `big = ?`],
    [1, `Which word means the SAME as "begin"?`, `To begin something is to start it.`, `start`, `finish`, `stop`, `begin = ?`],
    [1, `Which word is the OPPOSITE of "hot"?`, `Think of ice cream, not soup!`, `cold`, `warm`, `sunny`, `hot ↔ ?`],
    [1, `Which word is the OPPOSITE of "day"?`, `The sun goes down and the moon comes out.`, `night`, `morning`, `noon`, `day ↔ ?`],
    [1, `Which word means the SAME as "happy"?`, `Happy means feeling good and cheerful.`, `glad`, `angry`, `sleepy`, `happy = ?`],
    [1, `Which word is the OPPOSITE of "up"?`, `Think about going the other way.`, `down`, `over`, `high`, `up ↔ ?`],
    [2, `Which word means the SAME as "enormous"?`, `Enormous means very, very big!`, `huge`, `tiny`, `quiet`, `enormous = ?`],
    [2, `Which word means the SAME as "swift"?`, `Swift means moving very fast!`, `fast`, `slow`, `heavy`, `swift = ?`],
    [2, `Which word is the OPPOSITE of "ancient"?`, `Ancient means very old. Think of the opposite!`, `modern`, `old`, `dusty`, `ancient ↔ ?`],
    [2, `Which word is the OPPOSITE of "brave"?`, `A brave knight is not afraid. Who IS afraid?`, `cowardly`, `mighty`, `kind`, `brave ↔ ?`],
    [2, `Which word means the SAME as "tiny"?`, `Tiny means very, very small.`, `small`, `huge`, `loud`, `tiny = ?`],
    [2, `Which word is the OPPOSITE of "empty"?`, `An empty box has nothing inside.`, `full`, `broken`, `light`, `empty ↔ ?`],
    [2, `Which word means the SAME as "shout"?`, `To shout is to yell very loudly.`, `yell`, `whisper`, `giggle`, `shout = ?`],
    [3, `Which word is the OPPOSITE of "generous"?`, `A generous person loves to share. The opposite keeps everything!`, `selfish`, `friendly`, `wealthy`, `generous ↔ ?`],
    [3, `Which word is the OPPOSITE of "expand"?`, `Expand means grow bigger. The opposite makes it smaller!`, `shrink`, `stretch`, `grow`, `expand ↔ ?`],
    [3, `Which word means the SAME as "courageous"?`, `Courageous people do brave things even when they feel scared.`, `brave`, `nervous`, `clever`, `courageous = ?`],
    [3, `What does "fragile" mean?`, `A fragile glass can break very easily.`, `easily broken`, `very strong`, `very heavy`, `fragile = ?`],
    [3, `Which word is the OPPOSITE of "victory"?`, `When you win it is a victory. When you lose, it is a...`, `defeat`, `prize`, `race`, `victory ↔ ?`],
    [3, `Which word means the SAME as "rapid"?`, `Rapid means happening very quickly.`, `quick`, `gentle`, `late`, `rapid = ?`],
    [3, `What does "ancient" mean?`, `Ancient things are from a very long time ago.`, `very old`, `brand new`, `shiny`, `ancient = ?`],
    [4, `What does "abundant" mean?`, `If there is an abundant supply of food, there is more than enough!`, `plentiful`, `rare`, `tiny`, `abundant = ?`],
    [4, `What does "scarce" mean?`, `Scarce things are hard to find because there is very little of them.`, `hard to find`, `found everywhere`, `very loud`, `scarce = ?`],
    [4, `Which word is the OPPOSITE of "abundant"?`, `Abundant means plentiful. What is the opposite of plentiful?`, `scarce`, `plentiful`, `generous`, `abundant ↔ ?`],
    [4, `What does "hesitate" mean?`, `If you hesitate, you stop for a moment before you do something.`, `pause before acting`, `jump right in`, `shout loudly`, `hesitate = ?`],
    [4, `Which word means the SAME as "ferocious"?`, `A ferocious dragon is wild and very fierce!`, `fierce`, `gentle`, `sleepy`, `ferocious = ?`],
    [4, `Which word means the SAME as "reluctant"?`, `A reluctant person does not really want to do something.`, `unwilling`, `eager`, `curious`, `reluctant = ?`],
    [4, `Which word means the SAME as "tremendous"?`, `Tremendous means extremely large or great.`, `enormous`, `average`, `delicate`, `tremendous = ?`],
    [5, `What does "meticulous" mean?`, `A meticulous person is very careful about every little detail.`, `very careful`, `very messy`, `very fast`, `meticulous = ?`],
    [5, `Which word is the OPPOSITE of "transparent"?`, `You can see through transparent glass. You cannot see through...`, `opaque`, `clear`, `shiny`, `transparent ↔ ?`],
    [5, `What does "bewildered" mean?`, `If you are bewildered, you feel completely puzzled and confused.`, `confused`, `delighted`, `exhausted`, `bewildered = ?`],
    [5, `What does "persistent" mean?`, `A persistent person keeps trying and does not give up.`, `never giving up`, `easily bored`, `very quiet`, `persistent = ?`],
    [5, `What does "ambitious" mean?`, `An ambitious person has big goals and works hard to reach them.`, `eager to succeed`, `afraid to try`, `easily satisfied`, `ambitious = ?`],
    [5, `Which word is the OPPOSITE of "optimistic"?`, `An optimistic person expects good things. The opposite expects bad things.`, `pessimistic`, `cheerful`, `hopeful`, `optimistic ↔ ?`]
  ]),

  spelling: B([
    [1, `Which spelling is CORRECT?`, `Say it slowly: "dra-gon"!`, `dragon`, `dragin`, `dragun`, `✏️ dr_g_n`],
    [1, `Which spelling is CORRECT?`, `A friend is there to the END: fri-END.`, `friend`, `freind`, `frend`, `✏️ fr_end`],
    [1, `Which spelling is CORRECT?`, `Big Elephants Can Always Understand Small Elephants = b-e-c-a-u-s-e.`, `because`, `becuase`, `becase`, `✏️ bec_use`],
    [1, `Which spelling is CORRECT?`, `People has an "eo" in the middle: p-eo-ple.`, `people`, `peeple`, `peple`, `✏️ p_ople`],
    [1, `Which spelling is CORRECT?`, `The "ch" in school makes the "k" sound: s-ch-ool.`, `school`, `scool`, `skool`, `✏️ s_hool`],
    [2, `Which spelling is CORRECT?`, `A wizard has one "z" and ends in -ard.`, `wizard`, `wizzard`, `wisard`, `✏️ wiz_rd`],
    [2, `Which spelling is CORRECT?`, `The "t" in castle is silent: cas-tle.`, `castle`, `cassle`, `kastle`, `✏️ cas_le`],
    [2, `Which spelling is CORRECT?`, `There is a silent "s" in island: is-land.`, `island`, `iland`, `ilend`, `✏️ is_and`],
    [2, `Which spelling is CORRECT?`, `Remember "i before e, except after c": rec-ei-ve.`, `receive`, `recieve`, `receeve`, `✏️ rec_ve`],
    [2, `Which spelling is CORRECT?`, `Adventure ends with -ture, like picture.`, `adventure`, `advencher`, `adventur`, `✏️ adven_ure`],
    [2, `Which spelling is CORRECT?`, `Beautiful starts with "beau" and ends with -ful (one "l").`, `beautiful`, `beutiful`, `beautifull`, `✏️ beau_iful`],
    [3, `Which spelling is CORRECT?`, `Say each beat: dif-fer-ent. It has two f's.`, `different`, `diffrent`, `diferent`, `✏️ di_erent`],
    [3, `Which spelling is CORRECT?`, `Tomorrow has one "m" and two "r"s: to-mor-row.`, `tomorrow`, `tommorow`, `tomorow`, `✏️ to_orrow`],
    [3, `Which spelling is CORRECT?`, `Library has "brar" in the middle — it is not "berry"!`, `library`, `libary`, `liberry`, `✏️ li_rary`],
    [3, `Which spelling is CORRECT?`, `It sounds like "e-nuff", but it ends in -ough.`, `enough`, `enuff`, `enogh`, `✏️ en_ugh`],
    [3, `Which spelling is CORRECT?`, `One Collar and two Sleeves: n-e-c-e-s-s-a-r-y.`, `necessary`, `neccessary`, `necesary`, `✏️ nec_ssary`],
    [3, `Which spelling is CORRECT?`, `There's "a rat" in sepARATe!`, `separate`, `seperate`, `separat`, `✏️ sep_rate`],
    [3, `Which spelling is CORRECT?`, `Double the "n" when you add -ing to begin: beginning.`, `beginning`, `begining`, `beginnning`, `✏️ begi_ning`],
    [4, `Which spelling is CORRECT?`, `Don't forget the "n" before "ment": environ-ment.`, `environment`, `enviroment`, `enviornment`, `✏️ enviro_ment`],
    [4, `Which spelling is CORRECT?`, `Govern + ment: there is an "n" in the middle.`, `government`, `goverment`, `govenment`, `✏️ gove_nment`],
    [4, `Which spelling is CORRECT?`, `It has a "t-e-r-e-s-t" in the middle: in-ter-est-ing.`, `interesting`, `intresting`, `interesing`, `✏️ inte_esting`],
    [4, `Which spelling is CORRECT?`, `Experiment ends with -iment: exper-i-ment.`, `experiment`, `experiement`, `expirement`, `✏️ exper_ment`],
    [4, `Which spelling is CORRECT?`, `Temperature has "era" in the middle: temp-era-ture.`, `temperature`, `temprature`, `tempreture`, `✏️ temp_rature`],
    [4, `Which spelling is CORRECT?`, `Danger + ous = dangerous. Say it slowly: dan-ger-ous.`, `dangerous`, `dangerus`, `dangerrous`, `✏️ dang_rous`],
    [5, `Which spelling is CORRECT?`, `Two r's and two s's: embarrass.`, `embarrass`, `embarass`, `embaras`, `✏️ emba_rass`],
    [5, `Which spelling is CORRECT?`, `There is "finite" hiding inside definitely.`, `definitely`, `definately`, `definitly`, `✏️ defin_tely`],
    [5, `Which spelling is CORRECT?`, `Two c's and one s: oc-ca-sion.`, `occasion`, `ocassion`, `occassion`, `✏️ oc_asion`],
    [5, `Which spelling is CORRECT?`, `Two c's and two m's: accommodate.`, `accommodate`, `acommodate`, `accomodate`, `✏️ ac_ommodate`],
    [5, `Which spelling is CORRECT?`, `Rhythm has no vowels except "y" — and two h's.`, `rhythm`, `rythm`, `rhythem`, `✏️ rh_thm`],
    [5, `Which spelling is CORRECT?`, `It starts with "gu": gu-ar-an-tee.`, `guarantee`, `garantee`, `guarentee`, `✏️ gu_rantee`]
  ]),

  grammar: B([
    [1, `More than one "mouse" is...`, `Mouse is special! It does not just add an "s".`, `mice`, `mouses`, `mices`, `1 mouse → ?`],
    [1, `More than one "tooth" is...`, `Tooth changes its vowels: teeth!`, `teeth`, `tooths`, `teeths`, `1 tooth → ?`],
    [1, `More than one "child" is...`, `Child is special — it becomes a different word!`, `children`, `childs`, `childrens`, `1 child → ?`],
    [1, `Pick the right word: "I saw ___ dragon in the sky."`, `Use "a" before a consonant sound. Dragon starts with "d"!`, `a`, `an`, `two`, `I saw ___ dragon`],
    [1, `Pick the right word: "The dragons ___ flying over the castle."`, `Dragons means more than one, so use "are"!`, `are`, `is`, `am`, `The dragons ___ flying`],
    [2, `More than one "wolf" is...`, `Words ending in "f" often change to "ves"!`, `wolves`, `wolfs`, `wolfes`, `1 wolf → ?`],
    [2, `More than one "foot" is...`, `Foot changes its vowels to make feet.`, `feet`, `foots`, `feets`, `1 foot → ?`],
    [2, `More than one "leaf" is...`, `Leaf changes the "f" to "ves": leaves.`, `leaves`, `leafs`, `leafes`, `1 leaf → ?`],
    [2, `Pick the right word: "I ate ___ apple for lunch."`, `Use "an" before a vowel sound. Apple starts with "a"!`, `an`, `a`, `two`, `I ate ___ apple`],
    [2, `Pick the right word: "My brother ___ to school every day."`, `Brother means one person, so we say "goes"!`, `goes`, `go`, `going`, `My brother ___ to school`],
    [2, `Pick the right word: "Last night, the dragon ___ over the castle."`, `Last night means the past. The past of "fly" is "flew"!`, `flew`, `flied`, `flying`, `Last night it ___`],
    [2, `Pick the right word: "She ___ her homework yesterday."`, `Yesterday means the past. The past of "do" is "did"!`, `did`, `doed`, `doing`, `Yesterday she ___`],
    [2, `In "The dragon ROARED loudly", what kind of word is ROARED?`, `A verb is an ACTION word — what did the dragon DO?`, `verb`, `noun`, `adjective`, `ROARED = ?`],
    [2, `In "The SHINY crown fell", what kind of word is SHINY?`, `An adjective DESCRIBES a noun — how does the crown look?`, `adjective`, `verb`, `noun`, `SHINY = ?`],
    [2, `In "The WIZARD cast a spell", what kind of word is WIZARD?`, `A noun is a person, place or thing!`, `noun`, `verb`, `adjective`, `WIZARD = ?`],
    [2, `What is the short way to write "do not"?`, `The apostrophe (') takes the place of the missing "o".`, `don't`, `do'nt`, `dont'`, `do not → ?`],
    [2, `What is the short way to write "I will"?`, `The apostrophe takes the place of "wi" in "will".`, `I'll`, `Ill'`, `I'l`, `I will → ?`],
    [3, `Pick the right word: "The knights put ___ swords away."`, `"Their" shows that something belongs to them.`, `their`, `there`, `they're`, `___ swords`],
    [3, `Pick the right word: "___ going to win the battle!"`, `"They're" is short for "they are": They are going to win.`, `They're`, `Their`, `There`, `___ going to win`],
    [3, `Pick the right word: "I want to come ___ ."`, `"Too" here means "also" — it has an extra "o" for "also"!`, `too`, `to`, `two`, `I want to come ___`],
    [3, `Pick the right word: "Dragons are ___ than horses."`, `Comparing TWO things? Add -er: fast → faster.`, `faster`, `more fast`, `fastest`, `Dragons are ___ than horses`],
    [3, `Pick the right word: "That is the ___ dragon of all!"`, `Comparing MORE than two things? Add -est: fast → fastest.`, `fastest`, `faster`, `more fast`, `the ___ dragon of all`],
    [3, `Pick the right word: "___ went to the castle."`, `Say it without the other person: "I went to the castle." So use "Sam and I".`, `Sam and I`, `Me and Sam`, `Sam and me`, `___ went to the castle`],
    [3, `Pick the right word: "Yesterday, the wizard ___ a new spell."`, `Yesterday means past tense. The past of "learn" is "learned".`, `learned`, `learn`, `learning`, `Yesterday he ___`],
    [3, `In "The knight ran QUICKLY", what kind of word is QUICKLY?`, `An adverb tells HOW something is done (it often ends in -ly)!`, `adverb`, `noun`, `adjective`, `QUICKLY = ?`],
    [3, `What is the short way to write "they are"?`, `The apostrophe takes the place of the missing "a".`, `they're`, `their`, `they'r`, `they are → ?`],
    [3, `What is the short way to write "cannot"?`, `Can't squeezes "cannot" into one short word.`, `can't`, `cant'`, `ca'nt`, `cannot → ?`],
    [4, `Pick the right word: "The dragon licked ___ wounds."`, `"Its" shows ownership (no apostrophe). "It's" is short for "it is" or "it has".`, `its`, `it's`, `its'`, `___ wounds`],
    [4, `Pick the right word: "___ a sunny day today."`, `"It's" is short for "it is".`, `It's`, `Its`, `Its'`, `___ a sunny day`],
    [4, `Pick the right word: "She sings very ___ ."`, `We use "well" (an adverb) to tell HOW she sings.`, `well`, `good`, `goodly`, `She sings very ___`],
    [4, `Pick the right word: "One of the wizards ___ a staff."`, `"One" is the subject, so use "has".`, `has`, `have`, `having`, `One of the wizards ___`],
    [4, `Pick the right word: "The knight ran ___ ."`, `We need an adverb to tell HOW he ran: quickly (it ends in -ly).`, `quickly`, `quick`, `quickness`, `The knight ran ___`],
    [4, `Pick the right word: "Yesterday, the wizard ___ a spell."`, `Cast is special — the past of "cast" is still "cast"!`, `cast`, `casted`, `casting`, `Yesterday he ___`],
    [5, `Pick the right word: "There are ___ eggs than yesterday."`, `Use "fewer" for things you can count, like eggs.`, `fewer`, `less`, `lesser`, `___ eggs than yesterday`],
    [5, `Pick the right word: "The two ___ tails were long."`, `The tails belong to more than one dragon, so the apostrophe goes after the "s".`, `dragons'`, `dragon's`, `dragons`, `The two ___ tails`],
    [4, `Pick the right word: "The box of crayons ___ on the table."`, `The subject is "box" (one thing), not "crayons".`, `is`, `are`, `were`, `The box of crayons ___`],
    [5, `Pick the right word: "If I ___ a dragon, I would fly everywhere."`, `When you are wishing or pretending, use "were": If I were...`, `were`, `was`, `am`, `If I ___ a dragon`]
  ]),

  punct: B([
    [1, `Which sentence is written correctly?`, `A sentence starts with a capital letter and ends with a full stop (period).`, `The dragon flew home.`, `the dragon flew home.`, `The dragon flew home`, `✏️  .  ?  !`],
    [1, `Which sentence is written correctly?`, `A question needs a question mark (?) and a capital letter.`, `Where is the dragon?`, `Where is the dragon.`, `where is the dragon?`, `✏️  .  ?  !`],
    [2, `Which sentence is written correctly?`, `Names of people and places always start with a capital letter.`, `Mia visited Paris in July.`, `mia visited paris in july.`, `Mia visited paris in july.`, `✏️  A a`],
    [2, `Which sentence shows excitement correctly?`, `An exclamation mark (!) shows strong feeling.`, `Watch out for the dragon!`, `Watch out for the dragon?`, `Watch out for the dragon,`, `✏️  .  ?  !`],
    [3, `Which sentence uses commas in a list correctly?`, `Put a comma between the things in a list.`, `I packed apples, bananas, and grapes.`, `I packed apples bananas and grapes.`, `I packed, apples bananas, and grapes.`, `✏️  ,  ,  ,`],
    [3, `The cave belongs to ONE dragon. Which is correct?`, `For one owner, add an apostrophe + s: dragon's.`, `the dragon's cave`, `the dragons cave`, `the dragons' cave`, `✏️  '  s`],
    [4, `Which sentence uses quotation marks correctly?`, `Quotation marks go around the exact words someone says.`, `"Let's go!" said Leo.`, `Let's go! said Leo.`, `"Let's go! said Leo."`, `✏️  " "`],
    [4, `Which sentence is punctuated correctly?`, `Use a comma after a starting phrase like "After lunch".`, `After lunch, we went outside.`, `After lunch we, went outside.`, `After, lunch we went outside.`, `✏️  ,`],
    [4, `Which sentence is punctuated correctly?`, `Use a comma before "but" when it joins two complete thoughts.`, `I wanted to play, but it was raining.`, `I wanted to play but, it was raining.`, `I wanted, to play but it was raining.`, `✏️  ,  but`],
    [1, `Which sentence is written correctly?`, `Always write the word "I" as a capital letter.`, `Today I am going to the park.`, `Today i am going to the park.`, `today I am going to the park.`, `✏️  I`],
    [1, `Which sentence is written correctly?`, `Start with a capital letter and end with a full stop (period).`, `The cat sat on the mat.`, `the cat sat on the mat`, `The cat sat on the mat`, `✏️  .  ?  !`],
    [2, `Which sentence is written correctly?`, `Days of the week and months start with a capital letter.`, `We have a test on Monday.`, `We have a test on monday.`, `we have a test on Monday.`, `✏️  Monday`],
    [2, `Which sentence has the correct end mark?`, `A sentence that asks something ends with a question mark.`, `How old are you?`, `How old are you.`, `How old are you!`, `✏️  ?`],
    [2, `Which sentence is written correctly?`, `The first word and every name get a capital letter.`, `Raj and Maya went to London.`, `raj and maya went to london.`, `Raj and maya went to London.`, `✏️  A a`],
    [3, `Which sentence uses an apostrophe correctly?`, `The apostrophe shows the missing letter in a contraction: did not = didn't.`, `She didn't finish her lunch.`, `She did'nt finish her lunch.`, `She didnt' finish her lunch.`, `✏️  '`],
    [3, `Which sentence uses commas in a list correctly?`, `Put a comma between the items in a list.`, `We saw lions, tigers, and bears.`, `We saw lions tigers, and bears.`, `We saw, lions tigers and bears.`, `✏️  ,  ,  ,`],
    [4, `Which sentence is punctuated correctly?`, `A comma follows the person you are speaking to: "Gran, can we go?"`, `Dad, can we go to the beach?`, `Dad can, we go to the beach?`, `Dad can we go, to the beach?`, `✏️  ,  ?`],
    [4, `Which sentence uses quotation marks correctly?`, `The punctuation goes inside the closing quotation mark.`, `"I am hungry," said Ana.`, `"I am hungry", said Ana.`, `"I am hungry, said" Ana.`, `✏️  " "`],
    [5, `Which sentence is punctuated correctly?`, `A colon (:) can introduce a list of things.`, `Pack these items: a torch, a map, and a rope.`, `Pack these items; a torch a map and a rope.`, `Pack these items, a torch: a map and a rope.`, `✏️  :`]
  ]),

  phonics: B([
    [1, `Which word RHYMES with "cake"?`, `Rhymes sound alike at the end: c-AKE, l-AKE!`, `lake`, `cook`, `kite`, `cake ≈ ?`],
    [1, `Which word RHYMES with "moon"?`, `Moon, spoon, soon — they all end in "-oon"!`, `spoon`, `mop`, `man`, `moon ≈ ?`],
    [1, `Which word RHYMES with "tree"?`, `Tree and bee end with the same "ee" sound.`, `bee`, `tray`, `top`, `tree ≈ ?`],
    [2, `Which word RHYMES with "flame"?`, `Flame and game end with the same sound: -ame.`, `game`, `floor`, `flute`, `flame ≈ ?`],
    [2, `Which word RHYMES with "night"?`, `Night, light, fight — they end with "-ight"!`, `light`, `nut`, `name`, `night ≈ ?`],
    [2, `Which word RHYMES with "spell"?`, `Spell, bell, well — they end with "-ell"!`, `bell`, `spill`, `spoon`, `spell ≈ ?`],
    [2, `Which word RHYMES with "dragon"?`, `Dragon and wagon both end in "-agon".`, `wagon`, `drain`, `dream`, `dragon ≈ ?`],
    [2, `How many syllables (beats) are in "dragon"?`, `Clap it out: dra - gon. That is 2 claps!`, `2`, `1`, `3`, `dra · gon`],
    [3, `How many syllables (beats) are in "adventure"?`, `Clap it out: ad - ven - ture. That is 3 claps!`, `3`, `2`, `4`, `ad · ven · ture`],
    [3, `How many syllables (beats) are in "butterfly"?`, `Clap it out: but - ter - fly. That is 3 claps!`, `3`, `2`, `4`, `but · ter · fly`],
    [3, `Which word has a SILENT "k" at the start?`, `In some words the first letter stays quiet, like the "k" in knee.`, `knight`, `kite`, `king`, `k...`],
    [4, `Which word has a SILENT "w"?`, `The "w" is quiet in wrist.`, `wrist`, `water`, `window`, `w...`],
    [4, `Which word has a SILENT "b"?`, `The "b" is quiet at the end of climb.`, `climb`, `bubble`, `bridge`, `b...`],
    [4, `How many syllables (beats) are in "imagination"?`, `Clap it out: i - mag - i - na - tion. That is 5 claps!`, `5`, `3`, `4`, `i · mag · i · na · tion`],
    [1, `Which word RHYMES with "cat"?`, `Cat and hat both end in "-at".`, `hat`, `cup`, `dog`, `cat ≈ ?`],
    [1, `Which word RHYMES with "star"?`, `Star and car end with the same sound: -ar.`, `car`, `stair`, `step`, `star ≈ ?`],
    [1, `Which word RHYMES with "ring"?`, `Ring, sing, king — they all end in "-ing".`, `sing`, `rain`, `rug`, `ring ≈ ?`],
    [2, `Which word RHYMES with "snow"?`, `Snow, grow, and glow all end with the "oh" sound.`, `grow`, `snap`, `soon`, `snow ≈ ?`],
    [2, `Which word RHYMES with "cave"?`, `Cave, wave, and brave all end in "-ave".`, `wave`, `cove`, `cure`, `cave ≈ ?`],
    [2, `How many syllables (beats) are in "elephant"?`, `Clap it out: el - e - phant. That is 3 claps!`, `3`, `2`, `4`, `el · e · phant`],
    [3, `How many syllables (beats) are in "fantastic"?`, `Clap it out: fan - tas - tic. That is 3 claps!`, `3`, `2`, `4`, `fan · tas · tic`],
    [3, `Which word has a SILENT "g"?`, `The "g" stays quiet in the words gnat and sign.`, `sign`, `giant`, `grape`, `g...`],
    [3, `Which word has a SILENT "h" at the start?`, `The "h" is quiet in hour.`, `hour`, `horse`, `happy`, `h...`],
    [4, `How many syllables (beats) are in "magnificent"?`, `Clap it out: mag - nif - i - cent. That is 4 claps!`, `4`, `3`, `5`, `mag · nif · i · cent`],
    [4, `Which word has a SILENT "t"?`, `The "t" is quiet in castle.`, `castle`, `table`, `tiger`, `t...`],
    [2, `Which word has the same vowel sound as "boat"?`, `Boat has the long "o" sound, like in "road".`, `road`, `hot`, `book`, `boat ≈ ?`]
  ]),

  wordparts: B([
    [2, `What does the prefix "un-" mean in "unhappy"?`, `The prefix un- means "not": unhappy = not happy.`, `not`, `again`, `before`, `un- = ?`],
    [2, `What does the prefix "re-" mean in "retry"?`, `The prefix re- means "again": retry = try again.`, `again`, `not`, `without`, `re- = ?`],
    [2, `Which word means "without hope"?`, `The suffix -less means "without".`, `hopeless`, `hopeful`, `rehope`, `hope + ?`],
    [2, `What word do you get when you join "sun" + "flower"?`, `Two small words joined together make a compound word.`, `sunflower`, `flowersun`, `sunsflower`, `sun + flower`],
    [3, `What does the suffix "-ful" mean in "careful"?`, `The suffix -ful means "full of": careful = full of care.`, `full of`, `without`, `not`, `-ful = ?`],
    [3, `What does the prefix "pre-" mean in "preview"?`, `The prefix pre- means "before": a preview is a look before.`, `before`, `after`, `again`, `pre- = ?`],
    [4, `Which prefix makes the OPPOSITE of "possible"?`, `im- means "not". It replaces in- before p, b and m: impossible.`, `im-`, `un-`, `re-`, `___ + possible`],
    [4, `What is the ROOT (base) word in "unbelievable"?`, `Take off the prefix un- and the suffix -able.`, `believe`, `unbeliev`, `able`, `un · believe · able`],
    [4, `What does the prefix "dis-" mean in "disappear"?`, `The prefix dis- means "not" or "the opposite of".`, `the opposite of`, `again`, `before`, `dis- = ?`],
    [5, `What does the suffix "-able" mean in "washable"?`, `The suffix -able means "can be done": washable = can be washed.`, `can be done`, `full of`, `without`, `-able = ?`],
    [5, `The word "biography" has the root "bio". What does "bio" mean?`, `Bio means life — a biography tells the story of a life.`, `life`, `water`, `light`, `bio = ?`],
    [2, `Which word means "not kind"?`, `The prefix un- means "not": un + kind.`, `unkind`, `rekind`, `kindful`, `un + kind`],
    [2, `Which word means "to write again"?`, `The prefix re- means "again".`, `rewrite`, `unwrite`, `prewrite`, `re + write`],
    [2, `What word do you get when you join "rain" + "bow"?`, `Two small words joined together make a compound word.`, `rainbow`, `bowrain`, `rainsbow`, `rain + bow`],
    [3, `Which word means "full of joy"?`, `The suffix -ful means "full of".`, `joyful`, `joyless`, `rejoy`, `joy + ?`],
    [3, `What does the suffix "-er" mean in "teacher"?`, `The suffix -er can mean "a person who does something".`, `a person who does it`, `not`, `again`, `-er = ?`],
    [3, `What does the prefix "mis-" mean in "misread"?`, `The prefix mis- means "wrongly".`, `wrongly`, `again`, `before`, `mis- = ?`],
    [4, `What does the prefix "trans-" mean in "transport"?`, `Trans- means "across": to transport is to carry across.`, `across`, `under`, `before`, `trans- = ?`],
    [4, `What does the prefix "sub-" mean in "submarine"?`, `Sub- means "under": a submarine travels under the sea.`, `under`, `above`, `again`, `sub- = ?`],
    [4, `What does the suffix "-ology" mean in "biology"?`, `-ology means "the study of": biology = the study of life.`, `the study of`, `full of`, `without`, `-ology = ?`],
    [5, `What does the prefix "inter-" mean in "international"?`, `Inter- means "between": international = between nations.`, `between`, `under`, `against`, `inter- = ?`]
  ]),

  reading: B([
    [1, `What does Pip love to eat?`, `Look at the second sentence.`, `apples`, `carrots`, `fish`, `📖`, `Mia has a small green dragon named Pip. Pip loves to eat apples. Every morning, Mia gives Pip two red apples.`],
    [1, `Where did Leo splash?`, `Read the last sentence again.`, `in a big puddle`, `in the lake`, `in the bath`, `📖`, `The sun came up. Leo put on his boots and ran outside. He splashed in a big puddle.`],
    [2, `Why did the dragon light a small fire?`, `The second sentence tells you why.`, `to warm the cave`, `to cook dinner`, `to scare a knight`, `📖`, `A dragon's cave was cold and dark. The dragon lit a small fire to warm the cave. Soon the walls glowed orange.`],
    [2, `What did Ana do right after mixing the flour and eggs?`, `The word "Next" tells you what came second.`, `poured the batter into a pan`, `baked it for twenty minutes`, `ate the cake`, `📖`, `First, Ana mixed the flour and eggs. Next, she poured the batter into a pan. Last, she baked it for twenty minutes.`],
    [2, `How did Sam feel at first?`, `The first sentence tells you.`, `nervous`, `angry`, `sleepy`, `📖`, `Sam was nervous. His hands shook as he walked on stage. Then he took a deep breath and began to sing.`],
    [3, `What was the weather probably like?`, `An umbrella and a raincoat keep you dry in rain.`, `rainy`, `sunny`, `snowy`, `📖`, `Ravi grabbed his umbrella and a raincoat before leaving. He zipped up his boots.`],
    [3, `What is the main idea of this passage?`, `The main idea is what the WHOLE passage is mostly about.`, `Bees help plants make seeds by carrying pollen.`, `Bees are black and yellow.`, `Flowers grow in gardens.`, `📖`, `Bees visit flowers to drink nectar. As they move from flower to flower, pollen sticks to their legs and falls onto other flowers. This helps plants make seeds.`],
    [3, `What happened AFTER the storm?`, `The word "After" tells you the last part of the story.`, `The farmer opened the barn door.`, `The farmer brought the cows inside.`, `The wind shook the roof.`, `📖`, `Before the storm, the farmer brought the cows into the barn. During the storm, the wind shook the roof. After the storm, the sun came out and the farmer opened the barn door.`],
    [4, `What does "fragile" mean in this passage?`, `Clue: the wood began to crack under the heavy truck.`, `easily broken`, `very long`, `brightly painted`, `📖`, `The old bridge was fragile. When the heavy truck rolled onto it, the wood began to crack.`],
    [4, `Why could the children not walk to school?`, `Look for the word "Because".`, `The flooded road was covered with water.`, `The teacher was sick.`, `It was a holiday.`, `📖`, `Because the river flooded, the village road was covered with water. The children could not walk to school, so the teacher brought lessons to the village hall.`],
    [4, `What had Priya probably been doing?`, `Dirty hands and a sprout in a pot are clues.`, `planting a seed`, `baking bread`, `painting a wall`, `📖`, `Priya's hands were full of dirt. A tiny green sprout poked up from the pot, and she smiled proudly.`],
    [4, `Which word best describes Zara?`, `She did the right thing even when nobody was watching.`, `honest`, `greedy`, `careless`, `📖`, `Zara found a wallet on the street. Even though no one was watching, she took it to the police station so the owner could get it back.`],
    [4, `Which sentence best tells the main idea?`, `Look for the idea that covers ALL the sentences.`, `Octopuses are clever problem-solvers.`, `Octopuses live in jars.`, `Scientists build tanks.`, `📖`, `Octopuses are very clever. In labs they have opened jars to get food, and some have escaped from tanks by squeezing through tiny gaps. Scientists believe octopuses can solve simple puzzles.`],
    [3, `What lesson does this story teach?`, `The last sentence often tells you the lesson.`, `Practice and effort can lead to success.`, `Racing is dangerous.`, `Winning is only luck.`, `📖`, `Tom kept losing the race, but he practiced every day. After many weeks, he finally crossed the finish line first. He learned that hard work pays off.`],
    [5, `What is the author's main purpose?`, `The last sentence tries to convince readers to change what they do.`, `to persuade readers to use cloth bags`, `to teach how to sew cloth bags`, `to describe how turtles swim`, `📖`, `Plastic bags can take hundreds of years to break down. Many end up in the ocean, where sea turtles mistake them for jellyfish and eat them. Using cloth bags helps protect ocean animals.`],
    [1, `What did the kite do?`, `Read the second sentence.`, `flew high in the sky`, `fell in the lake`, `got stuck in a tree`, `📖`, `Max has a red kite. The wind was strong, so the kite flew high in the sky. Max held the string tight.`],
    [1, `Where did Nina put the pot?`, `Look at the second sentence.`, `near the window`, `under the bed`, `outside in the snow`, `📖`, `Nina plants a seed in a pot. She gives it water and puts it near the window. After a week, a tiny green leaf appears.`],
    [2, `Why did Mia like the monkeys best?`, `Look for the word "because".`, `They were funny.`, `They were sleepy.`, `They were very tall.`, `📖`, `The class went on a trip to the zoo. They saw giraffes, monkeys, and a sleepy lion. Mia liked the monkeys best because they were funny.`],
    [2, `What happened when Dev got to the bus stop?`, `Read the second sentence carefully.`, `The bus had already left.`, `The bus was waiting.`, `It started to rain.`, `📖`, `Dev was late for school. He ran to the bus stop, but the bus had already left. He walked the rest of the way.`],
    [3, `What do tadpoles use to breathe?`, `The passage says tadpoles breathe with something.`, `gills`, `lungs`, `wings`, `📖`, `Frogs lay eggs in water. The eggs hatch into tadpoles, which live in water and breathe with gills. Later the tadpoles grow legs, lose their tails, and become frogs that breathe air.`],
    [2, `Why did Kai whisper?`, `The last sentence tells you why.`, `He did not want to disturb the other readers.`, `He was sick.`, `He wanted to sing.`, `📖`, `The library was very quiet. Kai tiptoed to the shelf and whispered to his friend. He did not want to disturb the other readers.`],
    [4, `How did Sara probably feel about her score?`, `She worked hard and grinned from ear to ear.`, `proud and happy`, `upset and worried`, `bored`, `📖`, `Sara studied every night for two weeks. On the day of the spelling test, she wrote each word carefully. When the teacher handed back the papers, Sara grinned from ear to ear.`],
    [4, `Why did sailors look for the North Star?`, `The passage says it stays in the same place.`, `It helped them find their direction.`, `It was the brightest thing in the day.`, `It told them the time of year.`, `📖`, `A long time ago, people used the stars to find their way at night. Sailors looked for the North Star, which always stays in the same place in the sky.`],
    [4, `Why does the arctic hare's fur turn white in winter?`, `Look at what the white fur helps the hare do.`, `to blend in with the snow`, `to stay cool`, `to look bigger`, `📖`, `Some animals, like the arctic hare, grow white fur in winter. The white fur helps them blend in with the snow, so hungry foxes find them harder to see. In summer, their fur turns brown again.`],
    [5, `What does "controversial" mean in this passage?`, `Some experts agreed, others disagreed — what kind of word fits?`, `causing disagreement`, `boring and long`, `easy to prove`, `📖`, `The scientist's findings were controversial. Some experts agreed with her, while others strongly disagreed.`]
  ]),

  sci_life: B([
    [1, `Which part of a plant takes in water from the soil?`, `Roots grow underground and drink up water.`, `roots`, `leaves`, `flower`, `🌱 ➜ 💧`],
    [1, `Which animal is a mammal?`, `Mammals breathe air and feed their babies milk.`, `dolphin`, `shark`, `frog`, `🐬  🦈  🐸`],
    [1, `Which body part do we use to hear?`, `Sounds travel into your ears.`, `ears`, `eyes`, `nose`, `👂`],
    [1, `What do plants need to make their own food?`, `Plants use sunlight, water, and air (carbon dioxide).`, `sunlight, water and air`, `only soil and rocks`, `milk and sugar`, `☀️ + 💧 + 💨`],
    [2, `What is the correct order of a butterfly's life cycle?`, `It starts as an egg, hatches into a caterpillar, makes a chrysalis, then becomes a butterfly.`, `egg, caterpillar, chrysalis, butterfly`, `egg, chrysalis, caterpillar, butterfly`, `caterpillar, egg, butterfly, chrysalis`, `🥚 ➜ 🐛 ➜ ❓ ➜ 🦋`],
    [2, `In the food chain grass ➜ rabbit ➜ fox, which one is the PRODUCER?`, `Producers make their own food — plants do that using sunlight!`, `grass`, `rabbit`, `fox`, `🌿 ➜ 🐇 ➜ 🦊`],
    [2, `What do we call an animal that eats only plants?`, `Herbivores love leaves, grass, and fruit.`, `herbivore`, `carnivore`, `omnivore`, `🐄  🌿`],
    [2, `Which animal is a reptile?`, `Reptiles have dry, scaly skin and lay eggs on land.`, `turtle`, `frog`, `whale`, `🐢  🐸  🐋`],
    [2, `What is the main job of your heart?`, `Your heart is a strong muscle that pumps blood around your body.`, `pump blood around the body`, `digest your food`, `help you hear`, `❤️`],
    [2, `Which animal group has feathers and lays eggs?`, `All birds have feathers.`, `birds`, `mammals`, `fish`, `🐦`],
    [3, `Animals that eat both plants and animals are called…`, `Omni means "all" — omnivores eat all kinds of food.`, `omnivores`, `herbivores`, `carnivores`, `🐻  🍓  🐟`],
    [3, `Which of these helps a polar bear stay warm in the Arctic?`, `A thick layer of fat and fur keeps heat in.`, `thick fur and a layer of fat`, `long wings`, `sharp gills`, `🐻  ❄️`],
    [4, `Which gas do plants take IN from the air to make food?`, `Plants "breathe in" carbon dioxide and give out oxygen.`, `carbon dioxide`, `oxygen`, `helium`, `🌿 + CO₂`],
    [4, `Which part of a flower grows into the fruit?`, `After pollination, the ovary swells up into a fruit that holds the seeds.`, `ovary`, `petal`, `stem`, `🌸 ➜ 🍎`],
    [4, `Why do some animals hibernate in winter?`, `Food is hard to find in winter, so they sleep and save energy.`, `to save energy when food is scarce`, `to find more food`, `to grow wings`, `🐻 💤`],
    [5, `Which part of a plant cell is stiff and gives the plant its shape?`, `Plant cells have a strong cell wall outside the cell membrane.`, `cell wall`, `nucleus`, `cytoplasm`, `🔬 🌿`],
    [5, `What is the green substance in leaves that captures sunlight?`, `Chlorophyll gives leaves their green look and traps sunlight.`, `chlorophyll`, `nectar`, `pollen`, `🍃`],
    [1, `What do we call a baby frog?`, `A baby frog lives in water and is called a tadpole.`, `tadpole`, `chick`, `calf`, `🐸 ➜ ?`],
    [1, `Which animal lives in water and breathes with gills?`, `Fish use gills to take oxygen from water.`, `fish`, `dog`, `bird`, `🐟`],
    [2, `What is the job of a plant's stem?`, `The stem holds the plant up and carries water to the leaves.`, `holds the plant up and carries water`, `makes seeds`, `soaks up sunlight`, `🌱`],
    [2, `Which of these is NOT a living thing?`, `Living things grow, need food, and have babies.`, `a rock`, `a tree`, `a worm`, `🪨  🌳  🪱`],
    [3, `What do bees carry from flower to flower that helps plants make seeds?`, `Pollen sticks to bees and gets carried to other flowers.`, `pollen`, `water`, `soil`, `🐝 🌸`],
    [3, `Frogs, toads and newts belong to which animal group?`, `Amphibians begin life in water and later live on land.`, `amphibians`, `reptiles`, `mammals`, `🐸`],
    [3, `What is a habitat?`, `A habitat is the place where a plant or animal lives.`, `the place where a plant or animal lives`, `a kind of food`, `a baby animal`, `🏞️`],
    [4, `Which part of the body carries messages to the brain?`, `Nerves carry signals between the body and the brain.`, `nerves`, `bones`, `muscles`, `🧠`],
    [4, `What do we call animals without a backbone, like insects and spiders?`, `Invertebrates have no backbone.`, `invertebrates`, `vertebrates`, `mammals`, `🕷️  🐛`],
    [4, `What is the process of plants making food using sunlight called?`, `Photosynthesis means "making with light".`, `photosynthesis`, `evaporation`, `digestion`, `🌿 ☀️`],
    [5, `Which blood cells carry oxygen around the body?`, `Red blood cells carry oxygen.`, `red blood cells`, `white blood cells`, `platelets`, `🩸`],
    [5, `In an ecosystem, what do decomposers like fungi do?`, `Decomposers break down dead plants and animals and return nutrients to the soil.`, `break down dead things into nutrients`, `make food from sunlight`, `hunt other animals`, `🍄`]
  ]),

  sci_earth: B([
    [1, `Which planet do we live on?`, `We live on the third planet from the Sun.`, `Earth`, `Mars`, `Venus`, `🌍`],
    [1, `What gives Earth light and heat during the day?`, `The Sun is a giant star that lights and warms Earth.`, `the Sun`, `the Moon`, `a cloud`, `☀️`],
    [2, `Which planet is known as the Red Planet?`, `Rusty dust makes Mars look red.`, `Mars`, `Venus`, `Jupiter`, `🔴  🪐`],
    [2, `How long does Earth take to travel once around the Sun?`, `One trip around the Sun is one year.`, `one year`, `one day`, `one month`, `🌍 ➜ ☀️`],
    [2, `What causes day and night?`, `Earth spins around once a day. Our side faces the Sun, then turns away.`, `Earth spinning on its axis`, `the Sun moving around Earth`, `clouds covering the Sun`, `🌍 🔄`],
    [2, `Which planet has famous bright rings?`, `Saturn's rings are made of ice and rock.`, `Saturn`, `Earth`, `Mercury`, `🪐`],
    [3, `Which is the largest planet in our solar system?`, `Jupiter is a gas giant, bigger than all the other planets put together.`, `Jupiter`, `Saturn`, `Earth`, `🪐`],
    [3, `Which planet is closest to the Sun?`, `Mercury is the smallest planet and the closest to the Sun.`, `Mercury`, `Venus`, `Mars`, `☀️  ☿`],
    [3, `When water vapor cools and turns into tiny droplets that form clouds, it is called…`, `Condensation is when a gas turns back into a liquid.`, `condensation`, `evaporation`, `precipitation`, `💨 ➜ ☁️`],
    [3, `What do we call water falling from clouds as rain, snow or hail?`, `Precipitation means water falling from the sky.`, `precipitation`, `evaporation`, `condensation`, `☁️ ➜ 🌧️`],
    [3, `Which layer of Earth do we live on?`, `The crust is Earth's thin, rocky outer layer.`, `the crust`, `the core`, `the mantle`, `🌍`],
    [3, `What is the name of the galaxy our solar system is in?`, `Our solar system sits inside the Milky Way galaxy.`, `the Milky Way`, `Andromeda`, `the Big Dipper`, `🌌`],
    [4, `What causes the seasons on Earth?`, `Earth is tilted. As it orbits the Sun, different parts get more direct sunlight.`, `Earth's tilt as it orbits the Sun`, `Earth moving closer to and farther from the Sun`, `the Moon blocking the Sun`, `🌍 ↗ ☀️`],
    [4, `Which type of rock forms from cooled lava or magma?`, `Igneous comes from a word meaning "fire".`, `igneous`, `sedimentary`, `metamorphic`, `🌋 ➜ 🪨`],
    [4, `Why does the Moon seem to change shape (phases)?`, `The Moon orbits Earth, so we see different amounts of its sunlit side.`, `we see different amounts of its sunlit side`, `Earth's shadow covers it each night`, `it makes its own light that changes`, `🌑 🌓 🌕`],
    [4, `Which is a renewable source of energy?`, `Renewable energy never runs out — like sunlight and wind.`, `solar power`, `coal`, `oil`, `☀️ ⚡`],
    [5, `About how long does light from the Sun take to reach Earth?`, `Sunlight is very fast, but the Sun is far away: about 8 minutes.`, `about 8 minutes`, `about 8 seconds`, `about 8 hours`, `☀️ ➜ 🌍`],
    [1, `What shape is the Earth?`, `Earth is shaped like a ball (a sphere).`, `a sphere (ball)`, `a cube`, `a flat disc`, `🌍`],
    [2, `Which is the closest star to Earth?`, `The Sun is a star — and the closest one to us.`, `the Sun`, `the North Star`, `the Moon`, `⭐ ☀️`],
    [2, `What do we call the blanket of gases around Earth?`, `The atmosphere is the layer of air around Earth.`, `the atmosphere`, `the ocean`, `the crust`, `🌍 💨`],
    [2, `In which direction does the Sun rise?`, `The Sun rises in the east and sets in the west.`, `east`, `west`, `north`, `🌅`],
    [3, `What is the very hot center of Earth called?`, `The core is the hot center of Earth.`, `the core`, `the crust`, `the atmosphere`, `🌍 🔥`],
    [3, `What do we call a huge ball of hot, glowing gas like the Sun?`, `A star is a giant ball of hot, glowing gas.`, `a star`, `a planet`, `a moon`, `☀️`],
    [3, `What is a shaking of the ground caused by moving plates in Earth's crust?`, `Earthquakes happen when giant pieces of crust (plates) move.`, `an earthquake`, `a tornado`, `a flood`, `🌍 〰`],
    [4, `In which layer of the atmosphere does our weather happen?`, `The troposphere is the lowest layer, where clouds and weather are.`, `the troposphere`, `the stratosphere`, `the mesosphere`, `🌥️`],
    [4, `What force keeps the planets orbiting the Sun?`, `The Sun's gravity pulls on the planets and keeps them in orbit.`, `gravity`, `friction`, `magnetism`, `☀️ 🪐`],
    [5, `A piece of space rock that has landed on Earth's surface is called…`, `A rock that survives the fall through the air and lands on Earth is called a meteorite.`, `a meteorite`, `a comet`, `an asteroid`, `🌠 ➜ 🌍`],
    [5, `What do we call the curved path of a planet around the Sun?`, `An orbit is the curved path of one object around another.`, `an orbit`, `a rotation`, `an axis`, `🪐 ⭕`]
  ]),

  sci_matter: B([
    [1, `What happens to ice when it gets warm?`, `Heat melts ice — a solid — into liquid water.`, `it melts into water`, `it turns into rock`, `it turns into gas instantly`, `🧊 ➜ 💧`],
    [2, `Steam (water vapor) is which state of matter?`, `Steam is water in gas form.`, `gas`, `solid`, `liquid`, `💨`],
    [2, `Which of these is a SOLID?`, `A solid keeps its own shape.`, `a brick`, `juice`, `steam`, `🧱`],
    [2, `Magnets attract objects made of which material?`, `Magnets stick to iron and steel.`, `iron`, `plastic`, `wood`, `🧲`],
    [3, `Which force pulls objects toward the ground?`, `Gravity pulls things down toward Earth.`, `gravity`, `friction`, `magnetism`, `🍎 ⬇`],
    [3, `When two NORTH poles of magnets are brought together, they…`, `Like poles repel — they push away from each other.`, `push apart (repel)`, `pull together (attract)`, `do nothing`, `🧲 N ↔ N`],
    [3, `Which material is a good electrical conductor?`, `Metals like copper let electricity flow easily.`, `copper wire`, `rubber`, `wood`, `🔌`],
    [3, `Rubbing your hands together makes them warm because of…`, `Friction between two surfaces makes heat.`, `friction`, `gravity`, `magnetism`, `🙌 🔥`],
    [3, `Which simple machine is a ramp?`, `A ramp is a slanted surface, called an inclined plane.`, `inclined plane`, `lever`, `pulley`, `📐`],
    [4, `Sound is made when objects…`, `Sound comes from vibrations — fast back-and-forth movements.`, `vibrate`, `freeze`, `melt`, `🔔 〰`],
    [4, `A seesaw is an example of which simple machine?`, `A seesaw turns on a pivot — that is a lever.`, `lever`, `wheel and axle`, `screw`, `⚖️`],
    [4, `Mixing sugar into water until you can no longer see it is called…`, `The sugar dissolves and makes a solution.`, `dissolving`, `burning`, `rusting`, `🍬 ➜ 💧`],
    [4, `Which energy change happens in a lit light bulb?`, `A bulb turns electrical energy into light (and some heat).`, `electrical energy into light and heat`, `light into sound`, `sound into electricity`, `💡`],
    [5, `Which of these is a CHEMICAL change?`, `In a chemical change a NEW substance forms — iron rusting makes iron oxide.`, `iron rusting`, `ice melting`, `paper being cut`, `🔩 ➜ 🟤`],
    [3, `At sea level, water boils at about…`, `Water boils at 100 °C (212 °F).`, `100 °C`, `50 °C`, `0 °C`, `🌡️ 💧`],
    [1, `Which of these is a LIQUID?`, `A liquid flows and takes the shape of its container.`, `milk`, `a rock`, `a pencil`, `🥛`],
    [1, `What do we call water that is frozen?`, `Frozen water is ice, a solid.`, `ice`, `steam`, `rain`, `🧊`],
    [2, `What happens to water when it boils?`, `Boiling water turns into water vapor (a gas).`, `it turns into steam (gas)`, `it turns into ice`, `it turns into a rock`, `🫖 ♨️`],
    [2, `Which tool do we use to measure temperature?`, `A thermometer measures how hot or cold something is.`, `a thermometer`, `a ruler`, `a clock`, `🌡️`],
    [3, `Which tool measures mass (how heavy something is)?`, `A balance or scale measures mass.`, `a balance (scale)`, `a thermometer`, `a ruler`, `⚖️`],
    [3, `Which of these materials is a good INSULATOR of heat?`, `Insulators, like wool and foam, do not let heat travel through easily.`, `wool`, `copper`, `iron`, `🧶`],
    [3, `What happens when you pour oil into water?`, `Oil is lighter than water, so it floats on top and does not mix.`, `the oil floats on top`, `they mix completely`, `they turn into gas`, `🛢️ 💧`],
    [4, `Which is an example of a mixture?`, `In a mixture the parts can be separated, like salad or trail mix.`, `a fruit salad`, `a drop of pure water`, `a bar of pure gold`, `🥗`],
    [4, `What force slows down a box sliding across the floor?`, `Friction between the box and the floor slows it down.`, `friction`, `gravity`, `magnetism`, `📦 ➡`],
    [4, `A stretched rubber band has which type of energy stored in it?`, `A stretched rubber band stores potential (stored) energy.`, `potential (stored) energy`, `sound energy`, `light energy`, `🪢`],
    [5, `What unit is used to measure force?`, `Force is measured in newtons (N).`, `newton`, `litre`, `gram`, `⚙️`],
    [5, `Which of these is a PHYSICAL change?`, `In a physical change no new substance forms — freezing water is still water.`, `water freezing into ice`, `wood burning`, `milk going sour`, `🧊`]
  ])
};

function genFromBank(kind, t) {
  const rows = BANK[kind];
  const w = rows.map(r => { const dd = Math.abs(r.d - t); return dd === 0 ? 4 : dd === 1 ? 2 : dd === 2 ? 0.4 : 0.05; });
  let x = _rng() * w.reduce((a, b) => a + b, 0), idx = 0;
  for (; idx < rows.length - 1; idx++) { x -= w[idx]; if (x <= 0) break; }
  const it = rows[idx];
  return {
    topic: KIND_META[kind].topic,
    prompt: it.q,
    hint: it.h,
    correct: it.a,
    choices: shuffle([it.a, it.w1, it.w2]),
    draw: ctx => drawBig(ctx, it.big, KIND_META[kind].icon),
    passage: it.passage || '',
    itemId: `${kind}:${idx}`,
    meta: { bank: true, kind, idx }
  };
}

function genSciMatter(t) {
  if (rand(0, 3) === 0) {
    const closed = rand(0, 1) === 1;
    const yes = ['Yes — the loop is closed ⚡', 'No — there is a gap in the wire ✂️', 'No — the battery is too big 🔋'];
    const no = ['No — there is a gap in the wire ✂️', 'Yes — electricity can jump across gaps ⚡', 'Yes — a lamp always glows 💡'];
    return {
      topic: '⚡ REDSTONE CIRCUIT LAB',
      prompt: 'Will the Redstone Dragon Lamp glow?',
      hint: closed ? 'Electricity flows only around a CLOSED loop with no gaps — this loop is complete!' : 'Electricity can only flow around a CLOSED loop. This wire has a gap, so the lamp stays dark!',
      correct: closed ? yes[0] : no[0],
      choices: shuffle(closed ? yes : no),
      draw: ctx => drawCircuit(ctx, closed),
      itemId: `circuit:${closed ? 1 : 0}`,
      meta: { bank: false, op: 'circuit', closed }
    };
  }
  return genFromBank('sci_matter', t);
}

// ============================================================================
// KIND REGISTRY
// ============================================================================
const KIND_META = {
  mult: { cat: 'Multiplication', subj: 'Math', icon: '✖️' },
  div: { cat: 'Division', subj: 'Math', icon: '➗' },
  addsub: { cat: 'Add & Subtract', subj: 'Math', icon: '➕' },
  algebra: { cat: 'Algebra (find the unknown)', subj: 'Math', icon: '⚖️' },
  frac: { cat: 'Fractions', subj: 'Math', icon: '🍰' },
  area: { cat: 'Area & Perimeter', subj: 'Math', icon: '📐' },
  place: { cat: 'Place Value & Rounding', subj: 'Math', icon: '🔢' },
  clock: { cat: 'Telling Time', subj: 'Math', icon: '🕰️' },
  pattern: { cat: 'Number Patterns', subj: 'Math', icon: '🔁' },
  sci_life: { cat: 'Science: Life', subj: 'Science', icon: '🌿', topic: '🌿 LIFE SCIENCE LAB' },
  sci_earth: { cat: 'Science: Earth & Space', subj: 'Science', icon: '🪐', topic: '🪐 EARTH & SPACE LAB' },
  sci_matter: { cat: 'Science: Matter & Energy', subj: 'Science', icon: '🔬', topic: '🔬 MATTER & ENERGY LAB' },
  vocab: { cat: 'Vocabulary', subj: 'English', icon: '📖', topic: '📖 WORD WIZARD' },
  spelling: { cat: 'Spelling', subj: 'English', icon: '✏️', topic: '✏️ SPELLING SPELL' },
  grammar: { cat: 'Grammar & Usage', subj: 'English', icon: '🧩', topic: '🧩 GRAMMAR GROVE' },
  punct: { cat: 'Punctuation & Capitals', subj: 'English', icon: '❗', topic: '❗ PUNCTUATION POTION' },
  phonics: { cat: 'Phonics & Rhymes', subj: 'English', icon: '🎵', topic: '🎵 RHYME TIME' },
  wordparts: { cat: 'Word Parts', subj: 'English', icon: '🧱', topic: '🧱 WORD BUILDER' },
  reading: { cat: 'Reading Comprehension', subj: 'English', icon: '📜', topic: '📜 DRAGON LIBRARY' }
};
const MATH_KINDS = ['mult', 'div', 'addsub', 'algebra', 'frac', 'area', 'place', 'clock', 'pattern'];
const SCIENCE_KINDS = ['sci_life', 'sci_earth', 'sci_matter'];
const ENGLISH_KINDS = ['vocab', 'spelling', 'grammar', 'punct', 'phonics', 'wordparts', 'reading'];
const ALL_KINDS = [...MATH_KINDS, ...SCIENCE_KINDS, ...ENGLISH_KINDS];

const GENERATORS = {
  mult: genMult, div: genDiv, addsub: genAddSub, algebra: genAlgebra, frac: genFrac,
  area: genArea, place: genPlace, clock: genClock, pattern: genPattern,
  sci_life: t => genFromBank('sci_life', t), sci_earth: t => genFromBank('sci_earth', t), sci_matter: genSciMatter,
  vocab: t => genFromBank('vocab', t), spelling: t => genFromBank('spelling', t), grammar: t => genFromBank('grammar', t),
  punct: t => genFromBank('punct', t), phonics: t => genFromBank('phonics', t), wordparts: t => genFromBank('wordparts', t),
  reading: t => genFromBank('reading', t)
};

// Old category names (from earlier versions) -> current names, so saved progress carries over
const LEGACY_CATS = {
  'Area & Geometry': 'Area & Perimeter',
  'Science: circuits': 'Science: Matter & Energy',
  'Science: states of matter': 'Science: Matter & Energy',
  'Vocabulary: synonyms': 'Vocabulary',
  'Vocabulary: opposites': 'Vocabulary',
  'Grammar: plurals': 'Grammar & Usage',
  'Grammar: parts of speech': 'Grammar & Usage',
  'Grammar: usage': 'Grammar & Usage',
  'Phonics: rhymes': 'Phonics & Rhymes'
};

function validateChallenge(c) {
  if (!c || typeof c.prompt !== 'string' || !c.prompt.trim()) return false;
  if (typeof c.hint !== 'string' || !c.hint.trim()) return false;
  if (typeof c.correct !== 'string' || !c.correct) return false;
  if (!Array.isArray(c.choices) || c.choices.length !== 3) return false;
  if (new Set(c.choices).size !== 3) return false;
  if (!c.choices.includes(c.correct)) return false;
  if (c.choices.some(x => typeof x !== 'string' || !x.trim())) return false;
  if (typeof c.draw !== 'function') return false;
  const text = [c.prompt, c.hint, c.passage || '', ...c.choices].join('|');
  return !/NaN|undefined|Infinity|\[object/.test(text);
}

function fallbackChallenge(kind) {
  const a = 3, b = 4;
  return {
    topic: '⚡ VOXEL POWER ARRAY',
    prompt: `Count the Dragon Energy Cubes: ${a} rows of ${b} cubes! (${a} × ${b} = ?)`,
    hint: `Add the rows: ${b} + ${b} + ${b} = ${a * b}!`,
    correct: String(a * b),
    choices: ['12', '10', '14'],
    draw: ctx => drawArray(ctx, a, b),
    meta: { op: 'mult', a, b }
  };
}

let QUESTION_FAILURES = 0;
function buildChallenge(spec) {
  const kind = ALL_KINDS.includes(spec.kind) ? spec.kind : 'mult';
  const tier = Math.max(1, Math.min(5, Math.round(spec.tier || 3)));
  const seed = spec.seed >>> 0;
  let ch = null, used = seed;
  for (let i = 0; i < 8 && !ch; i++) {
    seedRng(seed + i);
    try {
      const c = GENERATORS[kind](tier);
      if (validateChallenge(c)) { ch = c; used = (seed + i) >>> 0; }
      else QUESTION_FAILURES++;
    } catch (e) {
      QUESTION_FAILURES++;
      if (typeof console !== 'undefined') console.warn('question generator error', kind, tier, e && e.message);
    }
  }
  _rng = Math.random;
  if (!ch) ch = fallbackChallenge(kind);
  const meta = KIND_META[kind];
  ch.kind = kind;
  ch.cat = meta.cat;
  ch.subj = meta.subj;
  ch.tier = tier;
  ch.seed = used;
  ch.passage = ch.passage || '';
  ch.sig = `${ch.kind}|${ch.prompt}|${ch.passage}|${ch.correct}|${[...ch.choices].sort().join(',')}`;
  return ch;
}
