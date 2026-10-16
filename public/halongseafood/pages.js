import { logo } from './home.js';
import { mapUrl } from './places.js';

export function pageUrl(page, id) {
  const params = new URLSearchParams();
  params.set('page', page);
  if (id) params.set('id', id);
  return './?' + params.toString();
}

export function pageTitle(route, { t, choose, dishes, places, reading }) {
  const data = route.page === 'product' ? dishes.find(x => x.id === route.id)
    : route.page === 'place' ? places.find(x => x.id === route.id)
    : route.page === 'story' ? reading.find(x => x.id === route.id) : null;
  if (data) return choose(data.title || data.name) + ' — Ha Long Seafood';
  const titles = {
    seafood: t('Hải sản & đặc sản', 'Seafood & specialities'),
    places: t('Địa chỉ hải sản Hạ Long', 'Places to buy & eat'),
    stories: t('Góc bếp miền biển', 'Coastal food stories'),
    plan: t('Lên kế hoạch ghé thăm', 'Plan a coastal food visit'),
    about: t('Về Hạ Long Seafood', 'About Ha Long Seafood'),
    sources: t('Nguồn nội dung & hình ảnh', 'Editorial & image sources')
  };
  return (titles[route.page] || t('Trang chưa tìm thấy', 'Page not found')) + ' — Ha Long Seafood';
}

function pageHeader({ t, language, wave, globe, url }) {
  return '<header class="site-header page-header">' +
    '<button class="sound-toggle utility-button" aria-label="' + t('Bật âm thanh sóng biển', 'Turn on ocean ambience') + '" aria-pressed="false">' + wave + '</button>' +
    '<nav class="desktop-nav" aria-label="' + t('Điều hướng chính', 'Main navigation') + '">' +
      '<div class="nav-half"><a href="' + url('seafood') + '">' + t('HẢI SẢN', 'SEAFOOD') + '</a><a href="' + url('stories') + '">' + t('GÓC BẾP', 'FOOD STORIES') + '</a><a href="' + url('places') + '">' + t('ĐỊA CHỈ', 'PLACES') + '</a></div>' +
      '<a class="brand" href="./" aria-label="Hạ Long Seafood — ' + t('Trang chủ', 'Home') + '">' + logo + '</a>' +
      '<div class="nav-half nav-right"><a href="' + url('plan') + '">' + t('LÊN KẾ HOẠCH', 'PLAN A VISIT') + '</a><a href="' + url('about') + '">' + t('CÂU CHUYỆN', 'OUR STORY') + '</a></div>' +
    '</nav><a class="brand mobile-brand" href="./" aria-label="Hạ Long Seafood">' + logo + '</a>' +
    '<button class="language-toggle utility-button" aria-label="' + t('Read in English', 'Đọc bằng tiếng Việt') + '">' + globe + '<span>' + (language === 'vi' ? 'VI' : 'EN') + '</span><span>⌄</span></button>' +
    '<button class="mobile-menu utility-button" data-action="menu" aria-label="' + t('Mở menu', 'Open menu') + '">MENU</button></header>';
}

function pageFooter({ t, url, saved }) {
  return '<footer class="subpage-footer"><div><a class="brand footer-brand" href="./" aria-label="Hạ Long Seafood">' + logo + '</a>' +
    '<p>' + t('Hải sản, đặc sản và những bữa ăn đáng nhớ.', 'Seafood, local specialities and memorable meals.') + '</p></div>' +
    '<nav aria-label="' + t('Liên kết cuối trang', 'Footer navigation') + '">' +
      '<a href="' + url('seafood') + '">' + t('Hải sản & đặc sản', 'Seafood & specialities') + '</a>' +
      '<a href="' + url('places') + '">' + t('Địa chỉ mua & ăn', 'Places to buy & eat') + '</a>' +
      '<a href="' + url('stories') + '">' + t('Góc bếp', 'Food stories') + '</a>' +
      '<a href="' + url('plan') + '">' + t('Địa chỉ đã lưu', 'Saved places') + ' (' + saved.length + ')</a>' +
      '<a href="' + url('sources') + '">' + t('Nguồn nội dung & ảnh', 'Editorial & image sources') + '</a>' +
      '<a href="' + url('about') + '">' + t('Về Hạ Long Seafood', 'About Ha Long Seafood') + '</a>' +
    '</nav><span>HẠ LONG · QUẢNG NINH · VIỆT NAM</span></footer>';
}

