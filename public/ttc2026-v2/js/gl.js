// Lớp WebGL phủ toàn màn hình: tuyết rơi và màn chuyển cảnh bằng lưới ngôi sao bốn cánh.
// Chỉ vẽ khi có gì để vẽ; không có WebGL thì GL.ok = false và trang vẫn chạy đủ nội dung.
(() => {
  const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime, uWipe, uSnow, uCell; uniform vec3 uColor;
float flake(vec2 uv, float scale, float speed, float seed){
  uv *= scale; uv.y += uTime * speed; uv.x += sin(uv.y * .7 + uTime * .3 + seed) * .25;
  vec2 g = fract(uv) - .5, id = floor(uv);
  float h = fract(sin(dot(id + seed, vec2(127.1, 311.7))) * 43758.5453);
  vec2 o = vec2(fract(h * 7.) - .5, fract(h * 13.) - .5) * .6;
  float r = .025 + h * .05;
  return smoothstep(r, r * .35, length(g - o)) * step(.4, h);
}
void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 cellUv = px / uCell;
  vec2 f = fract(cellUv) - .5;
  vec2 ctr = (floor(cellUv) + .5) * uCell - uRes * .5;
  float d = length(ctr) / length(uRes * .5);
  float q = clamp(uWipe * 1.7 - d * .7, 0., 1.);
  vec2 a = sqrt(abs(f));
  float k = q * q * 1.6;
  float m = q <= 0. ? 0. : smoothstep(k + .03, k - .03, a.x + a.y);
  vec2 uv = px / uRes.y;
  float s = 0.;
  if (uSnow > .001) {
    s = flake(uv, 7., .32, 1.) * .9 + flake(uv, 13., .24, 4.) * .6 + flake(uv, 24., .16, 9.) * .35;
    s *= uSnow;
  }
  vec3 col = mix(vec3(1.), uColor, m);
  float alpha = max(m, s * .85);
  gl_FragColor = vec4(col * alpha, alpha);
}`;
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  const GL = { ok: false, u: { wipe: 0, snow: 0 }, color: [1, 1, 1], setColor(hex) { const n = parseInt(hex.slice(1), 16); GL.color = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; } };
  window.GL = GL;

  const canvas = document.getElementById('gl');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.bindAttribLocation(prog, 0, 'p');
  gl.vertexAttribPointer(gl.getAttribLocation(prog, 'p'), 2, gl.FLOAT, false, 0, 0);
  const loc = {}; ['uRes', 'uTime', 'uWipe', 'uSnow', 'uCell', 'uColor'].forEach((n) => { loc[n] = gl.getUniformLocation(prog, n); });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 768 ? 1 : 1.5);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform1f(loc.uCell, Math.max(canvas.width, canvas.height) / (innerWidth < 768 ? 9 : 14));
  };
  addEventListener('resize', resize); resize();

  let drawn = false;
  const frame = (t) => {
    requestAnimationFrame(frame);
    const { wipe, snow } = GL.u;
    if (wipe <= 0.001 && snow <= 0.001) { if (drawn) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); drawn = false; } return; }
    gl.uniform1f(loc.uTime, t / 1000); gl.uniform1f(loc.uWipe, wipe); gl.uniform1f(loc.uSnow, snow);
    gl.uniform3fv(loc.uColor, GL.color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    drawn = true;
  };
  requestAnimationFrame(frame);
  GL.ok = true;
})();
