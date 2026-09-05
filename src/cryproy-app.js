import '@fontsource-variable/inter';
import './cryproy-app.css';
import {COINS, money, quantity, createAccount, quote, maxAmount, execute, totalBalance} from './cryproy-model.js';

const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<img class="cr-icon" src="/projects/cryproy-demo/${name}.svg" width="20" height="20" alt="">`;
const mark = c => `<span class="cr-coin" style="background:${c.color}">${c.mark}</span>`;
const change = c => `<span class="${c.change >= 0 ? 'cr-positive' : 'cr-negative'}">${c.change >= 0 ? '▲ +' : '▼ '}${c.change}%</span>`;
const button = (label, action, cls='cr-primary', attrs='') => `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const summary = rows => `<dl class="cr-summary">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;

export function mountCrypRoy(root, {standalone=false}={}) {
  let account = createAccount();
  let state = {screen:'home',symbol:'BTC',side:'buy',amount:'500',filter:'All',search:'',period:'1H',outcome:'success',favorites:['BTC','ETH'],pending:null,detail:null};
  let timer, serial=0;
  const coin = () => COINS.find(c=>c.symbol === state.symbol);
  const q = () => quote(account,state.symbol,state.side,state.amount);
  const pending = () => ['processing','timeout'].includes(state.screen);
  const row = c => `<button class="cr-market-row" data-coin="${c.symbol}" aria-label="Open ${c.name}">${mark(c)}<span><strong>${c.name}</strong><small>${c.symbol} / USDT</small></span><span class="cr-quote"><strong>${money(c.price)}</strong><small>${change(c)}</small></span></button>`;
  const balance = () => `<div class="cr-balance"><small>ESTIMATED BALANCE · DEMO</small><strong>$${money(totalBalance(account))}</strong><p><span class="cr-positive">+$684.12</span> <span>+2.84% sample day</span></p><div class="cr-balance-actions">${button('Add funds','funds')}${button('Send','send','cr-secondary')}${button('Receive','receive','cr-secondary')}</div></div>`;
  const section = (title, label='', action='markets') => `<div class="cr-section-title"><h3>${title}</h3>${label ? button(label,action,'cr-text') : ''}</div>`;
  const note = text => `<p class="cr-note">${text}</p>`;
  function header() {
    const names={home:'CrypRoy',markets:'Markets',detail:`${state.symbol} / USDT`,order:`${state.side === 'buy'?'Buy':'Sell'} ${state.symbol}`,review:'Review order',processing:'Processing',timeout:'Order status',success:'Order complete',wallet:'Wallet',history:'Order history',receipt:'Order detail',funds:'Add demo funds',send:'Send',receive:'Receive',earn:'Earn',more:'Quick access',help:'About this demo'};
    const main=['home','markets','wallet'].includes(state.screen);
    return `<header class="cr-header">${main ? (state.screen==='home'?'<span class="cr-brand-mark" aria-hidden="true"></span>':'') : button('‹','back','cr-back','aria-label="Go back" '+(pending()?'disabled':''))}<h2 tabindex="-1">${names[state.screen] || 'CrypRoy'}</h2>${state.screen==='detail'?button(icon('star'),'favorite','cr-icon-button',`aria-label="${state.favorites.includes(state.symbol)?'Remove from':'Add to'} favorites" aria-pressed="${state.favorites.includes(state.symbol)}"`):button(state.screen==='home'?'Demo':'?','help','cr-help','aria-label="About this demo" '+(pending()?'disabled':''))}</header>`;
  }
  function home() {
    return `${balance()}${section('Quick access') }<div class="cr-quick">${[['↕','Convert','trade'],['◎','Earn','earn'],['↗','Pay','send'],['•••','More','more']].map(([glyph,label,action])=>button(`<b>${glyph}</b><span>${label}</span>`,action,'cr-quick-button')).join('')}</div>${section('Markets','See all')}${COINS.slice(0,3).map(row).join('')}${note('Explore freely. Every price, balance and order here is simulated.')}`;
  }
  function markets() {
    const coins=COINS.filter(c=>(state.filter!=='Favorites'||state.favorites.includes(c.symbol)) && (state.filter!=='Gainers'||c.change>0) && `${c.name} ${c.symbol}`.toLowerCase().includes(state.search.toLowerCase()));
    return `<label class="cr-search">${icon('search')}<input aria-label="Search markets" id="cr-search" type="search" placeholder="Search coin or pair" value="${esc(state.search)}"></label><div class="cr-chips">${['All','Favorites','Gainers'].map(f=>button(f,'filter','cr-chip',`data-value="${f}" aria-pressed="${f===state.filter}"`)).join('')}</div><div class="cr-table-label"><span>Pair / Volume</span><span>Price / 24h change</span></div><div id="cr-market-results">${coins.length?coins.map(row).join(''):note('No matching coins. Try another search or filter.')}</div>${note('Fixed reference prices from the design. No live market feed.')}`;
  }
  function chart() {
    const seed=['1m','15m','1H','4H','1D'].indexOf(state.period);
    const candles=Array.from({length:19},(_,i)=>{const up=(i+seed)%3!==0;const base=12+i*2.6+Math.sin(i*1.7+seed)*10;return `<span class="cr-candle ${up?'up':'down'}" style="--bottom:${Math.max(3,base)}%;--height:${8+(i*7+seed*3)%15}%"></span>`;}).join('');
    return `<div class="cr-chart" role="img" aria-label="Illustrative ${state.symbol} candlestick chart, ${state.period} interval. Fixed reference price ${money(coin().price)} USDT.">${candles}<span class="cr-chart-price">${money(coin().price)}</span></div>`;
  }
  function detail() {
    const c=coin();return `<div class="cr-price"><strong>${money(c.price)}</strong><p>${change(c)} <small>Illustrative 24h change</small></p></div><div class="cr-periods">${['1m','15m','1H','4H','1D'].map(p=>button(p,'period','cr-chip',`data-value="${p}" aria-pressed="${p===state.period}"`)).join('')}</div>${chart()}<div class="cr-stats"><div><small>24h high</small><strong>${money(c.price*1.012)}</strong></div><div><small>24h low</small><strong>${money(c.price*.975)}</strong></div><div><small>Volume</small><strong>1.24B</strong></div></div>${section('Order book')}<div class="cr-table-label"><span>Price (USDT)</span><span>Amount (${c.symbol})</span><span>Total</span></div>${[.2841,.1962,.4128].map((n,i)=>`<div class="cr-book"><span class="${i?'cr-positive':'cr-negative'}">${money(c.price-i*.61)}</span><span>${n}</span><span>${money(n*c.price)}</span></div>`).join('')}${note('Chart and order book are illustrative. Changing the interval updates the sample view.')}<div class="cr-bottom-actions">${button(`Buy ${c.symbol}`,'buy','cr-buy')}${button(`Sell ${c.symbol}`,'sell','cr-sell')}</div>`;
  }
  function order() {
    const c=coin(), quote=q(), max=maxAmount(account,state.symbol,state.side);
    return `<div class="cr-pair">${mark(c)}<span><strong>${c.symbol} / USDT</strong><small>Spot wallet</small></span><span class="cr-quote"><small>Available</small><strong>${state.side==='buy'?money(account.cash)+' USDT':quantity(account.holdings[c.symbol])+' '+c.symbol}</strong></span></div><div class="cr-segment">${['buy','sell'].map(side=>button(side==='buy'?'Buy':'Sell','side',`cr-side ${side}`,`data-value="${side}" aria-pressed="${side===state.side}"`)).join('')}</div><div class="cr-market-type"><strong>Market order</strong><small>Simulated spot execution</small></div><div class="cr-amount-box"><label for="cr-amount">Amount <span>USDT</span></label><input id="cr-amount" aria-describedby="cr-amount-error" aria-invalid="${Boolean(quote.error)}" type="text" inputmode="decimal" autocomplete="off" value="${esc(state.amount)}"><div><small>Min 10 USDT</small><small>Max ${money(max)} USDT</small></div></div><p class="cr-error" id="cr-amount-error" role="status">${quote.error}</p><div class="cr-presets">${[25,50,75,100].map(p=>button(p===100?'MAX':p+'%','preset','cr-chip',`data-value="${p}"`)).join('')}</div>${summary([['Reference price',money(c.price)+' USDT'],['Trading fee (0.1%)',quote.error?'—':money(quote.fee)+' USDT'],[state.side==='buy'?'Estimated receive':'You sell',quote.error?'—':quantity(quote.units)+' '+c.symbol]])}${note('Pay from Spot wallet. Funds stay available until you confirm.')}<div class="cr-bottom-actions">${button(`Review ${state.side==='buy'?'Buy':'Sell'}`,'review','cr-primary',quote.error?'disabled':'')}</div>`;
  }
  function review() {
    const order=state.pending,c=coin();return `<div class="cr-pair cr-soft">${mark(c)}<span><strong>${c.symbol} / USDT</strong><small>Spot · Market ${order.side}</small></span><span class="cr-badge">MARKET</span></div><h3>Confirm your ${order.side==='buy'?'Buy':'Sell'}</h3>${note('Review the amount and fee before this simulated execution.')}<div class="cr-review-amount"><span>${order.side==='buy'?'You pay':'You sell'}</span><strong>${order.side==='buy'?money(order.amount)+' USDT':quantity(order.units)+' '+c.symbol}</strong><span class="cr-down-arrow">↓</span><span>You receive</span><strong class="cr-positive">${order.side==='buy'?'≈ '+quantity(order.units)+' '+c.symbol:money(order.total)+' USDT'}</strong></div>${summary([['Reference price',money(order.price)+' USDT'],['Trading fee',money(order.fee)+' USDT'],[order.side==='buy'?'Estimated total':'Net proceeds',money(order.total)+' USDT'],['USDT after order',money(account.cash+(order.side==='buy'?-order.total:order.total))+' USDT']])}${note('Market prices may move in a real product. This demo uses fixed prices.')}<p class="cr-safeguard">✓ Duplicate submissions are blocked while processing.</p><div class="cr-bottom-actions cr-stacked">${button(`Confirm ${order.side==='buy'?'Buy':'Sell'} · ${money(order.total)} USDT`,'confirm')}${button('Edit amount','edit','cr-text')}</div>`;
  }
  function outcome() {
    const processing=state.screen==='processing', timeout=state.screen==='timeout',o=state.pending;
    return `<div class="cr-outcome"><div class="cr-orb ${processing?'cr-spinner':timeout?'warning':'success'}">${processing?'':timeout?'!':'✓'}</div><span class="cr-badge">${processing?'PROCESSING':timeout?'AWAITING CONFIRMATION':'SIMULATED ORDER COMPLETED'}</span><h3>${processing?'Checking your order…':timeout?'No confirmation yet.':`${o.symbol} ${o.side} complete.`}</h3><p>${processing?'Your request is in progress. Please wait.':timeout?'Your request may have reached the exchange. Check this same order before placing another one. Your demo balance has not changed.':'Your demo wallet and order history have been updated.'}</p>${summary([['Order reference',o.id],['Amount',money(o.amount)+' USDT'],['Fee',money(o.fee)+' USDT']])}</div>${processing?'':`<div class="cr-bottom-actions cr-stacked">${timeout?button('Check order status','check'):button('View wallet','wallet')}${!timeout?button('View order history','history','cr-secondary'):note('Status check resolves this demo order once; it does not submit a new order.')}</div>`}`;
  }
  function wallet() {
    const total=totalBalance(account);
    return `${balance()}${section('Portfolio allocation')}<div class="cr-allocation" role="img" aria-label="Portfolio allocation by current demo asset value">${COINS.map(c=>`<span style="background:${c.color};width:${account.holdings[c.symbol]*c.price/total*100}%"></span>`).join('')}<span style="background:#2ebd86;width:${account.cash/total*100}%"></span></div>${section('Assets','Order history','history')}<div class="cr-market-row cr-static"><span class="cr-coin cr-usdt">$</span><span><strong>Tether</strong><small>${money(account.cash)} USDT available</small></span><strong class="cr-quote">$${money(account.cash)}</strong></div>${COINS.filter(c=>account.holdings[c.symbol]>1e-10).map(c=>`<button class="cr-market-row" data-coin="${c.symbol}">${mark(c)}<span><strong>${c.name}</strong><small>${quantity(account.holdings[c.symbol])} ${c.symbol}</small></span><strong class="cr-quote">$${money(account.holdings[c.symbol]*c.price)}</strong></button>`).join('')}${note('Balances last for this visit. Reset demo restores the starting wallet.')}`;
  }
  function history() {
    return account.orders.length ? account.orders.map(o=>`<button class="cr-history-row" data-receipt="${o.id}"><span class="cr-history-check">✓</span><span><strong>${o.side==='buy'?'Bought':'Sold'} ${o.symbol}</strong><small>${o.id} · ${o.status}</small></span><span class="cr-quote"><strong>${money(o.amount)} USDT</strong><small>View receipt ›</small></span></button>`).join('') : `<div class="cr-empty">${icon('trade')}<h3>No orders yet</h3><p>Your completed demo orders will appear here.</p>${button('Explore markets','markets')}</div>`;
  }
  function utility() {
    if(state.screen==='receipt'){const o=account.orders.find(o=>o.id===state.detail);return `<h3>${o.side==='buy'?'Buy':'Sell'} ${o.symbol} · Completed</h3>${summary([['Reference',o.id],['Amount',money(o.amount)+' USDT'],['Quantity',quantity(o.units)+' '+o.symbol],['Fee',money(o.fee)+' USDT'],['Reference price',money(o.price)+' USDT'],['Total / net',money(o.total)+' USDT']])}${note('Simulated execution. No real transaction occurred.')}${button('Back to history','history')}`;}
    if(state.screen==='funds')return `<div class="cr-empty"><span class="cr-orb">+</span><h3>A little room to explore.</h3><p>Add 1,000 USDT of demo funds to your Spot wallet. No payment details needed.</p>${button('Add 1,000 demo USDT','add-funds')}</div>`;
    if(state.screen==='send'||state.screen==='receive')return `<div class="cr-empty">${icon('wallet')}<h3>${state.screen==='send'?'Transfers are outside this spot demo.':'Your wallet is a simulation.'}</h3><p>No real wallet address is created. You can explore buying and selling coins, or add demo funds.</p>${button('Add demo funds','funds')}${button('View wallet','wallet','cr-secondary')}</div>`;
    if(state.screen==='earn')return `<div class="cr-empty"><h3>Explore your holdings.</h3><p>Earn products are outside this focused spot-trading concept. Try a market order and see how your allocation changes.</p>${button('Explore markets','markets')}</div>`;
    if(state.screen==='more')return `${section('Your demo shortcuts')}${[['Markets','markets'],['Buy crypto','trade'],['Wallet','wallet'],['Order history','history'],['Add demo funds','funds']].map(([label,action])=>button(label+' ›',action,'cr-shortcut')).join('')}`;
    return `<div class="cr-about"><span class="cr-badge">INDEPENDENT DESIGN CONCEPT</span><h3>A real interaction.<br>A simulated account.</h3><p>CrypRoy is a portfolio project by Roylle, rebuilt from the editable Figma screens. It is not affiliated with Binance.</p><p>All prices, charts, balances and orders are samples. No exchange, payment or wallet is connected. Nothing is saved after you reload.</p>${summary([['Trading fee','0.1% in this demo'],['Minimum order','10 USDT'],['Available flows','Buy · Sell · Recovery']])}${button('Explore markets','markets')}</div>`;
  }
  function content() {return state.screen==='home'?home():state.screen==='markets'?markets():state.screen==='detail'?detail():state.screen==='order'?order():state.screen==='review'?review():['processing','timeout','success'].includes(state.screen)?outcome():state.screen==='wallet'?wallet():state.screen==='history'?history():utility();}
  function nav() {
    if(!['home','markets','wallet','history'].includes(state.screen))return '';
    return `<nav class="cr-nav" aria-label="App navigation">${[['home','star','Home'],['markets','search','Markets'],['trade','trade','Trade'],['wallet','wallet','Wallet']].map(([dest,img,label])=>button(`${icon(img)}<span>${label}</span>`,dest,'cr-nav-item',`aria-current="${dest===state.screen?'page':'false'}"`)).join('')}</nav>`;
  }
  root.innerHTML=`<div class="cr-experience ${standalone?'cr-standalone':''}"><aside class="cr-guide"><p class="cr-eyebrow">04 / INTERACTIVE APP DEMO</p><h2>Your next move,<br>made clearer.</h2><p>From a market insight to a reviewed order. Try the CrypRoy app, built from the Figma design.</p><ol><li><span>01</span> Explore markets & choose a coin</li><li><span>02</span> Enter an amount & review the fee</li><li><span>03</span> Confirm & see your wallet update</li></ol><div class="cr-test-controls"><label for="cr-scenario">Order response</label><select id="cr-scenario"><option value="success">Successful execution</option><option value="timeout">Timeout → check status</option></select>${button('Reset demo ↺','reset','cr-reset')}</div><p class="cr-disclosure">Simulated data. No real money, wallet connection or sign-in.</p>${standalone?'<a href="/cryproy.html#prototype">← Back to Case Study</a>':'<a href="/cryproy-demo.html" target="_blank" rel="noopener">Open demo in a new tab ↗</a>'}<a class="cr-figma-link" href="https://www.figma.com/design/G40J1jrBLzBNwJyyiij5is/CrypRoy?node-id=2044-310" target="_blank" rel="noopener">View original Figma ↗</a></aside><div class="cr-device-area"><div class="cr-device-label"><span class="cr-live-dot"></span> CRYPROY / PLAYABLE DEMO</div><div class="cr-app" aria-label="CrypRoy demo app"><div class="cr-status"><span>9:41</span><span>DEMO · 100%</span></div><div class="cr-screen"></div></div><p class="cr-device-caption">Designed in Figma. Ready to explore here.</p></div></div><div class="cr-announcement" role="status" aria-live="polite"></div>`;
  function render({focus=false, preserve=false}={}) {
    const screen=root.querySelector('.cr-screen'), scroll=screen.querySelector('.cr-content')?.scrollTop||0;
    screen.innerHTML=`${header()}<div class="cr-content">${content()}</div>${nav()}`;
    if(preserve)screen.querySelector('.cr-content').scrollTop=scroll;
    root.querySelector('#cr-scenario').disabled=pending();
    root.querySelector('#cr-scenario').value=state.outcome;
    if(focus)screen.querySelector('h2').focus({preventScroll:true});
  }
  function go(screen) {state.screen=screen;render({focus:true});}
  function finish() {
    execute(account,state.pending);
    go('success');
    root.querySelector('.cr-announcement').textContent='Simulated order completed. Wallet and order history updated.';
  }
  root.addEventListener('click', event=>{
    const el=event.target.closest('button');if(!el||!root.contains(el)||el.disabled)return;
    const action=el.dataset.action;
    if(action==='reset'){clearTimeout(timer);account=createAccount();state={...state,screen:'home',symbol:'BTC',side:'buy',amount:'500',search:'',filter:'All',period:'1H',outcome:'success',favorites:['BTC','ETH'],pending:null,detail:null};render({focus:true});root.querySelector('.cr-announcement').textContent='Demo reset to starting balances.';return;}
    if(pending()&&action!=='check')return;
    if(el.dataset.coin){state.symbol=el.dataset.coin;go('detail');return;}
    if(el.dataset.receipt){state.detail=el.dataset.receipt;go('receipt');return;}
    if(action==='back'){go(({detail:'markets',order:'detail',review:'order',success:'wallet',history:'wallet',receipt:'history',funds:'wallet'})[state.screen]||'home');return;}
    if(action==='trade'||action==='buy'||action==='sell'){state.side=action==='sell'?'sell':'buy';state.amount='500';go('order');return;}
    if(action==='side'){state.side=el.dataset.value;render({focus:true});return;}
    if(action==='favorite'){const index=state.favorites.indexOf(state.symbol);index<0?state.favorites.push(state.symbol):state.favorites.splice(index,1);render();root.querySelector('[data-action="favorite"]').focus({preventScroll:true});return;}
    if(action==='filter'||action==='period'){state[action]=el.dataset.value;render();root.querySelector(`[data-action="${action}"][data-value="${el.dataset.value}"]`).focus({preventScroll:true});return;}
    if(action==='preset'){state.amount=(Math.floor(maxAmount(account,state.symbol,state.side)*Number(el.dataset.value))/100).toFixed(2);render();root.querySelector('#cr-amount').focus({preventScroll:true});return;}
    if(action==='review'){if(q().error)return;state.pending={...q(),id:`CR-DEMO-${String(++serial).padStart(4,'0')}`};go('review');return;}
    if(action==='edit'){go('order');return;}
    if(action==='confirm'){if(state.screen!=='review')return;go('processing');timer=setTimeout(()=>state.outcome==='timeout'?go('timeout'):finish(),1100);return;}
    if(action==='check'){if(state.screen!=='timeout')return;go('processing');timer=setTimeout(finish,900);return;}
    if(action==='add-funds'){account.cash+=1000;go('wallet');root.querySelector('.cr-announcement').textContent='Added 1,000 simulated USDT.';return;}
    if(['home','markets','wallet','history','funds','send','receive','earn','more','help'].includes(action))go(action);
  });
  root.addEventListener('change',event=>{if(event.target.id==='cr-scenario'&&!pending())state.outcome=event.target.value;});
  root.addEventListener('input',event=>{
    const input=event.target;if(!['cr-search','cr-amount'].includes(input.id))return;
    const start=input.selectionStart,end=input.selectionEnd,id=input.id;
    state[id==='cr-search'?'search':'amount']=input.value;
    render({preserve:true});const next=root.querySelector('#'+id);next.focus({preventScroll:true});next.setSelectionRange(start,end);
  });
  root.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.id==='cr-amount'&&!q().error)root.querySelector('[data-action="review"]').click();});
  render();
}
