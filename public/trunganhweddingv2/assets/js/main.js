// Điều khiển chính: cuộn gốc của trình duyệt quyết định vị trí camera trên đường cong.
// Không chặn cuộn, không ghim: trang cuộn thật, camera chỉ đi theo.
import * as THREE from 'three';
import { createWorld } from './world.js';

const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOV = 35, TAN2 = 2 * Math.tan((FOV / 2) * Math.PI / 180);

// Các điểm camera đi qua: x, y, z
const KEYS = [
  [1, 4.2, 24], [14, 4.2, 24], [27, 4.4, 23.5], [41, 4.2, 23], [60, 4.2, 23], [76, 4, 24],
  [88.4, 3.8, 24], [104, 4, 24], [112, 7, 24], [115.6, 15, 23], [118.4, 23, 23], [122, 30.6, 24],
  [127.4, 24.4, 24], [132, 13.6, 24], [138, 7, 24], [147, 4.6, 24], [157.6, 4.6, 24], [168.2, 4.6, 24],
  [178.8, 4.6, 23.5], [189.4, 4.8, 23.5],
];
// Mục lục nhỏ: chỉ số điểm camera tương ứng
const STOPS = { 'loi-moi': 0, 'hai-nha': 2, album: 4, 'ngay-cuoi': 11, 'dia-diem': 15, 'cam-on': 19 };
// Những cảnh camera đi chậm lại, không dừng hẳn: [điểm camera, mức chậm, độ rộng theo đơn vị thế giới].
// Tốc độ thấp nhất khoảng 40% nên trang không bao giờ có cảm giác bị ghim.
const DWELL = [[2, 0.6, 7], [11, 1.5, 9], [13, 0.7, 5], [16, 0.7, 7], [19, 0.8, 6]];

const params = new URLSearchParams(location.search);
const guest = (params.get('k') || '').trim().slice(0, 48);
if (guest) { const el = $('#guestName'); if (el) el.textContent = guest; }

function fail() {
  root.classList.remove('gl');
  root.classList.add('no-gl');
  $('#loader')?.remove();
}

function supportsGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

