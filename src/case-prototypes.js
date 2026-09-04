const glyph = (name) => ({
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h10A2.5 2.5 0 0 1 19 7.5V8h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1v.5a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 17.5v-10ZM19 11h-3v3h3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 19 6v5c0 4.2-2.6 7.9-7 10-4.4-2.1-7-5.8-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
}[name]);

const formatNumber = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0));

const grabCopy = {
  title: 'Try the service handoff.',
  body: 'Switch between a ride request, wallet top-up and recovery route. The same controls and feedback patterns should still feel familiar when the task changes.',
  checks: ['Choose a task', 'Follow its decision point', 'Test a completion or recovery state'],
};

const crypCopy = {
  title: 'Try the commitment moment.',
  body: 'Enter an illustrative order, review it, then choose a successful submission or a timeout. The point is to make the consequence and recovery route visible.',
  checks: ['Enter an amount', 'Review before submit', 'Test success or timeout recovery'],
};

function phoneHeader(title, canBack) {
  return `<div class="demo-phone-header">${canBack ? `<button class="demo-icon-button" data-action="back" aria-label="Go back">${glyph('back')}</button>` : '<span class="demo-icon-spacer" aria-hidden="true"></span>'}<strong>${title}</strong><button class="demo-icon-button" data-action="reset" aria-label="Reset prototype">↺</button></div>`;
}