function breadcrumb(label, t) {
  return '<nav class="page-breadcrumb" aria-label="' + t('Đường dẫn', 'Breadcrumb') + '"><a href="./">' + t('Trang chủ', 'Home') + '</a><span>/</span><span aria-current="page">' + label + '</span></nav>';
}

function hero({ t, img }, kicker, title, copy, image, imageAlt, linkPage, linkLabel) {
  return '<section class="page-hero"><div class="page-hero-copy"><p class="eyebrow">' + kicker + '</p><h1>' + title + '</h1><p class="page-lede">' + copy + '</p>' +
    (linkPage ? '<a class="page-action" href="' + linkPage + '">' + linkLabel + ' <span>→</span></a>' : '') +
    '</div><figure class="page-hero-visual">' + img(image, imageAlt, 'page-hero-image', true) + '</figure></section>';
}

function dishCard(d, ctx) {
  const { t, choose, img, url } = ctx;
  return '<article class="catalog-card"><a class="catalog-image" href="' + url('product', d.id) + '">' + img(d.image, choose(d.title)) + '<span>↗</span></a>' +
    '<p class="catalog-kicker">' + choose(d.tag) + '</p><h2><a href="' + url('product', d.id) + '">' + choose(d.title) + '</a></h2>' +
    '<p>' + choose(d.body) + '</p><a class="text-link" href="' + url('product', d.id) + '">' + t('Tìm hiểu món ăn', 'Explore the dish') + ' →</a></article>';
}

function placeCard(p, ctx) {
  const { t, choose, img, url, saved } = ctx;
  const photoNote = p.photo === 'illustration' ? '<span class="image-disclosure">' + t('Ảnh minh họa AI', 'AI illustration') + '</span>' : '';
  return '<article class="directory-card"><div class="directory-photo"><a href="' + url('place', p.id) + '">' + img(p.image, choose(p.name)) + '</a>' + photoNote +
    '<button class="save-button ' + (saved.includes(p.id) ? 'saved' : '') + '" data-save="' + p.id + '" aria-pressed="' + String(saved.includes(p.id)) + '" aria-label="' + t('Lưu địa điểm', 'Save place') + ': ' + choose(p.name) + '">' + (saved.includes(p.id) ? '♥' : '♡') + '</button></div>' +
    '<p class="catalog-kicker">' + choose(p.area) + ' · ' + t('Địa chỉ tham khảo', 'Reference address') + '</p>' +
    '<h2><a href="' + url('place', p.id) + '">' + choose(p.name) + '</a></h2><p>' + choose(p.short) + '</p>' +
    '<a class="text-link" href="' + url('place', p.id) + '">' + t('Địa chỉ, bản đồ & lưu ý', 'Address, map & visit notes') + ' →</a></article>';
}

function storyCard(s, ctx) {
  const { t, choose, img, url } = ctx;
  return '<article class="story-card"><a class="story-card-image" href="' + url('story', s.id) + '">' + img(s.image, choose(s.title)) + '</a>' +
    '<p class="catalog-kicker">' + choose(s.tag) + '</p><h2><a href="' + url('story', s.id) + '">' + choose(s.title) + '</a></h2>' +
    '<p>' + choose(s.body) + '</p><a class="text-link" href="' + url('story', s.id) + '">' + t('Đọc gợi ý', 'Read the guide') + ' →</a></article>';
}

function intro(ctx, title, lede, image, alt, linkPage, linkLabel) {
  return hero(ctx, 'HẠ LONG SEAFOOD', title, lede, image, alt, linkPage, linkLabel);
}

function detailAction(href, label) {
  return '<a class="page-action" href="' + href + '">' + label + ' <span>→</span></a>';
}

