/* Independent, local-only portfolio interactions. No checkout or network calls. */
export function setupCeramicsControls() {
  const root = document;
  const products = [...root.querySelectorAll('.products > article')];
  const categories = ['homeware', 'table', 'tea', 'table', 'table', 'homeware'];
  if (products.length !== categories.length || root.querySelector('.dg-tools')) return;
  const words = {
    en: {search:'Search',cart:'Demo bag',close:'Close',query:'Search concept objects',all:'All objects',table:'For the table',homeware:'For the home',tea:'For tea',add:'Add to demo bag',remove:'Remove',clear:'Clear bag',reset:'Reset filters',empty:'Your demo bag is empty.',none:'No objects match. Try another search or reset the filters.',note:'Local demo only. Objects are not for sale. No payment, checkout or order is created. Your bag resets when this page reloads.',quantity:'Quantity',less:'Decrease quantity',more:'Increase quantity',prev:'Previous category',next:'Next category',results:'objects found',added:'Added to demo bag',total:'Total objects',category:'Filter by category',limit:'Demo limit: 99 per object.'},
    vi: {search:'Tìm kiếm',cart:'Giỏ mẫu',close:'Đóng',query:'Tìm sản phẩm ý tưởng',all:'Tất cả',table:'Cho bàn ăn',homeware:'Cho ngôi nhà',tea:'Cho bàn trà',add:'Thêm vào giỏ mẫu',remove:'Xóa',clear:'Xóa toàn bộ giỏ',reset:'Đặt lại bộ lọc',empty:'Giỏ mẫu của bạn đang trống.',none:'Không có sản phẩm phù hợp. Hãy tìm từ khác hoặc đặt lại bộ lọc.',note:'Chỉ là bản mẫu trên thiết bị. Sản phẩm không được bán. Không có thanh toán hay đơn hàng nào được tạo. Giỏ sẽ đặt lại khi tải lại trang.',quantity:'Số lượng',less:'Giảm số lượng',more:'Tăng số lượng',prev:'Danh mục trước',next:'Danh mục tiếp theo',results:'sản phẩm tìm thấy',added:'Đã thêm vào giỏ mẫu',total:'Tổng số sản phẩm',category:'Lọc theo danh mục',limit:'Giới hạn mẫu: 99 mỗi sản phẩm.'}
  };
  const t = key => words[root.documentElement.lang === 'vi' ? 'vi' : 'en'][key];
  const make = (tag, className, text) => {
    const el = root.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const button = (key, action) => {
    const el = make('button', 'dg-button', t(key)); el.type = 'button'; el.dataset.dgText = key;
    if (action) el.addEventListener('click', action);
    return el;
  };
  const css = make('link'); css.rel = 'stylesheet'; css.href = new URL('./controls.css?v=20261030controls1', import.meta.url).href; root.head.append(css);
  const bag = new Map();
  const tools = make('div', 'dg-tools');
  const status = make('p', 'dg-sr'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); root.body.append(status);
  const dialogs = [];
  function createDialog(titleKey) {
    const dialog = make('dialog','dg-dialog');
    const title = make('h2', '', t(titleKey)); title.id = 'dg-' + titleKey + '-title'; title.dataset.dgText = titleKey;
    dialog.setAttribute('aria-labelledby',title.id);
    const close = button('close', () => dialog.close());
    const heading = make('div','dg-dialog-heading'); heading.append(title,close); dialog.append(heading);
    let opener;
    dialog.addEventListener('close', () => { root.body.classList.remove('dg-modal-open'); opener?.focus(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    root.body.append(dialog); dialogs.push(dialog);
    return {dialog,open(trigger) { dialogs.forEach(d => {if (d.open) d.close();}); opener = trigger; root.querySelector('.menu')?.removeAttribute('open'); dialog.showModal(); root.body.classList.add('dg-modal-open'); }};
  }
  const search = createDialog('search');
  const searchLabel = make('label','',t('query')); searchLabel.htmlFor='dg-query'; searchLabel.dataset.dgText='query';
  const input = make('input','dg-input'); input.type='search'; input.id='dg-query'; input.autocomplete='off'; input.maxLength=100;
  search.dialog.append(searchLabel,input);
  const searchOpen = button('search', () => {search.open(searchOpen); input.focus();}); searchOpen.setAttribute('aria-haspopup','dialog');
  const cart = createDialog('cart');
  const note = make('p','dg-note',t('note')); note.dataset.dgText='note'; note.id='dg-cart-note'; cart.dialog.setAttribute('aria-describedby',note.id);
  const cartList = make('div','dg-cart-list');
  const total = make('p','dg-total');
  const clear = button('clear', () => {bag.clear(); renderBag(); clear.disabled=true; cart.dialog.querySelector('button').focus();});
  cart.dialog.append(note,cartList,total,clear);
  const cartOpen = button('cart', () => cart.open(cartOpen)); delete cartOpen.dataset.dgText; cartOpen.setAttribute('aria-haspopup','dialog');
  tools.append(searchOpen,cartOpen); root.querySelector('header .lang').before(tools);

  const filters = make('div','dg-filters');
  const selectLabel = make('label','',t('category')); selectLabel.htmlFor='dg-category'; selectLabel.dataset.dgText='category';
  const select = make('select','dg-input'); select.id='dg-category';
  ['all','table','homeware','tea'].forEach(key => {const option=make('option','',t(key));option.value=key;option.dataset.dgText=key;select.append(option);});
  const reset = button('reset', () => {input.value='';select.value='all';filter();});
  const count = make('p','dg-result-count'); count.setAttribute('role','status');
  const empty = make('p','dg-empty',t('none')); empty.dataset.dgText='none';empty.hidden=true;
  filters.append(selectLabel,select,reset,count); root.querySelector('.products').before(filters); root.querySelector('.products').after(empty);
  const searchResults = make('div','dg-search-results'); searchResults.setAttribute('aria-live','polite'); search.dialog.append(searchResults);
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  function matches(index) {
    return (select.value==='all' || select.value===categories[index]) && normalize(products[index].querySelector('h3').textContent).includes(normalize(input.value.trim()));
  }
  function name(index) { return products[index].querySelector('h3').textContent; }
  function filter() {
    searchResults.replaceChildren();
    let n=0;
    products.forEach((product,index) => {
      const visible=matches(index);product.hidden=!visible;
      if (!visible) return;
      n++;
      const row=make('div','dg-search-row');
      const link=make('a','',name(index));link.href='#dg-product-'+index;
      link.addEventListener('click',()=>{search.dialog.close();setTimeout(()=>product.querySelector('button').focus(),0);});
      row.append(link,button('add',()=>add(index)));searchResults.append(row);
    });
    count.textContent=n+' '+t('results');empty.hidden=n!==0;
    if (!n) searchResults.append(make('p','',t('none')));
  }
  function add(index) { bag.set(index,Math.min(99,(bag.get(index)||0)+1)); renderBag();status.textContent=name(index)+': '+t('added'); }
  function renderBag(focusId) {
    cartList.replaceChildren();
    let sum=0;
    bag.forEach((quantity,index)=>{
      sum+=quantity;
      const row=make('div','dg-cart-row');row.append(make('h3','',name(index)));
      const controls=make('div','dg-quantity');
      const less=button('less',()=>{bag.set(index,quantity-1);renderBag('dg-less-'+index);});less.textContent='−';less.removeAttribute('data-dg-text');less.setAttribute('aria-label',t('less')+': '+name(index));less.id='dg-less-'+index;less.disabled=quantity<=1;
      const value=make('span','',String(quantity));value.setAttribute('aria-label',t('quantity')+': '+quantity);
      const more=button('more',()=>{bag.set(index,quantity+1);renderBag('dg-more-'+index);});more.textContent='+';more.removeAttribute('data-dg-text');more.setAttribute('aria-label',t('more')+': '+name(index));more.id='dg-more-'+index;more.disabled=quantity>=99;
      const remove=button('remove',()=>{bag.delete(index);renderBag();cart.dialog.querySelector('button').focus();});remove.setAttribute('aria-label',t('remove')+': '+name(index));
      controls.append(less,value,more,remove);row.append(controls);if(quantity===99)row.append(make('small','',t('limit')));cartList.append(row);
    });
    if(!sum)cartList.append(make('p','',t('empty')));
    total.textContent=t('total')+': '+sum;cartOpen.textContent=t('cart')+' ('+sum+')';clear.disabled=!sum;
    if(focusId){const target=root.getElementById(focusId);(target?.disabled?target.parentElement.querySelector('button:not(:disabled)'):target)?.focus();}
  }
  products.forEach((product,index)=>{product.id='dg-product-'+index;product.append(button('add',()=>add(index)));});
  input.addEventListener('input',filter);select.addEventListener('change',filter);

  const track=root.querySelector('.category-grid');track.id='dg-category-track';track.classList.add('dg-category-track');
  track.setAttribute('role','region');track.setAttribute('aria-label',t('category'));track.tabIndex=0;
  const categoryKeys=['table','homeware','tea'];
  [...track.children].forEach((card,index)=>{
    const action=button(categoryKeys[index],()=>{select.value=categoryKeys[index];input.value='';filter();root.querySelector('#collection').scrollIntoView({behavior:motion()});select.focus({preventScroll:true});});
    card.querySelector('h3').replaceWith(action);
  });
  function motion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';}
  const arrows=make('div','dg-category-arrows');
  function shift(direction){track.scrollBy({left:direction*(track.firstElementChild.getBoundingClientRect().width+20),behavior:motion()});}
  const previous=button('prev',()=>shift(-1));const next=button('next',()=>shift(1));
  [previous,next].forEach(el=>el.setAttribute('aria-controls',track.id));arrows.append(previous,next);track.after(arrows);
  function boundaries(){previous.disabled=track.scrollLeft<=1;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-1;}
  track.addEventListener('scroll',boundaries,{passive:true});window.addEventListener('resize',boundaries);
  track.addEventListener('keydown',event=>{if(event.target!==track)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();shift(event.key==='ArrowRight'?1:-1);}});
  function translate(){
    root.querySelectorAll('[data-dg-text]').forEach(el=>el.textContent=t(el.dataset.dgText));
    track.setAttribute('aria-label',t('category'));filter();renderBag();boundaries();
  }
  // Observe the existing language switch without changing the shared i18n contract.
  new MutationObserver(translate).observe(root.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=root.querySelector('.menu[open]');if(menu){menu.removeAttribute('open');menu.querySelector('summary').focus();}}});
  translate();requestAnimationFrame(boundaries);
}
