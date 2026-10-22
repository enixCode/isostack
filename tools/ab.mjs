// Final A/B comparison of project copies on a quiet machine. Each round measures every copy's
// playground (idle, pan, zoom, status), in an order that rotates from round to round, after waiting
// for the page to render steadily; then each copy's 1000-icon page once per round. Prints medians.
// Pages go to <copyDir>/.out/; the browser profile and the results JSON to the repository's .out/.
// Usage: node tools/ab.mjs <rounds> <copyDir> <copyDir> ... [--cpu]
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, browser, evaluate, outDir, playground, sleep, withLock } from './common.mjs';
import { scalePage } from './scale.mjs';

const args = process.argv.slice(2), cpu = args.includes('--cpu');
const [rounds, ...dirs] = args.filter(a => !a.startsWith('--')).map((a, i) => i ? resolve(a) : +a);
const median = v => { const s = v.filter(x => x !== null && x !== undefined).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 'n/a'; };
function frames(stamps) {
  const d = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
  if (d.length < 2) return { fps: 0, p95: 2000, janky: 100 };
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  return { fps: +(1000 / mean).toFixed(1), p95: +d[Math.min(d.length - 1, Math.floor(.95 * d.length))].toFixed(1), janky: +(100 * d.filter(x => x > 25).length / d.length).toFixed(1) };
}

async function open(cdp, file) {
  const loaded = new Promise(r => cdp.on('Page.loadEventFired', r));
  await cdp.send('Page.navigate', { url: pathToFileURL(file).href });
  await Promise.race([loaded, sleep(60000)]);
  // Steady: 20 frames in a row under 40 ms, or 15 s at most.
  await evaluate(cdp, `new Promise(r => { let ok = 0, last = performance.now(); const s = last; const f = t => { ok = t - last < 40 ? ok + 1 : 0; last = t; ok >= 20 || t - s > 15000 ? r(true) : requestAnimationFrame(f); }; requestAnimationFrame(f); })`, 120000);
}

async function playgroundRun(cdp, dir) {
  const file = join(outDir(dir), 'ab.html');
  mkdirSync(outDir(dir), { recursive: true });
  writeFileSync(file, playground(dir, { fonts: false }));
  await open(cdp, file);
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  await evaluate(cdp, `window.__start = () => { window.__f = []; const loop = t => { if (!window.__f) return; window.__f.push(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
    window.__stop = () => { const f = window.__f; window.__f = null; return f; }; true`);
  const inputs = [], input = p => inputs.push(cdp.send('Input.dispatchMouseEvent', { button: 'left', ...p }, 60000).catch(() => {}));
  const paced = async (ms, every, fn) => { const start = Date.now(); while (Date.now() - start < ms) { fn(Date.now() - start); await sleep(every); } };
  const out = {};
  const run = async (name, act) => {
    const before = await metrics();
    await evaluate(cdp, '__start()');
    await act();
    const stamps = await evaluate(cdp, '__stop()', 60000), after = await metrics();
    out[name] = { ...frames(stamps), main: Math.round((after.TaskDuration - before.TaskDuration) * 1000) };
    await Promise.race([Promise.all(inputs.splice(0)), sleep(15000)]);
    await sleep(300);
  };
  await run('idle', () => sleep(2000));
  await run('pan', async () => {
    const at = t => ({ x: 640 + 260 * Math.sin(t / 480), y: 420 + 140 * Math.sin(t / 360) });
    input({ type: 'mousePressed', ...at(0), clickCount: 1, buttons: 1 });
    await paced(3000, 16, t => input({ type: 'mouseMoved', ...at(t), buttons: 1 }));
    input({ type: 'mouseReleased', ...at(3000), clickCount: 1, buttons: 0 });
    await sleep(250);
  });
  await run('zoom', () => paced(2000, 33, t => input({ type: 'mouseWheel', x: 640, y: 420, deltaX: 0, deltaY: Math.floor(t / 500) % 2 ? 12 : -12, modifiers: 2 })));
  await run('status', () => evaluate(cdp, `new Promise(done => {
    const els = [...document.querySelectorAll('#layer *')].filter(e => e.shadowRoot), seq = ['warn', 'down', 'unknown', 'ok'], start = performance.now();
    let i = 0;
    const step = () => { if (performance.now() - start > 2000) return done(true); els[(i * 7) % els.length].setAttribute('status', seq[i % 4]); i++; requestAnimationFrame(step); };
    requestAnimationFrame(step);
  })`, 60000));
  return out;
}

