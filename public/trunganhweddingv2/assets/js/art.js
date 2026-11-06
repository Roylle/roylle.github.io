// Tất cả hình vẽ tay của thiệp. Mỗi hàm trả về một canvas.
import { Sheet, C, F, blob, heartPts, shade } from './ink.js';

/* ---------- Hai nhân vật ---------- */

function groomHead(s) {
  s.shape([[-12, 30], [12, 30], [13, 52], [-13, 52]], C.skin, { hatch: false });
  s.shape(blob(0, 0, 34, 38, 14, 0, s.r), C.skin, { hatch: false });
  s.soft(-23, 15, 7, 5, C.rose, 0.38);
  s.soft(23, 15, 7, 5, C.rose, 0.38);
  s.shape([[-36, -3], [-38, -28], [-20, -47], [12, -50], [35, -32], [37, -6], [28, -18], [8, -29], [-12, -25], [-27, -15]], C.hair, { hk: 0.15, gap: 6 });
  s.dot(-14, -1, 3); s.dot(14, -1, 3);
  s.line(blob(-14, -1, 11.5, 10.5, 10), { closed: true, w: 2.4 });
  s.line(blob(14, -1, 11.5, 10.5, 10), { closed: true, w: 2.4 });
  s.line([[-3, -3], [3, -3]], { w: 2.2 });
  s.line([[-11, 17], [-2, 24], [11, 16]], { w: 2.8 });
}

function brideHead(s, veil = true) {
  if (veil) s.shape([[6, -44], [46, -38], [70, 16], [84, 92], [50, 112], [22, 60], [14, 8]], '#ffffff', { w: 2.4, hatch: false });
  s.circle(27, -38, 15, C.hair, { hk: 0.15, gap: 5 });
  s.shape([[-11, 28], [11, 28], [12, 48], [-12, 48]], C.skin, { hatch: false });
  s.shape(blob(0, 0, 33, 36, 14, 0, s.r), C.skin, { hatch: false });
  s.soft(-21, 13, 8, 6, C.rose, 0.42);
  s.soft(21, 13, 8, 6, C.rose, 0.42);
  s.shape([[-35, 4], [-35, -26], [-14, -44], [16, -44], [35, -24], [34, 2], [24, -18], [2, -30], [-18, -22]], C.hair, { hk: 0.15, gap: 6 });
  s.line([[-20, 0], [-14, -6], [-8, 0]], { w: 2.8 });
  s.line([[8, 0], [14, -6], [20, 0]], { w: 2.8 });
  s.line([[-8, 15], [0, 22], [9, 15]], { w: 2.6, c: C.coral });
  s.dot(-30, 14, 2.6, C.gold);
  s.circle(8, -40, 5, '#ffffff', { w: 1.6, hatch: false });
  s.circle(-5, -41, 4, '#ffffff', { w: 1.6, hatch: false });
}

function bouquet(s, x, y, k = 1) {
  s.at(x, y, k, (t) => {
    t.line([[0, 6], [-3, 44]], { c: C.fern, w: 5 });
    t.line([[6, 4], [8, 40]], { c: C.fern, w: 4 });
    for (const [lx, ly, a] of [[-18, -8, -0.6], [18, -8, 0.6]]) {
      t.at(lx, ly, 1, (u) => u.shape([[0, 12], [-8, -8], [0, -22], [8, -8]], C.leaf, { w: 2 }), a);
    }
    t.circle(-11, -6, 10, '#ffffff', { w: 2.2, hatch: false });
    t.circle(10, -8, 11, C.blush, { w: 2.2, hk: -0.1 });
    t.circle(0, -18, 10, '#ffffff', { w: 2.2, hatch: false });
    t.circle(2, 2, 8, C.cream, { w: 2, hatch: false });
  });
}

function gownTop(s, cx, y, w = 42) {
  s.shape([[cx - w, y], [cx - w + 4, y - 44], [cx - 14, y - 52], [cx + 14, y - 52], [cx + w - 4, y - 44], [cx + w, y]], '#ffffff', { w: 2.8, hatch: false });
}

export function coupleWalk() {
  const s = new Sheet(680, 800, 11);
  // Váy cưới
  s.shape([[188, 380], [120, 470], [62, 620], [36, 742], [90, 758], [150, 742], [210, 760], [270, 744], [330, 758], [352, 730], [320, 610], [270, 470], [222, 380]], '#ffffff', { w: 3.4, ang: 1.2, gap: 14, hk: -0.09 });
  for (let i = 0; i < 26; i++) {
    const a = s.r(), yy = 470 + a * 240, half = 40 + a * 130;
    s.soft(200 + (s.r() - 0.5) * half * 1.8, yy, 6, 4, C.grey, 0.28);
  }
  gownTop(s, 205, 384, 38);
  s.shape([[166, 346], [146, 400], [150, 452], [172, 456], [182, 396]], C.skin, { hatch: false, w: 2.6 });
  s.at(205, 268, 1.14, (t) => brideHead(t));
  bouquet(s, 158, 430, 1.25);

  // Chú rể
  s.shape([[420, 560], [408, 730], [470, 734], [486, 590], [500, 734], [560, 730], [546, 556]], C.navy, { hk: 0.1 });
  s.shape([[404, 740], [472, 738], [474, 760], [392, 760]], C.hair, { hatch: false, w: 2.6 });
  s.shape([[498, 738], [562, 738], [578, 760], [498, 760]], C.hair, { hatch: false, w: 2.6 });
  s.shape([[392, 340], [420, 318], [486, 312], [548, 320], [576, 346], [572, 460], [556, 590], [414, 590], [398, 470]], C.navy, { hk: 0.12 });
  s.shape([[452, 318], [486, 400], [516, 318]], '#ffffff', { poly: true, hatch: false, w: 2.4 });
  s.shape([[478, 332], [494, 332], [502, 420], [486, 444], [472, 420]], C.grey, { w: 2.2, poly: true, gap: 5 });
  s.line([[452, 318], [474, 416], [486, 500]], { c: C.navyL, w: 4 });
  s.line([[516, 318], [498, 416], [486, 500]], { c: C.navyL, w: 4 });
  s.shape([[528, 400], [554, 396], [556, 408], [530, 412]], '#ffffff', { hatch: false, w: 1.8, poly: true });
  s.shape([[398, 346], [366, 420], [340, 470], [362, 490], [408, 440], [424, 380]], C.navy, { hk: 0.12 });
  s.shape([[552, 346], [596, 430], [578, 530], [548, 526], [556, 440], [530, 390]], C.navy, { hk: 0.12 });
  s.circle(350, 484, 16, C.skin, { hatch: false, w: 2.6 });
  s.at(486, 250, 1.16, (t) => groomHead(t));
  // Tơ hồng nối hai ngón út
  s.line([[350, 494], [326, 524], [290, 516], [250, 462], [178, 458]], { c: C.thread, w: 3 });
  return s.done();
}

