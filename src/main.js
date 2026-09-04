import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './style.css';
import './mobile.css';
import './project-covers.css';
import { projects } from './projects.js';
import { createPixelField } from './pixels.js';
import zaloIcon from './icons/zalo.svg?raw';
import phoneIcon from './icons/phone.svg?raw';
import mailIcon from './icons/mail.svg?raw';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const mark = '<svg class="pixel-mark" viewBox="0 0 28 28" aria-hidden="true"><path fill="currentColor" d="M0 0h7v7H0zm21 0h7v7h-7zM7 7h7v7H7zm7 0h7v7h-7zM7 14h7v7H7zm7 0h7v7h-7zM0 21h7v7H0zm21 0h7v7h-7z"/></svg>';

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#work">Skip to projects</a>
  <header class="header">
    <a class="wordmark" href="#home" aria-label="Roylle, home">${mark}<span>roylle<span class="wordmark-dot">.</span></span></a>
    <nav aria-label="Main navigation"><a href="#work">Work <sup>${projects.length}</sup></a><a href="#about">About</a><a href="#contact" class="nav-contact" aria-label="Contact">Let’s talk ${arrow}</a></nav>
  </header>
  <main>
    <section id="home" class="hero">
      <div class="hero-meta mono"><span>AI PRODUCT DESIGNER · PERSONAL PORTFOLIO</span><span>BASED IN HO CHI MINH CITY, VN <span class="small-star">✳</span></span></div>
      <div class="hero-heading"><h1>Digital by design.<br><span>Human by nature.</span></h1><div class="hero-intro"><span class="intro-line"></span><p>I’m Hoang Le (Roylle).<br>Product design, human insight,<br>and a fluent AI toolkit.</p><a class="text-link" href="#work">Explore my work <span aria-hidden="true">↘</span></a></div></div>
      <div class="artwork"><canvas id="pixel-field" aria-hidden="true"></canvas><div class="artwork-caption mono"><span><span class="live-dot"></span><span class="pointer-hint">MOVE TO SHAPE A SMILE · HOLD TO MAKE WAVES</span><span class="touch-hint">A LITTLE LOGIC. A LITTLE PLAY.</span></span><button id="motion-toggle" type="button" aria-pressed="false">Pause motion</button></div></div>
      <div class="hero-bottom mono"><span>PRODUCT DESIGN · AI · WEB & APPS</span><a href="#work">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div>
    </section>

    <section class="work section" id="work" aria-labelledby="work-title">
      <div class="section-label mono"><span>01 / SELECTED WORK</span><span>A FEW THINGS I’VE PUT MY HEART INTO</span></div>
      <div class="work-heading"><h2 id="work-title">Ideas made <span class="serif-word">real.</span></h2><p>Different challenges. Different worlds.<br>The same attention to every detail.</p></div>
      <div class="filters" role="group" aria-label="Filter projects"><button class="active" data-filter="all" aria-pressed="true">All work <span>${projects.length}</span></button><button data-filter="web" aria-pressed="false">Websites <span>${projects.filter(p => p.category === 'web').length}</span></button><button data-filter="app" aria-pressed="false">Apps & systems <span>${projects.filter(p => p.category === 'app').length}</span></button><button data-filter="play" aria-pressed="false">Explorations <span>${projects.filter(p => p.category === 'play').length}</span></button></div>
      <p class="sr-only" id="filter-status" role="status" aria-live="polite"></p>
      <div id="project-grid" class="project-grid"></div>
      <div class="more-work"><button class="outline-button" id="show-more">Explore all ${projects.length} projects <span aria-hidden="true">↗</span></button><a href="https://www.behance.net/hoangle1999" target="_blank" rel="noopener noreferrer" class="text-link">Visit my Behance ${arrow}</a></div>
    </section>

    <section class="about section" id="about" aria-labelledby="about-title">
      <div class="section-label mono"><span>02 / A LITTLE ABOUT ME</span><span>THE PERSON BEHIND THE PIXELS</span></div>
      <div class="about-layout"><div class="about-stamp" aria-hidden="true"><div class="stamp-grid">${mark}</div><span class="mono">HOANG LE (ROYLLE)<br>HUMAN THINKING. AI POSSIBILITIES.</span></div><div class="about-copy"><h2 id="about-title">Human insight.<br><span class="serif-word">AI possibilities.</span></h2><p>I’m Hoang Le (Roylle), a product designer based in Ho Chi Minh City. I’ve been working in UI/UX since 2022, across web platforms, mobile apps, enterprise systems, and immersive VR/AR experiences.</p><p>Technology has fascinated me since primary school. In high school, that curiosity grew into a love of design and programming — two ways of thinking that still shape how I approach products today.</p><p>My next chapter is AI Product Design. I’m fluent in Codex, ChatGPT, Gemini, Flow Labs, and Claude, and I’m developing a practice that brings these tools into the design process while keeping people, context, and clear interactions at its heart.</p><div class="about-links"><a class="text-link" href="mailto:hoanglv.md1999@gmail.com">Say hello ${arrow}</a><span class="mono">PRODUCT THINKING · UI/UX · AI</span></div></div></div>
      <div class="profile-section">
        <div class="profile-label"><span class="mono">MY TOOLKIT</span><h3>New tools.<br>Same curiosity.</h3></div>
        <div class="profile-content"><p class="profile-lead">A fluent AI toolkit, grounded in a hands-on design foundation.</p><ul class="ai-tools" aria-label="AI tools I use proficiently"><li><span class="mono">01</span>Codex</li><li><span class="mono">02</span>ChatGPT</li><li><span class="mono">03</span>Gemini</li><li><span class="mono">04</span>Flow Labs</li><li><span class="mono">05</span>Claude</li></ul><p class="foundation"><span class="mono">DESIGN FOUNDATION</span>Figma · Photoshop · Illustrator · HTML/CSS · Interactive technology design</p></div>
      </div>
      <div class="capabilities"><details open><summary><span class="mono">01</span><span>Product & interface design</span><span class="expand-icon" aria-hidden="true">+</span></summary><p>End-to-end UI/UX for websites, mobile apps, landing pages, dashboards, and enterprise systems. Connecting user flows, interface detail, and a consistent visual language.</p></details><details><summary><span class="mono">02</span><span>Immersive & interactive experiences</span><span class="expand-icon" aria-hidden="true">+</span></summary><p>Interfaces for VR/AR experiences and hardware-integrated products, with attention to intuitive interaction flows and accessibility in immersive environments.</p></details><details><summary><span class="mono">03</span><span>Design collaboration & mentoring</span><span class="expand-icon" aria-hidden="true">+</span></summary><p>Working with developers, product managers, and marketers, mentoring junior designers, and reviewing UI work for alignment with UX strategy and brand guidelines.</p></details></div>
      <div class="profile-section experience-section">
        <div class="profile-label"><span class="mono">EXPERIENCE</span><h3>Built through<br>real projects.</h3></div>
        <div class="profile-content experience-list">
          <article class="experience-entry"><div class="experience-heading"><div><h3>nanoHome</h3><p>UI/UX Designer · Marketing team</p></div><a class="company-link mono" href="https://nanohome.vn/" target="_blank" rel="noopener noreferrer" aria-label="Visit nanoHome website">NANOHOME.VN ${arrow}</a></div><p class="experience-description">UI/UX work within nanoHome’s marketing team, collaborating with the developers at CoderPush. Working close to marketing deepened my understanding of e-commerce: how customer needs, the shopping journey, and business goals connect.</p></article>
          <article class="experience-entry"><div class="experience-heading"><div><h3>Orchestars</h3><p>UI/UX Designer · Development collaboration</p></div><a class="company-link mono" href="https://www.orchestars.vn/" target="_blank" rel="noopener noreferrer" aria-label="Visit Orchestars website">ORCHESTARS.VN ${arrow}</a></div><p class="experience-description">UI/UX for Orchestars, collaborating with CoderPush’s development team to connect interface design with implementation for a music and events platform.</p></article>
          <article class="experience-entry"><div class="experience-heading"><div><h3>Dai Quoc Viet</h3><p>UI/UX Designer · Ho Chi Minh City</p></div><span class="mono">OCT 2022 — APR 2025</span></div><p class="experience-description">Led the UI/UX design process for websites, mobile apps, and interactive platforms using Figma. Mentored junior designers and collaborated across product, development, and marketing teams.</p><details class="experience-projects"><summary><span class="mono">↗</span><span>Selected projects from this role</span><span class="expand-icon" aria-hidden="true">+</span></summary><ul><li>Historical Route digitalization — Ward 10, Go Vap District</li><li>CMS for Ho Chi Minh City Exhibition Information Center</li><li>Digitalization products for the Museum of Fine Arts</li><li>Dai Quoc Viet company website</li><li>Ho Chi Minh City Museum & Historical Sites mobile app</li></ul></details></article>
        </div>
      </div>
      <div class="profile-section education-section">
        <div class="profile-label"><span class="mono">EDUCATION</span><h3>Always learning.</h3></div>
        <div class="profile-content"><ul class="education-list"><li><div><h3>Capi Demy</h3><p>UX Design Certificate</p></div><span class="mono">2023</span></li><li><div><h3>Arena Multimedia</h3><p>UI Design Course</p></div><span class="mono">2020 — 2022</span></li><li><div><h3>Vietnam Aviation Academy</h3><p>Bachelor of Business Administration</p><p class="education-context">My business background helps me connect design decisions with business vision and understand the logic of a system — how its goals, processes, and people fit together.</p></div><span class="mono">2018 — 2022</span></li></ul><p class="language-note mono">LANGUAGE · INTERMEDIATE ENGLISH</p></div>
      </div>
    </section>

    <section class="contact" id="contact" aria-labelledby="contact-title"><div class="contact-inner"><div class="section-label mono"><span>03 / START A CONVERSATION</span><span>GOOD THINGS START WITH A HELLO.</span></div><div class="contact-heading"><h2 id="contact-title">Have something<br>in <span class="serif-word">mind?</span></h2><a class="contact-arrow" href="mailto:hoanglv.md1999@gmail.com" aria-label="Email Roylle">${arrow}</a></div><div class="contact-bottom"><a class="email-link" href="mailto:hoanglv.md1999@gmail.com">hoanglv.md1999@gmail.com</a><p>A product idea, an AI exploration, or a design role.<br>Let’s start a conversation.</p></div></div></section>
  </main>
  <nav class="quick-contact" aria-label="Quick contact">
    <a class="quick-contact-link" href="https://zalo.me/0338341000" target="_blank" rel="noopener noreferrer" aria-label="Chat on Zalo: 0338 341 000"><span class="quick-contact-icon zalo-icon" aria-hidden="true">${zaloIcon}</span><span class="quick-contact-label">Zalo</span><span class="quick-contact-tooltip" aria-hidden="true">Chat on Zalo · 0338 341 000</span></a>
    <a class="quick-contact-link" href="tel:+84338341000" aria-label="Call Roylle: 0338 341 000"><span class="quick-contact-icon" aria-hidden="true">${phoneIcon}</span><span class="quick-contact-label">0338 341 000</span><span class="quick-contact-tooltip" aria-hidden="true">Call · 0338 341 000</span></a>
    <a class="quick-contact-link" href="mailto:hoanglv.md1999@gmail.com" aria-label="Email Roylle: hoanglv.md1999@gmail.com"><span class="quick-contact-icon" aria-hidden="true">${mailIcon}</span><span class="quick-contact-label">Email</span><span class="quick-contact-tooltip" aria-hidden="true">hoanglv.md1999@gmail.com</span></a>
  </nav>
  <footer><a class="wordmark" href="#home">${mark}<span>roylle.</span></a><span class="mono">© ${new Date().getFullYear()} ROYLLE</span><a class="text-link" href="https://www.behance.net/hoangle1999" target="_blank" rel="noopener noreferrer">Behance ${arrow}</a><a class="back-top mono" href="#home">BACK TO TOP ↑</a></footer>
  <dialog id="project-dialog" aria-labelledby="dialog-title"><div class="dialog-bar"><span class="mono">PROJECT PREVIEW</span><button class="close-dialog" aria-label="Close project preview">Close <span aria-hidden="true">×</span></button></div><div id="dialog-content"></div></dialog>
