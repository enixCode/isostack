// Shared by the tools: paths, the browser lock, the page bundler and a small CDP client.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The tools folder, the repository root (the default project) and where a project's outputs go.
export const TOOLS = dirname(fileURLToPath(import.meta.url));
export const ROOT = dirname(TOOLS);
export const outDir = dir => join(dir, '.out');
// The browser: ISOSTACK_BROWSER if set, else Edge at its default Windows path.
const EDGE = process.env.ISOSTACK_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export function edge() {
  if (!existsSync(EDGE)) throw new Error(`browser not found at ${EDGE}: set ISOSTACK_BROWSER to a Chromium-based browser (Edge, Chrome)`);
  return EDGE;
}
// Python: python on Windows, python3 elsewhere (most Linux and macOS systems ship no bare python).
export const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
export const camel = name => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const components = dir => readdirSync(join(dir, 'components'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
export const load = async (dir, file) => import(pathToFileURL(join(dir, file)).href + `?t=${statSync(join(dir, file)).mtimeMs}`);

// One browser at a time across every agent: the machine is short on memory, and timings need a
// machine that renders nothing else. Waits up to 8 minutes, then exits with code 3.
const LOCK = join(outDir(ROOT), '.browser-lock');
export async function withLock(label, fn) {
  const start = Date.now();
  mkdirSync(outDir(ROOT), { recursive: true });
  for (;;) {
    try { mkdirSync(LOCK); break; } catch {
      try { if (Date.now() - statSync(LOCK).mtimeMs > 5 * 60e3) rmSync(LOCK, { recursive: true, force: true }); } catch {}
      if (Date.now() - start > 8 * 60e3) {
        console.error('BROWSER BUSY: waited 8 minutes for the shared browser lock. Do other work, then run the command again.');
        process.exit(3);
      }
      await sleep(750);
    }
  }
  writeFileSync(join(LOCK, 'owner'), `${label} since ${new Date().toISOString()}`);
  const release = () => rmSync(LOCK, { recursive: true, force: true });
  process.once('exit', release);
  try { return await fn(); } finally { release(); }
}

// Bundles every ES module of a project copy (core/*.js and components/*/*.js) into one inline
// script, in dependency order: each module becomes a function scope, its imports read from __m.
export function bundle(dir) {
  const files = [...readdirSync(join(dir, 'core')).filter(f => f.endsWith('.js')).map(f => `core/${f}`),
    ...components(dir).flatMap(n => readdirSync(join(dir, 'components', n)).filter(f => f.endsWith('.js')).map(f => `components/${n}/${f}`))];
  const sources = Object.fromEntries(files.map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  const deps = f => [...sources[f].matchAll(/^import \{[^}]*\} from '([^']+)';$/gm)].map(m => posix.normalize(posix.join(posix.dirname(f), m[1])));
  const order = [], state = {};
  const visit = (f, path) => {
    if (state[f] === 2) return;
    if (state[f] === 1) throw new Error(`import cycle: ${[...path, f].join(' -> ')}`);
    if (!sources[f]) throw new Error(`${path.at(-1)} imports ${f}, which does not exist`);
    state[f] = 1;
    for (const d of deps(f)) visit(d, [...path, f]);
    state[f] = 2;
    order.push(f);
  };
  for (const f of files) visit(f, []);
  const exported = {};
  const chunks = order.map(file => {
    let src = sources[file];
    const imports = [];
    src = src.replace(/^import \{([^}]*)\} from '([^']+)';\n/gm, (_, list, from) => {
      const dep = posix.normalize(posix.join(posix.dirname(file), from));
      const binds = list.split(',').map(s => s.trim()).filter(Boolean).map(s => {
        const [name, alias] = s.split(/\s+as\s+/);
        if (!exported[dep].has(name)) throw new Error(`${file}: ${dep} does not export ${name}`);
        return alias ? `${name}: ${alias}` : name;
      });
      imports.push(`const { ${binds.join(', ')} } = __m['${dep}'];`);
      return '';
    });
    if (/^import /m.test(src)) throw new Error(`${file}: only "import { a, b } from './x.js';" on one line is supported`);
    const out = new Map();
    for (const [, second] of src.matchAll(/^export const [A-Za-z_$][\w$]* = [^,;\n]*, ([A-Za-z_$][\w$]*) = [^,;\n]*;$/gm)) out.set(second, second);
    src = src.replace(/^export \{([^}]*)\};?\n/gm, (_, list) => {
      for (const s of list.split(',').map(s => s.trim()).filter(Boolean)) {
        const [local, as] = s.split(/\s+as\s+/);
        out.set(as ?? local, local);
      }
      return '';
    });
    src = src.replace(/^export (const|let|function|class) ([A-Za-z_$][\w$]*)/gm, (_, kind, name) => {
      out.set(name, name);
      return `${kind} ${name}`;
    });
    if (/^export /m.test(src)) throw new Error(`${file}: an export form the bundler does not know (use export const/let/function/class or export { a as b })`);
    exported[file] = new Set(out.keys());
    return `// ${file}\n__m['${file}'] = (() => {\n${imports.join('\n')}\n${src}\nreturn { ${[...out].map(([as, local]) => as === local ? as : `${as}: ${local}`).join(', ')} };\n})();`;
  });
  // The HTML parser must never see a comment opener or a script tag inside the inline script.
  return `const __m = {};\n${chunks.join('\n')}`.replace(/<!--/g, '<\\!--').replace(/<(\/?)script/gi, '<$1\\script');
}