function renderSeafood(ctx) {
  const { t, dishes, url } = ctx;
  const items = dishes.map(d => dishCard(d, ctx)).join('');
  return breadcrumb(t('Hải sản & đặc sản', 'Seafood & specialities'), t) +
    intro(ctx, t('Vị biển bắt đầu từ món ăn.', 'Start with the taste of the coast.'), t('Khám phá chả mực, mực biển, hàu và những món để chia sẻ. Nội dung giới thiệu món ăn; thực đơn, giá và tình trạng cung cấp cần hỏi trực tiếp nơi bán.', 'Explore squid cakes, local squid, oysters and dishes to share. These are food guides; ask sellers directly about menus, prices and current availability.'), 'hero-food-0', t('Hải sản Hạ Long — ảnh món ăn minh họa AI', 'Ha Long seafood — AI food illustration'), url('places'), t('Tìm địa chỉ mua & ăn', 'Find places to buy & eat')) +
    '<section class="page-section paper-page"><div class="page-section-heading"><p class="eyebrow">' + t('BỐN VỊ BIỂN ĐỂ BẮT ĐẦU', 'FOUR COASTAL FLAVOURS') + '</p><h2>' + t('Chọn món bạn muốn khám phá.', 'Choose a dish to explore.') + '</h2><p>' + t('Ảnh món ăn là minh họa AI, không đại diện cho sản phẩm của cơ sở.', 'Food images are AI illustrations and do not represent a venue’s actual product.') + '</p></div><div class="catalog-grid">' + items + '</div>' +
    '<div class="source-callout"><p>' + t('Tìm hiểu thêm về các sản vật thủy sản Quảng Ninh qua nguồn địa phương.', 'Learn more about seafood products in Quang Ninh from a local source.') + '</p>' + detailAction(url('sources'), t('Xem nguồn nội dung', 'View editorial sources')) + '</div></section>';
}

