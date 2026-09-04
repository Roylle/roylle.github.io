import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './case-study.css';
import { mountPrototype } from './case-prototypes.js';

const icon = name => ({
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
}[name]);

const projects = {
  grabroy: {
    name: 'GrabRoy',
    className: 'theme-grabroy',
    eyebrow: 'INDEPENDENT REDESIGN STUDY · 2026',
    title: 'Making a super-app feel like one coherent product.',
    intro: 'A systems-led redesign exploring how mobility, food, delivery, wallet and support can share one predictable interaction language — without flattening the needs of each service.',
    heroImage: '/projects/grabroy-home.webp',
    heroAlt: 'GrabRoy home screen showing ride, food and delivery services in one interface',
    figma: 'https://www.figma.com/design/qlJA7PYF4vu1NsQIwGN260/Royle_port?node-id=41-547',
    facts: [
      ['ROLE', 'Product designer · Independent'],
      ['SCOPE', 'IA · UI system · 60 screens · Prototype'],
      ['PLATFORM', 'Mobile app · Vietnamese interface'],
      ['FOCUS', 'Cross-service consistency & recovery'],
    ],
    disclosure: '<strong>Context, clearly stated.</strong> GrabRoy is not affiliated with Grab. Existing screenshots were used as reference material to study a mature super-app. The information architecture, screen reconstruction, component logic, recovery states and portfolio narrative are independent design work.',
    whyTitle: 'The interesting problem was not the home screen. It was the system behind it.',
    whyBody: [
      'A super-app asks people to switch between very different intentions: book a ride, order a meal, send a parcel, top up a wallet, then find support when something goes wrong. Feature breadth can quickly turn into navigation debt.',
      'This study began with a design hypothesis: if shared actions, states and recovery patterns become more consistent, people may spend less effort relearning the interface every time their intent changes. The goal was to expose and rebuild that underlying grammar.',
    ],
    questions: [
      ['01', 'How might five product areas still feel like one app?', 'Create a stable top-level model and reuse recognizable action, status and confirmation patterns.'],
      ['02', 'What happens outside the happy path?', 'Design missing-permission, empty, failed-payment, cancellation and support routes alongside primary flows.'],
      ['03', 'How can breadth remain maintainable?', 'Turn recurring structures into reusable families rather than drawing every screen as a one-off composition.'],
    ],
    method: [
      ['Inventory', 'Mapped the supplied references and separated product areas, shared utilities, repeated patterns and exceptional states.'],
      ['Model', 'Built a five-tab sitemap with explicit entry, service and recovery routes before refining visual detail.'],
      ['Systemize', 'Created reusable maps, service tiles, ride choices, food tiles and menu rows with consistent spacing and type roles.'],
      ['Stress-test', 'Connected representative Home, Food and Ride paths, then checked touch targets, overflow, state labels and action destinations.'],
    ],
    architectureImage: '/projects/grabroy-architecture.webp',
    architectureAlt: 'GrabRoy sitemap organizing ride, food, delivery, wallet, activity, messages and recovery routes',
    flowImage: '/projects/grabroy-flow.webp',
    flowAlt: 'GrabRoy user-flow map including wallet, activity, support and recovery branches',
    secondImage: '/projects/grabroy-wallet.webp',
    secondAlt: 'GrabRoy wallet top-up screen with preset amount, payment source, fee and confirmation information',
    decisionTitle: 'Recovery was treated as part of the product, not an appendix.',
    decisionBody: 'The wallet flow surfaces the source of funds, fee and total before confirmation. Failed payments lead back to a recoverable choice; missing history points to an appropriate empty state; denied location access provides manual address entry. These details make the concept more credible than a collection of polished happy-path screens.',
    evidence: [
      ['60', 'designed screens'],
      ['419', 'component instances'],
      ['271', 'prototype actions'],
      ['44px+', 'checked touch targets'],
    ],
    potential: [
      ['Faster orientation', 'A stable service model could reduce the mental reset required when switching tasks.'],
      ['Safer recovery', 'Explicit failure routes could reduce dead ends and make support feel connected to the task that caused it.'],
      ['Cleaner scaling', 'Reusable component families could help future services inherit interaction quality instead of fragmenting it.'],
    ],
    limits: 'This is a design-system and prototype exercise, not a shipped product. It does not claim access to Grab product strategy, user data or business outcomes. The next responsible step would be task-based usability testing across frequent and first-time users, followed by accessibility testing with assistive technology.',
    nextHref: '/cryproy.html',
    nextName: 'CrypRoy',
  },
  cryproy: {
    name: 'CrypRoy',
    className: 'theme-cryproy',
    eyebrow: 'INDEPENDENT REDESIGN STUDY · 2026',
    title: 'Designing confidence into a high-stakes trading flow.',
    intro: 'A focused spot-trading redesign that makes market context, order review, processing and failure recovery easier to read before any irreversible action is taken.',
    heroImage: '/projects/cryproy-home.webp',
    heroAlt: 'CrypRoy home screen showing balance, quick actions and market assets',
    figma: 'https://www.figma.com/design/G40J1jrBLzBNwJyyiij5is/CrypRoy?node-id=2022-4',
    facts: [
      ['ROLE', 'Product designer · Independent'],
      ['SCOPE', 'IA · Design system · 10 core screens'],
      ['PLATFORM', 'iOS concept · Spot trading'],
      ['FOCUS', 'Decision clarity & error recovery'],
    ],
    disclosure: '<strong>Context, clearly stated.</strong> CrypRoy is not affiliated with Binance and is not a trading product. Binance iOS screenshots were studied as reference evidence. The focused flow, interaction safeguards, design system, screen rebuilds and case-study conclusions are independent work.',
    whyTitle: 'In financial UX, “cleaner” is not enough. The interface must explain consequence.',
    whyBody: [
      'Trading screens compress balances, price movement, charts, order books and controls into a small viewport. Density is useful, but it becomes dangerous when visual hierarchy fails to distinguish information from commitment.',
      'This project narrowed a large reference library to one consequential task: buying BTC with USDT. The design hypothesis was that a visible review step, unambiguous processing state and recoverable failure path could reduce uncertainty without hiding useful market context.',
    ],
    questions: [
      ['01', 'What does a person need before entering an order?', 'Pair identity, live context, available balance and fee expectations must appear near the decision.'],
      ['02', 'How do we prevent accidental commitment?', 'Validate the amount inline, preserve edits and add a review step before the final submission.'],
      ['03', 'What should failure communicate?', 'State what happened, confirm whether funds changed, and offer retry or edit instead of a silent dead end.'],
    ],
    method: [
      ['Reduce', 'Audited 1,452 reference frames, then selected a narrow slice where design decisions could be evaluated deeply.'],
      ['Structure', 'Mapped discovery, pair detail, amount entry, review, processing, success, failure and wallet verification.'],
      ['Systemize', 'Built light/dark variables, typography and effects plus 22 component families for market, form and feedback patterns.'],
      ['Verify', 'Checked ten 390 × 844 screens, action sources, input errors, duplicate-submit protection and both success and timeout routes.'],
    ],
    architectureImage: '/projects/cryproy-flow.webp',
    architectureAlt: 'CrypRoy buy-BTC flow with amount validation, review, processing, success and failure recovery branches',
    flowImage: '/projects/cryproy-overview.webp',
    flowAlt: 'Ten CrypRoy spot-trading screens covering discovery, order entry, review, outcomes and wallet',
    secondImage: '/projects/cryproy-system.webp',
    secondAlt: 'CrypRoy design-system foundations with color, typography, spacing and interaction tokens',
    decisionTitle: 'The most important screen is the one between intent and commitment.',
    decisionBody: 'Review makes the estimated receive amount, reference price and fee explicit. Processing blocks duplicate submission while explaining what the system is doing. A timeout does not imply a failed trade: it keeps the reference visible, confirms that the shown balance is unchanged and offers both status retry and amount editing.',
    evidence: [
      ['1,452', 'references audited'],
      ['22', 'component families'],
      ['10', 'core flow screens'],
      ['2', 'explicit outcome paths'],
    ],
    potential: [
      ['Clearer commitment', 'A dedicated review layer could help people understand amount, fee and consequence before submitting.'],
      ['Lower error anxiety', 'Specific validation and timeout language could make recovery more actionable and trustworthy.'],
      ['System consistency', 'Semantic tokens and reusable market components could reduce visual drift across a dense product.'],
    ],
    limits: 'This is an illustrative portfolio prototype. Prices, balances and identifiers are fictional; no account, exchange, wallet or transaction is connected. No claim is made about improved conversion or reduced trading errors. The next step would be moderated comprehension testing, then validation with compliance, security and accessibility specialists.',
    nextHref: '/grabroy.html',
    nextName: 'GrabRoy',
  },
};

