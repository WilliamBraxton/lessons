// Scenes for "Differential equations, step by step".
// Each scene is a pure function of time: (ctx, s, H, C) => void, drawn on a 1280×720 board.

// ---- shared pieces ----
function massSpring(ctx, H, C, o) {
  const cx = o.cx, top = o.ceil, rest = o.rest, u = o.u || 0, a = o.alpha ?? 1, hl = o.hl || {};
  const mw = 150, mh = 90, my = rest + u, sx = cx - 42, dx = cx + 42;
  H.hatch(ctx, cx - 120, top, 240, { alpha: a });
  H.spring(ctx, sx, top, my, { coils: 7, amp: 15, color: hl.spring > .3 ? C.amber : C.dim, width: 3, alpha: a, glow: hl.spring > .3 ? C.amber : null });
  H.damper(ctx, dx, top, my, { w: 30, color: hl.damper > .3 ? C.amber : C.dim, alpha: a, glow: hl.damper > .3 ? C.amber : null });
  H.rect(ctx, cx - mw / 2, my, mw, mh, { fill: hl.mass > .3 ? '#3a3220' : C.panel, stroke: hl.mass > .3 ? C.amber : C.ink, width: 2.5, r: 10, alpha: a, glow: hl.mass > .3 ? C.amber : null });
  H.text(ctx, 'm', cx, my + mh / 2, { size: 40, kind: 'math', align: 'center', color: hl.mass > .3 ? C.amber : C.ink, alpha: a });
  if (o.force) {
    const L = 34 + 60 * Math.abs(o.force), y0 = my + mh + 14;
    H.arrow(ctx, cx, y0 + L, cx, y0, { color: C.coral, width: 5, head: 18, alpha: a * (o.forceAlpha ?? 1) });
    H.text(ctx, 'F(t)', cx + 22, y0 + L - 8, { size: 26, kind: 'math', color: C.coral, alpha: a * (o.forceAlpha ?? 1) });
  }
  return { mx: cx, my, mw, mh };
}
const damped = (t, A = 1, z = .12, w = 2.2) => A * Math.exp(-z * t) * Math.cos(w * t);
function erfc(x) { const t = 1 / (1 + .5 * Math.abs(x)); const r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (.37409196 + t * (.09678418 + t * (-.18628806 + t * (.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-.82215223 + t * .17087277))))))))); return x >= 0 ? r : 2 - r; }
function heat(u) { // 0..1 → cold blue to hot coral/amber
  const c0 = [70, 120, 200], c1 = [255, 138, 101], c2 = [255, 214, 120];
  const m = u < .6 ? c0.map((v, i) => v + (c1[i] - v) * u / .6) : c1.map((v, i) => v + (c2[i] - v) * (u - .6) / .4);
  return `rgb(${m.map(Math.round).join(',')})`;
}

// ---- 1. title ----
SCENES.title = (ctx, s, H, C) => {
  const p = H.easeOut(s.t / 3.2);
  const b = { x: 120, y: 470, w: 1040, h: 150, t0: 0, t1: 16, ymin: -1.15, ymax: 1.15 };
  H.plot(ctx, t => damped(t, 1, .14, 2.1), b, { color: C.teal, width: 4, upto: p, alpha: .9 });
  const tip = H.map(b, b.t0 + (b.t1 - b.t0) * p, damped(16 * p, 1, .14, 2.1));
  if (p < 1) H.circle(ctx, tip[0], tip[1], 7, { fill: C.amber, glow: C.amber });
  H.text(ctx, 'Differential equations', 640, 250, { size: 76, kind: 'serif', weight: 600, align: 'center', alpha: H.easeOut(s.t / .8) });
  const u = s.on('de', 1.2);
  H.line(ctx, [[640 - 380, 300], [640 - 380 + 760 * u, 300]], { color: C.amber, width: 4 });
  H.text(ctx, 'step by step', 640, 360, { size: 30, color: C.dim, align: 'center', alpha: H.easeOut((s.t - .6) / .8) });
};

