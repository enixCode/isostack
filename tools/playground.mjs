// Bundles isostack (core and every component) into the playground page, with no tool to install:
// each ES module becomes a function scope in one inline script, its imports read from the modules
// bundled before it. Writes the single-file page <project>/.out/isostack-playground.html.
// Usage: node tools/playground.mjs [projectDir]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { ROOT } from './common.mjs';

const project = resolve(process.argv[2] ?? ROOT);
const names = readdirSync(`${project}/components`).sort();
const files = ['core/draw.js', 'core/parts.js', 'core/element.js',
  ...names.map(n => `components/${n}/draw.js`), ...names.map(n => `components/${n}/iso-${n}.js`)];
const exported = {};

const chunks = files.map(file => {
  let src = readFileSync(`${project}/${file}`, 'utf8');
  const imports = [];
  // Named imports from relative paths, the only form the library uses.
  src = src.replace(/^import \{([^}]*)\} from '([^']+)';\n/gm, (_, list, from) => {
    const dep = posix.normalize(posix.join(posix.dirname(file), from));
    if (!exported[dep]) throw new Error(`${file}: ${dep} is not bundled before it`);
    const binds = list.split(',').map(s => s.trim()).filter(Boolean).map(s => {
      const [name, alias] = s.split(/\s+as\s+/);
      if (!exported[dep].has(name)) throw new Error(`${file}: ${dep} does not export ${name}`);
      return alias ? `${name}: ${alias}` : name;
    });
    imports.push(`const { ${binds.join(', ')} } = __m['${dep}'];`);
    return '';
  });
  if (/^import /m.test(src)) throw new Error(`${file}: an import form the bundler does not know`);
  // Exports: declarations (one of them declares two constants on one line) and export { a as b }.
  const out = new Map();
  for (const [, second] of src.matchAll(/^export const [A-Za-z_$][\w$]* = [^,;\n]*, ([A-Za-z_$][\w$]*) = [^,;\n]*;$/gm)) out.set(second, second);
  src = src.replace(/^export \{([^}]*)\};?\n/gm, (_, list) => {
    for (const s of list.split(',').map(s => s.trim()).filter(Boolean)) {
      const [local, as] = s.split(/\s+as\s+/);
      out.set(as ?? local, local);
    }
    return '';
  });
  src = src.replace(/^export (const|function|class) ([A-Za-z_$][\w$]*)/gm, (_, kind, name) => {
    out.set(name, name);
    return `${kind} ${name}`;
  });
  if (/^export /m.test(src)) throw new Error(`${file}: an export form the bundler does not know`);
  exported[file] = new Set(out.keys());
  const list = [...out].map(([as, local]) => as === local ? as : `${as}: ${local}`).join(', ');
  return `// ${file}\n__m['${file}'] = (() => {\n${imports.join('\n')}\n${src}\nreturn { ${list} };\n})();`;
});

// Inside an inline script, the HTML parser must never see a comment opener or a script tag; the
// escaped forms read the same to JavaScript (in strings, template literals and comments alike).
const bundle = `const __m = {};\n${chunks.join('\n')}`.replace(/<!--/g, '<\\!--').replace(/<(\/?)script/gi, '<$1\\script');
const page = readFileSync(`${project}/demo/playground.html`, 'utf8').replace('/*@BUNDLE@*/', () => bundle);
const target = join(project, '.out', 'isostack-playground.html');
mkdirSync(join(project, '.out'), { recursive: true });
writeFileSync(target, page);
console.log(`${files.length} modules, page ${(page.length / 1024).toFixed(0)} KB: ${target}`);
