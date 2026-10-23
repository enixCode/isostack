# Contributing

Open an issue to discuss a change before a pull request. Everything in the repository is in English: code, comments, docs and commit messages ([Conventional Commits](https://www.conventionalcommits.org/)).

## Add a component

One folder, `components/<name>/`:
- `draw.js` exports the model: its title, sizes, and either its three faces drawn flat (a box) or its whole art (a free shape), using the shared parts of `core/parts.js`.
- `iso-<name>.js` is the 4-line element file.

Then `npm run build` registers it in `index.js` and writes its static files and pack icons. A part moves into `core/` only when a second component needs it.

## Local demo

Build once (a fresh clone has no `index.js`, `dist/` or `custom-elements.json`: the build writes them), then serve the folder over http, since the files are ES modules:

```sh
npm run build
python -m http.server
```

Then open `http://localhost:8000/demo/`: the whole family on one grid. Click an element to select it, zoom to open the containers.

## Checks and measures

`tools/` holds the development checks, run from the repository root (Node 22+, Python, and Edge or the browser named by `ISOSTACK_BROWSER`); they write only under `.out/`, except `npm-check`, whose `npm pack` rebuilds. Each file starts with its usage.
- `node tools/oracle.mjs [--static]`: the model contract of every component, every variant parsed as XML, then the live elements in a headless browser.
- `node tools/npm-check.mjs`: the exact package contents, a local install, the imports, no personal data.
- `node tools/metrics.mjs`, `node tools/scale.mjs`, `node tools/ab.mjs <rounds> <dir> <dir>`: static cost, the 1000-icon page, and an A/B of copies of the project.
- `node tools/compare.mjs <baseDir> <dir>`, `node tools/fade-test.mjs`: visual checks.
- `node tools/playground.mjs`: builds the single-file playground page from `demo/playground.html`.
