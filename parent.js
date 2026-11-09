// ============================================================================
// PARENT TOOLS (mixed into DragonCraftWorld)
//  - PIN lock (4 digits, confirm on setup, 1-minute lockout after 5 wrong tries)
//  - Dashboard: Overview • Skills • Activity • Settings • Reports
//  - Controls: daily time limit, bedtime, break reminders, grade level, subject
//    focus, daily question goal, read-aloud
//  - Reports: share / copy / print-to-PDF / CSV / JSON backup / restore /
//    read-only viewing of a report file sent from the child's iPad
// Everything is stored on this device only. Nothing is uploaded anywhere.
// ============================================================================
Object.assign(DragonCraftWorld.prototype, {

  // ------------------------------------------------------------------ setup
  bindParentEvents() {
    document.getElementById('btnParents').addEventListener('click', () => { sfx.init(); this.openParent(); });
    document.getElementById('parentClose').addEventListener('click', () => this.closeParent());
    window.addEventListener('afterprint', () => { document.getElementById('printReport').innerHTML = ''; });

    // Hidden shortcut for parents during play: tap the level star 5 times
    let taps = 0, timer = null;
    document.getElementById('hudLevelStar').addEventListener('click', () => {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 2500);
      if (taps >= 5) { taps = 0; this.openParent(); }
    });
    this.startTimeTracking();
  },

  // ------------------------------------------------------------------ PIN
  pinKey() { return 'dragoncraft_parent_pin_v1'; },
  getPin() { try { return localStorage.getItem(this.pinKey()); } catch (e) { return null; } },
  setPin(p) { try { localStorage.setItem(this.pinKey(), btoa('dc:' + p)); } catch (e) {} },
  checkPin(p) { return this.getPin() === btoa('dc:' + p); },
  getLockUntil() { try { return Number(localStorage.getItem('dragoncraft_pin_lock') || 0); } catch (e) { return 0; } },
  setLockUntil(t) { try { localStorage.setItem('dragoncraft_pin_lock', String(t)); } catch (e) {} },

  tryPin(v, msg) {
    const until = this.getLockUntil();
    if (Date.now() < until) {
      msg.textContent = `Too many tries — please wait ${Math.ceil((until - Date.now()) / 1000)}s.`;
      return false;
    }
    if (this.checkPin(v)) { this.pinFails = 0; return true; }
    this.pinFails = (this.pinFails || 0) + 1;
    if (this.pinFails >= 5) {
      this.pinFails = 0;
      this.setLockUntil(Date.now() + 60000);
      msg.textContent = 'Too many wrong tries. Locked for 1 minute.';
    } else {
      msg.textContent = `Wrong PIN (${5 - this.pinFails} tries left).`;
    }
    return false;
  },

  pinForm(container, o) {
    container.innerHTML = `<div class="pd-center">
      <div class="menu-note">${esc(o.title)}</div>
      <input class="pd-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="4 digit PIN" />
      <div class="pd-actions" style="justify-content:center"><button class="pd-btn pd-go">${esc(o.button)}</button>${o.cancel ? '<button class="pd-btn pd-cancel">Cancel</button>' : ''}</div>
      <div class="pd-msg"></div>
      ${o.forgot ? '<details class="pd-forgot"><summary>Forgot your PIN?</summary>Clear this site\'s data in Safari (Settings ▸ Apps ▸ Safari ▸ Advanced ▸ Website Data). That also erases saved progress — restore it from a backup file afterwards if you made one.</details>' : ''}
    </div>`;
    const input = container.querySelector('.pd-pin'), msg = container.querySelector('.pd-msg');
    const go = () => {
      const v = input.value.trim();
      if (!/^\d{4}$/.test(v)) { msg.textContent = 'Please enter exactly 4 digits.'; return; }
      o.onSubmit(v, msg, input);
    };
    container.querySelector('.pd-go').addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const c = container.querySelector('.pd-cancel');
    if (c && o.cancel) c.addEventListener('click', o.cancel);
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 60);
  },

  // ------------------------------------------------------------------ open / close
  openParent(authed = false) {
    this.joy = { x: 0, y: 0, id: null };
    document.getElementById('parentOverlay').classList.remove('hidden');
    this.viewState = null;
    if (authed) this.parentAuthed = true;
    this.parentView = this.parentAuthed ? 'dash' : (this.getPin() ? 'login' : 'setup');
    if (!this.parentTab) this.parentTab = 'overview';
    this.renderParent();
  },

  closeParent() {
    document.getElementById('parentOverlay').classList.add('hidden');
    this.parentAuthed = false;
    this.viewState = null;
    this.pinDraft = null;
    this.updateHUD();
    this.checkLocks(false);
  },

  renderParent() {
    const body = document.getElementById('parentBody');
    const tabsEl = document.getElementById('parentTabs');

    if (this.parentView !== 'dash') {
      tabsEl.innerHTML = '';
      if (this.parentView === 'setup') {
        const step2 = !!this.pinDraft;
        this.pinForm(body, {
          title: step2 ? 'Enter the same PIN again to confirm' : 'Create a 4-digit Parent PIN. You will need it to open this dashboard.',
          button: step2 ? 'Confirm PIN' : 'Next',
          onSubmit: (v, msg) => {
            if (!step2) { this.pinDraft = v; this.renderParent(); return; }
            if (v !== this.pinDraft) { this.pinDraft = null; msg.textContent = 'The PINs did not match — start again.'; setTimeout(() => this.renderParent(), 900); return; }
            this.setPin(v);
            this.pinDraft = null;
            this.parentAuthed = true;
            this.parentView = 'dash';
            this.parentTab = 'settings';
            this.renderParent();
            this.toast('🔒 PIN saved. Next, choose your settings below.', 4200);
          }
        });
        body.insertAdjacentHTML('beforeend', '<div class="menu-note" style="font-size:.78rem;text-align:center;margin-top:6px">This is a kid-proof lock for the dashboard, not bank-grade security. Data stays on this device.</div>');
      } else {
        this.pinForm(body, {
          title: 'Enter your 4-digit Parent PIN',
          button: 'Unlock',
          forgot: true,
          onSubmit: (v, msg, input) => {
            if (this.tryPin(v, msg)) { this.parentAuthed = true; this.parentView = 'dash'; this.renderParent(); }
            else input.value = '';
          }
        });
      }
      return;
    }

    const ro = !!this.viewState;
    const st = this.viewState || this.state;
    const R = this.report(st);
    const defs = [['overview', '📊 Overview'], ['skills', '🎯 Skills'], ['activity', '🕒 Activity']];
    if (!ro) defs.push(['settings', '⚙️ Settings']);
    defs.push(['reports', '📤 Reports']);
    if (!defs.some(d => d[0] === this.parentTab)) this.parentTab = 'overview';
    tabsEl.innerHTML = defs.map(([id, label]) => `<button class="ptab ${id === this.parentTab ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('');
    tabsEl.querySelectorAll('.ptab').forEach(b => b.addEventListener('click', () => { this.parentTab = b.dataset.tab; this.renderParent(); body.scrollTop = 0; }));

    let html = '';
    if (ro) html += `<div class="pd-banner">👀 Viewing a saved report for <b>${esc(st.name)}</b> (read-only). <button class="pd-btn" id="pdBackLocal">Back to this device</button></div>`;
    html += { overview: this.pvOverview, skills: this.pvSkills, activity: this.pvActivity, settings: this.pvSettings, reports: this.pvReports }[this.parentTab].call(this, st, R, ro);
    body.innerHTML = html;
    const back = document.getElementById('pdBackLocal');
    if (back) back.addEventListener('click', () => { this.viewState = null; this.parentTab = 'overview'; this.renderParent(); });
    if (this.parentTab === 'settings') this.pwSettings();
    if (this.parentTab === 'reports') this.pwReports(st, R, ro);
  },

  // ------------------------------------------------------------------ numbers
  fmtMin(ms) {
    const m = Math.round(ms / 60000);
    if (ms > 0 && m === 0) return '<1 min';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  },
  fmtAgo(ts) {
    if (!ts) return 'never';
    const days = Math.floor((new Date(dayKey()).getTime() - new Date(dayKey(new Date(ts))).getTime()) / 86400000);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  },
  isFirst(l) { return l.first !== undefined ? !!l.first : l.tries === 1; },
  isStandalone() {
    try { return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
  },

  statusOf(c) {
    if (c.asked < 5) return ['Too early to tell', 'pd-ok', '#8ea0d6'];
    if (c.pct >= 85) return ['Strong', 'pd-good', '#06d6a0'];
    if (c.pct >= 65) return ['Doing OK', 'pd-ok', '#ffd166'];
    return ['Needs practice', 'pd-bad', '#ef476f'];
  },

  // Everything the dashboard shows is computed here from the saved data
  report(st) {
    const S = st.stats;
    const cats = Object.entries(S.byCat).map(([name, c]) => {
      const sk = st.skills[name];
      return { name, subj: c.subj || 'Math', asked: c.asked || 0, first: c.first || 0, pct: c.asked ? Math.round((c.first / c.asked) * 100) : 0, avgS: c.asked ? c.ms / c.asked / 1000 : 0, tier: sk ? sk.tier : null, recent: sk ? sk.recent : [] };
    });
    const asked = cats.reduce((a, c) => a + c.asked, 0);
    const first = cats.reduce((a, c) => a + c.first, 0);
    const ms = Object.values(S.byCat).reduce((a, c) => a + (c.ms || 0), 0);

    const days28 = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const rec = S.daily[dayKey(d)] || { ms: 0, q: 0, first: 0 };
      days28.push({ date: d, key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }), ms: rec.ms || 0, q: rec.q || 0, first: rec.first || 0, goal: !!rec.goal });
    }
    const days7 = days28.slice(21);
    const sum = (arr, k) => arr.reduce((a, d) => a + d[k], 0);
    const week = { ms: sum(days7, 'ms'), q: sum(days7, 'q'), first: sum(days7, 'first'), active: days7.filter(d => d.q > 0 || d.ms > 0).length, goalDays: days7.filter(d => d.goal).length };
    const prev = days28.slice(14, 21);
    const prevWeek = { ms: sum(prev, 'ms'), q: sum(prev, 'q'), first: sum(prev, 'first') };

    // weekly accuracy trend (last 8 weeks)
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      let q = 0, f = 0, m = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - (w * 7 + i));
        const rec = S.daily[dayKey(d)];
        if (rec) { q += rec.q || 0; f += rec.first || 0; m += rec.ms || 0; }
      }
      weeks.push({ q, f, ms: m, pct: q ? Math.round((f / q) * 100) : null, label: w === 0 ? 'this wk' : `${w}w ago` });
    }

    // streak of consecutive active days
    let streak = 0;
    const activeOn = k => { const r = S.daily[k]; return !!r && ((r.q || 0) > 0 || (r.ms || 0) > 0); };
    const cur = new Date();
    if (!activeOn(dayKey(cur))) cur.setDate(cur.getDate() - 1);
    while (activeOn(dayKey(cur)) && streak < 400) { streak++; cur.setDate(cur.getDate() - 1); }

    // subject summaries
    const subjects = {};
    ['Math', 'English', 'Science'].forEach(sub => {
      const cs = cats.filter(c => c.subj === sub);
      const a = cs.reduce((x, c) => x + c.asked, 0), f = cs.reduce((x, c) => x + c.first, 0);
      const sms = cs.reduce((x, c) => x + c.avgS * c.asked, 0);
      const mine = S.log.filter(l => l.subj === sub && !l.skip);
      let trend = '';
      if (mine.length >= 12) {
        const rec = mine.slice(-8), bef = mine.slice(-16, -8);
        if (bef.length >= 4) {
          const d = Math.round((rec.filter(l => this.isFirst(l)).length / rec.length - bef.filter(l => this.isFirst(l)).length / bef.length) * 100);
          trend = d >= 10 ? `📈 Improving (+${d} points lately)` : d <= -10 ? `📉 Slipping (${d} points lately)` : '➡️ Steady';
        }
      }
      const ranked = cs.filter(c => c.asked >= 3).sort((x, y) => y.pct - x.pct);
      subjects[sub] = { asked: a, first: f, pct: a ? Math.round((f / a) * 100) : 0, avgS: a ? sms / a : 0, trend, best: ranked[0] || null, weak: ranked.length > 1 ? ranked[ranked.length - 1] : null };
    });

    // behaviour signals
    const recentLog = S.log.slice(-60).filter(l => !l.skip);
    const rushed = recentLog.filter(l => !this.isFirst(l) && l.ms < 3000).length;
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    S.log.forEach(l => { const h = new Date(l.t).getHours(); buckets[h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night']++; });
    const topBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];

    const lastT = S.log.length ? S.log[S.log.length - 1].t : 0;
    return { cats, asked, first, pct: asked ? Math.round((first / asked) * 100) : 0, avgS: asked ? ms / asked / 1000 : 0, days28, days7, week, prevWeek, weeks, streak, subjects, rushed, recentCount: recentLog.length, buckets, topBucket: topBucket && topBucket[1] >= 8 ? topBucket[0] : '', lastPlayed: lastT, today: days28[27] };
  },

  insights(st, R) {
    const out = [];
    const set = st.settings;
    if (!R.asked) return [{ i: '👋', k: 'info', t: 'No questions answered yet. Once your child plays, this page fills with insights.' }];
    // strengths first
    const ranked = R.cats.filter(c => c.asked >= 5).sort((a, b) => b.pct - a.pct);
    const best = ranked[0];
    if (best && best.pct >= 80) out.push({ i: '⭐', k: 'good', t: `Strongest skill: <b>${esc(best.name)}</b> (${best.pct}% right first try${best.tier ? `, Level ${best.tier}` : ''}). Worth praising!` });
    if (R.week.active >= 5) out.push({ i: '📅', k: 'good', t: `Great consistency: played on <b>${R.week.active} of the last 7 days</b>.` });
    else if (R.week.active <= 1 && (st.stats.sessions || 0) > 3) out.push({ i: '📅', k: 'tip', t: `Played on only ${R.week.active} day${R.week.active === 1 ? '' : 's'} this week. Short, regular sessions (10–15 min) work better than long ones.` });
    if (set.focusSkill && KIND_META[set.focusSkill]) out.push({ i: '🎯', k: 'info', t: `Extra practice is set to <b>${esc(KIND_META[set.focusSkill].cat)}</b> — about 1 in 3 questions.` });
    if (set.dailyGoalQ > 0) {
      const g = R.week.goalDays;
      out.push({ i: '🎯', k: g >= 4 ? 'good' : 'info', t: `Met the daily goal of ${set.dailyGoalQ} questions on <b>${g} of the last 7 days</b>.` });
    }
    // areas to work on
    ranked.slice().reverse().filter(c => c.pct < 70).slice(0, 2).forEach(c => out.push({ i: '🎯', k: 'tip', t: `Practice <b>${esc(c.name)}</b> together — only ${c.pct}% right on the first try (${c.asked} questions).` }));
    const slow = R.cats.filter(c => c.asked >= 5 && c.avgS > 30).sort((a, b) => b.avgS - a.avgS)[0];
    if (slow) out.push({ i: '🐢', k: 'tip', t: `<b>${esc(slow.name)}</b> takes the longest (about ${Math.round(slow.avgS)}s per question). Try a few on paper together.` });
    if (R.recentCount >= 15 && R.rushed >= Math.max(5, Math.round(R.recentCount * 0.2))) out.push({ i: '⚡', k: 'tip', t: `${R.rushed} of the last ${R.recentCount} answers were wrong AND very fast (under 3 seconds) — possible guessing. Encourage reading the question and using the 🔊 button and hints.` });
    // week-over-week
    if (R.prevWeek.q >= 10 && R.week.q >= 10) {
      const a = Math.round((R.week.first / R.week.q) * 100), b = Math.round((R.prevWeek.first / R.prevWeek.q) * 100);
      if (a - b >= 5) out.push({ i: '📈', k: 'good', t: `Accuracy is up: <b>${a}%</b> this week vs ${b}% last week.` });
      else if (b - a >= 5) out.push({ i: '📉', k: 'tip', t: `Accuracy dipped: ${a}% this week vs ${b}% last week. Tired, rushed, or tougher questions?` });
    }
    const up = R.cats.filter(c => c.tier >= 4).length;
    if (up) out.push({ i: '🧗', k: 'good', t: `${up} skill${up === 1 ? ' has' : 's have'} reached Level 4 or higher — the game is making the questions harder as your child improves.` });
    if (st.review.length) out.push({ i: '🔁', k: 'info', t: `${st.review.length} missed question${st.review.length === 1 ? ' is' : 's are'} queued to come back as review — spaced practice helps memory stick.` });
    // screen time & safety
    const activeDays = R.days28.filter(d => d.ms > 0);
    if (activeDays.length >= 3) {
      const avg = activeDays.reduce((a, d) => a + d.ms, 0) / activeDays.length;
      if (avg > 75 * 60000 && !set.limitMin) out.push({ i: '⏱️', k: 'tip', t: `Average play on active days is ${this.fmtMin(avg)}. Consider setting a daily time limit in Settings.` });
    }
    if (R.topBucket) out.push({ i: '🕐', k: 'info', t: `Most activity happens in the <b>${R.topBucket}</b>.` });
    if (st === this.state && (st.stats.sessions || 0) >= 3 && !this.isStandalone()) out.push({ i: '📲', k: 'tip', t: `Tip: in Safari tap <b>Share ▸ Add to Home Screen</b>. The game then opens full-screen, works offline, and Safari will not clear its saved progress.` });
    if ((st.stats.sessions || 0) > 5 && (!st.lastBackup || Date.now() - st.lastBackup > 14 * 86400000)) out.push({ i: '💾', k: 'tip', t: `No recent backup. Open <b>Reports ▸ Back up</b> so progress is safe if Safari clears its data.` });
    return out;
  },

  // ------------------------------------------------------------------ small HTML helpers
  kpi(v, label) { return `<div class="pd-card"><b>${v}</b><span>${label}</span></div>`; },
  barHtml(pct, color) { return `<div class="pd-bar"><i style="width:${clamp(pct, 0, 100)}%;background:${color}"></i></div>`; },
  dotsHtml(rec) { return rec && rec.length ? `<span class="pd-dots">${rec.map(x => `<i class="${x ? 'g' : 'r'}"></i>`).join('')}</span>` : '<span class="pd-muted">–</span>'; },
  levelHtml(t) { return t ? `<span class="pd-lvl" title="Level ${t} of 5">${'●'.repeat(t)}${'○'.repeat(5 - t)}</span> <span class="pd-muted">${t}/5</span>` : '<span class="pd-muted">not started</span>'; },

  subjectCard(sub, R) {
    const s = R.subjects[sub];
    const icon = { Math: '➗', English: '📖', Science: '🔬' }[sub];
    if (s.asked < 5) return `<div class="pd-card left"><b class="sm">${icon} ${sub}</b><span>Needs a few more questions (${s.asked} so far) to show how it's going.</span></div>`;
    const label = s.pct >= 85 ? ['Excellent', 'pd-good'] : s.pct >= 70 ? ['Going well', 'pd-good'] : s.pct >= 55 ? ['Getting there', 'pd-ok'] : ['Needs practice', 'pd-bad'];
    return `<div class="pd-card left"><b class="sm">${icon} ${sub}: <span class="${label[1]}">${label[0]}</span></b>
      ${this.barHtml(s.pct, '#06d6a0')}
      <span class="lines">${s.pct}% right on the first try across ${s.asked} questions<br>Average ${Math.round(s.avgS)}s per question${s.trend ? '<br>' + s.trend : ''}
      ${s.best ? `<br>⭐ Strongest: ${esc(s.best.name)} (${s.best.pct}%)` : ''}${s.weak && s.weak.pct < 80 ? `<br>🎯 Practice: ${esc(s.weak.name)} (${s.weak.pct}%)` : ''}</span></div>`;
  },

  weeklyChart(R) {
    const pts = R.weeks.map((w, i) => ({ i, pct: w.pct, label: w.label })).filter(p => p.pct !== null);
    if (pts.length < 2) return '<div class="pd-muted" style="padding:10px">The weekly accuracy chart appears after two weeks of play.</div>';
    const W = 520, H = 150, x = i => 40 + (i * (W - 70)) / 7, y = p => 12 + ((100 - p) * (H - 44)) / 100;
    const line = pts.map(p => `${x(p.i)},${y(p.pct)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" class="pd-svg" role="img" aria-label="Weekly accuracy">
      ${[0, 50, 100].map(v => `<line x1="38" x2="${W - 28}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.15)"/><text x="4" y="${y(v) + 4}" fill="#8ea0d6" font-size="11">${v}%</text>`).join('')}
      <polyline points="${line}" fill="none" stroke="#06d6a0" stroke-width="3"/>
      ${pts.map(p => `<circle cx="${x(p.i)}" cy="${y(p.pct)}" r="5" fill="#ffd166"/><text x="${x(p.i)}" y="${y(p.pct) - 9}" fill="#fff" font-size="11" text-anchor="middle">${p.pct}%</text>`).join('')}
      ${R.weeks.map((w, i) => `<text x="${x(i)}" y="${H - 6}" fill="#8ea0d6" font-size="10" text-anchor="middle">${w.label}</text>`).join('')}
    </svg>`;
  },

  // ------------------------------------------------------------------ OVERVIEW
  pvOverview(st, R, ro) {
    const set = st.settings;
    const today = R.today;
    const maxMs = Math.max(60000, ...R.days7.map(d => d.ms));
    const goal = set.dailyGoalQ || 0;
    const limit = set.limitMin ? ` / ${set.limitMin}m limit` : '';
    return `
      <div class="pd-hero"><b>${esc(st.name)}</b> • Level ${st.level} • ${st.dragons.length}/${DRAGONS.length} dragons • last played ${this.fmtAgo(R.lastPlayed || (st.daily.last ? new Date(st.daily.last).getTime() : 0))}</div>
      <div class="pd-cards">
        ${this.kpi(this.fmtMin(today.ms) + `<small>${limit}</small>`, 'Played today')}
        ${this.kpi(goal > 0 ? `${Math.min(today.q, goal)}/${goal}` : String(today.q), goal > 0 ? 'Daily goal (questions)' : 'Questions today')}
        ${this.kpi(`${R.streak} 🔥`, 'Day streak')}
        ${this.kpi(this.fmtMin(R.week.ms), 'Play time, 7 days')}
        ${this.kpi(`${R.week.q}`, 'Questions, 7 days')}
        ${this.kpi(`${R.pct}%`, 'Right on first try (all time)')}
        ${this.kpi(`${R.avgS ? R.avgS.toFixed(0) + 's' : '–'}`, 'Avg time / question')}
        ${this.kpi(`${Object.keys(st.achievements).length}/${ACHIEVEMENTS.length}`, 'Badges earned')}
      </div>
      <div class="pd-sec">📚 How is ${esc(st.name)} doing? Math • English • Science</div>
      <div class="pd-cards wide">${['Math', 'English', 'Science'].map(s => this.subjectCard(s, R)).join('')}</div>
      <div class="pd-sec">💡 Insights</div>
      <ul class="pd-list pd-ins">${this.insights(st, R).map(x => `<li class="${x.k}"><span>${x.i}</span><div>${x.t}</div></li>`).join('')}</ul>
      <div class="pd-sec">📅 Last 7 days</div>
      <div class="pd-chart">${R.days7.map(d => `<div class="pd-col"><span>${Math.round(d.ms / 60000)}m</span><i style="height:${Math.round((d.ms / maxMs) * 64)}px"></i><em>${d.q}q</em>${d.label}</div>`).join('')}</div>
      <div class="pd-sec">📈 Accuracy by week (right on first try)</div>
      ${this.weeklyChart(R)}
      <div class="pd-sec">↔️ This week vs last week</div>
      <table class="pd-table"><tr><th></th><th>This week</th><th>Last week</th></tr>
        <tr><td>Play time</td><td>${this.fmtMin(R.week.ms)}</td><td>${this.fmtMin(R.prevWeek.ms)}</td></tr>
        <tr><td>Questions answered</td><td>${R.week.q}</td><td>${R.prevWeek.q}</td></tr>
        <tr><td>Right on first try</td><td>${R.week.q ? Math.round((R.week.first / R.week.q) * 100) + '%' : '–'}</td><td>${R.prevWeek.q ? Math.round((R.prevWeek.first / R.prevWeek.q) * 100) + '%' : '–'}</td></tr>
      </table>`;
  },

  // ------------------------------------------------------------------ SKILLS
  pvSkills(st, R) {
    const groups = [['Math', '➗'], ['English', '📖'], ['Science', '🔬']];
    const tried = new Set(R.cats.map(c => c.name));
    const notTried = ALL_KINDS.map(k => KIND_META[k]).filter(m => !tried.has(m.cat));
    return `<div class="pd-note">Each skill has 5 <b>levels</b> (about Grade 2 → Grade 6 difficulty). The game moves a skill up after 5 first-try answers in a row and eases off after several misses. Levels are this game's own difficulty steps, not an official grade-level test.</div>` +
      groups.map(([sub, icon]) => {
        const cs = R.cats.filter(c => c.subj === sub).sort((a, b) => a.name.localeCompare(b.name));
        return `<div class="pd-sec">${icon} ${sub}</div>
        <table class="pd-table"><tr><th>Skill</th><th>Level</th><th>First try</th><th>Last 8</th><th>Avg time</th><th>Qs</th><th>Status</th></tr>
        ${cs.length ? cs.map(c => { const [lab, cls, col] = this.statusOf(c); return `<tr><td>${esc(c.name)}</td><td>${this.levelHtml(c.tier)}</td><td>${c.pct}% ${this.barHtml(c.pct, col)}</td><td>${this.dotsHtml(c.recent)}</td><td>${c.avgS.toFixed(0)}s</td><td>${c.asked}</td><td class="${cls}">${lab}</td></tr>`; }).join('') : '<tr><td colspan="7" class="pd-muted">No questions answered yet.</td></tr>'}</table>`;
      }).join('') +
      (notTried.length ? `<div class="pd-sec">🆕 Not tried yet</div><div class="pd-muted" style="line-height:1.7">${notTried.map(m => esc(m.cat)).join(' • ')}</div>` : '');
  },

  // ------------------------------------------------------------------ ACTIVITY
  pvActivity(st, R) {
    const S = st.stats;
    const heat = R.days28.map(d => {
      const m = Math.round(d.ms / 60000);
      const lvl = d.ms <= 0 && d.q === 0 ? 0 : m < 10 ? 1 : m < 25 ? 2 : m < 45 ? 3 : 4;
      return `<div class="pd-hm l${lvl}" title="${d.date.toLocaleDateString()}: ${m} min, ${d.q} questions"><b>${d.date.getDate()}</b><small>${d.q ? d.q + 'q' : ''}</small></div>`;
    }).join('');
    const rec = S.log.slice(-20).reverse();
    const mis = S.mistakes.slice(-12).reverse();
    const reviewBy = {};
    st.review.forEach(r => { const c = KIND_META[r.kind].cat; reviewBy[c] = (reviewBy[c] || 0) + 1; });
    const islands = Math.min(st.maxIsland + 1, BIOMES.length);
    return `
      <div class="pd-sec">🗓️ Last 28 days <span class="pd-muted">(darker = more play time)</span></div>
      <div class="pd-heat">${heat}</div>
      <div class="pd-sec">🎮 Game progress</div>
      <div class="pd-cards">
        ${this.kpi(st.level, 'Hero level')}
        ${this.kpi(`${islands} / ${BIOMES.length}`, 'Islands reached')}
        ${this.kpi(`${st.dragons.length} / ${DRAGONS.length}`, 'Dragons tamed')}
        ${this.kpi(`${st.gear.length} / ${SURPRISES.length}`, 'Treasures found')}
        ${this.kpi(`${S.sessions || 0}`, 'Play sessions')}
        ${this.kpi(`${this.fmtMin(S.totalMs)}`, 'Total play time')}
      </div>
      <div class="pd-sec">🔁 Review queue</div>
      <div class="pd-muted" style="line-height:1.6">${st.review.length ? `${st.review.length} missed question${st.review.length === 1 ? '' : 's'} will come back soon: ${Object.entries(reviewBy).map(([c, n]) => `${esc(c)} (${n})`).join(', ')}.` : 'Nothing waiting — every recent miss has been revisited.'}${S.reviewFixed ? ` Fixed on review so far: <b>${S.reviewFixed}</b>.` : ''}</div>
      <div class="pd-sec">❌ Recent mistakes <span class="pd-muted">(good conversation starters)</span></div>
      <table class="pd-table"><tr><th>Skill</th><th>Question</th><th>Chose</th><th>Answer</th></tr>
      ${mis.length ? mis.map(m => `<tr><td>${esc(m.cat)}</td><td>${esc(m.q)}</td><td class="pd-bad">${esc(m.picked)}</td><td class="pd-good">${esc(m.correct)}</td></tr>`).join('') : '<tr><td colspan="4" class="pd-muted">No mistakes recorded yet.</td></tr>'}</table>
      <div class="pd-sec">🕒 Recent questions</div>
      <table class="pd-table"><tr><th>When</th><th>Skill</th><th>Level</th><th>Result</th><th>Time</th></tr>
      ${rec.length ? rec.map(r => `<tr><td>${new Date(r.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>${esc(r.cat)}${r.review ? ' 🔁' : ''}</td><td>${r.tier || '–'}</td><td class="${this.isFirst(r) ? 'pd-good' : 'pd-bad'}">${r.skip ? 'skipped (dragon napped)' : this.isFirst(r) ? '✔ first try' : r.tries + ' tries'}</td><td>${(r.ms / 1000).toFixed(1)}s</td></tr>`).join('') : '<tr><td colspan="5" class="pd-muted">Nothing yet.</td></tr>'}</table>`;
  },

  // ------------------------------------------------------------------ SETTINGS
  pvSettings(st) {
    const s = st.settings;
    const sel = (id, label, opts, cur, help) => `<div class="pd-row"><label for="${id}">${label}${help ? `<small>${help}</small>` : ''}</label><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
    const chk = (id, label, cur, help) => `<div class="pd-row"><label for="${id}">${label}${help ? `<small>${help}</small>` : ''}</label><input type="checkbox" id="${id}" ${cur ? 'checked' : ''} /></div>`;
    return `<div class="pd-note">Changes save instantly. <span id="pdSaved" class="pd-good"></span></div>
      <div class="pd-sec">📘 Learning</div>
      ${sel('setGrade', 'Starting difficulty', [[2, 'Grade 2 (age 7–8) — easier'], [3, 'Grade 3 (age 8–9)'], [4, 'Grade 4 (age 9–10)'], [5, 'Grade 5 (age 10–11) — harder']], s.grade, 'Every skill restarts here, then adjusts to your child.')}
      ${sel('setFocus', 'Question mix', [['balanced', 'Balanced — math, English & science (follows each island)'], ['math', 'Math only'], ['english', 'English only'], ['science', 'Science only']], s.focus)}
      ${sel('setFocusSkill', 'Extra practice skill', [['', 'None — mix naturally'], ...ALL_KINDS.map(k => [k, `${KIND_META[k].subj}: ${KIND_META[k].cat}`])], s.focusSkill, 'About 1 in 3 questions will be this skill (only if it fits the question mix above).')}
      ${sel('setGoal', 'Daily question goal', [[0, 'Off'], [5, '5 questions'], [10, '10 questions'], [15, '15 questions'], [20, '20 questions'], [30, '30 questions']], s.dailyGoalQ, 'Shows a friendly progress counter and gives a bonus.')}
      ${chk('setRead', 'Read questions aloud automatically', s.autoRead, 'There is always a 🔊 button on each question too.')}
      ${chk('setMusic', 'Background music on', s.music)}
      <div class="pd-sec">⏱️ Screen-time controls</div>
      ${sel('setLimit', 'Daily play-time limit', [[0, 'No limit'], [20, '20 minutes'], [30, '30 minutes'], [45, '45 minutes'], [60, '1 hour'], [90, '1.5 hours'], [120, '2 hours']], s.limitMin, 'When time is up the game pauses until tomorrow (you can add time with your PIN).')}
      ${sel('setBreak', 'Stretch-break reminder', [[0, 'Off'], [15, 'Every 15 minutes'], [20, 'Every 20 minutes'], [25, 'Every 25 minutes'], [30, 'Every 30 minutes'], [45, 'Every 45 minutes']], s.breakMin, 'A 1-minute pause to stand up and rest the eyes.')}
      ${chk('setBedOn', 'Bedtime lock', s.bedtimeOn, 'The game stays closed during these hours.')}
      <div class="pd-row"><label>Closed between<small>the game stays locked from the first time until the second</small></label><span class="pd-times"><input type="time" id="setBedStart" value="${esc(s.bedStart)}" /><span class="pd-to">to</span><input type="time" id="setBedEnd" value="${esc(s.bedEnd)}" /></span></div>
      <div class="pd-sec">🔒 Security & data</div>
      <div class="pd-actions"><button id="pdPinChange" class="pd-btn">🔑 Change PIN</button><button id="pdReset" class="pd-btn danger">🗑️ Erase all progress</button></div>
      <div class="pd-muted" style="margin-top:10px;font-size:.8rem;line-height:1.5">Limits work inside this game on this device. A child who clears Safari's website data or uses another browser can bypass them, so combine with iPad Screen Time if you need a hard stop.</div>`;
  },

  pwSettings() {
    const set = this.state.settings;
    const saved = () => { const el = document.getElementById('pdSaved'); if (el) { el.textContent = '✓ Saved'; clearTimeout(this._savedT); this._savedT = setTimeout(() => { el.textContent = ''; }, 1600); } };
    const onChange = (id, fn) => document.getElementById(id).addEventListener('change', e => { fn(e.target); this.save(); this.updateHUD(); saved(); });
    onChange('setGrade', t => {
      set.grade = Number(t.value);
      Object.values(this.state.skills).forEach(sk => { sk.tier = this.baseTier(); sk.recent = []; });
      this.state.review = [];
    });
    onChange('setFocus', t => { set.focus = t.value; });
    onChange('setFocusSkill', t => { set.focusSkill = t.value; });
    onChange('setGoal', t => { set.dailyGoalQ = Number(t.value); });
    onChange('setRead', t => { set.autoRead = t.checked; if (t.checked) { this.primeSpeech(); this.speak('Read aloud is on.'); } else this.stopSpeaking(); });
    onChange('setMusic', t => { set.music = t.checked; sfx.musicEnabled = t.checked; if (t.checked) { sfx.init(); sfx.startMusic(); } else sfx.stopMusic(); });
    onChange('setLimit', t => { set.limitMin = Number(t.value); });
    onChange('setBreak', t => { set.breakMin = Number(t.value); this.sinceBreakMs = 0; });
    onChange('setBedOn', t => { set.bedtimeOn = t.checked; });
    onChange('setBedStart', t => { if (/^\d{2}:\d{2}$/.test(t.value)) set.bedStart = t.value; });
    onChange('setBedEnd', t => { if (/^\d{2}:\d{2}$/.test(t.value)) set.bedEnd = t.value; });
    document.getElementById('pdPinChange').addEventListener('click', () => { this.parentView = 'setup'; this.pinDraft = null; this.renderParent(); });
    document.getElementById('pdReset').addEventListener('click', () => {
      if (confirm('Erase ALL game progress and parent stats on this device? This cannot be undone.')) {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
        location.reload();
      }
    });
  },

  // ------------------------------------------------------------------ REPORTS
  pvReports(st, R, ro) {
    const backupAge = st.lastBackup ? `Last backup: ${this.fmtAgo(st.lastBackup)}.` : 'No backup made yet.';
    return `
      <div class="pd-sec">📝 Weekly summary</div>
      <pre class="pd-pre" id="pdSummary">${esc(this.buildSummaryText(st))}</pre>
      <div class="pd-actions">
        <button id="pdShare" class="pd-btn">📲 Share report</button>
        <button id="pdCopy" class="pd-btn">📋 Copy summary</button>
        <button id="pdPrint" class="pd-btn">🖨️ Print / save as PDF</button>
        <button id="pdCsv" class="pd-btn">⬇️ Answers (CSV)</button>
      </div>
      <div class="pd-sec">💾 Backup & see progress on your own phone</div>
      <div class="pd-note">Everything is stored only on the iPad. To follow progress from <b>your own phone</b>: tap <b>Share report</b> on the iPad and send the file to yourself (AirDrop, Messages or email). On your phone open this game ▸ 👪 Parents ▸ Reports ▸ <b>Open a report file</b>. Nothing is uploaded to any server. ${ro ? '' : backupAge}</div>
      <div class="pd-actions">
        ${ro ? '' : '<button id="pdJson" class="pd-btn">⬇️ Download backup (JSON)</button>'}
        <button id="pdOpenView" class="pd-btn">👀 Open a report file (read-only)</button>
        ${ro ? '' : '<button id="pdRestore" class="pd-btn danger">♻️ Restore a backup to this device</button>'}
      </div>
      <input type="file" id="pdFileView" accept=".json,application/json" class="hidden-input" />
      <input type="file" id="pdFileRestore" accept=".json,application/json" class="hidden-input" />
      <div id="pdMsg2" class="pd-muted" style="margin-top:8px"></div>
      <div class="pd-note" style="margin-top:14px">🔒 <b>Privacy:</b> this game has no accounts and sends no data anywhere. Reports only leave the iPad when <i>you</i> share them.</div>`;
  },

  pwReports(st, R, ro) {
    const msg = t => { const el = document.getElementById('pdMsg2'); if (el) el.textContent = t; };
    document.getElementById('pdCopy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(this.buildSummaryText(st)); msg('✅ Summary copied — paste it anywhere.'); }
      catch (e) { msg('Copying is not allowed here — select the text above and copy it by hand.'); }
    });
    document.getElementById('pdCsv').addEventListener('click', () => this.downloadFile(`dragoncraft-answers-${dayKey()}.csv`, this.buildCsv(st), 'text/csv'));
    document.getElementById('pdPrint').addEventListener('click', () => this.printReport(st, R));
    document.getElementById('pdShare').addEventListener('click', () => this.shareReport(st, ro, msg));
    const json = document.getElementById('pdJson');
    if (json) json.addEventListener('click', () => {
      this.downloadFile(`dragoncraft-backup-${dayKey()}.json`, JSON.stringify(this.exportPayload(st), null, 2), 'application/json');
      this.state.lastBackup = Date.now(); this.save(); msg('✅ Backup downloaded. Keep the file somewhere safe (Files, iCloud, email).');
    });
    const readFile = (file, cb) => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(String(r.result));
          const raw = obj && obj.state && typeof obj.state === 'object' ? obj.state : obj;
          if (!raw || typeof raw !== 'object' || !raw.stats) throw new Error('not a DragonCraft file');
          cb(normalizeSave(raw));
        } catch (e) { msg('❌ That file is not a DragonCraft report or backup.'); }
      };
      r.onerror = () => msg('❌ Could not read that file.');
      r.readAsText(file);
    };
    const fv = document.getElementById('pdFileView');
    document.getElementById('pdOpenView').addEventListener('click', () => fv.click());
    fv.addEventListener('change', () => { if (fv.files[0]) readFile(fv.files[0], ns => { this.viewState = ns; this.parentTab = 'overview'; this.renderParent(); }); });
    const rb = document.getElementById('pdRestore');
    if (rb) {
      const fr = document.getElementById('pdFileRestore');
      rb.addEventListener('click', () => fr.click());
      fr.addEventListener('change', () => {
        if (!fr.files[0]) return;
        readFile(fr.files[0], ns => {
          if (confirm(`Replace this device's progress with the backup for "${ns.name}" (level ${ns.level})? Current progress will be overwritten.`)) {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(ns)); } catch (e) { msg('❌ Could not save (storage unavailable).'); return; }
            location.reload();
          }
        });
      });
    }
  },

  exportPayload(st) {
    return { app: 'DragonCraft', version: 3, exportedAt: new Date().toISOString(), state: st };
  },

  buildSummaryText(st) {
    const R = this.report(st);
    const set = st.settings;
    const L = [];
    L.push(`DragonCraft progress report — ${st.name}`);
    L.push(`Date: ${new Date().toLocaleDateString()}   Level ${st.level}, ${st.dragons.length}/${DRAGONS.length} dragons, ${Math.min(st.maxIsland + 1, BIOMES.length)}/${BIOMES.length} islands`);
    L.push('');
    L.push(`Play time: today ${this.fmtMin(R.today.ms)} • last 7 days ${this.fmtMin(R.week.ms)} • all time ${this.fmtMin(st.stats.totalMs)}`);
    L.push(`Active days (last 7): ${R.week.active} • current streak: ${R.streak} day${R.streak === 1 ? '' : 's'}${set.dailyGoalQ ? ` • daily goal met ${R.week.goalDays}/7 days` : ''}`);
    L.push(`Questions: ${R.asked} total, ${R.week.q} this week • right on first try: ${R.pct}% • average ${R.avgS ? R.avgS.toFixed(0) : '–'}s each`);
    L.push('');
    ['Math', 'English', 'Science'].forEach(sub => {
      const s = R.subjects[sub];
      L.push(`${sub}: ${s.asked ? s.pct + '% first try over ' + s.asked + ' questions' : 'not tried yet'}${s.trend ? ' — ' + s.trend.replace(/^[^ ]+ /, '') : ''}`);
    });
    L.push('');
    L.push('Skills (level out of 5, first-try %):');
    R.cats.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => L.push(`  • ${c.name}: level ${c.tier || '–'}, ${c.pct}% (${c.asked} questions) — ${this.statusOf(c)[0]}`));
    const ins = this.insights(st, R).map(x => x.t.replace(/<[^>]+>/g, ''));
    if (ins.length) { L.push(''); L.push('Highlights:'); ins.forEach(t => L.push('  • ' + t)); }
    return L.join('\n');
  },

  buildCsv(st) {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['time', 'subject', 'skill', 'level', 'first_try', 'tries', 'seconds', 'review_question', 'skipped', 'island']];
    st.stats.log.forEach(r => rows.push([new Date(r.t).toISOString(), r.subj, q(r.cat), r.tier || '', this.isFirst(r) ? 1 : 0, r.tries, (r.ms / 1000).toFixed(1), r.review ? 1 : 0, r.skip ? 1 : 0, r.island || '']));
    return rows.map(r => r.join(',')).join('\n');
  },

  downloadFile(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },

  async shareReport(st, ro, msg) {
    const text = this.buildSummaryText(st);
    const file = new File([JSON.stringify(this.exportPayload(st), null, 2)], `dragoncraft-${dayKey()}.json`, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `DragonCraft report — ${st.name}`, text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: `DragonCraft report — ${st.name}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        msg('Sharing is not available here — the summary was copied instead.');
        return;
      }
      if (!ro) { this.state.lastBackup = Date.now(); this.save(); }
      msg('✅ Shared.');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      msg('Could not share from this browser. Try “Copy summary” or “Download backup”.');
    }
  },

  printReport(st, R) {
    const cats = R.cats.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById('printReport').innerHTML = `
      <h1>DragonCraft progress report</h1>
      <p><b>${esc(st.name)}</b> — printed ${new Date().toLocaleString()}</p>
      <h2>Summary</h2>
      <ul>
        <li>Play time: today ${this.fmtMin(R.today.ms)}, last 7 days ${this.fmtMin(R.week.ms)}, all time ${this.fmtMin(st.stats.totalMs)}</li>
        <li>Active days this week: ${R.week.active}/7 • streak: ${R.streak} day(s)</li>
        <li>Questions: ${R.asked} • right on first try: ${R.pct}% • avg ${R.avgS ? R.avgS.toFixed(0) : '–'}s</li>
        <li>Game: level ${st.level}, ${st.dragons.length}/${DRAGONS.length} dragons, ${Math.min(st.maxIsland + 1, BIOMES.length)}/${BIOMES.length} islands, ${Object.keys(st.achievements).length}/${ACHIEVEMENTS.length} badges</li>
      </ul>
      <h2>Math, English &amp; Science</h2>
      <table><tr><th>Subject</th><th>Questions</th><th>First-try %</th><th>Avg time</th></tr>
      ${['Math', 'English', 'Science'].map(s => { const x = R.subjects[s]; return `<tr><td>${s}</td><td>${x.asked}</td><td>${x.asked ? x.pct + '%' : '–'}</td><td>${x.asked ? Math.round(x.avgS) + 's' : '–'}</td></tr>`; }).join('')}</table>
      <h2>Skills</h2>
      <table><tr><th>Skill</th><th>Level (1-5)</th><th>First try</th><th>Questions</th><th>Avg time</th><th>Status</th></tr>
      ${cats.map(c => `<tr><td>${esc(c.name)}</td><td>${c.tier || '–'}</td><td>${c.pct}%</td><td>${c.asked}</td><td>${c.avgS.toFixed(0)}s</td><td>${this.statusOf(c)[0]}</td></tr>`).join('')}</table>
      <h2>Highlights</h2>
      <ul>${this.insights(st, R).map(x => `<li>${x.t}</li>`).join('')}</ul>
      <p style="font-size:11px;color:#555">Levels are this game's own difficulty steps (about Grade 2 to Grade 6). They are not an official grade-level or IQ test.</p>`;
    setTimeout(() => window.print(), 80);
  },

  // ------------------------------------------------------------------ TIME LIMITS, BEDTIME, BREAKS
  startTimeTracking() {
    if (this._timer) return;
    this.sinceBreakMs = 0;
    this._tickCount = 0;
    this._timer = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const S = this.state.stats;
    const hidden = id => document.getElementById(id).classList.contains('hidden');
    const playing = document.visibilityState === 'visible' && hidden('titleOverlay') && hidden('parentOverlay') && hidden('lockOverlay') && hidden('tutorialOverlay');
    if (playing) {
      S.totalMs += 1000;
      const dk = dayKey();
      (S.daily[dk] || (S.daily[dk] = { ms: 0, q: 0, first: 0 })).ms += 1000;
      this.sinceBreakMs = (this.sinceBreakMs || 0) + 1000;
      this._tickCount++;
      if (this._tickCount % 10 === 0) this.save();
    }
    this.checkLocks(false);
  },

  inBedtime(now) {
    const set = this.state.settings;
    const [sh, sm] = set.bedStart.split(':').map(Number), [eh, em] = set.bedEnd.split(':').map(Number);
    const t = now.getHours() * 60 + now.getMinutes(), a = sh * 60 + sm, b = eh * 60 + em;
    if (a === b) return false;
    return a < b ? t >= a && t < b : t >= a || t < b;
  },

  // Returns true when a lock screen is (now) showing
  checkLocks(force) {
    const set = this.state.settings, S = this.state.stats;
    if (!document.getElementById('lockOverlay').classList.contains('hidden')) return true;
    if (!document.getElementById('parentOverlay').classList.contains('hidden')) return false; // never lock parents out of the dashboard
    if (set.bedtimeOn && !(this.bedOverrideUntil > Date.now()) && this.inBedtime(new Date())) { this.showLock('bedtime'); return true; }
    const dk = dayKey();
    const used = (S.daily[dk] || {}).ms || 0, extra = S.extra[dk] || 0;
    if (set.limitMin > 0 && used >= set.limitMin * 60000 + extra) { this.showLock('limit'); return true; }
    if (!force && set.breakMin > 0 && (this.sinceBreakMs || 0) >= set.breakMin * 60000 && document.getElementById('titleOverlay').classList.contains('hidden')) { this.showLock('break'); return true; }
    return false;
  },

  showLock(kind) {
    const set = this.state.settings;
    this.lockKind = kind;
    this.joy = { x: 0, y: 0, id: null };
    this.stopSpeaking();
    const ov = document.getElementById('lockOverlay');
    const actions = document.getElementById('lockActions');
    const cd = document.getElementById('lockCountdown');
    actions.textContent = '';
    cd.classList.add('hidden');
    clearInterval(this._breakT);
    const fmt = t => { const [h, m] = t.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    const btn = (label, fn, cls = '') => { const b = document.createElement('button'); b.className = 'pd-btn ' + cls; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); return b; };

    if (kind === 'limit') {
      document.getElementById('lockEmoji').textContent = '🌙';
      document.getElementById('lockTitle').textContent = 'Great adventuring today!';
      document.getElementById('lockText').textContent = `You used all ${set.limitMin} minutes of dragon time for today. Your dragons are resting — see you tomorrow! 🐉💤`;
      btn('👪 Parent options', () => this.lockParentOptions('limit'));
    } else if (kind === 'bedtime') {
      document.getElementById('lockEmoji').textContent = '😴';
      document.getElementById('lockTitle').textContent = 'The dragons are sleeping';
      document.getElementById('lockText').textContent = `Dragon time opens again at ${fmt(set.bedEnd)}. Sweet dreams! 🌙`;
      btn('👪 Parent options', () => this.lockParentOptions('bedtime'));
    } else {
      document.getElementById('lockEmoji').textContent = '🤸';
      document.getElementById('lockTitle').textContent = 'Stretch break!';
      document.getElementById('lockText').textContent = `You have been playing for ${set.breakMin} minutes. Stand up, stretch, drink some water and look out of the window for a minute.`;
      let left = 60;
      cd.classList.remove('hidden');
      cd.textContent = `${left}`;
      const go = btn('Back to the adventure ▶', () => { this.hideLock(); this.sinceBreakMs = 0; }, 'primary');
      go.disabled = true;
      this._breakT = setInterval(() => {
        left--;
        if (left <= 0) { clearInterval(this._breakT); cd.textContent = '✅'; go.disabled = false; }
        else cd.textContent = `${left}`;
      }, 1000);
    }
    ov.classList.remove('hidden');
  },

  hideLock() {
    document.getElementById('lockOverlay').classList.add('hidden');
    clearInterval(this._breakT);
    this.lockKind = null;
  },

  lockParentOptions(kind) {
    const box = document.getElementById('lockActions');
    const after = () => {
      box.textContent = '';
      const add = (label, fn) => { const b = document.createElement('button'); b.className = 'pd-btn'; b.textContent = label; b.addEventListener('click', fn); box.appendChild(b); };
      const S = this.state.stats, dk = dayKey();
      if (kind === 'limit') {
        [15, 30, 60].forEach(m => add(`+${m} min`, () => { S.extra[dk] = (S.extra[dk] || 0) + m * 60000; this.save(); this.hideLock(); }));
      } else {
        add('+30 min tonight', () => { this.bedOverrideUntil = Date.now() + 30 * 60000; this.hideLock(); });
      }
      add('Open dashboard', () => { this.hideLock(); this.openParent(true); });
      add('Cancel', () => this.showLock(kind));
    };
    if (!this.getPin()) { after(); return; }
    this.pinForm(box, {
      title: 'Parent PIN',
      button: 'Unlock',
      cancel: () => this.showLock(kind),
      onSubmit: (v, msg, input) => { if (this.tryPin(v, msg)) after(); else input.value = ''; }
    });
  }
});
