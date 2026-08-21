(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function cssColor(varName, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  }

  const COUNT = window.innerWidth < 768 ? 8 : 14;
  const objects = [];

  function drawGear(x, y, r, rot, color, alpha) {
    const teeth = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.06);
    const inner = r * 0.78;
    ctx.beginPath();
    ctx.moveTo(Math.cos(0) * r, Math.sin(0) * r);
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = ((i + 0.35) / teeth) * Math.PI * 2;
      const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.85) / teeth) * Math.PI * 2;
      ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * inner, Math.sin(a2) * inner);
      ctx.lineTo(Math.cos(a3) * inner, Math.sin(a3) * inner);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawNut(x, y, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawResistor(x, y, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(-r * 0.64, 0);
    let px = -r * 0.64;
    for (let i = 0; i < 8; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      ctx.lineTo(px + r * 0.05, dir * r * 0.28);
      ctx.lineTo(px + r * 0.16, 0);
      px += r * 0.16;
    }
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawWave(x, y, r, rot, color, alpha, phase) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = x - r + t * 2 * r;
      const py = y + Math.sin(t * Math.PI * 4 + phase) * r * 0.35;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSpring(x, y, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    const coils = 4;
    for (let i = 0; i <= coils * 12; i++) {
      const t = i / (coils * 12);
      const px = x - r * 0.6 + t * r * 1.2;
      const py = y + Math.cos(t * coils * Math.PI * 2) * r * 0.4;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCircuit(x, y, r, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(-r * 0.4, 0);
    ctx.lineTo(-r * 0.1, -r * 0.45);
    ctx.lineTo(r * 0.2, -r * 0.45);
    ctx.lineTo(r * 0.5, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    function node(nx, ny) {
      ctx.beginPath();
      ctx.arc(nx, ny, r * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    node(-r, 0);
    node(r * 0.2, -r * 0.45);
    node(r, 0);
    ctx.restore();
  }

  const drawings = [drawGear, drawNut, drawResistor, drawWave, drawSpring, drawCircuit];
  const hueVars = ['--bg-obj-1', '--bg-obj-2', '--bg-obj-3', '--bg-obj-4', '--bg-obj-5', '--bg-obj-6'];

  function currentColor(varName) {
    return cssColor(varName, '#29b6f6');
  }

  for (let i = 0; i < COUNT; i++) {
    objects.push({
      type: drawings[i % drawings.length],
      hue: hueVars[i % hueVars.length],
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r: rand(18, 55),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.02, 0.02),
      vx: rand(-0.8, 0.8),
      vy: rand(-0.5, 0.5),
      phase: rand(0, Math.PI * 2),
      tw: rand(0.5, 1.5)
    });
  }

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(tick);
  });

  let last = 0;
  function tick(t) {
    if (!running) return;
    if (t - last > 1000 / 60) {
      last = t;
      ctx.clearRect(0, 0, W, H);
      const dark = document.body.classList.contains('dark');
      const baseAlpha = dark ? 0.22 : 0.20;
      for (const o of objects) {
        o.x += o.vx;
        o.y += o.vy;
        o.rot += o.vr;
        o.phase += 0.08;
        if (o.x < -80) o.x = W + 80;
        if (o.x > W + 80) o.x = -80;
        if (o.y < -80) o.y = H + 80;
        if (o.y > H + 80) o.y = -80;
        const alpha = baseAlpha + 0.08 * Math.sin(o.phase * o.tw);
        const color = currentColor(o.hue);
        o.type(o.x, o.y, o.r, o.rot, color, alpha, o.phase);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();