export function coupleBike() {
  const s = new Sheet(960, 780, 12);
  const tube = (a, b, w = 11) => {
    s.line([a, b], { poly: true, w: w + 6, amp: 0.7 });
    s.line([a, b], { poly: true, w, c: C.sageD, amp: 0.7 });
  };
  const rear = [220, 630], front = [740, 630], bb = [440, 630], seat = [400, 372], head = [672, 358];
  tube(rear, bb); tube(bb, seat); tube(seat, rear); tube(seat, head); tube(bb, head); tube(head, front);
  // Đèn, ghi đông, giỏ hoa
  s.line([[672, 358], [660, 310], [612, 290]], { w: 11 });
  s.shape([[684, 354], [808, 348], [794, 432], [700, 438]], C.wood, { gap: 7, poly: true });
  s.line([[684, 382], [806, 376]], { c: C.woodD, w: 2.6 });
  s.line([[692, 408], [798, 402]], { c: C.woodD, w: 2.6 });
  for (const [x, y, r, c] of [[706, 330, 24, '#ffffff'], [750, 318, 28, C.blush], [792, 332, 22, '#ffffff'], [730, 346, 18, C.cream]]) {
    s.circle(x, y, r, c, { w: 2.6, hatch: c !== '#ffffff' });
    s.circle(x, y, r * 0.28, C.gold, { w: 1.6, hatch: false });
  }
  // Giá sau và bàn đạp
  s.line([[396, 392], [190, 410]], { w: 9 });
  s.circle(bb[0], bb[1], 26, C.stone, { w: 3 });
  // Chú rể đang đạp xe
  s.shape([[408, 362], [522, 470], [492, 628], [448, 626], [456, 496], [376, 416]], C.navy, { hk: 0.12 });
  s.shape([[446, 624], [520, 624], [538, 650], [440, 650]], C.hair, { hatch: false, w: 2.4 });
  s.shape([[390, 374], [420, 216], [474, 180], [544, 196], [556, 246], [494, 380]], C.navy, { hk: 0.12 });
  s.shape([[496, 194], [534, 200], [526, 254], [510, 268]], '#ffffff', { hatch: false, w: 2.2, poly: true });
  s.shape([[510, 208], [522, 208], [524, 246], [514, 260], [506, 246]], C.grey, { w: 1.8, poly: true, gap: 5 });
  s.shape([[500, 206], [614, 286], [620, 312], [596, 322], [478, 256]], C.navy, { hk: 0.12 });
  s.circle(610, 302, 16, C.skin, { hatch: false, w: 2.6 });
  s.at(526, 120, 1.12, (t) => groomHead(t));
  // Cô dâu ngồi nghiêng ở giá sau
  s.shape([[250, 262], [176, 356], [98, 470], [64, 560], [120, 590], [190, 570], [262, 594], [340, 570], [382, 546], [362, 450], [318, 340], [292, 264]], '#ffffff', { w: 3.4, ang: 1.2, gap: 14, hk: -0.09 });
  for (let i = 0; i < 16; i++) s.soft(150 + s.r() * 190, 380 + s.r() * 170, 6, 4, C.grey, 0.28);
  gownTop(s, 272, 278, 36);
  s.shape([[300, 244], [420, 256], [436, 272], [418, 288], [292, 280]], C.skin, { hatch: false, w: 2.6 });
  s.at(268, 172, 1.08, (t) => {
    t.x.save(); t.x.scale(-1, 1); brideHead(t); t.x.restore();
  });
  bouquet(s, 322, 310, 1.1);
  return s.done();
}

