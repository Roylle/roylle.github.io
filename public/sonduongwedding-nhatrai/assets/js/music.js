(() => {
  const audio = document.querySelector('#wedding-music');
  const toggle = document.querySelector('#music-toggle');
  const label = document.querySelector('#music-label');
  let resumeOnTouch = true;
  audio.volume = 0.55;

  function updateLabel() {
    label.textContent = audio.paused ? 'Bật nhạc' : 'Tắt nhạc';
    toggle.setAttribute('aria-label', `${label.textContent} Lễ Đường của Kai Đinh`);
  }
  function play() {
    audio.play().catch(updateLabel);
  }
  audio.addEventListener('playing', () => {
    resumeOnTouch = false;
    updateLabel();
  });
  audio.addEventListener('pause', updateLabel);
  toggle.addEventListener('click', () => {
    resumeOnTouch = false;
    if (audio.paused) play();
    else audio.pause();
  });
  document.addEventListener('click', (event) => {
    if (resumeOnTouch && !toggle.contains(event.target)) play();
  });
  updateLabel();
  play();
})();