// ---- 2. what a DE is: x = 5 → a rule → a whole journey ----
SCENES.car = (ctx, s, H, C) => {
  const A = 1 - s.on('car', .7);
  if (A > 0) {
    const e = s.on('eq'), c = s.on('changes');
    H.text(ctx, 'x = 5', 640, 300 - 50 * c, { size: 96, kind: 'math', align: 'center', alpha: A * e * (1 - .55 * c) });
    H.text(ctx, 'tells you what it is', 640, 380 - 50 * c, { size: 24, color: C.dim, align: 'center', alpha: A * e * (1 - c) });
    if (c > 0) {
      H.rich(ctx, [{ t: 'dx', kind: 'math' }, { t: ' / ', kind: 'serif', color: C.dim }, { t: 'dt', kind: 'math' }, { t: '  =  ?', kind: 'serif', color: C.amber }], 640, 420, { size: 80, alpha: A });
      H.text(ctx, 'tells you how it changes', 640, 500, { size: 24, color: C.amber, align: 'center', alpha: A * c });
    }
    return;
  }
  // road + car
  const a = s.on('car', .7), tj = s.since('journey'), road = 210;
  const pos = q => 1 - Math.exp(-.35 * q) * (1 + .35 * q); // smooth start, eases to a stop
  const xr = H.clamp(pos(tj)), cx = 150 + 900 * xr;
  H.line(ctx, [[110, road + 34], [1170, road + 34]], { color: C.dim, width: 3, alpha: a });
  for (let x = 130; x < 1170; x += 60) H.line(ctx, [[x, road + 56], [x + 28, road + 56]], { color: C.faint, width: 3, alpha: a });
  H.rect(ctx, cx - 50, road - 14, 100, 34, { fill: C.coral, r: 9, alpha: a });
  H.rect(ctx, cx - 28, road - 36, 56, 26, { fill: '#c76b4f', r: 7, alpha: a });
  H.circle(ctx, cx - 28, road + 22, 11, { fill: C.ink, alpha: a }); H.circle(ctx, cx + 28, road + 22, 11, { fill: C.ink, alpha: a });
  const r = s.on('rule');
  if (r > 0) {
    const v = Math.max(.25, .35 * .35 * tj * Math.exp(-.35 * tj) * 6);
    H.arrow(ctx, cx + 56, road - 2, cx + 56 + 90 * v * r, road - 2, { color: C.amber, width: 4, head: 14 });
    H.text(ctx, 'a rule:  dx/dt = f(x, t)', 640, 112, { size: 30, kind: 'serif', align: 'center', color: C.amber, alpha: r });
  }
  // the journey drawn as a graph of x(t)
  const j = s.on('journey', .5);
  if (j > 0) {
    const b = { x: 160, y: 380, w: 900, h: 250, t0: 0, t1: 12, ymin: 0, ymax: 1.05 };
    H.axes(ctx, b, { xlabel: 't', ylabel: 'x', alpha: j });
    const f = s.on('function', .8);
    H.plot(ctx, pos, b, { upto: Math.min(1, tj / 12), color: f > .5 ? C.amber : C.teal, width: 3 + 2 * f, glow: f > .5 ? C.amber : null });
    if (f > 0) H.text(ctx, 'x(t)  —  the whole story', 1040, 410, { size: 28, kind: 'serif', color: C.amber, align: 'right', alpha: f });
  }
};

// ---- 3. meet the characters ----
SCENES.spring = (ctx, s, H, C) => {
  const terms = ['inertia', 'damper', 'springk', 'force'];
  const hl = terms.map(n => (s.has(n) && !terms.some(m => m !== n && s.cue(m) >= 0 && s.cue(m) < s.cue(n)) ? s.on(n, .4) : 0));
  const parts = [
    { t: 'm·y″', alpha: s.on('e1', .4), hl: hl[0] },
    { t: ' + c·y′', alpha: s.on('e2', .4), hl: hl[1] },
    { t: ' + k·y', alpha: s.on('e3', .4), hl: hl[2] },
    { t: ' = F(t)', alpha: s.on('e4', .4), hl: hl[3] },
  ];
  H.rich(ctx, parts, 640, 110, { size: 56 });
  const sys = s.on('system', .8);
  if (sys <= 0) return;
  const ts = s.since('system'), u = 60 * damped(ts, 1, .05, 2.0), du = 60 * (-.05 * damped(ts, 1, .05, 2.0) - 2.0 * Math.exp(-.05 * ts) * Math.sin(2.0 * ts));
  const acc = -4 * u - .1 * du;
  const fa = s.on('force', .5);
  const g = massSpring(ctx, H, C, { cx: 420, ceil: 190, rest: 380, u, alpha: sys, hl: { mass: hl[0], damper: hl[1], spring: hl[2] },
    force: fa > 0 ? .5 + .5 * Math.sin(ts * 2.0) : 0, forceAlpha: fa });
  const yc = g.my + g.mh / 2;
  // y ruler
  const pz = s.on('pos', .5);
  if (pz > 0) {
    H.line(ctx, [[250, 300], [250, 600]], { color: C.dim, width: 2, alpha: pz });
    H.line(ctx, [[238, 425], [262, 425]], { color: C.dim, width: 2, alpha: pz });
    H.text(ctx, '0', 226, 425, { size: 18, color: C.dim, align: 'right', alpha: pz });
    H.line(ctx, [[250, yc], [g.mx - g.mw / 2 - 6, yc]], { color: C.teal, width: 2, dash: [5, 6], alpha: pz });
    H.circle(ctx, 250, yc, 7, { fill: C.teal, alpha: pz });
    H.text(ctx, 'y', 226, yc, { size: 32, kind: 'math', color: C.teal, align: 'right', alpha: pz });
  }
  const vz = s.on('vel', .5), az = s.on('acc', .5);
  if (vz > 0) { H.arrow(ctx, 590, yc, 590, yc + du * .9, { color: C.blue, width: 4, alpha: vz }); H.text(ctx, 'y′', 610, yc - 4, { size: 30, kind: 'math', color: C.blue, alpha: vz }); }
  if (az > 0) { H.arrow(ctx, 665, yc, 665, yc + acc * .35, { color: C.purple, width: 4, alpha: az }); H.text(ctx, 'y″', 685, yc - 4, { size: 30, kind: 'math', color: C.purple, alpha: az }); }
  // legend of personalities
  const rows = [['inertia', 'm·y″', 'inertia — resists change'], ['damper', 'c·y′', 'shock absorber — drag'], ['springk', 'k·y', 'spring — pulls home'], ['force', 'F(t)', 'outside push']];
  rows.forEach(([n, sym, label], i) => {
    const a = s.on(n, .5); if (a <= 0) return; const y = 260 + i * 78, on = hl[i] > .3;
    H.text(ctx, sym, 790, y, { size: 30, kind: 'math', color: on ? C.amber : C.ink, alpha: a });
    H.text(ctx, label, 900, y, { size: 22, color: on ? C.ink : C.dim, alpha: a });
  });
  const nw = s.on('newton', .6);
  if (nw > 0) { H.rect(ctx, 780, 590, 420, 64, { fill: C.panel, stroke: C.amber, r: 12, alpha: nw });
    H.text(ctx, 'Newton:  F = m·a', 990, 623, { size: 30, kind: 'serif', align: 'center', color: C.amber, alpha: nw }); }
};

