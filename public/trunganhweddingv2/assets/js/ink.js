// Bộ vẽ tay: mọi hình trong thiệp được vẽ bằng canvas lúc tải trang,
// nên không cần tệp ảnh cho hình vẽ. Đường nét có độ rung và độ dày thay đổi,
// phần tô có nét chì màu, và mỗi hình có viền giấy trắng như được cắt bằng kéo.

export const small = Math.min(screen.width, screen.height) < 700;
export const Q = small ? 0.72 : 1;

export const C = {
  ink: '#2f2b33', paper: '#fdfbf5', white: '#fffefa',
  sage: '#b7cdb0', sageL: '#d5e3cd', sageD: '#7f9f7c', leaf: '#6f9470', fern: '#5a8062',
  blush: '#f2cdc4', rose: '#dd8f8d', coral: '#cf6a60', thread: '#c8453f',
  cream: '#f6ecd4', creamD: '#e8d8b4', gold: '#d8b25c', goldD: '#b48f3f',
  sky: '#c6dcea', sea: '#9cc3d8', seaD: '#6f9fbd', navy: '#2b3553', navyL: '#46527a',
  grey: '#a7adb6', stone: '#b9bcb4', stoneD: '#8d9288',
  wood: '#cfa478', woodD: '#a87a4f', skin: '#f7dcc8', hair: '#2b2627',
  emerald: '#0f6b5c', emeraldD: '#0a4d43', emeraldL: '#1c8a76',
};
export const F = { hand: '"Patrick Hand"', script: '"Great Vibes"' };

function mulberry(a) {
  return () => {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const tblR = mulberry(77);
const tbl = Array.from({ length: 512 }, () => tblR() * 2 - 1);
const noise = (x) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return tbl[i & 511] * (1 - u) + tbl[(i + 1) & 511] * u;
};

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const d = x.createImageData(256, 256);
  const r = mulberry(5);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = r();
    const dark = v < 0.5;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = dark ? 60 : 255;
    d.data[i + 3] = Math.pow(Math.abs(v - 0.5) * 2, 3) * 26;
  }
  x.putImageData(d, 0, 0);
  return (grainCanvas = c);
}

export function blob(cx, cy, rx, ry = rx, n = 14, jit = 0, r = Math.random) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * jit;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return p;
}

export const heartPts = (cx, cy, s) => [
  [0, 0.86], [-0.46, 0.34], [-0.8, -0.12], [-0.62, -0.58], [-0.22, -0.6], [0, -0.26],
  [0.22, -0.6], [0.62, -0.58], [0.8, -0.12], [0.46, 0.34],
].map(([x, y]) => [cx + x * s, cy + y * s]);

export class Sheet {
  constructor(w, h, seed = 1, q = Q) {
    this.w = w; this.h = h; this.q = q;
    this.c = document.createElement('canvas');
    this.c.width = Math.ceil(w * q);
    this.c.height = Math.ceil(h * q);
    this.x = this.c.getContext('2d');
    this.x.scale(q, q);
    this.x.lineCap = 'round';
    this.x.lineJoin = 'round';
    this.r = mulberry(seed * 2654435761);
  }

