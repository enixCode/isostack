// Scale scenario: one page holding N isostack icons (every component in turn, a few warn, down and
// unknown), laid out on a canvas zoomed out to 0.35 the way a diagram tool with thousands of icons
// would show them, so that only part of them is in view. No playground around them: this measures
// the library alone. Reports the time to create and render the icons, memory, and frames while idle
// and while the canvas pans. ab.mjs uses the same page. Writes into <projectDir>/.out/.
// Usage: node tools/scale.mjs [projectDir] [--cpu] [--n 1000]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, browser, bundle, components, evaluate, outDir, sleep, withLock } from './common.mjs';

export function scalePage(dir, n) {
  const names = components(dir), statuses = ['ok', 'ok', 'ok', 'warn', 'ok', 'down', 'ok', 'unknown'];
  let icons = '';
  for (let i = 0; i < n; i++) icons += `<iso-${names[i % names.length]} label="n-${i}" status="${statuses[i % statuses.length]}"></iso-${names[i % names.length]}>\n`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>scale</title><style>
html, body { margin: 0; height: 100%; overflow: hidden; background: #eef1f5; }
#canvas { position: absolute; left: 0; top: 0; transform-origin: 0 0; transform: scale(.35);
  display: grid; grid-template-columns: repeat(40, 320px); grid-auto-rows: 280px; align-items: end; justify-items: center; }
</style></head><body><div id="canvas">
${icons}</div>
<script type="module">
const start = performance.now();
${bundle(dir)}
window.__createMs = performance.now() - start;
</script></body></html>`;
}

function frames(stamps) {
  const d = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
  if (!d.length) return { frames: 0 };
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  return { frames: d.length, fps: +(1000 / mean).toFixed(1), p95: +d[Math.min(d.length - 1, Math.floor(.95 * d.length))].toFixed(1), max: +d.at(-1).toFixed(1) };
}

// Runs in an open DevTools session (the caller holds the browser lock).
export async function runScale(cdp, dir, out, n = 1000) {
  const file = join(out, `scale-${n}.html`);
  writeFileSync(file, scalePage(dir, n));
  await cdp.send('Page.enable');
  await cdp.send('Performance.enable');
  const loaded = new Promise(r => cdp.on('Page.loadEventFired', r)), t0 = Date.now();
  await cdp.send('Page.navigate', { url: pathToFileURL(file).href });
  await Promise.race([loaded, sleep(60000)]);
  // Time to the second frame after the script: creating, styling, laying out and painting them all.
  const ready = await evaluate(cdp, `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r({ create: window.__createMs, ready: performance.now() }))))`, 120000);
  const loadMs = Date.now() - t0;
  const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const nodes = await evaluate(cdp, `[...document.querySelectorAll('#canvas > *')].reduce((n, e) => n + (e.shadowRoot?.querySelectorAll('*').length ?? 0), document.querySelectorAll('*').length)`, 60000);
  const idle = await evaluate(cdp, `new Promise(r => { const f = [], s = performance.now(); const loop = t => { f.push(t); t - s < 2000 ? requestAnimationFrame(loop) : r(f); }; requestAnimationFrame(loop); })`, 120000);
  const pan = await evaluate(cdp, `new Promise(r => { const c = document.getElementById('canvas'), f = [], s = performance.now();
    const loop = t => { f.push(t); const k = (t - s) / 2000; c.style.transform = 'translate(' + (-900 * Math.sin(k * Math.PI)) + 'px, ' + (-500 * Math.sin(k * Math.PI)) + 'px) scale(.35)'; t - s < 2000 ? requestAnimationFrame(loop) : r(f); };
    requestAnimationFrame(loop); })`, 120000);
  const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  return {
    icons: n,
    createMs: Math.round(ready.create), firstPaintMs: Math.round(ready.ready), loadMs,
    heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), nodes,
    idle: frames(idle), pan: { ...frames(pan), mainMs: Math.round((after.TaskDuration - m.TaskDuration) * 1000) },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'))) {
  const args = process.argv.slice(2), dir = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--n') ?? ROOT);
  const n = args.includes('--n') ? +args[args.indexOf('--n') + 1] : 1000, cpu = args.includes('--cpu'), out = outDir(dir);
  mkdirSync(out, { recursive: true });
  const r = await withLock(`scale ${dir}`, async () => {
    const cdp = await browser(join(out, 'edge'), { cpu });
    try { return await runScale(cdp, dir, out, n); } finally { cdp.close(); }
  });
  console.log(`scale ${cpu ? 'cpu' : 'gpu'}: ${JSON.stringify(r)}`);
}