// ---- 4. order ----
SCENES.order = (ctx, s, H, C) => {
  const ypp = s.on('ypp', .4);
  H.rich(ctx, [{ t: 'm·' }, { t: 'y″', hl: ypp }, { t: ' + c·y′ + k·y = F(t)' }], 640, 120, { size: 52 });
  const steps = [['y', 'position', C.teal], ['y′', 'velocity', C.blue], ['y″', 'acceleration', C.purple]];
  const hi = s.on('highest', .5);
  steps.forEach(([sym, lab, col], i) => {
    const a = H.easeOut((s.t - .3 - i * .35) / .6), x = 140 + i * 150, y = 560 - i * 110, top = i === 2 && hi > 0;
    H.rect(ctx, x, y, 140, 90, { fill: C.panel, stroke: top ? C.amber : col, width: top ? 3.5 : 2, r: 10, alpha: a, glow: top ? C.amber : null });
    H.text(ctx, sym, x + 70, y + 38, { size: 40, kind: 'math', color: top ? C.amber : col, align: 'center', alpha: a });
    H.text(ctx, lab, x + 70, y + 74, { size: 17, color: C.dim, align: 'center', alpha: a });
  });
  if (hi > 0) H.text(ctx, '← highest derivative', 600, 375, { size: 24, color: C.amber, alpha: hi });
  const sec = s.on('second', .5);
  if (sec > 0) {
    const k = H.pop(s.cue('second') / .5);
    H.circle(ctx, 960, 300, 92 * k, { fill: C.panel, stroke: C.amber, width: 3, alpha: sec });
    H.text(ctx, 'order', 960, 262, { size: 22, color: C.dim, align: 'center', alpha: sec });
    H.text(ctx, '2', 960, 318, { size: 84, kind: 'serif', weight: 600, color: C.amber, align: 'center', alpha: sec });
  }
  const tw = s.on('two', .5), inf = s.on('info', .5);
  if (inf > 0) H.text(ctx, 'facts needed to predict the future', 960, 455, { size: 22, color: C.dim, align: 'center', alpha: inf });
  if (tw > 0) [0, 1].forEach(i => {
    const a = H.easeOut((s.cue('two') - i * .3) / .5);
    H.rect(ctx, 790 + i * 180, 490, 160, 80, { fill: C.panel, stroke: C.teal, r: 10, alpha: a });
    H.text(ctx, `fact ${i + 1}`, 870 + i * 180, 530, { size: 26, kind: 'serif', color: C.teal, align: 'center', alpha: a });
  });
};

