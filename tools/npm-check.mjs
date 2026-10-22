// Oracle for the local npm package of isostack: exact file list, local install, imports resolve, no
// personal data (the only email addresses allowed in the packed files are at example.com or
// example.org). The temporary install goes to <projectDir>/.out/npm-check/.
// Exit 0 and "ORACLE OK" on success.
// Usage: node tools/npm-check.mjs [projectDir]
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, outDir } from './common.mjs';

const project = resolve(process.argv[2] ?? ROOT);
const work = join(outDir(project), 'npm-check');
const run = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const fail = message => { console.error('ORACLE FAILED: ' + message); process.exit(1); };

rmSync(work, { recursive: true, force: true });
mkdirSync(join(work, 'app'), { recursive: true });

// 1. package.json: name, ES modules, side effects declared, no personal fields.
const pkg = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
if (pkg.name !== 'isostack') fail('name must be isostack');
if (pkg.type !== 'module') fail('type must be module');
if (!Array.isArray(pkg.sideEffects) || !pkg.sideEffects.includes('./index.js')) fail('sideEffects must list ./index.js');
for (const field of ['author', 'contributors', 'maintainers']) if (field in pkg) fail(`no ${field} field (anonymity)`);

// 2. The package holds exactly the library (core, every component), its README and the built files.
const components = readdirSync(join(project, 'components'));
const dist = readdirSync(join(project, 'dist')).map(f => 'dist/' + f);
if (!dist.includes('dist/isostack.isopack.json')) fail('dist must hold isostack.isopack.json');
if (dist.length < components.length * 4 + 1) fail(`dist must hold at least 4 files per component, found ${dist.length}`);
const [dry] = JSON.parse(run('npm pack --dry-run --json --ignore-scripts', project));
const files = dry.files.map(f => f.path).sort();
const expected = ['LICENSE', 'custom-elements.json', 'README.md', 'package.json', 'index.js', ...readdirSync(join(project, 'core')).map(f => 'core/' + f),
  ...components.flatMap(c => readdirSync(join(project, 'components', c)).map(f => `components/${c}/${f}`)), ...dist].sort();
if (JSON.stringify(files) !== JSON.stringify(expected)) fail('unexpected files: ' + JSON.stringify(files));

// 3. Pack for real (prepack rebuilds dist), then install the tarball in an empty app, offline.
run(`npm pack --pack-destination "${work}"`, project);
const tarball = readdirSync(work).find(f => f.endsWith('.tgz'));
if (!tarball) fail('no tarball');
writeFileSync(join(work, 'app/package.json'), '{"name":"app","private":true,"type":"module"}');
run(`npm install "${join(work, tarball)}" --offline --no-audit --no-fund`, join(work, 'app'));

// 4. No personal data: every email-looking string in the installed package is at example.com or example.org.
const installed = join(work, 'app/node_modules/isostack');
for (const f of readdirSync(installed, { recursive: true, withFileTypes: true }).filter(d => d.isFile())) {
  const path = join(f.parentPath, f.name);
  for (const [email] of readFileSync(path, 'utf8').matchAll(/[\w.%+-]+@[\w-]+(\.[\w-]+)*\.[a-z]{2,}/gi))
    if (!/@example\.(com|org)$/i.test(email)) fail(`email address in ${path.slice(installed.length + 1)}: ${email}`);
}

// 5. From the app: the drawing runs in Node, and the public subpaths resolve.
writeFileSync(join(work, 'app/test.js'), `
import { draw } from 'isostack/core/draw.js';
import { server } from 'isostack/components/server/draw.js';
const svg = draw(server, { width: 9, status: 'down', label: 'db-01' });
if (!svg.startsWith('<svg') || !svg.includes('data-status="down"')) throw new Error('draw failed');
for (const id of ['isostack', 'isostack/components/server/iso-server.js', 'isostack/dist/server-7x6-ok.svg', 'isostack/dist/isostack.isopack.json', 'isostack/package.json']) import.meta.resolve(id);
console.log('imports ok');
`);
if (!run('node test.js', join(work, 'app')).includes('imports ok')) fail('import test');
console.log('ORACLE OK');
