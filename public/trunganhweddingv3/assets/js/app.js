/* Viết Trung & Bùi Anh: toàn bộ chuyển động của thiệp.
   Nguyên tắc: cảnh cuộn dùng position:sticky + scrub (không pin), chỉ chữ mới được ẩn trước khi hiện,
   ảnh luôn hiện sẵn, và mọi khung ảnh đều căn theo vùng khuôn mặt (data-focus). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactQ = matchMedia('(max-width: 991px), (max-aspect-ratio: 85/100)');
  const hoverQ = matchMedia('(hover: hover) and (pointer: fine)');
  const SCRUB = hoverQ.matches ? true : .18;
  const isCompact = () => compactQ.matches;
  if (reduced) root.classList.add('reduced');

  const killPre = () => { const p = $('#pre'); if (p) p.remove(); root.style.overflow = ''; };
  addEventListener('error', (e) => { if (e.target === window) killPre(); });
  setTimeout(killPre, 14000);

  if (!window.gsap || !window.ScrollTrigger) { killPre(); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history && !location.hash) history.scrollRestoration = 'manual';

  /* ---------- Chiều cao màn hình ổn định khi thanh địa chỉ co giãn ---------- */
  let lastW = innerWidth;
  const setVh = () => root.style.setProperty('--vh', innerHeight * 0.01 + 'px');
  setVh();

  /* ---------- Cuộn mượt: chỉ làm mượt bánh xe chuột, cảm ứng vẫn là cuộn gốc ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const lock = () => { if (lenis) lenis.stop(); else root.style.overflow = 'hidden'; };
  const unlock = () => { if (lenis) lenis.start(); root.style.overflow = ''; };
  const goTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, ...opts });
    else {
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
      scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  /* ---------- Vòng lá monogram ---------- */
  const buildWreath = () => {
    const g = $('#wreath');
    if (!g) return;
    let out = '<circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" stroke-width=".7"/>';
    const n = 34;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360, side = i % 2 ? 26 : -26, len = 9 + (i % 3) * 1.6;
      out += `<path fill="currentColor" transform="rotate(${a} 60 60) translate(60 15) rotate(${side})" d="M0 0C${len * .34} ${-len * .36} ${len * .3} ${-len * .8} 0 ${-len}C${-len * .3} ${-len * .8} ${-len * .34} ${-len * .36} 0 0Z" opacity="${i % 3 === 0 ? 1 : .75}"/>`;
    }
    g.innerHTML = out;
  };

  /* ---------- Tách chữ ---------- */
  const eachText = (el, fn) => {
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) fn(n);
      else if (n.nodeType === 1 && n.tagName !== 'BR') eachText(n, fn);
    });
  };
  const splitChars = (el) => {
    if (el._chars) return el._chars;
    if (!el.getAttribute('aria-label') && !el.closest('[aria-label]')) el.setAttribute('aria-label', el.textContent.trim());
    eachText(el, (node) => {
      const frag = document.createDocumentFragment();
      node.textContent.normalize('NFC').split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const w = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        Array.from(part).forEach((ch) => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.append(c); });
        frag.append(w);
      });
      node.replaceWith(frag);
    });
    return (el._chars = $$('.c', el));
  };
  const splitLines = (el) => {
    el._html = el.innerHTML;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const words = [];
    eachText(el, (node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const s = document.createElement('span'); s.textContent = part; s.style.display = 'inline-block'; words.push(s); frag.append(s);
      });
      node.replaceWith(frag);
    });
    const lines = [];
    let top = null;
    words.forEach((w) => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(w.textContent); });
    el.innerHTML = lines.map((l) => `<span class="ln"><span class="ln-i">${l.join(' ')}</span></span>`).join('');
    el.setAttribute('aria-label', label);
    return $$('.ln-i', el);
  };
  const showChars = (chars, kind, delay = 0) => {
    if (kind === 'a') gsap.fromTo(chars, { opacity: 0, rotateX: 90, x: '4rem', transformOrigin: '50% 100%' }, { opacity: 1, rotateX: 0, x: 0, duration: 1.1, delay, stagger: .03, ease: 'power3.out', overwrite: true });
    else gsap.fromTo(chars, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: 1.1, delay, stagger: .022, ease: 'power3.out', overwrite: true });
  };
  const setHidden = (chars) => gsap.set(chars, { opacity: 0 });

  /* ---------- Chữ vừa khít bề ngang ---------- */
  const fitAll = () => {
    $$('[data-fit]').forEach((el) => {
      const parent = el.parentElement;
      const cs = getComputedStyle(parent);
      const room = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (isCompact() && el.closest('.album-title')) { el.style.fontSize = ''; el.style.whiteSpace = ''; el.style.display = ''; return; }
      const twin = document.createElement('span');
      twin.textContent = el.dataset.fitText || el.textContent;
      twin.style.cssText = 'position:absolute;visibility:hidden;display:inline-block;white-space:nowrap;font-size:100px';
      parent.append(twin);
      const w = twin.getBoundingClientRect().width;
      twin.remove();
      el.style.whiteSpace = 'nowrap';
      el.style.display = 'inline-block';
      const maxH = innerHeight * (el.closest('.inv-title') ? .2 : .32);
      el.style.fontSize = Math.min(100 * room / w, maxH) + 'px';
    });
  };

  /* ---------- Căn ảnh theo khuôn mặt ---------- */
  const focusAll = () => {
    $$('img[data-focus]').forEach((img) => {
      if (!img.naturalWidth) { img.addEventListener('load', focusAll, { once: true }); return; }
      const [x1, y1, x2, y2] = img.dataset.focus.split(',').map(Number);
      const fw = img.offsetWidth, fh = img.offsetHeight;
      if (!fw || !fh) return;
      const sc = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
      const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const fy = parseFloat(img.dataset.fy || '.45');
      const tx = clamp(fw * .5 - cx * dw, fw - dw, 0), ty = clamp(fh * fy - cy * dh, fh - dh, 0);
      img.style.objectPosition = `${dw - fw > 1 ? tx / (fw - dw) * 100 : 50}% ${dh - fh > 1 ? ty / (fh - dh) * 100 : 50}%`;
      img.style.transformOrigin = `${(tx + cx * dw) / fw * 100}% ${(ty + cy * dh) / fh * 100}%`;
    });
  };
  // Kiểm tra: có khuôn mặt nào bị khung cắt không (ảnh đang hiển thị ở khung nào, hộp mặt có nằm trọn trong khung không)
  if (location.search.includes('qa')) window.__faces = () => $$('img[data-focus]').map((img) => {
    const [x1, y1, x2, y2] = img.dataset.focus.split(',').map(Number);
    const r = img.getBoundingClientRect();
    const sc = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
    const ox = r.left + (r.width - dw) * px / 100, oy = r.top + (r.height - dh) * py / 100;
    const box = { l: ox + x1 * dw, t: oy + y1 * dh, r: ox + x2 * dw, b: oy + y2 * dh };
    const frame = (img.closest('[data-frame]') || img.parentElement).getBoundingClientRect();
    const cut = { l: Math.max(frame.left, r.left), t: Math.max(frame.top, r.top), r: Math.min(frame.right, r.right), b: Math.min(frame.bottom, r.bottom) };
    return { src: img.getAttribute('src').split('/').pop(), ok: box.l >= cut.l - 1 && box.t >= cut.t - 1 && box.r <= cut.r + 1 && box.b <= cut.b + 1, box: Object.values(box).map(Math.round), cut: Object.values(cut).map(Math.round) };
  });

  /* ---------- Lịch ---------- */
  const buildCal = () => {
    const g = $('#calGrid');
    if (!g) return;
    let h = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => `<b>${d}</b>`).join('');
    h += '<span></span>'.repeat(6); // 1.11.2026 là Chủ nhật
    for (let d = 1; d <= 30; d++) {
      h += d === 28
        ? `<span class="cal-day" id="d28">28<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19 2 10a7 7 0 0 1 14-2.2A7 7 0 0 1 30 10c0 9-14 18-14 18z"/></svg><small>20/10</small></span>`
        : `<span>${d}</span>`;
    }
    g.innerHTML = h;
  };

  /* ---------- Đếm ngược ---------- */
  const startCountdown = () => {
    const target = Date.parse('2026-11-28T18:00:00+07:00');
    const pad = (n) => String(n).padStart(2, '0');
    const d = $('#cdDays'), h = $('#cdH'), m = $('#cdM'), s = $('#cdS');
    const tick = () => {
      const left = target - Date.now();
      if (left <= 0) {
        $('.days-line').textContent = 'Ngày ấy';
        d.textContent = '28.11'; $('#cdUnit').textContent = 'đã đến rồi'; $('#clock').hidden = true;
        return false;
      }
      const sec = Math.floor(left / 1000);
      if (!d._rolling) d.textContent = Math.floor(sec / 86400);
      h.textContent = pad(Math.floor(sec / 3600) % 24); m.textContent = pad(Math.floor(sec / 60) % 60); s.textContent = pad(sec % 60);
      return true;
    };
    if (tick()) setInterval(tick, 1000);
    return { days: Math.max(0, Math.floor((target - Date.now()) / 86400000)) };
  };

  /* ---------- Tên khách ---------- */
  const initGuest = () => {
    const input = $('#guest');
    if (!input) return;
    const k = new URLSearchParams(location.search).get('k');
    if (k) input.value = k;
    input.addEventListener('change', () => {
      const u = new URL(location.href);
      if (input.value.trim()) u.searchParams.set('k', input.value.trim()); else u.searchParams.delete('k');
      history.replaceState(null, '', u);
    });
  };

  /* ---------- Hiệu ứng phản hồi con trỏ ---------- */
  const initFlip = () => {
    $$('[data-flip]').forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      const mk = (cls) => {
        const s = document.createElement('span'); s.className = 'fl ' + cls; s.setAttribute('aria-hidden', 'true');
        Array.from(text).forEach((ch, i) => { const c = document.createElement('span'); c.className = 'c'; c.style.setProperty('--i', i); c.innerHTML = ch === ' ' ? '&nbsp;' : ch; s.append(c); });
        return s;
      };
      el.textContent = ''; el.append(mk('fl-a'), mk('fl-b'));
    });
  };
  const initMagnetic = () => {
    if (!hoverQ.matches || reduced) return;
    $$('[data-magnetic]').forEach((el) => {
      const inner = $('[data-magnetic-inner]', el);
      const k = parseFloat(el.dataset.strength || 26);
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { x: dx * k, y: dy * k, duration: 1.4, ease: 'power4.out', overwrite: 'auto' });
        if (inner) gsap.to(inner, { x: dx * k * .7, y: dy * k * .7, duration: 1.8, ease: 'power4.out', overwrite: 'auto' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.6, ease: 'elastic.out(1,.3)', overwrite: 'auto' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.6, ease: 'elastic.out(1,.3)', overwrite: 'auto' });
      });
    });
  };
  const initTips = () => {
    const tip = $('#tip');
    const toX = gsap.quickTo(tip, 'x', { duration: .9, ease: 'power3' });
    const toY = gsap.quickTo(tip, 'y', { duration: .9, ease: 'power3' });
    const place = (x, y, snap) => {
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const tx = clamp(x + 18, 8, innerWidth - w - 8), ty = clamp(y + 18, 8, innerHeight - h - 8);
      if (snap) gsap.set(tip, { x: tx, y: ty });
      toX(tx); toY(ty);
    };
    let timer;
    $$('.pin').forEach((pin) => {
      pin.addEventListener('mouseenter', (e) => { tip.textContent = pin.dataset.tip; place(e.clientX, e.clientY, true); tip.classList.add('on'); });
      pin.addEventListener('mousemove', (e) => place(e.clientX, e.clientY));
      pin.addEventListener('mouseleave', () => tip.classList.remove('on'));
      pin.addEventListener('click', () => {
        const r = pin.getBoundingClientRect();
        tip.textContent = pin.dataset.tip; place(r.left, r.bottom, true); tip.classList.add('on');
        clearTimeout(timer); timer = setTimeout(() => tip.classList.remove('on'), 3600);
      });
    });
    addEventListener('scroll', () => { if (!hoverQ.matches) tip.classList.remove('on'); }, { passive: true });
  };

  /* ---------- Logo xoay, nhanh hơn và đổi chiều theo hướng cuộn ---------- */
  const initLogo = () => {
    const ring = $('.logo-ring');
    if (!ring || reduced) return;
    const st = { speed: 30 };
    let dir = 1, rot = 0, cool;
    gsap.ticker.add((_, dt) => { rot += st.speed * Math.min(dt, 100) / 1000; ring.setAttribute('transform', `rotate(${rot % 360} 60 60)`); });
    const onV = (v) => {
      if (v) dir = v > 0 ? 1 : -1;
      gsap.to(st, { speed: dir * (30 + 10 * Math.min(Math.abs(v), 40)), duration: .3, overwrite: true });
      clearTimeout(cool); cool = setTimeout(() => gsap.to(st, { speed: 30 * dir, duration: 1.2 }), 100);
    };
    if (lenis) lenis.on('scroll', ({ velocity }) => onV(velocity));
    else addEventListener('scroll', () => onV(ScrollTrigger.getAll()[0] ? ScrollTrigger.getAll()[0].getVelocity() / 60 : 0), { passive: true });
  };

  /* ---------- Thanh tiến trình tráng gương: vệt sáng trượt theo cuộn, con trỏ co giãn theo tốc độ ---------- */
  const CHAPTERS = [['.hero-area', 'Đầu thiệp'], ['.invite', 'Lời mời'], ['.track-area', 'Ngày cưới'], ['.album', 'Album ảnh'], ['.rings-area', 'Đôi nhẫn'], ['.days', 'Đếm ngày'], ['.win-area', 'Địa điểm'], ['.final', 'Hẹn gặp bạn']];
  const docTop = (el) => el.getBoundingClientRect().top + scrollY;
  const initSbar = () => {
    const bar = $('#sbar'), thumb = $('#sbarThumb'), label = $('#sbarLabel'), track = $('#sbarTrack'), ticks = $('#sbarTicks');
    ticks.innerHTML = CHAPTERS.map(([, name], i) => `<button type="button" data-i="${i}" aria-label="Đến ${name}"><span>${name}</span></button>`).join('');
    const maxY = () => root.scrollHeight - innerHeight;
    const placeTicks = () => {
      const m = maxY();
      $$('button', ticks).forEach((btn) => { const el = $(CHAPTERS[btn.dataset.i][0]); btn.style.setProperty('--t', clamp(docTop(el) / m, 0, 1) * 100 + '%'); });
    };
    placeTicks();
    ScrollTrigger.addEventListener('refresh', placeTicks);
    ticks.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.stopPropagation();
      goTo($(CHAPTERS[btn.dataset.i][0]));
    });
    const stretch = reduced ? null : gsap.quickTo(thumb, 'scaleY', { duration: .5, ease: 'power3' });
    let lastY = scrollY, lastT = performance.now();
    const paint = () => {
      const m = maxY(), p = m > 0 ? clamp(scrollY / m, 0, 1) : 0, h = track.offsetHeight;
      bar.style.setProperty('--p', p * 100 + '%');
      track.style.setProperty('--shine', (scrollY * .22).toFixed(1) + 'px');
      gsap.set(thumb, { y: p * h });
      label.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (stretch) {
        const now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(now - lastT, 1);
        lastY = scrollY; lastT = now;
        stretch(1 + Math.min(v * .16, .5));
      }
    };
    let queued = false;
    addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; paint(); });
    }, { passive: true });
    if (stretch) { let idle; addEventListener('scroll', () => { clearTimeout(idle); idle = setTimeout(() => stretch(1), 120); }, { passive: true }); }
    ScrollTrigger.addEventListener('refresh', paint);
    paint();

    const toY = (clientY) => { const r = track.getBoundingClientRect(); return clamp((clientY - r.top) / r.height, 0, 1) * maxY(); };
    let drag = false;
    thumb.addEventListener('pointerdown', (e) => { e.stopPropagation(); drag = true; thumb.setPointerCapture(e.pointerId); });
    thumb.addEventListener('pointerup', () => { drag = false; });
    thumb.addEventListener('pointercancel', () => { drag = false; });
    thumb.addEventListener('pointermove', (e) => { if (drag) goTo(toY(e.clientY), { duration: .9 }); });
    track.addEventListener('click', (e) => { if (e.target === thumb || thumb.contains(e.target)) return; goTo(toY(e.clientY), { duration: 1.4 }); });
  };

  /* ---------- Màu khung cố định đổi theo nền đang nằm dưới nó ---------- */
  const hudEls = [$('.logo'), $('.hud-nav'), $('#sbar')];
  const bgs = [];
  const bgAt = (x, y) => {
    for (let i = bgs.length - 1; i >= 0; i--) {
      const el = bgs[i], r = el.getBoundingClientRect();
      if (y < r.top || y > r.bottom) continue;
      if (el.hasAttribute('data-arched')) {
        const rad = r.width / 2, dx = x - (r.left + rad);
        if (y < r.top + rad - Math.sqrt(Math.max(0, rad * rad - dx * dx))) continue;
      }
      return el.dataset.bg;
    }
    return 'deep';
  };
  let hudQueued = false;
  const paintHud = () => {
    hudQueued = false;
    hudEls.forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.dataset.on = bgAt(r.left + r.width / 2, r.top + r.height / 2);
    });
  };
  const queueHud = () => { if (!hudQueued) { hudQueued = true; requestAnimationFrame(paintHud); } };

  /* ---------- Mục lục ---------- */
  const initMenu = () => {
    const menu = $('#menu'), arch = $('#menuArch'), open = $('#menuOpen'), close = $('#menuClose');
    const links = $$('.menu-list a');
    const show = () => {
      menu.hidden = false; open.setAttribute('aria-expanded', 'true'); lock();
      if (!reduced) {
        gsap.fromTo(arch, { yPercent: 100 }, { yPercent: 0, duration: 1, ease: 'expo.inOut' });
        links.forEach((a, i) => { const ch = splitChars(a); setHidden(ch); showChars(ch, 'h', .45 + i * .06); });
        gsap.fromTo('.menu-foot, .menu-close', { opacity: 0 }, { opacity: 1, duration: .8, delay: .8 });
      }
      close.focus();
    };
    const hide = (after) => {
      open.setAttribute('aria-expanded', 'false');
      const done = () => { menu.hidden = true; unlock(); if (after) after(); else open.focus(); };
      if (reduced) return done();
      gsap.to(links.flatMap((a) => a._chars || []), { opacity: 0, duration: .25, overwrite: true });
      gsap.to(arch, { yPercent: -100, duration: .8, ease: 'expo.inOut', onComplete: done });
    };
    open.addEventListener('click', show);
    close.addEventListener('click', () => hide());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) hide(); });
    return hide;
  };

  /* ---------- Album: kéo có quán tính, chạm để phóng to ---------- */
  const initAlbum = () => {
    const rail = $('#rail'), bar = $('#railBar'), cur = $('#dragCursor');
    const cards = $$('.card', rail);
    const syncBar = () => { const m = rail.scrollWidth - rail.clientWidth; bar.style.transform = `scaleX(${m > 0 ? rail.scrollLeft / m : 0})`; };
    rail.addEventListener('scroll', syncBar, { passive: true }); syncBar();

    let down = false, moved = 0, sx = 0, sl = 0, v = 0, lastX = 0, raf = 0;
    const glide = () => { if (Math.abs(v) < .4) return; rail.scrollLeft -= v; v *= .94; raf = requestAnimationFrame(glide); };
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = lastX = e.clientX; sl = rail.scrollLeft; v = 0; cancelAnimationFrame(raf);
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) rail.classList.add('drag');
      rail.scrollLeft = sl - dx; v = e.clientX - lastX; lastX = e.clientX;
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; glide(); setTimeout(() => rail.classList.remove('drag'), 0); });
    rail.addEventListener('dragstart', (e) => e.preventDefault());

    if (hoverQ.matches && !reduced) {
      const toX = gsap.quickTo(cur, 'x', { duration: .55, ease: 'power3' }), toY = gsap.quickTo(cur, 'y', { duration: .55, ease: 'power3' });
      rail.addEventListener('mouseenter', (e) => { gsap.set(cur, { x: e.clientX, y: e.clientY }); gsap.to(cur, { scale: 1, duration: .5, ease: 'power3.out' }); });
      rail.addEventListener('mouseleave', () => gsap.to(cur, { scale: 0, duration: .35 }));
      addEventListener('mousemove', (e) => { toX(e.clientX); toY(e.clientY); }, { passive: true });
    }

    // Phóng to
    const lb = $('#lb'), img = $('#lbImg'), now = $('#lbNow'), all = $('#lbAll'), lbBar = $('#lbBar');
    let i = 0, opener = null;
    all.textContent = String(cards.length).padStart(2, '0');
    const draw = () => {
      const c = cards[i];
      img.src = c.dataset.full; img.alt = $('img', c).alt;
      now.textContent = String(i + 1).padStart(2, '0');
      lbBar.style.width = (i + 1) / cards.length * 100 + '%';
    };
    const open = (n, from) => {
      i = n; opener = from; draw(); lb.hidden = false; lock();
      if (!reduced) { gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .6 }); gsap.fromTo(img, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .8, ease: 'power3.out' }); }
      $('#lbX').focus();
    };
    const close = () => {
      const done = () => { lb.hidden = true; unlock(); if (opener) opener.focus({ preventScroll: true }); };
      if (reduced) return done();
      gsap.to(lb, { opacity: 0, duration: .35, onComplete: done });
    };
    const step = (d) => {
      if (reduced) { i = (i + d + cards.length) % cards.length; return draw(); }
      gsap.to(img, { xPercent: d > 0 ? -60 : 60, opacity: 0, duration: .3, ease: 'power2.in', onComplete: () => {
        i = (i + d + cards.length) % cards.length; draw();
        gsap.fromTo(img, { xPercent: d > 0 ? 60 : -60, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .7, ease: 'power3.out' });
      } });
    };
    cards.forEach((c, n) => c.addEventListener('click', () => { if (moved <= 6) open(n, c); }));
    $('#lbX').addEventListener('click', close);
    $('#lbP').addEventListener('click', () => step(-1));
    $('#lbN').addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  };

  /* ---------- Đôi nhẫn 3D ---------- */
  const rings = { p: 0, visible: false, started: false, render: null, resize: null };
  const startRings = async () => {
    if (rings.started) return;
    rings.started = true;
    try {
      const canvas = $('#rings');
      const THREE = await import('../vendor/three.module.min.js');
      const { RoomEnvironment } = await import('../vendor/RoomEnvironment.js');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, isCompact() ? 1.5 : 1.6));
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
        for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(new THREE.Vector2(R + Math.cos(a) * t, Math.sin(a) * w)); }
        const g = new THREE.LatheGeometry(pts, 96);
        g.rotateX(Math.PI / 2);
        return g;
      };
      const a = new THREE.Group(), b = new THREE.Group();
      a.add(new THREE.Mesh(band(1, .15, .055), gold));
      b.add(new THREE.Mesh(band(1, .09, .05), gold));
      const stone = new THREE.Mesh(new THREE.OctahedronGeometry(.17, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .02, flatShading: true, envMapIntensity: 3, clearcoat: 1 }));
      stone.position.set(0, 1.17, 0); stone.scale.y = .8;
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
        if (rings.render) rings.render();
      };
      const fitZ = (w, h) => Math.max(w / (.536 * aspect), h / .536);
      const t0 = performance.now();
      rings.render = () => {
        const t = reduced ? 0 : (performance.now() - t0) / 1000;
        const p = reduced ? 1 : rings.p;
        const gap = 1.34 - .52 * smooth(.15, .86, p);
        a.position.x = -gap; b.position.x = gap;
        a.rotation.set(.3 + p * Math.PI * 2 + Math.sin(t * .6) * .05, .45 + p * Math.PI * 4 + Math.sin(t * .4) * .08, .22 + p * .4);
        b.rotation.set(-.25 - p * Math.PI * 2 + Math.cos(t * .5) * .05, -.5 - p * Math.PI * 4 - Math.sin(t * .45) * .08, -.18 - p * .3);
        camera.position.set(0, 0, lerp(fitZ(5.4, 3.2), fitZ(3.75, 3.4), smooth(.6, 1, p)));
        renderer.render(scene, camera);
      };
      size();
      rings.resize = size;
      renderer.compile(scene, camera);
      rings.render();
      $('#ringsStage').classList.add('is-3d');
      const loop = () => { if (rings.visible) rings.render(); requestAnimationFrame(loop); };
      if (!reduced) requestAnimationFrame(loop);
    } catch (err) { /* không có WebGL: giữ đôi nhẫn vẽ phẳng */ }
  };

  /* ---------- Mở màn ---------- */
  const hv = { y0: 0, y1: 0, x0: 0, s: 1.14, ox: 50, oy: 30 };
  const layoutHero = () => {
    const stage = $('#heroStage'), bg = $('#heroBg');
    const W = stage.clientWidth, H = stage.clientHeight;
    const FACE_T = .23, FACE_B = .385, FACE_X = .55;
    if (isCompact()) {
      let imgH = H, imgW = H / 1.5;
      if (imgW < W) { imgW = W; imgH = W * 1.5; }
      bg.style.width = imgW + 'px'; bg.style.height = imgH + 'px';
      hv.x0 = clamp(W * .5 - FACE_X * imgW, W - imgW, 0);
      hv.y0 = 0; hv.y1 = 0; hv.s = 1.26; hv.ox = FACE_X * 100; hv.oy = 30;
      stage.style.removeProperty('--hero-fs'); stage.style.removeProperty('--title-top');
    } else {
      const imgW = W, imgH = W * 1.5;
      bg.style.width = imgW + 'px'; bg.style.height = imgH + 'px';
      hv.x0 = 0;
      hv.y0 = -Math.max(0, FACE_B * imgH - .92 * H);
      hv.y1 = Math.min(hv.y0, -(FACE_T * imgH - .1 * H));
      hv.s = 1.14; hv.ox = FACE_X * 100; hv.oy = 30;
      const logoBottom = $('.logo').getBoundingClientRect().bottom;
      const top = logoBottom * .9;
      stage.style.setProperty('--hero-fs', '100px');
      const t = $('.hero-title');
      const kids = [...t.children];
      const width = kids[kids.length - 1].getBoundingClientRect().right - kids[0].getBoundingClientRect().left;
      const room = FACE_T * imgH + hv.y0 - top;
      stage.style.setProperty('--hero-fs', Math.min(100 * (W * .9) / width, room / 1.6) + 'px');
      stage.style.setProperty('--title-top', top + 'px');
    }
    gsap.set(bg, { transformOrigin: `${hv.ox}% ${hv.oy}%` });
  };
  const initHeroSwitch = () => {
    const stage = $('#heroStage'), venue = $('#heroVenue'), area = $('.hero-area');
    $$('.hero-switch button').forEach((btn) => btn.addEventListener('click', () => {
      const mode = btn.dataset.show;
      if (stage.dataset.mode === mode) return;
      stage.dataset.mode = mode;
      area.dataset.bg = mode === 'noi' ? 'photo' : 'cream';
      $$('.hero-switch button').forEach((b) => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      gsap.to(venue, mode === 'noi' ? { clipPath: 'inset(0% 0 0 0)', duration: reduced ? 0 : 1.3, ease: 'expo.inOut', overwrite: true } : { clipPath: 'inset(100% 0 0 0)', duration: reduced ? 0 : 1.1, ease: 'expo.inOut', overwrite: true });
      gsap.fromTo($('img', venue), { scale: 1.2 }, { scale: 1, duration: reduced ? 0 : 1.8, ease: 'power3.out' });
      queueHud();
    }));
  };
  const heroIntro = () => {
    if (reduced) return;
    const parts = $$('[data-hero-r]');
    parts.forEach((p, i) => showChars(splitChars(p), 'h', i * .08));
    gsap.fromTo('.hero-script', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(-20% -5% -20% 0)', duration: 1.8, delay: .55, ease: 'power2.inOut' });
    gsap.fromTo('[data-hero-a], .hero-switch', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, delay: .9, stagger: .1, ease: 'power3.out' });
    gsap.fromTo('.pin, .hero-cta', { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .9, delay: 1.2, stagger: .12, ease: 'power3.out', clearProps: 'scale' });
  };

  /* ---------- Các cảnh cuộn ---------- */
  const initScenes = () => {
    const compact = isCompact();
    const useH = !compact && !reduced;

    /* Mở màn: ảnh trôi lên chậm, tiêu đề bay nhanh hơn, ống kính áp sát khuôn mặt */
    const area = $('.hero-area'), bg = $('#heroBg');
    if (reduced) gsap.set(bg, { x: hv.x0, y: hv.y0 });
    else {
      gsap.timeline({ scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: SCRUB, invalidateOnRefresh: true } })
        .fromTo(bg, { x: () => hv.x0, y: () => hv.y0, scale: 1 }, { x: () => hv.x0, y: () => hv.y1, scale: () => hv.s, ease: 'none', duration: 1 }, 0)
        .fromTo('#heroCopy', { y: 0 }, { y: () => isCompact() ? -innerHeight * .1 : (hv.y1 - hv.y0) * 1.3 - innerHeight * .06, ease: 'none', duration: .62 }, 0)
        .fromTo('.hero-cta', { yPercent: 0 }, { yPercent: 160, ease: 'none', duration: .22 }, 0)
        .fromTo($('img', $('#heroVenue')), { yPercent: 0 }, { yPercent: 6, ease: 'none', duration: 1 }, 0);
    }

    /* Chữ uốn theo vòm, giãn dần khi cuộn */
    gsap.fromTo('#arcWords', { wordSpacing: 0 }, { wordSpacing: compact ? 70 : 96, ease: 'none', scrollTrigger: { trigger: '#archTop', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('[data-draw]').forEach((el) => gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: true } }));

    /* Lời mời: ba phần đổi theo cuộn, ảnh mới lau đè lên ảnh cũ nên khung không bao giờ trống */
    const titles = ['Trân trọng kính mời', 'Nhà trai', 'Nhà gái'];
    const titleEl = $('#invTitle'), imgs = $$('#invFrame img'), slides = $$('.inv-slide');
    const setTitle = (txt, instant) => {
      gsap.killTweensOf(titleEl._chars || []);
      const swap = () => { titleEl._chars = null; titleEl.textContent = txt; const c = splitChars(titleEl); if (!reduced) showChars(c, 'h'); };
      if (instant || reduced || !titleEl._chars) return swap();
      gsap.to(titleEl._chars, { opacity: 0, yPercent: -40, rotateY: -60, duration: .26, stagger: .008, ease: 'power2.in', onComplete: swap });
    };
    if (!reduced) {
      const firstChars = splitChars(titleEl); setHidden(firstChars);
      ScrollTrigger.create({ trigger: '#invArea', start: 'top 72%', once: true, onEnter: () => { if (titleEl._chars === firstChars) showChars(firstChars, 'h'); } });
    }
    let zi = 2, idx = 0;
    const showSlide = (n) => {
      if (n === idx) return;
      const dir = n > idx ? 1 : -1, img = imgs[n];
      idx = n; zi += 1;
      img.classList.add('on'); img.style.zIndex = zi;
      if (!reduced) gsap.fromTo(img, { clipPath: dir > 0 ? 'polygon(100% 0%, 100% 0%, 104% 100%, 124% 100%)' : 'polygon(-24% 0%, -4% 0%, 0% 100%, 0% 100%)', scale: 1.22 }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', scale: 1, duration: 1.05, ease: 'power4.inOut', overwrite: true });
      slides.forEach((s, i) => s.classList.toggle('on', i === n));
      $('#invNow').textContent = n + 1;
      setTitle(titles[n]);
    };
    const inv = ScrollTrigger.create({
      trigger: '#invArea', start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => { $('#invBar').style.transform = `scaleX(${s.progress})`; showSlide(Math.min(2, Math.floor(s.progress * 3))); },
    });
    const jump = (d) => { const n = clamp(idx + d, 0, 2); goTo(inv.start + (n + .5) / 3 * (inv.end - inv.start), { duration: 1.2 }); };
    $('#invPrev').addEventListener('click', () => jump(-1));
    $('#invNext').addEventListener('click', () => jump(1));
    if (!reduced) gsap.fromTo('#invFrame', { scale: .8 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#invArea', start: 'top 90%', end: 'top top', scrub: true } });

    /* Ảnh lớn: thu về đúng khung, tâm thu nằm ở khuôn mặt */
    if (!reduced) $$('[data-zoom]').forEach((img) => gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 } }));

    /* Trượt ngang: 1 cuộn dọc = 1 đoạn ngang, nên không có khúc nào đứng yên */
    let hTween = null;
    const trackArea = $('.track-area'), track = $('#track');
    if (useH) {
      const sizeTrack = () => { trackArea.style.height = track.scrollWidth - innerWidth + innerHeight + 'px'; };
      sizeTrack();
      ScrollTrigger.addEventListener('refreshInit', sizeTrack);
      hTween = gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none', scrollTrigger: { trigger: trackArea, start: 'top top', end: 'bottom bottom', scrub: .25, invalidateOnRefresh: true } });
      const from = [-6, 6, -10], to = [6, -12, 12];
      $$('[data-step]').forEach((el, i) => gsap.fromTo(el, { xPercent: from[i] }, { xPercent: to[i], ease: 'none', scrollTrigger: { trigger: trackArea, start: 'top top', end: 'bottom bottom', scrub: .25 } }));
      $$('[data-driftx]').forEach((el) => gsap.fromTo(el, { xPercent: 0 }, { xPercent: parseFloat(el.dataset.driftx), ease: 'none', scrollTrigger: { trigger: el, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } }));
    }

    /* Hai đường đời gặp nhau ở giữa */
    $$('.path-ln').forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: hTween
        ? { trigger: '#path', containerAnimation: hTween, start: 'left 96%', end: 'center 52%', scrub: true }
        : { trigger: '#path', start: 'top 95%', end: 'top 58%', scrub: true } });
    });

    const meetHeart = $('#pathHeart');
    if (meetHeart && !reduced) {
      gsap.set(meetHeart, { transformOrigin: '50% 50%', scale: 0 });
      gsap.to(meetHeart, { scale: .9, duration: 1, ease: 'elastic.out(1,.45)', scrollTrigger: { trigger: '#path', ...(hTween ? { containerAnimation: hTween, start: 'center 56%' } : { start: 'top 58%' }), toggleActions: 'play none none reverse' } });
    }

    /* Trái tim ngày 28 đập nhẹ khi vào khung */
    const heart = $('#d28 svg');
    if (heart && !reduced) gsap.fromTo(heart, { scale: .4 }, { scale: 1, duration: 1.1, ease: 'elastic.out(1,.45)', scrollTrigger: { trigger: '#cal', ...(hTween ? { containerAnimation: hTween, start: 'left 80%' } : { start: 'top 75%' }), toggleActions: 'play none none none' } });

    /* Hoa trôi khi cuộn dọc */
    if (!reduced) {
      $$('[data-drift]').forEach((el) => gsap.fromTo(el, { yPercent: 0 }, { yPercent: parseFloat(el.dataset.drift), ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 } }));
      $$('.venue-strip [data-par]').forEach((el) => gsap.fromTo(el, { yPercent: -15 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: .5 } }));
      $$('.dk-left [data-par]').forEach((el) => gsap.fromTo(el, { y: 18 }, { y: -18, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: .5 } }));
    }

    /* Đôi nhẫn: lồng vào nhau trước khi vòm kem dâng lên, sau đó vẫn tiến lại gần */
    const stage = $('#ringsStage'), words = $('#ringWords'), lis = $$('li', words), canvas = $('#rings');
    const ringsArea = $('.rings-area');
    new IntersectionObserver((es) => es.forEach((e) => { rings.visible = e.isIntersecting; if (e.isIntersecting) startRings(); }), { rootMargin: '60% 0px' }).observe(stage);
    let wordOn = -1;
    ScrollTrigger.create({
      trigger: ringsArea, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => {
        const h = innerHeight, full = ringsArea.offsetHeight - h;
        const meetAt = clamp((full - h) / full, .5, .9);
        rings.p = clamp(s.progress / meetAt, 0, 1);
        const lh = lis[0].offsetHeight;
        const t = clamp(s.progress / meetAt, 0, 1);
        words.style.transform = `translate3d(0,${lerp(lh, -lh, t).toFixed(1)}px,0)`;
        const on = Math.min(lis.length - 1, Math.floor(t * lis.length));
        if (on !== wordOn) { wordOn = on; lis.forEach((li, i) => li.classList.toggle('on', i === on)); }
        const after = clamp((s.progress - meetAt) / (1 - meetAt), 0, 1);
        canvas.style.transform = `scale(${(1 + after * .3).toFixed(3)})`;
        if (reduced || !rings.visible) return;
      },
    });
    lis[0].classList.add('on');

    /* Số ngày chạy về đúng con số */
    const num = $('#cdDays'), days = parseInt(num.textContent, 10);
    if (!reduced && Number.isFinite(days)) {
      ScrollTrigger.create({ trigger: '.days-title', start: 'top 80%', once: true, onEnter: () => {
        const o = { v: days + 40 }; num._rolling = true;
        gsap.to(o, { v: days, duration: 2, ease: 'power3.out', onUpdate: () => { num.textContent = Math.round(o.v); }, onComplete: () => { num._rolling = false; } });
      } });
    }

    /* Hai ô cửa lệch nhau khớp lại thành một, rồi mở ra hết màn hình */
    const winL = $('#winL'), winR = $('#winR'), winCopy = $('#winCopy'), winArea = $('.win-area');
    const side = compact ? 8 : 21, mid = compact ? 15 : 13;
    gsap.set(winL, { clipPath: `inset(${compact ? 32 : 36}% 50.5% ${compact ? 8 : 1}% ${side}%)` });
    gsap.set(winR, { clipPath: `inset(${compact ? 8 : 1}% ${side}% ${compact ? 32 : 36}% 50.5%)` });
    gsap.set(winCopy, { opacity: 0 });
    const winTl = gsap.timeline({ scrollTrigger: { trigger: winArea, start: 'top top', end: 'bottom bottom', scrub: SCRUB,
      onUpdate: (s) => { const b = s.progress > .68 ? 'photo' : 'cream'; if (winArea.dataset.bg !== b) { winArea.dataset.bg = b; queueHud(); } } } });
    winTl
      .to(winL, { clipPath: `inset(${mid}% 50.5% ${mid}% ${side}%)`, ease: 'none', duration: .36 }, 0)
      .to(winR, { clipPath: `inset(${mid}% ${side}% ${mid}% 50.5%)`, ease: 'none', duration: .36 }, 0)
      .fromTo('.win img', { scale: 1.14 }, { scale: 1, ease: 'none', duration: 1 }, 0)
      .to(winL, { clipPath: `inset(${mid}% 50% ${mid}% ${side}%)`, ease: 'none', duration: .1 }, .36)
      .to(winR, { clipPath: `inset(${mid}% ${side}% ${mid}% 50%)`, ease: 'none', duration: .1 }, .36)
      .to(winL, { clipPath: 'inset(0% 50% 0% 0%)', ease: 'power1.inOut', duration: .28 }, .46)
      .to(winR, { clipPath: 'inset(0% 0% 0% 50%)', ease: 'power1.inOut', duration: .28 }, .46)
      .to('#fWL', { xPercent: -60, yPercent: 30, ease: 'none', duration: .3 }, .44)
      .to('#fWR', { xPercent: 60, yPercent: -30, ease: 'none', duration: .3 }, .44)
      .fromTo(winCopy, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'none', duration: .16 }, .7);

    /* Bản đồ Google chỉ tải khi cuộn gần tới */
    const mapFrame = $('#mapFrame');
    if (mapFrame) {
      // Bản đồ là khung nặng của Google: chỉ gắn khi đã ở gần và người xem đang dừng cuộn
      let near = false, timer;
      const tryLoad = () => { clearTimeout(timer); timer = setTimeout(() => { if (near && !mapFrame.src) { mapFrame.src = mapFrame.dataset.src; removeEventListener('scroll', tryLoad); } }, 180); };
      const io = new IntersectionObserver((es) => { near = es[0].isIntersecting; if (near) tryLoad(); }, { rootMargin: '150% 0px' });
      io.observe(mapFrame);
      addEventListener('scroll', tryLoad, { passive: true });
    }

    /* Chữ hiện khi vào khung */
    const inTrack = (el) => hTween && el.closest('#track');
    const enter = (el, fn) => {
      // Bảng đầu của đoạn trượt ngang đã thấy ngay khi section trồi lên, nên hiện chữ theo cuộn dọc
      const opts = el.closest('.p-note') ? { trigger: '.track-area', start: 'top 72%' } : inTrack(el) ? { trigger: el, containerAnimation: hTween, start: 'left 92%' } : { trigger: el, start: 'top 90%' };
      ScrollTrigger.create({ ...opts, once: true, onEnter: fn });
    };
    if (!reduced) {
      $$('[data-r="a"], [data-r="h"]').forEach((el) => {
        const chars = splitChars(el); setHidden(chars);
        enter(el, () => showChars(chars, el.dataset.r));
      });
      $$('[data-r="p"]').forEach((el) => {
        const lines = splitLines(el);
        gsap.set(lines, { yPercent: 145 }); // đủ xa để dấu tiếng Việt không lọt khỏi mặt nạ
        enter(el, () => gsap.to(lines, { yPercent: 0, duration: 1.2, stagger: .09, ease: 'power3.out', onComplete: () => { el.innerHTML = el._html; } }));
      });
    }
  };

  /* ---------- Làm sẵn lúc rảnh để cuộn không phải chờ: giải mã ảnh trước, dựng nhẫn sau ---------- */
  const idle = () => new Promise((r) => { (window.requestIdleCallback || ((f) => setTimeout(f, 60)))(r, { timeout: 500 }); });
  const primeAll = async () => {
    for (const img of $$('main img')) {
      if (!img.decode) break;
      await idle();
      await img.decode().catch(() => {});
    }
    await idle();
    if (!rings.started) await startRings();
  };

  /* ---------- Màn mở đầu ---------- */
  const runPreloader = (ready) => new Promise((resolve) => {
    const pre = $('#pre');
    if (!pre || reduced) { killPre(); ready.then(() => resolve()); return; }
    const hole = $('#preHole'), copy = $('#preCopy'), bar = $('#preBar'), count = $('#preCount'), heroImg = $('#heroImg');
    let seen = false;
    try { seen = !!sessionStorage.getItem('ta-v4'); sessionStorage.setItem('ta-v4', '1'); } catch (e) {}
    const w0 = isCompact() ? 44 : 24, w1 = isCompact() ? 74 : 38;
    const W = innerWidth, H = innerHeight;
    const arch = { w: W * w0 / 100, h: 0 };
    const drawHole = () => {
      const x0 = (W - arch.w) / 2, x1 = x0 + arch.w, rx = arch.w / 2, ry = Math.min(rx, arch.h), top = H - arch.h;
      hole.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${x0} ${H}V${top + ry}A${rx} ${ry} 0 0 1 ${x1} ${top + ry}V${H}Z")`;
    };
    drawHole();
    gsap.set(heroImg, { scale: .84, transformOrigin: '55% 30%' });
    lock();
    scrollTo(0, 0);

    const names = $('.pre-names');
    const chars = splitChars(names);
    if (seen) gsap.set(copy, { display: 'none' });
    else { gsap.fromTo(chars, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: 1, stagger: .018, ease: 'power3.out', delay: .1 }); }

    const prog = { v: 0 };
    const paint = () => { bar.style.transform = `scaleX(${prog.v / 100})`; count.textContent = Math.round(prog.v); };
    const open = () => {
      gsap.timeline({ onComplete: () => { pre.remove(); unlock(); ScrollTrigger.refresh(); queueHud(); } })
        .to(copy, { opacity: 0, y: -24, duration: .5, ease: 'power2.in' }, 0)
        .to(arch, { w: W * w1 / 100, h: H * .74, duration: 1.1, ease: 'power4.inOut', onUpdate: drawHole }, .1)
        .to(arch, { w: Math.hypot(W, H) * 3.4, h: Math.hypot(W, H) * 3.4, duration: 1.5, ease: 'expo.inOut', onUpdate: drawHole }, 1)
        .to(heroImg, { scale: 1, duration: 1.7, ease: 'power3.inOut', clearProps: 'transform' }, .95)
        .call(heroIntro, null, 1.5);
      resolve();
    };
    if (seen) ready.then(open);
    else gsap.to(prog, { v: 88, duration: 1.25, ease: 'power1.inOut', onUpdate: paint, onComplete: () => ready.then(() => gsap.to(prog, { v: 100, duration: .35, ease: 'power2.out', onUpdate: paint, onComplete: open })) });
  });

  /* ---------- Khởi động ---------- */
  const boot = async () => {
    buildWreath(); buildCal(); initGuest(); initFlip();
    bgs.push(...$$('main [data-bg]'));
    const heroImg = $('#heroImg');
    // Chờ ảnh mở màn tải xong; decode() có thể treo khi tab chưa được vẽ nên không chờ decode
    const decoded = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); });
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const fontLoads = document.fonts ? Promise.all([document.fonts.load('400 40px "Noto Serif Display"', 'TRÂN TRỌNG KÍNH MỜI VIẾT BÙI ĐỜI ĐÌNH'), document.fonts.load('400 40px "Imperial Script"', 'Việt'), document.fonts.load('400 16px "Be Vietnam Pro"', 'Việt')]).catch(() => {}) : Promise.resolve();
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    const ready = Promise.race([Promise.all([decoded, fonts, fontLoads]), timeout(3500)]);

    const start = runPreloader(ready);
    await ready;

    startCountdown();
    fitAll();
    focusAll();
    layoutHero();
    initHeroSwitch();
    initTips(); initMagnetic(); initLogo(); initSbar(); initAlbum();
    const hideMenu = initMenu();
    initScenes();
    if (!reduced) {
      setHidden(splitChars($('[data-hero-r]')));
      $$('[data-hero-r]').forEach((p) => setHidden(splitChars(p)));
    }
    if (!$('#pre') && !reduced) heroIntro();

    // Liên kết nội bộ
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (!$('#menu').hidden) hideMenu(() => goTo(t));
      else goTo(t);
    });

    addEventListener('scroll', queueHud, { passive: true });
    let rs;
    const wasCompact = isCompact();
    addEventListener('resize', () => {
      clearTimeout(rs);
      rs = setTimeout(() => {
        if (isCompact() !== wasCompact) { location.reload(); return; }
        if (innerWidth !== lastW) { lastW = innerWidth; setVh(); }
        fitAll(); focusAll(); layoutHero();
        if (rings.resize) rings.resize();
        ScrollTrigger.refresh();
        queueHud();
      }, 160);
    });
    ScrollTrigger.addEventListener('refreshInit', () => { layoutHero(); });
    ScrollTrigger.refresh();
    queueHud();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitAll(); layoutHero(); ScrollTrigger.refresh(); });
    if (location.hash) { const t = $(location.hash); if (t) setTimeout(() => goTo(t, { immediate: true }), 60); }
    await start;
    setTimeout(primeAll, $('#pre') ? 3200 : 400);
  };
  boot().catch((err) => { console.error(err); killPre(); unlock(); });
})();
