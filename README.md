<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/isostack-banner-dark.svg">
  <img alt="isostack, isometric infrastructure icons, part of isoAtlas" src=".github/assets/isostack-banner-light.svg" width="100%">
</picture>

# isostack

Isometric infrastructure icons with zero dependencies. Each icon is one drawing with two outputs: a live element (`<iso-server>`, `<iso-db>`..., native Web Components you can resize, nest and drive from JS) and frozen `.svg` files that need no JS at all (README, docs, diagram tools).

## Components

| Family | Elements |
|---|---|
| Compute and containers | `iso-server`, `iso-vps`, `iso-vm`, `iso-docker` (host), `iso-rack`, `iso-app` (a service inside a container) |
| Network | `iso-switch`, `iso-router`, `iso-firewall`, `iso-load-balancer`, `iso-dns`, `iso-cloud` (internet) |
| Data and storage | `iso-db`, `iso-cache`, `iso-queue`, `iso-bucket`, `iso-storage` (NAS) |
| People and devices | `iso-user`, `iso-laptop`, `iso-phone`, `iso-desktop`, `iso-raspberry-pi` |

Containers (`server`, `vps`, `vm`, `docker`, `rack`) hold other elements. Details repeat instead of stretching: a wider server gets more disk bays, a taller database more discs.

## Install

```sh
npm install isostack
```

Or with no build step, from a CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/isostack@0.1.0/index.js"></script>
```

## Usage

Plain HTML page: one module script, then as many tags as you want.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/isostack@0.1.0/index.js"></script>
<iso-server label="web-01"></iso-server>
<iso-db label="pg" status="warn"></iso-db>
```

A single component only:

```js
import 'isostack/components/server/iso-server.js';
```

Each tag is defined once: loading isostack twice, or alongside a library that already took the same `iso-` name, keeps the first definition instead of throwing.

Edit and save: `resizable` shows the blue cubes; one `change` listener on the document catches every element.

```js
import { IsoBox } from 'isostack';

document.addEventListener('change', e => {
  if (e.target instanceof IsoBox) save(e.target.id, e.target.width, e.target.depth);
});
// <iso-server id="db-01" resizable></iso-server>
```

Live status from code: every attribute has a mirrored property.

```js
const el = document.querySelector('iso-server');
el.status = 'down';
el.width = 12;
```

React 19: import once, then use the tags in JSX.

```jsx
import 'isostack';

export const Server = ({ host }) => <iso-server label={host.name} width={host.size} status={host.status} />;
```

Vue 3 with Vite: tell the compiler the `iso-` tags are custom elements, then listen with `@change`.

```js
// vite.config.js
vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('iso-') } } })
// template: <iso-server :status="status" resizable @change="save" />
```

No JS: use a static file in an `<img>` or in Markdown.

```html
<img src="https://cdn.jsdelivr.net/npm/isostack@0.1.0/dist/server-7x6-down.svg" alt="Server db-01, status down">
```

```md
![Database, status ok](https://cdn.jsdelivr.net/npm/isostack@0.1.0/dist/db-4x4-ok.svg)
```

Node: the drawing is pure, so it runs without a browser. The root `isostack` entry registers custom elements and needs a browser.

```js
import { draw } from 'isostack/core/draw.js';
import { server } from 'isostack/components/server/draw.js';

const svg = draw(server, { width: 12, status: 'down', label: 'db-01' }); // an <svg> string
```

## Boxes in boxes

A container holds other elements on its floor. Each child stands at its own `x`, `y`, `z`, in cells from the back corner of the floor (`y` goes up). `open` fades the cover to show them, and lets clicks reach them.

```html
<iso-vps open width="10" depth="7" height="4" label="vps-01">
  <iso-docker x="1" z="1" width="8" depth="5" label="stack">
    <iso-app x="1" z="1.5" label="web"></iso-app>
    <iso-app x="4.5" z="1.5" label="api"></iso-app>
  </iso-docker>
</iso-vps>
```

A rack stacks servers with `y`: `<iso-rack open height="7"><iso-server x=".5" y=".3" z=".5" width="4" depth="4"></iso-server></iso-rack>`.

## Many icons on one page

Each element is cheap at rest: a status change only touches CSS, the lights change on a shared beat of 0.2 s and stand still out of view or when `paused`, nothing uses an SVG filter, and a closed container draws neither its inside nor its children.

To move a large scene smoothly, move one wrapper, never the elements: put them in a container moved by a single `transform: translate(x, y) scale(z)`, written once per frame. While the view moves, give that container `will-change: transform` and set `paused` on the elements, then remove both once it rests. `demo/index.html` does exactly this.

## Icon pack for isoAtlas and Isoflow

`dist/isostack.isopack.json` holds every component in its default size, in the four statuses (88 icons), as one file. Its format is the icon collection of Isoflow and isoAtlas, `{ id, name, icons: [{ id, name, url, isIsometric }] }`, with the images inlined as data URLs.

```js
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isostack from 'isostack/dist/isostack.isopack.json' with { type: 'json' };

initialData.icons = flattenCollections([isostack]); // ids like isostack-db-ok, isostack-server-down
```

## API

| Attribute | Values | Default |
|---|---|---|
| `width`, `depth` | whole grid cells, within each component's limits | per component |
| `height` | grid cells | per component |
| `status` | `ok`, `warn`, `down`, `unknown`; absent or invalid means `ok` | `ok` |
| `label` | text on the name plate | no plate |
| `resizable` | boolean: shows the blue cubes | absent |
| `open` | boolean, containers only: the cover fades to show the inside | absent |
| `paused` | boolean: the lights stand still (an element out of view also pauses by itself) | absent |
| `x`, `y`, `z` | position in cells inside a container, or on a page grid | `0` |

Booleans follow HTML: presence means true, so `resizable="false"` still means true. Remove the attribute or set the property to `false`.

Events, all standard:
- `click`, `pointerenter`, `pointerleave`: native, on the drawn shape only.
- `input` at each cell gained or lost during a cube drag, then `change` on release. Both bubble with no `detail`: read the new size on the element.

CSS variables read by the element:
- `--iso-speed`: animation speed multiplier (`2` = twice as fast).
- `--iso-animation`: `paused` freezes animations.
- `--iso-ok`, `--iso-warn`, `--iso-down`, `--iso-unknown`: status colors.

CSS variables published by the element, to place it on a page grid: `--iso-anchor-x` and `--iso-anchor-y` (the back corner on the ground inside its box), `--iso-offset-x`, `--iso-offset-y` and `--iso-order` (its `x`, `y`, `z` position and paint order). See `demo/index.html`.

`custom-elements.json`, generated by the build in the standard Custom Elements Manifest format, describes every tag (attributes with each component's limits, events, CSS variables) for editors, Storybook and docs tools.

## Static files

`dist/` holds each component's classic sizes in the 4 statuses, named `<component>-WxD-<status>.svg`: for example `server-7x6-ok.svg`, `db-4x4-down.svg` or `raspberry-pi-3x2-unknown.svg`.

## Add a component

One folder, `components/<name>/`:
- `draw.js` exports the model: its title, sizes, and either its three faces drawn flat (a box) or its whole art (a free shape), using the shared parts of `core/parts.js`.
- `iso-<name>.js` is the 4-line element file.

Then `npm run build` registers it in `index.js` and writes its static files and pack icons.

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

## License

MIT