`;

let activeFilter = 'all', expanded = false;
const grid = document.querySelector('#project-grid');
const showMore = document.querySelector('#show-more');
const dialog = document.querySelector('#project-dialog');
let lastTrigger = null;

function renderProjects() {
  const filtered = activeFilter === 'all' ? projects : projects.filter(p => p.category === activeFilter);
  const shown = activeFilter === 'all' && !expanded ? filtered.slice(0, 6) : filtered;
  grid.innerHTML = shown.map((p) => `<article class="project-card"><button class="project-open" data-project="${p.slug}" aria-label="View ${p.name} project"><span class="project-image${p.presentation === 'device' ? ' device-cover' : ''}" style="--project-bg:${p.color}"><img src="${p.image}" alt="${p.name} — ${p.scope}" width="808" height="632" loading="lazy" decoding="async"><span class="project-hover">Explore case study ${arrow}</span><span class="project-index mono">${String(projects.indexOf(p) + 1).padStart(2, '0')} /</span>${p.local ? '<span class="project-badge mono">CASE STUDY</span>' : ''}</span><span class="project-info"><span><span class="project-name">${p.name}</span><span class="project-subtitle">${p.subtitle}</span></span><span class="project-link-icon">${arrow}</span></span></button><p class="project-type mono">${p.type}</p></article>`).join('');
  showMore.hidden = activeFilter !== 'all';
  showMore.innerHTML = expanded ? 'Show selected projects <span aria-hidden="true">↑</span>' : `Explore all ${projects.length} projects <span aria-hidden="true">↗</span>`;
  document.querySelector('#filter-status').textContent = `Showing ${shown.length} ${activeFilter === 'all' ? 'projects' : document.querySelector(`[data-filter="${activeFilter}"]`).textContent.replace(/\d/g, '').trim() + ' projects'}`;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  renderProjects();
}));
showMore.addEventListener('click', () => {
  expanded = !expanded; renderProjects();
  if (!expanded) document.querySelector('#work').scrollIntoView({ behavior: 'instant' });
});
grid.addEventListener('click', e => {
  const trigger = e.target.closest('[data-project]');
  if (!trigger) return;
  lastTrigger = trigger;
  const p = projects.find(p => p.slug === trigger.dataset.project);
  if (p.local) { window.location.assign(p.url); return; }
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-intro"><p class="mono">${p.type}</p><h2 id="dialog-title">${p.name}</h2><p>${p.summary}</p><div class="dialog-meta"><div><span class="mono">DESIGNER</span><span>Hoang Le (Roylle)</span></div><div><span class="mono">PROJECT</span><span>${p.scope}</span></div></div><a class="solid-button" href="${p.url}" target="_blank" rel="noopener noreferrer">View full project on Behance ${arrow}</a></div><img class="dialog-cover" src="${p.image}" alt="${p.name} project cover" width="808" height="632">${p.detail ? `<div class="detail-artwork"><p class="mono">A CLOSER LOOK</p><img src="/projects/${p.slug}-detail.webp" alt="${p.name} original design presentation" loading="lazy" decoding="async"></div>` : ''}<a class="dialog-source text-link" href="${p.url}" target="_blank" rel="noopener noreferrer">Explore the complete presentation on Behance ${arrow}</a>`;
  dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('modal-open');
});
function closeDialog() { dialog.close(); }
document.querySelector('.close-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); lastTrigger?.focus({ preventScroll: true }); });
document.addEventListener('error', e => {
  if (e.target instanceof HTMLImageElement) {
    e.target.classList.add('image-unavailable');
    e.target.alt = 'Preview unavailable — open the complete project on Behance.';
  }
}, true);

renderProjects();
const disposePixels = createPixelField(document.querySelector('#pixel-field'), document.querySelector('#motion-toggle'));
if (import.meta.hot) import.meta.hot.dispose(disposePixels);

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('header nav a').forEach(a => {
      const active = a.hash === `#${entry.target.id}`;
      a.classList.toggle('current', active);
      if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-10% 0px -65% 0px' });
document.querySelectorAll('main > section').forEach(section => navObserver.observe(section));
