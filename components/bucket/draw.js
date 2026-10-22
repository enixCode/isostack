// Bucket drawing: object storage as a truncated cone, wider at the top, under a rim and its lid.
// One hoop per cell of height, the lights under the rim, the name plate on the lid. A free shape:
// it draws its own iso ellipses (rx = 1.2247 r, ry = .7071 r) around the axis at screen x = 0.
import { CELL, move, place } from '../../core/draw.js';
import { cylinder, lidPlate, rhythm } from '../../core/parts.js';

// Rim height; the bottom radius is a share of the full radius, but the wall never slopes more than
// SLOPE units inward per unit of height, so a wide flat bucket stays a tub instead of a bowl.
const RIM = 8, TAPER = .72, SLOPE = .18;

export const bucket = {
  name: 'bucket',
  title: 'Bucket',
  // Round: the depth follows the width.
  square: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 4, depth: 4, height: 3 },
  minimum: { width: 2, depth: 2, height: 1.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[2, 2], [4, 4], [6, 6]],

  art(W, D, H, { label }) {
    // Cone from radius base on the ground to radius top under the rim, at height h1.
    const R = W / 2, top = R - 3, h1 = H - RIM, base = Math.max(TAPER * R, top - SLOPE * h1), n = Math.max(1, Math.round(H / CELL));
    const rad = h => base + (top - base) * h / h1;
    // Screen point on the cone at height h and angle a (0 faces the viewer), and the arc of its
    // circle at height h from the current point to angle a (sweep 0: left to right through the front).
    const at = (h, a) => [1.2247 * rad(h) * Math.sin(a), R - h + .7071 * rad(h) * Math.cos(a)];
    const arc = (h, a, sweep = 0) => `A${1.2247 * rad(h)} ${.7071 * rad(h)} 0 0 ${sweep} ${at(h, a)}`;
    // The outline leaves each circle where the cone turns away from the viewer: cos a = slope / sqrt 2.
    const A = Math.acos((top - base) / h1 / Math.SQRT2);
    const outline = `M${at(h1, -A)}L${at(0, -A)}${arc(0, A)}L${at(h1, A)}`;
    // Hoops: bands 5 units tall around the front, their ends on the outline.
    let hoops = '';
    for (let k = 1; k < n; k++) {
      const h = h1 * k / n;
      hoops += `M${at(h + 2.5, -A)}${arc(h + 2.5, A)}L${at(h - 2.5, A)}${arc(h - 2.5, -A, 1)}Z`;
    }
    // Lights in the middle of the top band, s units from the front.
    const hl = h1 - h1 / n / 2;
    const led = (s, attrs) => `<circle cx="${at(hl, s / rad(hl))[0]}" cy="${at(hl, s / rad(hl))[1]}" r="2.2" ${attrs}/>`;
    const rim = cylinder(W, RIM);
    return `
      <path d="${outline}Z" fill="#252b36"/>
      <path d="${hoops}" fill="#3b4352" stroke="#0d1015"/>
      <path d="${outline}Z" fill="url(#cylinder-shade)"/>
      <path class="edge" d="${outline}"/>
      ${led(-15, 'class="led blue"')}${led(-5, 'class="led status pulse"')}${led(5, `class="led activity" style="${rhythm(0)}"`)}${led(15, 'class="fault"')}
      <g ${move(0, h1, 0)}>${rim.svg}
        <path d="${rim.ring(RIM / 2)}" fill="none" stroke="#2dd4bf" stroke-opacity=".6" stroke-width="2"/>
      </g>
      <g ${place('top', 0, H, 0)}>
        <circle cx="${R}" cy="${R}" r="${R - 6}" fill="none" stroke="#252b36" stroke-width="2"/>
        ${lidPlate(R, R, R - 6, label)}
      </g>`;
  },
};
