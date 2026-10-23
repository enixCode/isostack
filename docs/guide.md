# isostack guide

Everything the [README](../README.md) leaves out: loading options, saving edits, nesting, large scenes, the icon pack, static files and the full API.

## Loading

A single component only:

```js
import 'isostack/components/server/iso-server.js';
```

Each tag is defined once: loading isostack twice, or alongside a library that already took the same `iso-` name, keeps the first definition instead of throwing.

Node: the drawing is pure, so it runs without a browser. The root `isostack` entry registers custom elements and needs a browser.

```js
import { draw } from 'isostack/core/draw.js';
import { server } from 'isostack/components/server/draw.js';

const svg = draw(server, { width: 12, status: 'down', label: 'db-01' }); // an <svg> string
```

## Edit and save

`resizable` shows the blue cubes; one `change` listener on the document catches every element.

```js
import { IsoBox } from 'isostack';

document.addEventListener('change', e => {
  if (e.target instanceof IsoBox) save(e.target.id, e.target.width, e.target.depth);
});
// <iso-server id="db-01" resizable></iso-server>
```

Every attribute has a mirrored property:

```js
const el = document.querySelector('iso-server');
el.status = 'down';
el.width = 12;
```

## Boxes in boxes

A container holds other elements on its floor. Each child stands at its own `x`, `y`, `z`, in cells from the back corner of the floor (`y` goes up). `open` fades the cover to show them, and lets clicks reach them.

The containers are `server`, `vps`, `vm`, `docker` and `rack`. Details repeat instead of stretching: a wider server gets more disk bays, a taller database more discs.

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

## Static files

`dist/` holds each component's classic sizes in the 4 statuses, named `<component>-WxD-<status>.svg`: for example `server-7x6-ok.svg`, `db-4x4-down.svg` or `raspberry-pi-3x2-unknown.svg`. They need no JS: use them in an `<img>` or in Markdown.

```html
<img src="https://cdn.jsdelivr.net/npm/isostack@0.1.0/dist/server-7x6-down.svg" alt="Server db-01, status down">
```

```md
![Database, status ok](https://cdn.jsdelivr.net/npm/isostack@0.1.0/dist/db-4x4-ok.svg)
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
