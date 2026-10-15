import { homeTemplate, placeCard } from './home.js';
import { places, dishes, categories, sources, reading, checkedOn, mapUrl } from './places.js';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
let language=localStorage.getItem('halong-language')==='en'?'en':'vi';
const t=(vi,en)=>language==='vi'?vi:en, choose=values=>values[language==='vi'?0:1];
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.4"/></svg>';
const wave='<svg viewBox="0 0 36 20" fill="none" aria-hidden="true"><path d="M2 10c5 0 5-5 10-5s5 10 10 10 5-5 12-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const globe='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="3.7" ry="8.5"/><path d="M4 9h16M4 15h16"/></svg>';
const img=(name,alt,cls='',eager=false)=>`<img class="${cls}" src="./assets/${name}.${name.startsWith('hero-food-')||name.startsWith('hero-work-')||name.startsWith('ai-')?'jpg':'webp'}" alt="${alt}" ${eager?'fetchpriority="high"':'loading="lazy"'} width="1600" height="1067"/>`;
const external=(label,url,cls='text-link')=>`<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
let saved=[];try{saved=JSON.parse(localStorage.getItem('halong-saved-places')||'[]').filter(id=>places.some(p=>p.id===id));}catch{}
let sourceRequestId=0,heroExplicitPlay=false;
let filter='all',query='',slideIndex=0,carouselPaused=false,slideTimer,journeyIndex=0,revealObserver,cleanupMotion=()=>{},soundOn=false,audioContext,ambientGain;
const dialog=$('#overlay');
const normalise=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const photoCaption=p=>p.photo==='illustration'?t('Ảnh minh họa AI; không phải ảnh của địa điểm.','AI illustration; not a photograph of the venue.'):p.id==='temple'?t('Ảnh: Cổng thông tin điện tử Quảng Ninh','Photo: Quang Ninh provincial portal'):p.id==='market'?t('Ảnh: Visit Quang Ninh · Sưu tầm','Photo: Visit Quang Ninh · Collected image'):p.id==='museum'?'Hoangkid · CC BY-SA 4.0 / Wikimedia Commons':p.id==='beach'?'Jakub Hałun · CC BY 4.0 / Wikimedia Commons':'Sergey Guk / Pexels';
function render(){
 clearInterval(slideTimer);cleanupMotion();
 document.documentElement.lang=language;document.title=t('Hạ Long Seafood — Hải sản & đặc sản miền biển','Ha Long Seafood — Coastal flavours & specialities');
 document.querySelector('meta[name=description]').content=t('Khám phá hải sản Hạ Long: chả mực, mực biển, hàu, gợi ý thưởng thức và địa chỉ mua đặc sản có nguồn tham khảo.','Explore Ha Long seafood: squid cakes, squid, oysters, dining ideas and sourced addresses for local specialities.');
 $('#app').innerHTML=homeTemplate({t,choose,img,arrow,wave,globe,places,dishes,categories,reading,saved,language});
 setSlide(slideIndex,false);setJourney(journeyIndex);startCarousel();setupReveal();setupMotion();
 $('.language-toggle').addEventListener('click',()=>{const scroll=scrollY;language=language==='vi'?'en':'vi';localStorage.setItem('halong-language',language);render();scrollTo({top:scroll,behavior:'instant'});});
 $('.pause-button').addEventListener('click',()=>{if(($('.hero-film')?.paused&&!carouselPaused)||(!heroExplicitPlay&&(matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData))){heroExplicitPlay=true;carouselPaused=false;}else carouselPaused=!carouselPaused;startCarousel();});
 $('.sound-toggle').setAttribute('aria-pressed',String(soundOn));
 $('.sound-toggle').setAttribute('aria-label',soundOn?t('Tắt âm thanh sóng biển','Turn off ocean ambience'):t('Bật âm thanh sóng biển','Turn on ocean ambience'));
 $('.sound-toggle').addEventListener('click',toggleSound);
 $$('.slide-tab').forEach(b=>b.addEventListener('click',()=>setSlide(Number(b.dataset.slide))));
 $('.slide-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(slideIndex+(e.key==='ArrowRight'?1:2))%3;setSlide(next);$(`.slide-tab[data-slide="${next}"]`).focus();});
 $('.journey-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(journeyIndex+(e.key==='ArrowRight'?1:2))%3;setJourney(n);$(`[data-journey="${n}"]`).focus();});
}
function filterPlaces(){
 if(!$('#places-grid'))return;
 const matches=places.filter(p=>(filter==='all'||p.category===filter)&&normalise([...p.name,...p.area,...p.address].join(' ')).includes(normalise(query)));
 $('#places-grid').innerHTML=matches.length?matches.map(p=>placeCard(p,{t,choose,img,saved})).join(''):`<div class="empty-state"><h3>${t('Chưa tìm thấy địa điểm phù hợp.','No matching places yet.')}</h3><p>${t('Thử bỏ bộ lọc hoặc tìm theo tên khu vực.','Try another neighbourhood or clear the filters.')}</p><button class="text-link" data-action="clear-search">${t('Xem tất cả địa điểm','Show all places')} →</button></div>`;
 $('#place-count').textContent=`${matches.length} ${t('địa điểm','places')}`;
 $$('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter));});
}
function setSlide(index,userAction=true){
 slideIndex=index;
 $('.hero').style.setProperty('--hero-focus',['42%','45%','50%'][index]);
 const heroVideo=$('.hero-film');if(userAction&&heroVideo?.readyState>=1)heroVideo.currentTime=[0,5.1,10.1][index];
 const slides=[
  [t('Từ đôi tay người thợ,<br>làm nên vị biển.','From the maker’s hands,<br>to the taste of the sea.'),t('Khám phá hải sản','Explore the seafood'),''],
  [t('Đêm xuống,<br>thuyền cá lại ra khơi.','Night falls,<br>the fishing boat heads out.'),t('Khám phá chuyện biển','Explore life at sea'),''],
  [t('Mùa hàu vào vụ,<br>người lại ra biển.','Oyster season brings<br>the workers back to sea.'),t('Khám phá món hàu','Discover oysters'),'oysters']
 ];
 $$('.hero-image').forEach((e,i)=>e.classList.toggle('active',i===index));
 $$('.slide-tab').forEach((e,i)=>{e.classList.toggle('active',i===index);e.setAttribute('aria-selected',String(i===index));e.tabIndex=i===index?0:-1;});
 $('.hero-content h1').innerHTML=slides[index][0];$('.hero-link span').textContent=slides[index][1];
 const cta=$('.hero-link');delete cta.dataset.story;delete cta.dataset.action;if(slides[index][2])cta.dataset.story=slides[index][2];else cta.dataset.action='dishes';
 $('.hero-content').setAttribute('aria-labelledby',`hero-tab-${index}`);syncFilm();
 if(userAction){startCarousel();if(innerWidth<650&&$('.hero').getBoundingClientRect().bottom>0)$(`.slide-tab[data-slide="${index}"]`).scrollIntoView({behavior:'instant',block:'nearest',inline:'start'});}
}
function setJourney(index){
 const changed=index!==journeyIndex;journeyIndex=index;
 const stops=dishes.slice(0,3).map(d=>({id:d.id,label:t('Tìm hiểu món ăn','Explore the dish'),text:choose(d.body)}));
 $$('.journey-tabs>button').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
 $$('.journey-scene').forEach((im,i)=>im.classList.toggle('active',i===index));
 const panel=$('#journey-panel');panel.innerHTML=`<span class="journey-chapter">0${index+1} / 03</span><p>${stops[index].text}</p>`;panel.setAttribute('aria-labelledby',`journey-tab-${index}`);
 const cta=$('[data-journey-open]');cta.dataset.story=stops[index].id;$('span',cta).textContent=stops[index].label;
 // Find each portrait's actual location on the same SVG path to keep progress and stops aligned.
 const path=$('.route-progress'),length=path.getTotalLength(),target=[[200,170],[600,70],[1000,170]][index];let best=Infinity,fraction=0;
 for(let i=0;i<=1000;i++){const p=path.getPointAtLength(length*i/1000),d=(p.x-target[0])**2+(p.y-target[1])**2;if(d<best){best=d;fraction=i;}}
 path.style.strokeDashoffset=String(1000-fraction);
 if(changed&&!carouselPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){panel.getAnimations().forEach(a=>a.cancel());panel.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});}
}
function openDirectory(category=filter,term=query){
 filter=category;query=term;
 openDialog(`<div class="directory-dialog"><p class="eyebrow">HẠ LONG SEAFOOD</p><h2 id="dialog-title">${t('Mua ở đâu, ăn nơi nào?','Where to buy, where to eat?')}</h2><p class="directory-intro">${t('Địa chỉ tham khảo để mua đặc sản hoặc thưởng thức hải sản. Xem bản đồ và liên hệ trực tiếp cơ sở.','Reference addresses for local specialities and seafood dining. Check the map and contact the venue directly.')}</p><div class="place-controls"><div class="filters" role="group" aria-label="${t('Loại địa điểm','Place type')}">${categories.map(([id,label])=>`<button data-filter="${id}">${choose(label)}</button>`).join('')}</div><label class="place-search"><span aria-hidden="true">⌕</span><span class="sr-only">${t('Tìm địa điểm','Search places')}</span><input id="place-search" type="search" placeholder="${t('Tên địa điểm hoặc khu vực…','A place or neighbourhood…')}" autocomplete="off"/></label></div><div class="place-results-meta"><span id="place-count" role="status"></span><span>${t('Nguồn kiểm tra: 15.10.2026','Sources checked: 15 Oct 2026')}</span></div><div class="places-grid" id="places-grid"></div></div>`,'browse');
 $('#place-search').value=query;filterPlaces();$('#place-search').addEventListener('input',e=>{query=e.target.value;filterPlaces();});
}
function openDishes(){openDialog(`<div class="directory-dialog dishes-dialog"><p class="eyebrow">HẠ LONG SEAFOOD</p><h2 id="dialog-title">${t('Chọn một vị biển.','Find your coastal flavour.')}</h2><p class="directory-intro">${t('Khám phá món ăn, rồi chọn địa chỉ để thưởng thức. Ảnh món ăn minh họa AI.','Explore the dishes, then choose a place to enjoy them. AI food illustrations.')}</p><div class="places-grid">${dishes.map(d=>`<article class="place-card"><button class="dish-picture" data-story="${d.id}">${img(d.image,choose(d.title))}</button><div class="place-meta">${choose(d.tag)}</div><h3><button data-story="${d.id}">${choose(d.title)}</button></h3><button class="place-details-link" data-story="${d.id}">${t('Tìm hiểu món ăn','Explore the dish')} →</button></article>`).join('')}</div></div>`,'dishes');}
function openPlanner(){openDirectory();}
function startCarousel(){
 clearInterval(slideTimer);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 $('.hero').classList.toggle('paused',carouselPaused||reduced);document.documentElement.dataset.motionPaused=String(carouselPaused);
 const stopped=carouselPaused||(!heroExplicitPlay&&(reduced||navigator.connection?.saveData));$('.pause-button span').textContent=stopped?'▷':'Ⅱ';$('.pause-button').setAttribute('aria-label',stopped?t('Tiếp tục chuyển động','Resume motion'):t('Tạm dừng chuyển động','Pause motion'));syncFilm();
 if(!$('.hero-film')&&!carouselPaused&&!reduced&&!document.hidden)slideTimer=setInterval(()=>{if($('.hero').getBoundingClientRect().bottom>0)setSlide((slideIndex+1)%3,false);},10000);
}
let syncLifestyle=()=>{},syncHero=()=>{};
function syncFilm(){syncLifestyle();syncHero();}
function setupHero(){
 const video=$('.hero-film');if(!video)return ()=>{};
 let failed=false;
 const sync=()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r=$('.hero').getBoundingClientRect();
  const allowed=!failed&&!carouselPaused&&!document.hidden&&!dialog.open&&r.bottom>0&&r.top<innerHeight&&(heroExplicitPlay||(!reduced&&!navigator.connection?.saveData));
  video.classList.toggle('manual-play',heroExplicitPlay);
  if(allowed){if(!video.getAttribute('src'))video.src=video.dataset.src;video.play().catch(()=>{$('.pause-button span').textContent='▷';$('.pause-button').setAttribute('aria-label',t('Phát video','Play video'));});}else video.pause();
 };
 const ready=()=>{video.classList.add('ready');$('.hero').classList.add('has-film');sync();};
 const tick=()=>{const time=video.currentTime;const chapter=time<4.7?0:time<9.7?1:2;if(chapter!==slideIndex)setSlide(chapter,false);const bounds=[0,4.7,9.7,15];$$('.slide-progress').forEach((el,i)=>el.style.width=`${Math.min(100,Math.max(0,(time-bounds[i])/(bounds[i+1]-bounds[i])*100))}%`);};
 const error=()=>{failed=true;video.classList.remove('ready');$('.hero').classList.remove('has-film');};
 video.addEventListener('loadeddata',ready);video.addEventListener('timeupdate',tick);video.addEventListener('error',error);
 const observer=new MutationObserver(sync);observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 syncHero=sync;sync();
 return ()=>{video.pause();video.removeEventListener('loadeddata',ready);video.removeEventListener('timeupdate',tick);video.removeEventListener('error',error);observer.disconnect();syncHero=()=>{};};
}
function setupMotion(){
 const disposeLifestyle=setupLifestyle(),disposeHero=setupHero(),disposeWorkStory=setupWorkStory();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const observer=new IntersectionObserver(syncFilm,{threshold:0});observer.observe($('.hero'));const contentObserver=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('motion-offscreen',!e.isIntersecting)),{rootMargin:'80px'});$$('.gallery-track,.planning-stage,.journey-section').forEach(e=>contentObserver.observe(e));
 let frame=0;const floats=$$('[data-float]');const update=()=>{frame=0;$('.site-header').classList.toggle('on-paper',$$('main .paper').some(e=>{const r=e.getBoundingClientRect();return r.top<80&&r.bottom>80;}));if(!reduced&&!carouselPaused)floats.forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)e.style.translate=`0 ${(r.top/innerHeight-.5)*Number(e.dataset.float)}px`;});};const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};addEventListener('scroll',onScroll,{passive:true});update();cleanupMotion=()=>{disposeHero();disposeLifestyle();disposeWorkStory();observer.disconnect();contentObserver.disconnect();removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);};
}
function setupWorkStory(){
 const stage=$('[data-work-stage]'),steps=$$('[data-work-step]');
 if(!stage||!steps.length)return ()=>{};
 const photos=$$('[data-work-image]',stage),caption=$('[data-work-caption]',stage),counter=$('[data-work-counter]',stage);
 let active=-1;
 const setActive=index=>{
  if(index===active||!steps[index])return;
  active=index;
  photos.forEach((photo,i)=>{const selected=i===index;photo.classList.toggle('active',selected);photo.setAttribute('aria-hidden',String(!selected));});
  steps.forEach((step,i)=>{if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
  if(caption)caption.textContent=steps[index].dataset.workLabel;
  if(counter)counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
 };
 const sync=()=>{
  const visible=steps.filter(step=>{const r=step.getBoundingClientRect();return r.bottom>innerHeight*.18&&r.top<innerHeight*.82;});
  if(!visible.length)return;
  const center=innerHeight*.5;
  const current=visible.reduce((best,step)=>Math.abs(step.getBoundingClientRect().top+step.getBoundingClientRect().height*.5-center)<Math.abs(best.getBoundingClientRect().top+best.getBoundingClientRect().height*.5-center)?step:best);
  setActive(Number(current.dataset.workStep));
 };
 const observer=new IntersectionObserver(sync,{rootMargin:'-18% 0px -18% 0px',threshold:0});
 steps.forEach(step=>observer.observe(step));sync();
 return ()=>observer.disconnect();
}
function setupLifestyle(){
 const film=$('.lifestyle-film'),button=$('.film-toggle'),container=$('.lifestyle-cinema');
 if(!film)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let visible=false,userPaused=false,requested=false,failed=false;
 const paint=()=>{
  const playing=!film.paused&&!film.ended;
  button.setAttribute('aria-label',playing?t('Tạm dừng phim','Pause film'):t('Phát phim','Play film'));
  $('.film-toggle-icon').textContent=playing?'Ⅱ':'▷';
  $('.film-toggle-text').textContent=playing?t('Tạm dừng','Pause'):t('Xem phim','Play film');
  const boundaries=[0,3.7,8.1,12.3,17];
  $$('[data-film-chapter]').forEach((el,i)=>{el.classList.toggle('active',film.currentTime>=boundaries[i]&&film.currentTime<boundaries[i+1]);el.style.setProperty('--progress',Math.min(1,Math.max(0,(film.currentTime-boundaries[i])/(boundaries[i+1]-boundaries[i]))));});
 };
 const sync=()=>{
  const allowed=visible&&!document.hidden&&!carouselPaused&&!dialog.open&&!userPaused&&!failed&&(requested||(!reduced&&!navigator.connection?.saveData));
  if(allowed){if(!film.getAttribute('src'))film.src=film.dataset.src;film.play().catch(()=>{paint();});}else film.pause();
  paint();
 };
 syncLifestyle=sync;
 const observer=new IntersectionObserver(es=>{visible=es[0].isIntersecting&&es[0].intersectionRatio>=.2;sync();},{threshold:[0,.2]});observer.observe(container);
 const toggle=()=>{if(!film.paused){userPaused=true;}else{userPaused=false;requested=true;}sync();};
 const ready=()=>container.classList.add('film-ready');
 const error=()=>{failed=true;container.classList.remove('film-ready');$('.film-error').hidden=false;button.hidden=true;};
 button.addEventListener('click',toggle);film.addEventListener('loadeddata',ready);film.addEventListener('error',error);
 for(const event of ['timeupdate','play','pause'])film.addEventListener(event,paint);
 const dialogObserver=new MutationObserver(sync);dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
 return ()=>{film.pause();observer.disconnect();dialogObserver.disconnect();button.removeEventListener('click',toggle);film.removeEventListener('loadeddata',ready);film.removeEventListener('error',error);for(const event of ['timeupdate','play','pause'])film.removeEventListener(event,paint);syncLifestyle=()=>{};};
}
function setupReveal(){revealObserver?.disconnect();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');revealObserver.unobserve(e.target);}}),{threshold:.08});$$('.reveal').forEach(e=>{e.classList.add('will-reveal');revealObserver.observe(e);});}
function openDialog(content,view=''){
 const wasOpen=dialog.open;$('#dialog-content').innerHTML=content;dialog.dataset.view=view;dialog.className=view==='menu'?'menu-dialog':'';$('.dialog-close').setAttribute('aria-label',t('Đóng','Close'));document.body.classList.add('dialog-open');if(!wasOpen)dialog.showModal();else{const h=$('#dialog-title');h.tabIndex=-1;h.focus({preventScroll:true});}dialog.scrollTop=0;
}
function openPlace(id){
 const p=places.find(p=>p.id===id);if(!p)return;const source=sources[p.source];const back=dialog.open&&dialog.dataset.view==='browse'?`<button class="place-back" data-action="browse">← ${t('Địa điểm','All places')}</button>`:'';
 openDialog(`<article class="place-dialog">${p.image?`<figure>${img(p.image,choose(p.name),'',true)}<figcaption>${photoCaption(p)}</figcaption></figure>`:''}<div class="place-dialog-content">${back}<p class="eyebrow">${choose(p.area)} / ${t(p.category==='food'?'ĂN UỐNG':p.category==='culture'?'VĂN HÓA':'VỊNH & BIỂN',p.category==='food'?'LOCAL FOOD':p.category==='culture'?'CULTURE':'BAY & BEACH')}</p><h2 id="dialog-title">${choose(p.name)}</h2><p>${choose(p.detail)}</p><dl class="venue-facts"><div><dt>${t('Địa chỉ / điểm đến','Address / access')}</dt><dd>${choose(p.address)}</dd></div><div><dt>${t('Giờ tham khảo','Opening information')}</dt><dd>${choose(p.time)}</dd></div></dl><div class="venue-actions">${external(t('Mở bản đồ','Open map'),mapUrl(p),'map-button')}<button class="save-detail-button" data-save="${p.id}" aria-pressed="${saved.includes(p.id)}">${saved.includes(p.id)?t('Đã lưu','Saved'):t('Lưu địa điểm','Save place')} ${saved.includes(p.id)?'♥':'♡'}</button></div><div class="practical-note"><h3>${t('Trước khi đến','Before you go')}</h3><p>${choose(p.practical)}</p></div><div class="venue-source"><p>${t('Nguồn tham khảo','Source')} · ${t('Kiểm tra ngày 15.10.2026','Checked 15 Oct 2026')}</p>${external(source.label,source.url)}<small>${t('Thông tin biên tập, không phải xác nhận đặt chỗ hoặc cập nhật trực tiếp từ điểm đến.','Editorial information, not a reservation confirmation or a live venue feed.')}</small></div></div></article>`,'place');
}
function toggleSaved(id){if(!places.some(p=>p.id===id))return;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];localStorage.setItem('halong-saved-places',JSON.stringify(saved));updateSaved();if(dialog.open&&dialog.dataset.view==='saved')openSaved();}
function updateSaved(){$$('.saved-count').forEach(e=>e.textContent=saved.length);$$('[data-save]').forEach(b=>{const isSaved=saved.includes(b.dataset.save);b.classList.toggle('saved',isSaved);b.setAttribute('aria-pressed',String(isSaved));b.textContent=b.classList.contains('save-detail-button')?`${isSaved?t('Đã lưu','Saved'):t('Lưu địa điểm','Save place')} ${isSaved?'♥':'♡'}`:isSaved?'♥':'♡';});}
function openSaved(){
 const selected=places.filter(p=>saved.includes(p.id));
 openDialog(`<div class="prose-dialog saved-dialog"><p class="eyebrow">${t('CHUYẾN ĐI CỦA BẠN','YOUR VISIT')}</p><h2 id="dialog-title">${t('Những nơi muốn ghé.','Your next stops.')}</h2><p>${t('Danh sách lưu trên trình duyệt này để bạn xem lại khi lên kế hoạch.','Saved in this browser to help you plan a visit.')}</p>${selected.length?selected.map(p=>`<div class="saved-row"><button data-place="${p.id}"><span>${choose(p.name)}</span><small>${choose(p.address)}</small></button><button class="remove-save" data-save="${p.id}" aria-label="${t('Bỏ lưu','Remove')} ${choose(p.name)}">×</button></div>`).join(''):`<div class="empty-state"><p>${t('Chưa có địa điểm nào. Nhấn biểu tượng trái tim ở một địa điểm để lưu.','No places saved yet. Use the heart on a place to add it here.')}</p><a class="text-link" data-close-link href="#places">${t('Khám phá địa điểm','Explore places')} →</a></div>`}${selected.length?`<button class="text-link" data-action="download">${t('Tải danh sách địa chỉ','Download your address list')} ↓</button>`:''}</div>`,'saved');
}
function downloadSaved(){const lines=places.filter(p=>saved.includes(p.id)).map(p=>`${choose(p.name)}\n${choose(p.address)}\n${mapUrl(p)}\n${sources[p.source].url}`).join('\n\n');const url=URL.createObjectURL(new Blob([`HẠ LONG SEAFOOD\nSources checked: ${checkedOn}\n\n${lines}`],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ha-long-dia-diem.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function openItinerary(id){openPlace(id==='hon-gai'?'market':'phuong-nam');}
function openStory(id){const s=[...dishes,...reading].find(x=>x.id===id);if(!s)return;openDialog(`<article class="article-dialog">${img(s.image,choose(s.title),'',true)}<div><p class="eyebrow">${choose(s.tag)}</p><h2 id="dialog-title">${choose(s.title)}</h2><p>${choose(s.body)}</p><button class="text-link" data-action="browse">${t('Tìm địa chỉ mua & thưởng thức','Find places to buy & enjoy')} →</button><div class="venue-source"><p>${t('Tìm hiểu từ nguồn','Explore the source')}</p>${external(sources[s.source].label,sources[s.source].url)}<small>${s.photo==='real'?'Visit Quang Ninh · Ảnh sưu tầm':t('Ảnh món ăn minh họa AI; không đại diện cho sản phẩm của cơ sở.','AI food illustration; not a photograph of a venue’s product.')}</small></div></div></article>`,'article');}
function openMenu(){openDialog(`<nav class="full-menu"><p class="eyebrow">HẠ LONG SEAFOOD</p><h2 id="dialog-title">${t('Khám phá vị biển.','Explore coastal flavours.')}</h2>${[['#places',t('Hải sản','Seafood')],['#story',t('Câu chuyện','Our story')],['#journey',t('Đặc sản','Specialities')],['#food',t('Thưởng thức','Savour')],['#culture',t('Địa chỉ','Where to go')],['#journal',t('Góc bếp','Food stories')]].map(([href,label],i)=>`<a data-close-link href="${href}"><span>0${i+1}</span>${label}<i>↗</i></a>`).join('')}<button class="text-link" data-action="saved">${t('Địa chỉ đã lưu','Saved addresses')} (${saved.length}) ♡</button></nav>`,'menu');}
function openAbout(){openDialog(`<div class="prose-dialog"><p class="eyebrow">HẠ LONG SEAFOOD</p><h2 id="dialog-title">${t('Một miền biển, nhiều vị ngon.','One coast, so many flavours.')}</h2><p>${t('Khám phá hải sản và đặc sản Hạ Long qua những món ăn, chuyện miền biển và địa chỉ mua, thưởng thức có nguồn tham khảo.','Discover Ha Long seafood and local specialities through dishes, coastal stories and sourced places to buy and eat.')}</p><p>${t('Thông tin địa chỉ được dẫn từ kênh của cơ sở và nguồn du lịch địa phương. Ảnh món ăn là minh họa AI. Bạn có thể xem bản đồ và liên hệ trực tiếp cơ sở để hỏi món, giá và giờ phục vụ.','Venue information links to operators and local tourism sources. Food images are AI illustrations. Use the maps and contact venues directly for dishes, prices and service times.')}</p></div>`);}
async function openSources(){
 const request=++sourceRequestId;
 openDialog(`<div class="prose-dialog sources-dialog"><h2 id="dialog-title">${t('Nguồn để bạn kiểm tra.','Sources you can check.')}</h2><p role="status">${t('Đang tải thông tin ảnh…','Loading image credits…')}</p></div>`,'sources');
 const creditResponse=await fetch('./assets/real-photo-credits.json').catch(()=>null);const credits=creditResponse?.ok?(await creditResponse.json()).filter(c=>c.id==='market-real'):[];
 if(request!==sourceRequestId||!dialog.open||dialog.dataset.view!=='sources')return;
 openDialog(`<div class="prose-dialog sources-dialog"><p class="eyebrow">${t('THÔNG TIN BIÊN TẬP','EDITORIAL INFORMATION')}</p><h2 id="dialog-title">${t('Nguồn để bạn kiểm tra.','Sources you can check.')}</h2><p>${t('Nội dung được kiểm tra ngày 16.10.2026. Giờ hoạt động, địa giới, tuyến tham quan và thông tin cơ sở có thể thay đổi.','Content checked on 16 October 2026. Opening times, administrative names, routes and venue details may change.')}</p><ul class="source-list">${['seafood','market','restaurant'].map(id=>sources[id]).map(s=>`<li>${external(s.label,s.url)}</li>`).join('')}</ul><h3>${t('Ảnh thật & giấy phép','Documentary images & licences')}</h3>${credits.map(c=>`<div class="photo-credit">${external(c.title,c.source)}<p>${c.author} · ${c.licenseUrl?external(c.license,c.licenseUrl):t('Ảnh từ nguồn dẫn','Image from linked source')}</p><small>${t('Đã đổi kích thước / định dạng; ảnh được crop trong giao diện.','Resized / converted; cropped in the interface.')}</small></div>`).join('')}<h3>${t('Ảnh món ăn','Food illustrations')}</h3><p>${t('Ảnh chả mực, mâm hải sản và mực nướng được tạo bằng AI. Nhãn minh họa xuất hiện ở những chỗ ảnh gắn với địa điểm; ảnh không đại diện cho hàng hóa hoặc không gian của cơ sở.','Squid cakes, the seafood table and grilled squid are AI-generated illustrations. Images linked to venues are labelled; they do not depict those venues’ products or premises.')}</p><h3>${t('Minh họa Hạ Long','Ha Long illustrations')}</h3><p>${t('Bốn ảnh phong cách chụp điện thoại — chăm giàn hàu, câu mực ban đêm, kéo lưới và vá lưới — được tạo bằng AI. Đây là ảnh minh họa, không phải tư liệu về người lao động cụ thể tại Hạ Long.','Four phone-style images — tending oyster lines, night squid fishing, hauling a net and mending nets — are AI illustrations. They do not document specific Ha Long workers.')}</p><h3>${t('Video banner — người làm nghề biển','Hero film — coastal workers')}</h3><p>${t('Bản dựng 15 giây, mỗi cảnh khoảng 5 giây, chuyển cảnh hòa tan và phát không tiếng. Đây là footage tư liệu từ nhiều nơi: người bán cá quay tại Ấn Độ, cảnh câu cá ban đêm chưa xác nhận địa điểm, và người thu hoạch hàu tại vịnh Arcachon, Pháp. Chưa có footage được cấp quyền ghi lại người làm chả mực hoặc ngư dân câu mực tại Hạ Long; video không đại diện cho lao động hay nhà cung cấp cụ thể ở Hạ Long.','A silent 15-second edit with three roughly five-second shots and soft dissolves. The footage comes from different places: a fishmonger in India, night fishing at an unverified location, and oyster harvesting in Arcachon Bay, France. No cleared footage of squid-cake makers or squid fishers in Ha Long was available; this film does not depict specific Ha Long workers or suppliers.')}</p><ul class="source-list"><li>${external('Street Fish Vendor Filleting Fresh Seafood · md Jahangir alam','https://www.pexels.com/video/street-fish-vendor-filleting-fresh-seafood-38128750/')}</li><li>${external('A Group of People Standing on a Boat at Night · Khanh Hoang Minh 2','https://www.pexels.com/video/a-group-of-people-standing-on-a-boat-at-night-20748401/')}</li><li>${external('Oyster Harvesting in Arcachon Bay · Thierry De Munsthal','https://www.pexels.com/video/oyster-harvesting-in-arcachon-bay-30282882/')}</li><li>${external('Pexels License','https://www.pexels.com/license/')}</li></ul><h3>${t('Tư liệu địa phương để xem','Local sources to explore')}</h3><p>${t('Các nguồn dưới đây ghi lại nghề ở Quảng Ninh; video banner hiện tại chưa dùng những tư liệu này.','These sources document work in Quang Ninh; the current banner does not use their footage.')}</p><ul class="source-list"><li>${external('Người dân giã chả mực ở Vân Đồn · VTV','https://vtv.vn/du-lich/kham-pha-vung-lam-cha-muc-gia-tay-o-van-don-20200227184207453.htm')}</li><li>${external('Quy trình nuôi hàu ở Vân Đồn · VTV24','https://vtv.vn/trong-nuoc/can-canh-qua-trinh-nuoi-hau-sua-it-nguoi-biet-20170324084210221.htm')}</li><li>${external('Nghề câu mực ống ở Cô Tô · Báo Quảng Ninh','https://baoquangninh.vn/nghe-cau-muc-ong-o-co-to-dau-tu-it-thu-nhap-cao-post2346510.html')}</li><li>${external('Squid cakes in Ha Long · Việt Nam News','https://www.youtube.com/watch?v=_cR8wqPYJjI')}</li></ul><h3>${t('Thiết kế','Design')}</h3><p>DM Sans, Newsreader, Anton · Google Fonts / SIL Open Font License. ${external('UI reference: Delta Cafés','https://deltacafes.com/en')}</p></div>`,'sources');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-place],[data-save],[data-story],[data-action],[data-itinerary],[data-area],[data-save-route],[data-close-link],[data-filter],[data-journey],[data-browse]');if(!b)return;
 if(b.hasAttribute('data-close-link'))dialog.close();
 if(b.dataset.filter){filter=b.dataset.filter;filterPlaces();}
 if(b.hasAttribute('data-journey'))setJourney(Number(b.dataset.journey));
 if(b.dataset.browse)openDirectory(b.dataset.browse,'');
 if(b.dataset.place)openPlace(b.dataset.place);if(b.dataset.save)toggleSaved(b.dataset.save);if(b.dataset.story)openStory(b.dataset.story);if(b.dataset.itinerary)openItinerary(b.dataset.itinerary);
 if(b.dataset.area)openDirectory('all',b.dataset.area);
 if(b.dataset.saveRoute){saved=[...new Set([...saved,...b.dataset.saveRoute.split(',')])];localStorage.setItem('halong-saved-places',JSON.stringify(saved));updateSaved();b.textContent=t('Đã lưu các điểm ✓','Stops saved ✓');}
 const action=b.dataset.action;if(action==='browse')openDirectory();if(action==='dishes')openDishes();if(action==='planner')openPlanner();if(action==='menu')openMenu();if(action==='saved')openSaved();if(action==='sources')openSources();if(action==='about')openAbout();if(action==='download')downloadSaved();if(action==='clear-search'){filter='all';query='';$('#place-search').value='';filterPlaces();}
});
$('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=$$('button:not([disabled]),a[href],input,textarea,[tabindex="0"]',dialog).filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}});
document.addEventListener('visibilitychange',startCarousel);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{heroExplicitPlay=false;startCarousel();cleanupMotion();setupMotion();});
async function toggleSound(){try{if(!audioContext){audioContext=new(window.AudioContext||window.webkitAudioContext)();const n=audioContext.sampleRate*10,buffer=audioContext.createBuffer(1,n,audioContext.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<n;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3;}const source=audioContext.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;ambientGain=audioContext.createGain();ambientGain.gain.value=0;source.connect(filter).connect(ambientGain).connect(audioContext.destination);source.start();}soundOn=!soundOn;await audioContext.resume();ambientGain.gain.setTargetAtTime(soundOn?.06:0,audioContext.currentTime,.7);if(!soundOn)setTimeout(()=>{if(!soundOn)audioContext.suspend();},1800);$('.sound-toggle').setAttribute('aria-pressed',String(soundOn));$('.sound-toggle').setAttribute('aria-label',soundOn?t('Tắt âm thanh sóng biển','Turn off ocean ambience'):t('Bật âm thanh sóng biển','Turn on ocean ambience'));}catch{const toast=$('.toast');toast.textContent=t('Trình duyệt chưa hỗ trợ âm thanh này.','Your browser does not support this ambience.');toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),3000);}}
render();
