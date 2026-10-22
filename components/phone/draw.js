// Phone drawing: a smartphone standing in a small dock, app icons on its screen, and a name plate lying
// on the ground in front. A free shape of fixed size.
import { block, groundPlate } from '../../core/parts.js';

export const phone = {
  name: 'phone',
  title: 'Phone',
  // Sizes in cells: fixed, wide enough for the plate in front.
  defaults: { width: 2, depth: 1, height: 2 },
  minimum: { width: 2, depth: 1, height: 2 },
  maximum: { width: 2, depth: 1, height: 2 },
  sizes: [[2, 1]],
  // Soft glow of the screen.
  defs: `
    <linearGradient id="phone-glow" x1="0" x2=".3" y1="0" y2="1">
      <stop offset="0" stop-color="#3b5170"/>
      <stop offset="1" stop-color="#263347"/>
    </linearGradient>
  `,

  // Back to front: the dock, the phone (w wide, 5 thick) standing in it up to the full height, the plate.
  art(W, D, H, { label: text }) {
    const w = 40, h = H - 5;
    // Screen: camera notch and status light at the top, a widget card, 3 × 2 app icons, a dock row of
    // 3 and the home bar at the bottom.
    let icons = '';
    for (let i = 0; i < 9; i++) {
      const fill = i === 1 ? '#5f9f9a' : ['#8193ad', '#64789a', '#a3b2c6'][i % 3];
      icons += `<rect x="${6 + 10.5 * (i % 3)}" y="${i < 6 ? 31 + 11 * Math.floor(i / 3) : h - 19}" width="7" height="7" rx="2" fill="${fill}" fill-opacity=".85"/>`;
    }
    const screen = `
      <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" fill="url(#phone-glow)"/>
      <rect x="${w / 2 - 5}" y="4.5" width="10" height="3" rx="1.5" fill="#0d1015"/>
      <circle cx="7.5" cy="6" r="1.5" class="led status pulse"/>
      <rect x="5.5" y="12" width="${w - 11}" height="14" rx="2.5" fill="#dfe6ee" fill-opacity=".85"/>
      <path d="M9 17h12M9 21.5h18" stroke="#64789a" stroke-width="2"/>
      ${icons}
      <rect x="${w / 2 - 7}" y="${h - 6.5}" width="14" height="1.6" rx=".8" fill="#94a3b8"/>`;
    const buttons = `
      <rect x="1.5" y="16" width="2" height="10" rx=".8" fill="#394151"/>
      <rect x="1.5" y="29" width="2" height="6" rx=".8" fill="#394151"/>`;
    return block(W / 2 - 26, 0, 2, 52, 13, 5)
      + block(W / 2 - w / 2, 5, 5, w, 5, h, { frontArt: screen, sideArt: buttons })
      + groundPlate(W / 2, D - 23, W - 8, text);
  },
};
