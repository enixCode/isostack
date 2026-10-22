// Visual comparison of a project copy with a baseline copy: renders each component in a few variants
// with both, lists those whose SVG changed, and screenshots them side by side (baseline on the left,
// the copy on the right) under the shared browser lock, into <projectDir>/.out/compare/. Open the
// printed PNG with the Read tool.
// Usage: node tools/compare.mjs <baseDir> <projectDir> [component ...]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { camel, components, edge, load, outDir, withLock } from './common.mjs';

const args = process.argv.slice(2);
if (args.length < 2) { console.error('Usage: node tools/compare.mjs <baseDir> <projectDir> [component ...]'); process.exit(2); }
const base = resolve(args[0]), dir = resolve(args[1]), only = args.slice(2);
const out = join(outDir(dir), 'compare');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const sides = {};
for (const [key, root] of [['base', base], ['copy', dir]]) {
  const { draw } = await load(root, 'core/draw.js'), models = {};
  for (const n of components(root)) models[n] = (await load(root, `components/${n}/draw.js`))[camel(n)];
  sides[key] = { draw, models };
}
const changed = [];
for (const name of only.length ? only : components(dir)) {
  const m = sides.copy.models[name], bm = sides.base.models[name];
  const variants = [['label', { label: `${name}-01` }], ['warn', { status: 'warn', label: 'warn' }], ['down', { status: 'down' }]];
  if (m.container) variants.push(['open', { open: true, label: 'open' }]);
  if ((m.maximum?.width ?? Infinity) > m.minimum.width) variants.push(['big', { width: m.minimum.width + 5, depth: m.minimum.depth + 3, label: 'big' }]);
  for (const [tag, o] of variants) {
    const a = bm ? sides.base.draw(bm, o) : '', b = sides.copy.draw(m, o);
    if (a !== b) changed.push({ id: `${name}-${tag}`, tag, a, b });
  }
}
if (!changed.length) {
  console.log('No visual change: every rendered variant is identical to the baseline.');
  process.exit(0);
}
// At most 36 rows on the sheet: the labeled variant of each component first.
const shown = [...changed.filter(c => c.tag === 'label'), ...changed.filter(c => c.tag !== 'label')].slice(0, 36);
for (const c of shown) {
  writeFileSync(join(out, `${c.id}-base.svg`), c.a);
  writeFileSync(join(out, `${c.id}-copy.svg`), c.b);
}
writeFileSync(join(out, 'sheet.html'), `<!doctype html><meta charset="utf-8"><style>
body{margin:10px;background:#e8ecf2;font:12px monospace;display:grid;grid-template-columns:120px 1fr 1fr;gap:6px;align-items:center}
img{width:100%;height:230px;object-fit:contain;background:#eef1f5}b{grid-column:2}b+b{grid-column:3}</style>
<span></span><b>baseline</b><b>this copy</b>
${shown.map(c => `<span>${c.id}</span><img src="${c.id}-base.svg"><img src="${c.id}-copy.svg">`).join('\n')}`);
const png = join(out, 'sheet.png');
await withLock(`compare ${dir}`, async () => execFileSync(edge(), ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${join(out, 'edge')}`,
  `--window-size=1120,${Math.min(16000, 50 + shown.length * 236)}`, '--virtual-time-budget=3000', `--screenshot=${png}`, pathToFileURL(join(out, 'sheet.html')).href],
  { stdio: 'ignore', timeout: 90000 }));
console.log(`${changed.length} variants differ from the baseline: ${changed.map(c => c.id).join(' ')}`);
if (shown.length < changed.length) console.log(`The sheet shows ${shown.length} of them; pass component names to see others.`);
console.log(`Side by side (baseline left, this copy right): ${png}`);