// ---- 5. initial conditions ----
SCENES.initial = (ctx, s, H, C) => {
  const w = s.on('where', .5), sp = s.on('speed', .5);
  const g = massSpring(ctx, H, C, { cx: 230, ceil: 150, rest: 300, u: 70, alpha: H.easeOut(s.t / .6) });
  const yc = g.my + g.mh / 2;
  if (w > 0) { H.line(ctx, [[g.mx + 85, 345], [g.mx + 85, yc]], { color: C.teal, width: 2, dash: [4, 5], alpha: w });
    H.text(ctx, 'y(0) = 5 cm', 330, yc - 30, { size: 26, kind: 'math', color: C.teal, alpha: w }); }
  if (sp > 0) { H.arrow(ctx, g.mx, yc + 60, g.mx, yc + 140, { color: C.blue, width: 4, alpha: sp });
    H.text(ctx, 'y′(0) = ?', 260, yc + 112, { size: 26, kind: 'math', color: C.blue, alpha: sp }); }
  const b = { x: 560, y: 160, w: 620, h: 420, t0: 0, t1: 8, ymin: -2.2, ymax: 2.2 };
  const fv = s.on('five', .6);
  if (fv <= 0) return;
  H.axes(ctx, b, { xlabel: 't', ylabel: 'y', alpha: fv });
  const fut = v0 => t => Math.exp(-.12 * t) * (1 * Math.cos(1.6 * t) + (v0 + .12) / 1.6 * Math.sin(1.6 * t));
  const v0s = [-2.4, -1.2, 0, 1.2, 2.4], st = s.on('still', .5), mv = s.on('moving', .5), lk = s.on('locked', .6);
  v0s.forEach(v0 => {
    let col = C.dim, a = .55, wd = 2;
    if (v0 === 0 && st > 0) { col = C.teal; a = .55 + .45 * st; wd = 3; }
    if (v0 === 1.2 && mv > 0) { col = C.coral; a = .55 + .45 * mv; wd = 3; }
    if (lk > 0 && v0 !== 0) a *= 1 - .85 * lk;
    if (v0 === 0 && lk > 0) { col = C.amber; wd = 3 + 2 * lk; }
    H.plot(ctx, fut(v0), b, { color: col, width: wd, alpha: fv * a, upto: Math.min(1, s.cue('five') / 1.5) });
  });
  H.circle(ctx, b.x, H.map(b, 0, 1)[1], 8, { fill: C.teal, alpha: fv });
  if (st > 0 && lk === 0) H.text(ctx, 'sitting still', 1180, 560, { size: 22, color: C.teal, align: 'right', alpha: st * (1 - mv) });
  if (mv > 0 && lk === 0) H.text(ctx, 'already moving', 1180, 560, { size: 22, color: C.coral, align: 'right', alpha: mv });
  if (lk > 0) H.text(ctx, 'both known  →  one future', 1180, 610, { size: 26, kind: 'serif', color: C.amber, align: 'right', alpha: lk });
};

// ---- 6. linear vs nonlinear ----
SCENES.linear = (ctx, s, H, C) => {
  const A = 1 - s.on('pendulum', .6);
  if (A > 0) {
    const l = s.on('linear', .5);
    H.text(ctx, 'linear', 340, 160, { size: 30, kind: 'serif', weight: 600, color: C.green, align: 'center', alpha: A * l });
    H.rect(ctx, 110, 200, 460, 120, { fill: C.panel, stroke: C.green, r: 12, alpha: A * l });
    H.text(ctx, 'a·y″ + b·y′ + c·y', 340, 260, { size: 40, kind: 'math', align: 'center', alpha: A * l });
    H.text(ctx, 'not allowed', 920, 160, { size: 30, kind: 'serif', weight: 600, color: C.red, align: 'center', alpha: A * s.on('squared', .5) });
    [['squared', 'y²'], ['multiplied', 'y · y′'], ['sine', 'sin y']].forEach(([n, t], i) => {
      const a = s.on(n, .4); if (a <= 0) return; const y = 230 + i * 90;
      H.text(ctx, t, 920, y, { size: 44, kind: 'math', align: 'center', alpha: A * a });
      const w = H.measure(ctx, t, 44, 'math') + 30, k = H.easeOut((s.cue(n) - .25) / .35);
      H.line(ctx, [[920 - w / 2, y + 4], [920 - w / 2 + w * k, y + 4]], { color: C.red, width: 4, alpha: A });
    });
    const r = s.on('recipes', .5);
    if (r > 0) ['characteristic equation', 'superposition', 'Laplace transform'].forEach((t, i) =>
      H.chip(ctx, t, 340, 400 + i * 62, { align: 'center', color: C.green, alpha: A * H.easeOut((s.cue('recipes') - i * .25) / .5) }));
    return;
  }
  // pendulum + sin θ vs θ
  const a = s.on('pendulum', .6), tp = s.since('pendulum'), sm = s.on('small', .8);
  const amp = H.lerp(1.15, .3, sm), th = amp * Math.cos(2.1 * tp), px = 300, py = 190, L = 300;
  H.hatch(ctx, px - 80, py, 160, { alpha: a });
  const bx = px + L * Math.sin(th), by = py + L * Math.cos(th);
  H.line(ctx, [[px, py], [px, py + L + 30]], { color: C.faint, width: 2, dash: [6, 8], alpha: a });
  H.line(ctx, [[px, py], [bx, by]], { color: C.ink, width: 3, alpha: a });
  H.circle(ctx, bx, by, 26, { fill: C.coral, alpha: a });
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.beginPath();
  ctx.arc(px, py, 80, Math.PI / 2 - Math.max(th, 0), Math.PI / 2 - Math.min(th, 0)); ctx.stroke(); ctx.restore();
  H.text(ctx, 'θ', px + (th > 0 ? 34 : -46), py + 110, { size: 30, kind: 'math', color: C.amber, alpha: a });
  const fr = s.on('friendly', .7), sth = s.on('sintheta', .4);
  H.rich(ctx, [{ t: 'θ″ + (g/L)·' }, { t: 'sin θ', hl: sth * (1 - fr), alpha: 1 - fr }, { t: ' = 0' }], 300, 600, { size: 34, alpha: a });
  if (fr > 0) H.rich(ctx, [{ t: 'θ″ + (g/L)·' }, { t: 'θ', color: C.teal }, { t: ' = 0' }], 300, 660, { size: 34, alpha: fr });
  if (fr > 0) H.text(ctx, 'linear ✓', 520, 660, { size: 24, color: C.green, alpha: fr });
  const b = { x: 690, y: 200, w: 500, h: 340, t0: -Math.PI, t1: Math.PI, ymin: -2.2, ymax: 2.2 };
  const g = s.on('sintheta', .6);
  if (g > 0) {
    if (sm > 0) { const [x0] = H.map(b, -.5, 0), [x1] = H.map(b, .5, 0); H.rect(ctx, x0, b.y, x1 - x0, b.h, { fill: C.amber, r: 4, alpha: .13 * sm }); }
    H.axes(ctx, { ...b, x: b.x + b.w / 2 - b.w / 2 }, { grid: false, alpha: g });
    H.line(ctx, [[b.x + b.w / 2, b.y], [b.x + b.w / 2, b.y + b.h]], { color: C.dim, width: 1.5, alpha: g });
    H.plot(ctx, t => t, b, { color: C.teal, width: 3, alpha: g });
    H.plot(ctx, Math.sin, b, { color: C.coral, width: 3, alpha: g });
    H.text(ctx, 'θ', 1150, 250, { size: 26, kind: 'math', color: C.teal, alpha: g });
    H.text(ctx, 'sin θ', 1150, 330, { size: 26, kind: 'math', color: C.coral, alpha: g });
    if (sm > 0) H.text(ctx, 'small swings: nearly the same', 940, 590, { size: 22, color: C.amber, align: 'center', alpha: sm });
  }
};