  dense(pts, closed, poly) {
    const out = [];
    const n = pts.length;
    if (poly) {
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5));
        for (let k = 0; k < steps; k++) out.push([a[0] + (b[0] - a[0]) * k / steps, a[1] + (b[1] - a[1]) * k / steps]);
      }
      if (!closed) out.push(pts[n - 1]);
      return out;
    }
    const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const steps = Math.max(3, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4.5));
      for (let k = 0; k < steps; k++) {
        const t = k / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }

  wob(d, amp = 1.3, wl = 42) {
    const o = this.r() * 200;
    let L = 0;
    return d.map((p, i) => {
      if (i) L += Math.hypot(p[0] - d[i - 1][0], p[1] - d[i - 1][1]);
      return [p[0] + noise(L / wl + o) * amp, p[1] + noise(L / wl + o + 57) * amp];
    });
  }

  trace(d, w, color) {
    const x = this.x, o = this.r() * 200;
    x.strokeStyle = color;
    let L = 0;
    for (let i = 1; i < d.length; i++) {
      const a = d[i - 1], b = d[i];
      L += Math.hypot(b[0] - a[0], b[1] - a[1]);
      x.lineWidth = w * (0.8 + 0.3 * (noise(L / 55 + o) + 1) * 0.8);
      x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
    }
  }

  // Một đường viền bút mực
  line(pts, { w = 3.4, c = C.ink, closed = false, poly = false, amp = 1.3 } = {}) {
    let d = this.wob(this.dense(pts, closed, poly), amp);
    if (closed) d = d.concat([d[0]]);
    this.trace(d, w, c);
  }

  // Tô chì màu rồi viền mực
  shape(pts, fill, { w = 3.4, ink = C.ink, poly = false, hatch = true, ang = -0.95, gap = 8, amp = 1.3, outline = true, hk = -0.14 } = {}) {
    const x = this.x;
    const d = this.dense(pts, true, poly);
    const df = this.wob(d, amp * 0.8);
    const path = new Path2D();
    df.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
    path.closePath();
    if (fill) {
      x.fillStyle = fill;
      x.fill(path);
      if (hatch) this.hatch(path, df, fill, ang, gap, hk);
    }
    if (outline && w > 0) {
      const dl = this.wob(d, amp);
      this.trace(dl.concat([dl[0]]), w, ink);
    }
  }

  hatch(path, d, fill, ang, gap, hk) {
    const x = this.x;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of d) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    x.save();
    x.clip(path);
    x.strokeStyle = shade(fill.startsWith('#') ? fill : C.paper, hk);
    x.globalAlpha = 0.34;
    x.lineWidth = gap * 0.42;
    x.beginPath();
    for (let t = -R; t < R; t += gap * (0.8 + this.r() * 0.5)) {
      const j = (this.r() - 0.5) * 3;
      const a = [cx - sa * t + ca * -R, cy + ca * t + sa * -R];
      const b = [cx - sa * t + ca * R + j, cy + ca * t + sa * R + j];
      x.moveTo(a[0], a[1]);
      x.quadraticCurveTo((a[0] + b[0]) / 2 + j * 2, (a[1] + b[1]) / 2 - j * 2, b[0], b[1]);
    }
    x.stroke();
    x.restore();
  }

  circle(cx, cy, r, fill, o = {}) { this.shape(blob(cx, cy, r, r, Math.max(8, Math.round(r / 3)), 0, this.r), fill, o); }
  ellipse(cx, cy, rx, ry, fill, o = {}) { this.shape(blob(cx, cy, rx, ry, 12, 0, this.r), fill, o); }

  dot(cx, cy, r, c = C.ink) {
    const x = this.x;
    x.fillStyle = c;
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  }

  soft(cx, cy, rx, ry, c, a = 0.4) {
    const x = this.x;
    x.save(); x.globalAlpha = a; x.fillStyle = c;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); x.restore();
  }

  at(px, py, k, fn, rot = 0) {
    const x = this.x;
    x.save(); x.translate(px, py); x.rotate(rot); x.scale(k, k);
    fn(this);
    x.restore();
  }

  text(str, px, py, { f = F.hand, s = 36, c = C.ink, a = 'center', rot = 0, base = 'alphabetic' } = {}) {
    const x = this.x;
    x.save();
    x.translate(px, py); x.rotate(rot);
    x.font = `${s}px ${f}`;
    x.fillStyle = c; x.textAlign = a; x.textBaseline = base;
    x.fillText(str, 0, 0);
    x.restore();
  }

  // Tự xuống dòng theo chiều rộng, trả về y kế tiếp
  para(str, px, py, maxW, o = {}) {
    const s = o.s || 36, lh = o.lh || s * 1.28;
    const x = this.x;
    x.font = `${s}px ${o.f || F.hand}`;
    const words = str.split(' ');
    let line = '', y = py;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (x.measureText(test).width > maxW && line) { this.text(line, px, y, o); y += lh; line = w; } else line = test;
    }
    if (line) { this.text(line, px, y, o); y += lh; }
    return y;
  }

  // Thêm viền giấy và thớ giấy; trả về canvas cuối
  done({ border = 7, tone = C.white, grained = true } = {}) {
    let out = this.c;
    if (border > 0) {
      const t = document.createElement('canvas');
      t.width = out.width; t.height = out.height;
      const x = t.getContext('2d');
      const b = border * this.q;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.drawImage(out, Math.cos(a) * b, Math.sin(a) * b);
      }
      x.drawImage(out, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = tone;
      x.fillRect(0, 0, t.width, t.height);
      x.globalCompositeOperation = 'source-over';
      x.drawImage(out, 0, 0);
      out.width = out.height = 1;
      out = t;
    }
    if (grained) {
      const x = out.getContext('2d');
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = x.createPattern(grain(), 'repeat');
      x.fillRect(0, 0, out.width, out.height);
      x.globalCompositeOperation = 'source-over';
    }
    return out;
  }
}

// Bản giấy lặp lại dùng cho tường và nền
export function tile(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  paint(x, w, h);
  x.fillStyle = x.createPattern(grain(), 'repeat');
  x.fillRect(0, 0, w, h);
  return c;
}
