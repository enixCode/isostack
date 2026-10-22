// Films a server opening then closing, animations on: frames of its front face at a few moments of
// the 0.4 s fade, side by side in one PNG. Pages and the browser profile go to <projectDir>/.out/.
// Usage: node tools/fade-test.mjs [projectDir] [out.png]   (default <projectDir>/.out/fade.png)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, browser, bundle, evaluate, outDir, sleep, withLock } from './common.mjs';
const dir = resolve(process.argv[2] ?? ROOT), out = outDir(dir), png = resolve(process.argv[3] ?? join(out, 'fade.png'));
mkdirSync(out, { recursive: true });
const file = join(out, 'fade-test.html');
writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#eef1f5;padding:10px}</style>
<iso-server label="srv"></iso-server><script type="module">${bundle(dir)}</script>`);
const frames = [];
await withLock('fade-test', async () => {
  const cdp = await browser(join(out, 'edge-fade'), { size: '700,460' });
  try {
    await cdp.send('Page.enable');
    const loaded = new Promise(r => cdp.on('Page.loadEventFired', r));
    await cdp.send('Page.navigate', { url: pathToFileURL(file).href });
    await Promise.race([loaded, sleep(10000)]);
    await sleep(1200);
    const clip = { x: 60, y: 200, width: 460, height: 200, scale: 1 };
    const shoot = async label => frames.push({ label, data: (await cdp.send('Page.captureScreenshot', { format: 'png', clip })).data });
    for (const [action, label] of [['true', 'opening'], ['false', 'closing']]) {
      const t0 = Date.now();
      await evaluate(cdp, `document.querySelector('iso-server').open = ${action}; true`);
      for (const at of [60, 160, 260, 360, 700]) {
        await sleep(Math.max(0, at - (Date.now() - t0)));
        await shoot(`${label} ${Date.now() - t0} ms`);
      }
      await sleep(800);
    }
    // The frames side by side, saved as one PNG.
    writeFileSync(join(out, 'fade.html'), `<!doctype html><style>body{margin:0;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;background:#888;font:13px monospace}figure{margin:0;background:#fff}img{width:100%}figcaption{padding:2px 6px}</style>
${frames.map(f => `<figure><img src="data:image/png;base64,${f.data}"><figcaption>${f.label}</figcaption></figure>`).join('')}`);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 300, deviceScaleFactor: 1, mobile: false });
    const sheet = new Promise(r => cdp.on('Page.loadEventFired', r));
    await cdp.send('Page.navigate', { url: pathToFileURL(join(out, 'fade.html')).href });
    await Promise.race([sheet, sleep(10000)]);
    writeFileSync(png, Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data, 'base64'));
  } finally { cdp.close(); }
});
console.log('frames:', frames.map(f => f.label).join(', '));
console.log(`Frames side by side: ${png}`);
