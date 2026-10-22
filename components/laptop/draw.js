// Laptop drawing: an open laptop, a thin base with its keyboard and touchpad, the screen standing at
// its back edge with a window on the display and the label in the title bar. A free shape of fixed size.
import { block, fitLabel, rhythm } from '../../core/parts.js';

export const laptop = {
  name: 'laptop',
  title: 'Laptop',
  // Sizes in cells: fixed.
  defaults: { width: 3, depth: 2, height: 1.5 },
  minimum: { width: 3, depth: 2, height: 1.5 },
  maximum: { width: 3, depth: 2, height: 1.5 },
  sizes: [[3, 2]],
  // Keys 6 × 5 every 8 × 7, from the corner of their area; soft glow of the display.
  defs: `
    <pattern id="laptop-keys" width="8" height="7" patternUnits="userSpaceOnUse">
      <rect width="6" height="5" rx="1" fill="#343c4a"/>
    </pattern>
    <linearGradient id="laptop-glow" x1="0" x2=".3" y1="0" y2="1">
      <stop offset="0" stop-color="#3b5170"/>
      <stop offset="1" stop-color="#263347"/>
    </linearGradient>
  `,

  // Base t thick; the lid, 4 thick, stands on its back edge up to the full height.
  art(W, D, H, { label: text }) {
    const x = 8, z = 10, w = W - 16, d = D - 18, t = 6, h = H - t;
    // Top of the base (the lid hides its first 4 units): keyboard well and 12 × 4 keys, touchpad.
    const deck = `
      <rect x="${w / 2 - 48}" y="7" width="96" height="30" rx="1.5" fill="#171b22"/>
      <g transform="translate(${w / 2 - 47} 9)"><rect width="94" height="26" fill="url(#laptop-keys)"/></g>
      <rect x="${w / 2 - 16}" y="41" width="32" height="15" rx="2" fill="#343c4a" stroke="#4b5467"/>`;
    // Front edge: thumb notch, status and activity lights.
    const edge = `
      <rect x="${w / 2 - 10}" width="20" height="1.6" fill="#191d25"/>
      <circle cx="${w - 15}" cy="3" r="1.6" class="led status pulse"/>
      <circle cx="${w - 9}" cy="3" r="1.6" class="led activity" style="${rhythm(2)}"/>`;
    // Display: camera dot, glowing glass, a window with its title bar (the label), text lines and a chart.
    const screen = `
      <circle cx="${w / 2}" cy="2.6" r="1.1" fill="#0d1015"/>
      <rect x="5" y="5" width="${w - 10}" height="${h - 12}" rx="1" fill="url(#laptop-glow)"/>
      <rect x="5" y="5" width="${w - 10}" height="15" fill="#dfe6ee"/>
      ${text ? fitLabel(9, 16.5, w - 18, text) : ''}
      <path d="M11 26h44M11 32h56M11 38h32" stroke="#9fb1c9" stroke-opacity=".55" stroke-width="2.5"/>
      <path d="M${w - 28} 42v-7M${w - 22} 42v-12M${w - 16} 42v-9" stroke="#5f9f9a" stroke-width="4"/>`;
    return block(x, 0, z, w, d, t, { topArt: deck, frontArt: edge })
      + block(x, t, z, w, 4, h, { frontArt: screen });
  },
};
