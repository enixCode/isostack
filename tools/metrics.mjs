// Static cost of every component of the project (or a copy), with no browser: SVG size, shapes (each <use>
// expanded by what it uses), glowing lights (filtered by CSS), animated shapes, SVG filters, and the
// time of draw(). Then the totals of the playground scene, the one ab.mjs renders. Writes
// <projectDir>/.out/metrics.json, and compares with <projectDir>/.out/baseline/metrics.json if present
// (an earlier metrics.json copied there).
// Usage: node tools/metrics.mjs [projectDir] [--json]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, camel, components, load, outDir } from './common.mjs';

const dir = resolve(process.argv.slice(2).find(a => !a.startsWith('--')) ?? ROOT);
const { draw } = await load(dir, 'core/draw.js');
const models = {};
for (const n of components(dir)) models[n] = (await load(dir, `components/${n}/draw.js`))[camel(n)];

const count = (s, re) => (s.match(re) || []).length;
const tally = s => ({
  nodes: count(s, /<[a-zA-Z]/g),
  leds: count(s, /class="[^"]*\b(led|fault)\b/g),
  animated: count(s, /class="[^"]*\b(activity|pulse|fault)\b/g),
  filters: count(s, /filter="url\(/g),
});
// Shapes of the drawing (everything after <defs>), each <use href="#id"> adding the shapes of #id.
function measure(svg) {
  const defs = svg.slice(svg.indexOf('<defs>'), svg.indexOf('</defs>')), drawing = svg.slice(svg.indexOf('</defs>'));
  const used = {};
  for (const [, tag, id, inner] of defs.matchAll(/<(g|symbol) id="([\w-]+)"[^>]*>([\s\S]*?)<\/\1>/g)) used[id] = tally(inner);
  const t = tally(drawing);
  for (const [, id] of drawing.matchAll(/<use [^>]*href="#([\w-]+)"/g)) for (const k in t) t[k] += used[id]?.[k] ?? 0;
  t.filtered = t.leds + t.filters;
  t.kb = +(svg.length / 1024).toFixed(1);
  return t;
}
function time(model, options) {
  for (let i = 0; i < 20; i++) draw(model, options);
  const start = performance.now();
  for (let i = 0; i < 200; i++) draw(model, options);
  return +((performance.now() - start) / 200).toFixed(3);
}

const rows = [];
for (const [name, model] of Object.entries(models)) {
  const options = { label: 'web-01' };
  rows.push({ name, ...measure(draw(model, options)), drawMs: time(model, options), ...(model.container ? { openNodes: measure(draw(model, { ...options, open: true })).nodes } : {}) });
}
rows.sort((a, b) => b.nodes - a.nodes);

// The playground scene: every <iso-*> tag of the copy's template, with its attributes.
const template = readFileSync(join(dir, 'demo/playground.html'), 'utf8');
const scene = { elements: 0, nodes: 0, leds: 0, animated: 0, filters: 0, filtered: 0, kb: 0, drawMs: 0 };
for (const [, name, attrs] of template.matchAll(/<iso-([a-z-]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/g)) {
  const options = Object.fromEntries([...attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? '']));
  const m = measure(draw(models[name], options));
  scene.elements++;
  for (const k of ['nodes', 'leds', 'animated', 'filters', 'filtered', 'kb']) scene[k] += m[k];
  scene.drawMs += time(models[name], options);
}
scene.kb = +scene.kb.toFixed(1);
scene.drawMs = +scene.drawMs.toFixed(2);

const record = { dir, components: rows, scene };
mkdirSync(outDir(dir), { recursive: true });
writeFileSync(join(outDir(dir), 'metrics.json'), JSON.stringify(record, null, 2));
if (process.argv.includes('--json')) { console.log(JSON.stringify(record)); process.exit(0); }
const basePath = join(outDir(dir), 'baseline', 'metrics.json'), base = existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : null;
const col = (v, w = 7) => String(v).padStart(w);
console.log(`component       ${col('KB')}${col('shapes')}${col('lights')}${col('anim')}${col('filters')}${col('drawMs', 8)}`);
for (const r of rows) {
  const b = base?.components.find(c => c.name === r.name);
  console.log(`${r.name.padEnd(16)}${col(r.kb)}${col(r.nodes)}${col(r.leds)}${col(r.animated)}${col(r.filtered)}${col(r.drawMs, 8)}${b && b.nodes !== r.nodes ? `   (baseline ${b.nodes} shapes, ${b.filtered} filtered)` : ''}`);
}
console.log(`scene: ${JSON.stringify(scene)}`);
if (base) console.log(`baseline scene: ${JSON.stringify(base.scene)}`);
console.log('shapes: SVG elements drawn, uses expanded; lights: elements with the CSS glow filter (.led, .fault); filtered: lights plus filter="url(...)" attributes.');