function grabScreen(state) {
  const service = (name, title, description, tone) => `<button class="grab-service ${tone}" data-screen="${name}"><span class="grab-service-icon">${name === 'wallet' ? glyph('wallet') : name === 'support' ? glyph('shield') : glyph('arrow')}</span><span><strong>${title}</strong><small>${description}</small></span>${glyph('arrow')}</button>`;
  const bottom = '<div class="demo-bottom-nav"><span class="active">Home</span><span>Activity</span><span>Messages</span><span>Account</span></div>';

  if (state.screen === 'ride') return `${phoneHeader('Book a ride', true)}<div class="demo-screen-body grab-screen"><p class="demo-overline">PICK-UP</p><div class="grab-location"><strong>Saigon Centre</strong><span>65 Lê Lợi, Quận 1</span></div><p class="demo-overline">WHERE TO?</p><button class="grab-destination" data-screen="ride-review"><span></span><strong>Thảo Điền, Thủ Đức</strong>${glyph('arrow')}</button><div class="grab-map"><span class="map-pin pin-a"></span><span class="map-pin pin-b"></span><i></i></div><p class="demo-help">Destination is editable before confirmation.</p></div>`;
  if (state.screen === 'ride-review') { const car = state.rideType === 'Car'; return `${phoneHeader('Choose a ride', true)}<div class="demo-screen-body grab-screen"><div class="demo-progress"><span class="is-current"></span><span class="is-current"></span><span></span></div><h3>One route. Clear choices.</h3><button class="ride-choice ${car ? '' : 'selected'}" data-action="choose-ride" data-ride="Bike"><span class="ride-dot"></span><span><strong>Bike</strong><small>3 min · helmet included</small></span><b>₫28k</b></button><button class="ride-choice ${car ? 'selected' : ''}" data-action="choose-ride" data-ride="Car"><span class="ride-dot car"></span><span><strong>Car</strong><small>5 min · 4 seats</small></span><b>₫62k</b></button><div class="demo-summary"><span>Pickup · Saigon Centre</span><strong>Thảo Điền</strong></div><button class="demo-primary grab-primary" data-screen="ride-match">Confirm ${state.rideType} <span>${car ? '₫62k' : '₫28k'}</span></button></div>`; }
  if (state.screen === 'ride-match') return `${phoneHeader('Driver found', true)}<div class="demo-screen-body grab-screen grab-complete"><div class="status-orb success">${glyph('check')}</div><p class="demo-overline">RIDE CONFIRMED</p><h3>Minh is 3 minutes away.</h3><p class="demo-copy">The status is specific, and the next action stays close to the task.</p><div class="driver-card"><span class="driver-avatar">M</span><span><strong>Minh · 4.9</strong><small>Honda Wave · 59X2 184.34</small></span><button class="demo-small-button">Call</button></div><button class="demo-secondary" data-screen="support">Need help with this ride?</button></div>`;
  if (state.screen === 'wallet') return `${phoneHeader('GrabRoy Wallet', true)}<div class="demo-screen-body grab-screen"><div class="wallet-balance"><span>AVAILABLE BALANCE</span><strong>₫1,240,000</strong><small>Sample balance in prototype</small></div><h3>How much would you like to add?</h3><div class="amount-grid">${[50000, 100000, 200000, 500000].map(value => `<button data-amount="${value}" class="${state.amount === value ? 'selected' : ''}">₫${value / 1000}k</button>`).join('')}</div><div class="demo-summary"><span>Source · Visa •••• 4042</span><strong>Fee · ₫0</strong></div><button class="demo-primary grab-primary" data-screen="wallet-review">Review top up <span>₫${state.amount / 1000}k</span></button></div>`;
  if (state.screen === 'wallet-review') return `${phoneHeader('Review top up', true)}<div class="demo-screen-body grab-screen"><div class="demo-progress"><span class="is-current"></span><span class="is-current"></span><span></span></div><p class="demo-overline">PLEASE REVIEW</p><h3>₫${formatNumber(state.amount)}</h3><div class="review-list"><div><span>To</span><strong>GrabRoy Wallet</strong></div><div><span>Source</span><strong>Visa •••• 4042</strong></div><div><span>Fee</span><strong>₫0</strong></div></div><button class="demo-primary grab-primary" data-screen="wallet-success">Confirm top up</button><button class="demo-text-button" data-screen="wallet">Edit amount</button></div>`;
  if (state.screen === 'wallet-success') return `${phoneHeader('Wallet updated', true)}<div class="demo-screen-body grab-screen grab-complete"><div class="status-orb success">${glyph('check')}</div><p class="demo-overline">TOP UP COMPLETE</p><h3>₫${formatNumber(state.amount)} is ready to use.</h3><p class="demo-copy">The confirmation closes the loop without making the user search for the next state.</p><div class="wallet-balance small"><span>NEW AVAILABLE BALANCE</span><strong>₫${formatNumber(1240000 + state.amount)}</strong></div><button class="demo-secondary" data-screen="home">Back to home</button></div>`;
  if (state.screen === 'support') return `${phoneHeader('Ride support', true)}<div class="demo-screen-body grab-screen"><div class="status-orb warning">!</div><p class="demo-overline">RECOVERY, NOT A DEAD END</p><h3>What do you need help with?</h3><button class="support-option" data-screen="ride-match"><span><strong>Check driver status</strong><small>See the current ride state again</small></span>${glyph('arrow')}</button><button class="support-option" data-screen="home"><span><strong>Start a new request</strong><small>Return to services without losing context</small></span>${glyph('arrow')}</button><p class="demo-help">This demonstrates a route back to the task, rather than a generic support wall.</p></div>`;
  return `${phoneHeader('Good afternoon, Roy', false)}<div class="demo-screen-body grab-screen"><div class="grab-map home-map"><span class="map-pin pin-a"></span><i></i><small>City map · sample view</small></div><div class="grab-greeting"><p>WHAT DO YOU NEED?</p><h3>Move, eat, send or pay.</h3></div><div class="grab-services">${service('ride', 'Ride', 'Get there', 'green')}${service('wallet', 'Wallet', 'Top up in seconds', 'yellow')}${service('support', 'Support', 'Recover a task', 'blue')}</div></div>${bottom}`;
}

