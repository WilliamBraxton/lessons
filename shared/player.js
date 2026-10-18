// Lesson Lab player: draws a lesson's scenes on a 1280×720 board, driven by the audio clock.
// Load order on a page: player.js → the lesson's scenes.js (fills SCENES) → LessonPlayer.mount(...).
/* global SCENES */
const W = 1280, HH = 720;
const C = { bg: '#13201f', panel: '#1b2b2a', ink: '#eef3ee', dim: '#8fa39f', faint: '#2c403e', grid: '#24363a',
  amber: '#f2b84b', teal: '#4fd6b4', coral: '#ff8a65', blue: '#6db3ff', purple: '#b39dff', red: '#ff6b77', green: '#8fdc72' };
const H = {
  clamp: (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)),
  lerp: (a, b, p) => a + (b - a) * p,
  ease: p => (p = Math.min(1, Math.max(0, p)), p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  easeOut: p => (p = Math.min(1, Math.max(0, p)), 1 - Math.pow(1 - p, 3)),
  pop: p => (p = Math.min(1, Math.max(0, p)), 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2)),
  font(size, kind = 'sans', weight = 400) {
    const fam = kind === 'math' ? '"STIX Two Text", "Times New Roman", serif' : kind === 'serif' ? 'Literata, Georgia, serif' : '"IBM Plex Sans", system-ui, sans-serif';
    return `${kind === 'math' ? 'italic ' : ''}${weight} ${size}px ${fam}`;
  },
  text(ctx, s, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.font = H.font(o.size || 28, o.kind, o.weight || 400);
    ctx.fillStyle = o.color || C.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
    ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore(); return w;
  },
  measure(ctx, s, size, kind, weight) { ctx.save(); ctx.font = H.font(size, kind, weight); const w = ctx.measureText(s).width; ctx.restore(); return w; },
  // Wraps text to maxWidth; returns the number of lines drawn.
  para(ctx, s, x, y, maxWidth, o = {}) {
    const size = o.size || 26, lh = o.lineHeight || size * 1.35, words = String(s).split(/\s+/); let line = '', n = 0;
    for (const w of words) { const test = line ? line + ' ' + w : w;
      if (H.measure(ctx, test, size, o.kind, o.weight) > maxWidth && line) { H.text(ctx, line, x, y + n * lh, o); n++; line = w; } else line = test; }
    if (line) { H.text(ctx, line, x, y + n * lh, o); n++; }
    return n;
  },
  rich(ctx, parts, x, y, o = {}) {
    const size = o.size || 40, ws = parts.map(p => H.measure(ctx, p.t, p.size || size, p.kind || 'math', p.weight || 400));
    const total = ws.reduce((a, b) => a + b, 0); let cx = o.align === 'left' ? x : x - total / 2; const out = [];
    parts.forEach((p, i) => {
      const a = (p.alpha ?? 1) * (o.alpha ?? 1);
      if (p.hl > 0) { H.rect(ctx, cx - 8, y - size * .72, ws[i] + 16, size * 1.44, { fill: C.amber, alpha: .16 * p.hl * a, r: 10 });
        H.line(ctx, [[cx, y + size * .62], [cx + ws[i] * p.hl, y + size * .62]], { color: C.amber, width: 3, alpha: a }); }
      H.text(ctx, p.t, cx, y, { size: p.size || size, kind: p.kind || 'math', weight: p.weight, color: p.hl > .5 ? C.amber : (p.color || C.ink), alpha: a });
      out.push({ x: cx, w: ws[i] }); cx += ws[i];
    });
    return out;
  },
  line(ctx, pts, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = o.width || 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (o.dash) ctx.setLineDash(o.dash);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 16; }
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
  },
  arrow(ctx, x1, y1, x2, y2, o = {}) {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), h = Math.min(o.head || 14, len * .6);
    H.line(ctx, [[x1, y1], [x2 - Math.cos(a) * h * .5, y2 - Math.sin(a) * h * .5]], o);
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.fillStyle = o.color || C.ink; ctx.beginPath();
    ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - .42), y2 - h * Math.sin(a - .42)); ctx.lineTo(x2 - h * Math.cos(a + .42), y2 - h * Math.sin(a + .42));
    ctx.closePath(); ctx.fill(); ctx.restore();
  },
  rect(ctx, x, y, w, h, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r ?? 8);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 24; }
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    ctx.shadowBlur = 0; if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 2; ctx.stroke(); } ctx.restore();
  },
  circle(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 2; ctx.stroke(); } ctx.restore();
  },
  spring(ctx, x, y1, y2, o = {}) {
    const n = o.coils || 8, amp = o.amp || 16, lead = 14, pts = [[x, y1], [x, y1 + lead]], span = (y2 - y1) - 2 * lead;
    for (let i = 0; i <= n * 2; i++) pts.push([x + (i === 0 || i === n * 2 ? 0 : (i % 2 ? amp : -amp)), y1 + lead + span * i / (n * 2)]);
    pts.push([x, y2]); H.line(ctx, pts, { color: o.color || C.dim, width: o.width || 3, glow: o.glow, alpha: o.alpha });
  },
  damper(ctx, x, y1, y2, o = {}) {
    const w = o.w || 30, col = o.color || C.dim, mid = (y1 + y2) / 2, cyl = Math.max(40, (y2 - y1) * .45);
    H.line(ctx, [[x, y1], [x, mid - 6]], { color: col, width: 3, alpha: o.alpha, glow: o.glow });
    H.line(ctx, [[x - w * .38, mid - 6], [x + w * .38, mid - 6]], { color: col, width: 4, alpha: o.alpha, glow: o.glow });
    H.line(ctx, [[x - w / 2, mid - cyl / 2], [x - w / 2, mid + cyl / 2], [x + w / 2, mid + cyl / 2], [x + w / 2, mid - cyl / 2]], { color: col, width: 3, alpha: o.alpha, glow: o.glow });
    H.line(ctx, [[x, mid + cyl / 2], [x, y2]], { color: col, width: 3, alpha: o.alpha, glow: o.glow });
  },
  hatch(ctx, x, y, w, o = {}) {
    H.line(ctx, [[x, y], [x + w, y]], { color: o.color || C.dim, width: 3, alpha: o.alpha });
    for (let i = 0; i < w; i += 16) H.line(ctx, [[x + i, y], [x + i + 10, y - 10]], { color: o.color || C.dim, width: 1.5, alpha: (o.alpha ?? 1) * .7 });
  },
  axes(ctx, b, o = {}) {
    const a = o.alpha ?? 1, y0 = b.y + b.h * (b.ymax / (b.ymax - b.ymin)), yz = isFinite(y0) ? H.clamp(y0, b.y, b.y + b.h) : b.y + b.h;
    if (o.grid !== false) for (let i = 1; i < 4; i++) H.line(ctx, [[b.x, b.y + b.h * i / 4], [b.x + b.w, b.y + b.h * i / 4]], { color: C.grid, width: 1, alpha: a });
    H.arrow(ctx, b.x, b.y + b.h, b.x, b.y - 8, { color: C.dim, width: 1.5, head: 9, alpha: a });
    H.arrow(ctx, b.x, yz, b.x + b.w + 10, yz, { color: C.dim, width: 1.5, head: 9, alpha: a });
    if (o.xlabel) H.text(ctx, o.xlabel, b.x + b.w + 14, yz, { size: 22, kind: 'math', color: C.dim, alpha: a });
    if (o.ylabel) H.text(ctx, o.ylabel, b.x, b.y - 24, { size: 22, kind: 'math', color: C.dim, align: 'center', alpha: a });
  },
  plot(ctx, f, b, o = {}) {
    const n = o.samples || 300, up = H.clamp(o.upto ?? 1), pts = [];
    for (let i = 0; i <= n * up; i++) { const t = b.t0 + (b.t1 - b.t0) * i / n, y = f(t);
      if (!isFinite(y)) continue;
      pts.push([b.x + b.w * i / n, b.y + b.h * (b.ymax - H.clamp(y, b.ymin - 1e3, b.ymax + 1e3)) / (b.ymax - b.ymin)]); }
    if (pts.length > 1) { ctx.save(); ctx.beginPath(); ctx.rect(b.x - 4, b.y - 20, b.w + 30, b.h + 40); ctx.clip();
      H.line(ctx, pts, { color: o.color || C.teal, width: o.width || 3, alpha: o.alpha, dash: o.dash, glow: o.glow }); ctx.restore(); }
    return pts[pts.length - 1];
  },
  map(b, t, y) { return [b.x + b.w * (t - b.t0) / (b.t1 - b.t0), b.y + b.h * (b.ymax - y) / (b.ymax - b.ymin)]; },
  check(ctx, x, y, s, p, o = {}) {
    p = H.clamp(p); if (p <= 0) return; const pts = [[x - s * .5, y], [x - s * .15, y + s * .38], [x + s * .55, y - s * .42]];
    const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), d = p * (l1 + l2);
    const path = d <= l1 ? [pts[0], [H.lerp(pts[0][0], pts[1][0], d / l1), H.lerp(pts[0][1], pts[1][1], d / l1)]]
      : [pts[0], pts[1], [H.lerp(pts[1][0], pts[2][0], (d - l1) / l2), H.lerp(pts[1][1], pts[2][1], (d - l1) / l2)]];
    H.line(ctx, path, { color: o.color || C.green, width: o.width || 5, alpha: o.alpha });
  },
  chip(ctx, s, x, y, o = {}) {
    const size = o.size || 20, w = H.measure(ctx, s, size, o.kind || 'sans', 500) + 28, h = size * 1.7, x0 = o.align === 'center' ? x - w / 2 : x;
    H.rect(ctx, x0, y - h / 2, w, h, { fill: o.fill || C.panel, stroke: o.color || C.dim, width: 1.5, r: h / 2, alpha: o.alpha });
    H.text(ctx, s, x0 + w / 2, y + 1, { size, color: o.color || C.ink, align: 'center', weight: 500, kind: o.kind || 'sans', alpha: o.alpha });
    return w;
  },
};
const SCENES = {};
window.H = H; window.C = C; window.SCENES = SCENES;