export function wheel() {
  const s = new Sheet(300, 300, 13);
  const R = 118;
  s.line(blob(150, 150, R, R, 18), { closed: true, w: 11, amp: 0.8 });
  s.line(blob(150, 150, R - 7, R - 7, 18), { closed: true, w: 3, c: C.grey, amp: 0.7 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    s.line([[150, 150], [150 + Math.cos(a) * (R - 6), 150 + Math.sin(a) * (R - 6)]], { w: 2.2, poly: true, amp: 0.6, c: C.navyL });
  }
  s.circle(150, 150, 13, C.gold, { w: 3, hatch: false });
  return s.done({ border: 0, grained: false });
}

export function coupleBoat() {
  const s = new Sheet(980, 760, 14);
  // Cột buồm và cờ
  s.line([[470, 40], [470, 500]], { w: 10, c: C.woodD });
  s.shape([[476, 50], [650, 110], [476, 180]], C.cream, { poly: true });
  s.shape(heartPts(530, 112, 24), C.coral, { w: 2.4, hk: -0.1 });
  // Cô dâu
  s.shape([[250, 380], [170, 560], [380, 560], [320, 380]], '#ffffff', { w: 3, gap: 14, hk: -0.08 });
  gownTop(s, 285, 402, 40);
  s.at(280, 290, 1.14, (t) => brideHead(t));
  bouquet(s, 240, 450, 1.2);
  // Chú rể cầm mái chèo
  s.shape([[560, 370], [600, 346], [670, 346], [716, 374], [720, 560], [556, 560]], C.navy, { hk: 0.12 });
  s.shape([[614, 350], [646, 412], [676, 350]], '#ffffff', { poly: true, hatch: false, w: 2.4 });
  s.shape([[638, 362], [654, 362], [660, 424], [646, 442], [634, 424]], C.grey, { poly: true, w: 2, gap: 5 });
  s.at(642, 276, 1.14, (t) => groomHead(t));
  s.line([[850, 330], [700, 640]], { w: 13, c: C.woodD });
  s.shape([[700, 620], [736, 640], [696, 716], [668, 700]], C.wood, { w: 3 });
  s.shape([[710, 382], [810, 422], [806, 454], [700, 440]], C.navy, { hk: 0.12 });
  s.circle(806, 436, 17, C.skin, { hatch: false, w: 2.6 });
  // Thân thuyền
  s.shape([[48, 516], [160, 544], [820, 540], [934, 484], [850, 690], [150, 700]], C.wood, { gap: 11, ang: 0.05 });
  s.shape([[64, 546], [158, 572], [820, 568], [916, 522], [902, 556], [822, 600], [156, 604], [78, 580]], C.cream, { w: 2.6, ang: 0.05, gap: 9 });
  s.line([[120, 640], [860, 634]], { c: C.woodD, w: 3 });
  return s.done();
}

export function coupleBalloon() {
  const s = new Sheet(700, 1120, 15);
  // Dây
  for (const [a, b] of [[122, 248], [250, 268], [450, 432], [578, 452]]) s.line([[a, 530], [b, 800]], { w: 3 });
  // Khinh khí cầu
  s.shape([[350, 28], [510, 66], [630, 210], [640, 360], [560, 500], [430, 610], [270, 610], [140, 500], [60, 360], [70, 210], [190, 66]], C.cream, { w: 4, gap: 12 });
  for (const [pts, c] of [
    [[[350, 28], [270, 74], [214, 210], [214, 370], [260, 530], [305, 610], [270, 610], [140, 500], [60, 360], [70, 210], [190, 66]], C.sage],
    [[[350, 28], [430, 74], [486, 210], [486, 370], [440, 530], [395, 610], [430, 610], [560, 500], [640, 360], [630, 210], [510, 66]], C.sage],
  ]) s.shape(pts, c, { w: 3.4, gap: 10 });
  s.shape(heartPts(350, 300, 66), C.coral, { w: 3, hk: -0.12 });
  // Khâu đường viền
  s.line([[120, 470], [240, 516], [350, 530], [460, 516], [580, 470]], { c: C.goldD, w: 4 });
  // Đôi bạn trong giỏ
  s.shape([[226, 800], [320, 780], [340, 870], [220, 870]], '#ffffff', { w: 2.8, hatch: false });
  s.shape([[366, 786], [470, 786], [486, 870], [356, 870]], C.navy, { hk: 0.12 });
  s.shape([[396, 790], [420, 836], [446, 790]], '#ffffff', { poly: true, hatch: false, w: 2.2 });
  s.at(272, 722, 0.98, (t) => brideHead(t));
  s.at(420, 716, 0.98, (t) => groomHead(t));
  s.shape([[470, 806], [540, 730], [558, 742], [504, 830]], C.navy, { hk: 0.12 });
  s.circle(552, 722, 15, C.skin, { hatch: false, w: 2.6 });
  // Giỏ mây
  s.shape([[190, 852], [510, 852], [486, 1060], [214, 1060]], C.wood, { gap: 7, ang: 0.8, poly: true });
  for (let y = 888; y < 1050; y += 36) s.line([[196 + (y - 852) * 0.1, y], [504 - (y - 852) * 0.1, y]], { c: C.woodD, w: 2.6 });
  s.shape([[176, 838], [524, 838], [524, 866], [176, 866]], C.woodD, { gap: 6, ang: 1.3, poly: true });
  return s.done();
}

/* ---------- Cây cỏ ---------- */

export function cloud(seed = 1) {
  const s = new Sheet(720, 400, 20 + seed);
  s.shape([[70, 300], [40, 240], [84, 184], [150, 180], [176, 110], [264, 84], [332, 124], [400, 62], [504, 84], [536, 156], [616, 170], [672, 236], [640, 306], [552, 330], [470, 318], [380, 344], [270, 326], [170, 336]], '#ffffff', { w: 3.4, hatch: true, gap: 13, hk: -0.05, ang: 0.4 });
  s.line([[250, 200], [290, 170], [324, 200], [296, 226], [276, 206]], { w: 2.4, c: C.grey });
  s.line([[454, 170], [492, 150], [520, 182], [496, 204]], { w: 2.4, c: C.grey });
  return s.done();
}

export function sun() {
  const s = new Sheet(500, 500, 24);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = 118, r1 = i % 2 ? 196 : 222;
    const c = Math.cos(a), n = Math.sin(a);
    s.shape([[250 + c * r0 - n * 22, 250 + n * r0 + c * 22], [250 + c * r1, 250 + n * r1], [250 + c * r0 + n * 22, 250 + n * r0 - c * 22]], i % 2 ? C.blush : C.gold, { w: 2.8, gap: 6 });
  }
  s.circle(250, 250, 116, C.cream, { w: 3.6, gap: 10, hk: -0.08 });
  s.line([[250, 250], [278, 228], [298, 262], [262, 296], [214, 270], [216, 214], [270, 192], [326, 220]], { w: 2.4, c: C.goldD });
  return s.done();
}

export function moon() {
  const s = new Sheet(460, 460, 25);
  s.shape([[290, 50], [200, 70], [120, 150], [100, 260], [160, 360], [270, 410], [370, 380], [410, 330], [320, 330], [230, 280], [200, 190], [230, 100]], C.cream, { w: 3.6, gap: 9, hk: -0.08 });
  return s.done({ tone: '#fff6dc' });
}

export function star(seed = 1, col = C.gold) {
  const s = new Sheet(160, 160, 26 + seed);
  const p = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 20 : 66;
    p.push([80 + Math.cos(a) * r, 80 + Math.sin(a) * r]);
  }
  s.shape(p, col, { poly: true, w: 2.8, gap: 6 });
  return s.done({ border: 3 });
}

export function grass(seed = 1) {
  const s = new Sheet(300, 240, 30 + seed);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const bx = 60 + (i / (n - 1)) * 180, lean = (bx - 150) * 0.6 + (s.r() - 0.5) * 30, h = 120 + s.r() * 90;
    s.shape([[bx - 13, 232], [bx - 4 + lean * 0.35, 232 - h * 0.55], [bx + lean, 232 - h], [bx + 8 + lean * 0.35, 232 - h * 0.5], [bx + 13, 232]], i % 2 ? C.leaf : C.sageD, { w: 2.8, gap: 6, ang: 1.3 });
  }
  return s.done({ border: 5 });
}

export function fern(seed = 1) {
  const s = new Sheet(320, 560, 34 + seed);
  const lean = 40 + s.r() * 40;
  const spine = (t) => [150 + lean * t * t, 545 - t * 510];
  s.line(Array.from({ length: 8 }, (_, i) => spine(i / 7)), { c: C.fern, w: 5 });
  for (let i = 1; i < 13; i++) {
    const t = i / 13, [x, y] = spine(t), L = 120 * (1 - t * 0.72);
    for (const d of [-1, 1]) {
      s.shape([[x, y], [x + d * L * 0.5, y - L * 0.36], [x + d * L, y - L * 0.34], [x + d * L * 0.5, y - L * 0.08]], i % 2 ? C.leaf : C.fern, { w: 2, gap: 5, ang: 0.3 });
    }
  }
  return s.done({ border: 5 });
}

