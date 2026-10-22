// Cloud drawing: the internet or a cloud provider, soft puffs floating above the ground with one more
// puff per cell of width, a status badge on the front puffs and a name plate lying on the ground.
// A free shape whose width grows.
import { CELL, iso } from '../../core/draw.js';
import { groundPlate } from '../../core/parts.js';

export const cloud = {
  name: 'cloud',
  title: 'Cloud',
  // Sizes in cells: the width grows, one puff per cell; depth and height are fixed.
  defaults: { width: 4, depth: 3, height: 2 },
  minimum: { width: 3, depth: 3, height: 2 },
  maximum: { width: 10, depth: 3, height: 2 },
  sizes: [[3, 3], [4, 3], [6, 3]],
  // Soft white-blue puffs lit from the top left; the outline is drawn under the fills, so that only the
  // outside of the whole cloud keeps it.
  css: `.cloud-line { fill: none; stroke: #93a5bf; stroke-width: 3.5; }`,
  defs: `
    <radialGradient id="cloud-puff" cx=".38" cy=".32" r=".72">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".55" stop-color="#edf2f9"/>
      <stop offset="1" stop-color="#c3d1e3"/>
    </radialGradient>
  `,

  // Puffs are balls (a world radius r shows as a circle of 1.2247 r), floating above the ground. Back
  // row: a big puff between two cells, its size alternating; front row: a smaller puff per cell. Each
  // row left to right, so nearer puffs paint over farther ones. The badge sits on the middle front puff.
  art(W, D, H, { label: text }) {
    const n = W / CELL, puffs = [];
    for (let i = 1; i < n; i++) puffs.push([CELL * i, H - 27 - 2 * (i % 2), 50, 23 + 3 * (i % 2)]);
    for (let i = 0; i < n; i++) puffs.push([CELL * i + 20, 45 + 3 * (i % 2), 80, 19 + (i % 2)]);
    const balls = puffs.map(([x, y, z, r]) => [...iso(x, y, z), 1.2247 * r]);
    const [bx, by] = iso(CELL * Math.floor((n - 1) / 2) + 20, 42, 80);
    return `
    ${balls.map(([cx, cy, R]) => `<circle class="cloud-line" cx="${cx}" cy="${cy}" r="${R}"/>`).join('')}
    ${balls.map(([cx, cy, R]) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#cloud-puff)"/>`).join('')}
    <circle cx="${bx}" cy="${by}" r="5.5" fill="#191d25" stroke="#4b5467"/>
    <circle cx="${bx}" cy="${by}" r="2.6" class="led status pulse"/>${groundPlate(W / 2, D - 23, W - 8, text)}`;
  },
};