// ---- 7. homogeneous vs forced ----
SCENES.forcing = (ctx, s, H, C) => {
  const tn = s.step.cues.notzero - s.step.start, end = s.speech + 1;
  const y = t => 1 * Math.exp(-.28 * t) * Math.cos(2.4 * t) + (t > tn ? .55 * (1 - Math.exp(-1.2 * (t - tn))) * Math.sin(1.7 * (t - tn)) : 0);
  const F = t => (t > tn ? Math.sin(1.7 * (t - tn)) : 0);
  const fz = s.on('notzero', .5), tt = s.t;
  massSpring(ctx, H, C, { cx: 230, ceil: 170, rest: 330, u: 70 * y(tt), alpha: H.easeOut(tt / .6), force: fz > 0 ? .4 + .6 * Math.max(0, F(tt)) : 0, forceAlpha: fz });
  const b = { x: 500, y: 200, w: 690, h: 340, t0: 0, t1: end, ymin: -1.3, ymax: 1.3 };
  H.axes(ctx, b, { xlabel: 't', ylabel: 'y' });
  H.plot(ctx, t => (t < tn ? y(t) : NaN), b, { color: C.teal, width: 3, upto: Math.min(tn, tt) / end, samples: 500 });
  if (tt > tn) H.plot(ctx, y, b, { color: C.coral, width: 3, upto: tt / end, samples: 500 });
  const [nx] = H.map(b, tn, 0);
  if (fz > 0) H.line(ctx, [[nx, b.y - 10], [nx, b.y + b.h]], { color: C.coral, width: 1.5, dash: [5, 6], alpha: fz });
  const ho = s.on('homog', .5), nh = s.on('nonhomog', .5);
  if (ho > 0) H.chip(ctx, 'F(t) = 0   homogeneous', b.x + 10, 625, { color: C.teal, kind: 'sans', size: 22, alpha: ho * (1 - .6 * fz) });
  if (nh > 0) H.chip(ctx, 'F(t) ≠ 0   nonhomogeneous', b.x + 360, 625, { color: C.coral, size: 22, alpha: nh });
  if (s.on('bounce') > 0 && fz === 0) H.text(ctx, 'settling down on its own', b.x + b.w, 170, { size: 22, color: C.teal, align: 'right', alpha: s.on('bounce') });
  if (s.on('swing') > 0) H.text(ctx, 'kept going by the push', b.x + b.w, 170, { size: 22, color: C.coral, align: 'right', alpha: s.on('swing') });
};