const project = projects[document.body.dataset.project] || projects.grabroy;
const isCrypRoy = project.name === 'CrypRoy';
document.body.classList.add(project.className);

document.querySelector('#app').innerHTML = `
  <a class="skip-link" href="#case-main">Skip to case study</a>
  <header class="case-header">
    <a class="portfolio-back" href="/#work">${icon('back')}<span>roylle.</span><span class="header-context">/ Selected work</span></a>
    <a class="header-action" href="${project.figma}" target="_blank" rel="noopener noreferrer">Open Figma ${icon('arrow')}</a>
  </header>
  <nav class="case-nav" aria-label="Case study sections">
    <a href="#overview">Overview</a><a href="#why">Problem</a><a href="#approach">Research</a><a href="#system">System</a><a class="case-nav-try" href="#prototype">Try it</a><a href="#outcome">Outcome</a>
  </nav>
  <main id="case-main">
    <section class="case-hero">
      <div class="hero-copy">
        <p class="eyebrow">${project.eyebrow}</p>
        <p class="project-word">${project.name}</p>
        <h1>${project.title}</h1>
        <p class="hero-intro">${project.intro}</p>
        <div class="hero-proof"><span><b>LIVE</b> Browser prototype</span><span><b>NO</b> Figma required</span></div>
        <a class="primary-link" href="#prototype">Try the interaction <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero-visual">
        <span class="visual-label">CORE INTERFACE / 01</span>
        <div class="phone-shell"><img src="${project.heroImage}" alt="${project.heroAlt}" width="393" height="852" fetchpriority="high"></div>
        <span class="visual-note">Independent concept<br>Designed in Figma</span>
      </div>
    </section>
    <section class="case-overview" id="overview">
      <div class="overview-copy">
        <p class="eyebrow">MOBILE APPLICATION DESIGN</p>
        <h2>${project.name}</h2>
        <p>${isCrypRoy ? 'A focused experience for making a high-stakes market decision with clearer context, review and recovery.' : 'A cross-service mobile experience that makes moving, ordering, paying and recovering feel like one product.'}</p>
        <dl><div><dt>DESIGN DIRECTION</dt><dd>${isCrypRoy ? 'Clarity under pressure' : 'One system, many intents'}</dd></div><div><dt>DELIVERABLE</dt><dd>Product story · UI system · Live prototype</dd></div></dl>
      </div>
      <div class="overview-devices" aria-label="Selected interface screens">
        <div class="overview-phone phone-a"><img src="${project.heroImage}" alt="${project.heroAlt}" width="393" height="852"></div>
        <div class="overview-phone phone-b"><img src="${project.secondImage}" alt="${project.secondAlt}" loading="lazy" decoding="async"></div>
      </div>
    </section>
    <section class="case-toc" aria-labelledby="toc-title">
      <div class="toc-title"><span>CASE STUDY</span><h2 id="toc-title">Table of<br>contents</h2><p>Scroll story · approximately 6 minutes</p></div>
      <ol><li><a href="#why"><span>01</span><strong>Project framing</strong><small>Context, problem and design hypothesis</small></a></li><li><a href="#approach"><span>02</span><strong>Research & structure</strong><small>Reference audit, sitemap and flow</small></a></li><li><a href="#system"><span>03</span><strong>Design development</strong><small>System choices and connected screens</small></a></li><li><a href="#prototype"><span>04</span><strong>Interactive prototype</strong><small>Test the meaningful paths in-browser</small></a></li><li><a href="#outcome"><span>05</span><strong>Outcome & reflection</strong><small>Evidence, hypotheses and limits</small></a></li></ol>
    </section>
    <div class="chapter-banner chapter-one"><span>PART I</span><h2>Project<br>Introduction</h2><p>${isCrypRoy ? 'How might a trading interface explain consequence before commitment?' : 'How might a broad service ecosystem still behave like one coherent app?'}</p></div>
    <section class="fact-grid" aria-label="Project facts">${project.facts.map(([label, value]) => `<div><span>${label}</span><p>${value}</p></div>`).join('')}</section>
    <aside class="disclosure"><span>01 / TRANSPARENCY</span><p>${project.disclosure}</p></aside>

    <section class="section-pad narrative" id="why">
      <div class="section-kicker"><span>01 / WHY THIS PROJECT</span><span>FROM REFERENCE TO REASONING</span></div>
      <div class="narrative-grid"><h2>${project.whyTitle}</h2><div>${project.whyBody.map(p => `<p>${p}</p>`).join('')}</div></div>
      <div class="question-grid">${project.questions.map(([n, title, body]) => `<article><span>${n}</span><h3>${title}</h3><p>${body}</p></article>`).join('')}</div>
    </section>

    <div class="chapter-banner chapter-two"><span>PART II</span><h2>Research &<br>Structure</h2><p>The reference material defines the domain. The design work begins when observations become explicit rules, routes and testable decisions.</p></div>
    <section class="section-pad approach" id="approach">
      <div class="section-kicker"><span>02 / APPROACH</span><span>STRUCTURE BEFORE SURFACE</span></div>
      <div class="section-heading"><h2>A redesign built from decisions, not imitation.</h2><p>The source established the domain. The work was to identify what deserved to stay, what needed a clearer rule, and how the pieces should behave as a coherent system.</p></div>
      <ol class="method-list">${project.method.map(([title, body], i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><div><h3>${title}</h3><p>${body}</p></div></li>`).join('')}</ol>
      <figure class="wide-figure"><img src="${project.architectureImage}" alt="${project.architectureAlt}" loading="lazy" decoding="async"><figcaption>Information architecture and recovery routes were resolved before full visual production.</figcaption></figure>
    </section>

    <div class="chapter-banner chapter-three"><span>PART III</span><h2>Design<br>Development</h2><p>${isCrypRoy ? 'A compact financial system where hierarchy separates information, decision and commitment.' : 'A shared interaction grammar that can flex across mobility, wallet and support.'}</p></div>
    <section class="section-pad system-section" id="system">
      <div class="section-kicker"><span>03 / SYSTEM & FLOW</span><span>DETAIL WITH A PURPOSE</span></div>
      <div class="decision-grid"><div><h2>${project.decisionTitle}</h2><p>${project.decisionBody}</p><ul><li>${icon('check')} Primary and recovery paths designed together</li><li>${icon('check')} Reusable language across repeated states</li><li>${icon('check')} Explicit feedback before and after commitment</li></ul></div><div class="device-detail"><img src="${project.secondImage}" alt="${project.secondAlt}" loading="lazy" decoding="async"></div></div>
      <figure class="wide-figure showcase"><img src="${project.flowImage}" alt="${project.flowAlt}" loading="lazy" decoding="async"><figcaption>The result is presented as a connected product slice, not a gallery of isolated screens.</figcaption></figure>
    </section>

    <div class="chapter-banner chapter-four"><span>PART IV</span><h2>Prototype &<br>Validation</h2><p>Static screens become credible when the reviewer can follow a decision, receive feedback and recover from a problem.</p></div>
    <section class="prototype-section" id="prototype" aria-label="Interactive browser prototype"><div class="prototype-mount"></div></section>

    <section class="section-pad outcome" id="outcome">
      <div class="section-kicker"><span>05 / OUTCOME</span><span>ARTIFACT EVIDENCE, NOT VANITY METRICS</span></div>
      <div class="evidence-grid">${project.evidence.map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>
      <div class="section-heading"><h2>What this direction could solve.</h2><p>These are product hypotheses supported by the prototype — not claims of shipped impact. They define what should be tested next.</p></div>
      <div class="potential-grid">${project.potential.map(([title, body], i) => `<article><span>0${i + 1}</span><h3>${title}</h3><p>${body}</p></article>`).join('')}</div>
    </section>

    <section class="section-pad reflection" id="reflection">
      <div class="section-kicker"><span>06 / REFLECTION</span><span>WHAT THE WORK DOES — AND DOES NOT — PROVE</span></div>
      <div class="reflection-grid"><h2>The honest boundary makes the project stronger.</h2><div><p>${project.limits}</p><a class="primary-link" href="${project.figma}" target="_blank" rel="noopener noreferrer">Inspect the editable Figma work ${icon('arrow')}</a></div></div>
    </section>
  </main>
  <footer class="case-footer"><a href="/#work">${icon('back')} All selected work</a><span>ROYLLE · INDEPENDENT PRODUCT DESIGN · 2026</span><a href="${project.nextHref}">Next: ${project.nextName} ${icon('arrow')}</a></footer>
`;

mountPrototype(document.querySelector('.prototype-mount'), isCrypRoy ? 'cryproy' : 'grabroy');

// The app shell is injected after the browser resolves a hash, so restore deep-link
// positioning once the target section exists (e.g. /cryproy.html#prototype).
if (window.location.hash) {
  const scrollToHashTarget = () => document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  requestAnimationFrame(scrollToHashTarget);
  window.addEventListener('load', scrollToHashTarget, { once: true });
  const pendingImages = [...document.images]
    .filter(image => !image.complete)
    .map(image => new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    }));
  Promise.allSettled(pendingImages).then(scrollToHashTarget);
  document.fonts?.ready.then(scrollToHashTarget);
}