async function scaleRun(cdp, dir) {
  // A step that does not finish in time is recorded as null: the slowest pages never finish some of them.
  const safe = (expression, timeout) => evaluate(cdp, expression, timeout).catch(() => null);
  const file = join(outDir(dir), 'ab-scale.html');
  writeFileSync(file, scalePage(dir, 1000));
  const t0 = Date.now(), loaded = new Promise(r => cdp.on('Page.loadEventFired', r));
  await cdp.send('Page.navigate', { url: pathToFileURL(file).href });
  await Promise.race([loaded, sleep(60000)]);
  const ready = await safe(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r({ create: window.__createMs, ready: performance.now() }))))`, 90000);
  const loop = move => `new Promise(r => { const c = document.getElementById('canvas'), f = [], s = performance.now();
    const step = t => { f.push(t); const k = (t - s) / 2000; ${move ? `c.style.transform = 'translate(' + (-900 * Math.sin(k * Math.PI)) + 'px, ' + (-500 * Math.sin(k * Math.PI)) + 'px) scale(.35)';` : ''} t - s < 2000 ? requestAnimationFrame(step) : r(f); };
    requestAnimationFrame(step); setTimeout(() => r(f), 20000); })`;
  const idle = await safe(loop(false), 40000), pan = await safe(loop(true), 40000);
  const nodes = await safe(`[...document.querySelectorAll('#canvas > *')].reduce((n, e) => n + (e.shadowRoot?.querySelectorAll('*').length ?? 0), document.querySelectorAll('*').length)`, 30000);
  // Leave the heavy page for a blank one, so that the next copy starts on a quiet browser.
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(2000);
  const f = v => v ? frames(v) : { fps: null, p95: null };
  return { create: ready ? Math.round(ready.create) : null, firstPaint: ready ? Math.round(ready.ready) : null, nodes, idle: f(idle).fps, pan: f(pan).fps, panP95: f(pan).p95, wall: Date.now() - t0 };
}

const results = Object.fromEntries(dirs.map(d => [d, { play: [], scale: [] }]));
await withLock('ab', async () => {
  const cdp = await browser(join(outDir(ROOT), 'ab-edge'), { cpu });
  try {
    await cdp.send('Page.enable');
    await cdp.send('Performance.enable');
    await playgroundRun(cdp, dirs[0]); // warm-up, discarded
    for (let r = 0; r < rounds; r++) {
      const order = dirs.map((_, i) => dirs[(i + r) % dirs.length]);
      for (const d of order) results[d].play.push(await playgroundRun(cdp, d));
      for (const d of order) results[d].scale.push(await scaleRun(cdp, d));
      console.error(`round ${r + 1}/${rounds} done`);
    }
  } finally { cdp.close(); }
});

console.log(`A/B ${cpu ? 'cpu' : 'gpu'}, ${rounds} rounds, medians. Playground: fps / p95 ms / janky % / main ms. Scale: 1000 icons.`);
for (const d of dirs) {
  const { play, scale } = results[d], m = (sc, k) => median(play.map(p => p[sc][k]));
  console.log(`${basename(d).padEnd(8)} ` + ['idle', 'pan', 'zoom', 'status'].map(sc => `${sc} ${m(sc, 'fps')}/${m(sc, 'p95')}/${m(sc, 'janky')}%/${m(sc, 'main')}`).join('  '));
  const s = k => median(scale.map(x => x[k]));
  console.log(`${''.padEnd(8)} scale: create ${s('create')} ms, first paint ${s('firstPaint')} ms, ${s('nodes')} nodes, idle ${s('idle')} fps, pan ${s('pan')} fps (p95 ${s('panP95')} ms)`);
}
writeFileSync(join(outDir(ROOT), `ab-${cpu ? 'cpu' : 'gpu'}-${Date.now()}.json`), JSON.stringify(results, null, 2));