// ---- 8. ODE vs PDE ----
SCENES.pde = (ctx, s, H, C) => {
  const tm = s.on('time', .5), od = s.on('ode', .5);
  H.text(ctx, 'y(t)', 320, 170, { size: 56, kind: 'math', align: 'center', alpha: H.easeOut(s.t / .5) });
  if (tm > 0) {
    H.arrow(ctx, 110, 290, 540, 290, { color: C.dim, width: 2, alpha: tm });
    H.text(ctx, 't', 556, 290, { size: 26, kind: 'math', color: C.dim, alpha: tm });
    const x = 120 + ((s.since('time') * 70) % 400);
    H.circle(ctx, x, 290, 10, { fill: C.teal, glow: C.teal, alpha: tm });
    H.text(ctx, 'one input: time', 320, 340, { size: 22, color: C.dim, align: 'center', alpha: tm });
  }
  if (od > 0) H.chip(ctx, 'ordinary differential equation · ODE', 320, 420, { align: 'center', color: C.teal, size: 21, alpha: od });
  const rd = s.on('rod', .6);
  if (rd <= 0) return;
  const tr = s.since('rod') + .05, x0 = 700, x1 = 1180, ry = 240, n = 48;
  H.text(ctx, 'u(x, t)', 940, 170, { size: 56, kind: 'math', align: 'center', alpha: rd });
  for (let i = 0; i < n; i++) { const xf = i / (n - 1), u = erfc(xf / (2 * Math.sqrt(.012 * tr)));
    H.rect(ctx, x0 + (x1 - x0) * i / n, ry, (x1 - x0) / n + 1, 46, { fill: heat(u), r: 0, alpha: rd }); }
  H.rect(ctx, x0, ry, x1 - x0, 46, { stroke: C.ink, width: 2, r: 6, alpha: rd });
  [0, 1, 2].forEach(k => { const fl = 10 + 6 * Math.sin(s.t * 9 + k * 2); ctx.save(); ctx.globalAlpha = rd; ctx.fillStyle = k === 1 ? C.amber : C.coral;
    ctx.beginPath(); ctx.moveTo(x0 - 30 + k * 12 - 8, ry + 80); ctx.lineTo(x0 - 30 + k * 12, ry + 70 - fl * 2); ctx.lineTo(x0 - 30 + k * 12 + 8, ry + 80); ctx.fill(); ctx.restore(); });
  const ps = s.on('position', .5), t2 = s.on('time2', .5);
  if (ps > 0) { H.arrow(ctx, x0, ry + 76, x1, ry + 76, { color: C.blue, width: 2.5, alpha: ps }); H.text(ctx, 'x  (position)', x1, ry + 104, { size: 22, kind: 'serif', color: C.blue, align: 'right', alpha: ps }); }
  const b = { x: x0, y: 420, w: x1 - x0, h: 170, t0: 0, t1: 1, ymin: 0, ymax: 1.1 };
  if (t2 > 0) {
    H.axes(ctx, b, { xlabel: 'x', ylabel: 'u', alpha: t2, grid: false });
    [.25, 1, 3].forEach((tt, i) => { const show = Math.min(tr, tt * (1 + i * 0));
      H.plot(ctx, xf => erfc(xf / (2 * Math.sqrt(.012 * show))), b, { color: i === 2 ? C.amber : C.dim, width: i === 2 ? 3 : 1.5, alpha: t2 * (i === 2 ? 1 : .6) }); });
    H.text(ctx, 'spreads over time', x1, 610, { size: 20, color: C.amber, align: 'right', alpha: t2 });
  }
  const pd = s.on('pde', .5), dm = s.on('dims', .5);
  if (pd > 0) H.chip(ctx, 'partial differential equation · PDE', 940, 660, { align: 'center', color: C.amber, size: 21, alpha: pd });
  if (dm > 0) H.text(ctx, '1 input  →  2 inputs', 320, 520, { size: 32, kind: 'serif', align: 'center', color: C.amber, alpha: dm });
};

