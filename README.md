# 🐉 DragonCraft: Prodigy Realm

A touch-first dragon adventure that makes **math, science and English** fun — built for kids around 9 (Grade 3–5) on iPad Safari, with a PIN-locked **Parent Dashboard** for progress tracking and screen-time controls.

**Play:** https://kalyanmuppala.github.io/dragon/ — type a hero name and tap PLAY NOW. No account needed. On iPad use **Share ▸ Add to Home Screen** for full-screen play (this also protects saved progress from Safari's storage clean-up).

## For kids
- Explore **12 themed voxel islands**, each with its own mini-goal (collect items or a spell combo), a guardian dragon and a boss.
- Collect and **tame 25 dragons**; equip up to 3 to follow you, level the lead dragon to 10, feed them with ⭐ coins, fill the **Dragon Book**.
- Every spell is powered by a question. **19 question types** across Math (multiplication, division, add/subtract, algebra, fractions, area & perimeter, place value & rounding, telling time, patterns), Science (life, earth & space, matter & energy) and English (vocabulary, spelling, grammar, punctuation, phonics, word parts, reading comprehension).
- Wrong answers show a hint and a retry — no punishment. 🔊 reads any question aloud.
- 6 hero looks, 32 badges, daily gift chest + day streak, daily question goal, level-ups, gentle background music.

## Adaptive learning
- Each skill has 5 levels (about Grade 2 → 6 difficulty). 5 first-try answers in a row move a skill up; several misses ease it back.
- Missed questions come back a few questions later (spaced review, same question) up to 3 times.
- Weaker skills are asked a little more often; the same question is never asked back-to-back.

## For parents (👪 Parents on the title screen, or tap the level star 5× in-game)
- **PIN lock** (4 digits, confirm on setup, 1-minute lockout after 5 wrong tries).
- **Dashboard:** Overview (play time, daily goal, streak, Math/English/Science performance, insights, weekly trends) • Skills (level, accuracy, last 8 answers, speed, status) • Activity (28-day calendar, recent mistakes, review queue) • Settings • Reports.
- **Controls:** daily time limit, bedtime lock, stretch-break reminders, starting grade, subject focus, daily goal, read-aloud.
- **Reports:** share (iPad share sheet), copy, print / save as PDF, CSV of answers, JSON backup & restore, and a read-only **report viewer** so you can open a report file sent from the iPad on your own phone.

## Privacy
There are no accounts, no servers and no analytics. Progress and parent data live in the browser's local storage on the device; reports leave the device only when a parent shares them. The game is **not an IQ test** and makes no comparison with other children.

## Run & test
- Open `index.html` in a browser (no build step), or `python3 -m http.server`.
- Question engine tests: `node tests/questions.test.js` (verifies tens of thousands of generated questions, spelling words against the system dictionary, determinism, diagrams).
- Browser end-to-end tests (macOS + Chrome): `bash tests/run-e2e.sh`; random-action test: `bash tests/run-monkey.sh 7 600`; offline/update test: `node tests/offline.test.js` (needs `npm i --no-save puppeteer-core`).
- Works **offline** after the first visit (service worker); online it always loads the newest version.
- Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`) and stamps a cache-busting version on the scripts and styles.

See `DEVELOPMENT_HANDOFF.md` for the architecture.
