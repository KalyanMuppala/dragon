// ============================================================================
// DragonCraft — Friend Duels (2 players, no server, no strangers).
// Two devices connect directly (WebRTC) by swapping a short text code over
// WhatsApp / iMessage. Both get the same 5 questions; first to answer right is
// faster, wrong answers cost points (in the duel AND the usual game penalty).
// ============================================================================
const DUEL_ROUNDS = 5;
class Duel {
  constructor(game) {
    this.g = game; this.$ = id => document.getElementById(id);
    this.reset();
    this.$('btnDuel').addEventListener('click', () => this.open());
    this.$('duelClose').addEventListener('click', () => this.close());
    this.$('duelHost').addEventListener('click', () => this.host());
    this.$('duelJoin').addEventListener('click', () => this.join());
    this.$('duelAccept').addEventListener('click', () => this.acceptAnswer());
    this.$('duelCopy').addEventListener('click', () => this.copy());
    this.$('duelStart').addEventListener('click', () => this.startMatch());
  }
  reset() {
    try { if (this.pc) this.pc.close(); } catch (e) {}
    this.pc = null; this.ch = null; this.role = ''; this.rounds = []; this.i = -1;
    this.me = 0; this.opp = 0; this.mine = null; this.theirs = null; this.oppName = 'Friend'; this.active = false; this.locked = true;
  }
  show(id) { ['duelLobby', 'duelCode', 'duelPlay', 'duelEnd'].forEach(x => this.$(x).classList.toggle('hidden', x !== id)); }
  open() {
    if (this.g.mode !== 'WORLD') return;
    this.reset(); this.show('duelLobby'); this.say('Duel a friend! Both of you open the game, then swap codes by text message.');
    this.$('duelOverlay').classList.remove('hidden');
  }
  close() { this.reset(); this.$('duelOverlay').classList.add('hidden'); this.g.stopSpeaking && this.g.stopSpeaking(); }
  say(t) { this.$('duelStatus').textContent = t; }
  vis() { return !this.$('duelOverlay').classList.contains('hidden'); }