const ICON_PLAY = '<path d="M8 5.5v13l11-6.5z"/>', ICON_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
const svg = (d, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;

window.LessonPlayer = {
  // opts: { timeline, audioUrl, onQuiz?, onEnded?, onError?(msg), keyboard = true }
  mount(root, opts) {
    const TL = opts.timeline;
    root.classList.add('lp');
    root.innerHTML = `
      <div class="lp-stage"><canvas width="1280" height="720" aria-label="Lesson animation"></canvas>
        <button class="lp-bigplay" aria-label="Play lesson">${svg(ICON_PLAY, 34)}</button>
        <div class="lp-end" hidden><button class="replay">${svg('<path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/>', 18)}Replay</button></div></div>
      <div class="lp-caption" aria-live="off"></div>
      <div class="lp-controls">
        <button class="lp-play" aria-label="Play">${svg(ICON_PLAY)}</button>
        <span class="lp-time">0:00 / 0:00</span>
        <div class="lp-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0"><div class="rail"></div><div class="fill"></div><div class="ticks"></div><div class="knob"></div></div>
        <select aria-label="Playback speed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select>
      </div>
      <ol class="lp-chapters"></ol>
      <p class="lp-hint">Space plays or pauses · ← → skip 5 s · click any chapter to jump</p>
      <audio preload="auto"></audio>`;
    const q = s => root.querySelector(s);
    const aud = q('audio'), cv = q('canvas'), ctx = cv.getContext('2d'), big = q('.lp-bigplay'), end = q('.lp-end');
    aud.src = opts.audioUrl;
    if (opts.onQuiz) { const b = document.createElement('button'); b.className = 'solid'; b.innerHTML = `${svg('<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>', 18)}Take the quiz`; b.onclick = opts.onQuiz; end.appendChild(b); }
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const total = () => (isFinite(aud.duration) && aud.duration > 0 ? aud.duration : TL.duration);
    TL.steps.forEach((st, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b><span></span>`; b.querySelector('span').textContent = st.title;
      b.onclick = () => { seek(st.start + 0.01); if (aud.paused) play(); }; li.appendChild(b); q('.lp-chapters').appendChild(li);
      if (i) { const tk = document.createElement('div'); tk.className = 'tick'; tk.style.left = (100 * st.start / TL.duration) + '%'; q('.ticks').appendChild(tk); }
    });
    const chapBtns = [...root.querySelectorAll('.lp-chapters button')];
    const stepAt = t => { let i = 0; for (let k = 0; k < TL.steps.length; k++) if (TL.steps[k].start <= t + 1e-6) i = k; return i; };
    let capKey = null, capSpans = [];
    function caption(t, st) {
      let sen = null; for (const s of st.sentences) if (s.s <= t + .05) sen = s; if (!sen) sen = st.sentences[0];
      const key = st.id + ':' + (sen ? sen.s : '');
      if (key !== capKey) { capKey = key; const cap = q('.lp-caption'); cap.textContent = ''; capSpans = [];
        (sen ? sen.w : []).forEach(w => { const sp = document.createElement('span'); sp.textContent = w.d; cap.appendChild(sp); cap.appendChild(document.createTextNode(' ')); capSpans.push([sp, w]); }); }
      for (const [sp, w] of capSpans) sp.className = t < w.s ? 'fut' : (t <= w.e + .08 ? 'now' : '');
    }
    function makeState(t, st, idx) {
      const cue = n => (n in st.cues ? t - st.cues[n] : -Infinity);
      let word = ''; for (const s of st.sentences) for (const w of s.w) if (w.s <= t) word = w.d;
      return { t: t - st.start, T: t, dur: st.end - st.start, speech: st.speechEnd - st.start, p: (t - st.start) / (st.end - st.start), step: st, index: idx, W, H: HH, word,
        cue, has: n => cue(n) >= 0, since: n => Math.max(0, cue(n)), on: (n, d = .6) => H.ease(cue(n) / d) };
    }
    let lastError = '';
    function draw(t) {
      const idx = stepAt(t), st = TL.steps[idx];
      ctx.setTransform(cv.width / W, 0, 0, cv.height / HH, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, HH);
      const s = makeState(t, st, idx), fn = SCENES[st.scene];
      try { if (fn) fn(ctx, s, H, C); else H.text(ctx, `scene "${st.scene}" is missing`, W / 2, HH / 2, { align: 'center', color: C.red }); }
      catch (e) { ctx.restore?.(); const msg = `Scene "${st.scene}": ${e.message}`; H.text(ctx, msg, W / 2, HH / 2, { align: 'center', color: C.red, size: 22 });
        if (msg !== lastError) { lastError = msg; console.error(e); opts.onError?.(msg, st.scene, t); } }
      const fade = 1 - H.clamp(s.t / .45);
      if (fade > 0 && idx > 0) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, HH); ctx.restore(); }
      H.text(ctx, `${String(idx + 1).padStart(2, '0')}  ${st.title}`, 40, 42, { size: 19, color: C.dim, weight: 500 });
      caption(t, st);
      chapBtns.forEach((b, i) => { b.classList.toggle('cur', i === idx); b.classList.toggle('done', i < idx); });
      const T = total(); q('.lp-time').textContent = `${fmt(t)} / ${fmt(T)}`;
      const pc = 100 * H.clamp(t / T) + '%'; q('.fill').style.width = pc; q('.knob').style.left = pc;
      q('.lp-track').setAttribute('aria-valuemax', Math.round(T)); q('.lp-track').setAttribute('aria-valuenow', Math.round(t));
    }
    let last = -1, previewT = null, raf = 0, alive = true;
    function fit() { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(r.width * d), h = Math.round(r.height * d); if (w && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; } last = -1; }
    function loop() { if (!alive) return; const t = previewT ?? aud.currentTime; if (t !== last) { last = t; draw(t); } raf = requestAnimationFrame(loop); }
    const setIcon = playing => { q('.lp-play').innerHTML = svg(playing ? ICON_PAUSE : ICON_PLAY); q('.lp-play').setAttribute('aria-label', playing ? 'Pause' : 'Play'); };
    function play() { previewT = null; end.hidden = true; aud.play().catch(() => {}); }
    function toggle() { aud.paused ? play() : aud.pause(); }
    function seek(t) { previewT = null; aud.currentTime = H.clamp(t, 0, Math.max(0, total() - .05)); last = -1; }
    aud.addEventListener('play', () => { setIcon(true); big.hidden = true; end.hidden = true; });
    aud.addEventListener('pause', () => setIcon(false));
    aud.addEventListener('ended', () => { setIcon(false); end.hidden = false; opts.onEnded?.(); });
    q('.lp-play').onclick = toggle; big.onclick = play; cv.addEventListener('click', toggle);
    q('.replay').onclick = () => { seek(0); play(); };
    q('select').onchange = e => { aud.playbackRate = parseFloat(e.target.value); };
    const tr = q('.lp-track');
    const seekPx = e => { const r = tr.getBoundingClientRect(); seek(H.clamp((e.clientX - r.left) / r.width) * total()); };
    tr.addEventListener('pointerdown', e => { tr.setPointerCapture(e.pointerId); seekPx(e); tr.onpointermove = seekPx; });
    tr.addEventListener('pointerup', () => { tr.onpointermove = null; });
    tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { seek(aud.currentTime + 5); e.preventDefault(); } if (e.key === 'ArrowLeft') { seek(aud.currentTime - 5); e.preventDefault(); } });
    const onKey = e => {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') seek(aud.currentTime + 5); else if (e.key === 'ArrowLeft') seek(aud.currentTime - 5);
    };
    if (opts.keyboard !== false) document.addEventListener('keydown', onKey);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    document.fonts?.ready.then(() => { last = -1; });
    fit(); loop();
    return {
      audio: aud, play, seek, pause: () => aud.pause(), toggle,
      preview(t) { previewT = t; last = -1; big.hidden = true; },
      get time() { return previewT ?? aud.currentTime; },
      destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); aud.pause(); document.removeEventListener('keydown', onKey); },
    };
  },
};
