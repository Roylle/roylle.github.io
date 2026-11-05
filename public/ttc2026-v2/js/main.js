// A Tale Of Two Christmas 2026: tất cả cảnh cuộn và tương tác của trang.
// Không có script hay bật giảm chuyển động thì trang vẫn hiện đủ nội dung ở bố cục tĩnh.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPhone = () => innerWidth <= 900;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // Đọc tiến độ mỗi khung hình thay vì dùng callback: ScrollTrigger có thể bỏ qua callback khi nhảy xa (menu, refresh).
  const follow = (tl, fn) => { let last = -1; gsap.ticker.add(() => { const p = tl.totalProgress(); if (p !== last) { last = p; fn(p); } }); };

  /* ---------- Hình cuống vé: bo góc và khuyết hai bên hông ---------- */
  const stubPoints = (x, y, w, h, r, n, at = 0.5) => {
    const pts = [];
    const arc = (cx, cy, rad, a0, a1, steps) => {
      for (let i = 0; i <= steps; i++) { const a = lerp(a0, a1, i / steps); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    };
    const P = Math.PI, my = y + h * at;
    arc(x + r, y + r, r, P, P * 1.5, 5);
    arc(x + w - r, y + r, r, P * 1.5, P * 2, 5);
    arc(x + w, my, n, P * 1.5, P * 0.5, 12); // khuyết phải
    arc(x + w - r, y + h - r, r, 0, P * 0.5, 5);
    arc(x + r, y + h - r, r, P * 0.5, P, 5);
    arc(x, my, n, P * 0.5, -P * 0.5, 12); // khuyết trái
    return pts;
  };
  const toPolygon = (pts) => 'polygon(' + pts.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(',') + ')';
  const STUBS = { btn: [5, 7, 0.5], card: [14, 18, 0.36], ticket: [14, 16, 0.5] };
  const cutStub = (el) => {
    const [r, n, at] = STUBS[el.dataset.stub] || STUBS.card;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w && h) el.style.clipPath = toPolygon(stubPoints(0, 0, w, h, r, Math.min(n, h * 0.22), at));
  };
  const ro = new ResizeObserver((es) => es.forEach((e) => cutStub(e.target)));
  $$('[data-stub]').forEach((el) => { cutStub(el); ro.observe(el); });

  /* ---------- Chữ chạy kiểu giải mã ---------- */
  const GLYPHS = 'ĂÂÊÔƠƯĐXYZ*+0123456789';
  const scramble = (el, dur = 500) => {
    const text = el.dataset.text || (el.dataset.text = el.textContent);
    if (reduced) return;
    const t0 = performance.now();
    clearInterval(el._sc);
    el._sc = setInterval(() => {
      const p = clamp((performance.now() - t0) / dur, 0, 1), upto = Math.floor(p * text.length);
      el.textContent = text.slice(0, upto) + [...text.slice(upto)].map((c) => (c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      if (p >= 1) { clearInterval(el._sc); el.textContent = text; }
    }, 40);
  };
  $$('[data-scramble]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent);
    const go = () => { scramble(el, 380); window.Sound && Sound.tick(); };
    el.addEventListener('mouseenter', go); el.addEventListener('focus', go);
  });

  /* ---------- Bộ chọn vé và đếm ngày: chạy cả khi không có GSAP ---------- */
  const TIERS = { first: ['First Class', '1.800.000đ'], premium: ['Premium', '1.200.000đ'], eco: ['Eco', '800.000đ'], standing: ['Standing', '200.000đ'] };
  const DAYS = { 19: 'Thứ Bảy 19.12.2026', 20: 'Chủ Nhật 20.12.2026' };
  const CHECKIN = { '18:00': '17:15', '20:30': '19:45' };
  const picker = $('#picker');
  const updateTicket = (animate) => {
    const d = new FormData(picker), tier = d.get('tier'), show = d.get('show');
    $('#tDay').textContent = DAYS[d.get('day')];
    $('#tShow').textContent = show;
    $('#tCheck').textContent = CHECKIN[show];
    $('#tTier').textContent = TIERS[tier][0];
    $('#tPrice').textContent = TIERS[tier][1];
    $('#seatmap').dataset.tier = tier;
    if (animate && window.gsap && !reduced) {
      gsap.fromTo('#ticket', { rotateX: -14, y: 8 }, { rotateX: 0, y: 0, duration: 0.7, ease: 'expo.out', transformPerspective: 900, overwrite: 'auto' });
      gsap.fromTo($$(`.tier-${tier} rect`), { scale: 0.4, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'expo.out', stagger: { amount: 0.3, from: 'random' }, overwrite: true });
    }
    window.Sound && Sound.tick();
  };
  picker.addEventListener('change', () => updateTicket(true));

  const first = Date.parse('2026-12-19T18:00:00+07:00');
  const left = Math.ceil((first - Date.now()) / 864e5);
  const liveLine = $('.counter-live');
  if (left > 0) $('#daysLeft').textContent = left;
  else if (liveLine) liveLine.textContent = 'Hai đêm diễn: thứ Bảy 19.12 và Chủ Nhật 20.12.2026.';

  /* ---------- Menu điện thoại ---------- */
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    html.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    if (window.Stage && Stage.lenis) open ? Stage.lenis.stop() : Stage.lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Âm thanh ---------- */
  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    const on = Sound.toggle();
    soundBtn.setAttribute('aria-pressed', on);
    soundBtn.setAttribute('aria-label', on ? 'Tắt nhạc nền hộp nhạc' : 'Bật nhạc nền hộp nhạc');
  });

  /* ---------- Xem ảnh lớn ---------- */
  const cards = $$('.arc-card');
  const lb = $('#lightbox');
  let lbI = 0;
  const showLb = (i) => {
    lbI = (i + cards.length) % cards.length;
    const c = cards[lbI];
    $('#lbImg').src = c.getAttribute('href'); $('#lbImg').alt = c.querySelector('img').alt;
    $('#lbCap').textContent = c.dataset.cap;
  };
  const closeLb = () => { lb.close(); window.Stage && Stage.lenis && Stage.lenis.start(); };
  const openLb = (i) => { showLb(i); lb.showModal(); window.Stage && Stage.lenis && Stage.lenis.stop(); };
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('cancel', () => window.Stage && Stage.lenis && Stage.lenis.start());
  $('#lbPrev').addEventListener('click', () => showLb(lbI - 1));
  $('#lbNext').addEventListener('click', () => showLb(lbI + 1));
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });
  cards.forEach((c, i) => c.addEventListener('click', (e) => { e.preventDefault(); if (!c.dataset.dragged) openLb(i); }));

  /* ---------- Từ đây trở đi cần GSAP ---------- */
  const finishLoader = () => html.classList.add('is-loaded');
  if (!window.gsap || !window.ScrollTrigger || !window.Stage) { finishLoader(); return; }
  const strip = (el, digits) => {
    el.textContent = '';
    const inner = document.createElement('span');
    digits.forEach((d) => { const b = document.createElement('b'); b.dataset.d = d; inner.append(b); });
    el.append(inner);
    return inner;
  };
  const rollTens = strip($('[data-roll=tens]'), [0, 1, 2]);
  const rollOnes = strip($('[data-roll=ones]'), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const setRoll = (v) => {
    const tensFrom = Math.floor(v / 10), ones = v % 10;
    // hàng chục chỉ nhích ở nhịp cuối của mỗi vòng mười, như đồng hồ cơ
    const tens = tensFrom + clamp(ones - 9, 0, 1);
    gsap.set(rollTens, { yPercent: -(tens / 3) * 100 });
    gsap.set(rollOnes, { yPercent: -(ones / 11) * 100 });
  };
  setRoll(19);
  if (reduced) { finishLoader(); return; }

  Stage.smooth();
  const GL = window.GL;

  /* ---------- Cảnh mở màn: bước vào quả cầu tuyết ---------- */
  const PLATE = { w: 1672, h: 941, gx: 0.283, gy: 0.503, gr: 0.161 };
  const hero = $('.hero');
  const art = $('#heroArt'), artImg = $('#heroArt img'), photo = $('#heroPhoto'), photoImg = $('#heroPhoto img');
  const aboutEl = $('#about'), aboutCard = $('#aboutCard');
  let geo = null;
  const measure = () => {
    const w = innerWidth, h = innerHeight;
    const scale = Math.max(w / PLATE.w, h / PLATE.h) * (isPhone() ? 1 : 1.04);
    const W = PLATE.w * scale, H = PLATE.h * scale;
    const gx = PLATE.gx * W, gy = PLATE.gy * H;
    const wantX = isPhone() ? w * 0.5 : w * 0.34, wantY = isPhone() ? h * 0.36 : h * 0.47;
    const left = clamp(wantX - gx, w - W, 0), top = clamp(wantY - gy, h - H, 0);
    Object.assign(artImg.style, { width: W + 'px', height: H + 'px', left: left + 'px', top: top + 'px', maxWidth: 'none' });
    const cx = left + gx, cy = top + gy, r = PLATE.gr * W;
    gsap.set(art, { transformOrigin: `${cx}px ${cy}px` });
    const diag = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const a = aboutEl.getBoundingClientRect(), c = aboutCard.getBoundingClientRect();
    geo = { w, h, cx, cy, r, diag, zoomMax: (diag * 1.08) / r, card: { x: c.left - a.left, y: c.top - a.top, w: c.width, h: c.height } };
  };

  const heroState = { z: 0, morph: 0 };
  const paintHero = () => {
    if (!geo) return;
    const { w, h, cx, cy, r, zoomMax, card } = geo;
    const s = lerp(1, zoomMax, heroState.z);
    gsap.set(art, { scale: s, autoAlpha: heroState.z >= 1 ? 0 : 1 });
    if (heroState.morph > 0) {
      const m = heroState.morph, c = card;
      if (isPhone()) { photo.style.clipPath = 'none'; return; }
      const x = lerp(0, c.x, m), y = lerp(0, c.y, m), W = lerp(w, c.w, m), H = lerp(h, c.h, m);
      photo.style.clipPath = toPolygon(stubPoints(x, y, W, H, lerp(0.01, 14, m), lerp(0.01, 18, m), 0.36));
      const fit = Math.max(c.w / w, c.h / h);
      const scale = lerp(1, fit, m);
      gsap.set(photoImg, { x: x + W / 2 - w / 2, y: y + H / 2 - h / 2, scale });
    } else {
      photo.style.clipPath = `circle(${(r * s * 0.97).toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      gsap.set(photoImg, { x: 0, y: 0, scale: lerp(1.28, 1, heroState.z) });
    }
  };

  const heroPlan = (outer, { phone }) => {
    measure();
    // Điện thoại không có đoạn co ảnh về thẻ: dồn phần còn lại cho vừa hết đoạn cuộn.
    const tl = phone ? gsap.timeline({ defaults: { ease: 'none' } }) : outer;
    const title = $('.hero-title');
    const split = SplitText.create(title, { type: 'chars,lines', aria: 'auto', autoSplit: false });
    const chars = split.chars;
    title.style.transformOrigin = `${geo.cx}px ${geo.cy - title.getBoundingClientRect().top}px`;
    hero._chars = chars;

    tl.to('#heroInfo', { autoAlpha: 0, y: -24, duration: 0.08 }, 0.01)
      .to(title, { scale: phone ? 5 : 7, duration: 0.3, ease: 'power2.in' }, 0)
      .to(chars, { yPercent: (i) => (i % 2 ? 90 : -90), rotate: (i) => (i % 3 - 1) * 9, duration: 0.26, ease: 'power1.in', stagger: { amount: 0.03, from: 'center' } }, 0.02)
      .to(chars, { autoAlpha: 0, duration: 0.08, stagger: { amount: 0.04, from: 'center' } }, 0.2)
      .to('.hero-scrim', { autoAlpha: 0, duration: 0.2 }, 0.14)
      .to(heroState, { z: 1, duration: 0.42, ease: 'power2.in' }, 0)
      .set(photo, { visibility: 'visible' }, 0.001)
      .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: 0.14, immediateRender: false }, 0.1)
      .fromTo(GL.u, { snow: 0.85 }, { snow: 0.25, duration: 0.42, immediateRender: false }, 0)
      .fromTo('#heroStatement', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.09, ease: 'power2.out' }, 0.42)
      .fromTo('.hero-dim', { opacity: 0 }, { opacity: 0.42, duration: 0.09 }, 0.42)
      .to('.hero-dim', { opacity: 0, duration: 0.07 }, 0.61)
      .to(GL.u, { snow: 0, duration: 0.12 }, 0.58)
      .to('#heroStatement', { autoAlpha: 0, y: -40, duration: 0.07, ease: 'power2.in' }, 0.61);
    if (!phone) {
      tl.to(heroState, { morph: 1, duration: 0.3, ease: 'power3.inOut' }, 0.68)
        .fromTo('[data-about]', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.035, ease: 'power2.out', immediateRender: true }, 0.84)
        .fromTo('.about-float', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out', immediateRender: true }, 0.92);
    }
    if (phone) outer.add(tl.timeScale(tl.duration()), 0);
    follow(outer, (p) => {
      paintHero();
      hudForce = !phone && p > 0.76 ? 'light' : null;
      aboutEl.style.pointerEvents = !phone && p < 0.84 ? 'none' : '';
    });
  };
  Stage.scene(hero, {
    hold: 3.4,
    build: heroPlan,
    phone: { hold: 1.9, build: heroPlan },
  });
  let hudForce = null;
  addEventListener('resize', () => { if (hero.classList.contains('is-live')) { measure(); paintHero(); } });

  /* ---------- Hai câu chuyện: chữ sáng dần, lưới sao chuyển cảnh ---------- */
  const flight = $('.flight');
  const wordsOf = (el) => SplitText.create(el, { type: 'words', aria: 'auto', autoSplit: false }).words;
  const flightPlan = (tl) => {
    const wa = wordsOf($('.fl-text-a .fl-words')), wb = wordsOf($('.fl-text-b .fl-words'));
    tl.fromTo('.fl-a img', { scale: 1.26, yPercent: -3 }, { scale: 1.04, yPercent: 3, duration: 0.5 }, 0)
      .fromTo(wa, { opacity: 0.16 }, { opacity: 1, duration: 0.05, stagger: 0.022 }, 0.05)
      .fromTo(GL.u, { snow: 0 }, { snow: 0.7, duration: 0.1, immediateRender: false }, 0)
      .fromTo(GL.u, { wipe: 0 }, { wipe: 1, duration: 0.09, immediateRender: false }, 0.42)
      .set('.fl-a, .fl-text-a', { autoAlpha: 0 }, 0.51)
      .set('.fl-b, .fl-text-b', { autoAlpha: 1 }, 0.51)
      .to(GL.u, { wipe: 0, duration: 0.09 }, 0.51)
      .fromTo('.fl-b img', { scale: 1.26, yPercent: 3 }, { scale: 1.04, yPercent: -3, duration: 0.42, immediateRender: false }, 0.5)
      .fromTo(wb, { opacity: 0.16 }, { opacity: 1, duration: 0.05, stagger: 0.022 }, 0.56)
      .to(GL.u, { snow: 0, duration: 0.05 }, 0.82)
      .to(GL.u, { wipe: 1, duration: 0.11 }, 0.88)
      .set('.fl-b, .fl-text-b, .fl-scrim', { autoAlpha: 0 }, 0.992)
      .set(flight.querySelector('.scene-stage'), { backgroundColor: '#f5f4f0' }, 0.992)
      .set(GL.u, { wipe: 0 }, 0.994);
    follow(tl, (p) => {
      GL.setColor(p < 0.7 ? '#e4c68c' : '#f5f4f0');
      const beat = p < 0.51 ? 'a' : 'b';
      if (flight.dataset.tale !== beat) { flight.dataset.tale = beat; const tag = $(`.fl-text-${beat} .fl-tag`); scramble(tag, 700); }
    });
  };
  Stage.scene(flight, { hold: 3, build: flightPlan, phone: { hold: 2.4, build: flightPlan } });

  /* ---------- Số khổng lồ: từ mồng 1 chạy tới ngày 19 ---------- */
  const counterPlan = (tl) => {
    const s = { v: 1 };
    setRoll(1);
    follow(tl, () => setRoll(s.v));
    tl.to(s, { v: 19, duration: 0.9, ease: 'none' }, 0)
      .fromTo('.counter-photo', { y: 80, rotate: 2.5 }, { y: -30, rotate: -1, duration: 1 }, 0)
      .fromTo('.counter-small', { y: 110 }, { y: -10, duration: 1 }, 0)
      .fromTo('.counter-side > *:not(.counter-small)', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.05, ease: 'power2.out' }, 0.02);
  };
  Stage.scene($('.counter'), { hold: 1.4, build: counterPlan });

  /* ---------- Vòng ảnh 3D ---------- */
  const arcView = $('#arcView'), ring = $('#arcRing'), capEl = $('#arcCaption');
  const N = cards.length, STEP = 360 / N;
  let rot = 0, drag = 0, dragV = 0, front = -1;
  const paintRing = () => {
    const angle = rot + drag;
    gsap.set(ring, { rotateY: angle });
    const idx = ((Math.round(-angle / STEP) % N) + N) % N;
    if (idx !== front) { front = idx; capEl.textContent = cards[idx].dataset.cap; capEl.dataset.text = cards[idx].dataset.cap; scramble(capEl, 300); }
  };
  const layoutRing = () => {
    const viewH = arcView.clientHeight, phone = isPhone();
    const h = Math.min(viewH * (phone ? 0.86 : 0.92), phone ? innerWidth * 0.95 : 520), w = h * 0.74;
    const R = (w / 2 / Math.tan(Math.PI / N)) * 1.04;
    arcView.style.setProperty('--w', w + 'px'); arcView.style.setProperty('--h', h + 'px');
    cards.forEach((c, i) => { c.style.transform = `rotateY(${i * STEP}deg) translateZ(${R}px)`; });
    gsap.set(ring, { z: -R + (phone ? 0 : 60) });
  };
  const arcPlan = (tl) => {
    layoutRing();
    const s = { a: 0 };
    follow(tl, () => { rot = s.a; paintRing(); });
    tl.to(s, { a: -360 * ((N - 1) / N), duration: 1 }, 0);
  };
  Stage.scene($('.arc'), { hold: 2.2, build: arcPlan });
  addEventListener('resize', () => { if ($('.arc').classList.contains('is-live')) { layoutRing(); paintRing(); } });

  let px = null, moved = 0;
  arcView.addEventListener('pointerdown', (e) => {
    if (!$('.arc').classList.contains('is-live')) return;
    px = e.clientX; moved = 0; dragV = 0; arcView.classList.add('is-drag');
    cards.forEach((c) => delete c.dataset.dragged);
  });
  addEventListener('pointermove', (e) => {
    if (px === null) return;
    const dx = e.clientX - px; px = e.clientX; moved += Math.abs(dx);
    dragV = dx * 0.14; drag += dragV; paintRing();
    if (moved > 6) cards.forEach((c) => { c.dataset.dragged = '1'; });
  });
  addEventListener('pointerup', () => {
    if (px === null) return;
    px = null; arcView.classList.remove('is-drag');
    const proxy = { v: dragV };
    gsap.to(proxy, { v: 0, duration: 1.1, ease: 'power3.out', onUpdate: () => { drag += proxy.v; paintRing(); } });
    setTimeout(() => cards.forEach((c) => delete c.dataset.dragged), 60);
  });

  /* ---------- Những câu chuyện: cuộn ngang ---------- */
  const worldsPlan = (tl) => {
    const track = $('#worldsTrack');
    tl.to(track, { x: () => -(track.scrollWidth + track.parentElement.getBoundingClientRect().left + parseFloat(getComputedStyle(track.parentElement).paddingLeft) + 24 - innerWidth), duration: 1 }, 0)
      .fromTo('.world img', { scale: 1.12 }, { scale: 1, duration: 1 }, 0);
    ScrollTrigger.addEventListener('refresh', () => $$('[data-stub]', track).forEach(cutStub));
  };
  Stage.scene($('.worlds'), { hold: 2.4, build: worldsPlan, phone: 'rest' });

  /* ---------- Địa điểm: ảnh ghép từ những lát cắt ---------- */
  const venuePlan = (tl, { phone }) => {
    tl.fromTo('.slice', { y: (i) => [170, -90, 120, -140][i], x: (i) => (i - 1.5) * (phone ? 8 : 26) }, { y: 0, x: 0, duration: 0.72, ease: 'power3.out' }, 0)
      .fromTo('.venue-title span:first-child', { xPercent: phone ? 0 : 16 }, { xPercent: 0, duration: 0.8 }, 0)
      .fromTo('.venue-title span:last-child', { xPercent: phone ? 0 : -16 }, { xPercent: 0, duration: 0.8 }, 0)
      .fromTo('.venue-text > *', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.06, ease: 'power2.out' }, 0.32);
  };
  Stage.scene($('.venue'), { hold: 1.1, build: venuePlan });

  /* ---------- Vào cảnh từng phần, có độ lệch ---------- */
  $$('[data-rise]').forEach((el, i) => {
    gsap.from(el, { y: 26, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.04 * (i % 3), scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  const tierRects = $$('.seat-svg rect');
  gsap.from(tierRects, { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'expo.out', stagger: { amount: 0.8, from: 'start', grid: 'auto' }, scrollTrigger: { trigger: '#seatmap', start: 'top 72%', once: true } });

  gsap.from($('.footer-mark-in'), { yPercent: 100, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 80%', end: 'bottom bottom', scrub: true } });
  if (!isPhone()) gsap.fromTo('.about-float', { y: 20 }, { y: -50, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.fromTo('.faq-photo img', { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.faq-photo', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- HUD: thanh tiến trình, ngôi sao, màu theo chương, mục đang xem ---------- */
  const themed = $$('[data-theme]');
  const hudEl = $('#hud');
  const navLinks = $$('#nav a');
  const navMap = [['su-kien', '#about'], ['khoanh-khac', '#khoanh-khac'], ['hang-ve', '#hang-ve'], ['dia-diem', '#dia-diem'], ['hoi-dap', '#hoi-dap']];
  const pBar = gsap.quickSetter('#hudProgress', 'scaleX');
  const star = gsap.quickSetter('#railStar', 'rotate', 'deg');
  const updateHud = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    pBar(max > 0 ? y / max : 0);
    star(y * 0.12);
    let theme = 'dark', bar = 'transparent';
    for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 28 && r.bottom > 28) { theme = s.dataset.theme; bar = s.dataset.bar || 'transparent'; } }
    if (hudForce && hero.getBoundingClientRect().bottom > 28) { theme = hudForce; bar = '#f5f4f0'; }
    html.dataset.hud = theme;
    hudEl.style.backgroundColor = bar;
    let cur = null;
    navMap.forEach(([id, sel]) => { const r = $(sel).getBoundingClientRect(); if (r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5) cur = id; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur));
  };
  gsap.ticker.add(updateHud);

  /* ---------- Phản hồi dưới con trỏ ---------- */
  if (fine) {
    $$('[data-tilt]').forEach((el) => {
      const rx = gsap.quickTo(el, 'rotateX', { duration: 0.7, ease: 'expo.out' }), ry = gsap.quickTo(el, 'rotateY', { duration: 0.7, ease: 'expo.out' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        ry(((e.clientX - b.left) / b.width - 0.5) * 9); rx(-((e.clientY - b.top) / b.height - 0.5) * 9);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    $$('[data-magnet]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'expo.out' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'expo.out' });
      el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(); mx((e.clientX - b.left - b.width / 2) * 0.22); my((e.clientY - b.top - b.height / 2) * 0.3); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
    $$('.btn, .opt, summary').forEach((el) => el.addEventListener('mouseenter', () => window.Sound && Sound.tick()));
  }

  /* ---------- Hỏi đáp: nội dung mở ra có chuyển động ---------- */
  $$('.faq-list details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) gsap.fromTo(d.querySelector('div'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }); }));

  /* ---------- Màn tải: chờ ảnh hero rồi mở bằng lưới sao ---------- */
  const critical = ['assets/img/hero-plate.webp', 'assets/photos/christmas-2025-06-large.webp', 'assets/photos/christmas-2025-02-large.webp', 'assets/photos/christmas-2025-13-large.webp'];
  const fill = $('#loaderFill'), pct = $('#loaderPct');
  const state = { real: 0, shown: 0 };
  critical.forEach((src) => { const i = new Image(); i.onload = i.onerror = () => { state.real += 1 / critical.length; }; i.src = src; });
  const loopLabel = $('[data-scramble-loop]');
  const labels = ['Dàn nhạc đang lên dây', 'Hợp xướng vào vị trí', 'Đèn sân khấu đang sáng', 'Chúc anh chị đêm vui'];
  let labelI = 0;
  const labelTimer = setInterval(() => { labelI = (labelI + 1) % labels.length; loopLabel.dataset.text = labels[labelI]; scramble(loopLabel, 260); }, 520);
  const introHero = () => {
    const chars = hero._chars;
    if (chars && scrollY < 40) gsap.from(chars, { yPercent: 110, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: 0.018, clearProps: 'visibility' });
    if (scrollY < 40) {
      gsap.from('#heroInfo > *', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.25 });
      gsap.fromTo(art, { scale: 1.08 }, { scale: 1, duration: 2, ease: 'expo.out' });
      gsap.to(GL.u, { snow: 0.85, duration: 1.2 });
    }
    gsap.from(isPhone() ? '.hud > *:not(.hud-nav), .rail > *' : '.hud > *, .rail > *', { autoAlpha: 0, duration: 0.8, stagger: 0.05, delay: 0.3, clearProps: 'opacity,visibility' });
  };
  let done = false;
  const reveal = () => {
    if (done) return; done = true;
    clearInterval(labelTimer);
    Stage.ready();
    if (GL.ok) {
      GL.setColor('#f5f4f0');
      GL.u.wipe = 1;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        finishLoader(); ScrollTrigger.refresh(); introHero();
        gsap.to(GL.u, { wipe: 0, duration: 0.8, ease: 'power2.inOut' });
      }));
    } else {
      gsap.to('#loader', { autoAlpha: 0, duration: 0.5, onComplete: () => { finishLoader(); ScrollTrigger.refresh(); } });
      introHero();
    }
  };
  const t0 = performance.now();
  const tickLoader = () => {
    const elapsed = performance.now() - t0;
    const target = elapsed > 2500 ? 1 : Math.min(state.real, elapsed / 650);
    state.shown += (target - state.shown) * (1 - Math.pow(0.78, gsap.ticker.deltaRatio()));
    if (target >= 1 && state.shown > 0.985) state.shown = 1;
    fill.style.transform = `scaleX(${state.shown})`;
    pct.textContent = Math.round(state.shown * 100) + '%';
    if (state.shown >= 1) { gsap.ticker.remove(tickLoader); reveal(); }
  };
  gsap.ticker.add(tickLoader);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
