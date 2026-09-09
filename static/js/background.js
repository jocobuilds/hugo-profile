(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  let ctx = canvas.getContext('2d');
  const scratch = document.createElement('canvas');
  const scratchCtx = scratch.getContext('2d');
  // Largest object is a gear pair (bigR up to 55*3.5 ≈ 193, second gear
  // centered c ≈ 278 out, radius ≈ 100 → extent ≈ 380). A 760px scratch
  // (±380) covers everything and is fixed, so it never reallocates.
  const SCRATCH = 760;

  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scratch.width = SCRATCH * dpr;
    scratch.height = SCRATCH * dpr;
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
  function motionOf(type) {
    if (type === drawFish) return 'swim';
    return 'free';
  }
  function drawGear(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, rot = o.rot;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawGearShape(r);
    ctx.restore();
  }

  function drawGearPair(o, color, alpha) {
    const R = o.r, r = o.mesh.r;
    const c = R + r - GEAR_TOOTH_DEPTH;
    const sx = o.x + Math.cos(o.dir) * c;
    const sy = o.y + Math.sin(o.dir) * c;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    drawGearShape(R, o.mesh.teethL);
    ctx.restore();
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(o.mesh.phase - o.mesh.k * o.rot);
    drawGearShape(r, o.mesh.teethS);
    ctx.restore();
  }

  const GEAR_TOOTH_DEPTH = 14;
  const GEAR_TOOTH_TIP = 12;
  const GEAR_TOOTH_BASE = 24;
  const GEAR_TOOTH_GAP = GEAR_TOOTH_TIP;
  const GEAR_RING_GAP = 10;
  const GEAR_LINE = 2;

  function drawGearShape(r, teeth) {
    const pitch = GEAR_TOOTH_BASE + GEAR_TOOTH_GAP;
    teeth = teeth || Math.max(3, Math.round((2 * Math.PI * r) / pitch));
    const p = Math.PI * 2 / teeth;
    ctx.lineWidth = GEAR_LINE;
    const inner = r - GEAR_TOOTH_DEPTH;
    const tipHalf = GEAR_TOOTH_TIP / (2 * r);
    const baseHalf = GEAR_TOOTH_BASE / (2 * r);
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const c = i * p + p / 2;
      const tl = c - tipHalf, tr = c + tipHalf;
      const bl = c - baseHalf, br = c + baseHalf;
      if (i === 0) ctx.moveTo(Math.cos(bl) * inner, Math.sin(bl) * inner);
      else ctx.lineTo(Math.cos(bl) * inner, Math.sin(bl) * inner);
      ctx.lineTo(Math.cos(tl) * r, Math.sin(tl) * r);
      ctx.lineTo(Math.cos(tr) * r, Math.sin(tr) * r);
      ctx.lineTo(Math.cos(br) * inner, Math.sin(br) * inner);
    }
    ctx.closePath();
    ctx.stroke();
    const ring = Math.max(0, inner - GEAR_RING_GAP);
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, Math.min(inner * 0.3, ring * 0.75)), 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawNut(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, rot = o.rot;
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

  function drawResistor(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, rot = o.rot;
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

  function drawWave(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, phase = o.phase;
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

  function drawSpring(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, rot = o.rot;
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

  function drawCircuit(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r, rot = o.rot;
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

  function drawFish(o, color, alpha) {
    const x = o.x, y = o.y, r = o.r;
    const d = o.fdir;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(d, 1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.62, r * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    const wig = Math.sin(o.phase * 2) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(-r + wig * r, -r * 0.38);
    ctx.lineTo(-r + wig * r, r * 0.38);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.36);
    ctx.quadraticCurveTo(0, -r * 0.72, r * 0.28, -r * 0.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.38, -r * 0.08, Math.max(1.2, r * 0.055), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const drawings = [drawGear, drawGearPair, drawNut, drawResistor, drawWave, drawSpring, drawCircuit, drawFish];
  const others = drawings.filter(t => t !== drawGearPair);
  const typePool = [drawGearPair];
  for (let j = 1; j < COUNT; j++) typePool.push(others[(j - 1) % others.length]);
  for (let j = typePool.length - 1; j > 0; j--) {
    const p = Math.floor(Math.random() * (j + 1));
    [typePool[j], typePool[p]] = [typePool[p], typePool[j]];
  }
  const hueVars = ['--bg-obj-1', '--bg-obj-2', '--bg-obj-3', '--bg-obj-4', '--bg-obj-5', '--bg-obj-6'];

  function currentColor(varName) {
    return cssColor(varName, '#29b6f6');
  }

  for (let i = 0; i < COUNT; i++) {
    const type = typePool[i];
    const pair = type === drawGearPair;
    const bigR = rand(28, 55) * (pair ? 3.5 : 1);
    const dir = pair ? rand(0, Math.PI * 2) : 0;
    let mesh;
    if (pair) {
      const k = pick([2, 3]);
      const teethL0 = Math.max(3, Math.round((2 * Math.PI * bigR) / (GEAR_TOOTH_BASE + GEAR_TOOTH_GAP)));
      const teethL = k * Math.max(1, Math.round(teethL0 / k));
      const teethS = teethL / k;
      mesh = {
        r: GEAR_TOOTH_DEPTH / 2 + (bigR - GEAR_TOOTH_DEPTH / 2) / k,
        k,
        teethL,
        teethS,
        phase: dir + Math.PI - (Math.PI - dir * teethL) / teethS
      };
    }
    const motion = motionOf(type);
    objects.push({
      type,
      hue: hueVars[i % hueVars.length],
      dir,
      ...(pair ? { mesh } : {}),
      motion,
      m: pair ? bigR * 3 : 80,
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r: bigR,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.02, 0.02),
      fdir: Math.random() < 0.5 ? -1 : 1,
      vx: motion === 'swim' ? (Math.random() < 0.5 ? -1 : 1) * rand(0.4, 0.9) : (motion === 'free' ? rand(-0.8, 0.8) : 0),
      vy: motion === 'free' ? rand(-0.5, 0.5) : 0,
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
        o.phase += 0.08;
        if (o.motion === 'swim') {
          o.x += o.vx;
          o.fdir = o.vx >= 0 ? 1 : -1;
          o.y += Math.sin(o.phase * 0.9) * 0.35;
          if (o.x < -o.m) o.x = W + o.m;
          if (o.x > W + o.m) o.x = -o.m;
          const yMin = H * 0.05, yMax = H * 0.9;
          if (o.y < yMin) o.y = H * 0.5;
          if (o.y > yMax) o.y = H * 0.3;
        } else {
          o.x += o.vx;
          o.y += o.vy;
          o.rot += o.vr;
          if (o.x < -o.m) o.x = W + o.m;
          if (o.x > W + o.m) o.x = -o.m;
          if (o.y < -o.m) o.y = H + o.m;
          if (o.y > H + o.m) o.y = -o.m;
        }
        const alpha = baseAlpha + 0.08 * Math.sin(o.phase * o.tw);
        const color = currentColor(o.hue);
        scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        scratchCtx.clearRect(0, 0, SCRATCH, SCRATCH);
        scratchCtx.translate(SCRATCH / 2 - o.x, SCRATCH / 2 - o.y);
        const prev = ctx;
        ctx = scratchCtx;
        o.type(o, color, 1);
        ctx = prev;
        ctx.globalAlpha = alpha;
        ctx.drawImage(scratch, o.x - SCRATCH / 2, o.y - SCRATCH / 2, SCRATCH, SCRATCH);
        ctx.globalAlpha = 1;
      }
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();