// The playground page of a project copy (its demo/playground.html), as a full document.
export function playground(dir, { fonts = true } = {}) {
  let html = readFileSync(join(dir, 'demo/playground.html'), 'utf8').replace('/*@BUNDLE@*/', () => bundle(dir));
  if (!fonts) html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>${html}</body></html>`;
}

// Headless Edge with a DevTools connection: returns { send, on, close }.
export async function browser(profile, { size = '1280,800', cpu = false } = {}) {
  rmSync(join(profile, 'DevToolsActivePort'), { force: true });
  mkdirSync(profile, { recursive: true });
  const proc = spawn(edge(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${size}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', ...(cpu ? ['--disable-gpu'] : []), 'about:blank'],
    { stdio: 'ignore' });
  const portFile = join(profile, 'DevToolsActivePort');
  // Edge may still be writing the file when it appears: read it again until it holds a port.
  let port = '';
  for (let i = 0; i < 100 && !port; i++) {
    try { port = readFileSync(portFile, 'utf8').split('\n')[0].trim(); } catch {}
    if (!port) await sleep(150);
  }
  if (!port) { proc.kill(); throw new Error('Edge did not start'); }
  let page;
  for (let i = 0; i < 40 && !page; i++) {
    page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
    if (!page) await sleep(150);
  }
  if (!page) { proc.kill(); throw new Error('Edge opened no page'); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('DevTools connection failed'));
    setTimeout(() => reject(new Error('DevTools connection timed out')), 10000);
  });
  let id = 0;
  const pending = new Map(), listeners = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
  };
  // Edge gone: every pending call fails instead of waiting forever.
  ws.onclose = () => { for (const { reject } of pending.values()) reject(new Error('Edge closed the DevTools connection')); pending.clear(); };
  const send = (method, params = {}, timeout = 30000) => new Promise((resolve, reject) => {
    const call = ++id, timer = setTimeout(() => { pending.delete(call); reject(new Error(`${method} timed out after ${timeout / 1000} s`)); }, timeout);
    pending.set(call, { resolve: v => { clearTimeout(timer); resolve(v); }, reject: e => { clearTimeout(timer); reject(e); } });
    ws.send(JSON.stringify({ id: call, method, params }));
  });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) ?? []), fn]);
  const close = () => { try { ws.close(); } catch {} proc.kill(); };
  // Headless Edge reports prefers-reduced-motion: reduce here, which turns every animation off: measure
  // what a normal browser shows instead.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  return { send, on, close };
}

// Evaluates an expression in the page and returns its value (promises awaited).
export async function evaluate(cdp, expression, timeout = 30000) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, timeout);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
