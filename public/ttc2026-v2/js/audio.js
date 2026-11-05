// Âm thanh tổng hợp, không tải tệp nào: hộp nhạc chơi Silent Night (bản nhạc thuộc phạm vi công cộng)
// và tiếng chuông nhỏ khi rê chuột. Mặc định tắt; chỉ bật khi người xem bấm nút.
(() => {
  // [nốt MIDI, số phách đơn]
  const MELODY = [[67,3],[69,1],[67,2],[64,6],[67,3],[69,1],[67,2],[64,6],[74,4],[74,2],[71,6],[72,4],[72,2],[67,6],
    [69,4],[69,2],[72,3],[71,1],[69,2],[67,3],[69,1],[67,2],[64,6],[69,4],[69,2],[72,3],[71,1],[69,2],[67,3],[69,1],[67,2],[64,6],
    [74,4],[74,2],[77,3],[74,1],[71,2],[72,6],[76,6],[72,2],[67,2],[64,2],[67,3],[65,1],[62,2],[60,9]];
  const BEAT = 0.3;
  let ctx, master, on = false, timer = 0, i = 0, next = 0;

  const bell = (midi, when, gain = 0.16, length = 1.8) => {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    [[1, 1], [2.76, 0.28], [5.4, 0.08]].forEach(([ratio, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f * ratio;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gain * amp, when + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, when + length / ratio);
      o.connect(g).connect(master);
      o.start(when); o.stop(when + length / ratio + 0.05);
    });
  };
  const schedule = () => {
    while (next < ctx.currentTime + 0.4) {
      const [m, d] = MELODY[i];
      bell(m + 12, next);
      next += d * BEAT;
      i = (i + 1) % MELODY.length;
      if (i === 0) next += BEAT * 6;
    }
  };

  window.Sound = {
    get on() { return on; },
    toggle() {
      if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); }
      ctx.resume();
      on = !on;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? 0.7 : 0, ctx.currentTime + 0.4);
      clearInterval(timer);
      if (on) { next = ctx.currentTime + 0.1; schedule(); timer = setInterval(schedule, 150); }
      return on;
    },
    tick() { if (on) bell(91, ctx.currentTime, 0.035, 0.5); },
  };
})();
