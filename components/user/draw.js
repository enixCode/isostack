// User drawing: a pawn-like person, a round body with rounded shoulders under a round head, a status
// badge on the front of the body, and a name plate lying on the ground in front. A free shape of fixed
// size.
import { move } from '../../core/draw.js';
import { cylinder, groundPlate } from '../../core/parts.js';

export const user = {
  name: 'user',
  title: 'User',
  // Sizes in cells: fixed, a person does not stretch.
  defaults: { width: 2, depth: 2, height: 2.5 },
  minimum: { width: 2, depth: 2, height: 2.5 },
  maximum: { width: 2, depth: 2, height: 2.5 },
  sizes: [[2, 2]],

  // Body: a cylinder r in radius under a dome c tall (the shoulders), set back to leave the front strip
  // to the plate. Head: a ball whose top is the full height. A world radius r shows as 1.2247 r on
  // screen, for a ball as for the width of a round floor.
  art(W, D, H, { label: text }) {
    const r = 26, head = 18, c = 24, rise = H - 2 * head - 2 - c;
    const body = cylinder(2 * r, rise, { side: '#2e3a50', top: '#3a4862' });
    const R = body.rx, y = body.y(rise), q = 1.2247 * Math.sqrt((r * r + 2 * c * c) / 3);
    const dome = `M${-R} ${y}A${R} ${q} 0 0 1 ${R} ${y}A${R} ${body.ry} 0 0 1 ${-R} ${y}Z`;
    const [bx, by] = body.at(rise - 10, -.45), hy = body.y(H - head), hr = 1.2247 * head;
    return `
    <g ${move(W * .375 - r, 0, D * .375 - r)}>${body.svg}
      <path d="${dome}" fill="#3a4862"/>
      <path d="${dome}" fill="url(#shine)"/>
      <path class="edge" d="${dome}"/>
      <circle cx="${bx}" cy="${by}" r="5" fill="#191d25" stroke="#4b5467"/>
      <circle cx="${bx}" cy="${by}" r="2.4" class="led status pulse"/>
      <circle cy="${hy}" r="${hr}" fill="#566176"/>
      <circle cy="${hy}" r="${hr}" fill="url(#shine)"/>
      <circle class="edge" cy="${hy}" r="${hr}"/>
    </g>${groundPlate(W / 2, D - 23, W - 8, text)}`;
  },
};