// ---- 9. y = y_h + y_p ----
SCENES.solution = (ctx, s, H, C) => {
  const yh = t => Math.exp(-.3 * t) * Math.cos(2.6 * t), yp = t => .6 * Math.sin(1.3 * t - .4);
  const tw = s.on('two', .5);
  H.rich(ctx, [{ t: 'y', color: C.amber }, { t: ' = ', kind: 'serif' }, { t: 'yₕ', color: C.teal }, { t: '  +  ', kind: 'serif' }, { t: 'yₚ', color: C.coral }], 640, 105, { size: 52, alpha: tw });
  const rows = [
    { key: 'natural', f: yh, col: C.teal, lab: 'natural motion', sub: 'fades away' },
    { key: 'forced', f: yp, col: C.coral, lab: 'forced response', sub: 'follows the push' },
    { key: 'wobble', f: t => yh(t) + yp(t), col: C.amber, lab: 'what you see', sub: 'their sum' },
  ];
  rows.forEach((r, i) => {
    const a = s.on(r.key, .5); if (a <= 0) return;
    const b = { x: 380, y: 175 + i * 170, w: 800, h: 120, t0: 0, t1: 16, ymin: -1.4, ymax: 1.4 };
    H.line(ctx, [[b.x, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2]], { color: C.grid, width: 1.5, alpha: a });
    let up = H.easeOut(s.cue(r.key) / 3);
    if (r.key === 'wobble') up = .35 * H.easeOut(s.cue('wobble') / 2) + .65 * H.easeOut(s.cue('settle') / 3);
    if (i === 0 && s.has('fade')) { const fe = s.on('fade', .6);
      H.plot(ctx, t => Math.exp(-.3 * t), b, { color: C.teal, width: 1.5, dash: [6, 6], alpha: .7 * fe });
      H.plot(ctx, t => -Math.exp(-.3 * t), b, { color: C.teal, width: 1.5, dash: [6, 6], alpha: .7 * fe }); }
    if (r.key === 'wobble' && s.has('settle')) { const [xs] = H.map(b, 8, 0);
      H.rect(ctx, xs, b.y - 6, b.x + b.w - xs, b.h + 12, { fill: C.coral, r: 6, alpha: .1 * s.on('settle', .8) });
      H.text(ctx, 'settled into your rhythm', b.x + b.w, b.y - 18, { size: 19, color: C.coral, align: 'right', alpha: s.on('settle', .8) }); }
    if (r.key === 'wobble' && s.has('wobble')) { const [x0] = H.map(b, 0, 0), [x1] = H.map(b, 6, 0);
      H.text(ctx, 'uneven at first', (x0 + x1) / 2, b.y - 18, { size: 19, color: C.amber, align: 'center', alpha: s.on('wobble', .5) * (1 - s.on('settle', .5) * .5) }); }
    H.plot(ctx, r.f, b, { color: r.col, width: 3, upto: up, alpha: a });
    H.text(ctx, r.lab, 100, b.y + b.h / 2 - 14, { size: 25, kind: 'serif', color: r.col, alpha: a });
    H.text(ctx, r.sub, 100, b.y + b.h / 2 + 18, { size: 19, color: C.dim, alpha: a });
  });
};

// ---- 10. numerical stepping ----
SCENES.numeric = (ctx, s, H, C) => {
  const m = 1, c = .3, k = 4, f = t => Math.exp(-.15 * t) * (Math.cos(1.994 * t) + .0752 * Math.sin(1.994 * t));
  const run = h => { const out = [[0, 1]]; let x = 1, v = 0; for (let t = 0; t < 10 - 1e-9; t += h) { v += h * (-(c * v + k * x) / m); x += h * v; out.push([t + h, x]); } return out; };
  const big = run(.25), fine = run(.04);
  const b = { x: 110, y: 170, w: 620, h: 360, t0: 0, t1: 10, ymin: -1.2, ymax: 1.2 };
  H.axes(ctx, b, { xlabel: 't', ylabel: 'y' });
  H.plot(ctx, f, b, { color: C.dim, width: 2, dash: [6, 7], alpha: .7 });
  const st = s.since('steps'), rp = s.has('repeat') ? s.since('repeat') : -1;
  let nBig = s.has('steps') ? Math.min(big.length, 1 + Math.floor(st / .55)) : 0;
  if (rp >= 0) nBig = big.length;
  const shownBig = big.slice(0, nBig), fade = rp >= 0 ? 1 - H.clamp(rp / 1.2) : 1;
  shownBig.forEach(([t, y], i) => { const [x, yy] = H.map(b, t, y);
    if (i) { const [px, py] = H.map(b, ...shownBig[i - 1]); H.line(ctx, [[px, py], [x, yy]], { color: C.amber, width: 2, alpha: .7 * fade }); }
    H.circle(ctx, x, yy, 6, { fill: C.amber, alpha: fade }); });
  if (nBig > 0 && rp < 0) {
    const [t, y] = big[nBig - 1], [x, yy] = H.map(b, t, y);
    if (s.on('where') > 0) H.circle(ctx, x, yy, 16, { stroke: C.teal, width: 2.5, alpha: s.on('where') });
    if (s.on('split') > 0 && nBig < big.length) { const [nx, ny] = H.map(b, ...big[nBig]); H.arrow(ctx, x, yy, nx, ny, { color: C.teal, width: 3, head: 11, alpha: s.on('split') }); }
  }
  if (rp >= 0) {
    const nFine = Math.min(fine.length, 2 + Math.floor(H.easeOut(rp / 4) * fine.length));
    const pts = fine.slice(0, nFine).map(([t, y]) => H.map(b, t, y));
    H.line(ctx, pts, { color: C.amber, width: 3, glow: C.amber });
    H.text(ctx, `${nFine} steps`, b.x + b.w, b.y - 18, { size: 20, color: C.amber, align: 'right' });
  }
  const tr = s.on('tworules', .5);
  if (tr > 0) {
    H.text(ctx, 'two first-order rules', 1000, 200, { size: 24, kind: 'serif', color: C.dim, align: 'center', alpha: tr });
    const c1 = s.on('r1', .5), c2 = s.on('r2', .5);
    H.rect(ctx, 800, 240, 400, 110, { fill: C.panel, stroke: c1 > .3 && c2 < .3 ? C.amber : C.faint, width: 2, r: 12, alpha: tr });
    H.text(ctx, 'position′ = velocity', 1000, 280, { size: 26, color: C.ink, align: 'center', alpha: tr });
    H.text(ctx, 'x₁′ = x₂', 1000, 322, { size: 28, kind: 'math', color: C.teal, align: 'center', alpha: tr });
    H.rect(ctx, 800, 370, 400, 110, { fill: C.panel, stroke: c2 > .3 ? C.amber : C.faint, width: 2, r: 12, alpha: tr });
    H.text(ctx, 'velocity′ = force / mass', 1000, 410, { size: 26, color: C.ink, align: 'center', alpha: tr });
    H.text(ctx, 'x₂′ = (F − c·x₂ − k·x₁) / m', 1000, 452, { size: 26, kind: 'math', color: C.coral, align: 'center', alpha: tr });
  }
  const en = s.on('engines', .5);
  if (en > 0) ['physics engines', 'flight simulators', 'rocket sims'].forEach((t, i) =>
    H.chip(ctx, t, 820 + [0, 0, 0][i], 545 + i * 52, { color: C.amber, size: 19, alpha: H.easeOut((s.cue('engines') - i * .2) / .5) }));
};

