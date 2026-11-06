// Thế giới giấy: tường vở, các lớp đất bậc thang, con rối gắn que, sóng,
// đôi nhẫn vàng 3D và chuyển từ ngày sang đêm theo vị trí camera.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import * as A from './art.js';
import { Q, tile, C } from './ink.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const U = { uTint: { value: new THREE.Color(1, 1, 1) }, uStep: { value: 0 } };
export const GY = (z) => -Math.floor(Math.max(z, 0) / 2.2) * 0.55;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const seeded = (a) => () => (a = (a * 16807) % 2147483647) / 2147483647;
// Nhường luồng khi tải; dùng thêm setTimeout vì tab nền không có requestAnimationFrame
const breathe = () => new Promise((r) => { const id = setTimeout(r, 60); requestAnimationFrame(() => { clearTimeout(id); r(); }); });

const VS = `varying vec2 vUv;
void main(){ vUv=uv; vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
  p=instanceMatrix*p;
#endif
  gl_Position=projectionMatrix*modelViewMatrix*p; }`;

const FS_CUT = `uniform sampler2D map; uniform vec3 uTint; uniform float uStep,uLit,uReveal,uSeed;
uniform vec2 uBoil,uBS; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
  if(vUv.x>uReveal)discard;
  vec2 uv=vUv;
  if(uBoil.x>0.){float s=uStep+uSeed;
    uv+=(vec2(n(uv*uBS+s*7.13),n(uv*uBS+s*3.37+9.))-.5)*uBoil;}
  vec4 c=texture2D(map,uv);
  if(c.a<.04)discard;
  vec3 rgb=c.rgb/c.a;
  gl_FragColor=vec4(mix(rgb*uTint,rgb,uLit),smoothstep(.18,.72,c.a));
}`;

const FS_SHADOW = `uniform sampler2D map; uniform float uBias,uAlpha; uniform vec2 uD; varying vec2 vUv;
void main(){
  float a=texture2D(map,vUv,uBias).a*2.;
  vec2 d=uD,e2=uD*.7071;
  a+=texture2D(map,vUv+vec2(d.x,0.),uBias).a+texture2D(map,vUv-vec2(d.x,0.),uBias).a;
  a+=texture2D(map,vUv+vec2(0.,d.y),uBias).a+texture2D(map,vUv-vec2(0.,d.y),uBias).a;
  a+=texture2D(map,vUv+e2,uBias).a+texture2D(map,vUv-e2,uBias).a;
  a+=texture2D(map,vUv+vec2(e2.x,-e2.y),uBias).a+texture2D(map,vUv+vec2(-e2.x,e2.y),uBias).a;
  a/=10.;
  vec2 e=smoothstep(vec2(0.),vec2(.06),vUv)*smoothstep(vec2(0.),vec2(.06),1.-vUv);
  a*=e.x*e.y*uAlpha;
  if(a<.004)discard;
  gl_FragColor=vec4(.26,.30,.46,a);
}`;

const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const quadC = new THREE.PlaneGeometry(1, 1);

