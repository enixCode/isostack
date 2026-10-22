// Correctness oracle for the project (or a copy of it). For each component: the model contract; every size and
// status plus the minimum, maximum, hostile-label and open variants rendered and parsed as XML (no
// NaN or undefined, readable transforms, a hostile label stays text); details that repeat with size;
// then the live elements in headless Edge, a container holding a server (under the browser lock).
// Exit 0 and "ORACLE OK" on success. Renders go to <projectDir>/.out/oracle/.
// Usage: node tools/oracle.mjs [projectDir] [component ...] [--static] [--shot]
//   projectDir defaults to the repository root; --static skips the browser; --shot also saves a
//   screenshot of the live page.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, TOOLS, camel, components, edge, load, outDir, withLock } from './common.mjs';

const args = process.argv.slice(2), flags = args.filter(a => a.startsWith('--'));
const [dirArg, ...picked] = args.filter(a => !a.startsWith('--'));
const project = resolve(dirArg ?? ROOT);
const names = picked.length ? picked : components(project);
const fail = message => { console.error('ORACLE FAILED: ' + message); process.exit(1); };
const { draw, STATUSES } = await load(project, 'core/draw.js');
const run = names.length > 6 ? `${names.length}-components` : names.join('+'), out = join(outDir(project), 'oracle', run);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. Model contract and static renders.
const files = [], hostile = [], models = {};
for (const name of names) {
  for (const file of ['draw.js', `iso-${name}.js`]) if (!existsSync(join(project, 'components', name, file))) fail(`missing components/${name}/${file}`);
  const model = (await load(project, `components/${name}/draw.js`))[camel(name)];
  if (!model) fail(`components/${name}/draw.js must export a model named ${camel(name)}`);
  models[name] = model;
  if (model.name !== name) fail(`${name}: model.name must be "${name}"`);
  if (typeof model.title !== 'string' || !model.title) fail(`${name}: model.title is required`);
  for (const k of ['width', 'depth', 'height']) {
    if (!(model.defaults?.[k] > 0) || !(model.minimum?.[k] > 0)) fail(`${name}: defaults.${k} and minimum.${k} must be positive`);
    if (model.defaults[k] < model.minimum[k]) fail(`${name}: defaults.${k} is below minimum.${k}`);
    if (model.maximum && model.maximum[k] < model.defaults[k]) fail(`${name}: maximum.${k} is below defaults.${k}`);
  }
  const box = ['top', 'front', 'side'].every(f => typeof model[f] === 'function'), art = typeof model.art === 'function';
  if (box === art) fail(`${name}: a model is either a box (top, front, side) or a free shape (art), not both or neither`);
  if (model.container && !box) fail(`${name}: only a box can be a container`);
  if (model.extra && !box) fail(`${name}: extra() is for boxes`);
  if (!Array.isArray(model.sizes) || !model.sizes.length) fail(`${name}: sizes must list at least one [width, depth]`);
  if (/[<&]/.test(model.css ?? '')) fail(`${name}: css must not contain < or &`);
  for (const [, id] of (model.defs ?? '').matchAll(/id="([^"]+)"/g)) if (!id.startsWith(name + '-')) fail(`${name}: defs id "${id}" must start with "${name}-"`);
  const variants = [];
  for (const [width, depth] of model.sizes) for (const status of STATUSES) variants.push([`${width}x${depth}-${status}`, { width, depth, status, label: `${name}-01` }]);
  variants.push(['minimum', { width: 0, depth: 0, height: 0, label: 'x' }]);
  if (model.maximum) variants.push(['maximum', { width: 999, depth: 999, height: 999 }]);
  variants.push(['hostile', { label: '<b>&"x</b>' }]);
  if (box) variants.push(['open', { open: true, label: 'open' }]);
  for (const [tag, options] of variants) {
    const file = join(out, `${name}-${tag}.svg`);
    writeFileSync(file, draw(model, options));
    files.push(file);
    if (tag === 'hostile') hostile.push(file);
  }
  // Details repeat with size: a bigger box holds more shapes than the smallest one.
  if (box && (model.maximum?.width ?? Infinity) > model.minimum.width) {
    const count = svg => (svg.match(/<(rect|circle|use|path|ellipse|text|polygon|line)\b/g) || []).length;
    const small = draw(model, { width: 0, depth: 0 }), big = draw(model, { width: model.minimum.width + 4, depth: model.minimum.depth + 3 });
    if (count(big) <= count(small)) fail(`${name}: details must repeat with size (a bigger box draws no more shapes)`);
  }
}

