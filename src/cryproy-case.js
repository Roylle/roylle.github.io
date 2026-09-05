import './cryproy-case.css';

export function cryproyCase() {
  return `
    <a class="skip-link" href="#case-main">Skip to demo</a>
    <header class="case-header cr-case-header">
      <a class="portfolio-back" href="/#work"><span>roylle.</span><span class="header-context">/ CrypRoy</span></a>
      <nav aria-label="Case study"><a href="#design-notes">Design notes</a><a href="/cryproy-demo.html" target="_blank" rel="noopener">Open app ↗</a></nav>
    </header>
    <main id="case-main">
      <section id="prototype" class="cr-first-demo" aria-label="Try CrypRoy"><div class="prototype-mount"></div></section>
      <section id="design-notes" class="cr-case-notes">
        <div class="cr-notes-heading"><div><p class="eyebrow">THE DESIGN IN BRIEF</p><h2>Clarity before commitment.</h2></div><p>A focused spot-trading concept: help people understand what they are buying, what it costs, and what happens next.</p></div>
        <div class="cr-decision-cards">
          <article><span>01 / CONTEXT</span><h3>Keep the decision close.</h3><p>Pair, price and available balance sit beside the action. Amount validation includes the fee.</p></article>
          <article><span>02 / CONFIRMATION</span><h3>Review before you commit.</h3><p>Show the total, estimated receive amount and remaining balance before confirming an order.</p></article>
          <article><span>03 / RECOVERY</span><h3>Make uncertainty actionable.</h3><p>A timeout retains the order reference. Checking status resolves that order without sending it twice.</p></article>
        </div>
        <details class="cr-design-details"><summary>Explore the flow & design system <span aria-hidden="true">+</span></summary><div><p>Built in Figma, then translated into a working browser demo. Explore the connected screens, reusable components and recovery paths.</p><div class="cr-resource-links"><a href="https://www.figma.com/design/G40J1jrBLzBNwJyyiij5is/CrypRoy?node-id=2022-4" target="_blank" rel="noopener">UI screens ↗</a><a href="https://www.figma.com/design/G40J1jrBLzBNwJyyiij5is/CrypRoy?node-id=2022-3" target="_blank" rel="noopener">User flow ↗</a><a href="https://www.figma.com/design/G40J1jrBLzBNwJyyiij5is/CrypRoy?node-id=2001-2005" target="_blank" rel="noopener">Design system ↗</a></div></div></details>
        <p class="cr-case-boundary">Independent concept by Roylle, inspired by a Binance reference audit. Not affiliated with Binance. Demo prices and balances are simulated; usability and business impact have not been measured.</p>
      </section>
    </main>
    <footer class="case-footer cr-short-footer"><a href="/#work">← All selected work</a><a href="/grabroy.html">Next: GrabRoy ↗</a></footer>`;
}
