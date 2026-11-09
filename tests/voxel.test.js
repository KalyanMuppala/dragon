// Run with:  node tests/voxel.test.js — checks the 10,000-dragon generator, foods, dimensions and island layouts.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const dr = game.slice(game.indexOf('const DRAGONS = ['), game.indexOf('];', game.indexOf('const DRAGONS = [')) + 2);
const sh = game.slice(game.indexOf('function shadeHex'), game.indexOf('\n}\n', game.indexOf('function shadeHex')) + 3);
const src = dr + sh + fs.readFileSync(path.join(root, 'voxel.js'), 'utf8') +
  ';globalThis.__V={DRAGONS,DRAGON_TOTAL,getDragon,dragonIdx,isDragonId,dragonIdAt,FOODS,FOOD_IDS,foodMatch,biomeAt,islandLayout,DIMS,ISLANDS_PER_DIM,RARITIES};';
const c = { console, Math, Set, Map, Array, Object, String, Number, JSON }; vm.createContext(c); vm.runInContext(src, c);
const V = c.__V; let bad = 0; const fail = m => { bad++; if (bad < 15) console.log('FAIL', m); };
const names = new Set(), ids = new Set(), rar = [0, 0, 0, 0, 0];
for (let i = 0; i < V.DRAGON_TOTAL; i++) {
  const id = V.dragonIdAt(i), d = V.getDragon(id);
  if (V.dragonIdx(id) !== i || d.id !== id) fail('id ' + i);
  if (ids.has(id)) fail('dup id'); ids.add(id); names.add(d.name);
  if (!V.FOODS[d.food] || !V.FOODS[d.food2] || d.food === d.food2) fail('food ' + id);
  if (!/^#[0-9a-f]{6}$/.test(d.color) || !/^#[0-9a-f]{6}$/.test(d.wing) || !/^#[0-9a-f]{6}$/.test(d.belly)) fail('color ' + id + ' ' + d.color);
  if (!(d.rarity >= 0 && d.rarity <= 4)) fail('rarity'); rar[d.rarity]++;
  if (V.foodMatch(d, d.food) !== 2 || V.foodMatch(d, d.food2) !== 1) fail('match');
}
if (V.isDragonId('x10000') || V.isDragonId('x3') || V.isDragonId('nope') || V.isDragonId(5) || !V.isDragonId('x25') || !V.isDragonId('ignis')) fail('isDragonId');
console.log('dragons:', ids.size, 'unique ids,', names.size, 'distinct names, rarity', rar.join('/'));
const dimsSeen = new Set();
for (let i = 0; i < 1500; i++) {
  const b = V.biomeAt(i);
  dimsSeen.add(b.dim);
  if (!b.title || !b.goal.n || !(b.goal.n >= 1)) fail('biome ' + i);
  if (!V.isDragonId(b.guardId) || !V.isDragonId(b.bossId)) fail('enemy ' + i);
  if (V.biomeAt(i) !== b) fail('cache');
  if (i % 6 === 0) {
    const path = [{ x: 1, y: 4 }, { x: 4, y: 4 }, { x: 7, y: 2 }];
    const L = V.islandLayout(i, 9, path);
    if (path.some(p => L.h[p.x][p.y] !== 0 || L.fluid[p.x][p.y])) fail('path not flat ' + i);
  }
}
if (V.biomeAt(0).guardId !== 'sprout') fail('first island guard');
console.log('islands: 1500 OK, dimensions:', [...dimsSeen].length, '| titles distinct:', new Set(Array.from({ length: 1500 }, (_, i) => V.biomeAt(i).title)).size);
console.log(bad ? `✗ ${bad} problems` : '✓ ALL VOXEL TESTS PASSED'); process.exit(bad ? 1 : 0);