async function boot() {
  if (!supportsGL()) return fail();
  const bar = $('#loadBar');
  const setBar = (v) => { bar.style.transform = `scaleX(${clamp(v, 0, 1)})`; };

  const sample = 'Trân trọng kính mời Viết Trung Bùi Anh Tháng Thứ Bảy Ngọ ệ ữ ấ ầ ụ ỡ ở ợ ồ ộ ổ ả ạ ă đ Save the Date';
  await Promise.all([
    document.fonts.load('48px "Patrick Hand"', sample),
    document.fonts.load('48px "Great Vibes"', sample),
  ]);

  const canvas = $('#stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0xfbfbf7);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let dpr = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 2 : 1.75);
  renderer.setPixelRatio(dpr);

  const world = await createWorld(renderer, { guest, onProgress: setBar });
  canvas.addEventListener('webglcontextlost', () => location.reload());
  const camera = new THREE.PerspectiveCamera(FOV, 1, 2, 130);

  /* ---- Bố cục theo khung hình ---- */
  let curve, stopS = {}, layoutW = 0, aspect = 1, dpxTotal = 1, visW0 = 26, maxS = 1, smooth = 0.22, railW = 1;
  const track = $('#track');
  const glass = { root: $('#progressBar'), rail: $('#progressRail'), sheen: $('#progressSheen') };
  // Chiều cao màn hình khi thanh địa chỉ đã thu lại, để khung 3D không bị kéo dọc trên điện thoại
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.append(probe);
  // Bảng đổi vị trí cuộn s (0..1) sang vị trí trên đường cong u (0..1)
  const SAMPLES = 1600;
  const sOfU = new Float32Array(SAMPLES + 1), uOfS = new Float32Array(SAMPLES + 1);
  const lerpTable = (table, x) => {
    const f = clamp(x, 0, 1) * SAMPLES, i = Math.min(SAMPLES - 1, f | 0);
    return table[i] + (table[i + 1] - table[i]) * (f - i);
  };

  function layout(force) {
    const w = innerWidth, h = Math.max(innerHeight, probe.offsetHeight);
    // Trên điện thoại, thanh địa chỉ co giãn không được làm giật camera
    const touch = matchMedia('(pointer: coarse)').matches;
    if (!force && touch && w === layoutW) return;
    const before = maxS > 1 ? scrollY / maxS : 0;
    layoutW = w;
    smooth = touch ? 0.12 : 0.22;
    aspect = w / h;
    const base = 24;
    const needZ = 10.8 / (aspect * TAN2);
    const zK = Math.max(1, needZ / base);
    const halfH = (z) => (z * TAN2) / 2;
    const yOff = (halfH(base * zK) - halfH(base)) * 0.42;
    // Màn dọc: đoạn bay lên đặt nội dung cao hơn để khinh khí cầu ở đáy không che chữ
    const tallShift = zK > 1.2 ? 3 : 0;
    const pts = KEYS.map(([x, y, z], i) => new THREE.Vector3(x, y + yOff - (i >= 9 && i <= 13 ? tallShift : 0), z * zK));
    curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    curve.arcLengthDivisions = 2400;
    curve.updateArcLengths();
    const zAvg = base * zK;
    visW0 = zAvg * TAN2 * aspect;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    // Một lần cuộn bằng chiều cao màn hình đi được khoảng 0,8 màn hình theo chiều ngang, trên điện thoại là 1 màn hình
    const pxPerUnit = h / (visW0 * (touch ? 1 : 0.8));
    const len = curve.getLength();
    // Tìm vị trí trên đường cong ứng với từng điểm camera
    const v = new THREE.Vector3();
    const keyD = pts.map(() => 1e9), keyU = pts.map(() => 0);
    for (let i = 0; i <= SAMPLES; i++) {
      curve.getPointAt(i / SAMPLES, v);
      pts.forEach((p, k) => {
        const d = v.distanceToSquared(p);
        if (d < keyD[k]) { keyD[k] = d; keyU[k] = i / SAMPLES; }
      });
    }
    // Chậm lại quanh các cảnh chính: cùng một quãng đường nhưng tốn nhiều pixel cuộn hơn
    let sum = 0;
    sOfU[0] = 0;
    for (let i = 1; i <= SAMPLES; i++) {
      const u = (i - 0.5) / SAMPLES;
      let weight = 1;
      for (const [idx, amount, width] of DWELL) {
        const d = ((u - keyU[idx]) * len) / width;
        weight += amount * Math.exp(-d * d);
      }
      sum += weight;
      sOfU[i] = sum;
    }
    for (let i = 0; i <= SAMPLES; i++) sOfU[i] /= sum;
    for (let j = 0, i = 0; j <= SAMPLES; j++) {
      const s = j / SAMPLES;
      while (i < SAMPLES - 1 && sOfU[i + 1] < s) i++;
      uOfS[j] = (i + (s - sOfU[i]) / Math.max(1e-7, sOfU[i + 1] - sOfU[i])) / SAMPLES;
    }
    dpxTotal = len * pxPerUnit * (sum / SAMPLES);
    const trackH = Math.round(dpxTotal + h);
    track.style.height = `${trackH}px`;
    maxS = Math.max(1, trackH - h);
    railW = glass.root.clientWidth || 1;
    // Vị trí cuộn ứng với từng phần của mục lục
    stopS = {};
    for (const [id, idx] of Object.entries(STOPS)) stopS[id] = lerpTable(sOfU, keyU[idx]);
    if (before) scrollTo(0, before * maxS);
  }
  layout(true);
  addEventListener('resize', () => layout(false));
  addEventListener('orientationchange', () => setTimeout(() => layout(true), 200));

  /* ---- Bay tới một vị trí: thời gian theo quãng đường để kịp nhìn cảnh, chạm là dừng ---- */
  let fly = null, coast = 0, coastY = 0;
  const flyTo = (top) => {
    coast = 0;
    const dist = Math.abs(top - scrollY);
    if (reduceMotion || dist < 2) { fly = null; scrollTo(0, top); return; }
    fly = { from: scrollY, top, t0: performance.now(), dur: clamp(0.7 + (dist / innerHeight) * 0.2, 0.8, 3.6) * 1000 };
  };
  const stopMoves = () => { fly = null; coast = 0; };
  addEventListener('wheel', stopMoves, { passive: true });
  addEventListener('touchstart', stopMoves, { passive: true });
  addEventListener('keydown', stopMoves);

  /* ---- Mục lục, nút hành động ---- */
  const goTo = (id, instant) => {
    const top = (stopS[id] ?? 0) * maxS;
    if (instant) { stopMoves(); scrollTo(0, top); } else flyTo(top);
  };

  /* ---- Kéo viên bi trên thanh tiến trình bằng chuột ---- */
  const barTop = (e) => {
    const r = glass.root.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1) * maxS;
  };
  let scrubbing = false, scrubX = 0;
  glass.root.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    scrubbing = true;
    scrubX = e.clientX;
    glass.root.setPointerCapture(e.pointerId);
    root.classList.add('scrubbing');
    flyTo(barTop(e));
  });
  glass.root.addEventListener('pointermove', (e) => {
    if (!scrubbing || Math.abs(e.clientX - scrubX) < 4) return;
    scrubX = -1e4;
    stopMoves();
    scrollTo(0, barTop(e));
  });
  const endScrub = () => { scrubbing = false; root.classList.remove('scrubbing'); };
  glass.root.addEventListener('pointerup', endScrub);
  glass.root.addEventListener('pointercancel', endScrub);

  document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.dataset.go;
    goTo(id);
    history.replaceState(null, '', `${location.search}#${id}`);
  }));

  const toast = $('#toast');
  let toastT = 0;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('on'), 2200);
  };
  $('#copyAddr').addEventListener('click', async (e) => {
    const addr = e.currentTarget.dataset.addr;
    try {
      await navigator.clipboard.writeText(addr);
      say('Đã sao chép địa chỉ');
    } catch {
      say(addr);
    }
  });

  /* ---- Chuột và chạm ---- */
  let mx = 0, my = 0, smx = 0, smy = 0;
  const ndc = new THREE.Vector2();
  let hoverDirty = false, hovered = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = (e.clientY / innerHeight) * 2 - 1;
    ndc.set(mx, -my);
    hoverDirty = true;
  }, { passive: true });

  // Rê chuột để cuộn giống trang mẫu. Trên điện thoại trình duyệt tự cuộn.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button === 0) {
      stopMoves();
      drag = { y: e.clientY, sy: scrollY, moved: 0, top: scrollY, vel: 0, ts: e.timeStamp };
    }
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    if (drag.moved > 6) {
      root.classList.add('dragging');
      const top = drag.sy - dy * 2.4;
      const ms = Math.max(1, e.timeStamp - drag.ts);
      drag.vel = drag.vel * 0.7 + ((top - drag.top) / ms) * 1000 * 0.3;
      drag.top = top;
      drag.ts = e.timeStamp;
      scrollTo(0, top);
    }
  });
  addEventListener('pointerup', (e) => {
    // Thả chuột khi đang kéo nhanh thì trang trôi thêm một đoạn rồi chậm dần
    if (drag && drag.moved > 6 && e.timeStamp - drag.ts < 80 && !reduceMotion) {
      coast = clamp(drag.vel, -5000, 5000);
      coastY = drag.top;
    }
    drag = null;
    root.classList.remove('dragging');
  });

  // Chạm vào hình thì hình nhún lên và thả tim
  canvas.addEventListener('click', (e) => {
    const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    if (dragMovedLast) return;
    world.tap(p, camera);
  });
  let dragMovedLast = false;
  canvas.addEventListener('pointerdown', () => { dragMovedLast = false; });
  addEventListener('pointermove', () => { if (drag && drag.moved > 6) dragMovedLast = true; }, { passive: true });

  /* ---- Vòng lặp ---- */
  const cam = new THREE.Vector3(), tan = new THREE.Vector3(), look = new THREE.Vector3();
  let prog = 0, sPos = 0, sVel = 0, speed = 0, last = performance.now(), slowFrames = 0, frames = 0, first = true;
  let barS = -1, barX = 1e9;
  const hud = {
    hint: $('#hint'), date: $('#actDate'), venue: $('#actVenue'), end: $('#actEnd'),
    bar: $('#progress'), tabs: [...document.querySelectorAll('.tabs a')],
  };
  let hintGone = false, curTab = -1, curAct = '';

  function hudUpdate(cx, u) {
    if (!hintGone && u > 0.006) { hintGone = true; hud.hint.classList.add('off'); }
    // Thanh tráng gương: lõi và viên bi đi theo cuộn, vệt phản chiếu trượt ngược chiều và lệch theo chuột
    const sheenX = -sPos * railW * 1.6 + smx * 24;
    if (Math.abs(sPos - barS) > 1e-5 || Math.abs(sheenX - barX) > 0.05) {
      barS = sPos;
      barX = sheenX;
      hud.bar.style.transform = `translate3d(${(sPos - 1) * 100}%,0,0)`;
      glass.rail.style.transform = `translate3d(${sPos * 100}%,0,0)`;
      glass.sheen.style.transform = `translate3d(${sheenX.toFixed(1)}px,0,0)`;
    }
    glass.sheen.style.opacity = (0.55 + speed * 0.45).toFixed(2);
    const act = cx > 113.4 && cx < 135 ? 'date' : cx > 143 && cx < 174 ? 'venue' : cx > 182 ? 'end' : '';
    if (act !== curAct) {
      curAct = act;
      hud.date.classList.toggle('on', act === 'date');
      hud.venue.classList.toggle('on', act === 'venue');
      hud.end.classList.toggle('on', act === 'end');
    }
    const tab = cx < 19 ? 0 : cx < 37 ? 1 : cx < 111 ? 2 : cx < 140 ? 3 : 4;
    if (tab !== curTab) {
      curTab = tab;
      hud.tabs.forEach((a, i) => (i === tab ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
    root.classList.toggle('dusk', cx > 138);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    if (fly) {
      const k = clamp((now - fly.t0) / fly.dur, 0, 1);
      const e = (1 - Math.cos(Math.PI * k)) / 2;
      scrollTo(0, fly.from + (fly.top - fly.from) * e);
      if (k >= 1) fly = null;
    } else if (coast) {
      coastY += coast * dt;
      coast *= Math.exp(-3.2 * dt);
      if (Math.abs(coast) < 30 || coastY <= 0 || coastY >= maxS) coast = 0;
      scrollTo(0, coastY);
    }
    const target = clamp(scrollY / maxS, 0, 1);
    if (reduceMotion || first) {
      sPos = target;
      sVel = 0;
    } else {
      // Lò xo tắt dần tới hạn: vận tốc liền mạch nên mỗi nấc lăn chuột không còn là một cú giật
      const omega = 2 / smooth, x = omega * dt;
      const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = sPos - target;
      const temp = (sVel + omega * change) * dt;
      sVel = (sVel - omega * temp) * decay;
      sPos = target + (change + temp) * decay;
    }
    prog = lerpTable(uOfS, sPos);
    curve.getPointAt(prog, cam);
    curve.getTangentAt(prog, tan);
    smx = damp(smx, reduceMotion ? 0 : mx, 3.2, dt);
    smy = damp(smy, reduceMotion ? 0 : my, 3.2, dt);

    // Đi nhanh thì camera lùi nhẹ và nhìn trước đường đi, đi chậm thì trở lại khung chuẩn
    const screensPerSec = reduceMotion ? 0 : (sVel * maxS) / innerHeight;
    speed = damp(speed, clamp(Math.abs(screensPerSec) / 3, 0, 1), 4, dt);
    const lead = clamp(screensPerSec, -2, 2) * 0.5;

    camera.position.set(cam.x + smx * 0.5, cam.y + 2.2 - smy * 0.32, cam.z * (1 + speed * 0.045));
    const tx = cam.x + tan.x * (0.8 + lead) + smx * 0.2;
    const ty = cam.y - 1 + tan.y * (2.2 + lead) - smy * 0.1;
    if (first) look.set(tx, ty, 0);
    look.x = damp(look.x, tx, 8, dt);
    look.y = damp(look.y, ty, 5, dt);
    camera.lookAt(look.x, look.y, 0);

    world.update({ t, dt: first ? 0.016 : dt, cx: cam.x, cy: cam.y, camZ: cam.z, visW: visW0, prog, mx: smx, my: smy, lookY: look.y });

    if (hoverDirty) {
      hoverDirty = false;
      const h = drag ? null : world.pick(ndc, camera);
      const p = h ? h.p : null;
      if (p !== hovered) {
        hovered = p;
        if (p) p.kick();
        root.classList.toggle('over', !!p);
      }
    }

    renderer.render(world.scene, camera);
    hudUpdate(cam.x, sPos);

    // Máy yếu thì giảm độ phân giải thay vì giật
    frames++;
    if (dt > 0.03) slowFrames++;
    if (frames === 90) {
      if (slowFrames > 45 && dpr > 1) {
        dpr = Math.max(1, dpr * 0.82);
        renderer.setPixelRatio(dpr);
        renderer.setSize(innerWidth, innerHeight, false);
      }
      frames = 0; slowFrames = 0;
    }
    first = false;
  }

  // Mở đúng phần nếu liên kết có dấu #
  const hash = location.hash.slice(1);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (stopS[hash] !== undefined) goTo(hash, true); else scrollTo(0, 0);

  setBar(1);
  requestAnimationFrame((n) => { last = n; frame(n); });
  await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 500));
  root.classList.add('ready');
  setTimeout(() => $('#loader')?.remove(), 1100);

  window.__thiep = { world, camera, renderer, get prog() { return prog; }, get sPos() { return sPos; }, get cx() { return cam.x; }, get cy() { return cam.y; }, get stopS() { return stopS; }, get maxS() { return maxS; } };
}

boot().catch((err) => { console.error(err); fail(); });
