(() => {
  const links = [...document.querySelectorAll('.album-photo')];
  const dialog = document.querySelector('#lightbox');
  const image = document.querySelector('#lightbox-image');
  const count = document.querySelector('#photo-count');
  let index = 0;
  const show = (n) => {
    index = (n + links.length) % links.length;
    image.src = links[index].href;
    count.textContent = `${index + 1} / ${links.length}`;
  };
  const close = () => dialog.close();
  links.forEach((link, n) => link.addEventListener('click', (event) => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault(); show(n); dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector('.close').focus();
  }));
  dialog.querySelector('.close').addEventListener('click', close);
  dialog.querySelector('.previous').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.next').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; links[index].focus({preventScroll:true}); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
  });
})();