function crypScreen(state) {
  const amount = Number(state.amount || 0);
  const valid = amount >= 20 && amount <= 12400;
  const receive = (amount / 85650).toFixed(6);
  const error = amount > 12400 ? 'Amount is above the illustrative available balance of 12,400 USDT.' : amount > 0 && amount < 20 ? 'Minimum illustrative order is 20 USDT.' : '';
  const actionLabel = state.outcome === 'timeout' ? 'Simulate timeout' : 'Review order';
  if (state.screen === 'order') return `${phoneHeader('Buy BTC', true)}<div class="demo-screen-body cryp-screen"><div class="trade-pair"><span class="btc-mark">₿</span><span><strong>BTC / USDT</strong><small>Illustrative spot order</small></span><b>85,650.24</b></div><div class="demo-progress"><span class="is-current"></span><span></span><span></span></div><label class="trade-label" for="order-amount">You pay <span>Available: 12,400 USDT</span></label><div class="trade-input ${error ? 'has-error' : ''}"><input id="order-amount" inputmode="decimal" type="text" pattern="[0-9]*[.]?[0-9]*" value="${state.amount}" aria-describedby="order-help order-error"><strong>USDT</strong></div><p id="order-help" class="input-help">Sample data only — no order will be placed.</p><p id="order-error" class="input-error" role="alert">${error}</p><div class="amount-grid trade-presets">${[100, 500, 1000, 12400].map(value => `<button data-amount="${value}" class="${amount === value ? 'selected' : ''}">${value === 12400 ? 'Max' : `${value} USDT`}</button>`).join('')}</div><div class="trade-receive"><span>You receive (est.)</span><strong>${receive} BTC</strong><small>Reference price 85,650.24 USDT</small></div><button class="demo-primary cryp-primary" data-action="to-review" ${valid ? '' : 'disabled'}>${actionLabel}${glyph('arrow')}</button></div>`;
  if (state.screen === 'review') return `${phoneHeader('Review order', true)}<div class="demo-screen-body cryp-screen"><div class="demo-progress"><span class="is-current"></span><span class="is-current"></span><span></span></div><p class="demo-overline">ONE LAST CHECK</p><h3>Confirm what changes.</h3><div class="review-list dark-list"><div><span>Pair</span><strong>BTC / USDT</strong></div><div><span>You pay</span><strong>${formatNumber(amount)} USDT</strong></div><div><span>You receive (est.)</span><strong>${receive} BTC</strong></div><div><span>Fee</span><strong>0.00 USDT</strong></div></div><p class="demo-help">Price and estimated receive are illustrative. A review step makes the commitment legible before submission.</p><button class="demo-primary cryp-primary" data-action="submit">Submit illustrative order</button><button class="demo-text-button" data-screen="order">Edit order</button></div>`;
  if (state.screen === 'processing') return `${phoneHeader('Submitting order', false)}<div class="demo-screen-body cryp-screen center-state" aria-live="polite"><div class="status-orb loading"><i></i></div><p class="demo-overline">PROCESSING</p><h3>We are checking your order.</h3><p class="demo-copy">The button is disabled while a response is pending, so duplicate submissions cannot occur.</p><div class="processing-line"><span></span></div></div>`;
  if (state.screen === 'success') return `${phoneHeader('Order submitted', false)}<div class="demo-screen-body cryp-screen center-state"><div class="status-orb success">${glyph('check')}</div><p class="demo-overline">ORDER ACCEPTED</p><h3>Your BTC order was submitted.</h3><p class="demo-copy">This prototype does not connect to an exchange. The outcome shows the feedback a real system would need to provide.</p><div class="receipt"><span>ORDER REFERENCE</span><strong>CR-2026-0918</strong><small>${receive} BTC · illustrative</small></div><button class="demo-secondary dark-secondary" data-screen="markets">Back to markets</button></div>`;
  if (state.screen === 'error') return `${phoneHeader('Order status', false)}<div class="demo-screen-body cryp-screen center-state"><div class="status-orb error">!</div><p class="demo-overline">NO CONFIRMATION YET</p><h3>Your order status is still unknown.</h3><p class="demo-copy">No balance change is shown in this prototype. Rather than call it a failure, the UI explains what is known and gives a recovery path.</p><div class="receipt warning-receipt"><span>REFERENCE RETAINED</span><strong>CR-2026-0918</strong><small>Check status or edit amount</small></div><button class="demo-primary cryp-primary" data-action="retry">Check status again</button><button class="demo-text-button" data-screen="order">Edit order</button></div>`;
  return `${phoneHeader('CrypRoy', false)}<div class="demo-screen-body cryp-screen"><div class="cryp-balance"><span>ILLUSTRATIVE PORTFOLIO</span><strong>12,400.00 <small>USDT</small></strong><p>Sample balance · not connected</p></div><p class="demo-overline">MARKETS</p><button class="market-row" data-screen="order"><span class="btc-mark">₿</span><span><strong>BTC / USDT</strong><small>+1.82% today</small></span><b>85,650.24</b>${glyph('arrow')}</button><button class="market-row" data-screen="order"><span class="eth-mark">E</span><span><strong>ETH / USDT</strong><small>+0.61% today</small></span><b>2,982.40</b>${glyph('arrow')}</button><div class="market-note"><span>${glyph('shield')}</span><p>Decision support sits next to the action: pair identity, available balance, review and a recoverable outcome.</p></div></div><div class="demo-bottom-nav dark-nav"><span class="active">Markets</span><span>Trade</span><span>Assets</span></div>`;
}

