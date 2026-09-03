/**
 * A document-wide thermal pixel field, rather than loose spring particles.
 * The hero, cursor trails, contextual shapes and shockwaves share one heat grid.
 * All marks stay locked to the same 9px document grid as the page scrolls.
 */
const COLORS = ['#1c2541', '#3b5bd9', '#f5c518', '#e0492a', '#d8ff00'];
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const hash = (x, y = 0) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + 27.4) * 43758.5453;
  return value - Math.floor(value);
};
const band = value => value < .25 ? -1 : value < .43 ? 0 : value < .59 ? 1 : value < .75 ? 2 : value < .89 ? 3 : value < 1.08 ? 4 : 3;

class HeatGrid {
  constructor(width, height, cell) {
    this.cell = cell;
    this.cols = Math.ceil(width / cell) + 1;
    this.rows = Math.ceil(height / cell) + 2;
    this.values = new Float32Array(this.cols * this.rows);
  }
  deposit(x, y, strength, radius) {
    const cell = this.cell, cx = x / cell, cy = y / cell;
    const sigma = radius / cell;
    const reach = Math.ceil(sigma * 2.5);
    const left = Math.max(0, Math.floor(cx - reach));
    const right = Math.min(this.cols - 1, Math.ceil(cx + reach));
    const top = Math.max(0, Math.floor(cy - reach));
    const bottom = Math.min(this.rows - 1, Math.ceil(cy + reach));
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const distance = (col + .5 - cx) ** 2 + (row + .5 - cy) ** 2;
        const amount = Math.exp(-distance / (2 * sigma * sigma)) * strength;
        if (amount < .008) continue;
        const i = row * this.cols + col;
        this.values[i] = Math.min(1.5, this.values[i] + amount);
      }
    }
  }
  set(col, row, value) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    const i = row * this.cols + col;
    this.values[i] = Math.max(this.values[i], value);
  }
  sample(x, y) {
    const col = Math.floor(x / this.cell), row = Math.floor(y / this.cell);
    return col < 0 || row < 0 || col >= this.cols || row >= this.rows ? 0 : this.values[row * this.cols + col];
  }
  decay(dt) {
    const factor = Math.exp(-7.8 * dt);
    for (let i = 0; i < this.values.length; i++) {
      const value = this.values[i] * factor;
      this.values[i] = value < .008 ? 0 : value;
    }
  }
}