function petals(s, cx, cy, r, n, fill, inner = C.gold) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    s.at(cx, cy, 1, (t) => t.shape([[0, 0], [r * 0.38, -r * 0.44], [r * 0.32, -r * 0.9], [0, -r * 1.06], [-r * 0.32, -r * 0.9], [-r * 0.38, -r * 0.44]], fill, { w: 2.6, gap: 7, ang: a, hk: -0.08 }), a);
  }
  s.circle(cx, cy, r * 0.24, inner, { w: 2.4, gap: 4 });
}

export function flower(seed = 1, fill = '#ffffff') {
  const s = new Sheet(300, 520, 40 + seed);
  s.line([[150, 510], [140, 360], [156, 210]], { c: C.fern, w: 6 });
  s.shape([[144, 400], [70, 336], [40, 352], [84, 410]], C.leaf, { w: 2.6, gap: 6 });
  s.shape([[148, 330], [232, 280], [262, 296], [214, 348]], C.leaf, { w: 2.6, gap: 6 });
  petals(s, 152, 136, 100, 6, fill);
  return s.done({ border: 5 });
}

export function hydrangea(seed = 1) {
  const s = new Sheet(560, 430, 44 + seed);
  // Lá phía dưới
  for (const [x, a] of [[110, -0.9], [220, -0.3], [340, 0.3], [450, 0.9]]) {
    s.at(x, 396, 1, (t) => t.shape([[0, 20], [-46, -44], [0, -120], [46, -44]], C.leaf, { w: 2.8, gap: 7 }), a);
  }
  const balls = [[150, 268, 92], [404, 262, 96], [278, 170, 104], [278, 310, 84]];
  for (const [x, y, R] of balls) {
    s.shape(blob(x, y, R, R * 0.94, 14, 0.05, s.r), '#fbf6e8', { w: 2.8, gap: 16, hk: -0.05 });
    // Cánh hoa nhỏ bốn cánh như bông cẩm tú cầu thật trong ảnh
    const n = Math.round(R * 0.3);
    for (let i = 0; i < n; i++) {
      const a = s.r() * 6.283, d = Math.sqrt(s.r()) * (R - 16);
      const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.94, r = 8 + s.r() * 4;
      s.x.strokeStyle = 'rgba(180,143,63,.62)'; s.x.lineWidth = 1.4;
      s.x.fillStyle = i % 4 ? '#ffffff' : C.blush;
      for (let k = 0; k < 4; k++) {
        const ka = (k / 4) * 6.283 + a;
        s.x.beginPath(); s.x.ellipse(fx + Math.cos(ka) * r * 0.62, fy + Math.sin(ka) * r * 0.62, r * 0.6, r * 0.42, ka, 0, 7); s.x.fill(); s.x.stroke();
      }
      s.dot(fx, fy, 1.8, C.goldD);
    }
  }
  return s.done({ border: 5 });
}

export function tree(seed = 1, bloom = '#ffffff') {
  const s = new Sheet(880, 1040, 48 + seed);
  s.shape([[390, 1032], [420, 880], [404, 700], [340, 560], [392, 540], [454, 660], [520, 520], [572, 544], [506, 720], [510, 880], [560, 1032]], C.wood, { w: 4, gap: 9, ang: 1.45 });
  for (const yy of [950, 860, 780]) s.line([[428, yy], [462, yy - 28], [496, yy - 8]], { c: C.woodD, w: 2.6 });
  for (const [x, y, r] of [[230, 410, 170], [430, 240, 210], [660, 400, 170], [440, 470, 180], [140, 280, 110], [730, 250, 110]]) {
    s.shape(blob(x, y, r, r * 0.92, 11, 0.16, s.r), r > 170 ? C.sage : C.sageD, { w: 3.6, gap: 13, hk: -0.13 });
  }
  for (let i = 0; i < 16; i++) {
    const a = s.r() * 6.3, d = Math.sqrt(s.r());
    petals(s, 440 + Math.cos(a) * d * 320, 330 + Math.sin(a) * d * 230, 34 + s.r() * 12, 5, bloom);
  }
  return s.done();
}

export function butterfly() {
  const s = new Sheet(240, 200, 52);
  s.shape([[116, 100], [60, 34], [20, 50], [34, 100], [70, 118]], C.blush, { w: 2.8, gap: 6 });
  s.shape([[116, 106], [68, 122], [46, 158], [84, 172], [112, 132]], C.rose, { w: 2.8, gap: 6 });
  s.shape([[124, 100], [180, 34], [220, 50], [206, 100], [170, 118]], C.blush, { w: 2.8, gap: 6 });
  s.shape([[124, 106], [172, 122], [194, 158], [156, 172], [128, 132]], C.rose, { w: 2.8, gap: 6 });
  s.line([[120, 70], [120, 150]], { w: 7 });
  s.line([[120, 74], [104, 44], [92, 38]], { w: 2 });
  s.line([[120, 74], [136, 44], [148, 38]], { w: 2 });
  return s.done({ border: 4 });
}

export function bird() {
  const s = new Sheet(300, 180, 53);
  s.shape([[32, 86], [84, 40], [140, 70], [152, 92], [168, 68], [226, 34], [272, 84], [212, 84], [172, 112], [150, 134], [130, 110], [90, 84]], C.navyL, { w: 2.6, gap: 7, hk: 0.14 });
  return s.done({ border: 4 });
}

/* ---------- Hai ngôi nhà ---------- */

export function houseA() {
  const s = new Sheet(640, 980, 60);
  s.shape([[110, 240], [530, 240], [530, 970], [110, 970]], C.cream, { poly: true, w: 4, gap: 12 });
  // Mái ngói
  s.shape([[70, 250], [320, 70], [570, 250]], C.rose, { poly: true, w: 4, gap: 9, ang: 0.3 });
  for (let i = 1; i < 5; i++) s.line([[70 + i * 44, 250 - i * 32], [570 - i * 44, 250 - i * 32]], { w: 2.4, c: C.coral });
  s.circle(320, 176, 30, C.white, { w: 3, hatch: false });
  s.shape(heartPts(320, 176, 16), C.coral, { w: 2, hk: -0.1 });
  const shutter = (x, y, w, h) => {
    s.shape([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], C.sageL, { poly: true, w: 3, gap: 8 });
    s.shape([[x - 34, y], [x, y], [x, y + h], [x - 34, y + h]], C.sageD, { poly: true, w: 3, gap: 6, ang: 0 });
    s.shape([[x + w, y], [x + w + 34, y], [x + w + 34, y + h], [x + w, y + h]], C.sageD, { poly: true, w: 3, gap: 6, ang: 0 });
    s.line([[x + w / 2, y], [x + w / 2, y + h]], { w: 2.4, poly: true });
  };
  shutter(240, 290, 160, 170);
  // Ban công
  s.shape([[150, 530], [490, 530], [490, 560], [150, 560]], C.creamD, { poly: true, w: 3 });
  for (let x = 170; x < 480; x += 36) s.line([[x, 470], [x, 530]], { w: 3, poly: true });
  s.line([[150, 470], [490, 470]], { w: 5 });
  for (let i = 0; i < 12; i++) {
    const a = s.r();
    s.circle(160 + a * 320, 462 + s.r() * 26, 13 + s.r() * 8, i % 2 ? C.blush : C.rose, { w: 2.2, gap: 5 });
  }
  shutter(240, 620, 160, 130);
  // Cửa
  s.shape([[250, 970], [250, 830], [320, 780], [390, 830], [390, 970]], C.fern, { w: 3.6, gap: 7, ang: 1.5, hk: -0.18 });
  s.line([[320, 790], [320, 970]], { w: 2.6, poly: true });
  s.circle(305, 900, 5, C.gold, { w: 1.6, hatch: false });
  return s.done();
}