export function mountPrototype(root, kind) {
  const state = kind === 'grabroy'
    ? { screen: 'home', amount: 100000, rideType: 'Bike' }
    : { screen: 'markets', amount: '500', outcome: 'success' };
  const copy = kind === 'grabroy' ? grabCopy : crypCopy;
  let timer;

  const previous = {
    ride: 'home', 'ride-review': 'ride', 'ride-match': 'ride-review', wallet: 'home', 'wallet-review': 'wallet', 'wallet-success': 'wallet-review', support: 'ride-match',
    order: 'markets', review: 'order',
  };

  function render() {
    const screen = kind === 'grabroy' ? grabScreen(state) : crypScreen(state);
    const isCryp = kind === 'cryproy';
    root.innerHTML = `<div class="prototype-stage ${isCryp ? 'prototype-dark' : 'prototype-grab'}"><div class="prototype-intro"><p class="prototype-label">02 / LIVE BROWSER PROTOTYPE</p><h2>${copy.title}</h2><p>${copy.body}</p><div class="prototype-scenarios" aria-label="Prototype scenarios">${isCryp ? `<button class="${state.outcome === 'success' ? 'active' : ''}" data-outcome="success">Successful submission</button><button class="${state.outcome === 'timeout' ? 'active' : ''}" data-outcome="timeout">Timeout recovery</button>` : `<button class="${state.screen.startsWith('ride') ? 'active' : ''}" data-screen="ride">Ride</button><button class="${state.screen.startsWith('wallet') ? 'active' : ''}" data-screen="wallet">Wallet</button><button class="${state.screen === 'support' ? 'active' : ''}" data-screen="support">Support</button>`}</div><ol class="prototype-checks">${copy.checks.map((item, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span>${item}</li>`).join('')}</ol><p class="prototype-note">${isCryp ? 'Illustrative market data. No account, payment, wallet or transaction is connected.' : 'Illustrative service data. No GPS, account, payment or ride is connected.'}</p></div><div class="prototype-play-area"><span class="prototype-corner">INTERACTIVE / ${isCryp ? 'FINANCIAL UX' : 'SERVICE UX'}</span><div class="prototype-phone" aria-label="Interactive ${isCryp ? 'CrypRoy trading' : 'GrabRoy service'} prototype">${screen}</div></div></div>`;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.amount) state.amount = kind === 'grabroy' ? Number(button.dataset.amount) : button.dataset.amount;
    if (button.dataset.outcome) state.outcome = button.dataset.outcome;
    if (button.dataset.screen) state.screen = button.dataset.screen;
    if (button.dataset.action === 'back') state.screen = previous[state.screen] || (kind === 'grabroy' ? 'home' : 'markets');
    if (button.dataset.action === 'reset') {
      state.screen = kind === 'grabroy' ? 'home' : 'markets';
      if (kind === 'cryproy') { state.amount = '500'; state.outcome = 'success'; }
    }
    if (button.dataset.action === 'to-review') state.screen = 'review';
    if (button.dataset.action === 'choose-ride') state.rideType = button.dataset.ride;
    if (button.dataset.action === 'submit' || button.dataset.action === 'retry') {
      state.screen = 'processing';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { state.screen = state.outcome === 'timeout' ? 'error' : 'success'; render(); }, 650);
    }
    render();
  });

  root.addEventListener('input', (event) => {
    if (kind === 'cryproy' && event.target.id === 'order-amount') {
      state.amount = event.target.value;
      render();
      const input = root.querySelector('#order-amount');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }
  });

  render();
}
