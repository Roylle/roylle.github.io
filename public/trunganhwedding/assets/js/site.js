/* Viết Trung & Bùi Anh: sợi tơ, ba cảnh cuộn, khoanh ngày 28, tên khách mời, đếm ngược.
   Cuộn gốc của trình duyệt (không chặn wheel). Mọi thứ theo cuộn chỉ dùng transform và đoạn tơ ngắn. */
(() => {
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => matchMedia('(max-width: 767px)').matches;
  const idle = (fn, ms = 1200) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: ms }) : setTimeout(fn, 300));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    seen() { try { return sessionStorage.getItem('ta-seen'); } catch { return '1'; } },
    mark() { try { sessionStorage.setItem('ta-seen', '1'); } catch {} },
  };

  /* ---------- Cắt ảnh theo khuôn mặt: đầu luôn nằm trọn trong khung ở mọi kích thước ---------- */
  const focusImages = () => {
    $$('img[data-focus]').forEach((img) => {
      const cw = img.clientWidth, ch = img.clientHeight;
      if (!cw || !ch) return;
      const ar = (+img.getAttribute('width')) / (+img.getAttribute('height'));
      const [x0, y0, x1] = img.dataset.focus.split(',').map(Number);
      const scale = Math.max(cw / (ar * 1000), ch / 1000);
      const W = ar * 1000 * scale, H = 1000 * scale;
      const top = (+img.dataset.top || .12) * ch;
      const px = W > cw ? clamp((((x0 + x1) / 2) * W - cw / 2) / (W - cw)) : .5;
      const py = H > ch ? clamp((y0 * H - top) / (H - ch)) : .5;
      img.style.objectPosition = `${(px * 100).toFixed(2)}% ${(py * 100).toFixed(2)}%`;
    });
  };

  /* ---------- Màn chờ rất ngắn ---------- */
  const loader = $('#loader');
  const heroArch = $('#heroArch');
  let threadIntro = reduced() ? 1 : 0;
  const startHero = () => {
    heroArch.classList.add('is-in');
    if (window.gsap && !reduced()) gsap.to({ v: 0 }, { v: 1, duration: 1.6, delay: .3, ease: 'power2.inOut', onUpdate() { threadIntro = this.targets()[0].v; requestTick(); } });
    else { threadIntro = 1; requestTick(); }
  };
  if (!reduced() && !store.seen()) {
    html.classList.add('is-first');
    html.style.setProperty('--intro', '300ms');
    const count = $('#loaderCount');
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / 460);
      count.textContent = String(1 + Math.round(27 * k * k * (3 - 2 * k)));
      if (k < 1) requestAnimationFrame(step);
      else {
        loader.classList.add('is-out');
        startHero();
        setTimeout(() => { html.classList.remove('is-first'); }, 460);
      }
    };
    requestAnimationFrame(step);
    store.mark();
  } else {
    requestAnimationFrame(startHero);
  }

  /* ---------- Sợi tơ ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const smooth = (pts, tension = .5) => {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const k = tension / 3;
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  // Vị trí hai ngón út trong ảnh gốc
  const PINKY = [2590 / 4672, 2530 / 7008];
  const pinkyIn = (sec) => {
    const s = sec.getBoundingClientRect(), ir = 4672 / 7008;
    const box = heroArch.getBoundingClientRect();
    const img = $('#heroImg');
    const bw = img.clientWidth || box.width, bh = img.clientHeight || box.height;
    const [ppx, ppy] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    let w, h;
    if (bw / bh > ir) { w = bw; h = w / ir; } else { h = bh; w = h * ir; }
    return [box.left - s.left + (bw - w) * (isNaN(ppx) ? .5 : ppx) + w * PINKY[0], heroArch.offsetTop + (bh - h) * (isNaN(ppy) ? .16 : ppy) + h * PINKY[1]];
  };
  const centerIn = (el, sec) => {
    const r = el.getBoundingClientRect(), s = sec.getBoundingClientRect();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2, r.width, r.height];
  };
  // Điểm nối giữa hai chương. Sợi tơ đi trong lề và khoảng trống, tránh cắt qua chữ.
  const X = { hero: .34, invite: .7, vortex: .14, stair: .86, date: .3, count: .86, hall: .42, venue: .12, route: .9 };
  const EDGE_L = .012, EDGE_R = .988;
  const phoneRoute = (w, h, xIn, xOut) => {
    const e = xOut > .5 ? w - 6 : 6;
    return [[w * xIn, 0], [w * .5, 28], [e, 62], [e, h * .55], [e, h - 24], [w * xOut, h]];
  };
  const PX = { hero: .5, invite: .985, stair: .015, date: .985, count: .015, hall: .985, venue: .015, route: .985 };

  const routes = {
    hero(w, h, sec) {
      const [px, py] = pinkyIn(sec);
      if (isPhone()) return [[px, py], [w * .98, py + 34], [w * .98, h - 14], [w * .5, h]];
      return [[px, py], [px + 48, py + 10], [w * .69, h * .83], [w * .58, h * .94], [w * .4, h * .91], [w * X.hero, h]];
    },
    invite(w, h) {
      if (isPhone()) return phoneRoute(w, h, PX.hero, PX.invite);
      return [[w * X.hero, 0], [w * .1, 26], [w * .34, 58], [w * .8, 36], [w * EDGE_R, 80], [w * EDGE_R, h * .5], [w * EDGE_R, h * .86], [w * .8, h * .97], [w * X.invite, h]];
    },
    vortex(w, h) {
      const c = [w * .5, h * .5], R = Math.min(w, h) * .44, pts = [[(isPhone() ? PX.invite : X.invite) * w, 0]];
      for (let a = -1.2, r = 1; r > .08; a += .42, r -= .05) pts.push([c[0] + Math.cos(a) * R * r * 1.2, c[1] + Math.sin(a) * R * r]);
      pts.push([c[0], c[1]]);
      for (let a = 2.2, r = .1; r < .95; a += .45, r += .1) pts.push([c[0] + Math.cos(a) * R * r * 1.2, c[1] + Math.sin(a) * R * r]);
      pts.push([w * (isPhone() ? PX.stair : X.vortex), h]);
      return pts;
    },
    stair(w, h) {
      if (isPhone()) return phoneRoute(w, h, PX.stair, PX.stair);
      return [[w * X.vortex, 0], [w * EDGE_L, h * .16], [w * EDGE_L, h * .7], [w * .1, h * .97], [w * .42, h * .93], [w * .66, h * .95], [w * X.stair, h]];
    },
    date(w, h, sec) {
      const [cx, cy, cw, ch] = centerIn($('#d28'), sec);
      const r = Math.max(cw, ch) * .62;
      if (isPhone()) return [[w * PX.stair, 0], [w * .5, 42], [w - 6, 90], [w - 6, cy - r * 3], [w - 6, cy], [cx + r * .5, cy + r * 1.15], [cx - r * 3, cy + r * 1.7], [6, cy + r * 3], [6, h - 30], [w * PX.date, h]];
      return [[w * X.stair, 0], [w * EDGE_R, h * .1], [w * EDGE_R, cy - r * 2], [w * EDGE_R, cy], [cx + r * .55, cy + r * 1.15], [cx - r * 2.6, cy + r * 1.75], [w * .49, cy + r * 1.8], [w * .49, h * .95], [w * X.date, h]];
    },
    count(w, h) {
      if (isPhone()) return phoneRoute(w, h, PX.date, PX.count);
      return [[w * X.date, 0], [w * .14, 20], [w * .3, 48], [w * .72, 34], [w * EDGE_R, 66], [w * EDGE_R, h * .2], [w * EDGE_R, h * .6], [w * X.count, h]];
    },
    hall(w, h) {
      if (isPhone()) return [[w * PX.count, 0], [w * .5, 44], [w - 6, 96], [w - 6, h * .6], [w * PX.hall, h]];
      return [[w * X.count, 0], [w * EDGE_R, h * .08], [w * EDGE_R, h * .5], [w * .7, h * .85], [w * X.hall, h]];
    },
    venue(w, h) {
      if (isPhone()) return phoneRoute(w, h, PX.hall, PX.venue);
      return [[w * X.hall, 0], [w * .8, h * .012], [w * EDGE_R, h * .05], [w * EDGE_R, h * .5], [w * EDGE_R, h * .88], [w * .55, h * .975], [w * X.venue, h]];
    },
    route(w, h) {
      if (isPhone()) return phoneRoute(w, h, PX.venue, PX.route);
      return [[w * X.venue, 0], [w * .55, 30], [w * EDGE_R, 62], [w * EDGE_R, h * .5], [w * EDGE_R, h * .94], [w * X.route, h]];
    },
    thanks(w, h, sec) {
      const [tx, ty, tw, th] = centerIn($('.thanks-grid h2'), sec);
      const left = tx - tw / 2, top = ty - th / 2;
      if (isPhone()) return [[w * PX.route, 0], [w * .6, top * .25], [w * .3, top * .45], [left + 16, top - 24]];
      return [[w * X.route, 0], [w * .7, top * .25], [w * .36, top * .34], [w * .14, top * .5], [w * .2, top * .7], [left + 44, top - 22]];
    },
  };

  const threads = $$('[data-thread]').map((sec) => {
    const host = sec.querySelector(':scope > .scene-stage') || sec;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'thread');
    svg.setAttribute('aria-hidden', 'true');
    const probe = document.createElementNS(NS, 'path');
    probe.setAttribute('class', 'thread-probe');
    svg.append(probe);
    host.prepend(svg);
    return { sec, host, svg, probe, key: sec.dataset.thread, len: 0, chunks: [], idx: -1, frac: -1, endY: 0 };
  });

  // Chia sợi tơ thành đoạn ngắn để mỗi lần cuộn chỉ vẽ lại một đoạn nhỏ
  const CHUNK = 220, STEP = 6;
  const layoutThreads = () => {
    threads.forEach((t) => {
      const r = t.host.getBoundingClientRect();
      const w = r.width, h = r.height;
      if (!w || !h) return;
      t.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const pts = routes[t.key](w, h, t.host);
      t.probe.setAttribute('d', smooth(pts));
      t.len = t.probe.getTotalLength();
      t.endY = Math.max(...pts.map((q) => q[1]));
      t.chunks.forEach((c) => c.remove());
      t.chunks = [];
      const n = Math.ceil(t.len / CHUNK);
      for (let i = 0; i < n; i++) {
        const a = i * CHUNK, b = Math.min(t.len, a + CHUNK);
        let d = '';
        for (let l = a; l < b + STEP; l += STEP) {
          const q = t.probe.getPointAtLength(Math.min(l, b));
          d += `${d ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
        const c = document.createElementNS(NS, 'path');
        c.setAttribute('d', d);
        c.setAttribute('visibility', 'hidden');
        c.style.strokeDasharray = `0 ${CHUNK * 2}`;
        t.svg.append(c);
        t.chunks.push(c);
      }
      t.idx = -1; t.frac = -1;
      if (t.key === 'thanks') {
        const end = pts[pts.length - 1], heart = $('#endHeart');
        heart.style.left = `${end[0]}px`; heart.style.top = `${end[1]}px`;
      }
    });
    tick();
  };
  const paintThread = (t, p) => {
    if (!t.chunks.length) return;
    const cur = t.len * p;
    const idx = Math.min(t.chunks.length - 1, Math.floor(cur / CHUNK));
    const frac = Math.round(cur - idx * CHUNK);
    if (idx === t.idx && frac === t.frac) return;
    if (idx !== t.idx) {
      t.chunks.forEach((c, i) => {
        if (i < idx) { c.setAttribute('visibility', 'visible'); c.style.strokeDasharray = 'none'; }
        else if (i > idx) c.setAttribute('visibility', 'hidden');
      });
      t.chunks[idx].setAttribute('visibility', 'visible');
    }
    t.chunks[idx].style.strokeDasharray = `${frac} ${CHUNK * 2}`;
    t.idx = idx; t.frac = frac;
  };

  /* ---------- Một nhịp duy nhất cho mọi thứ theo cuộn ---------- */
  const bar = $('#bar');
  const fields = $$('.chapter, .board').map((el) => ({ el }));
  const readFields = () => fields.forEach((f) => { const cs = getComputedStyle(f.el); f.bg = cs.getPropertyValue('--bg'); f.ink = cs.getPropertyValue('--ink'); });
  let lastY = scrollY, barField = null, scheduled = false;
  const requestTick = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(tick); } };
  function tick() {
    scheduled = false;
    const vh = innerHeight, y = scrollY;
    threads.forEach((t) => {
      const r = t.sec.getBoundingClientRect();
      if (t.key !== 'hero' && (r.bottom < -40 || r.top > vh + 40)) return;
      let p;
      if (t.sec.classList.contains('is-live')) p = clamp((vh * .75 - r.top) / (r.height - vh + vh * .75));
      else p = clamp((vh * .8 - r.top) / (t.endY || r.height));
      if (t.key === 'hero') p = threadIntro;
      if (reduced()) p = 1;
      paintThread(t, p);
      if (t.key === 'thanks') $('#endHeart').classList.toggle('is-in', p > .985);
    });
    if (Math.abs(y - lastY) > 6) { bar.classList.toggle('is-hidden', y > lastY && y > 200); lastY = y; }
    const under = fields.find((f) => { const r = f.el.getBoundingClientRect(); return r.top <= 34 && r.bottom > 34; });
    if (under && under !== barField) {
      barField = under;
      bar.classList.toggle('is-over-hero', under.el.classList.contains('hero'));
      bar.style.setProperty('--bar-bg', under.bg);
      bar.style.setProperty('--bar-ink', under.ink);
    }
  }
  addEventListener('scroll', requestTick, { passive: true });

  /* ---------- Xuất hiện: bắt đầu trước khi vào khung để không phải chờ ---------- */
  const groups = new Map();
  const revealEls = $$('.rv, .rv-line, .rv-row, figure.rv-pic');
  revealEls.forEach((el) => {
    const parent = el.closest('section, footer');
    const n = groups.get(parent) || 0;
    groups.set(parent, n + 1);
    el.style.setProperty('--d', `${Math.min(n, 3) * 45}ms`);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px 12% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else revealEls.forEach((el) => el.classList.add('is-in'));

  /* ---------- Ánh sáng và cánh hoa tạm dừng khi ra khỏi màn hình ---------- */
  const atmospheres = $$('.wedding-atmosphere');
  if ('IntersectionObserver' in window) {
    const ambientObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }));
    atmospheres.forEach((el) => ambientObserver.observe(el));
  } else atmospheres.forEach((el) => el.classList.add('is-visible'));

  /* ---------- Tên khách mời ---------- */
  const guest = $('#guest');
  const heroGuest = $('#heroGuest');
  const fitGuest = () => {
    guest.style.fontSize = '';
    const text = guest.value || guest.placeholder;
    const cs = getComputedStyle(guest);
    const ctx = fitGuest.c || (fitGuest.c = document.createElement('canvas').getContext('2d'));
    const size = parseFloat(cs.fontSize);
    ctx.font = `${size}px ${cs.fontFamily}`;
    const need = ctx.measureText(text).width + size * .4;
    if (need > guest.clientWidth) guest.style.fontSize = `${Math.floor(size * guest.clientWidth / need)}px`;
  };
  const applyGuest = (name) => {
    const n = name.trim();
    heroGuest.textContent = n ? `Trân trọng kính mời ${n} dự lễ thành hôn.` : 'Trân trọng kính mời bạn dự lễ thành hôn.';
  };
  const qs = new URLSearchParams(location.search).get('k');
  if (qs) { guest.value = qs.slice(0, 48); applyGuest(guest.value); }
  guest.addEventListener('input', () => {
    applyGuest(guest.value);
    fitGuest();
    const u = new URL(location.href);
    if (guest.value.trim()) u.searchParams.set('k', guest.value.trim()); else u.searchParams.delete('k');
    try { history.replaceState(null, '', u); } catch {}
  });

  /* ---------- Khoanh ngày 28 ---------- */
  const cal = $('#cal'), ink = $('#calInk'), stroke = $('#calStroke'), ghost = $('#calGhost'), zone = $('#calZone'), note = $('#calNote'), d28 = $('#d28');
  const ringPath = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = -2.4 + (i / 40) * (Math.PI * 2 + .35);
      const rr = r * (1 + .05 * Math.sin(i * .5) - i * .0011);
      pts.push([cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr * .96]);
    }
    return smooth(pts);
  };
  const cellGeom = () => {
    const c = cal.getBoundingClientRect(), b = d28.getBoundingClientRect();
    return { cx: b.left - c.left + b.width / 2, cy: b.top - c.top + b.height / 2, r: Math.max(b.width, b.height) * .62, w: c.width, h: c.height };
  };
  const settleRing = (animate) => {
    const g = cellGeom();
    stroke.setAttribute('d', ringPath(g.cx, g.cy, g.r));
    const L = stroke.getTotalLength();
    stroke.style.strokeDasharray = `${L} ${L}`;
    stroke.style.transition = 'none';
    stroke.style.strokeDashoffset = animate && !reduced() ? L : 0;
    if (animate && !reduced()) requestAnimationFrame(() => requestAnimationFrame(() => {
      stroke.style.transition = 'stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)';
      stroke.style.strokeDashoffset = 0;
    }));
  };
  const layoutCal = () => {
    const g = cellGeom();
    ink.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`);
    const pad = g.r * 1.7;
    Object.assign(zone.style, { left: `${g.cx - pad}px`, top: `${g.cy - pad}px`, width: `${pad * 2}px`, height: `${pad * 2}px` });
    if (!cal.classList.contains('is-done')) ghost.setAttribute('d', ringPath(g.cx, g.cy, g.r));
    else settleRing(false);
  };
  const finish = (animate = true) => {
    cal.classList.add('is-done');
    settleRing(animate);
    note.textContent = 'Đã khoanh ngày 28. Hẹn bạn lúc 18 giờ 00 tại W. Jardin.';
    store.set('ta-circled', '1');
  };
  let drawing = null;
  const addPoint = (e) => {
    const c = cal.getBoundingClientRect();
    drawing.pts.push([e.clientX - c.left, e.clientY - c.top]);
    stroke.setAttribute('d', drawing.pts.length > 1 ? smooth(drawing.pts) : '');
  };
  zone.addEventListener('pointerdown', (e) => {
    if (cal.classList.contains('is-done')) return;
    e.preventDefault();
    zone.setPointerCapture(e.pointerId);
    drawing = { pts: [] };
    stroke.style.strokeDasharray = 'none'; stroke.style.transition = 'none'; stroke.style.strokeDashoffset = 0;
    addPoint(e);
  });
  zone.addEventListener('pointermove', (e) => { if (drawing) addPoint(e); });
  zone.addEventListener('pointerup', () => {
    if (!drawing) return;
    const { pts } = drawing; drawing = null;
    const g = cellGeom();
    let turn = 0, travel = 0;
    for (let i = 1; i < pts.length; i++) {
      const a0 = Math.atan2(pts[i - 1][1] - g.cy, pts[i - 1][0] - g.cx), a1 = Math.atan2(pts[i][1] - g.cy, pts[i][0] - g.cx);
      let da = a1 - a0; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
      turn += da; travel += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    if (Math.abs(turn) > Math.PI * 1.45 || travel < 14) finish(true);
    else { stroke.setAttribute('d', ''); note.textContent = 'Gần được rồi, thử khoanh trọn một vòng quanh số 28 nhé.'; }
  });
  zone.addEventListener('pointercancel', () => { drawing = null; stroke.setAttribute('d', ''); });
  d28.addEventListener('click', () => { if (!cal.classList.contains('is-done')) finish(true); });

  /* ---------- Đếm ngược ---------- */
  const TARGET = Date.UTC(2026, 10, 28, 11, 0, 0);
  const cd = { d: $('#cdDays'), timerDays: $('#cdTimerDays'), h: $('#cdHours'), m: $('#cdMinutes'), s: $('#cdSeconds'), clock: $('#cdClock') };
  const pad = (n) => String(n).padStart(2, '0');
  const tickCd = () => {
    const s = Math.floor(Math.max(0, TARGET - Date.now()) / 1000);
    const days = Math.floor(s / 86400), hours = Math.floor(s / 3600) % 24, minutes = Math.floor(s / 60) % 60, seconds = s % 60;
    cd.d.textContent = String(days);
    cd.timerDays.textContent = pad(days);
    cd.h.textContent = pad(hours); cd.m.textContent = pad(minutes); cd.s.textContent = pad(seconds);
    cd.clock.setAttribute('aria-label', `Còn ${days} ngày, ${hours} giờ, ${minutes} phút, ${seconds} giây đến lễ thành hôn`);
    const started = Date.now() >= TARGET;
    if (started !== $('#dem-nguoc').classList.contains('is-celebrating')) {
      $('#dem-nguoc').classList.toggle('is-celebrating', started);
      $('#countIntro').textContent = started ? 'Ngày chung đôi đã đến!' : 'Đếm ngược đến ngày thành hôn';
      $('#countClockTitle').textContent = started ? 'Từ hôm nay, một hành trình mới.' : 'Và từng khoảnh khắc đang đến gần';
      $('#countNote').textContent = started ? 'Cảm ơn bạn đã cùng chúng mình chung vui.' : 'Hẹn gặp bạn trong ngày hạnh phúc của chúng mình.';
    }
  };
  tickCd(); setInterval(tickCd, 1000);

  /* ---------- Sao chép địa chỉ ---------- */
  const copy = $('#copyAddr');
  copy.addEventListener('click', async () => {
    const txt = copy.dataset.addr;
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; }
    catch {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch {} ta.remove();
    }
    copy.textContent = ok ? 'Đã sao chép' : txt;
    if (ok) setTimeout(() => { copy.textContent = 'Sao chép địa chỉ'; }, 1800);
  });

  /* ---------- Bản đồ: chỉ tải khi đã ở gần và ngừng cuộn ---------- */
  const mapFrame = $('#mapFrame');
  if (mapFrame && 'IntersectionObserver' in window) {
    let near = false, timer;
    const tryLoad = () => { if (near && !mapFrame.getAttribute('src')) mapFrame.src = mapFrame.dataset.src; };
    new IntersectionObserver((es) => { near = es[0].isIntersecting; clearTimeout(timer); timer = setTimeout(tryLoad, 260); }, { rootMargin: '30% 0px' }).observe(mapFrame);
    addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(tryLoad, 260); }, { passive: true });
  } else if (mapFrame) mapFrame.src = mapFrame.dataset.src;

  /* ---------- Đôi nhẫn 3D: dựng sẵn lúc rảnh, không dựng khi đang cuộn ---------- */
  const ringState = { p: 0, visible: false, started: false, render: null, resize: null };
  const startRings = async () => {
    if (ringState.started) return;
    ringState.started = true;
    try {
      const canvas = $('#rings');
      const THREE = await import('../vendor/three.module.min.js');
      const { RoomEnvironment } = await import('../vendor/RoomEnvironment.js');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone() ? 1.5 : 1.6));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      const scene = new THREE.Scene();
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
      pm.dispose();
      const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
      const gold = new THREE.MeshStandardMaterial({ color: 0xf0bc9c, metalness: 1, roughness: .18 });
      const band = (R, w, t) => {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          pts.push(new THREE.Vector2(R + Math.cos(a) * t, Math.sin(a) * w));
        }
        const g = new THREE.LatheGeometry(pts, 96);
        g.rotateX(Math.PI / 2);
        return g;
      };
      const a = new THREE.Group(), b = new THREE.Group();
      a.add(new THREE.Mesh(band(1, .15, .055), gold));
      b.add(new THREE.Mesh(band(1, .09, .05), gold));
      const stone = new THREE.Mesh(new THREE.OctahedronGeometry(.17, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .02, flatShading: true, envMapIntensity: 3, clearcoat: 1 }));
      stone.position.set(0, 1.17, 0);
      stone.scale.y = .8;
      const setting = new THREE.Mesh(new THREE.CylinderGeometry(.11, .06, .09, 20), gold);
      setting.position.set(0, 1.07, 0);
      b.add(stone, setting);
      scene.add(a, b);

      let aspect = 1;
      const size = () => {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        aspect = r.width / r.height;
        camera.aspect = aspect; camera.updateProjectionMatrix();
        if (ringState.render) ringState.render();
      };
      const fitZ = (w, h) => Math.max(w / (.536 * aspect), h / .536);
      const t0 = performance.now();
      ringState.render = () => {
        const t = reduced() ? 0 : (performance.now() - t0) / 1000;
        const p = reduced() ? 1 : ringState.p;
        const meet = smoothstep(.15, .82, p);
        const gap = 1.34 - .52 * meet;
        a.position.x = -gap; b.position.x = gap;
        // Đủ vòng quay nguyên, kết thúc đúng tư thế đẹp khi hai nhẫn lồng nhau
        a.rotation.set(.3 + p * Math.PI * 2 + Math.sin(t * .6) * .05, .45 + p * Math.PI * 4 + Math.sin(t * .4) * .08, .22 + p * .4);
        b.rotation.set(-.25 - p * Math.PI * 2 + Math.cos(t * .5) * .05, -.5 - p * Math.PI * 4 - Math.sin(t * .45) * .08, -.18 - p * .3);
        // Đầu và cuối có tiêu đề: nhẫn nhỏ lại và nhích lên để không đè chữ. Khúc giữa nhẫn lớn hết cỡ.
        const titled = (1 - smoothstep(.05, .14, p)) + smoothstep(.85, .95, p);
        const zStart = fitZ(5.4, 4.3), zMid = fitZ(5.4, 3.2), zEnd = fitZ(3.75, 3.9);
        const zOpen = zStart + (zMid - zStart) * smoothstep(.05, .14, p);
        camera.position.set(0, -.42 * titled, zOpen + (zEnd - zOpen) * smoothstep(.72, .95, p));
        renderer.render(scene, camera);
      };
      size();
      ringState.resize = size;
      renderer.compile(scene, camera);
      ringState.render();
      $('#ringsBox').classList.add('is-3d');
      const loop = () => { if (ringState.visible) ringState.render(); requestAnimationFrame(loop); };
      if (!reduced()) requestAnimationFrame(loop);
    } catch (err) {
      // Không có WebGL: giữ đôi nhẫn vẽ phẳng
    }
  };
  const ringsBox = $('#ringsBox');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => { ringState.visible = e.isIntersecting; }), { rootMargin: '10% 0px' }).observe(ringsBox);
  }

  /* ---------- Ba cảnh cuộn ---------- */
  // Vòng xoáy: ngay khung đầu đã có ảnh, ảnh bay ra hết thì đôi nhẫn lồng nhau chiếm trọn màn hình
  const buildVortex = (tl, { root, phone }) => {
    const prints = $$('.print', root);
    const title = $('.vortex-title', root);
    const n = prints.length;
    const seeds = prints.map((_, i) => ({ a: 1.6 + i * 2.399963, tilt: ((i * 37) % 26) - 13 }));
    let w = 0, h = 0;
    const measure = () => { w = root.clientWidth; h = innerHeight; };
    measure();
    addEventListener('resize', measure, { passive: true });
    const state = prints.map(() => '');
    const render = (sp) => {
      const p = .2 + sp * 1.02;
      const reach = Math.hypot(w, h) * (phone ? .8 : .66);
      prints.forEach((el, i) => {
        const start = (i / n) * .78;
        const t = clamp((p - start) / .38);
        let out;
        if (t <= 0 || t >= 1) out = 'hide';
        else {
          const e = t * t * (.6 + .4 * t);
          const ang = seeds[i].a + t * 2.9;
          const r = 16 + reach * e;
          const x = Math.cos(ang) * r * (w > h ? 1.12 : .86);
          const y = Math.sin(ang) * r * (w > h ? .8 : 1.02);
          const s = .24 + 1.2 * Math.pow(t, 1.1);
          const rot = seeds[i].tilt + (1 - t) * 70;
          el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px),calc(-50% + ${y.toFixed(1)}px),0) rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`;
          out = clamp(t * 14).toFixed(2);
        }
        if (out !== state[i]) { el.style.opacity = out === 'hide' ? 0 : out; state[i] = out; }
      });
      ringState.p = sp;
      title.style.opacity = (1 - smoothstep(.06, .13, sp) + smoothstep(.9, .97, sp)).toFixed(3);
    };
    const st = { p: 0 };
    render(0);
    tl.to(st, { p: 1, duration: 1, ease: 'none', onUpdate: () => render(st.p) }, 0);
  };

  // Đếm 1 đến 28
  const buildDate = (tl, { root }) => {
    const num = $('#dateNum', root);
    const cells = $$('td[data-d]', root).map((c) => ({ c, d: +c.dataset.d }));
    let shown = 0;
    const setDay = (d) => {
      if (d === shown) return;
      shown = d;
      num.textContent = String(d);
      cells.forEach(({ c, d: v }) => c.classList.toggle('lit', v <= d || v > 28));
    };
    const st = { d: 1 };
    setDay(1);
    tl.to(st, { d: 28, duration: .85, ease: 'none', onUpdate: () => setDay(Math.round(st.d)) }, 0);
    tl.to({}, { duration: .15 }, .85);
  };

  // Vòm ảnh, viền vàng và hoa cùng mở ra; giữ đúng tỷ lệ ảnh suốt cảnh.
  const buildHall = (tl, { root }) => {
    const portal = $('#hallPortal', root), text = $('.hall-text', root), trim = $('.portal-trim', root);
    tl.fromTo(portal, { x: 0, scale: 1 }, {
      x: () => root.clientWidth / 2 - portal.offsetLeft - portal.offsetWidth / 2,
      scale: () => Math.max(root.clientWidth / portal.offsetWidth, innerHeight / portal.offsetHeight) * 1.18,
      duration: .86, ease: 'sine.inOut', immediateRender: true,
    }, .14);
    tl.fromTo(text, { y: 0, opacity: 1 }, { y: () => -innerHeight * .18, opacity: 0, duration: .28, ease: 'power1.in' }, .08);
    tl.fromTo(trim, { opacity: 1 }, { opacity: 0, duration: .32 }, .38);
  };

  const startScenes = () => {
    if (!window.Stage) return;
    if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
    Stage.scene($('[data-scene="vong-xoay"]'), { hold: 5, scrub: .25, build: buildVortex, phone: { hold: 4.5 } });
    Stage.scene($('[data-scene="dem-28"]'), { hold: .8, scrub: true, build: buildDate, phone: 'rest' });
    Stage.scene($('[data-scene="mo-vom"]'), { hold: .9, scrub: .15, build: buildHall });
    Stage.ready();
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', () => { layoutThreads(); layoutCal(); });
  };

  // Điện thoại: số ngày chạy một lần khi cuộn tới
  const phoneCount = () => {
    if (!isPhone() || reduced() || !('IntersectionObserver' in window)) return;
    const num = $('#dateNum');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const run = (t) => {
        const k = clamp((t - t0) / 1100);
        num.textContent = String(1 + Math.round(27 * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }), { threshold: .6 });
    io.observe(num);
  };

  /* ---------- Khởi động ---------- */
  startScenes();
  phoneCount();
  readFields();
  const relayout = () => { focusImages(); layoutThreads(); layoutCal(); fitGuest(); if (ringState.resize) ringState.resize(); };
  relayout();
  if (store.get('ta-circled')) finish(false);
  // Thanh địa chỉ điện thoại ẩn hiện chỉ đổi chiều cao: không tính lại gì cả
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; relayout(); if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  // Giải mã sẵn mọi ảnh và dựng nhẫn lúc rảnh, để khi cuộn tới là có ngay
  addEventListener('load', () => {
    relayout();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    idle(() => $$('main img').forEach((i) => { if (i.decode) i.decode().catch(() => {}); }));
    setTimeout(() => idle(startRings, 2000), isPhone() ? 900 : 300);
  });
  requestTick();
})();