export function houseB() {
  const s = new Sheet(800, 860, 61);
  s.shape([[90, 300], [710, 300], [710, 850], [90, 850]], C.blush, { poly: true, w: 4, gap: 13, hk: -0.08 });
  s.shape([[46, 310], [170, 130], [630, 130], [754, 310]], C.sageD, { poly: true, w: 4, gap: 9, ang: 0.15 });
  for (let i = 1; i < 4; i++) s.line([[46 + i * 31, 310 - i * 45], [754 - i * 31, 310 - i * 45]], { w: 2.4, c: C.fern });
  const arch = (x, y, w, h, c) => {
    s.shape([[x, y + h], [x, y + w / 2], [x + w * 0.14, y + w * 0.14], [x + w / 2, y], [x + w * 0.86, y + w * 0.14], [x + w, y + w / 2], [x + w, y + h]], c, { w: 3.2, gap: 7 });
    s.line([[x + w / 2, y], [x + w / 2, y + h]], { w: 2.4, poly: true });
    s.line([[x, y + w / 2], [x + w, y + w / 2]], { w: 2.4, poly: true });
  };
  arch(150, 350, 120, 180, C.sky); arch(340, 350, 120, 180, C.sky); arch(530, 350, 120, 180, C.sky);
  s.line([[110, 570], [690, 570]], { w: 6 });
  arch(150, 610, 120, 240, C.sage); arch(530, 610, 120, 240, C.sage);
  arch(325, 600, 150, 250, C.wood);
  // Đèn lồng đôi
  for (const x of [292, 508]) {
    s.line([[x, 570], [x, 610]], { w: 3 });
    s.ellipse(x, 642, 28, 34, C.coral, { w: 3, gap: 6, hk: -0.14 });
    s.line([[x, 676], [x, 702]], { w: 3, c: C.gold });
  }
  return s.done();
}

export function familyCard(side) {
  const s = new Sheet(720, 470, 62 + side);
  const t = side === 0
    ? ['Nhà trai', 'Ông Lê Viết Cảnh', 'Bà Nguyễn Thị Cúc', 'Viết Trung', 'út nam']
    : ['Nhà gái', 'Ông Bùi Xuân Thái', 'Bà Phạm Thị Sự', 'Bùi Anh', 'út nữ'];
  s.shape([[24, 22], [696, 14], [704, 446], [18, 456]], C.paper, { poly: true, w: 3.4, hatch: false });
  s.text(t[0], 360, 96, { f: F.script, s: 86, c: C.fern });
  s.text(t[1], 360, 176, { s: 54 });
  s.text(t[2], 360, 240, { s: 54 });
  s.line([[240, 280], [480, 276]], { w: 2.4, c: C.sageD });
  s.text(t[3], 360, 368, { f: F.script, s: 92, c: C.thread });
  s.text(t[4], 360, 424, { s: 42, c: C.fern });
  return s.done({ border: 5 });
}

export function thread() {
  const s = new Sheet(1400, 240, 66);
  const pts = [[10, 90], [190, 170], [430, 196], [640, 150], [700, 118], [760, 150], [980, 196], [1210, 170], [1390, 90]];
  s.line(pts, { c: C.thread, w: 5, amp: 2.6 });
  return s.done({ border: 0, grained: false });
}

/* ---------- Bầu trời và biển ---------- */

export function plane() {
  const s = new Sheet(1320, 460, 70);
  // Băng rôn
  s.shape([[30, 160], [200, 130], [420, 170], [640, 130], [800, 156], [800, 320], [640, 294], [420, 334], [200, 294], [30, 324]], C.paper, { w: 3.2, hatch: false });
  s.text('Save the Date', 415, 262, { f: F.script, s: 92, c: C.fern });
  s.line([[800, 190], [950, 236]], { w: 2.6 });
  s.line([[800, 290], [950, 236]], { w: 2.6 });
  // Máy bay giấy
  s.shape([[1290, 150], [930, 90], [1040, 240]], '#ffffff', { poly: true, w: 3.4, hatch: false });
  s.shape([[1290, 150], [1040, 240], [960, 340]], C.sageL, { poly: true, w: 3.4, gap: 8 });
  s.shape([[1290, 150], [1040, 240], [1012, 196]], C.sage, { poly: true, w: 3, gap: 7 });
  return s.done();
}

export function wave(seed = 1, col = C.sea) {
  const s = new Sheet(1200, 280, 71 + seed);
  const p = [[0, 280], [0, 90]];
  const hump = 120;
  for (let x = 0; x <= 1200; x += hump) {
    p.push([x + hump * 0.28, 44 + s.r() * 12], [x + hump * 0.72, 44 + s.r() * 12], [x + hump, 96]);
  }
  p.push([1200, 280]);
  s.shape(p, col, { poly: false, w: 4, gap: 14, ang: 0.08, hk: -0.1, amp: 1.2 });
  for (let i = 0; i < 9; i++) {
    const x = 40 + s.r() * 1080, y = 140 + s.r() * 100;
    s.line([[x, y], [x + 22, y - 12], [x + 44, y], [x + 66, y - 12], [x + 88, y]], { c: '#ffffff', w: 3.4 });
  }
  return s.done({ border: 0 });
}