// ---- 11. your turn ----
const CHECK = [['ODE or PDE?', 'ODE'], ['Order?', 'first'], ['Linear?', 'yes'], ['Homogeneous?', 'yes'], ['Conditions needed?', 'one']];
function checklist(ctx, s, H, C, answers) {
  CHECK.forEach(([q, a], i) => {
    const y = 300 + i * 72, show = answers ? 1 : s.on('checklist', .4) * H.easeOut((s.cue('checklist') - i * .15) / .4);
    if (show <= 0) return;
    H.rect(ctx, 120, y - 20, 40, 40, { stroke: C.dim, width: 2, r: 8, alpha: show });
    H.text(ctx, q, 186, y, { size: 26, color: C.ink, alpha: show });
    if (answers) { const p = s.on('c' + (i + 1), .45); H.check(ctx, 140, y, 30, p); H.text(ctx, a, 520, y, { size: 26, kind: 'serif', weight: 600, color: C.green, alpha: p }); }
  });
}
SCENES.practice = (ctx, s, H, C) => {
  H.text(ctx, 'y′ = −2y', 640, 170, { size: 84, kind: 'math', align: 'center', alpha: s.on('eq', .6) });
  checklist(ctx, s, H, C, false);
  if (s.t > s.speech) { // thinking time: a countdown ring
    const p = H.clamp((s.t - s.speech) / (s.dur - s.speech));
    ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.arc(980, 450, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p)); ctx.stroke(); ctx.restore();
    H.text(ctx, 'think', 980, 450, { size: 26, kind: 'serif', align: 'center', color: C.amber });
  }
};

// ---- 12. the answer ----
SCENES.answer = (ctx, s, H, C) => {
  H.text(ctx, 'y′ = −2y', 340, 170, { size: 60, kind: 'math', align: 'center' });
  checklist(ctx, s, H, C, true);
  const d = s.on('decay', .5);
  if (d > 0) {
    const b = { x: 760, y: 220, w: 420, h: 260, t0: 0, t1: 3, ymin: 0, ymax: 1.1 };
    H.axes(ctx, b, { xlabel: 't', ylabel: 'y', alpha: d });
    H.plot(ctx, t => Math.exp(-2 * t), b, { color: C.amber, width: 4, upto: H.easeOut(s.cue('decay') / 2.5), glow: C.amber });
    H.text(ctx, 'y = y₀·e^(−2t)', 1180, 250, { size: 26, kind: 'math', color: C.amber, align: 'right', alpha: d });
  }
  const cf = s.on('coffee', .6);
  if (cf > 0) {
    const steam = Math.exp(-.35 * s.since('coffee')), cx = 960, cy = 590;
    H.rect(ctx, cx - 45, cy - 40, 90, 70, { fill: C.panel, stroke: C.ink, r: 10, alpha: cf });
    ctx.save(); ctx.globalAlpha = cf; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx + 50, cy - 6, 16, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore();
    [-20, 0, 20].forEach((dx, i) => { const pts = []; for (let k = 0; k < 12; k++) pts.push([cx + dx + 6 * Math.sin(k * .8 + s.t * 3 + i), cy - 50 - k * 6]);
      H.line(ctx, pts, { color: C.ink, width: 2.5, alpha: cf * steam * .8 }); });
    H.text(ctx, 'cooling', cx + 90, cy - 4, { size: 22, color: C.dim, alpha: cf });
  }
  const dn = s.on('done', .6);
  if (dn > 0) H.text(ctx, 'Nicely done!', 340, 680, { size: 34, kind: 'serif', weight: 600, align: 'center', color: C.amber, alpha: dn });
};