export async function createWorld(renderer, { guest, onProgress }) {
  const scene = new THREE.Scene();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const T = {};

  const texFrom = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace;
    t.premultiplyAlpha = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = aniso;
    return t;
  };

  /* ---- Tải ảnh thật và vẽ toàn bộ hình ---- */
  const photoNames = ['p1', 'p3', 'p4', 'p8', 'c1', 'c2', 'hands', 'closing', 'aisle', 'hall-light'];
  const photos = {};
  const loadPhoto = (n) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { photos[n] = img; res(); };
    img.onerror = rej;
    img.src = `assets/img/${n}.webp`;
  });

  const factories = {
    bike: A.coupleBike, wheel: A.wheel, boat: A.coupleBoat, balloon: A.coupleBalloon, walk: A.coupleWalk,
    cloud1: () => A.cloud(1), cloud2: () => A.cloud(2), sun: A.sun, moon: A.moon,
    star1: () => A.star(1), star2: () => A.star(2, C.cream),
    grass1: () => A.grass(1), grass2: () => A.grass(2), fern1: () => A.fern(1), fern2: () => A.fern(2),
    flower: () => A.flower(1), flowerB: () => A.flower(2, C.blush), hydrangea: () => A.hydrangea(1), hydrangea2: () => A.hydrangea(2),
    tree: () => A.tree(1), treeB: () => A.tree(2, C.blush), butterfly: A.butterfly, bird: A.bird,
    houseA: A.houseA, houseB: A.houseB, cardA: () => A.familyCard(0), cardB: () => A.familyCard(1), thread: A.thread,
    plane: A.plane, wave1: () => A.wave(1, C.sea), wave2: () => A.wave(2, '#b4d3e3'), wave3: () => A.wave(3, '#86b3cd'),
    karst1: () => A.karst(1), karst2: () => A.karst(2), lighthouse: A.lighthouse, gull: A.gull, fish: A.fish, paperBoat: A.paperBoat,
    vine1: () => A.vine(1), vine2: () => A.vine(2), calendar: A.calendar, ringGhost: A.ringGhost, wreath: A.wreath,
    vault: A.vault, lights: () => A.lights(), cake: A.cake, burst1: () => A.burst(1, C.gold), burst2: () => A.burst(2, C.rose),
    heroText: () => A.heroText(guest), handsCap: A.handsCaption, albumText: A.albumText, seaText: A.seaText, riseText: A.riseText,
    dateText: A.dateText, venueText: A.venueText, thanksText: A.thanksText,
    pole: A.pole, line: () => A.clothesline(), stick: A.stick, heart: A.heartSprite, petal: () => A.petalSprite(C.blush), puff: A.puff,
    pr_p1: () => A.print(photos.p1, { seed: 1 }), pr_p3: () => A.print(photos.p3, { seed: 2 }), pr_p4: () => A.print(photos.p4, { seed: 3 }),
    pr_p8: () => A.print(photos.p8, { seed: 4 }), pr_c1: () => A.print(photos.c1, { seed: 5 }), pr_c2: () => A.print(photos.c2, { seed: 6 }),
    pr_hands: () => A.print(photos.hands, { seed: 7, peg: false }), pr_closing: () => A.print(photos.closing, { seed: 8, peg: false }),
    pr_aisle: () => A.print(photos.aisle, { seed: 9, peg: false }), pr_hall: () => A.print(photos['hall-light'], { seed: 10, peg: false }),
    countdown: () => A.countdown(0, 0, 0, 0, false),
  };

  const names = Object.keys(factories);
  const total = names.length + photoNames.length * 2;
  let done = 0;
  await Promise.all(photoNames.map((n) => loadPhoto(n).then(() => { done += 2; onProgress(done / total); })));
  // Vẽ từng hình, nhường khung hình để thanh tiến trình vẫn chạy
  let last = performance.now();
  for (const n of names) {
    T[n] = texFrom(factories[n]());
    done++;
    if (performance.now() - last > 28) {
      onProgress(done / total);
      await breathe();
      last = performance.now();
    }
  }

  /* ---- Vật liệu ---- */
  const cutMat = (tex, { boil = 1.7, lit = 0, reveal = 2 } = {}) => {
    const cw = tex.image.width, ch = tex.image.height;
    return new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS_CUT, side: THREE.DoubleSide, alphaToCoverage: true,
      uniforms: {
        map: { value: tex }, uTint: U.uTint, uStep: U.uStep, uLit: { value: lit }, uReveal: { value: reveal },
        uSeed: { value: Math.random() * 40 },
        uBoil: { value: new THREE.Vector2(boil * Q / cw, boil * Q / ch).multiplyScalar(reduceMotion ? 0 : 1) },
        uBS: { value: new THREE.Vector2(cw / (70 * Q), ch / (70 * Q)) },
      },
    });
  };
  const shadowMat = (tex, w, z, alpha = 0.3) => {
    const blur = Math.min(0.08 + Math.min(z, 7) * 0.032, w * 0.06);
    const cw = tex.image.width;
    return new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS_SHADOW, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: {
        map: { value: tex }, uAlpha: { value: alpha },
        uBias: { value: Math.min(4.2, Math.log2(Math.max(1, (blur * cw) / w * 0.5))) },
        uD: { value: new THREE.Vector2(blur / w, (blur / w) * (cw / tex.image.height)) },
      },
    });
  };
  const stickMat = cutMat(T.stick, { boil: 0 });

  /* ---- Con rối giấy ---- */
  const puppets = [];
  const pickable = [];

  class Puppet {
    constructor(name, o) {
      const tex = T[name];
      this.o = o;
      this.x = o.x; this.y = o.y; this.z = o.z;
      this.w = o.w ?? o.h * (tex.image.width / tex.image.height);
      this.h = o.h ?? o.w * (tex.image.height / tex.image.width);
      this.sp = { pop: o.pop ? 0 : 1, popV: 0, flip: o.flip ? Math.PI / 2 : 0, flipV: 0, kick: 0, kickV: 0 };
      this.phase = Math.random() * 10;
      this.group = new THREE.Group();
      this.group.position.set(o.x, o.y, o.z);
      const ay = o.anchor === 'top' ? -this.h : o.anchor === 'center' ? -this.h / 2 : 0;
      this.ay = ay;
      this.mesh = new THREE.Mesh(quad, cutMat(tex, { boil: o.boil ?? 1.7, lit: o.lit ?? 0 }));
      this.mesh.scale.set(this.w, this.h, 1);
      this.mesh.position.y = ay;
      this.mesh.visible = !o.shadowOnly;
      this.mesh.userData.p = this;
      this.group.add(this.mesh);
      if (o.stick) {
        const len = Math.max(0.4, o.y + ay + this.h * 0.25 - GY(o.z) + 1.4);
        this.stick = new THREE.Mesh(quad, stickMat);
        this.stick.scale.set(0.13, len, 1);
        this.stick.position.set(0, ay + this.h * 0.25 - len, -0.012);
        this.group.add(this.stick);
      }
      if (o.hang) {
        this.stick = new THREE.Mesh(quad, stickMat);
        this.stick.scale.set(0.1, 30, 1);
        this.stick.position.set(0, ay + this.h * 0.55, -0.012);
        this.group.add(this.stick);
      }
      scene.add(this.group);
      this.hasShadow = o.shadow !== false && o.z > 0.1;
      if (this.hasShadow) {
        this.sGroup = new THREE.Group();
        this.sMesh = new THREE.Mesh(quad, shadowMat(tex, this.w, o.z, o.shadowA ?? 0.3));
        this.sMesh.scale.set(this.w, this.h, 1);
        this.sMesh.position.y = ay;
        this.sGroup.add(this.sMesh);
        scene.add(this.sGroup);
      }
      if (o.hit !== false && !o.shadowOnly) pickable.push(this.mesh);
      puppets.push(this);
    }

    kick() { this.sp.kickV = 7.5; }

    update(t, dt, cx, visW) {
      const o = this.o, sp = this.sp;
      const near = Math.abs(this.x - cx) < visW * 0.62 + this.w;
      this.group.visible = near;
      if (this.sGroup) this.sGroup.visible = near;
      this.near = near;
      if (!near && !o.pop && !o.flip) return;
      const d = Math.abs(this.x - cx);
      if (o.pop) {
        const target = d < visW * 0.46 ? 1 : 0;
        sp.popV += ((target - sp.pop) * 90 - sp.popV * 11) * dt;
        sp.pop += sp.popV * dt;
      }
      if (o.flip) {
        const target = d < visW * 0.47 ? 0 : Math.PI / 2;
        sp.flipV += ((target - sp.flip) * 60 - sp.flipV * 9) * dt;
        sp.flip += sp.flipV * dt;
      }
      sp.kickV += (-sp.kick * 110 - sp.kickV * 7) * dt;
      sp.kick += sp.kickV * dt;
      if (!near) return;

      const m = reduceMotion ? 0 : 1;
      const [ba, bf] = o.bob || [0.035, 1.3];
      const [sa, sf] = o.sway || [0.012, 0.9];
      let x = this.x, y = this.y + Math.sin(t * bf + this.phase) * ba * m;
      let rz = (o.rz || 0) + Math.sin(t * sf + this.phase * 2) * sa * m;
      if (o.fly) x += Math.sin(t * o.fly[1] + this.phase) * o.fly[0] * m;
      if (o.jump) {
        const u = ((t + this.phase) % o.jump[0]) / o.jump[1];
        if (u < 1) { y += Math.sin(u * Math.PI) * o.jump[2]; rz += 1.0 - u * 2; } else y -= 1.5;
      }
      if (o.pop) y += (sp.pop - 1) * (this.h + 1.2);
      this.group.position.set(x, y, this.z);
      this.group.rotation.set(0, sp.flip, rz + sp.kick * 0.22);
      let sx = 1 + sp.kick * 0.12, sy = 1 + sp.kick * 0.12;
      if (o.flap) sy *= 0.55 + 0.45 * Math.abs(Math.sin(t * o.flap + this.phase));
      if (o.pulse) { const k = 0.35 + 0.75 * ((t * o.pulse + this.phase) % 1); sx = sy = k; this.mesh.material.uniforms.uReveal.value = 2; }
      this.group.scale.set(sx, sy, 1);
      if (this.sGroup) {
        this.sGroup.position.set(x + this.z * 0.13, y - this.z * 0.075, 0.022);
        this.sGroup.rotation.z = this.group.rotation.z;
        this.sGroup.scale.set(sx * Math.cos(sp.flip) * (1 + this.z * 0.008), sy * (1 + this.z * 0.008), 1);
      }
    }
  }
  const P = (name, o) => new Puppet(name, o);

  /* ---- Trang vở ---- */
  const wallTex = tile(1024, 512, (x, w, h) => {
    x.fillStyle = '#fbfbf7'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#a9c6e2'; x.lineWidth = 2.6;
    for (let i = 0; i < 8; i++) {
      x.beginPath(); x.moveTo(0, (i + 0.5) * 64); x.lineTo(w, (i + 0.5) * 64); x.stroke();
    }
  });
  const wT = new THREE.CanvasTexture(wallTex);
  wT.wrapS = wT.wrapT = THREE.RepeatWrapping;
  wT.colorSpace = THREE.NoColorSpace;
  wT.anisotropy = aniso;
  const wallFS = `uniform sampler2D map; uniform vec3 uTint; uniform float uM,uW; varying vec2 vW,vL;
    void main(){ vec3 c=texture2D(map,vW/vec2(16.,8.)).rgb;
      float wob=sin(vL.y*1.3+uM)*.025;
      float m=1.-smoothstep(.022,.06,abs(vL.x-uM+wob));
      c=mix(c,vec3(.90,.55,.55),m*.85);
      float e=min(vL.x+uW*.5,uW*.5-vL.x);
      c*=mix(.95,1.,smoothstep(0.,.3,e));
      gl_FragColor=vec4(c*uTint,1.); }`;
  const wallVS = `varying vec2 vW,vL; void main(){ vL=position.xy; vec4 w=modelMatrix*vec4(position,1.); vW=w.xy; gl_Position=projectionMatrix*viewMatrix*w; }`;
  const wR = seeded(9);
  for (let x = -52, i = 0; x < 250; i++) {
    const W = 27 + wR() * 7;
    const mat = new THREE.ShaderMaterial({ vertexShader: wallVS, fragmentShader: wallFS, uniforms: {
      map: { value: wT }, uTint: U.uTint, uM: { value: (wR() - 0.5) * W * 0.5 }, uW: { value: W },
    } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.5, 90), mat);
    m.position.set(x + W / 2, 28, i % 2 ? -0.006 : -0.012);
    m.rotation.z = (wR() - 0.5) * 0.012;
    scene.add(m);
    x += W;
  }

  /* ---- Đất giấy bậc thang ---- */
  const groundTex = tile(512, 512, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(70,90,120,.34)'; x.lineWidth = 2.4;
    for (const u of [128, 384]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, h); x.stroke(); }
  });
  const gT = new THREE.CanvasTexture(groundTex);
  gT.wrapS = gT.wrapT = THREE.RepeatWrapping;
  gT.colorSpace = THREE.NoColorSpace;
  gT.anisotropy = aniso;
  gT.minFilter = THREE.LinearMipmapLinearFilter;
  const groundMat = new THREE.ShaderMaterial({
    vertexShader: `attribute vec3 aC; varying vec3 vC; varying vec2 vUv; void main(){vC=aC;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D map; uniform vec3 uTint; varying vec3 vC; varying vec2 vUv;
      void main(){ vec3 c=texture2D(map,vUv).rgb*vC; gl_FragColor=vec4(c*mix(uTint,vec3(1.),.14),1.); }`,
    uniforms: { map: { value: gT }, uTint: U.uTint },
  });
  const ROWS = 11, RZ = 2.2, RH = 0.55;
  const regions = [
    { x0: -52, x1: 78, col: (r) => (r === 1 ? '#e8c6b7' : r % 2 ? '#b7cfa9' : '#c6d9b8') },
    { x0: 78, x1: 111, sea: true, col: (r) => (r % 2 ? '#9cc3d8' : '#add0e2') },
    { x0: 111, x1: 141, col: (r) => (r === 1 ? '#efdcb6' : r % 2 ? '#c2d6b1' : '#d0e0bf') },
    { x0: 141, x1: 250, col: (r) => (r === 1 ? '#d9b76e' : r % 2 ? '#2a9c86' : '#35ad96') },
  ];
  const gR = seeded(31);
  const makeRow = (r, reg, arr) => {
    // Giữ nguyên giá trị sRGB để giấy đúng màu thiết kế
    const k = (hex, s) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255 * s, ((n >> 8) & 255) / 255 * s, (n & 255) / 255 * s]; };
    let x = reg.x0;
    while (x < reg.x1) {
      const L = Math.min(9 + gR() * 11, reg.x1 - x);
      const x0 = x - 0.08, x1 = x + L + 0.08;
      const y = -r * RH + (gR() - 0.5) * 0.05, z0 = r * RZ, z1 = z0 + RZ + (gR() - 0.5) * 0.09;
      const y2 = y - RH - 0.25;
      const hex = reg.col(r);
      const v = (px, py, pz, u, w, s) => { arr.p.push(px, py, pz); arr.u.push(u / 4, w / 4); arr.c.push(...k(hex, s)); };
      const t = (a, b, c2, d) => { [a, b, c2, a, c2, d].forEach((q) => v(...q)); };
      t([x0, y, z1, x0, z1, 1.0], [x1, y, z1, x1, z1, 1.0], [x1, y, z0, x1, z0, 0.84], [x0, y, z0, x0, z0, 0.84]);
      t([x0, y2, z1, x0, y2, 0.74], [x1, y2, z1, x1, y2, 0.74], [x1, y, z1, x1, y, 0.92], [x0, y, z1, x0, y, 0.92]);
      x += L;
    }
  };
  const bufferOf = (arr) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(arr.u, 2));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(arr.c, 3));
    return g;
  };
  const still = { p: [], u: [], c: [] };
  const seaRows = [];
  for (const reg of regions) {
    for (let r = 0; r < ROWS; r++) {
      if (reg.sea) {
        const a = { p: [], u: [], c: [] };
        makeRow(r, reg, a);
        const m = new THREE.Mesh(bufferOf(a), groundMat);
        scene.add(m);
        seaRows.push(m);
      } else makeRow(r, reg, still);
    }
  }
  scene.add(new THREE.Mesh(bufferOf(still), groundMat));

  /* ---- Đoạn 1: lời mời ---- */
  P('heroText', { x: 1, y: 3.15, z: 0.014, w: 10.4, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  P('wreath', { x: -9.6, y: 5.6, z: 0.7, w: 3.6, anchor: 'center', stick: true, sway: [0.02, 0.8] });
  P('plane', { x: 13.5, y: 8.5, z: 1.8, w: 8.6, anchor: 'center', hang: true, bob: [0.16, 0.6], sway: [0.02, 0.5] });
  P('sun', { x: 21, y: 9.4, z: 0.7, w: 3.2, anchor: 'center', sway: [0.05, 0.3], shadow: false });
  P('tree', { x: 11.5, y: GY(1.5) - 0.1, z: 1.5, w: 6.8, pop: true });
  P('cloud1', { x: -7, y: 9.6, z: 1.2, w: 4.8, anchor: 'center', fly: [0.5, 0.2] });

  /* ---- Đoạn 2: hai nhà ---- */
  P('houseA', { x: 20, y: GY(1.1) - 0.1, z: 1.1, w: 5.6, pop: true });
  P('cardA', { x: 20, y: 1.1, z: 3.5, w: 5.8, stick: true, flip: true, rz: -0.02 });
  P('houseB', { x: 34.2, y: GY(1.1) - 0.1, z: 1.1, w: 6.6, pop: true });
  P('cardB', { x: 34.2, y: 1.1, z: 3.5, w: 5.8, stick: true, flip: true, rz: 0.02 });
  const threadP = P('thread', { x: 27, y: 5.6, z: 1.5, w: 14.6, boil: 1, hit: false, shadow: false, bob: [0, 0], sway: [0, 0] });
  P('pr_hands', { x: 27, y: 2.75, z: 2.1, w: 5.3, rz: -0.025, stick: true, sway: [0.01, 0.7], shadowA: 0.34, boil: 0 });
  P('handsCap', { x: 27, y: 8.1, z: 0.014, w: 6.6, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  P('cloud2', { x: 22, y: 10.5, z: 0.9, w: 3.8, anchor: 'center', fly: [0.5, 0.17] });

  /* ---- Đoạn 3: album phơi trên dây ---- */
  P('albumText', { x: 41.2, y: 4, z: 0.014, w: 7, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  P('pole', { x: 46.3, y: GY(2.1) - 0.5, z: 2.1, h: 9.9, hit: false, bob: [0, 0], sway: [0, 0], shadowA: 0.2, boil: 0 });
  P('pole', { x: 76.3, y: GY(2.1) - 0.5, z: 2.1, h: 9.9, hit: false, bob: [0, 0], sway: [0, 0], shadowA: 0.2, boil: 0 });
  P('line', { x: 61.3, y: 8.4, z: 2.13, w: 30, boil: 0, hit: false, bob: [0, 0], sway: [0, 0], shadowA: 0.16 });
  const album = [['pr_p1', 49.2, 5.9], ['pr_c1', 54, 4.6], ['pr_p3', 59, 5.9], ['pr_p8', 63.9, 5.9], ['pr_c2', 68.8, 4.6], ['pr_p4', 73.6, 5.9]];
  for (const [n, x, size] of album) {
    const u = (x - 46.3) / 30;
    const top = 9.22 - Math.sin(u * Math.PI) * 0.45;
    const landscape = n === 'pr_c1' || n === 'pr_c2';
    P(n, { x, y: top + 0.1, z: 2.2, anchor: 'top', ...(landscape ? { w: size } : { h: size }), boil: 0, bob: [0, 0], sway: [0.024, 1.1], shadowA: 0.34 });
  }
  P('treeB', { x: 78, y: GY(0.7) - 0.1, z: 0.7, w: 6.6, pop: true });
  P('cloud1', { x: 44, y: 11, z: 0.9, w: 3.6, anchor: 'center', fly: [0.4, 0.2] });
  P('cloud2', { x: 68, y: 11.8, z: 1, w: 4.2, anchor: 'center', fly: [0.4, 0.15] });
  for (const [x, y] of [[33, 10.2], [52, 10.6], [70, 10.4]]) P('bird', { x, y, z: 1.4, w: 1.2, anchor: 'center', flap: 4.2, fly: [2, 0.22], shadow: false });
  for (const [x, y, z] of [[17, 3.5, 3.3], [47, 2.8, 3.4], [62, 2.6, 3.6], [116, 3.2, 3.6]]) P('butterfly', { x, y, z, w: 0.95, anchor: 'center', flap: 8, fly: [1.3, 0.5], bob: [0.3, 1.1], shadow: false });

  /* ---- Đoạn 4: biển Hải Phòng ---- */
  P('karst1', { x: 81, y: -0.4, z: 0.5, w: 6.6, pop: true, boil: 1.2 });
  P('karst2', { x: 98, y: -0.4, z: 0.5, w: 7.6, pop: true, boil: 1.2 });
  P('seaText', { x: 88.4, y: 5.9, z: 0.014, w: 8.1, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  P('lighthouse', { x: 93.6, y: -0.3, z: 0.8, w: 2.5, pop: true });
  P('sun', { x: 103, y: 8.8, z: 0.7, w: 3, anchor: 'center', sway: [0.05, 0.3], shadow: false });
  P('cloud2', { x: 84, y: 11.2, z: 1, w: 4.2, anchor: 'center', fly: [0.5, 0.17] });
  P('cloud1', { x: 100, y: 11.8, z: 1, w: 4.2, anchor: 'center', fly: [0.5, 0.2] });
  for (const [x, y, s] of [[84, 8.4, 1.5], [91, 10.2, 1.2], [99, 7.2, 1.3], [106, 10, 1.1]]) P('gull', { x, y, z: 1.6, w: s, anchor: 'center', flap: 3, fly: [2.4, 0.3], shadowA: 0.2 });
  const waves = [];
  [[1.1, 'wave2'], [3.3, 'wave1'], [5.5, 'wave3'], [7.5, 'wave1'], [9.7, 'wave2'], [11.9, 'wave3']].forEach(([z, n], i) => {
    for (let x = 80; x <= 110; x += 9.6) {
      const w = P(n, { x: x + (i % 2) * 4, y: GY(z) - 1.05, z, w: 10.6, boil: 1.1, shadow: false, hit: false, bob: [0, 0], sway: [0, 0] });
      w.waveRow = i;
      waves.push(w);
    }
  });
  P('paperBoat', { x: 104, y: GY(3.4) - 0.35, z: 3.2, w: 1.9, bob: [0.13, 1], sway: [0.05, 0.9] });
  P('fish', { x: 85, y: GY(4.8) - 0.7, z: 4.8, w: 1.15, jump: [5.5, 1.3, 2.4], bob: [0, 0], shadow: false });
  P('fish', { x: 96, y: GY(4.8) - 0.7, z: 4.8, w: 1.05, jump: [7.1, 1.4, 2.8], bob: [0, 0], shadow: false });

  /* ---- Đoạn 5: lên cao tới đôi nhẫn ---- */
  P('riseText', { x: 115.4, y: 13.3, z: 0.014, w: 7.8, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  for (let i = 0; i < 5; i++) {
    P(i % 2 ? 'vine2' : 'vine1', { x: 121 + (i % 2 ? 0.1 : -0.1), y: GY(1.1) - 0.4 + i * 6.2, z: 1.1, w: 4.5, boil: 1.2, bob: [0, 0], sway: [0.004, 0.5], hit: false, shadowA: 0.24 });
  }
  P('calendar', { x: 116.4, y: 20.6, z: 1.9, w: 6.5, anchor: 'center', flip: true, sway: [0.01, 0.6], boil: 0, shadowA: 0.32 });
  P('dateText', { x: 128.2, y: 23.2, z: 0.014, w: 7.8, boil: 0, hit: false, bob: [0, 0], sway: [0, 0] });
  const cd = P('countdown', { x: 131.8, y: 13.2, z: 1.6, w: 6.1, anchor: 'center', flip: true, boil: 0, sway: [0.008, 0.6], hit: true });
  P('ringGhost', { x: 122, y: 31, z: 3, w: 8.4, anchor: 'center', shadowOnly: true, bob: [0, 0], sway: [0, 0], shadowA: 0.22 });
  for (const [x, y, z, w] of [[108, 11, 1, 5], [125, 10, 1.2, 4.6], [111, 19, 1.3, 5], [132, 21, 1, 5.4], [112, 29, 0.9, 5.2], [131, 33, 1, 5.2], [117, 37, 1.2, 4.2], [128, 39, 1, 4.6]]) {
    P(z > 1.1 ? 'cloud1' : 'cloud2', { x, y, z, w, anchor: 'center', fly: [0.5, 0.18] });
  }
  for (const [x, y, s] of [[116.6, 33, 0.8], [127.6, 33.8, 0.9], [117.2, 28.6, 0.6], [127, 28.8, 0.7], [122, 36, 0.95], [114.6, 30.6, 0.5], [129.5, 31, 0.55]]) {
    P(s > 0.75 ? 'star1' : 'star2', { x, y, z: 2.6, w: s, anchor: 'center', pulse: 0, sway: [0.3, 1.4], bob: [0.08, 2], shadow: false, lit: 0.4, boil: 0, hit: false });
  }
  P('tree', { x: 113, y: GY(1.2) - 0.1, z: 1.2, w: 6.4, pop: true });
  P('hydrangea', { x: 127, y: GY(2.5) - 0.2, z: 2.5, w: 3.6, pop: true });

  /* Đôi nhẫn vàng thật, phản chiếu môi trường */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  const rings = new THREE.Group();
  rings.position.set(122, 31, 3);
  const gold = new THREE.MeshStandardMaterial({ color: 0xf3c76a, metalness: 1, roughness: 0.17, envMap: env, envMapIntensity: 1.5 });
  const rose = new THREE.MeshStandardMaterial({ color: 0xf0bd9c, metalness: 1, roughness: 0.2, envMap: env, envMapIntensity: 1.5 });
  const ringGeo = new THREE.TorusGeometry(2.25, 0.27, 28, 120);
  ringGeo.scale(1, 1, 1.25);
  const ringA = new THREE.Mesh(ringGeo, gold);
  ringA.position.x = -1.28; ringA.rotation.y = 0.55;
  const ringB = new THREE.Mesh(ringGeo, rose);
  ringB.position.x = 1.28; ringB.rotation.y = -0.55;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, metalness: 0.75, roughness: 0.12, envMap: env, envMapIntensity: 1.1, flatShading: true }));
  gem.position.set(0, 2.62, 0);
  ringB.add(gem);
  rings.add(ringA, ringB);
  scene.add(rings);
  pmrem.dispose();

  /* ---- Đoạn 6: W. Jardin về đêm ---- */
  P('moon', { x: 137, y: 9.2, z: 0.6, w: 3, anchor: 'center', lit: 1, sway: [0.03, 0.4], shadow: false });
  const venueCenters = [147, 157.6, 168.2, 178.8, 189.4, 200];
  for (const x of venueCenters) P('vault', { x, y: -0.6, z: 0.7, w: 10.7, boil: 0, bob: [0, 0], sway: [0, 0], hit: false, shadowA: 0.42, lit: 0.18 });
  P('venueText', { x: 147, y: 2.75, z: 0.014, w: 7.9, boil: 0, hit: false, lit: 1, bob: [0, 0], sway: [0, 0] });
  P('pr_aisle', { x: 157.6, y: 2.8, z: 0.4, w: 8, lit: 0.82, boil: 0, bob: [0, 0], sway: [0, 0], shadowA: 0.4 });
  P('pr_hall', { x: 168.2, y: 2.8, z: 0.4, w: 8, lit: 0.82, boil: 0, bob: [0, 0], sway: [0, 0], shadowA: 0.4 });
  P('pr_closing', { x: 178.8, y: 1.6, z: 0.4, h: 7.6, lit: 0.88, boil: 0, bob: [0, 0], sway: [0, 0], shadowA: 0.4 });
  P('thanksText', { x: 189.4, y: 2.9, z: 0.014, w: 8.2, boil: 0, hit: false, lit: 1, bob: [0, 0], sway: [0, 0] });
  const lightStrings = [];
  for (let x = 141; x < 208; x += 11.8) {
    P('lights', { x: x + 5.9, y: 8.75, z: 1.2, w: 12, lit: 1, boil: 0, hit: false, shadow: false, bob: [0.02, 0.5], sway: [0.002, 0.5] });
    lightStrings.push(x + 5.9);
  }
  for (const [x, n] of [[152.3, 'hydrangea'], [162.9, 'hydrangea2'], [173.5, 'hydrangea'], [184.1, 'hydrangea2'], [194.7, 'hydrangea']]) {
    P(n, { x, y: GY(2.6) - 0.1, z: 2.6, w: 3.6, lit: 0.72, pop: true });
  }
  P('cake', { x: 162.9, y: GY(4) - 0.1, z: 4, w: 1.9, lit: 0.8, stick: true });
  for (const [x, y, n, s] of [[184.1, 9.8, 'burst1', 3.2], [194.8, 10, 'burst2', 3.6], [173.5, 10, 'burst2', 2.6]]) {
    P(n, { x, y, z: 1.1, w: s, anchor: 'center', lit: 1, pulse: 0.28, boil: 0, shadow: false, hit: false, bob: [0, 0], sway: [0.2, 0.2] });
  }
  for (const [x, y, s] of [[133, 12, 0.6], [140, 11, 0.5], [143.5, 9.6, 0.5], [130, 8, 0.45], [152, 12, 0.5], [163, 11.8, 0.55], [175, 12, 0.5], [186, 12.4, 0.6], [198, 12, 0.5]]) {
    P('star2', { x, y, z: 0.5, w: s, anchor: 'center', lit: 1, shadow: false, boil: 0, hit: false, sway: [0.3, 1.8], bob: [0.05, 2] });
  }

  /* Rải cỏ hoa trên đất bằng hạt giống cố định để lần nào mở cũng giống nhau */
  const sR = seeded(4242);
  const scatter = (x0, x1, step, names, lit = 0) => {
    for (let x = x0; x < x1; x += step * (0.6 + sR() * 0.9)) {
      const z = [2.5, 3.6, 4.7, 7.5][Math.floor(sR() * 4)];
      const n = names[Math.floor(sR() * names.length)];
      const big = n.startsWith('fern') ? 1.7 : n.startsWith('flower') ? 1.25 : 1.75;
      P(n, { x, y: GY(z) - 0.08, z, w: big * (0.85 + sR() * 0.35), pop: true, lit, sway: [0.03, 1.2], bob: [0, 0], shadowA: 0.2 });
    }
  };
  scatter(-20, 78, 3.1, ['grass1', 'grass2', 'grass1', 'flower', 'fern1', 'flowerB', 'fern2']);
  scatter(111, 141, 2.9, ['grass1', 'grass2', 'flower', 'flowerB', 'fern1']);
  scatter(142, 208, 4.2, ['grass1', 'grass2', 'fern2'], 0.3);

  /* Bầu trời phía trên: chỉ màn hình dọc mới thấy, để điện thoại không bị trống */
  const skyR = seeded(777);
  for (let x = -6; x < 110; x += 5.2 + skyR() * 3.5) {
    const y = 12.8 + skyR() * 5.5;
    const k = skyR();
    if (x > 80 && k < 0.45) P('gull', { x, y, z: 1.2, w: 1.5, anchor: 'center', flap: 3, fly: [1.8, 0.28], shadowA: 0.16 });
    else if (k < 0.72) P(k < 0.36 ? 'cloud1' : 'cloud2', { x, y, z: 0.9 + skyR() * 0.6, w: 3.4 + skyR() * 1.4, anchor: 'center', fly: [0.4, 0.17] });
    else P('bird', { x, y, z: 1.2, w: 1.1, anchor: 'center', flap: 4.2, fly: [1.6, 0.22], shadow: false });
  }
  for (let x = 141; x < 205; x += 2.4 + skyR() * 2.6) {
    P(skyR() < 0.3 ? 'star1' : 'star2', { x, y: 12.2 + skyR() * 7, z: 0.5, w: 0.35 + skyR() * 0.35, anchor: 'center', lit: 1, shadow: false, boil: 0, hit: false, sway: [0.3, 1.8], bob: [0.05, 2] });
  }
  P('moon', { x: 168, y: 15.5, z: 0.6, w: 3, anchor: 'center', lit: 1, sway: [0.03, 0.4], shadow: false, hit: false });

  /* ---- Đôi bạn: đổi trang phục theo từng cảnh ---- */
  const MODES = {
    bike: { w: 4.1, px: 960 },
    boat: { w: 4.5, px: 980 },
    balloon: { w: 3.5, px: 700 },
    walk: { w: 3.0, px: 680 },
  };
  const coupleZ = 6.4;
  const couple = P('bike', { x: 0, y: GY(coupleZ), z: coupleZ, w: MODES.bike.w, stick: true, bob: [0, 0], sway: [0, 0], shadowA: 0.2, boil: 1.5 });
  couple.mode = 'bike'; couple.turn = 0; couple.turning = false; couple.face = 1; couple.faceV = 1; couple.cy = GY(coupleZ); couple.isCouple = true;
  const wheelMat = cutMat(T.wheel, { boil: 0 });
  const wheels = [[220, 630], [740, 630]].map(([px, py]) => {
    const m = new THREE.Mesh(quadC, wheelMat);
    const k = MODES.bike.w / 960;
    const W = (118 * 2 + 64) * k;
    m.scale.set(W, W, 1);
    m.position.set((px - 480) * k, (780 - py) * k, -0.01);
    couple.group.add(m);
    return m;
  });
  puppets.splice(puppets.indexOf(couple), 1);

  const setMode = (name) => {
    const M = MODES[name];
    const tex = T[name];
    couple.mode = name;
    couple.w = M.w;
    couple.h = M.w * (tex.image.height / tex.image.width);
    couple.mesh.material.uniforms.map.value = tex;
    couple.mesh.material.uniforms.uBoil.value.set(1.5 * Q / tex.image.width, 1.5 * Q / tex.image.height).multiplyScalar(reduceMotion ? 0 : 1);
    couple.mesh.scale.set(couple.w, couple.h, 1);
    couple.sMesh.scale.set(couple.w, couple.h, 1);
    couple.sMesh.material.uniforms.map.value = tex;
    couple.sMesh.material.uniforms.uAlpha.value = name === 'balloon' ? 0.11 : 0.2;
    wheels.forEach((w) => (w.visible = name === 'bike'));
    if (couple.stick) couple.stick.visible = name !== 'balloon';
    for (const f of [0, 1, 2, 3, 4, 5]) spawnHeart(couple.group.position.x + (Math.random() - 0.5) * 2, couple.group.position.y + couple.h * 0.7, coupleZ + 0.3);
  };
  const modeFor = (cx) => (cx < 77 ? 'bike' : cx < 111 ? 'boat' : cx < 141 ? 'balloon' : 'walk');
  couple.modeFor = modeFor;

  /* ---- Hạt: tim khi chạm, bụi sau bánh xe, cánh hoa bay ---- */
  const mkPool = (tex, n, lit = 0.1) => {
    const mat = cutMat(tex, { boil: 0, lit });
    const inst = new THREE.InstancedMesh(quadC, mat, n);
    inst.frustumCulled = false;
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < n; i++) inst.setMatrixAt(i, zero);
    scene.add(inst);
    return { inst, items: Array.from({ length: n }, () => ({ life: 0 })), next: 0 };
  };
  const hearts = mkPool(T.heart, 36, 0.5), puffs = mkPool(T.puff, 24, 0.1);
  const dummy = new THREE.Object3D();
  function spawn(pool, x, y, z, vx, vy, life, size) {
    const it = pool.items[pool.next];
    pool.next = (pool.next + 1) % pool.items.length;
    Object.assign(it, { x, y, z, vx, vy, life, max: life, size, rot: Math.random() * 6 });
  }
  function spawnHeart(x, y, z) { spawn(hearts, x, y, z, (Math.random() - 0.5) * 3.2, 1.6 + Math.random() * 2.4, 1.1 + Math.random() * 0.6, 0.34 + Math.random() * 0.26); }
  const updatePool = (pool, dt, grav) => {
    pool.items.forEach((it, i) => {
      if (it.life <= 0) { if (it.life !== -1) { dummy.scale.setScalar(0); dummy.updateMatrix(); pool.inst.setMatrixAt(i, dummy.matrix); it.life = -1; } return; }
      it.life -= dt;
      it.vy += grav * dt;
      it.x += it.vx * dt; it.y += it.vy * dt;
      const u = clamp(it.life / it.max, 0, 1);
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, 0, Math.sin(it.rot + it.life * 3) * 0.4);
      dummy.scale.setScalar(it.size * Math.min(1, u * 2.4));
      dummy.updateMatrix();
      pool.inst.setMatrixAt(i, dummy.matrix);
    });
    pool.inst.instanceMatrix.needsUpdate = true;
  };

  const petalCount = reduceMotion ? 0 : Q < 1 ? 28 : 54;
  const petalMat = cutMat(T.petal, { boil: 0, lit: 0.3 });
  const petals = new THREE.InstancedMesh(quadC, petalMat, Math.max(1, petalCount));
  petals.frustumCulled = false;
  const pData = Array.from({ length: petalCount }, () => ({
    x: Math.random() * 40 - 20, y: Math.random() * 18, z: 2 + Math.random() * 13,
    s: 0.14 + Math.random() * 0.17, a: Math.random() * 6, f: 0.3 + Math.random() * 0.5,
  }));
  if (petalCount) scene.add(petals);

  /* Quầng sáng của dây đèn và trăng */
  const glowTex = new THREE.CanvasTexture(A.glow());
  glowTex.colorSpace = THREE.NoColorSpace;
  const glowMat = new THREE.ShaderMaterial({
    vertexShader: VS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform sampler2D map; uniform float uK; varying vec2 vUv; void main(){ vec4 c=texture2D(map,vUv); gl_FragColor=vec4(c.rgb,c.a*uK); }`,
    uniforms: { map: { value: glowTex }, uK: { value: 0 } },
  });
  const bulbs = [];
  for (const cxs of lightStrings) {
    for (let i = 1; i < 14; i++) {
      const t = i / 14, sag = 40 + Math.sin(t * Math.PI) * 120 + 36;
      bulbs.push({ x: cxs + (t - 0.5) * 12, y: 8.75 + (1 - sag / 240) * 1.92, ph: Math.random() * 6, s: 1.1 });
    }
  }
  bulbs.push({ x: 137, y: 9.2, ph: 0, s: 8 });
  const glowInst = new THREE.InstancedMesh(quadC, glowMat, bulbs.length);
  glowInst.frustumCulled = false;
  glowInst.position.z = 1.23;
  scene.add(glowInst);

  /* Chuyển màu theo vị trí */
  const tintStops = [
    [0, [1, 1, 1]], [80, [1, 1, 1]], [100, [1, 0.985, 0.96]], [124, [1, 0.965, 0.89]],
    [134, [0.82, 0.74, 0.76]], [141, [0.42, 0.46, 0.62]], [150, [0.2, 0.26, 0.42]], [230, [0.17, 0.23, 0.39]],
  ];
  const tintAt = (x, out) => {
    let i = 0;
    while (i < tintStops.length - 2 && x > tintStops[i + 1][0]) i++;
    const [x0, a] = tintStops[i], [x1, b] = tintStops[i + 1];
    const u = clamp((x - x0) / (x1 - x0), 0, 1);
    out.setRGB(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
  };

  /* ---- Đồng hồ đếm ngược ---- */
  const TARGET = Date.UTC(2026, 10, 28, 11, 0, 0);
  let cdLast = -1;
  const updateCountdown = () => {
    const now = Date.now();
    const sec = Math.floor(now / 1000);
    if (sec === cdLast) return;
    cdLast = sec;
    const left = Math.max(0, Math.floor((TARGET - now) / 1000));
    const c = A.countdown(Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60, left <= 0);
    const tx = T.countdown;
    tx.image = c;
    tx.needsUpdate = true;
  };

  /* ---- Mỗi khung hình ---- */
  let lastCx = 0, wheelRot = 0, puffClock = 0;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();

  function update(s) {
    const { t, dt, cx, cy, visW, prog } = s;
    const dx = cx - lastCx;
    lastCx = cx;
    const v = dt > 0 ? dx / dt : 0;
    U.uStep.value = reduceMotion ? 0 : Math.floor(t * 5) % 40;
    tintAt(cx, U.uTint.value);

    for (const p of puppets) p.update(t, dt, cx, visW);

    // Sóng trượt ngược nhau, đất biển nhấp nhô
    if (cx > 60 && cx < 130) {
      for (const w of waves) {
        if (!w.near) continue;
        const r = w.waveRow;
        w.group.position.x = w.x + Math.sin(t * 0.55 + r * 1.7) * 0.75 * (r % 2 ? 1 : -1);
        w.group.position.y = w.y + Math.sin(t * 0.95 + r * 0.9) * 0.2;
      }
      seaRows.forEach((m, i) => { m.position.y = Math.sin(t * 0.8 + i * 0.7) * 0.05; });
    }

    // Sợi tơ hồng chạy dần theo cuộn
    threadP.mesh.material.uniforms.uReveal.value = clamp((cx + visW * 0.42 - 19.7) / 14.6, 0, 1.02);

    // Nhẫn xoay theo cuộn và tự xoay nhẹ
    const ringOn = Math.abs(cx - 122) < visW + 8;
    rings.visible = ringOn;
    if (ringOn) {
      rings.rotation.y = Math.sin(t * 0.45) * 0.28 + prog * 14;
      rings.rotation.x = Math.sin(t * 0.33) * 0.12 + s.my * 0.12;
      rings.rotation.z = Math.sin(t * 0.25) * 0.05 + s.mx * 0.08;
      rings.position.y = 31 + Math.sin(t * 0.8) * 0.12;
    }

    if (cd.near) updateCountdown();

    /* Đôi bạn */
    couple.mesh.material.uniforms.uLit.value = clamp((cx - 134) / 14, 0, 1) * 0.72;
    const wanted = modeFor(cx);
    if (wanted !== couple.mode && !couple.turning) couple.turning = true;
    if (couple.turning) {
      couple.turn += dt * 6.5;
      if (couple.turn >= 1 && couple.mode !== wanted) setMode(wanted);
      if (couple.turn >= 2) { couple.turn = 0; couple.turning = false; }
    }
    const turnAngle = couple.turning ? Math.sin((Math.min(couple.turn, 2) / 2) * Math.PI) * (Math.PI / 2) : 0;

    if (Math.abs(v) > 0.8) couple.face = v > 0 ? 1 : -1;
    couple.faceV = damp(couple.faceV, couple.face, 9, dt);
    const offs = -Math.min(visW * (visW < 13 ? 0.11 : 0.2), 6.2);
    const ground = GY(coupleZ);
    const dist = s.camZ - coupleZ;
    const hVis = dist * 0.3153;
    let ty = ground - 0.02, rz = 0, extra = 0;
    const m = reduceMotion ? 0 : 1;
    if (couple.mode === 'bike') {
      extra = Math.abs(Math.sin(cx * 2.4)) * Math.min(Math.abs(v) * 0.012, 0.08) + Math.sin(t * 2.1) * 0.03 * m;
      rz = clamp(-v * 0.0035, -0.07, 0.07) + Math.sin(t * 1.5) * 0.006 * m;
    } else if (couple.mode === 'boat') {
      ty = ground - 0.15;
      extra = Math.sin(t * 1.15) * 0.14 * m;
      rz = Math.sin(t * 0.95) * 0.04 * m + clamp(-v * 0.002, -0.04, 0.04);
    } else if (couple.mode === 'balloon') {
      ty = Math.max(ground - 0.3, s.lookY + 1 - hVis * (visW < 13 ? 0.82 : 0.86));
      extra = Math.sin(t * 0.7) * 0.14 * m;
      rz = Math.sin(t * 0.5) * 0.022 * m;
    } else {
      extra = Math.abs(Math.sin(cx * 1.7)) * 0.2 + Math.sin(t * 2) * 0.02 * m;
      rz = Math.sin(cx * 1.7) * 0.035 + clamp(-v * 0.002, -0.04, 0.04);
    }
    couple.cy = damp(couple.cy, ty, couple.mode === 'balloon' ? 3.6 : 5, dt);
    const px = cx + offs, py = couple.cy + extra;
    couple.sp.kickV += (-couple.sp.kick * 110 - couple.sp.kickV * 7) * dt;
    couple.sp.kick += couple.sp.kickV * dt;
    couple.group.position.set(px, py, coupleZ);
    couple.group.rotation.set(0, turnAngle, rz + couple.sp.kick * 0.2);
    const sk = (1 + couple.sp.kick * 0.12) * (couple.mode === 'balloon' && visW < 13 ? 0.82 : 1);
    couple.group.scale.set(couple.faceV * sk, sk, 1);
    couple.sGroup.position.set(px + 0.8, py - 0.5, 0.022);
    couple.sGroup.rotation.z = rz;
    couple.sGroup.scale.set(couple.faceV * Math.cos(turnAngle), 1, 1);
    couple.x = px;
    couple.near = true;
    if (couple.mode === 'bike') {
      wheelRot -= dx / 0.51;
      wheels.forEach((w) => (w.rotation.z = wheelRot));
      puffClock += Math.abs(dx);
      if (puffClock > 0.7) {
        puffClock = 0;
        const back = couple.faceV > 0 ? -1.2 : 1.2;
        spawn(puffs, px + back * MODES.bike.w * 0.45, ground + 0.1, coupleZ - 0.05, -Math.sign(v || 1) * (0.6 + Math.random()), 0.4 + Math.random() * 0.4, 0.7, 0.25 + Math.random() * 0.2);
      }
    }

    updatePool(hearts, dt, -2.2);
    updatePool(puffs, dt, 0.1);

    // Cánh hoa bay lòng vòng quanh camera
    if (petalCount) {
      const wind = clamp(v * 0.05, -4, 4);
      const X = visW * 0.75, top = cy + 12, H = 24;
      pData.forEach((d, i) => {
        d.a += dt * d.f;
        d.y -= dt * (0.45 + d.f * 0.5);
        d.x += dt * (Math.sin(d.a * 2) * 0.45 - wind);
        if (d.x - cx > X) d.x -= 2 * X;
        if (d.x - cx < -X) d.x += 2 * X;
        if (d.y < cy - 12) d.y += H;
        if (d.y > top) d.y -= H;
        e4.set(d.a * 2.2, d.a * 1.4, d.a);
        q4.setFromEuler(e4);
        pos.set(d.x, d.y, d.z);
        sc.setScalar(cx > 138 ? d.s * 0.9 : d.s);
        m4.compose(pos, q4, sc);
        petals.setMatrixAt(i, m4);
      });
      petals.instanceMatrix.needsUpdate = true;
    }

    // Dây đèn lấp lánh khi trời tối
    const night = clamp((cx - 132) / 14, 0, 1);
    glowMat.uniforms.uK.value = night * 0.9;
    if (night > 0.01) {
      bulbs.forEach((b, i) => {
        const k = b.s * (0.9 + 0.22 * Math.sin(t * 2.2 + b.ph)) * 1.4;
        pos.set(b.x, b.y, 0);
        q4.identity();
        sc.set(k, k, 1);
        m4.compose(pos, q4, sc);
        glowInst.setMatrixAt(i, m4);
      });
      glowInst.instanceMatrix.needsUpdate = true;
    }
  }

  /* ---- Chạm và rê chuột ---- */
  const ray = new THREE.Raycaster();
  const pick = (ndc, camera) => {
    ray.setFromCamera(ndc, camera);
    const live = pickable.filter((m) => m.parent.visible);
    live.push(couple.mesh);
    const hit = ray.intersectObjects(live, false)[0];
    return hit ? { p: hit.object.userData.p, point: hit.point } : null;
  };
  const tap = (ndc, camera) => {
    const h = pick(ndc, camera);
    if (!h) return false;
    h.p.kick();
    const n = h.p === couple ? 12 : 5;
    for (let i = 0; i < n; i++) spawnHeart(h.point.x, h.point.y, h.p.z + 0.2);
    return true;
  };

  // Đưa texture lên GPU trước để lần cuộn đầu tiên không bị khựng
  const all = Object.values(T);
  for (let i = 0; i < all.length; i++) {
    renderer.initTexture(all[i]);
    if (i % 5 === 4) await breathe();
  }

  return { scene, update, pick, tap, puppets, couple, rings, GY };
}
