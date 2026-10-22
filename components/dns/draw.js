// DNS drawing: a signpost, the directory of the internet. Two arrow boards on a post topped by a globe,
// on a small base holding the status lights; the label is written on the upper board. A free shape of
// fixed size.
import { iso, place } from '../../core/draw.js';
import { block, fitLabel, rhythm } from '../../core/parts.js';

// An arrow board, 3 thick behind its face, in the frame of a face laid by place(plane, x, y, z): the
// front plane (u along +x, thickness toward -z) or the side plane (u along -z, thickness toward -x).
// It is w long and h tall, its tip at the end of u (dir 1) or at its start (dir -1). Draws the edge
// faces turned to the viewer, then the face and its flat content.
function board(plane, x, y, z, w, h, dir, art) {
  const tip = 10, t = 3, m = h / 2, side = plane === 'side';
  const pts = dir > 0 ? [[0, 0], [w - tip, 0], [w, m], [w - tip, h], [0, h]] : [[tip, 0], [w, 0], [w, h], [tip, h], [0, m]];
  const at = ([u, v], d) => iso(side ? x - d : x + u, y - v, side ? z - u : z - d).join(' ');
  let s = '';
  pts.forEach((p, i) => {
    // Outward normal of the edge face: its up part, and its part along the face (+x on the front
    // plane, +z on the side plane). The viewer sees it when their sum is positive.
    const q = pts[(i + 1) % pts.length], up = q[0] - p[0], out = side ? p[1] - q[1] : q[1] - p[1];
    const d = `M${at(p, 0)}L${at(q, 0)}L${at(q, t)}L${at(p, t)}Z`;
    if (up + out > 0) s += `<path d="${d}" fill="${up >= out ? '#c3ccd8' : '#9aa6b6'}"/><path class="edge" d="${d}"/>`;
  });
  const face = `M${pts.map(p => p.join(' ')).join('L')}Z`;
  return `${s}
  <g ${place(plane, x, y, z)}><path d="${face}" fill="#e2e8f0"/>${art}<path class="edge" d="${face}"/></g>`;
}

export const dns = {
  name: 'dns',
  title: 'DNS',
  // Sizes in cells: fixed.
  defaults: { width: 2, depth: 2, height: 2.5 },
  minimum: { width: 2, depth: 2, height: 2.5 },
  maximum: { width: 2, depth: 2, height: 2.5 },
  sizes: [[2, 2]],

  // Back to front: the base, the post, the lower board on the right of the post (pointing forward), the
  // upper board in front of it (pointing right), and the globe on top (a world radius r shows as
  // 1.2247 r on screen).
  art(W, D, H, { label: text }) {
    const c = W / 2, lines = (a, b) => `<path d="M${a} 7H${b}M${a} 12H${b - 12}" stroke="#94a3b8" stroke-width="2"/>`;
    const lights = `
      <circle cx="8" cy="4" r="1.8" class="led status pulse"/>
      <circle cx="14" cy="4" r="1.8" class="led activity" style="${rhythm(1)}"/>`;
    const r = 13, [gx, gy] = iso(c, H - r, c), R = 1.2247 * r;
    return block(c - 14, 0, c - 14, 28, 28, 8, { frontArt: lights })
      + block(c - 4, 8, c - 4, 8, 8, H - 26)
      + board('side', c + 7, 44, c + 36, 52, 18, -1, lines(17, 46))
      + board('front', c - 36, 70, c + 7, 72, 20, 1, text ? fitLabel(8, 14.5, 50, text) : lines(8, 50))
      + `
  <circle cx="${gx}" cy="${gy}" r="${R}" fill="#3d6f86"/>
  <ellipse cx="${gx}" cy="${gy}" rx="${R * .42}" ry="${R}" fill="none" stroke="#a9cbdb" stroke-opacity=".7"/>
  <path d="M${gx - R} ${gy}A${R} ${R * .577} 0 0 0 ${gx + R} ${gy}" fill="none" stroke="#a9cbdb" stroke-opacity=".7"/>
  <circle cx="${gx}" cy="${gy}" r="${R}" fill="url(#shine)"/>
  <circle class="edge" cx="${gx}" cy="${gy}" r="${R}"/>`;
  },
};
