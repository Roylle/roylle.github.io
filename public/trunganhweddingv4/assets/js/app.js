// A paper diorama in a notebook. Native page scroll drives a camera along a spline.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { WALL, TILE, ROUTE, TINT, floorAt, buildWorld } from './world.js';

const $ = (s) => document.querySelector(s);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const backOut = (t) => { const c = 1.25; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const rndFn = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const WEDDING = new Date('2026-11-28T18:00:00+07:00');

/* ── Boot ── */
const canvas = $('#stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setClearColor(0xf8f6f0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 2, 90);
// Everything is flat paper facing the camera, so paint by world depth. View-depth
// sorting flips neighbours when the camera tilts.
renderer.setTransparentSort((a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.object.matrixWorld.elements[14] - b.object.matrixWorld.elements[14] || a.id - b.id);
const shared = { tint: { value: new THREE.Color(1, 1, 1) } };

/* ── Shaders ── */
const paperVS = `
varying vec2 vUv; varying float vFacing; uniform float flipX;
void main(){
  vUv = vec2(flipX > .5 ? 1. - uv.x : uv.x, uv.y);
  vec4 p = vec4(position, 1.);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  #else
    vec3 n = normalize(normalMatrix * normal);
  #endif
  vFacing = abs(n.z);
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;
const paperFS = `
uniform sampler2D map; uniform vec3 tint; uniform float lit; uniform float shadeAmt; uniform vec3 mul;
varying vec2 vUv; varying float vFacing;
void main(){
  vec4 c = texture2D(map, vUv);
  if (c.a < .003) discard;
  vec3 col = c.rgb;
  if (!gl_FrontFacing) col = vec3(.96, .94, .89) * c.a;
  col *= mix(tint, vec3(1.), lit) * mul * mix(1., .8 + .2 * vFacing, shadeAmt);
  gl_FragColor = vec4(col, c.a);
}`;
const shadowFS = `
uniform sampler2D map; uniform float soft; uniform float op; uniform vec3 color; uniform float flipX;
varying vec2 vUv;
void main(){
  float d = .012 + soft * .004; float a = 0.;
  a += texture2D(map, vUv, soft).a * .4;
  a += texture2D(map, vUv + vec2(d, 0.), soft).a * .15;
  a += texture2D(map, vUv - vec2(d, 0.), soft).a * .15;
  a += texture2D(map, vUv + vec2(0., d), soft).a * .15;
  a += texture2D(map, vUv - vec2(0., d), soft).a * .15;
  a *= op;
  gl_FragColor = vec4(color * a, a);
}`;

const unit = new THREE.PlaneGeometry(1, 1);
const textures = {};
let meta = {};

const paperMat = (tex, { lit = 0, flipX = 0, shade = 1, mul = [1, 1, 1], opaque = 0 } = {}) => new THREE.ShaderMaterial({
  vertexShader: paperVS, fragmentShader: paperFS, transparent: !opaque, premultipliedAlpha: !opaque, depthWrite: !!opaque, side: THREE.DoubleSide,
  uniforms: { map: { value: tex }, tint: shared.tint, lit: { value: lit }, flipX: { value: flipX }, shadeAmt: { value: shade }, mul: { value: new THREE.Vector3(...mul) } },
});
const matCache = new Map();
const matFor = (name, opts = {}) => {
  const key = `${name}|${opts.lit || 0}|${opts.flipX ? 1 : 0}|${opts.edge ? 1 : 0}`;
  if (!matCache.has(key)) matCache.set(key, paperMat(textures[name], opts.edge ? { ...opts, mul: [0.72, 0.7, 0.66] } : opts));
  return matCache.get(key);
};
const shadowMat = (tex, flipX, soft, op) => new THREE.ShaderMaterial({
  vertexShader: paperVS, fragmentShader: shadowFS, transparent: true, premultipliedAlpha: true, depthWrite: false,
  uniforms: { map: { value: tex }, soft: { value: soft }, op: { value: op }, color: { value: new THREE.Color(0x47587f) }, flipX: { value: flipX } },
});

/* ── Layout mode ── */
const view = { portrait: false, w: 1, h: 1, d: 11.75, yOff: 0, halfW: 6.5, heroOff: 3.6, heroS: 1 };
const items = [];
const hot = [];

function applyMode() {
  const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight;
  const a = W / H;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(17.5));
  const portrait = a < 1;
  const changed = portrait !== view.portrait;
  Object.assign(view, { portrait, w: W, h: H });
  if (portrait) {
    view.d = Math.max(6.4 / (2 * tanHalf * a), 12.8 / (2 * tanHalf));
    view.yOff = 2.6; view.heroOff = 0.95; view.heroS = 1.18;
  } else {
    view.d = Math.max(13.6, 12.5 / (2 * tanHalf * a));
    view.yOff = 0.55; view.heroOff = Math.min(4.4, (view.d * 2 * tanHalf * a) * 0.3); view.heroS = 1;
  }
  view.halfW = view.d * tanHalf * a;
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(W, H, false);
  camera.aspect = a; camera.updateProjectionMatrix();
  if (changed || !applyMode.done) items.forEach(layoutItem);
  applyMode.done = true;
}
let dprCap = Math.min(devicePixelRatio || 1, 2);
const pixelRatio = () => dprCap;

function layoutItem(it) {
  const src = view.portrait ? it.p : it.l;
  it.on = !!src;
  it.pivot.visible = false;
  if (it.shadow) it.shadow.visible = false;
  if (it.str) it.str.visible = false;
  if (!src) return;
  it.bx = src[0]; it.by = src[1]; it.bz = src[2]; it.s = src[3];
  it.pivot.scale.setScalar(it.s);
  if (it.clip) { const k = (view.portrait ? 0.62 : 0.7) / it.s; it.clip.scale.set(it.clipM.w * k, it.clipM.h * k, 1); it.clip.position.y = 0.06 * k; }
  if (it.shadow) {
    const dz = it.bz - WALL;
    it.dz = dz;
    it.shadow.scale.setScalar(it.s * (1 + dz * 0.02));
  }
  if (it.str) { it.str.position.set(it.bx, it.by + it.strTop * it.s, it.bz - 0.03); }
  it.radius = (it.size * it.s) / 2 + 1.5;
}

/* ── Placement API ── */
function makeItem(pivot, o, size) {
  const it = { pivot, size, l: o.l, p: o.p === undefined ? o.l : o.p, anim: o.anim, pop: o.pop, flip: o.flip, flipFrom: o.flipFrom, hover: o.hover, lift: 0, liftT: 0, phase: Math.random() * 6.28, onClick: o.onClick, alt: o.alt, photo: o.photo, frames: o.frames, fps: o.fps };
  items.push(it);
  scene.add(pivot);
  if (o.hover || o.onClick) { pivot.traverse((m) => { if (m.isMesh) { m.userData.item = it; hot.push(m); } }); }
  return it;
}

function put(name, o) {
  const m = meta[name];
  const pivot = new THREE.Group();
  const offX = (0.5 - m.ax) * m.w, offY = (0.5 - m.ay) * m.h;
  const mesh = new THREE.Mesh(unit, matFor(name, { lit: o.lit, flipX: o.flipX }));
  mesh.scale.set(m.w, m.h, 1);
  mesh.position.set(o.flipX ? -offX : offX, offY, 0);
  pivot.add(mesh);
  if (o.thick !== 0) {
    const edge = new THREE.Mesh(unit, matFor(name, { lit: o.lit, flipX: o.flipX, edge: 1 }));
    edge.scale.copy(mesh.scale);
    edge.position.set(mesh.position.x + 0.014, offY - 0.016, -0.02);
    pivot.add(edge);
  }
  const it = makeItem(pivot, o, Math.max(m.w, m.h));
  it.mesh = mesh; it.name = name;
  if (o.frames) it.frameMats = o.frames.map((f) => matFor(f, { lit: o.lit }));
  const bigEnough = Math.max(m.w, m.h) * (o.l ? o.l[3] : 1) >= 1.05;
  const dz0 = o.l ? o.l[2] - WALL : 0.3;
  if (o.shadow !== 0 && bigEnough && dz0 < 1.7) {
    const shadow = new THREE.Group();
    const dz = dz0;
    const maxLod = Math.log2(Math.min(textures[name].image.width, textures[name].image.height)) - 3.4;
    const sm = new THREE.Mesh(unit, shadowMat(textures[name], o.flipX ? 1 : 0, Math.min(2.2 + dz * 1.4, maxLod), 0.34 - dz * 0.03));
    sm.scale.set(m.w, m.h, 1);
    sm.position.set(mesh.position.x, offY, 0);
    sm.renderOrder = -5;
    shadow.add(sm);
    scene.add(shadow);
    it.shadow = shadow;
  }
  if (o.str) addString(it, m.h * (1 - m.ay));
  if (o.dynamic === 'count') countdownOn(it, m);
  layoutItem(it);
  return it;
}

const wireMat = () => new THREE.MeshBasicMaterial({ color: 0xd98a5b, toneMapped: false });
function addString(it, top) {
  const s = new THREE.Mesh(unit, wireMat());
  s.scale.set(0.024, 40, 1);
  s.geometry = unit;
  const g = new THREE.Group();
  s.position.y = 20;
  g.add(s);
  scene.add(g);
  it.str = g; it.strTop = top;
}

// Photos keep their true aspect, with a white border, hung from a clip. They are drawn
// from the first frame they exist; nothing fades them in.
function polaroid(name, o) {
  const tex = textures['ph:' + name];
  const img = tex.image;
  const aspect = img.width / img.height;
  const pivot = new THREE.Group();
  const w = 1, h = 1 / aspect;
  const mx = 0.055, top = 0.07, bot = 0.15;
  const fw = w + mx * 2, fh = h + top + bot;
  const frame = new THREE.Mesh(unit, frameMat); // opaque, so hero and props in front sort correctly
  frame.scale.set(fw, fh, 1); frame.position.set(0, -fh / 2, 0);
  const photo = new THREE.Mesh(unit, paperMat(tex, { lit: 1, shade: 0.5, opaque: 1 }));
  photo.scale.set(w, h, 1); photo.position.set(0, -top - h / 2, 0.006);
  const edge = new THREE.Mesh(unit, edgeFrameMat);
  edge.scale.copy(frame.scale); edge.position.set(0.008, -fh / 2 - 0.008, -0.012);
  const m = meta.clip;
  const clip = new THREE.Mesh(unit, matFor('clip', { lit: 1 }));
  clip.position.set(0, 0, 0.012);
  pivot.add(edge, frame, photo, clip);
  const unitize = (arr) => arr;
  const it = makeItem(pivot, { l: unitize(o.l), p: o.p === undefined ? o.l : o.p, hover: 1, onClick: 'photo', photo: name, alt: o.alt, anim: { rz: [0.018, 0.55 + Math.random() * 0.3] } }, fh);
  it.name = name; it.clip = clip; it.clipM = m;
  const sh = new THREE.Group();
  const sm = new THREE.Mesh(unit, shadowMat(rectTex, 0, 3.4, 0.3));
  sm.scale.set(fw * 1.33, fh * 1.33, 1); sm.position.set(0, -fh / 2, 0); sm.renderOrder = -5;
  sh.add(sm); scene.add(sh);
  it.shadow = sh;
  addString(it, 0);
  layoutItem(it);
  return it;
}

function tree(kind, x, z, s = 1, portraitOff) {
  const o = { l: [x, 0, z, s], p: portraitOff ? null : [x, 0, z, s * 0.92] };
  put(kind + '-trunk', { ...o, pop: 1, thick: 1 });
  const topY = 1.82 * s;
  put(kind + '-top', { l: [x, topY, z + 0.02, s], p: portraitOff ? null : [x, topY * 0.92, z + 0.02, s * 0.92], pop: 1, hover: 1, anim: { rz: [0.018, 0.9], breathe: [0.012, 1.1] } });
}

const glows = [];
function glowAt(lx, ly, z, px, py, size, i = 0) {
  const m = new THREE.Mesh(unit, glowMat);
  m.scale.setScalar(size); m.renderOrder = 4;
  scene.add(m);
  glows.push({ m, l: [lx, ly, z], p: [px, py, z], size, i });
}

function scatter(kinds, x0, x1, seed, density = 1) {
  const r = rndFn(seed * 131 + 7);
  const rows = [[-2.2, 0, 0.9], [0.9, 0, 0.72], [2.7, -0.55, 0.95]];
  for (let x = x0; x < x1; x += (1.1 + r() * 1.6) / density) {
    const [z, y, s0] = rows[Math.floor(r() * rows.length)];
    const k = kinds[Math.floor(r() * kinds.length)];
    const s = s0 * (0.72 + r() * 0.4);
    const px = x + (r() - 0.5);
    put(k, { l: [px, y, z, s], p: [px, y, z, s], thick: 0, shadow: z < -1.5 ? undefined : 0, anim: { breathe: [0.07, 2.6 + r()], rz: [0.03, 1.4 + r()] } });
  }
}

/* ── Live textures ── */
function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.premultiplyAlpha = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = ANISO; t.generateMipmaps = true;
  return { c, g: c.getContext('2d'), t };
}
function countdownOn(it, m) {
  const { c, g, t } = canvasTex(900, 400);
  const mesh = new THREE.Mesh(unit, paperMat(t, { lit: 1, shade: 0 }));
  mesh.scale.set(4.5, 2, 1); mesh.position.set(0, -0.32, 0.01);
  it.pivot.add(mesh);
  const draw = () => {
    g.clearRect(0, 0, c.width, c.height);
    const left = WEDDING - Date.now();
    g.textAlign = 'center'; g.fillStyle = '#2b2826';
    if (left <= 0) {
      g.font = '600 62px Mali'; g.fillText('Hôm nay là ngày vui!', 450, 190);
    } else {
      const d = Math.floor(left / 864e5), hh = Math.floor(left / 36e5) % 24, mm = Math.floor(left / 6e4) % 60;
      [[d, 'ngày', 170], [hh, 'giờ', 450], [mm, 'phút', 730]].forEach(([n, lab, x], i) => {
        g.font = '600 130px Mali'; g.fillStyle = i ? '#2b2826' : '#d8432f'; g.fillText(String(n).padStart(2, '0'), x, 190);
        g.font = '400 44px Mali'; g.fillStyle = '#6b7286'; g.fillText(lab, x, 268);
      });
      g.fillStyle = '#2b2826'; g.font = '600 90px Mali'; g.fillText(':', 310, 170); g.fillText(':', 590, 170);
    }
    t.needsUpdate = true;
  };
  draw();
  setInterval(draw, 30000);
}

let guest = (new URLSearchParams(location.search).get('k') || '').slice(0, 40);
let guestDraw = () => {};
function guestOn(it) {
  const { c, g, t } = canvasTex(1100, 200);
  const mesh = new THREE.Mesh(unit, paperMat(t, { lit: 1, shade: 0 }));
  mesh.scale.set(4.4, 0.8, 1); mesh.position.set(0, 0.68, 0.012);
  it.pivot.add(mesh);
  hot.push(mesh); mesh.userData.item = it;
  guestDraw = () => {
    g.clearRect(0, 0, c.width, c.height);
    const text = guest || 'Quý khách';
    let size = 118;
    do { g.font = `${size}px "Great Vibes"`; size -= 4; } while (g.measureText(text).width > 1040 && size > 40);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#2b2826';
    g.fillText(text, 550, 142);
    t.needsUpdate = true;
  };
  guestDraw();
}

/* ── Static surfaces ── */
let frameMat, edgeFrameMat, rectTex, glowMat;
const floors = [];
function buildSurfaces() {
  const wallT = textures.wall;
  wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping;
  const wW = 200, wH = 52;
  wallT.repeat.set(wW / 6.9, wH / 8.1);
  wallT.anisotropy = ANISO;
  const wallMat = paperMat(wallT, { shade: 0, opaque: 1 });
  wallMat.vertexShader = wallMat.vertexShader.replace('vUv = vec2(flipX > .5 ? 1. - uv.x : uv.x, uv.y);', `vUv = uv * vec2(${(wW / 6.9).toFixed(4)}, ${(wH / 8.1).toFixed(4)});`);
  const wall = new THREE.Mesh(unit, wallMat);
  wall.scale.set(wW, wH, 1); wall.position.set(60, wH / 2 - 4, WALL);
  scene.add(wall);

  const depth1 = 4, step = 0.55, depth2 = 3;
  for (let x = -21; x < 147; x += TILE) {
    const name = floorAt(x + 0.1);
    const t = textures[name]; t.anisotropy = ANISO;
    const top = paperMat(t, { shade: 0, opaque: 1 });
    const g = new THREE.Group();
    const a = new THREE.Mesh(unit, top);
    a.rotation.x = -Math.PI / 2; a.scale.set(TILE, depth1, 1); a.position.set(0, 0, WALL + depth1 / 2);
    const face = new THREE.Mesh(unit, paperMat(t, { shade: 0, opaque: 1, mul: [0.8, 0.8, 0.82] }));
    face.scale.set(TILE, step, 1); face.position.set(0, -step / 2, WALL + depth1);
    const b = new THREE.Mesh(unit, paperMat(t, { shade: 0, opaque: 1, mul: [0.95, 0.95, 0.95] }));
    b.rotation.x = -Math.PI / 2; b.scale.set(TILE, depth2, 1); b.position.set(0, -step, WALL + depth1 + depth2 / 2);
    const front = new THREE.Mesh(unit, paperMat(t, { shade: 0, opaque: 1, mul: [0.74, 0.74, 0.77] }));
    front.scale.set(TILE, 14, 1); front.position.set(0, -step - 7, WALL + depth1 + depth2);
    g.add(a, face, b, front);
    g.position.x = x + TILE / 2;
    scene.add(g);
    floors.push(g);
  }
}

function makeGlowAndFrames() {
  const paperPx = new THREE.DataTexture(new Uint8Array([255, 253, 246, 255]), 1, 1);
  paperPx.needsUpdate = true;
  frameMat = paperMat(paperPx, { lit: 1, shade: 1, opaque: 1 });
  const edgePx = new THREE.DataTexture(new Uint8Array([196, 190, 176, 255]), 1, 1);
  edgePx.needsUpdate = true;
  edgeFrameMat = paperMat(edgePx, { lit: 1, shade: 0, opaque: 1 });

  const r = document.createElement('canvas'); r.width = r.height = 128;
  const rg = r.getContext('2d'); rg.fillStyle = '#fff'; rg.fillRect(16, 16, 96, 96);
  rectTex = new THREE.CanvasTexture(r); rectTex.minFilter = THREE.LinearMipmapLinearFilter;

  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gg = gc.getContext('2d'); const gr = gg.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,214,130,.85)'); gr.addColorStop(0.35, 'rgba(255,190,100,.32)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
  gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
  glowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.9 });
}

/* ── Hero ── */
const hero = { root: new THREE.Group(), tilt: new THREE.Group(), variants: {}, cur: null, spin: 0, flipT: 1, pending: null, x: 0 };
scene.add(hero.root);
hero.root.add(hero.tilt);
function part(name, x, y, z = 0, s = 1) {
  const m = meta[name];
  const piv = new THREE.Group();
  const mesh = new THREE.Mesh(unit, matFor(name, { lit: 0.62 }));
  mesh.scale.set(m.w, m.h, 1);
  mesh.position.set((0.5 - m.ax) * m.w, (0.5 - m.ay) * m.h, 0);
  piv.add(mesh);
  const edge = new THREE.Mesh(unit, matFor(name, { lit: 0.62, edge: 1 }));
  edge.scale.copy(mesh.scale); edge.position.set(mesh.position.x + 0.012, mesh.position.y - 0.014, -0.012);
  piv.add(edge);
  piv.position.set(x, y, z); piv.scale.setScalar(s);
  return piv;
}
function buildHero() {
  const v = hero.variants;
  const stick = () => part('stick', 0, 0.55, -0.1);

  v.bike = new THREE.Group();
  const bw1 = part('wheel-bike', -0.57, 0.36, 0.02), bw2 = part('wheel-bike', 0.57, 0.36, 0.02);
  const crank = part('crank', 0.01, 0.36, 0.05), leg = part('leg-bike', 0.31, 1.06, 0.075, 0.95);
  v.bike.add(stick(), bw1, bw2, part('bike', 0, 0, 0.03), part('rider-bike', -0.06, 0.92, 0.06), crank, leg);
  v.bike.userData = { wheels: [bw1, bw2], r: 0.36, crank, leg };

  v.cub = new THREE.Group();
  const cw1 = part('wheel-cub', -0.84, 0.3, 0.02), cw2 = part('wheel-cub', 0.82, 0.3, 0.02);
  v.cub.add(stick(), cw1, cw2, part('rider-cub', -0.2, 0.88, 0.03), part('cub', 0, 0, 0.05));
  v.cub.userData = { wheels: [cw1, cw2], r: 0.28, buzz: 1 };

  v.boat = new THREE.Group();
  v.boat.add(part('boat', 0, 0, 0.03, 0.82), part('rider-boat', -0.72, 0.6, 0.05, 0.86));
  v.boat.userData = { rock: 1 };

  v.balloon = new THREE.Group();
  v.balloon.add(part('balloon', 0, 0, 0.02, 0.66));
  v.balloon.userData = { float: 1 };

  v.wed = new THREE.Group();
  v.wed.add(stick(), part('couple-wedding', 0, 0.02, 0.03, 0.82));
  v.wed.userData = { hop: 1 };

  for (const k in v) { v[k].visible = false; hero.tilt.add(v[k]); }
  const s = new THREE.Group();
  const shM = new THREE.Mesh(unit, shadowMat(rectTex, 0, 3.6, 0.24));
  shM.rotation.x = -Math.PI / 2; shM.scale.set(2.5, 0.7, 1); shM.renderOrder = -4;
  s.add(shM); hero.contact = s; hero.root.add(s);
}
const heroKind = (x) => (x < 27.5 ? 'bike' : x < 55.5 ? 'cub' : x < 71 ? 'boat' : x < 90 ? 'balloon' : 'wed');

/* ── Particles: dust behind the wheels, phượng + white petals ── */
const DUST = 28, PETALS = 46;
let dust, petals;
const dustS = [], petalS = [];
function buildParticles() {
  dust = new THREE.InstancedMesh(unit, new THREE.MeshBasicMaterial({ color: 0xe8dcc4, toneMapped: false, side: THREE.DoubleSide }), DUST);
  dust.frustumCulled = false;
  scene.add(dust);
  for (let i = 0; i < DUST; i++) dustS.push({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, s: 0, r: 0 });
  const pm = paperMat(textures.petal, { lit: 0.7, shade: 1 });
  petals = new THREE.InstancedMesh(unit, pm, PETALS);
  petals.frustumCulled = false; petals.renderOrder = 3;
  scene.add(petals);
  const r = rndFn(55);
  for (let i = 0; i < PETALS; i++) petalS.push({ px: r(), py: r(), z: -2.3 + r() * 1.5, sp: 0.5 + r() * 0.5, sw: r() * 6.28, s: 0.1 + r() * 0.12 });
}
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();

/* ── Rings: real 3D gold in the paper world ── */
const rings = { group: new THREE.Group() };
function buildRings() {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc56e, metalness: 1, roughness: 0.2, envMap: env, envMapIntensity: 1.5 });
  const rose = new THREE.MeshStandardMaterial({ color: 0xffb79c, metalness: 1, roughness: 0.22, envMap: env, envMapIntensity: 1.5 });
  const geo = new THREE.TorusGeometry(1, 0.135, 40, 140);
  rings.a = new THREE.Mesh(geo, gold);
  rings.b = new THREE.Mesh(geo, rose);
  rings.b.scale.setScalar(0.88);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.02, envMap: env, envMapIntensity: 3 }));
  gem.position.set(0, 0.97, 0);
  gem.scale.set(1, 1.25, 1);
  rings.b.add(gem);
  rings.group.add(rings.a, rings.b);
  scene.add(rings.group);

  const rc = document.createElement('canvas'); rc.width = rc.height = 256;
  const g = rc.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 24; g.beginPath(); g.arc(128, 128, 88, 0, 7); g.stroke();
  const ringTex = new THREE.CanvasTexture(rc); ringTex.minFilter = THREE.LinearMipmapLinearFilter;
  rings.sA = new THREE.Mesh(unit, shadowMat(ringTex, 0, 2.2, 0.42));
  rings.sB = new THREE.Mesh(unit, shadowMat(ringTex, 0, 2.2, 0.42));
  rings.sA.renderOrder = rings.sB.renderOrder = -4;
  scene.add(rings.sA, rings.sB);
  rings.glow = new THREE.Mesh(unit, glowMat.clone());
  rings.glow.material.opacity = 0.34;
  rings.glow.scale.setScalar(8); rings.glow.renderOrder = -3;
  scene.add(rings.glow);
  // Warm string holding the rings.
  rings.str = new THREE.Mesh(unit, wireMat());
  rings.str.scale.set(0.024, 16, 1);
  scene.add(rings.str);
}

/* ── Route ── */
const route = { keys: [], segs: [], total: 0, curve: null, stops: {} };
function buildRoute() {
  const PX_PER_UNIT = 88;
  const keys = [];
  const addKey = (k) => keys.push({ x: k.x, y: k.y, lx: k.lx ?? 0, fly: k.fly ?? 0, py: k.py ?? 0, id: k.id });
  ROUTE.forEach((r) => {
    if (r.dwell) { addKey({ ...r, x: r.x - 0.55 }); addKey({ ...r, x: r.x + 0.55, id: null }); keys[keys.length - 1].dwell = r.dwell; }
    else addKey(r);
  });
  let total = 0;
  const segs = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const len = b.dwell || Math.max(120, dist * PX_PER_UNIT);
    if (a.id) route.stops[a.id] = total + len / 2;
    segs.push({ start: total, len });
    total += len;
  }
  route.keys = keys; route.segs = segs; route.total = total;
  route.curve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(k.x, k.y, 0)), false, 'centripetal');
  ROUTE.forEach((r) => { if (r.id === 'end') route.stops.end = total; });
}
function routeAt(px) {
  const { segs, keys } = route;
  const p = clamp(px, 0, route.total);
  let i = 0;
  while (i < segs.length - 1 && p > segs[i].start + segs[i].len) i++;
  const t = clamp((p - segs[i].start) / segs[i].len);
  const u = (i + t) / (keys.length - 1);
  const a = keys[i], b = keys[i + 1], st = smooth(t);
  const pt = route.curve.getPoint(u);
  return { x: pt.x, y: pt.y, lx: lerp(a.lx, b.lx, st), fly: lerp(a.fly, b.fly, st), py: lerp(a.py, b.py, st) };
}
function tintAt(x) {
  for (let i = 0; i < TINT.length - 1; i++) {
    if (x <= TINT[i + 1][0]) {
      const t = smooth(clamp((x - TINT[i][0]) / (TINT[i + 1][0] - TINT[i][0])));
      return TINT[i][1].map((c, k) => lerp(c, TINT[i + 1][1][k], t));
    }
  }
  return TINT[TINT.length - 1][1];
}

/* ── Loop ── */
const state = { scroll: 0, smooth: 0, vel: 0, last: performance.now(), mx: 0, my: 0, cx: 0, cy: 0, heroX: -3.6, tabs: [], actId: null, heroY: 0, slow: 0, frames: 0, ft: 0 };
const camTarget = new THREE.Vector3();

function setupScroller() {
  const sc = $('#scroller');
  sc.style.height = `calc(${Math.round(route.total)}px + 100vh)`;
  const read = () => { state.scroll = window.scrollY; };
  addEventListener('scroll', read, { passive: true });
  read();
  state.smooth = state.scroll;
}

function tick(now) {
  const dt = Math.min(0.05, (now - state.last) / 1000);
  state.last = now;
  const t = REDUCED ? 0 : now / 1000;
  const prev = state.smooth;
  state.smooth += (state.scroll - state.smooth) * (1 - Math.exp(-dt * 7));
  if (Math.abs(state.scroll - state.smooth) < 0.02) state.smooth = state.scroll;
  const vel = (state.smooth - prev) / Math.max(dt, 0.001);
  state.vel = lerp(state.vel, vel, 0.12);

  const r = routeAt(state.smooth);
  // Camera
  const camY = r.y + view.yOff + (view.portrait ? r.py : 0);
  state.cx = lerp(state.cx, state.mx, 0.08); state.cy = lerp(state.cy, state.my, 0.08);
  const mX = view.portrait ? 0 : state.cx, mY = view.portrait ? 0 : state.cy;
  camera.position.set(r.x + mX * 0.34, camY - mY * 0.2, WALL + view.d);
  const lookDown = view.portrait ? 0.15 : 0.55;
  camTarget.set(r.x + r.lx * (view.portrait ? 0.25 : 1) - mX * 0.12, camY - lookDown + mY * 0.06, WALL);
  camera.lookAt(camTarget);

  // Tint
  const tn = tintAt(r.x);
  shared.tint.value.setRGB(tn[0], tn[1], tn[2]);

  updateHero(r, camY, dt, t);
  updateItems(r, dt, t);
  updateRings(r, camY, t);
  updateParticles(r, camY, dt, t);
  updateHud(r);

  renderer.render(scene, camera);
  adapt(dt);
  requestAnimationFrame(tick);
}

function adapt(dt) {
  // Drop resolution once if a phone can't hold a smooth frame rate.
  state.frames++; state.ft += dt;
  if (state.ft > 2.5) {
    const fps = state.frames / state.ft;
    state.frames = 0; state.ft = 0;
    if (fps < 38 && dprCap > 1.25) { dprCap = Math.max(1.25, dprCap - 0.4); applyMode(); }
  }
}

function updateHero(r, camY, dt, t) {
  const x = r.x - view.heroOff * (1 - smooth(clamp((r.x - 122) / 5)) * (view.portrait ? 1 : 0.42));
  const dx = x - hero.x;
  hero.x = x;
  const kind = heroKind(x);
  if (!hero.cur) { hero.cur = kind; hero.variants[kind].visible = true; }
  if (kind !== hero.cur && !hero.pending) { hero.pending = kind; hero.flipT = 0; }
  if (hero.flipT < 1) {
    hero.flipT = Math.min(1, hero.flipT + dt / 0.55);
    if (hero.flipT >= 0.25 && hero.pending) {
      hero.variants[hero.cur].visible = false;
      hero.cur = hero.pending; hero.pending = null;
      hero.variants[hero.cur].visible = true;
      burst(x, hero.root.position.y + 1);
    }
  }
  hero.tilt.rotation.y = hero.flipT < 1 ? smooth(hero.flipT) * Math.PI * 2 : 0;

  const v = hero.variants[hero.cur];
  const u = v.userData;
  // Base height: on the road, on the water, or following the camera up for the climb.
  const flyOff = view.portrait ? -6.55 : -3.6;
  const flyY = camY + flyOff;
  const flyW = u.float ? 1 : r.fly;
  let y = lerp(0, flyY, u.float ? Math.max(flyW, smooth(clamp((x - 69.5) / 3)) * (x < 87 ? 1 : 0) + smooth(clamp((87 - x) / 3))) : 0);
  if (u.float) y = Math.max(0.4, x < 86 ? flyY : lerp(flyY, 0.4, smooth(clamp((x - 86) / 4))));
  const bobA = Math.sin(t * 1.8 + 1.2) * 0.012 + Math.sin(t * 2.3 + 0.4) * 0.008;
  y += bobA;
  if (u.rock) y += 0.32 + Math.sin(t * 1.4) * 0.07;
  if (u.float) y += Math.sin(t * 0.9) * 0.08;
  if (u.hop) y += Math.abs(Math.sin(x * 2.4)) * 0.1 * clamp(Math.abs(state.vel) / 120);
  if (u.buzz) y += Math.sin(t * 28) * 0.006 * clamp(Math.abs(state.vel) / 80);
  hero.root.position.set(x, y, -1.45);
  hero.root.scale.setScalar(view.heroS * (u.float && view.portrait ? 0.8 : 1));
  hero.tilt.rotation.z = (u.rock ? Math.sin(t * 1.1) * 0.05 : 0) + (u.float ? Math.sin(t * 0.7) * 0.012 : 0) - clamp(state.vel / 1800, -0.05, 0.05);

  hero.spin -= dx / (u.r || 0.36);
  if (u.wheels) u.wheels.forEach((w) => { w.rotation.z = hero.spin; });
  if (u.crank) u.crank.rotation.z = hero.spin * 0.6;
  if (u.leg) u.leg.rotation.z = Math.sin(hero.spin * 0.6) * 0.28;

  hero.contact.visible = !u.rock && !u.float;
  hero.contact.position.set(0.1, 0.012 - y / view.heroS * 1, 0.1);
  if (u.wheels && Math.abs(dx) > 0.002 && dx > 0) emitDust(x - 0.7 * view.heroS, 0.18, -1.3, clamp(dx * 6));
}

let dustI = 0, dustAcc = 0;
function emitDust(x, y, z, amt) {
  dustAcc += amt;
  while (dustAcc > 0.35) {
    dustAcc -= 0.35;
    const d = dustS[dustI++ % DUST];
    Object.assign(d, { life: 1, x, y, z, vx: -0.5 - Math.random() * 1.2, vy: 0.7 + Math.random() * 1.1, s: 0.05 + Math.random() * 0.07, r: Math.random() * 6 });
  }
}
function burst(x, y) {
  for (let i = 0; i < 14; i++) {
    const d = dustS[dustI++ % DUST], a = Math.random() * 6.28;
    Object.assign(d, { life: 1, x, y, z: -1.2, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2 + 0.4, s: 0.07 + Math.random() * 0.09, r: Math.random() * 6 });
  }
}

function updateItems(r, dt, t) {
  const camX = r.x;
  const halfW = view.halfW;
  const camY = r.y + view.yOff + (view.portrait ? r.py : 0);
  const halfH = halfW / (view.w / view.h);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.on) continue;
    const dist = Math.abs(it.bx - camX);
    const margin = halfW + it.radius + 3.5;
    const inRange = dist < margin && Math.abs(it.by - camY) < halfH + it.radius + 5;
    it.pivot.visible = inRange;
    if (it.shadow) it.shadow.visible = inRange;
    if (it.str) it.str.visible = inRange;
    if (!inRange) continue;

    let px = it.bx, py = it.by, pz = it.bz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1;
    const a = it.anim;
    if (a && !REDUCED) {
      if (a.bob) py += Math.sin(t * a.bob[1] * 2 + it.phase) * a.bob[0];
      if (a.drift) px += Math.sin(t * a.drift[1] + it.phase) * a.drift[0];
      if (a.rz) rz = Math.sin(t * a.rz[1] * 2 + it.phase) * a.rz[0];
      if (a.breathe) sy *= 1 + Math.sin(t * a.breathe[1] + it.phase) * a.breathe[0];
      if (a.twinkle) { const k = 1 + Math.sin(t * a.twinkle[1] + a.twinkle[2]) * a.twinkle[0]; sx *= k; sy *= k; rz = t * 0.1; }
      if (a.jump) {
        // A leaping fish: parabola over a period, pitching through the arc.
        const ph = ((t * 0.5 + a.jump[2]) % a.jump[1]) / a.jump[1];
        const q = clamp(ph / 0.55);
        py = it.by - 0.5 + 4 * q * (1 - q) * a.jump[0];
        px = it.bx + (q - 0.5) * 1.3;
        rz = (0.5 - q) * 1.6;
      }
      if (a.rise) {
        const ph = (t * a.rise[1] + a.rise[2]) % 1;
        py = it.by + ph * a.rise[0];
        px += Math.sin(t + it.phase) * 0.3;
      }
    }
    // Pop-up book: lies flat on the floor, stands up as the camera comes.
    if (it.pop && !REDUCED) {
      const reach = (camX + halfW + 0.2 - (it.bx - it.radius * 0.4)) / 2.6;
      const q = backOut(clamp(reach));
      rx = (1 - q) * (Math.PI / 2);
      const h = py;
      py = h * Math.cos(rx);
      pz += h * Math.sin(rx);
    }
    // Pinned notes swing in on their pin, on the way into view.
    if (it.flip && !REDUCED) {
      const reach = (camX + halfW + 1 - (it.bx - it.radius * 0.5) - (it.flipFrom || 0)) / 2.2;
      ry = (1 - backOut(clamp(reach))) * (Math.PI / 2);
    }
    // Hover lift.
    it.lift += (it.liftT - it.lift) * (1 - Math.exp(-dt * 10));
    pz += it.lift * 0.55;
    py += it.lift * 0.04;

    it.pivot.position.set(px, py, pz);
    it.pivot.rotation.set(rx, ry, rz);
    it.pivot.scale.set(it.s * sx, it.s * sy, it.s);

    if (it.frameMats) it.mesh.material = it.frameMats[Math.floor(t * it.fps + it.phase) % it.frameMats.length];

    if (it.shadow) {
      const dz = pz - WALL;
      it.shadow.position.set(px + dz * 0.16 + 0.03, py - dz * 0.09 - 0.02, WALL + 0.012);
      it.shadow.rotation.set(0, 0, rz);
      it.shadow.scale.set(it.s * sx * Math.cos(ry) * (1 + dz * 0.015), it.s * sy * Math.cos(rx) * (1 + dz * 0.015), 1);
    }
  }
  for (let i = 0; i < floors.length; i++) floors[i].visible = Math.abs(floors[i].position.x - camX) < halfW + 12;
  for (let i = 0; i < glows.length; i++) {
    const g = glows[i], src = view.portrait ? g.p : g.l;
    const on = Math.abs(src[0] - camX) < halfW + 3 && Math.abs(src[1] - camY) < halfH + 3;
    g.m.visible = on;
    if (on) {
      g.m.position.set(src[0], src[1], src[2] + 0.05);
      g.m.scale.setScalar(g.size * (1 + Math.sin(t * 2.4 + g.i * 1.7) * 0.08));
    }
  }
}

function updateRings(r, camY, t) {
  const cx = view.portrait ? 80.5 : 82, cy = view.portrait ? 24.2 : 20.5;
  const near = Math.abs(r.x - 80.5) < view.halfW + 5 && Math.abs(camY - cy) < 14;
  rings.group.visible = rings.sA.visible = rings.sB.visible = rings.glow.visible = rings.str.visible = near;
  if (!near) return;
  // Scrolling draws the two rings together until they link.
  const stop = route.stops.rings ?? 0;
  const k = clamp(1 - Math.abs(state.smooth - stop) / 1100);
  const join = smooth(k);
  const sep = lerp(2.4, 0.86, join);
  const scale = view.portrait ? 1.2 : 1.36;
  const z = -1.15;
  rings.group.position.set(cx, cy + Math.sin(t * 0.8) * 0.06, z);
  rings.group.scale.setScalar(scale);
  const roll = state.smooth * 0.0016;
  rings.a.position.set(-sep * 0.5, 0, 0);
  rings.b.position.set(sep * 0.5, -0.02, 0.05);
  rings.a.rotation.set(0.22 + Math.sin(t * 0.5) * 0.08, 0.42 + Math.sin(roll) * 0.2 + Math.sin(t * 0.32) * 0.14, 0.12);
  rings.b.rotation.set(-0.18 + Math.sin(t * 0.6) * 0.08, -0.42 - Math.sin(roll) * 0.2 - Math.sin(t * 0.28) * 0.14, -0.12);
  const dz = z - WALL;
  [[rings.sA, -sep * 0.5, Math.cos(rings.a.rotation.y)], [rings.sB, sep * 0.5, Math.cos(rings.b.rotation.y) * 0.88]].forEach(([s, ox, kx]) => {
    s.position.set(cx + ox * scale + dz * 0.2, rings.group.position.y - dz * 0.13, WALL + 0.02);
    s.scale.set(3 * scale * Math.max(0.3, Math.abs(kx)), 3 * scale, 1);
  });
  rings.glow.position.set(cx, cy, WALL + 0.03);
  rings.str.position.set(cx, cy + 9.3 * scale, z - 0.1);
  rings.str.visible = false;
}

function updateParticles(r, camY, dt, t) {
  for (let i = 0; i < DUST; i++) {
    const d = dustS[i];
    if (d.life > 0) {
      d.life -= dt * 1.5;
      d.vy -= dt * 2.3;
      d.x += d.vx * dt; d.y += d.vy * dt; d.r += dt * 5;
      const s = Math.max(0, d.life) * d.s;
      E.set(0, 0, d.r); Q.setFromEuler(E);
      M4.compose(V.set(d.x, Math.max(0.01, d.y), d.z), Q, S.set(s, s, s));
    } else M4.makeScale(0, 0, 0);
    dust.setMatrixAt(i, M4);
  }
  dust.instanceMatrix.needsUpdate = true;

  // Falling petals: phượng in the city, white at the far end of the garden.
  const inCity = smooth(clamp((r.x - 26) / 4)) * (1 - smooth(clamp((r.x - 50) / 4)));
  const inGarden = smooth(clamp((r.x - 93) / 4));
  const amt = Math.max(inCity, inGarden);
  petals.visible = amt > 0.01 && !REDUCED;
  petals.material.uniforms.map.value = inGarden > 0 ? textures['petal-white'] : textures.petal;
  if (petals.visible) {
    const H = view.halfW * 2 / (view.w / view.h);
    const W = view.halfW * 2 + 2;
    for (let i = 0; i < PETALS; i++) {
      const p = petalS[i];
      const f = (p.py - t * 0.05 * p.sp) % 1;
      const yy = camY - H / 2 + ((f + 1) % 1) * (H + 1);
      const xx = r.x - W / 2 + (((p.px + Math.sin(t * 0.4 + p.sw) * 0.02 - r.x * 0.002) % 1 + 1) % 1) * W;
      E.set(t * p.sp + p.sw, t * 0.8 * p.sp, p.sw + t * p.sp);
      Q.setFromEuler(E);
      const s = i / PETALS < amt * 0.5 ? p.s * 1.7 : 0;
      M4.compose(V.set(xx, Math.max(0.03, yy), p.z), Q, S.set(s, s, s));
      petals.setMatrixAt(i, M4);
    }
    petals.instanceMatrix.needsUpdate = true;
  }
}

/* ── HUD ── */
function buildHud() {
  const nav = $('#tabs');
  ROUTE.filter((r) => r.label).forEach((r) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = r.label; b.dataset.id = r.id;
    b.addEventListener('click', () => scrollTo({ top: r.id === 'cover' ? 0 : route.stops[r.id] ?? 0, behavior: 'smooth' }));
    nav.appendChild(b);
    state.tabs.push({ b, at: r.id === 'cover' ? 0 : route.stops[r.id] ?? 0 });
  });
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  $('#copyAddr').addEventListener('click', async () => {
    const addr = 'Trung tâm tiệc cưới W. Jardin, Số 307 Nguyễn Văn Linh, phường Kênh Dương, thành phố Hải Phòng';
    try { await navigator.clipboard.writeText(addr); toast('Đã sao chép địa chỉ'); } catch { toast(addr); }
  });
  $('#lightClose').addEventListener('click', () => $('#lightbox').close());
  $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') e.currentTarget.close(); });
  $('#nameForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'ok') return;
    guest = $('#nameInput').value.trim().slice(0, 40);
    guestDraw();
    const u = new URL(location.href);
    if (guest) u.searchParams.set('k', guest); else u.searchParams.delete('k');
    history.replaceState(null, '', u);
  });
}
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}
let activeStop = null, hintOn = true;
function updateHud() {
  const p = state.smooth;
  let cur = null;
  for (const t of state.tabs) if (p >= t.at - 500) cur = t;
  state.tabs.forEach((t) => { const on = t === cur; if (t.on !== on) { t.on = on; t.b.setAttribute('aria-current', on); } });

  let stop = null, best = 1e9;
  for (const id in route.stops) { const d = Math.abs(route.stops[id] - p); if (d < best) { best = d; stop = id; } }
  const near = best < 520 ? stop : null;
  if (near !== activeStop) {
    activeStop = near;
    document.querySelectorAll('#actions .sticker').forEach((el) => el.classList.toggle('show', !!near && el.dataset.for.split(' ').includes(near)));
  }
  if (hintOn && p > 60) { hintOn = false; $('#hint').classList.remove('on'); }
}

/* ── Pointer ── */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null, downAt = null;
function pick(e) {
  ndc.set((e.clientX / view.w) * 2 - 1, -(e.clientY / view.h) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const vis = hot.filter((m) => m.userData.item.pivot.visible);
  const hit = ray.intersectObjects(vis, false)[0];
  return hit ? hit.object.userData.item : null;
}
function setupPointer() {
  const mouse = matchMedia('(hover: hover)').matches;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    state.mx = (e.clientX / innerWidth - 0.5) * 2;
    state.my = (e.clientY / innerHeight - 0.5) * 2;
    if (!mouse) return;
    const it = pick(e);
    if (it !== hovered) {
      if (hovered) hovered.liftT = 0;
      hovered = it;
      if (it) it.liftT = 1;
      canvas.style.cursor = it && it.onClick ? 'pointer' : '';
    }
  }, { passive: true });
  canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = performance.now() - downAt.t < 450;
    downAt = null;
    if (moved > 12 || !quick) return;
    const it = pick(e);
    if (!it) return;
    it.liftT = 1;
    if (e.pointerType === 'touch') setTimeout(() => { it.liftT = 0; }, 520);
    if (it.onClick === 'photo') {
      const img = $('#lightImg'); img.src = `assets/photos/${it.photo}.webp`; img.alt = it.alt || '';
      $('#lightbox').showModal();
    } else if (it.onClick === 'name') {
      $('#nameInput').value = guest; $('#nameBox').showModal();
    }
  });
}

/* ── Assets ── */
const PHOTOS = ['hero', 'doi-can', 'can-doi', 'doi-kem', 'co-dau', 'doi-xam', 'doi-tay', 'tay-nam', 'w1', 'w2', 'w3', 'w6'];
function loadTexture(url, name, opts = {}) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.premultiplyAlpha = !opts.opaque;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = opts.aniso ?? 4;
      t.generateMipmaps = true;
      t.needsUpdate = true;
      textures[name] = t;
      res(t);
    };
    img.onerror = () => rej(new Error('load ' + url));
    img.src = url;
  });
}

async function start() {
  meta = await (await fetch('assets/art/meta.json')).json();
  const artNames = Object.keys(meta);
  const totalN = artNames.length + PHOTOS.length + 1;
  let done = 0;
  const bar = $('#bar');
  const bump = () => { done++; bar.style.width = `${Math.round((done / totalN) * 92)}%`; };
  await Promise.all([
    document.fonts.load('600 40px Mali', 'Hôm nay'), document.fonts.load('400 40px Mali', 'ngày'), document.fonts.load('40px "Great Vibes"', 'Quý khách'),
  ]).catch(() => {});
  bump();
  await Promise.all([
    ...artNames.map((n) => loadTexture(`assets/art/${n}.webp`, n, { opaque: meta[n].flat, aniso: meta[n].flat ? ANISO : 4 }).then(bump)),
    ...PHOTOS.map((n) => loadTexture(`assets/photos/${n}.webp`, 'ph:' + n, { opaque: 1, aniso: ANISO }).then(bump)),
  ]);

  makeGlowAndFrames();
  applyMode();
  buildSurfaces();
  buildHero();
  buildParticles();
  buildRings();
  buildWorld({ put, polaroid, tree, glowAt, scatter, rnd: rndFn });
  guestOn(hotCardOf());
  buildRoute();
  setupScroller();
  buildHud();
  setupPointer();

  // Upload everything before the curtain lifts: nothing pops in, no hitch on first sight.
  const list = Object.values(textures);
  for (let i = 0; i < list.length; i++) {
    renderer.initTexture(list[i]);
    if (i % 6 === 5) { bar.style.width = `${92 + Math.round((i / list.length) * 8)}%`; await new Promise((r) => setTimeout(r)); }
  }
  items.forEach((it) => { if (it.on) { it.pivot.visible = true; if (it.shadow) it.shadow.visible = true; } });
  renderer.compile(scene, camera);

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(applyMode, 120); });
  state.last = performance.now();
  requestAnimationFrame(tick);
  bar.style.width = '100%';
  await new Promise((r) => setTimeout(r, 450));
  $('#loader').classList.add('out');
  $('#tabs').classList.add('on');
  if (scrollY < 60) $('#hint').classList.add('on');
  setTimeout(() => $('#loader').remove(), 1100);
  window.__paper = { state, route, view, items, camera, renderer, routeAt };
}

function hotCardOf() { return items.find((i) => i.name === 'card-invite'); }

start().catch((e) => {
  console.error(e);
  document.documentElement.classList.add('no-webgl');
});