export function karst(seed = 1) {
  const s = new Sheet(760, 760, 75 + seed);
  s.shape([[30, 750], [64, 560], [110, 420], [150, 250], [228, 90], [320, 60], [388, 180], [424, 330], [486, 300], [556, 340], [612, 500], [700, 620], [734, 750]], C.stone, { w: 4, gap: 13, hk: -0.16, ang: 1.1 });
  for (const [x, y, r] of [[250, 92, 52], [320, 80, 46], [500, 320, 48], [120, 410, 42], [610, 500, 36]]) {
    s.shape(blob(x, y, r, r * 0.6, 9, 0.2, s.r), C.sageD, { w: 3, gap: 8 });
  }
  for (const [a, b, c] of [[[200, 300], [230, 450], [190, 620]], [[330, 260], [370, 420], [350, 650]], [[520, 420], [560, 540], [540, 680]]]) s.line([a, b, c], { c: C.stoneD, w: 3 });
  return s.done();
}

export function lighthouse() {
  const s = new Sheet(420, 900, 78);
  s.shape([[10, 890], [52, 800], [120, 770], [300, 770], [368, 804], [410, 890]], C.stoneD, { w: 3.6, gap: 10 });
  s.shape([[140, 790], [168, 220], [252, 220], [280, 790]], '#ffffff', { poly: true, w: 3.8, hatch: false });
  s.shape([[152, 590], [158, 470], [262, 470], [268, 590]], C.coral, { poly: true, w: 3, gap: 7, hk: -0.13 });
  s.shape([[166, 350], [170, 260], [250, 260], [254, 350]], C.coral, { poly: true, w: 3, gap: 7, hk: -0.13 });
  s.shape([[148, 222], [272, 222], [272, 240], [148, 240]], C.ink, { poly: true, w: 2, hatch: false });
  s.shape([[174, 220], [174, 136], [246, 136], [246, 220]], C.cream, { poly: true, w: 3.2, gap: 6 });
  s.shape([[160, 138], [210, 70], [260, 138]], C.navy, { poly: true, w: 3.2, gap: 6, hk: 0.14 });
  s.shape([[192, 790], [192, 690], [210, 672], [228, 690], [228, 790]], C.navy, { w: 2.6, gap: 5, hk: 0.14 });
  return s.done();
}

export function gull() {
  const s = new Sheet(360, 200, 79);
  s.shape([[28, 72], [108, 54], [168, 96], [186, 118], [214, 88], [290, 40], [336, 78], [268, 100], [220, 138], [176, 148], [130, 112], [76, 96]], '#ffffff', { w: 3, gap: 8, hk: -0.06 });
  s.shape([[28, 72], [70, 58], [76, 96]], C.navyL, { w: 2.2, gap: 5, hk: 0.1 });
  s.shape([[336, 78], [296, 42], [268, 100]], C.navyL, { w: 2.2, gap: 5, hk: 0.1 });
  return s.done({ border: 4 });
}

export function fish() {
  const s = new Sheet(360, 220, 80);
  s.shape([[300, 110], [220, 50], [120, 54], [60, 108], [118, 166], [224, 168]], C.blush, { w: 3.2, gap: 7 });
  s.shape([[70, 110], [12, 50], [24, 110], [12, 172]], C.rose, { w: 3, gap: 6 });
  s.shape([[176, 54], [214, 18], [232, 62]], C.rose, { w: 2.6, gap: 5 });
  s.dot(252, 100, 6);
  s.line([[210, 74], [192, 108], [210, 146]], { w: 2.6 });
  return s.done({ border: 4 });
}

export function paperBoat() {
  const s = new Sheet(420, 340, 81);
  s.shape([[20, 200], [400, 200], [320, 320], [100, 320]], '#ffffff', { poly: true, w: 3.4, hatch: false });
  s.shape([[210, 24], [100, 200], [320, 200]], C.sageL, { poly: true, w: 3.4, gap: 8 });
  s.line([[210, 24], [210, 200]], { w: 2.4, poly: true });
  return s.done({ border: 4 });
}

/* ---------- Cây leo, nhẫn, lịch ---------- */

export function vine(seed = 1) {
  const s = new Sheet(560, 900, 85 + seed);
  const dir = seed % 2 ? 1 : -1;
  const pts = Array.from({ length: 8 }, (_, i) => [280 + Math.sin(i * 0.9 + seed) * 54, i * 128 + 2]);
  s.line(pts, { w: 13, amp: 0.6 });
  s.line(pts, { w: 7, c: C.fern, amp: 0.6 });
  [100, 300, 500, 700].forEach((y, i) => {
    const d = (i % 2 ? 1 : -1) * dir, x = 280 + Math.sin((y / 128) * 0.9 + seed) * 54;
    s.shape([[x, y], [x + d * 90, y - 60], [x + d * 190, y - 56], [x + d * 110, y + 14]], C.leaf, { w: 3, gap: 8, ang: 0.3 });
    s.line([[x, y], [x + d * 130, y - 34]], { w: 2, c: C.fern });
  });
  [200, 600].forEach((y, i) => {
    const d = (i % 2 ? -1 : 1) * dir, x = 280 + Math.sin((y / 128) * 0.9 + seed) * 54;
    petals(s, x + d * 130, y, 58, 6, '#ffffff');
  });
  return s.done({ border: 5 });
}

export function calendar() {
  const s = new Sheet(860, 880, 90);
  s.shape([[26, 44], [832, 30], [838, 852], [20, 860]], C.paper, { poly: true, w: 3.6, hatch: false });
  s.shape([[340, 8], [530, 16], [524, 66], [334, 60]], 'rgba(216,178,92,0.55)', { poly: true, w: 0, hatch: false, outline: false });
  s.text('Tháng 11, 2026', 430, 150, { f: F.script, s: 92, c: C.fern });
  const heads = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const gx = (i) => 118 + i * 104, gy = (r) => 310 + r * 104;
  heads.forEach((h, i) => s.text(h, gx(i), 232, { s: 38, c: C.sageD }));
  s.line([[70, 252], [790, 248]], { w: 2.4, c: C.sage });
  for (let d = 1; d <= 30; d++) {
    const offs = d + 5, col = offs % 7, row = Math.floor(offs / 7);
    if (d === 28) {
      s.shape(heartPts(gx(col), gy(row) - 14, 52), C.thread, { w: 2.6, hk: -0.12 });
      s.text('28', gx(col), gy(row) - 2, { s: 44, c: '#ffffff' });
      s.text('20/10', gx(col), gy(row) + 44, { s: 26, c: C.thread });
    } else s.text(String(d), gx(col), gy(row), { s: 44 });
  }
  return s.done({ border: 5 });
}

