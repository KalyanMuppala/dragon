# DragonCraft — Development Handoff

Static web game, no build step, no dependencies. Plain JS + Canvas + CSS. Hosted on GitHub Pages.

## Files
| File | Role |
|---|---|
| `index.html` | Page shell: HUD, overlays (title, tutorial, question card, chest, menus, parent dashboard, lock screen), script tags with `?v=__V__` cache-buster |
| `questions.js` | **Question engine** (pure logic + canvas diagrams, no DOM). Seeded generators, 5 difficulty tiers, word banks, validation. |
| `game.js` | **Game engine**: sound/music, data (dragons, islands, heroes, badges, facts), save model (`defaultSaveState`, `normalizeSave`), `DragonCraftWorld` class (world, battles, question card, adaptive learning, badges, menus) |
| `parent.js` | **Parent tools**, mixed into `DragonCraftWorld.prototype`: PIN, dashboard, settings, time limits/bedtime/breaks, reports/backup |
| `styles.css` | All styling (iPad safe areas, `100dvh`, touch-action rules, print stylesheet, reduced-motion) |
| `manifest.json`, `icon-180.png`, `icon-512.png` | Add-to-Home-Screen metadata/icon |
| `tests/questions.test.js` | Node test of the question engine |
| `tests/e2e.js`, `tests/run-e2e.sh` | Headless-Chrome end-to-end test (macOS) |
| `.github/workflows/deploy.yml` | Deploys to Pages; replaces `__V__` in `index.html` with the commit hash |

Script load order matters: `questions.js` → `game.js` → `parent.js`. `window.game` is created on `DOMContentLoaded`.

## Question engine (`questions.js`)
- `buildChallenge({kind, tier, seed})` returns a validated challenge `{topic, prompt, hint, correct, choices[3], draw(ctx), passage, cat, subj, tier, seed, sig}`.
- **Seeded** (mulberry32): same `(kind, tier, seed)` ⇒ identical question. This powers spaced review (a missed question is stored as `{seed, kind, tier}` and rebuilt exactly).
- 19 kinds: math `mult div addsub algebra frac area place clock pattern`; science `sci_life sci_earth sci_matter`; English `vocab spelling grammar punct phonics wordparts reading`. `KIND_META` maps kind → skill name (`cat`), subject, icon.
- Math generators compute answers from parameters and expose `meta` for tests. Distractors come from common mistakes (`numChoices`, `fracChoices`, `timeChoices`) and are guaranteed distinct from the answer.
- Word banks (`BANK`, 275 rows): `[difficulty, question, hint, correct, wrong1, wrong2, big text, passage]`. Selection is weighted toward rows near the requested tier.
- `validateChallenge` rejects anything with ≠3 distinct choices, missing answer, or `NaN/undefined` text; `buildChallenge` retries with `seed+1…` and finally falls back to a safe question (`QUESTION_FAILURES` counts incidents — the e2e test asserts it stays 0).
- Diagrams draw into a 540×150 logical canvas (DPR-scaled by `openSpellForge`).

## Adaptive learning (`game.js`)
- `state.skills[cat] = {tier 1-5, recent[0|1 ×8], seen}`; start tier = `settings.grade − 1`.
- `recordAnswer()` (once per question; guarded by `challenge.recorded`): updates per-skill stats, daily stats, log, run streak, tier (5 first-try in a row ⇒ up; ≥4 misses of last 5 ⇒ down), review queue (max 12, each question re-asked ≤3×), daily goal bonus, badges.
- `nextChallenge()`: due review item (80%) → else pick subject (Math .45 / English .35 / Science .2, or restricted by parent focus / island focus) → pick skill weighted toward weak/untried skills → build at that skill's tier; avoids repeats via `recentSigs`.
- Island mini-goal focus (`BIOMES[i].goal.focus`) applies to goal questions only; parent `settings.focus` overrides everything unless `balanced`.

## Save model
`localStorage['dragoncraft_prodigy_save_v2']` (key unchanged so old progress carries over) holds one JSON object; always passed through `normalizeSave()` (fills defaults, clamps numbers, upgrades legacy skill names via `LEGACY_CATS`, rebuilds the squad for pre-squad saves, filters unknown dragons/gear). `normalizeSave` is idempotent (tested). Parent PIN is stored separately (`dragoncraft_parent_pin_v1`, base64 — a kid-lock, not security) along with the lockout timestamp.

Key fields: `settings` (grade, focus, dailyGoalQ, limitMin, bedtimeOn/bedStart/bedEnd, breakMin, autoRead, music), `stats` (sessions, totalMs, `byCat`, `daily[YYYY-MM-DD] = {ms,q,first,goal}`, `log` ≤400, `mistakes` ≤150, `extra[day]` added minutes, reviewFixed, feeds), `skills`, `review`, `achievements`, `daily` (login streak/chest), dragons/squad/levels, island progress.

## Parent tools (`parent.js`)
- PIN: setup (enter twice), login, 5 wrong tries ⇒ 60 s lockout persisted in localStorage.
- Dashboard tabs are pure functions of a state object, so the same code renders live data or an imported report (`viewState`, read-only). `report(st)` computes all numbers; `insights(st, R)` generates the highlights.
- Time controls: a 1 s `tick()` accumulates play time (only while the page is visible and no overlay such as title/dashboard/lock is open) and calls `checkLocks()` → `showLock('limit'|'bedtime'|'break')`. Locks never cover the parent dashboard. Parent overrides (PIN): +15/30/60 min or +30 min tonight, or open the dashboard.
- Reports: summary text, CSV, JSON backup, restore (confirm + reload), Web Share (with file when supported), print (injects a light-theme report into `#printReport`; print stylesheet hides everything else).

## Testing
```
node tests/questions.test.js     # 38,000 generated questions, bank checks, spelling vs /usr/share/dict/words
bash tests/run-e2e.sh            # 37 browser checks (needs Google Chrome on macOS)
```
The e2e test drives the real UI: onboarding, daily chest, adaptive levels, spaced review, all 19 kinds × 5 tiers through the question card, battle guards, parent PIN/lockout, settings, every lock type, backup round-trip, old-save migration.

## Known limitations / ideas
- Limits and reports live on the device. A child who clears Safari website data bypasses limits and loses progress (parents are nudged to back up and install to the Home Screen). Cross-device live sync would need a backend + accounts (deliberately not built; reports can be shared as files instead).
- Question banks are finite (~275 rows + generated math); adding more rows to `BANK` is the easiest content extension.
- Levels are the game's own difficulty steps, not a normed assessment; the game makes no IQ or national-ranking claims.
- Not verified on a physical iPad by the author: thumbstick feel, audio, speech synthesis, share sheet and print-to-PDF depend on the device.