function renderProduct(ctx, id) {
  const { t, choose, img, url, dishes, sources } = ctx;
  const d = dishes.find(x => x.id === id);
  if (!d) return notFound(ctx);
  const source = sources[d.source];
  const note = d.image === 'seafood' || d.image === 'squid-cake' || d.image === 'oysters' || d.image === 'grilled-squid'
    ? t('Ảnh món ăn minh họa AI; không phải ảnh sản phẩm đang bán tại địa điểm.', 'AI food illustration; not a photograph of an item currently sold at a venue.') : '';
  return breadcrumb(t('Hải sản & đặc sản', 'Seafood & specialities'), t) +
    '<section class="page-product"><figure class="page-product-visual">' + img(d.image, choose(d.title), 'page-product-image', true) + (note ? '<figcaption>' + note + '</figcaption>' : '') + '</figure>' +
    '<div class="page-product-copy"><p class="eyebrow">' + choose(d.tag) + '</p><h1>' + choose(d.title) + '</h1><p class="page-lede">' + choose(d.body) + '</p>' +
    '<div class="product-guide"><h2>' + t('Trước khi mua hoặc gọi món', 'Before you buy or order') + '</h2><ul><li>' + t('Hỏi rõ thành phần và cách chế biến.', 'Ask about ingredients and preparation.') + '</li><li>' + t('Xác nhận giá, khẩu phần và tình trạng có món tại thời điểm bạn ghé.', 'Confirm prices, serving size and availability when you visit.') + '</li><li>' + t('Nếu mua mang về, hỏi cách đóng gói và bảo quản.', 'If taking it home, ask about packaging and storage.') + '</li></ul></div>' +
    (source ? '<div class="venue-source"><p>' + t('Nguồn tham khảo', 'Reference source') + '</p><a class="text-link" href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.label + ' ↗</a><small>' + t('Thông tin biên tập; không phải bảng giá hay tình trạng cung cấp trực tiếp.', 'Editorial information, not a live price list or availability feed.') + '</small></div>' : '') +
    detailAction(url('places'), t('Xem địa chỉ mua & ăn', 'Browse places to buy & eat')) + '</div></section>' +
    '<section class="page-section paper-page related-section"><div class="page-section-heading"><p class="eyebrow">' + t('ĐI TIẾP TỪ ĐÂY', 'CONTINUE EXPLORING') + '</p><h2>' + t('Một địa chỉ để bắt đầu.', 'A place to start.') + '</h2></div><div class="related-links">' + ctx.places.map(p => '<a href="' + url('place', p.id) + '"><span>' + choose(p.name) + '</span><i>↗</i></a>').join('') + '</div></section>';
}

function renderPlaces(ctx) {
  const { t, places, url } = ctx;
  return breadcrumb(t('Địa chỉ mua & ăn', 'Places to buy & eat'), t) +
    intro(ctx, t('Ghé chợ, chọn vị biển.', 'Find a taste of the coast.'), t('Hai địa chỉ tham khảo tại Hạ Long, kèm thông tin nguồn và bản đồ. Giờ mở cửa, thực đơn, giá và mặt hàng có thể thay đổi; vui lòng xác nhận trực tiếp trước khi ghé.', 'Two reference addresses in Ha Long, with source links and maps. Hours, menus, prices and stock can change; confirm directly before visiting.'), 'market-real', t('Chợ Hạ Long 1 · Visit Quang Ninh'), url('plan'), t('Lưu điểm muốn ghé', 'Save places to visit')) +
    '<section class="page-section paper-page"><div class="page-section-heading"><p class="eyebrow">' + t('ĐỊA CHỈ ĐƯỢC DẪN NGUỒN', 'SOURCED PLACES') + '</p><h2>' + t('Chọn nơi muốn tìm hiểu.', 'Choose a place to explore.') + '</h2></div><div class="directory-grid">' + places.map(p => placeCard(p, ctx)).join('') + '</div></section>';
}

function renderPlace(ctx, id) {
  const { t, choose, img, url, places } = ctx;
  const p = places.find(x => x.id === id);
  if (!p) return notFound(ctx);
  const isIllustration = p.photo === 'illustration';
  return breadcrumb(t('Địa chỉ mua & ăn', 'Places to buy & eat'), t) +
    '<section class="place-detail"><figure class="place-detail-visual">' + img(p.image, choose(p.name), 'place-detail-image', true) +
      '<figcaption>' + (isIllustration ? t('Ảnh hải sản minh họa AI; không phải ảnh của địa điểm.', 'AI seafood illustration; not a photograph of the venue.') : t('Ảnh: Visit Quang Ninh · Sưu tầm', 'Photo: Visit Quang Ninh · Collected image')) + '</figcaption></figure>' +
      '<div class="place-detail-copy"><p class="eyebrow">' + choose(p.area) + ' / ' + t('ĐỊA CHỈ THAM KHẢO', 'REFERENCE ADDRESS') + '</p><h1>' + choose(p.name) + '</h1><p class="page-lede">' + choose(p.detail) + '</p>' +
      '<dl class="venue-facts"><div><dt>' + t('Địa chỉ', 'Address') + '</dt><dd>' + choose(p.address) + '</dd></div><div><dt>' + t('Giờ tham khảo', 'Opening information') + '</dt><dd>' + choose(p.time) + '</dd></div></dl>' +
      '<div class="venue-actions"><a class="map-button" href="' + mapUrl(p) + '" target="_blank" rel="noopener noreferrer">' + t('Mở bản đồ', 'Open map') + ' ↗</a><button class="save-detail-button" data-save="' + p.id + '" aria-pressed="' + String(ctx.saved.includes(p.id)) + '">' + (ctx.saved.includes(p.id) ? t('Đã lưu', 'Saved') + ' ♥' : t('Lưu địa điểm', 'Save place') + ' ♡') + '</button></div>' +
      '<aside class="practical-note"><h2>' + t('Trước khi đến', 'Before you go') + '</h2><p>' + choose(p.practical) + '</p><p>' + t('Hãy kiểm tra thông tin mới nhất với quầy hoặc cơ sở; trang này không xác nhận đặt chỗ.', 'Check current information with the stall or venue; this page does not confirm a reservation.') + '</p></aside>' +
      '<div class="venue-source"><p>' + t('Nguồn tham khảo · Kiểm tra ngày 15.10.2026', 'Reference source · Checked 15 Oct 2026') + '</p><a class="text-link" href="' + ctx.sources[p.source].url + '" target="_blank" rel="noopener noreferrer">' + ctx.sources[p.source].label + ' ↗</a></div>' +
      detailAction(url('places'), t('Quay lại danh sách địa chỉ', 'Back to all places')) + '</div></section>';
}

function renderStories(ctx) {
  const { t, reading, url } = ctx;
  return breadcrumb(t('Góc bếp', 'Food stories'), t) +
    intro(ctx, t('Chuyện món ăn, cách chọn và nơi thưởng thức.', 'Local dishes, market finds and shared meals.'), t('Những gợi ý ngắn dựa trên nguồn công khai. Hãy kiểm tra chi tiết tại quầy hoặc cơ sở trước khi mua hay gọi món.', 'Short guides based on public sources. Check details with the stall or venue before buying or ordering.'), 'v5-table', t('Bữa ăn miền biển minh họa AI', 'AI coastal meal illustration'), url('seafood'), t('Khám phá hải sản', 'Explore seafood')) +
    '<section class="page-section paper-page"><div class="page-section-heading"><p class="eyebrow">' + t('GÓC BẾP', 'FOOD STORIES') + '</p><h2>' + t('Từ món ăn đến chuyến ghé thăm.', 'From a dish to a place to visit.') + '</h2></div><div class="story-grid">' + reading.map(s => storyCard(s, ctx)).join('') + '</div></section>';
}

function renderStory(ctx, id) {
  const { t, choose, img, url, reading, sources } = ctx;
  const s = reading.find(x => x.id === id);
  if (!s) return notFound(ctx);
  const source = sources[s.source];
  const related = s.id === 'food' ? 'squid-cake' : s.id === 'table' ? 'seafood-table' : 'squid';
  const extra = s.id === 'food'
    ? t('Tại quầy, hỏi về thành phần, cách đóng gói và bảo quản. Giá và hàng có sẵn thay đổi theo từng nơi bán.', 'At the stall, ask about ingredients, packaging and storage. Prices and stock vary by seller.')
    : s.id === 'seafood-guide'
      ? t('Nguồn du lịch mô tả chợ Hạ Long 1 ở khu vực Hòn Gai và các quầy hàng địa phương. Hãy xem nguồn và kiểm tra thông tin mới nhất trước chuyến đi.', 'The tourism source describes Ha Long Market 1 in the Hon Gai area and its local stalls. Review the source and check current information before your visit.')
      : t('Thực đơn có thể thay đổi. Xem kênh của cơ sở và hỏi giá, khẩu phần cùng tình trạng có món trước khi gọi.', 'Menus can change. Check the venue’s own channel and ask about prices, serving sizes and availability before ordering.');
  return breadcrumb(t('Góc bếp', 'Food stories'), t) +
    '<article class="editorial-article"><figure>' + img(s.image, choose(s.title), 'article-cover', true) + '<figcaption>' + (s.photo === 'real' ? t('Ảnh sưu tầm từ nguồn du lịch.', 'Collected image from a tourism source.') : t('Ảnh minh họa AI.', 'AI illustration.')) + '</figcaption></figure>' +
    '<div class="article-copy"><p class="eyebrow">' + choose(s.tag) + '</p><h1>' + choose(s.title) + '</h1><p class="article-lede">' + choose(s.body) + '</p><h2>' + t('Một lưu ý hữu ích', 'A practical note') + '</h2><p>' + extra + '</p>' +
    '<aside class="article-source"><p>' + t('Đọc nguồn tham khảo', 'Read the reference source') + '</p><a class="text-link" href="' + source.url + '" target="_blank" rel="noopener noreferrer">' + source.label + ' ↗</a></aside>' +
    '<div class="article-next"><a href="' + url('product', related) + '">' + t('Khám phá món liên quan', 'Explore a related dish') + ' →</a><a href="' + url('places') + '">' + t('Xem địa chỉ', 'Browse places') + ' →</a></div></div></article>';
}

function renderPlan(ctx) {
  const { t, places, url, saved } = ctx;
  const selected = places.filter(p => saved.includes(p.id));
  const shown = selected.length ? selected : places;
  return breadcrumb(t('Lên kế hoạch', 'Plan a visit'), t) +
    hero(ctx, t('CHUYẾN ĐI CỦA BẠN', 'YOUR VISIT'), t('Lên kế hoạch ghé vị biển.', 'Plan a taste of the coast.'), t('Lưu địa chỉ muốn ghé trên trình duyệt này. Xem bản đồ và hỏi trực tiếp về giờ, thực đơn, giá hoặc tình trạng có món trước khi đi.', 'Save places in this browser. Check the map and contact venues about hours, menus, prices or availability before you go.'), 'market-real', t('Chợ Hạ Long 1 · Visit Quang Ninh'), url('places'), t('Xem tất cả địa chỉ', 'Browse all places')) +
    '<section class="page-section paper-page"><div class="page-section-heading"><p class="eyebrow">' + t(selected.length ? 'ĐỊA CHỈ ĐÃ LƯU' : 'GỢI Ý ĐỊA CHỈ', selected.length ? 'SAVED PLACES' : 'PLACES TO EXPLORE') + '</p><h2>' + t(selected.length ? 'Danh sách của bạn.' : 'Bắt đầu từ nơi phù hợp.', selected.length ? 'Your saved list.' : 'Start with a place that fits.') + '</h2><p>' + t(selected.length ? 'Danh sách được lưu trên trình duyệt hiện tại.' : 'Chưa có địa chỉ được lưu. Dùng biểu tượng trái tim để thêm nơi muốn ghé.', selected.length ? 'This list is saved in the current browser.' : 'No places saved yet. Use the heart button to add a place.') + '</p></div><div class="directory-grid">' + shown.map(p => placeCard(p, ctx)).join('') + '</div>' +
    '<div class="plan-steps"><article><span>01</span><h3>' + t('Chọn món', 'Choose a dish') + '</h3><p>' + t('Tìm hiểu món ăn và nguồn tham khảo.', 'Explore a dish and its reference source.') + '</p><a class="text-link" href="' + url('seafood') + '">' + t('Xem hải sản', 'Explore seafood') + ' →</a></article><article><span>02</span><h3>' + t('Chọn địa chỉ', 'Choose a place') + '</h3><p>' + t('Lưu nơi muốn ghé để xem lại.', 'Save a place to revisit it later.') + '</p><a class="text-link" href="' + url('places') + '">' + t('Xem địa chỉ', 'Browse places') + ' →</a></article><article><span>03</span><h3>' + t('Xác nhận trước khi đi', 'Check before you go') + '</h3><p>' + t('Giờ, giá và thực đơn có thể thay đổi; kiểm tra với cơ sở.', 'Hours, prices and menus can change; check with the venue.') + '</p><a class="text-link" href="' + url('sources') + '">' + t('Xem nguồn', 'View sources') + ' →</a></article></div></section>';
}

function renderAbout(ctx) {
  const { t, url } = ctx;
  return breadcrumb(t('Về Hạ Long Seafood', 'About Ha Long Seafood'), t) +
    '<section class="page-about"><p class="eyebrow">HẠ LONG SEAFOOD</p><h1>' + t('Một miền biển, nhiều vị ngon.', 'One coast, so many flavours.') + '</h1><p class="page-lede">' + t('Khám phá hải sản và đặc sản Hạ Long qua những món ăn, chuyện miền biển và địa chỉ mua, thưởng thức có nguồn tham khảo.', 'Discover Ha Long seafood and local specialities through dishes, coastal stories and sourced places to buy and eat.') + '</p><p>' + t('Thông tin địa chỉ được dẫn từ nguồn du lịch địa phương và kênh của cơ sở. Ảnh món ăn là minh họa AI. Dữ liệu này không phải bảng giá, thông tin tồn kho hay xác nhận đặt chỗ.', 'Place information links to local tourism sources and venue channels. Food images are AI illustrations. This is not a price list, stock feed or booking confirmation.') + '</p><div class="related-links"><a href="' + url('seafood') + '">' + t('Khám phá hải sản', 'Explore seafood') + ' ↗</a><a href="' + url('places') + '">' + t('Xem địa chỉ', 'Browse places') + ' ↗</a><a href="' + url('sources') + '">' + t('Kiểm tra nguồn', 'Check sources') + ' ↗</a></div></section>';
}

function renderSources(ctx) {
  const { t, url, sources } = ctx;
  const refs = ['seafood', 'market', 'restaurant'].map(key => '<li><a href="' + sources[key].url + '" target="_blank" rel="noopener noreferrer">' + sources[key].label + ' ↗</a></li>').join('');
  return breadcrumb(t('Nguồn nội dung & ảnh', 'Editorial & image sources'), t) +
    '<section class="page-sources"><p class="eyebrow">' + t('THÔNG TIN BIÊN TẬP', 'EDITORIAL INFORMATION') + '</p><h1>' + t('Nguồn để bạn kiểm tra.', 'Sources you can check.') + '</h1><p class="page-lede">' + t('Nội dung địa chỉ và món ăn được biên tập từ các nguồn dưới đây; thông tin hoạt động và kinh doanh có thể thay đổi.', 'Place and dish information is edited from the sources below; operational and business details can change.') + '</p><h2>' + t('Nguồn về món ăn và địa điểm', 'Food and place sources') + '</h2><ul class="source-list">' + refs + '</ul><h2>' + t('Ảnh và tư liệu', 'Images and footage') + '</h2><p>' + t('Ảnh món ăn và một số ảnh lifestyle được ghi nhãn minh họa AI. Ảnh chợ Hạ Long 1 được dẫn nguồn Visit Quang Ninh. Video banner ghép tư liệu nhiều địa điểm; không gán các cảnh đó cho người lao động hay nhà cung cấp cụ thể tại Hạ Long.', 'Food and some lifestyle images are labelled as AI illustrations. The Ha Long Market 1 photograph is credited to Visit Quang Ninh. The hero film uses footage from several locations; it is not attributed to specific Ha Long workers or suppliers.') + '</p><p>' + t('Giờ, địa giới, giá, thực đơn và tình trạng có món cần xác nhận trực tiếp với địa điểm.', 'Hours, administrative names, prices, menus and availability should be confirmed directly with each place.') + '</p><a class="page-action" href="' + url('places') + '">' + t('Quay lại danh sách địa chỉ', 'Back to places') + ' <span>→</span></a></section>';
}

function notFound(ctx) {
  const { t, url } = ctx;
  return '<section class="page-about"><p class="eyebrow">404 / HẠ LONG SEAFOOD</p><h1>' + t('Trang này chưa có.', 'This page is not available.') + '</h1><p class="page-lede">' + t('Địa chỉ có thể đã thay đổi. Hãy quay lại danh sách hải sản hoặc địa điểm.', 'This address may have changed. Return to the seafood or places directory.') + '</p><div class="related-links"><a href="' + url('seafood') + '">' + t('Hải sản', 'Seafood') + ' ↗</a><a href="' + url('places') + '">' + t('Địa chỉ', 'Places') + ' ↗</a></div></section>';
}

export function pageTemplate(ctx) {
  const { route, t, language, wave, globe, saved, url } = ctx;
  let content;
  if (route.page === 'seafood') content = renderSeafood(ctx);
  else if (route.page === 'product') content = renderProduct(ctx, route.id);
  else if (route.page === 'places') content = renderPlaces(ctx);
  else if (route.page === 'place') content = renderPlace(ctx, route.id);
  else if (route.page === 'stories') content = renderStories(ctx);
  else if (route.page === 'story') content = renderStory(ctx, route.id);
  else if (route.page === 'plan') content = renderPlan(ctx);
  else if (route.page === 'about') content = renderAbout(ctx);
  else if (route.page === 'sources') content = renderSources(ctx);
  else content = notFound(ctx);
  return pageHeader({ t, language, wave, globe, url }) +
    '<main class="editorial-page" id="main">' + content + '</main>' +
    pageFooter({ t, url, saved });
}
