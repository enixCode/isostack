// Queue drawing: messages waiting in line on a conveyor, one per cell of width. The belt runs toward
// the side end, which holds the lights; the name plate lies on the front ledge. A free shape built
// from block() volumes. Top frame: u = width, v = depth from the back.
import { CELL } from '../../core/draw.js';
import { block, label, lightsRow } from '../../core/parts.js';

// Conveyor height; the belt runs from v = 8 to v = 52, the ledge in front of it holds the plate.
const BASE = 18;

export const queue = {
  name: 'queue',
  title: 'Queue',
  // Sizes in cells: it grows in width only, one more message per cell.
  defaults: { width: 6, depth: 2, height: 1 },
  minimum: { width: 2, depth: 2, height: 1 },
  maximum: { width: 20, depth: 2, height: 1 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 2], [6, 2], [10, 2]],

  art(W, D, H, o) {
    let arrows = '', rollers = '', messages = '';
    // Per cell: a roller on the front rail, an arrow on the belt in front of the messages, pointing
    // to the head of the line, and a message: an envelope standing up in the middle of the belt,
    // 30 wide, 22 tall and 6 thick, its flap to the front.
    for (let x = 0; x < W; x += CELL) {
      arrows += `M${x + 16} 37L${x + 24} 43L${x + 16} 49`;
      rollers += `<circle cx="${x + 20}" cy="${BASE / 2}" r="5" fill="#191d25" stroke="#4b5467"/><circle cx="${x + 20}" cy="${BASE / 2}" r="1.5" fill="#4b5467"/>`;
      messages += block(x + 5, BASE, 27, 30, 6, H - BASE, {
        top: '#f1f5f9', front: '#e2e8f0', side: '#a3acba',
        frontArt: '<path d="M2 2L15 13L28 2" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-linejoin="round"/>',
      });
    }
    // Name plate on the ledge at the side end, shrunk to fit a short queue.
    const l = Math.max(56, 24 + 8.5 * o.label.length), k = Math.min(1, (W - 16) / l);
    const plate = o.label ? `<g transform="translate(${W - 8 - l * k} ${66 - 10 * k}) scale(${k})">
      <rect width="${l}" height="20" rx="3" fill="#e2e8f0"/>${label(12, 15, o.label)}</g>` : '';
    return block(0, 0, 0, W, D, BASE, {
      topArt: `<rect y="8" width="${W}" height="44" fill="#191d25"/><path d="${arrows}" fill="none" stroke="#343c4a" stroke-width="3" stroke-linejoin="round"/>${plate}`,
      frontArt: rollers,
      sideArt: `<rect x="${D / 2 - 26}" y="3" width="52" height="12" rx="2" fill="#11151b"/>${lightsRow(D / 2 - 20, BASE / 2)}`,
    }) + messages;
  },
};