export function countdown(days, h, m, sec, passed) {
  const s = new Sheet(760, 470, 91);
  const p = (n) => String(n).padStart(2, '0');
  s.shape([[22, 20], [740, 12], [746, 446], [16, 456]], C.paper, { poly: true, w: 3.4, hatch: false });
  if (passed) {
    s.text('Hôm nay là ngày vui', 380, 180, { f: F.script, s: 86, c: C.fern });
    s.text('Cảm ơn bạn đã đến chung vui', 380, 280, { s: 50 });
    return s.done({ border: 5 });
  }
  s.text('Chỉ còn', 380, 84, { s: 48, c: C.fern });
  s.text(String(days), 380, 232, { s: 170, c: C.thread });
  s.text('ngày nữa', 380, 298, { s: 54 });
  s.text(`${p(h)} giờ  ${p(m)} phút  ${p(sec)} giây`, 380, 386, { s: 48, c: C.fern });
  return s.done({ border: 5 });
}

export function ringGhost() {
  const s = new Sheet(500, 320, 92);
  s.x.strokeStyle = '#000'; s.x.lineWidth = 34;
  s.x.beginPath(); s.x.arc(180, 160, 110, 0, 7); s.x.stroke();
  s.x.beginPath(); s.x.arc(320, 160, 110, 0, 7); s.x.stroke();
  return s.c;
}

export function wreath() {
  const s = new Sheet(640, 640, 93);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, r = 232;
    const x = 320 + Math.cos(a) * r, y = 320 + Math.sin(a) * r;
    s.at(x, y, 1, (t) => t.shape([[0, 0], [24, -14], [56, -10], [28, 8]], i % 2 ? C.leaf : C.fern, { w: 2.2, gap: 5 }), a + 2.1);
  }
  s.line(blob(320, 320, 232, 232, 20), { closed: true, c: C.fern, w: 3.4 });
  for (const a of [0.5, 2.1, 3.7, 5.3]) petals(s, 320 + Math.cos(a) * 232, 320 + Math.sin(a) * 232, 42, 6, '#ffffff');
  s.text('T', 262, 356, { f: F.script, s: 240, c: C.fern });
  s.text('A', 374, 410, { f: F.script, s: 240, c: C.fern });
  return s.done({ border: 5 });
}

/* ---------- W. Jardin ---------- */

export function vault() {
  const s = new Sheet(1100, 1300, 95);
  const x = s.x;
  s.shape([[0, 1300], [0, 0], [1100, 0], [1100, 1300]], C.emeraldD, { poly: true, w: 0, outline: false, gap: 16, hk: 0.08, ang: 1.1 });
  // Khoét vòm
  const hole = [[90, 1300], [90, 640], [130, 420], [280, 210], [550, 130], [820, 210], [970, 420], [1010, 640], [1010, 1300]];
  const d = s.dense(hole, true);
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath();
  d.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
  x.closePath(); x.fill();
  x.restore();
  s.line(hole, { w: 8, c: C.gold, amp: 1 });
  s.line([[0, 10], [1100, 10]], { w: 7, c: C.gold, amp: 1, poly: true });
  // Gân vòm như tán cọ ở hai góc trên
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const y = 20 + i * 62;
      s.line([[550 + side * 540, y + 230], [550 + side * 480, y + 90], [550 + side * 400 - i * side * 26, y]], { w: 4, c: C.emeraldL, amp: 1.4 });
    }
  }
  return s.done({ border: 0 });
}

export function lights(w = 1500) {
  const s = new Sheet(w, 240, 96);
  const sag = (t) => 40 + Math.sin(t * Math.PI) * 120;
  const pts = Array.from({ length: 9 }, (_, i) => [(i / 8) * w, sag(i / 8)]);
  s.line(pts, { w: 3, c: C.hair, amp: 1 });
  for (let i = 1; i < 14; i++) {
    const t = i / 14, bx = t * w, by = sag(t) + 18;
    s.line([[bx, by - 18], [bx, by]], { w: 2.6, c: C.hair, poly: true });
    s.ellipse(bx, by + 18, 15, 21, '#fff2c4', { w: 2.2, ink: C.goldD, hatch: false });
  }
  return s.done({ border: 0, grained: false });
}

