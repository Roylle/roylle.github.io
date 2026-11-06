// Layout of the paper world. Each placement gives landscape (l) and portrait (p) as
// [x, y, z, scale]. A portrait view is about 6.4 units wide and 13.8 tall, so cards
// stack upward instead of sitting side by side.
export const WALL = -2.75;
export const TILE = 7;

// Floor sheets by x. The sheet colour changes like turning to a new page.
export function floorAt(x) {
  if (x < 28) return 'floor-meadow';
  if (x < 49) return 'floor-street';
  if (x < 56) return 'floor-sand';
  if (x < 77) return 'floor-sea';
  if (x < 91) return 'floor-dusk';
  if (x < 123) return 'floor-garden';
  return 'floor-end';
}

// Camera route. Each stop slows the camera down over `dwell` px of scroll but never
// freezes it, so the page always answers the finger.
export const ROUTE = [
  { id: 'cover', label: 'Thiệp mời', x: 0, y: 3.1, dwell: 500, lx: -0.5 },
  { id: 'letter', x: 11, y: 3.1, dwell: 520, lx: 0.4 },
  { id: 'family', label: 'Gia đình', x: 22, y: 3.1, dwell: 620, lx: 0 },
  { id: 'date', label: 'Ngày cưới', x: 35, y: 3.1, dwell: 620, lx: 0.3 },
  { id: 'photos', label: 'Ảnh cưới', x: 50, y: 3.2, dwell: 640, lx: 0 },
  { id: 'sea', x: 65, y: 3.2, dwell: 560, lx: 0.2 },
  { x: 73, y: 3.6, lx: 0.3 },
  { x: 77.5, y: 9, lx: 0.2 },
  { id: 'rings', label: 'Đôi nhẫn', x: 80.5, y: 19.2, dwell: 760, lx: 0.3, fly: 1 },
  { x: 85, y: 12.5, lx: 0.1, fly: 1 },
  { x: 90, y: 5, lx: -0.1, fly: 0.6 },
  { id: 'venue', label: 'Địa điểm', x: 100, y: 3.1, dwell: 700, lx: 0.2, py: -0.4 },
  { id: 'hall', x: 115, y: 3.2, dwell: 620, lx: 0 },
  { id: 'end', x: 127, y: 3.1, dwell: 500, lx: 0.1, py: -0.9 },
];

// Tint of the world along x: afternoon, golden hour, dusk, night, then morning light.
export const TINT = [
  [0, [1, 1, 1]], [46, [1, 0.985, 0.95]], [68, [1, 0.93, 0.84]], [76, [0.74, 0.72, 0.84]],
  [82, [0.42, 0.47, 0.78]], [92, [0.5, 0.55, 0.8]], [114, [0.56, 0.6, 0.82]], [122, [0.9, 0.9, 0.95]], [126, [1, 1, 1]],
];

