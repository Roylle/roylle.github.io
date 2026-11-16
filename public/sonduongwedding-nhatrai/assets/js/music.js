(() => {
  const audio = document.querySelector('#wedding-music');
  const toggle = document.querySelector('#music-toggle');
  const label = document.querySelector('#music-label');
  let automaticPlayback = true;
  audio.volume = 0.55;

  function updateLabel() {
    label.textContent = audio.paused ? 'Bật nhạc' : 'Tắt nhạc';
    toggle.setAttribute('aria-label', `${label.textContent} Lễ Đường của Kai Đinh`);
  }

  function play() {
    audio.play().catch(updateLabel);
  }

  function tryAutomaticPlayback() {
    if (automaticPlayback && audio.paused) play();
  }

  function playOnInteraction(event) {
    if (!toggle.contains(event.target)) tryAutomaticPlayback();
  }

  audio.addEventListener('playing', updateLabel);
  audio.addEventListener('pause', updateLabel);
  audio.addEventListener('canplay', tryAutomaticPlayback);
  window.addEventListener('pageshow', tryAutomaticPlayback);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryAutomaticPlayback();
  });

  // Touch and keyboard gestures also unlock sound on mobile browsers.
  document.addEventListener('touchstart', playOnInteraction, { passive: true });
  document.addEventListener('pointerdown', playOnInteraction);
  document.addEventListener('keydown', playOnInteraction);
  document.addEventListener('click', playOnInteraction);

  toggle.addEventListener('click', () => {
    automaticPlayback = false;
    if (audio.paused) play();
    else audio.pause();
  });

  updateLabel();
  tryAutomaticPlayback();
})();