export function glow(col = [255, 226, 150]) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, `rgba(${col},0.9)`);
  g.addColorStop(0.35, `rgba(${col},0.28)`);
  g.addColorStop(1, `rgba(${col},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return c;
}

export function cake() {
  const s = new Sheet(520, 820, 97);
  s.shape([[60, 810], [460, 810], [440, 770], [80, 770]], C.gold, { poly: true, w: 3, gap: 6 });
  [[90, 610, 340, 160], [130, 470, 260, 140], [170, 350, 180, 120], [205, 250, 110, 100]].forEach(([x, y, w, h]) => {
    s.shape([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], '#ffffff', { poly: true, w: 3.2, gap: 12, hk: -0.05 });
    s.line(Array.from({ length: 7 }, (_, i) => [x + (w * i) / 6, y + (i % 2 ? 14 : 2)]), { w: 2.2, c: C.creamD });
  });
  petals(s, 260, 196, 54, 6, '#ffffff');
  petals(s, 150, 606, 42, 6, C.cream);
  petals(s, 360, 466, 40, 6, '#ffffff');
  s.shape([[200, 620], [130, 560], [108, 590], [150, 640]], C.leaf, { w: 2.4, gap: 6 });
  return s.done({ border: 5 });
}

export function burst(seed = 1, col = C.gold) {
  const s = new Sheet(500, 500, 98 + seed);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + s.r() * 0.1, r0 = 50 + s.r() * 40, r1 = 170 + s.r() * 60;
    s.line([[250 + Math.cos(a) * r0, 250 + Math.sin(a) * r0], [250 + Math.cos(a) * r1, 250 + Math.sin(a) * r1]], { c: i % 2 ? col : C.cream, w: 6, poly: true });
    s.dot(250 + Math.cos(a) * (r1 + 16), 250 + Math.sin(a) * (r1 + 16), 6, i % 3 ? C.cream : col);
  }
  return s.done({ border: 0, grained: false });
}

/* ---------- Các câu chữ viết thẳng lên trang vở ---------- */

const wall = (w, h, seed, fn) => {
  const s = new Sheet(w, h, seed);
  fn(s);
  return s.done({ border: 0, grained: false });
};

export const heroText = (guest) => wall(1300, 790, 110, (s) => {
  s.text('Trân trọng kính mời', 650, 92, { s: 62 });
  let y = 196;
  const g = guest || 'Quý khách';
  s.text(g, 650, y, { f: F.script, s: g.length > 22 ? 70 : 96, c: C.fern });
  s.line([[300, y + 34], [1000, y + 28]], { w: 2.4, c: C.sageD });
  y = s.para('tới dự bữa cơm thân mật mừng lễ thành hôn của hai chúng tôi', 650, y + 98, 900, { s: 50 });
  s.text('Viết Trung', 480, y + 122, { f: F.script, s: 196, c: C.fern });
  s.shape(heartPts(640, y + 196, 28), C.thread, { w: 2.6, hk: -0.12 });
  s.text('Bùi Anh', 860, y + 288, { f: F.script, s: 196, c: C.fern });
});

export const handsCaption = () => wall(900, 160, 111, (s) => {
  s.text('Hai người con út, một lời ngoắc tay.', 450, 96, { s: 62 });
});

export const albumText = () => wall(860, 560, 112, (s) => {
  s.text('Có những ngày', 430, 170, { f: F.script, s: 136, c: C.fern });
  s.text('mình muốn giữ', 430, 310, { f: F.script, s: 136, c: C.fern });
  s.text('thật lâu.', 430, 450, { f: F.script, s: 136, c: C.fern });
});

export const seaText = () => wall(980, 460, 113, (s) => {
  s.text('Một khởi đầu mới,', 490, 170, { f: F.script, s: 136, c: C.navy });
  s.text('một đời bên nhau.', 490, 330, { f: F.script, s: 136, c: C.navy });
});

export const riseText = () => wall(960, 420, 114, (s) => {
  s.text('Ngày mình về', 480, 150, { f: F.script, s: 136, c: C.fern });
  s.text('chung một nhà', 480, 300, { f: F.script, s: 136, c: C.fern });
});

export const dateText = () => wall(1100, 470, 115, (s) => {
  s.text('Thứ Bảy, 28.11.2026', 550, 126, { f: F.script, s: 118, c: C.fern });
  s.text('18 giờ 00', 550, 240, { s: 84 });
  s.text('Tức ngày 20 tháng 10 năm Bính Ngọ', 550, 330, { s: 54, c: C.fern });
});

export const venueText = () => wall(1040, 800, 116, (s) => {
  s.text('Nơi chúng mình đón bạn', 520, 76, { s: 66, c: C.cream });
  s.text('W. Jardin', 520, 276, { f: F.script, s: 240, c: '#ffe9b0' });
  s.text('Trung tâm tiệc cưới', 520, 402, { s: 60, c: C.cream });
  s.text('Số 307 Nguyễn Văn Linh, phường Kênh Dương', 520, 474, { s: 60, c: C.cream });
  s.text('thành phố Hải Phòng', 520, 542, { s: 60, c: C.cream });
  s.para('Một buổi tối dưới vòm cây, giữa hoa trắng và những người thương.', 520, 650, 920, { s: 56, c: '#d9e6dc' });
});

export const thanksText = () => wall(1000, 700, 117, (s) => {
  s.text('Cảm ơn vì đã cùng', 500, 130, { f: F.script, s: 128, c: '#ffe9b0' });
  s.text('chúng mình chung vui', 500, 270, { f: F.script, s: 128, c: '#ffe9b0' });
  const y = s.para('Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.', 500, 390, 860, { s: 54, c: C.cream });
  s.text('Rất hân hạnh được đón tiếp!', 500, y + 44, { s: 58, c: C.blush });
});

/* ---------- Khung ảnh thật: giữ nguyên toàn khung, không cắt mặt ---------- */

export function print(img, { mat = 26, foot = 74, seed = 1, tone = '#ffffff', peg = true } = {}) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const W = 760, H0 = (W - mat * 2) * (ih / iw);
  const top = peg ? 54 : 18;
  const s = new Sheet(W + 40, H0 + mat + foot + top + 20, 130 + seed, 1);
  const L = 20, T = top, W2 = W, H2 = H0 + mat + foot;
  s.shape([[L, T], [L + W2, T], [L + W2, T + H2], [L, T + H2]], tone, { poly: true, w: 2.6, hatch: false, amp: 0.8, ink: 'rgba(47,43,51,.55)' });
  s.x.drawImage(img, L + mat, T + mat, W - mat * 2, H0);
  s.line([[L + mat, T + mat], [L + W - mat, T + mat], [L + W - mat, T + mat + H0], [L + mat, T + mat + H0], [L + mat, T + mat]], { poly: true, w: 1.8, c: 'rgba(47,43,51,.4)', amp: 0.5 });
  s.shape(heartPts(L + W - mat - 16, T + H2 - foot / 2, 14), C.thread, { w: 0, outline: false, hatch: false });
  if (peg) {
    const cx = L + W / 2;
    s.shape([[cx - 15, 2], [cx + 15, 2], [cx + 13, 92], [cx - 13, 92]], C.wood, { poly: true, w: 2.6, gap: 5, ang: 1.5 });
    s.line([[cx - 12, 44], [cx + 12, 44]], { w: 2.4, poly: true });
  }
  return s.done({ border: 0, grained: false });
}

export function pole() {
  const s = new Sheet(80, 1100, 140);
  s.shape([[30, 8], [50, 8], [52, 1092], [28, 1092]], C.wood, { poly: true, w: 3, gap: 5, ang: 1.5 });
  return s.done({ border: 0 });
}

export function clothesline(w = 3000) {
  const s = new Sheet(w, 110, 141, 0.6);
  const pts = Array.from({ length: 13 }, (_, i) => [(i / 12) * w, 26 + Math.sin((i / 12) * Math.PI) * 50]);
  s.line(pts, { w: 3.4, amp: 1.5 });
  return s.done({ border: 0, grained: false });
}

export function stick() {
  const s = new Sheet(32, 512, 142, 1);
  s.x.fillStyle = C.wood; s.x.fillRect(5, 0, 22, 512);
  s.x.fillStyle = C.woodD; s.x.fillRect(5, 0, 4, 512);
  s.x.fillStyle = C.ink; s.x.fillRect(2, 0, 3, 512); s.x.fillRect(27, 0, 3, 512);
  return s.c;
}

export function heartSprite() {
  const s = new Sheet(120, 120, 143, 1);
  s.shape(heartPts(60, 60, 40), C.coral, { w: 3, gap: 5, hk: -0.14 });
  return s.done({ border: 3 });
}

export function petalSprite(col = C.blush) {
  const s = new Sheet(96, 96, 144, 1);
  s.shape([[48, 6], [76, 30], [70, 72], [48, 90], [26, 70], [20, 30]], col, { w: 1.8, gap: 5, ink: 'rgba(47,43,51,.55)', hk: -0.1 });
  return s.done({ border: 0 });
}

export function puff() {
  const s = new Sheet(96, 96, 145, 1);
  s.shape(blob(48, 48, 34, 32, 9, 0.22, s.r), C.paper, { w: 2.4, hatch: false });
  return s.c;
}

export { shade };
