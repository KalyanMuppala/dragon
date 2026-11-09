// Offline + update test for the service worker (real-time browser, needs puppeteer-core):
//   npm install --no-save puppeteer-core && node tests/offline.test.js
// 1) After the worker installs, killing the web server must NOT stop the game from opening and playing.
// 2) While the worker is active, a newly deployed version must show up on the very next load (no stale copy).
const puppeteer = require('puppeteer-core');
const { execSync, spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FILES = ['index.html', 'questions.js', 'voxel.js', 'game.js', 'parent.js', 'styles.css', 'manifest.json', 'icon-180.png', 'icon-512.png', 'sw.js'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' -> ' + detail)); };

async function newSite(port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-site-'));
  FILES.forEach(f => fs.copyFileSync(path.join(ROOT, f), path.join(dir, f)));
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: dir, stdio: 'ignore' });
  await sleep(1200);
  return { dir, server };
}
const launch = () => puppeteer.launch({ executablePath: CHROME, headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'dc-prof-')), args: ['--no-sandbox'] });

(async () => {
  // ---------- offline
  let { server, dir } = await newSite(8791);
  let browser = await launch(), page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://localhost:8791/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.evaluate(() => { window.game.state.coins = 777; window.game.save(); });
  await page.reload({ waitUntil: 'networkidle0' });
  check('service worker controls the page', await page.evaluate(() => !!navigator.serviceWorker.controller));
  server.kill('SIGKILL'); await sleep(800);
  let reachable = true; try { execSync('curl -s -m 2 http://localhost:8791/index.html -o /dev/null'); } catch (e) { reachable = false; }
  check('server is really down', !reachable);
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  const off = await page.evaluate(() => ({ game: !!window.game, coins: window.game && window.game.state.coins, play: !!document.getElementById('btnPlayNow') }));
  check('game opens offline with saved progress', off.game && off.play && off.coins === 777, JSON.stringify(off));
  const played = await page.evaluate(async () => {
    const g = window.game; document.getElementById('btnPlayNow').click(); document.getElementById('tutSkip').click();
    g.state.daily.pendingChest = false; document.getElementById('chestOverlay').classList.add('hidden');
    g.hero.x = g.hero.targetX = g.currentTarget.x; g.hero.y = g.hero.targetY = g.currentTarget.y; g.nextForgeAt = 0; g.checkObjectiveReached();
    [...document.querySelectorAll('.rune-stone-btn')].find(b => b.dataset.val === String(g.activeChallenge.correct)).click();
    await new Promise(r => setTimeout(r, 900)); return g.state.qCount;
  });
  check('a question can be answered offline', played === 1, String(played));
  check('no JS errors offline', errs.length === 0, errs.join('; '));
  await browser.close();

  // ---------- updates
  ({ server, dir } = await newSite(8792));
  const stamp = v => {
    fs.writeFileSync(path.join(dir, 'index.html'), fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/\?v=[A-Za-z0-9_]+/g, `?v=build${v}`));
    fs.writeFileSync(path.join(dir, 'game.js'), fs.readFileSync(path.join(dir, 'game.js'), 'utf8').replace(/\nwindow\.__BUILD = \d+;/g, '') + `\nwindow.__BUILD = ${v};`);
  };
  stamp(1);
  browser = await launch(); page = await browser.newPage();
  await page.goto('http://localhost:8792/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle0' });
  check('first version loads under the worker', (await page.evaluate(() => window.__BUILD)) === 1);
  for (const v of [2, 3]) {
    await sleep(1300); stamp(v); await sleep(1300); // python's server has 1-second timestamp precision
    await page.reload({ waitUntil: 'networkidle0' });
    check(`new deploy #${v} appears immediately`, (await page.evaluate(() => window.__BUILD)) === v);
  }
  await browser.close(); server.kill();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('crashed', e); process.exit(2); });
