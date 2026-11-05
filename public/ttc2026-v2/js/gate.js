// Màn mật khẩu: trang chỉ khởi động sau khi nhập đúng. Đây là lớp chặn trên trình duyệt, không phải bảo mật phía máy chủ.
(() => {
  const HASH = '9744885d4a09b11f9690e7eee8112cca6dba5c57c3d781aa93bef3f8db2fa955';
  const KEY = 'ttc2026-v2-unlocked';
  const APP = ['vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js', 'vendor/SplitText.min.js', 'vendor/lenis.min.js', 'stage.js', 'gl.js', 'audio.js', 'main.js'];
  const gate = document.getElementById('gate');

  const start = () => {
    document.documentElement.classList.add('unlocked');
    gate.remove();
    APP.forEach((f) => { const s = document.createElement('script'); s.src = 'js/' + f; s.async = false; document.body.append(s); });
  };
  const remembered = () => { try { return localStorage.getItem(KEY) === HASH; } catch { return false; } };
  const remember = () => { try { localStorage.setItem(KEY, HASH); } catch {} };
  if (remembered()) { start(); return; }

  const form = document.getElementById('gateForm'), input = document.getElementById('gateInput'), error = document.getElementById('gateError');
  const sha256 = async (text) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  form.hidden = false;
  input.focus();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ((await sha256('ttc2026-v2:' + input.value)) === HASH) { remember(); start(); return; }
    error.textContent = 'Mật khẩu chưa đúng. Anh chị thử lại nhé.';
    input.select();
  });
})();