// 2. Every file is valid XML with readable numbers, and a hostile label stays text.
const list = join(out, 'files.txt');
writeFileSync(list, files.join('\n'));
try {
  execFileSync('python', ['-I', '-c', `
import sys, re, xml.etree.ElementTree as E
hostile = set(sys.argv[1].split('|'))
N = r'[-+]?(\\d+\\.?\\d*|\\.\\d+)([eE][-+]?\\d+)?'
T = re.compile(r'\\s*((matrix|translate|scale|rotate|skewX|skewY)\\(\\s*' + N + r'(\\s*[\\s,]\\s*' + N + r')*\\s*\\)\\s*)+')
for f in open(sys.argv[2], encoding='utf-8').read().split('\\n'):
    text = open(f, encoding='utf-8').read()
    if 'NaN' in text or 'undefined' in text:
        sys.exit('NaN or undefined in ' + f)
    root = E.fromstring(text)
    if f in hostile and any(True for _ in root.iter('{http://www.w3.org/2000/svg}b')):
        sys.exit('hostile label became markup in ' + f)
    for el in root.iter():
        t = el.get('transform')
        if t is not None and not T.fullmatch(t):
            sys.exit('unreadable transform "' + t + '" in ' + f)
`, hostile.join('|'), list], { stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) { fail('XML: ' + (e.stderr?.toString() || e.message)); }

// 3. Live elements in a browser, served over http.
if (!flags.includes('--static')) {
  const live = names.map(name => {
    const m = models[name], box = typeof m.top === 'function', tag = `iso-${name}`;
    return `<${tag} label="${name}-01" resizable></${tag}>
<${tag} status="down" label="down"></${tag}>
<${tag} status="unknown"></${tag}>
${box ? `<${tag} open label="open"></${tag}>` : ''}
${m.container ? `<${tag} open width="${Math.max(m.defaults.width, 7)}" depth="${Math.max(m.defaults.depth, 6)}" label="host"><iso-server x="1" z="1" width="4" depth="4" label="child" status="warn"></iso-server></${tag}>` : ''}`;
  }).join('\n');
  writeFileSync(join(out, 'live.html'), `<!doctype html><meta charset="utf-8"><title>pending</title>
<style>body{margin:16px;background:#eef1f5;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-end}</style>
${live}
<script type="module">
${names.map(n => `import '/components/${n}/iso-${n}.js';`).join('\n')}
import '/components/server/iso-server.js';
await Promise.all(${JSON.stringify(names.map(n => `iso-${n}`))}.map(t => customElements.whenDefined(t)));
await new Promise(r => setTimeout(r, 300));
const bad = [...document.querySelectorAll('*')].filter(el => el.localName.startsWith('iso-') && !el.shadowRoot?.querySelector('svg')).map(el => el.localName);
document.title = bad.length ? 'LIVE FAIL ' + bad.join(',') : 'LIVE OK ' + document.querySelectorAll('[label]').length;
</script>`);
  const shot = (url, png, dom) => execFileSync(edge(), ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${join(outDir(project), 'oracle', 'edge')}`,
    '--window-size=1400,1600', '--virtual-time-budget=5000', dom ? '--dump-dom' : `--screenshot=${png}`, url],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 90000 });
  await withLock(`oracle ${project}`, async () => {
    const server = spawn('python', ['-I', join(TOOLS, 'serve.py'), project, out], { stdio: ['ignore', 'pipe', 'inherit'] });
    const port = await new Promise((resolve, reject) => {
      server.stdout.once('data', d => resolve(String(d).trim()));
      server.once('error', reject);
      setTimeout(() => reject(new Error('server did not start')), 10000);
    }).catch(e => { server.kill(); fail(e.message); });
    try {
      const url = `http://127.0.0.1:${port}/recette/live.html`;
      const title = (shot(url, null, true).match(/<title>([^<]*)<\/title>/) || [])[1] || 'no title';
      if (!title.startsWith('LIVE OK')) fail('live page: ' + title);
      if (flags.includes('--shot')) {
        shot(url, join(out, 'live.png'));
        console.log(`Live screenshot: ${join(out, 'live.png')}`);
      }
    } finally { server.kill(); }
  });
}
console.log(`${names.length} components, ${files.length} files checked.`);
console.log('ORACLE OK');
