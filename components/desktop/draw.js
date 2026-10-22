// Desktop drawing: a monitor on its stand and a keyboard in front, a window on the display with the
// label in its title bar. A free shape of fixed size.
import { block, fitLabel, rhythm } from '../../core/parts.js';

export const desktop = {
  name: 'desktop',
  title: 'Desktop',
  // Sizes in cells: fixed.
  defaults: { width: 3, depth: 2, height: 2 },
  minimum: { width: 3, depth: 2, height: 2 },
  maximum: { width: 3, depth: 2, height: 2 },
  sizes: [[3, 2]],
  // Keys 6 × 5 every 8 × 7, from the corner of their area; soft glow of the display.
  defs: `
    <pattern id="desktop-keys" width="8" height="7" patternUnits="userSpaceOnUse">
      <rect width="6" height="5" rx="1" fill="#252b36"/>
    </pattern>
    <linearGradient id="desktop-glow" x1="0" x2=".3" y1="0" y2="1">
      <stop offset="0" stop-color="#3b5170"/>
      <stop offset="1" stop-color="#263347"/>
    </linearGradient>
  `,

  // Back to front: the foot and the neck of the stand, the monitor (5 thick, from y = 20 up to the
  // full height), then the keyboard lying in front.
  art(W, D, H, { label: text }) {
    const w = W - 16, m = H - 20;
    // Display: glowing glass, a window with its title bar (the label), text lines and a chart; status
    // and activity lights on the bottom bezel.
    const screen = `
      <rect x="4" y="4" width="${w - 8}" height="${m - 13}" rx="1" fill="url(#desktop-glow)"/>
      <rect x="4" y="4" width="${w - 8}" height="16" fill="#dfe6ee"/>
      ${text ? fitLabel(9, 16.5, w - 18, text) : ''}
      <path d="M11 27h48M11 33h62M11 39h36" stroke="#9fb1c9" stroke-opacity=".55" stroke-width="2.5"/>
      <path d="M${w - 30} 44v-8M${w - 23} 44v-14M${w - 16} 44v-10" stroke="#5f9f9a" stroke-width="4.5"/>
      <circle cx="${w - 14}" cy="${m - 4.5}" r="1.8" class="led status pulse"/>
      <circle cx="${w - 8}" cy="${m - 4.5}" r="1.8" class="led activity" style="${rhythm(3)}"/>`;
    const keys = `<g transform="translate(5 4)"><rect width="78" height="19" fill="url(#desktop-keys)"/></g>`;
    return block(W / 2 - 16, 0, 6, 32, 20, 3)
      + block(W / 2 - 4, 3, 6, 8, 5, 30)
      + block(8, 20, 11, w, 5, m, { frontArt: screen })
      + block(W / 2 - 44, 0, 44, 88, 27, 4, { topArt: keys });
  },
};
