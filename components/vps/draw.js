// VPS drawing: a rented server, hosted in the cloud. Same family as the server (rack ears, bays,
// lights) on a lighter slate, with a teal cloud on the cover.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { bayLights, grille, lights, panel, plate, rackEars, screw, vent } from '../../core/parts.js';

export const vps = {
  name: 'vps',
  title: 'VPS',
  // Open, it shows its floor: VMs, containers and apps can stand inside.
  container: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 8, depth: 6, height: 3 },
  minimum: { width: 4, depth: 4, height: 2.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 4], [8, 6], [12, 8]],
  css: `
    .vps-accent { fill: none; stroke: #5fb3ac; stroke-width: 1.5; stroke-linecap: round; }
  `,
  // Drive bay 38 × 30, server size: teal pull tab, slots. Its lights are drawn beside it, by bayLights().
  defs: `
    <g id="vps-bay">
      <rect width="38" height="30" rx="2" fill="#1d222b" stroke="#3d4657"/>
      <rect x="5" y="5" width="20" height="3" rx="1" fill="#5fb3ac" opacity=".75"/>
      <path d="M5 13h20M5 17h20" stroke="#2f3644" stroke-width="1.6"/>
      <rect x="5" y="21" width="20" height="5" rx="1" fill="#3a4251"/>
    </g>
  `,

  // Cover: a cloud at the back, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#434c5d"/>
      ${panel(W, D, '#566075')}
      <path transform="translate(26 22)" d="M18 58H70A18 18 0 1 0 67.72 22.16A26 26 0 0 0 16.28 22.08A18 18 0 0 0 18 58Z" fill="#5fb3ac" fill-opacity=".14" stroke="#5fb3ac" stroke-width="2.5" stroke-linejoin="round"/>
      ${plate(W, D, label)}`;
  },

  // Front: rack ears, a teal strip, one column of bays per cell, then vent and status lights.
  front(W, D, H) {
    const rows = Math.floor((H - 32) / 34);
    let bays = '';
    for (let i = 0; i < (W - 120) / CELL; i++) {
      for (let j = 0; j < rows; j++) {
        const x = 20 + CELL * i, y = 18 + 34 * j;
        bays += `<use href="#vps-bay" x="${x}" y="${y}"/>${bayLights(x, y, i * rows + j)}`;
      }
    }
    return `
      <rect width="${W}" height="${H}" fill="#292f3b"/>
      ${rackEars(W, H)}
      <path d="M22 9H${W - 22}" class="vps-accent"/>
      ${bays}
      ${vent(W - 92, 18, 40, H - 36, true)}
      ${lights(W - 34, 18)}`;
  },

  // Side: teal seam, rail, one vent grille and one screw per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 22, 20, H - 52) + screw(CELL * k + 20, H - 15, 2);
    return `
      <rect width="${D}" height="${H}" fill="#20252e"/>
      <path d="M0 10H${D}" class="vps-accent" opacity=".55"/>
      <rect y="${H - 20}" width="${D}" height="10" fill="#2b313c"/>
      ${grilles}`;
  },
};