  // ---------- connection (manual signalling) ----------
  mkPc() {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.pc.onconnectionstatechange = () => { if (this.pc && ['failed', 'disconnected'].includes(this.pc.connectionState) && this.active) this.say('Connection lost 😕'); };
  }
  gathered() {
    return new Promise(res => {
      if (this.pc.iceGatheringState === 'complete') return res();
      const t = setTimeout(res, 5000);
      this.pc.addEventListener('icegatheringstatechange', () => { if (this.pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
    });
  }
  enc(d) { return btoa(unescape(encodeURIComponent(JSON.stringify({ t: d.type, s: d.sdp })))); }
  dec(s) { const o = JSON.parse(decodeURIComponent(escape(atob(s.trim())))); return { type: o.t, sdp: o.s }; }
  async host() {
    try {
      this.reset(); this.role = 'host'; this.mkPc();
      this.attach(this.pc.createDataChannel('duel'));
      await this.pc.setLocalDescription(await this.pc.createOffer());
      await this.gathered();
      this.showCode(this.enc(this.pc.localDescription), '1) Send this code to your friend.  2) Paste THEIR reply code below, then tap Connect.', true);
    } catch (e) { this.say('Could not start: ' + e.message); }
  }
  async join() {
    const code = this.$('duelPaste').value.trim();
    if (!code) { this.show('duelCode'); this.$('duelCodeBox').value = ''; this.say("Paste your friend's code below, then tap Join again."); this.$('duelAccept').classList.add('hidden'); this.$('duelCopy').classList.add('hidden'); this.$('duelPasteRow').classList.remove('hidden'); this.joining = true; return; }
    try {
      this.reset(); this.role = 'join'; this.mkPc();
      this.pc.ondatachannel = e => this.attach(e.channel);
      await this.pc.setRemoteDescription(this.dec(code));
      await this.pc.setLocalDescription(await this.pc.createAnswer());
      await this.gathered();
      this.showCode(this.enc(this.pc.localDescription), 'Send this reply code back to your friend. When they connect, the duel starts!', false);
    } catch (e) { this.say('That code did not work — ask your friend for a fresh one.'); }
  }
  showCode(code, msg, needAnswer) {
    this.show('duelCode'); this.$('duelCodeBox').value = code; this.say(msg);
    this.$('duelCopy').classList.remove('hidden');
    this.$('duelPasteRow').classList.toggle('hidden', !needAnswer);
    this.$('duelAccept').classList.toggle('hidden', !needAnswer);
    this.$('duelPaste').value = '';
  }
  async acceptAnswer() {
    try { await this.pc.setRemoteDescription(this.dec(this.$('duelPaste').value)); this.say('Connecting…'); }
    catch (e) { this.say('That reply code did not work — check you pasted all of it.'); }
  }
  copy() { const b = this.$('duelCodeBox'); b.select(); try { navigator.clipboard.writeText(b.value); } catch (e) { document.execCommand('copy'); } this.say('Code copied! Paste it into a message to your friend.'); }

  // ---------- messages (channel can be a real RTCDataChannel or a test stub) ----------
  attach(ch) {
    this.ch = ch;
    ch.onopen = () => { this.send({ t: 'hello', name: this.g.state.name }); this.connected(); };
    ch.onmessage = e => { try { this.onMsg(JSON.parse(e.data)); } catch (err) {} };
    if (ch.readyState === 'open') ch.onopen();
  }
  send(o) { try { if (this.ch && this.ch.readyState === 'open') this.ch.send(JSON.stringify(o)); } catch (e) {} }
  connected() {
    this.show('duelCode'); this.$('duelCodeBox').value = '';
    this.$('duelCopy').classList.add('hidden'); this.$('duelPasteRow').classList.add('hidden'); this.$('duelAccept').classList.add('hidden');
    this.say(this.role === 'host' ? '✅ Friend connected! Tap START DUEL.' : '✅ Connected! Waiting for the host to start…');
    this.$('duelStart').classList.toggle('hidden', this.role !== 'host');
  }
  startMatch() {
    if (this.role !== 'host') return;
    const kinds = ALL_KINDS, tier = this.g.baseTier();
    const rounds = Array.from({ length: DUEL_ROUNDS }, (_, k) => ({ kind: kinds[Math.floor(Math.random() * kinds.length)], tier: clamp(tier + (k > 2 ? 1 : 0), 1, 5), seed: randomSeed() }));
    this.send({ t: 'start', rounds }); this.begin(rounds);
  }
  onMsg(m) {
    if (m.t === 'hello') this.oppName = String(m.name || 'Friend').slice(0, 20);
    else if (m.t === 'start' && this.role !== 'host' && Array.isArray(m.rounds)) this.begin(m.rounds.slice(0, DUEL_ROUNDS));
    else if (m.t === 'ans' && m.r === this.i) { this.theirs = { ok: !!m.ok, ms: Number(m.ms) || 99999 }; this.maybeResolve(); }
    else if (m.t === 'next' && this.role !== 'host') this.round(m.i);
  }

  // ---------- the match ----------
  begin(rounds) {
    this.rounds = rounds; this.me = 0; this.opp = 0; this.active = true; this.$('duelStart').classList.add('hidden');
    this.show('duelPlay'); this.round(0);
  }
  round(i) {
    if (i >= this.rounds.length) return this.finish();
    this.i = i; this.mine = null; this.theirs = null; this.locked = false; this.t0 = performance.now();
    const r = this.rounds[i]; const ch = this.ch_ = buildChallenge(r);
    this.$('duelRound').textContent = `Round ${i + 1} / ${this.rounds.length}`;
    this.$('duelPrompt').textContent = (ch.passage ? ch.passage + '  ' : '') + ch.prompt;
    this.$('duelTip').textContent = '';
    const cv = this.$('duelCanvas'); cv.classList.toggle('hidden', ch.kind === 'reading' || ch.kind === 'punct');
    cv.width = 540; cv.height = 150; const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
    try { ch.draw(c); } catch (e) {}
    const row = this.$('duelChoices'); row.textContent = '';
    ch.choices.forEach(v => {
      const b = document.createElement('button'); b.className = 'rune-stone-btn'; b.dataset.val = v; b.textContent = `🔮 ${v}`;
      b.addEventListener('click', () => this.answer(b, v)); row.appendChild(b);
    });
    this.score();
  }
  score() { this.$('duelScore').textContent = `${this.g.state.name.split(' ')[0]}: ${this.me}   ⚔️   ${this.oppName.split(' ')[0]}: ${this.opp}`; }
  answer(btn, val) {
    if (this.locked || !this.ch_) return;
    this.locked = true;
    const all = [...this.$('duelChoices').children]; all.forEach(b => { b.disabled = true; });
    const ok = String(val) === String(this.ch_.correct);
    const ms = Math.round(performance.now() - this.t0);
    this.mine = { ok, ms };
    btn.classList.add(ok ? 'correct' : 'wrong');
    if (!ok) {
      const right = all.find(b => b.dataset.val === String(this.ch_.correct)); if (right) right.classList.add('correct');
      const pen = this.g.applyPenalty(); this.g.save(); this.g.updateHUD(); sfx.wrongTry();
      this.$('duelTip').textContent = `❌ The answer was ${this.ch_.correct}. -${pen.lossC}⭐ -${pen.lossX} XP`;
    } else { this.g.missStreak = 0; sfx.coin(); this.$('duelTip').textContent = '✅ Correct! Waiting for your friend…'; }
    this.send({ t: 'ans', r: this.i, ok, ms });
    this.maybeResolve();
  }
  maybeResolve() {
    if (!this.mine || !this.theirs || this.resolved === this.i) return;
    this.resolved = this.i;
    const bonus = (a, b) => (a.ok && (!b.ok || a.ms < b.ms) ? 5 : 0);
    this.me += (this.mine.ok ? 10 : -15) + bonus(this.mine, this.theirs);
    this.opp += (this.theirs.ok ? 10 : -15) + bonus(this.theirs, this.mine);
    this.score();
    this.$('duelTip').textContent += this.mine.ok && this.theirs.ok ? (this.mine.ms < this.theirs.ms ? '  ⚡ You were faster! +5' : '  Friend was faster') : '';
    if (this.role === 'host') setTimeout(() => { if (!this.active) return; this.send({ t: 'next', i: this.i + 1 }); this.round(this.i + 1); }, 1800);
  }
  finish() {
    this.active = false; this.show('duelEnd');
    const win = this.me > this.opp, tie = this.me === this.opp;
    this.$('duelResult').textContent = tie ? '🤝 It\'s a tie!' : win ? '🏆 YOU WIN!' : `😤 ${this.oppName.split(' ')[0]} wins!`;
    this.$('duelFinal').textContent = `${this.me} – ${this.opp}`;
    if (win) { this.g.state.coins += 100; this.g.state.stats.duelWins = (this.g.state.stats.duelWins || 0) + 1; this.g.toast('🏆 Duel won! +100⭐', 3000); }
    this.g.save(); this.g.updateHUD();
  }
}
