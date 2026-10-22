// Docker host drawing: a shipping container in muted steel blue. Corrugated ribs repeat cell by
// cell on every face, castings mark the corners, a small control panel on the long front wall carries
// the status lights, and the doors close the short end: two leaves split in the middle, with their
// locking bars.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { lightsRow, plate } from '../../core/parts.js';

// Corrugation between u = a and u = b, from y to y + h: two ribs per cell, each a lit flank then a
// shaded one, since light comes from the left.
function ribs(a, b, y, h, lit, shade) {
  let l = '', s = '';
  for (let u = a; u + 16 <= b; u += CELL / 2) {
    l += `M${u + 3} ${y}h6v${h}h-6z`;
    s += `M${u + 12} ${y}h5v${h}h-5z`;
  }
  return `<path d="${l}" fill="${lit}"/><path d="${s}" fill="${shade}"/>`;
}

// Frame of a face w × h: rails along the top and bottom edges (t and b thick), corner posts, and a
// casting with its slot at each corner.
const frame = (w, h, t, b, fill) => `
  <path d="M0 0H${w}V${t}H0zM0 ${h - b}H${w}V${h}H0zM0 0H10V${h}H0zM${w - 10} 0H${w}V${h}H${w - 10}z" fill="${fill}"/>
  ${[[0, 0], [w - 14, 0], [0, h - 11], [w - 14, h - 11]].map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="11" rx="1" fill="#1c2938"/><rect x="${x + 4}" y="${y + 4}" width="6" height="3" rx="1.5" fill="#0d1015"/>`).join('')}`;

export const docker = {
  name: 'docker',
  title: 'Docker host',
  // Open, it shows its floor: containers and apps can stand inside.
  container: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 7, depth: 4, height: 3 },
  minimum: { width: 3, depth: 2, height: 2 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 3], [7, 4], [12, 4]],

  // Roof: ribs across the width, side rails, corner castings, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#4a6280"/>
      ${ribs(10, W - 10, 6, D - 12, '#567090', '#3f5571')}
      ${frame(W, D, 6, 6, '#3a5068')}
      ${plate(W, D, label)}`;
  },

  // Front: the long wall, ribs and frame, and the control panel with the status lights.
  front(W, D, H) {
    return `
      <rect width="${W}" height="${H}" fill="#36506a"/>
      ${ribs(10, W - 10, 8, H - 18, '#41607e', '#2c4158')}
      ${frame(W, H, 8, 10, '#24354a')}
      <rect x="14" y="14" width="51" height="14" rx="2" fill="#0d1015" stroke="#394151"/>
      ${lightsRow(19, 21)}`;
  },

  // Door end: ribs, frame, the seam between the two leaves, and about one locking bar per cell, split
  // evenly between the leaves, each with its handle and its keepers.
  side(W, D, H) {
    const k = Math.max(1, Math.round(D / CELL / 2)), leaf = D / 2;
    let bars = '';
    for (let i = 0; i < 2 * k; i++) {
      const u = leaf * (Math.floor(i / k) + (i % k + .5) / k);
      bars += `
        <rect x="${u - 1.5}" y="10" width="3" height="${H - 22}" fill="#6f849b"/>
        <rect x="${u - 3.5}" y="14" width="7" height="5" rx="1" fill="#1c2938"/>
        <rect x="${u - 3.5}" y="${H - 21}" width="7" height="5" rx="1" fill="#1c2938"/>
        <rect x="${u - 1.5}" y="${H * .55 - 1.5}" width="10" height="3" rx="1.5" fill="#8ea1b5"/>
        <rect x="${u + 6}" y="${H * .55 - 4}" width="4" height="8" rx="1" fill="#1c2938"/>`;
    }
    return `
      <rect width="${D}" height="${H}" fill="#2b3f54"/>
      ${ribs(10, D - 10, 8, H - 18, '#344b63', '#223244')}
      ${frame(D, H, 8, 10, '#24354a')}
      <rect x="${leaf - 1}" y="8" width="2" height="${H - 18}" fill="#1c2938"/>
      ${bars}`;
  },
};