export function createPixelField(canvas, toggle) {
  const ctx = canvas.getContext('2d');
  if (!ctx) { toggle.hidden = true; return () => {}; }
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const overlay = document.createElement('canvas');
  overlay.id = 'pixel-cursor-field';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const fx = overlay.getContext('2d');
  if (!fx) { overlay.remove(); toggle.hidden = true; return () => {}; }
  const sampler = document.createElement('canvas');
  const sampleCtx = sampler.getContext('2d', { willReadFrequently: true });
  const sampleCache = new WeakMap();
  const pointer = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, present: false, moved: false, lastMove: 0, target: null };
  const sparks = [], waves = [];
  let width = 0, height = 0, heroWidth = 0, heroHeight = 0, cell = 9, field;
  let frame = 0, lastFrame = 0, simTime = 0, paused = reduced.matches, destroyed = false;
  let heroVisible = true, heroRect, heroCells = [], layoutsDirty = true;
  let safeRects = [], mediaRects = [], headingRects = [], aboutRect, contactRect, textMask;
  let controlTarget = null, controlStrength = 0, keyboardMode = false;
  const controlPulses = [];
  let idle = null, charging = null, zone = 'none', previousScroll = scrollY;
  let scrollOffset = scrollY % cell, hoverImage = null, hoverStrength = 0;
  const smile = { x: 0, y: 0, strength: 0 };

  const on = (target, event, callback, options = {}) => target.addEventListener(event, callback, { ...options, signal });
  const snap = value => Math.floor(value / cell) * cell;
  const contains = (r, x, y, pad = 0) => r && x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  const controlSelector = 'a,button,summary';
  const eligibleControl = target => {
    const el = target instanceof Element ? target.closest(controlSelector) : null;
    return el && !el.matches(':disabled,.project-open,.skip-link') && !el.closest('dialog') ? el : null;
  };

  function measureText() {
    // Measure rendered text lines, never full-width layout containers.
    const rects = [], range = document.createRange();
    const walker = document.createTreeWalker(document.querySelector('#app'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest('svg,script,style,dialog,[aria-hidden="true"],.sr-only,.skip-link')) continue;
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width && r.height && r.bottom > -50 && r.top < height + 50) rects.push(r);
      }
    }
    return rects;
  }

  function buildTextMask() {
    // Cache a soft opacity field. Pixel colour stays continuous beneath text,
    // with full intensity returning gradually outside the actual line of type.
    textMask = new Float32Array(field.values.length).fill(1);
    const feather = cell * 3.5;
    for (const r of safeRects) {
      const left = Math.max(0, Math.floor((r.left - feather) / cell));
      const right = Math.min(field.cols - 1, Math.ceil((r.right + feather) / cell));
      const top = Math.max(0, Math.floor((r.top - feather + scrollOffset) / cell));
      const bottom = Math.min(field.rows - 1, Math.ceil((r.bottom + feather + scrollOffset) / cell));
      for (let row = top; row <= bottom; row++) for (let col = left; col <= right; col++) {
        const x = (col + .5) * cell, y = (row + .5) * cell - scrollOffset;
        const distance = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
        const t = clamp(distance / feather), opacity = .12 + .88 * t * t * (3 - 2 * t);
        const i = row * field.cols + col;
        textMask[i] = Math.min(textMask[i], opacity);
      }
    }
  }

  function measure() {
    heroRect = canvas.getBoundingClientRect();
    const visible = el => {
      const r = el.getBoundingClientRect();
      return r.width && r.height && r.bottom > -100 && r.top < height + 100 ? r : null;
    };
    safeRects = measureText();
    buildTextMask();
    mediaRects = [...document.querySelectorAll('.project-image')].map(visible).filter(Boolean);
    headingRects = [...document.querySelectorAll('h1,h2')].map(visible).filter(Boolean);
    aboutRect = document.querySelector('#about')?.getBoundingClientRect();
    contactRect = document.querySelector('#contact')?.getBoundingClientRect();
    layoutsDirty = false;
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    // Match the canvas's CSS box, which excludes the page scrollbar. Using
    // innerWidth here would scale every overlay coordinate toward the left.
    const overlayRect = overlay.getBoundingClientRect();
    width = overlayRect.width; height = overlayRect.height;
    cell = width < 600 ? 7 : 9;
    scrollOffset = scrollY % cell;
    field = new HeatGrid(width, height, cell);
    overlay.width = Math.round(width * ratio); overlay.height = Math.round(height * ratio);
    fx.setTransform(ratio, 0, 0, ratio, 0, 0);
    heroWidth = canvas.clientWidth; heroHeight = canvas.clientHeight;
    canvas.width = Math.round(heroWidth * ratio); canvas.height = Math.round(heroHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    heroCells = [];
    // Store the slowly varying shape and randomness once; colour contours move independently.
    for (let y = 0; y < heroHeight; y += cell) {
      for (let x = 0; x < heroWidth; x += cell) {
        const u = x / heroWidth, v = y / heroHeight;
        const center = .43 + Math.sin(u * TAU - .7) * .11;
        const ragged = (hash(Math.floor(x / cell / 2), Math.floor(y / cell / 3)) - .5) * .14;
        const radius = .31 + Math.sin(u * 11 + .8) * .055 + ragged;
        const edge = 1 - Math.abs(v - center) / radius;
        const present = !(edge < -.11 || (edge < .12 && hash(x, y) > clamp((edge + .11) / .23)));
        heroCells.push({ x, y, u, v, random: hash(x + 1, y + 7), edge, present });
      }
    }
    hoverImage = null; smile.x = heroWidth / 2; smile.y = heroHeight / 2; smile.strength = 0;
    layoutsDirty = true; measure(); drawHero();
    schedule();
  }

  function thermal(u, v) {
    // Domain-warped waves create coherent moving islands, with sharp heat bands.
    const t = simTime * .2;
    const wx = u * 5.8 + .43 * Math.sin(v * 4.6 + t * .85);
    const wy = v * 3.5 + .34 * Math.cos(u * 6.3 - t * .72);
    return .51 + .14 * Math.sin(wx + t) * Math.cos(wy - t * .4)
      + .14 * Math.sin(wx * 1.3 + wy * 1.6 - t * .8)
      + .085 * Math.cos(wy * 2.1 - wx * .6 + t * .5);
  }

  // A smile is a new state of the existing grid, not a separate illustration.
  // The same cells and palette dissolve out of the ribbon and resolve into its face.
  function smileColor(nx, ny, blink, surprised = false) {
    const distance = Math.hypot(nx, ny);
    if (distance > 1) return -1;
    if (distance > .91) return 1;
    const eyes = blink
      ? Math.abs(ny + .25) < .04 && (Math.abs(nx - .29) < .12 || Math.abs(nx + .29) < .12)
      : ((nx - .29) / .065) ** 2 + ((ny + .25) / .17) ** 2 < 1 || ((nx + .29) / .065) ** 2 + ((ny + .25) / .17) ** 2 < 1;
    const mouth = surprised
      ? Math.abs(Math.hypot(nx, (ny - .30) * .8) - .17) < .045
      : ny > .13 && Math.abs(Math.hypot(nx, ny + .07) - .60) < .043;
    if (eyes || mouth) return 0;
    return band(.76 + Math.sin(nx * 3 + ny * 4 + simTime * .7) * .15);
  }

  function stampSmile(x, y, radius = cell * 7) {
    const blink = simTime % 4.8 > 4.62;
    const cx = Math.floor(x / cell), cy = Math.floor((y + scrollOffset) / cell), reach = Math.ceil(radius / cell);
    for (let row = -reach; row <= reach; row++) for (let col = -reach; col <= reach; col++) {
      const color = smileColor(col * cell / radius, row * cell / radius, blink);
      if (color < 0 || cx + col < 0 || cy + row < 0 || cx + col >= field.cols || cy + row >= field.rows) continue;
      // Exact heat bands keep the eyes crisp while the older cells behind it decay naturally.
      field.values[(cy + row) * field.cols + cx + col] = [.34,.50,.68,.81,.97][color];
    }
  }

  function drawHero() {
    if (!heroRect) return;
    ctx.clearRect(0, 0, heroWidth, heroHeight);
    const radius = Math.min(heroHeight * .32, 120);
    const blink = simTime % 4.8 > 4.62;
    for (const p of heroCells) {
      const nx = (p.x - smile.x) / radius, ny = (p.y - smile.y) / radius;
      const distance = Math.hypot(nx, ny);
      // Ordered dissolution also makes room for the face in previously empty parts of the ribbon.
      const influence = clamp((1.32 - distance) / .22) * smile.strength;
      let color;
      if (influence > p.random) {
        color = smileColor(nx, ny, blink, !!charging);
      } else {
        if (!p.present) continue;
        let value = thermal(p.u, p.v) + (p.random - .5) * .09;
        const absoluteY = heroRect.top + p.y;
        if (absoluteY > -cell && absoluteY < height + cell) value += field.sample(heroRect.left + p.x, absoluteY + scrollOffset) * .85;
        color = band(value);
      }
      if (color < 0) continue;
      ctx.fillStyle = COLORS[color];
      ctx.fillRect(p.x, p.y, cell - 1, cell - 1);
    }
  }

  function stamp(x, y, value, radius) { field.deposit(x, y + scrollOffset, value, radius); }
  function stroke(x0, y0, x1, y1, value, radius) {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(length / (cell * .7)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, value, radius);
    }
  }

  function arrow(x, y, angle) {
    const length = cell * 9, tipX = x + Math.cos(angle) * length, tipY = y + Math.sin(angle) * length;
    stroke(x, y, tipX, tipY, .61, cell * .45);
    for (const sign of [-1, 1]) {
      const back = angle + Math.PI + sign * .66;
      stroke(tipX, tipY, tipX + Math.cos(back) * cell * 4, tipY + Math.sin(back) * cell * 4, .7, cell * .45);
    }
  }

  const heart = ['01100110', '11111111', '11111111', '01111110', '00111100', '00011000'];
  const envelope = ['11111111111', '11000000011', '10100000101', '10010001001', '10001110001', '10000000001', '11111111111'];
  function icon(pattern, x, y, scale = 1, value = 1) {
    const col0 = Math.round(x / cell - pattern[0].length * scale / 2);
    const row0 = Math.round((y + scrollOffset) / cell - pattern.length * scale / 2);
    pattern.forEach((row, j) => [...row].forEach((pixel, i) => {
      if (pixel === '0') return;
      for (let yy = 0; yy < scale; yy++) for (let xx = 0; xx < scale; xx++) {
        const shimmer = .045 * Math.sin(i + j - simTime * 5);
        field.set(col0 + i * scale + xx, row0 + j * scale + yy, value + shimmer);
      }
    }));
  }

  function burst(x, y, power = 1) {
    waves.push({ x, y, age: 0, power });
    if (waves.length > 4) waves.shift();
    stamp(x, y, .9, cell * (3 + power * 3));
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU;
      const speed = 90 + hash(i, x) * 150 * power;
      sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .8 });
    }
  }

  function wander(dt) {
    if (!idle) idle = { x: pointer.x, y: pointer.y, direction: pointer.x > width / 2 ? -1 : 1, age: 0 };
    idle.age += dt;
    idle.x += idle.direction * 145 * dt;
    const radius = cell * 3.7;
    if (idle.x < -radius * 2 || idle.x > width + radius * 2) {
      // One quiet pass, then stop. A new pointer event restarts normal interaction.
      return;
    }
    const head = idle.direction > 0 ? 0 : Math.PI;
    const mouth = .08 + .55 * Math.abs(Math.sin(idle.age * 9));
    const col = Math.round(idle.x / cell), row = Math.round((idle.y + scrollOffset) / cell);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
      if (Math.hypot(x, y) > 3.7) continue;
      const a = Math.atan2(y, x);
      const diff = Math.abs(Math.atan2(Math.sin(a - head), Math.cos(a - head)));
      if (diff > mouth) field.set(col + x, row + y, .68);
    }
    for (let n = 0; n < Math.ceil(width / (cell * 5)); n++) {
      const x = n * cell * 5;
      if ((x - idle.x) * idle.direction > radius) field.set(Math.round(x / cell), row, .67);
    }
  }

  function pointerShape(dt, now) {
    if (!pointer.present || !fine.matches || document.querySelector('dialog[open]')) return;
    const x = pointer.x, y = pointer.y;
    const target = pointer.target;
    const image = target?.closest?.('.project-open')?.querySelector('.project-image');
    hoverImage = image || null;
    let nearest = null, closest = Infinity;
    for (const rect of headingRects) {
      // Only point from the whitespace around a title; never draw over the title itself.
      if (!contains(rect, x, y, 130) || contains(rect, x, y, 5)) continue;
      const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      if (distance < closest) { closest = distance; nearest = rect; }
    }
    if (charging) {
      const power = clamp((now - charging.start) / 1800);
      stamp(charging.x, charging.y, .36 + power * .3, cell * (4 + power * 10));
      return;
    }
    if (hoverImage || target?.closest?.('button,a,summary')) {
      zone = 'interactive';
    } else if (now - pointer.lastMove > 2300) {
      zone = 'idle'; stampSmile(x, y + Math.sin(simTime * 2) * cell * .4);
    } else if (nearest) {
      zone = 'heading';
      stampSmile(x, y);
    } else if (contains(aboutRect, x, y)) {
      if (zone !== 'heart') {
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU;
          sparks.push({ x, y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, life: .5 });
        }
      }
      zone = 'heart'; stampSmile(x, y, cell * 7);
    } else if (contains(contactRect, x, y)) {
      zone = 'contact'; icon(envelope, x, y, 1, 1);
    } else {
      zone = 'trail';
      const inHero = contains(heroRect, x, y);
      const radius = cell * (inHero ? 3.8 : 2.2);
      if (pointer.moved && pointer.prevX > -500) stroke(pointer.prevX, pointer.prevY, x, y, .19, radius);
      else stamp(x, y, .22 * dt * 60, radius);
    }
    pointer.prevX = x; pointer.prevY = y; pointer.moved = false;
  }

  function drawWaves(dt) {
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i]; wave.age += dt;
      if (wave.age > 1.4) { waves.splice(i, 1); continue; }
      const radius = wave.age * Math.hypot(width, height) * .9;
      const thickness = cell * (2 + wave.power * 2);
      const strength = (1 - wave.age / 1.4) * (.8 + wave.power * .4);
      const top = Math.max(0, Math.floor((wave.y - radius - thickness * 3 + scrollOffset) / cell));
      const bottom = Math.min(field.rows - 1, Math.ceil((wave.y + radius + thickness * 3 + scrollOffset) / cell));
      for (let row = top; row <= bottom; row++) for (let col = 0; col < field.cols; col++) {
        const distance = Math.hypot((col + .5) * cell - wave.x, (row + .5) * cell - scrollOffset - wave.y);
        const d = Math.abs(distance - radius) / thickness;
        if (d > 2.4) continue;
        field.set(col, row, strength * Math.exp(-d * d * .7));
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life -= dt;
      if (p.life < 0) { sparks.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.exp(-2.5 * dt); p.vy *= Math.exp(-2.5 * dt);
      stamp(p.x, p.y, p.life * .7, cell * .65);
    }
  }

  function imagePixels(host) {
    const image = host.querySelector('img');
    if (!image?.complete || !image.naturalWidth || !sampleCtx) return null;
    const rect = host.getBoundingClientRect();
    const block = 14, cols = Math.ceil(rect.width / block), rows = Math.ceil(rect.height / block);
    const cached = sampleCache.get(image);
    if (cached?.cols === cols && cached?.rows === rows) return { ...cached, rect };
    sampler.width = cols; sampler.height = rows;
    const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const cropWidth = rect.width / scale, cropHeight = rect.height / scale;
    try {
      sampleCtx.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, cols, rows);
      const data = sampleCtx.getImageData(0, 0, cols, rows).data;
      const result = { data, cols, rows, block };
      sampleCache.set(image, result);
      return { ...result, rect };
    } catch { return null; }
  }

  function drawImageHover(dt) {
    hoverStrength += ((hoverImage ? 1 : 0) - hoverStrength) * Math.min(1, dt * 10);
    if (!hoverImage || hoverStrength < .01) return;
    const sample = imagePixels(hoverImage);
    if (!sample) return;
    const { rect, cols, rows, data, block } = sample;
    const reach = Math.min(cols, rows) * .39 * hoverStrength;
    const tick = Math.floor(simTime * 11);
    // Keep the corner breakup inside the image, including the last partial grid cells.
    const tileWidth = rect.width / cols, tileHeight = rect.height / rows;
    fx.save();
    fx.beginPath(); fx.rect(rect.left, rect.top, rect.width, rect.height); fx.clip();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = Math.min(x, cols - 1 - x), dy = Math.min(y, rows - 1 - y);
      const falloff = 1 - Math.hypot(dx, dy) / reach;
      if (falloff <= 0 || hash(x + tick * .31, y) > falloff * falloff * .9) continue;
      const px = rect.left + x * tileWidth, py = rect.top + y * tileHeight;
      const index = (y * cols + x) * 4;
      fx.fillStyle = '#f8f9f6';
      fx.fillRect(px, py, tileWidth, tileHeight);
      fx.fillStyle = `rgb(${data[index]} ${data[index + 1]} ${data[index + 2]})`;
      const shift = hash(x, y + tick) > .72 ? block * hoverStrength : 0;
      fx.fillRect(px + (x < cols / 2 ? -shift : shift), py + (y < rows / 2 ? -shift : shift), tileWidth - 1, tileHeight - 1);
    }
    fx.restore();
    // Share the element-relative border geometry used by buttons.
    pixelFrame(rect, hoverStrength, 0, simTime * 1.6, true);
  }

  function pixelFrame(rect, strength, expansion = 0, phase = simTime * 1.6, thermal = false) {
    // Center pixels on the element's real border, independently of the page grid.
    // Evenly distribute each edge so fractional sizes and scrolling cannot leave an overhang.
    const size = cell - 2;
    const left = rect.left - expansion - size / 2, right = rect.right + expansion - size / 2;
    const top = rect.top - expansion - size / 2, bottom = rect.bottom + expansion - size / 2;
    const cols = Math.max(1, Math.ceil((right - left) / cell));
    const rows = Math.max(1, Math.ceil((bottom - top) / cell));
    const stepX = (right - left) / cols, stepY = (bottom - top) / rows;
    const length = 2 * (cols + rows);
    for (let i = 0; i < length; i++) {
      let x, y;
      if (i < cols) { x = left + i * stepX; y = top; }
      else if (i < cols + rows) { x = right; y = top + (i - cols) * stepY; }
      else if (i < 2 * cols + rows) { x = right - (i - cols - rows) * stepX; y = bottom; }
      else { x = left; y = bottom - (i - 2 * cols - rows) * stepY; }
      const flow = (i / length - phase % 1 + 1) % 1;
      const travelling = Math.max(0, 1 - Math.min(flow, 1 - flow) / .14);
      const corner = Math.min(i % (cols + rows), Math.abs(i % (cols + rows) - cols)) < 2;
      fx.globalAlpha = strength * (thermal ? 1 : corner ? .9 : .12 + travelling * .88);
      fx.fillStyle = thermal
        ? COLORS[Math.floor((Math.sin((x + y) / 50 - simTime * 4) + 1) * 2.4)]
        : COLORS[(Math.floor(i / 3 + phase * 4) % COLORS.length + COLORS.length) % COLORS.length];
      fx.fillRect(x, y, size, size);
    }
    fx.globalAlpha = 1;
  }

  function drawControls(dt) {
    const headerBottom = document.querySelector('.header')?.getBoundingClientRect().bottom || 0;
    const draw = (el, strength, expansion = 0, phase) => {
      fx.save();
      if (!el.closest('.header')) {
        fx.beginPath(); fx.rect(0, headerBottom, width, Math.max(0, height - headerBottom)); fx.clip();
      }
      pixelFrame(el.getBoundingClientRect(), strength, expansion, phase);
      fx.restore();
    };
    const focused = keyboardMode && document.activeElement?.matches(':focus-visible') ? eligibleControl(document.activeElement) : null;
    const hovered = pointer.present && fine.matches ? eligibleControl(pointer.target) : null;
    const next = focused || hovered;
    if (next !== controlTarget && next) { controlTarget = next; controlStrength = 0; }
    controlStrength += ((next ? 1 : 0) - controlStrength) * Math.min(1, dt * 14);
    if (controlTarget?.isConnected && controlStrength > .015) draw(controlTarget, controlStrength);
    else if (!next) controlTarget = null;
    for (let i = controlPulses.length - 1; i >= 0; i--) {
      const pulse = controlPulses[i]; pulse.age += dt;
      if (pulse.age > .48 || !pulse.el.isConnected) { controlPulses.splice(i, 1); continue; }
      const t = pulse.age / .48;
      draw(pulse.el, (1 - t) ** 2, cell * 3.5 * (1 - (1 - t) ** 3), pulse.phase);
    }
  }

  function drawOverlay(dt) {
    fx.clearRect(0, 0, width, height);
    for (let row = 0; row < field.rows; row++) for (let col = 0; col < field.cols; col++) {
      const color = band(field.values[row * field.cols + col]);
      if (color < 0) continue;
      fx.globalAlpha = textMask[row * field.cols + col];
      fx.fillStyle = COLORS[color];
      fx.fillRect(col * cell, row * cell - scrollOffset, cell - 1, cell - 1);
    }
    fx.globalAlpha = 1;
    // Keep image artwork and the separate hero canvas intact. Text uses the soft mask.
    for (const rect of [...mediaRects, heroRect]) {
      if (!rect) continue;
      fx.clearRect(rect.left - 2, rect.top - 2, rect.width + 4, rect.height + 4);
    }
    drawImageHover(dt);
    const headerRect = document.querySelector('.header')?.getBoundingClientRect();
    if (headerRect) fx.clearRect(0, 0, width, headerRect.bottom);
    drawControls(dt);
  }

  function animate(now) {
    frame = 0;
    if (paused || document.hidden || destroyed) return;
    // Limit to 60fps even on 120/144Hz displays. The simulation is time-based.
    const elapsed = now - lastFrame;
    if (elapsed < 15) { schedule(); return; }
    const dt = lastFrame ? Math.min(elapsed / 1000, .05) : 1 / 60;
    lastFrame = now;
    const modalOpen = !!document.querySelector('dialog[open]');
    if (modalOpen) { fx.clearRect(0, 0, width, height); pointer.present = false; hoverImage = null; schedule(); return; }
    const hasActivity = heroVisible || pointer.present || waves.length || sparks.length || controlTarget || controlPulses.length || document.activeElement?.matches(':focus-visible');
    if (!hasActivity) { fx.clearRect(0, 0, width, height); return; }
    simTime += dt;
    if (layoutsDirty) measure();
    field.decay(dt);
    pointerShape(dt, now);
    drawWaves(dt);
    const forming = pointer.present && contains(heroRect, pointer.x, pointer.y);
    const radius = Math.min(heroHeight * .32, 120);
    if (forming) {
      const targetX = clamp(pointer.x - heroRect.left, radius + 8, heroWidth - radius - 8);
      const targetY = clamp(pointer.y - heroRect.top, radius + 8, heroHeight - radius - 32);
      smile.x += (targetX - smile.x) * Math.min(1, dt * 10);
      smile.y += (targetY - smile.y) * Math.min(1, dt * 10);
    }
    smile.strength += ((forming ? 1 : 0) - smile.strength) * Math.min(1, dt * 5);
    if (heroVisible) drawHero();
    drawOverlay(dt);
    schedule();
  }
  function schedule() {
    if (!frame && !paused && !document.hidden && !destroyed) frame = requestAnimationFrame(animate);
  }
  function resetInteraction() {
    pointer.present = false; pointer.moved = false; pointer.prevX = -1000; pointer.prevY = -1000;
    hoverImage = null; hoverStrength = 0; idle = null; charging = null; smile.strength = 0;
    waves.length = 0; sparks.length = 0; controlPulses.length = 0; controlTarget = null; controlStrength = 0;
    field?.values.fill(0); fx.clearRect(0, 0, width, height);
  }
  function syncButton() {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.innerHTML = `<span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span> ${paused ? 'Play motion' : 'Pause motion'}`;
  }
  function setPaused(value) {
    paused = value; resetInteraction(); lastFrame = 0;
    syncButton(); drawHero(); schedule();
  }
  on(toggle, 'click', () => setPaused(!paused));
  on(reduced, 'change', e => setPaused(e.matches));
  on(fine, 'change', resetInteraction);
  on(window, 'pointermove', e => {
    if (paused || e.pointerType === 'touch' || !fine.matches) return;
    keyboardMode = false;
    if (!pointer.present) { pointer.prevX = e.clientX; pointer.prevY = e.clientY; }
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.present = true; pointer.moved = true; pointer.lastMove = performance.now();
    pointer.target = e.target; idle = null;
    if (charging && Math.hypot(e.clientX - charging.x, e.clientY - charging.y) > 18) charging = null;
    schedule();
  }, { passive: true });
  on(document, 'keydown', e => {
    if (['Tab', 'Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { keyboardMode = true; schedule(); }
  });
  on(document, 'pointerdown', () => { keyboardMode = false; }, { passive: true });
  on(document, 'focusin', schedule);
  on(document, 'focusout', schedule);
  on(document, 'toggle', () => { layoutsDirty = true; schedule(); }, { capture: true });
  on(document, 'click', e => {
    const el = eligibleControl(e.target);
    if (!el || el === toggle || paused || document.querySelector('dialog[open]')) return;
    controlPulses.push({ el, age: 0, phase: simTime * 1.6 });
    if (controlPulses.length > 5) controlPulses.shift();
    layoutsDirty = true; schedule();
  });
  on(document.documentElement, 'pointerleave', resetInteraction);
  const nonInteractiveSpace = target => target instanceof Element && !target.closest('a,button,input,textarea,select,summary,dialog,h1,h2,p,.header,.project-card');
  on(window, 'pointerdown', e => {
    if (paused || e.button !== 0 || e.pointerType === 'touch' || !fine.matches || !nonInteractiveSpace(e.target)) return;
    charging = { x: e.clientX, y: e.clientY, start: performance.now() }; idle = null;
    schedule();
  }, { passive: true });
  on(window, 'pointerup', () => {
    if (!charging) return;
    const power = .5 + clamp((performance.now() - charging.start) / 1800) * 2.2;
    burst(charging.x, charging.y, power); charging = null;
    pointer.lastMove = performance.now(); schedule();
  }, { passive: true });
  on(window, 'pointercancel', () => { charging = null; });
  on(window, 'blur', resetInteraction);
  on(window, 'scroll', () => {
    const delta = scrollY - previousScroll;
    previousScroll = scrollY; scrollOffset = scrollY % cell; layoutsDirty = true;
    // Clear old viewport marks on scroll: no ghost border or stripe sticks to the screen.
    if (Math.abs(delta) > 2) field?.values.fill(0);
    pointer.prevX = pointer.x; pointer.prevY = pointer.y;
    pointer.lastMove = performance.now(); idle = null;
    pointer.target = pointer.present ? document.elementFromPoint(pointer.x, pointer.y) : null;
    if (!fine.matches && !reduced.matches) simTime += Math.abs(delta) * .002;
    schedule();
  }, { passive: true });
  on(document, 'visibilitychange', () => { lastFrame = 0; if (document.hidden) resetInteraction(); else schedule(); });
  on(window, 'resize', resize);
  const resizeObserver = new ResizeObserver(() => { resize(); });
  resizeObserver.observe(canvas);
  const layoutObserver = new ResizeObserver(() => { layoutsDirty = true; schedule(); });
  layoutObserver.observe(document.querySelector('main'));
  const visibilityObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; schedule(); });
  visibilityObserver.observe(canvas);
  document.fonts.ready.then(() => { if (!destroyed) { layoutsDirty = true; schedule(); } });
  resize(); syncButton();
  return () => {
    destroyed = true; cancelAnimationFrame(frame); controller.abort();
    resizeObserver.disconnect(); layoutObserver.disconnect(); visibilityObserver.disconnect(); overlay.remove();
  };
}