export function buildWorld(w) {
  const { put, polaroid, tree, glowAt, scatter } = w;

  /* ── Cover ── */
  put('title', { l: [1.9, 3.9, -2.68, 1], p: [0, 7.7, -2.68, 0.86], lit: 1, flip: 'y', flipFrom: -2 });
  put('plane-banner', { l: [-3, 5.65, -2.1, 1], p: [-0.1, 10.9, -2.1, 1], hover: 1, anim: { bob: [0.14, 0.7], drift: [0.28, 0.33], rz: [0.025, 0.7] } });
  put('wreath', { l: [-5.3, 3.8, -2.66, 0.62], p: [0, 4.35, -2.66, 0.72], hover: 1, anim: { rz: [0.02, 0.5] } });
  put('cloud-a', { l: [6.3, 5.8, -2.2, 0.85], p: [1.9, 12, -2.2, 0.62], hover: 1, anim: { bob: [0.09, 0.6], drift: [0.14, 0.2] } });
  put('cloud-b', { l: [-7.8, 6, -2.3, 0.85], p: [-2.2, 12.2, -2.3, 0.56], anim: { bob: [0.08, 0.5], drift: [0.12, 0.26] } });
  tree('tree-sage', 8.8, -2.3, 1);
  put('butterfly-a', { l: [4.4, 1.7, -1.9, 0.62], p: [1.7, 3.1, -1.9, 0.62], frames: ['butterfly-a', 'butterfly-b'], fps: 6, anim: { bob: [0.22, 1.1], drift: [0.5, 0.45] } });
  put('daisy', { l: [4.6, 0, -2.2, 1.1], p: [-1.7, 0, -2.2, 1.1], anim: { rz: [0.1, 1.1] }, pop: 1, hover: 1 });
  put('tulip', { l: [5.4, 0, -2.3, 1.1], p: [2.2, 0, -2.3, 1], anim: { rz: [0.09, 1.3] }, pop: 1 });
  scatter(['grass-a', 'grass-b'], -13, 28, 11);

  /* ── Letter ── */
  w.card = put('card-invite', { l: [12.5, 3.7, -2.62, 1.12], p: [11, 6.6, -2.62, 1.1], lit: 1, flip: 'y', hover: 1, onClick: 'name', tip: 'Viết tên bạn lên thiệp' });
  tree('tree-sage', 6, -2.32, 0.92);
  tree('tree-sage', 16.6, -2.32, 1);
  put('cloud-b', { l: [8, 5.9, -2.25, 0.8], p: [9.6, 11.3, -2.25, 0.62], anim: { bob: [0.09, 0.55], drift: [0.14, 0.18] } });
  put('butterfly-a', { l: [16, 2.4, -1.7, 0.62], p: [12.7, 3, -1.7, 0.62], frames: ['butterfly-a', 'butterfly-b'], fps: 6, anim: { bob: [0.24, 1], drift: [0.6, 0.4] } });
  put('daisy', { l: [14.4, 0, -2.25, 1], p: [13, 0, -2.25, 1], anim: { rz: [0.1, 1] }, pop: 1 });

  /* ── Two families ── */
  put('house-trai', { l: [20.6, 0, -2.36, 0.92], p: [19.6, 0, -2.36, 0.8], pop: 1, hover: 1 });
  put('house-gai', { l: [26.5, 0, -2.36, 0.92], p: [24.4, 0, -2.36, 0.8], pop: 1, hover: 1 });
  put('card-trai', { l: [19.1, 5.02, -2.62, 0.76], p: [22, 10.68, -2.62, 1.05], lit: 1, flip: 'y' });
  put('note-pinky', { l: [22.4, 5.26, -2.62, 0.68], p: [22, 7.87, -2.62, 0.85], lit: 1, flip: 'y' });
  put('card-gai', { l: [25.7, 5.02, -2.62, 0.76], p: [22, 5.12, -2.62, 1.05], lit: 1, flip: 'y' });
  put('tulip', { l: [23.1, 0, -2.25, 1.15], p: [22, 0, -2.25, 1], anim: { rz: [0.08, 1.2] }, pop: 1 });
  put('daisy', { l: [24, 0, -2.25, 1.1], p: [20.9, 0, -2.25, 0.9], anim: { rz: [0.1, 1] }, pop: 1 });

  /* ── Hải Phòng ── */
  put('nha-hat', { l: [33.5, 0, -2.42, 1], p: [34.8, 0, -2.42, 0.86], pop: 1, hover: 1 });
  tree('tree-phuong', 29, -2.3, 1.05);
  tree('tree-phuong', 43.8, -2.3, 1.15);
  put('fountain-a', { l: [36.9, 0, -0.9, 0.82], p: [37, 0, -0.5, 0.74], frames: ['fountain-a', 'fountain-b'], fps: 4 });
  put('lamp', { l: [27.8, 0, -2.2, 1.05], p: [33, 0, -2.2, 1], pop: 1 });
  put('lamp', { l: [41.8, 0, -2.2, 1.05], p: [37.6, 0, -2.2, 1], pop: 1 });
  put('lamp', { l: [46.4, 0, -2.2, 1.05], p: [41, 0, -2.2, 1], pop: 1 });
  put('card-date', { l: [39.4, 4.1, -2.62, 0.96], p: [35, 7.85, -2.62, 1.05], lit: 1, flip: 'y', hover: 1 });
  put('cloud-a', { l: [31, 6.1, -2.2, 0.72], p: [32.9, 11.9, -2.2, 0.6], anim: { bob: [0.09, 0.6], drift: [0.14, 0.2] } });

  /* ── Wedding photos: never faded in, never cropped ── */
  const P = (name, lx, ly, px, py, alt, lw = 2.25, pw = 2.75) => polaroid(name, { l: [lx, ly, -2.15, lw], p: [px, py, -2.15, pw], alt });
  P('hero', 44.4, 6.95, 48.5, 12.2, 'Đôi uyên ương trước phông hoa');
  P('doi-can', 47.1, 6.85, 51.6, 12.25, 'Cô dâu chú rể mỉm cười');
  P('can-doi', 50.6, 7, 54.7, 11.9, 'Cận mặt cô dâu và chú rể', 3.25, 2.8);
  P('doi-kem', 54.1, 6.95, 48.5, 7.65, 'Cô dâu chú rể khoác tay');
  P('co-dau', 56.8, 6.85, 51.6, 7.75, 'Cô dâu nghiêng người trong váy cưới');
  P('doi-xam', 59.5, 7, 54.7, 8.3, 'Đôi uyên ương trên nền xám');
  tree('tree-phuong', 48.2, -2.3, 0.82);
  put('tulip', { l: [52, 0, -2.2, 1.1], p: [51.5, 0, -2.2, 1], anim: { rz: [0.09, 1.2] } });

  /* ── Sea ── */
  for (let i = 0; i < 2; i++) {
    const x = 60.4 + i * 8.9;
    put('wave-a', { l: [x, -0.16, -2.05, 1], shadow: 0, thick: 0, anim: { bob: [0.09, 0.9], drift: [0.2, 0.5] } });
    put('wave-b', { l: [x + 0.1, -0.5, -0.55, 1], shadow: 0, thick: 0, anim: { bob: [0.11, 1.05], drift: [-0.24, 0.42] } });
    put('wave-c', { l: [x - 0.1, -1.05, 1.6, 1], shadow: 0, thick: 0, anim: { bob: [0.14, 1.2], drift: [0.28, 0.36] } });
  }
  for (const x of [55.3, 74.8]) {
    const f = x > 60 ? 1 : 0;
    put('dune', { l: [x, -0.02, -1.95, 1], flipX: f });
    put('dune', { l: [x + (f ? 0.3 : -0.3), -0.1, -0.42, 0.9], flipX: f });
    put('dune', { l: [x + (f ? 0.6 : -0.6), -0.58, 1.7, 0.78], flipX: f });
  }
  put('sun', { l: [62.9, 5.9, -2.4, 0.84], p: [63.3, 11.2, -2.4, 0.76], hover: 1, anim: { rz: [0.12, 0.5] } });
  put('card-count', { l: [67.2, 4.3, -2.62, 0.96], p: [65, 7.4, -2.62, 1.1], lit: 1, flip: 'y', dynamic: 'count' });
  put('island', { l: [71.4, -0.1, -2.42, 1], p: [67, -0.1, -2.42, 0.84], hover: 1 });
  put('cloud-b', { l: [69.5, 5.9, -2.3, 0.86], p: [66.2, 11.6, -2.3, 0.6], anim: { bob: [0.08, 0.5], drift: [0.14, 0.22] } });
  put('gull-a', { l: [63.4, 5.8, -2, 0.72], p: [65, 10, -2, 0.7], frames: ['gull-a', 'gull-b'], fps: 2.6, anim: { bob: [0.26, 0.9], drift: [1.1, 0.26] } });
  put('gull-a', { l: [72, 5, -1.8, 0.6], p: [62.4, 4, -1.8, 0.6], frames: ['gull-a', 'gull-b'], fps: 3.2, anim: { bob: [0.2, 1], drift: [0.9, 0.2] } });
  put('fish', { l: [63, 0, -1.1, 0.76], p: [64.6, 0, -1.1, 0.76], anim: { jump: [1.65, 1.15, 0] } });
  put('fish', { l: [70, 0, -1.1, 0.66], p: [63.2, 0, -1.1, 0.66], anim: { jump: [1.3, 1.35, 1.7] } });

  /* ── The climb: tall page, moon, gold rings ── */
  for (let y = 1.5; y < 27; y += 3) {
    put('vine', { l: [74.6, y, -2.68, 1], p: [76.8, y, -2.68, 1], shadow: 0, thick: 0 });
    put('vine', { l: [87.8, y, -2.68, 1], p: [84, y, -2.68, 1], shadow: 0, thick: 0, flipX: 1 });
  }
  const rs = w.rnd(77);
  for (let i = 0; i < 40; i++) {
    const x = 71 + rs() * 21, y = 7 + rs() * 21, s = 0.24 + rs() * 0.4;
    const nearLand = Math.hypot(x - 82, y - 20.5) < 3.6 || (Math.abs(x - 82.3) < 3.4 && Math.abs(y - 16.5) < 1.2);
    const nearPort = Math.hypot(x - 80.5, y + 1.6 - 24.2) < 3 || (Math.abs(x - 80.5) < 3 && Math.abs(y + 1.6 - 20.75) < 1.1);
    const tw = { twinkle: [0.22, 1 + rs() * 2.4, rs() * 6] };
    put('star', { l: nearLand ? null : [x, y, -2.64, s], p: nearPort ? null : [x, y + 1.6, -2.64, s], lit: 1, thick: 0, shadow: 0, anim: tw });
  }
  put('moon', { l: [86.8, 22.2, -2.5, 0.95], p: [82.2, 27, -2.5, 0.9], lit: 1, hover: 1, anim: { rz: [0.06, 0.4] } });
  put('cloud-a', { l: [72.3, 13, -2.25, 0.8], p: [78.6, 15.8, -2.25, 0.64], anim: { bob: [0.09, 0.5], drift: [0.15, 0.2] } });
  put('cloud-b', { l: [84.6, 15.4, -2.25, 0.9], p: [83, 16.4, -2.25, 0.6], anim: { bob: [0.09, 0.55], drift: [0.15, 0.16] } });
  put('lettering-forever', { l: [82.3, 16.5, -2.62, 0.9], p: [80.5, 20.75, -2.62, 0.84], lit: 1 });
  [[77, 10.1, 79.8, 11.6], [85.6, 11.9, 82.5, 12.9], [85.6, 19.4, 79.2, 27.7], [78.4, 23.4, 81.5, 27.6]].forEach(([lx, ly, px, py], i) => {
    put('lantern', { l: [lx, ly, -2, 0.82], p: [px, py, -2, 0.76], lit: 1, str: 1, swing: 1, anim: { rz: [0.06, 0.8 + i * 0.14] } });
    glowAt(lx, ly - 0.72, -1.98, px, py - 0.66, 1.5);
  });
  P('doi-tay', 80.8, 11.6, 79, 10.9, 'Đôi uyên ương nắm tay', 2.15, 2.5);
  P('tay-nam', 83.9, 8.7, 82.3, 10.2, 'Bàn tay cô dâu chú rể và bó hoa', 2.2, 2.3);

  /* ── W. Jardin ── */
  put('jardin', { l: [97.6, 0, -2.42, 1], p: [101.9, 0, -2.42, 0.74], pop: 1, hover: 1, lit: 0.6 });
  put('arch', { l: [92.2, 0, -1.95, 1], p: [97.2, 0, -1.95, 0.84], pop: 1, lit: 0.4 });
  put('arch', { l: [109.2, 0, -1.95, 0.98], p: [103.6, 0, -1.95, 0.84], pop: 1, lit: 0.4 });
  put('card-venue', { l: [104.3, 4.75, -2.62, 0.92], p: [100, 7.8, -2.62, 1.08], lit: 1, flip: 'y', hover: 1 });
  put('bush-white', { l: [95, 0, -1.7, 0.86], p: [98.4, 0, -1.7, 0.8], pop: 1, lit: 0.4 });
  put('bush-white', { l: [102.8, 0, -1.7, 0.9], p: [102.2, 0, -1.7, 0.8], pop: 1, flipX: 1, lit: 0.4 });
  put('table', { l: [105.2, 0, -1.9, 0.82], p: [105.6, 0, -1.9, 0.8], pop: 1, lit: 0.4 });
  put('table', { l: [112.4, 0, -2, 0.86], p: [108.4, 0, -2, 0.86], pop: 1, lit: 0.4 });
  put('cake', { l: [89.7, 0, -2.1, 0.86], p: [95.8, 0, -2.2, 0.8], pop: 1, hover: 1, lit: 0.4 });
  scatter(['grass-night'], 91, 124, 37, 0.7);
  // String lights along the whole garden.
  for (let i = 0; i < 42; i++) {
    const x = 90 + i * 0.84, t = (i % 8) / 8, sag = 4 * t * (1 - t) * 0.5;
    const ly = 8 - sag, py = 12.6 - sag;
    put('bulb', { l: [x, ly, -2.4, 0.95], p: [x, py, -2.4, 0.95], lit: 1, thick: 0, anim: { rz: [0.08, 1.2 + (i % 5) * 0.14] } });
    glowAt(x, ly - 0.25, -2.38, x, py - 0.25, 0.85, i);
  }

  /* ── The hall ── */
  P('w1', 110.2, 6.9, 115, 11.6, 'Sảnh tiệc W. Jardin nhìn từ trên', 3.2, 4.1);
  P('w3', 113.9, 6.85, 115, 7.75, 'Bảng tên W. Jardin', 3.2, 4.1);
  P('w2', 117.1, 7, 120.4, 12, 'Bánh cưới nhiều tầng', 1.9, 3);
  P('w6', 120.4, 6.9, 120.6, 6.4, 'Lối đi giữa các bàn tiệc', 3.2, 3.6);
  put('table', { l: [117.6, 0, -2, 0.84], p: [118.4, 0, -2, 0.84], pop: 1, flipX: 1, lit: 0.4 });
  tree('tree-sage', 123.6, -2.32, 1, 1);

  /* ── The end ── */
  put('lettering-end', { l: [130, 4.2, -2.62, 0.98], p: [127, 7.1, -2.62, 0.86], lit: 1, flip: 'y' });
  put('wreath', { l: [125.6, 6.6, -2.66, 0.56], p: [127, 9.9, -2.66, 0.62], hover: 1, anim: { rz: [0.02, 0.5] } });
  tree('tree-sage', 135.2, -2.3, 1.05);
  put('bush-white', { l: [132.4, 0, -1.8, 0.9], p: [129.5, 0, -1.8, 0.7], pop: 1 });
  put('tulip', { l: [129.8, 0, -2.2, 1.1], p: [128.8, 0, -2.2, 1], anim: { rz: [0.09, 1.2] }, pop: 1 });
  put('daisy', { l: [130.8, 0, -2.2, 1.1], p: [125.2, 0, -2.2, 1], anim: { rz: [0.1, 1] }, pop: 1 });
  put('cloud-a', { l: [134, 6.4, -2.2, 0.8], p: [124.7, 10.6, -2.2, 0.6], anim: { bob: [0.09, 0.6], drift: [0.14, 0.2] } });
  const rh = w.rnd(99);
  for (let i = 0; i < 8; i++) {
    const lx = 121 + rh() * 15, px = 124 + rh() * 6;
    put('heart-paper', { l: [lx, 0.8, -1.7, 0.3 + rh() * 0.3], p: [px, 1.4, -1.7, 0.26 + rh() * 0.2], thick: 0, lit: 1, anim: { rise: [7 + rh() * 4, 0.16 + rh() * 0.14, rh()], rz: [0.3, 1 + rh()] } });
  }
}
