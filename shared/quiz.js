// Lesson Lab quiz: one question at a time, instant feedback with an explanation, a score at the end.
// quiz.json: { "questions": [ { "id", "prompt", "options": [...], "answer": <index>, "explanation", "hint"? } ] }
window.LessonQuiz = {
  // opts: { quiz, onComplete({ score, total, answers, durationS }) }
  mount(root, opts) {
    const qs = opts.quiz.questions || [];
    let i = 0, picked = null, answers = [], started = Date.now();
    root.classList.add('qz');
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    function render() {
      root.textContent = '';
      if (i >= qs.length) return finish();
      const q = qs[i];
      const head = el('div', 'qz-head');
      head.append(el('span', 'qz-count', `Question ${i + 1} of ${qs.length}`));
      const dots = el('div', 'qz-dots');
      qs.forEach((_, k) => { const d = el('span', 'qz-dot'); if (k < i) d.classList.add(answers[k].correct ? 'right' : 'wrong'); if (k === i) d.classList.add('cur'); dots.append(d); });
      head.append(dots);
      root.append(head, el('p', 'qz-prompt', q.prompt));
      const list = el('div', 'qz-options'); list.setAttribute('role', 'radiogroup');
      q.options.forEach((o, k) => {
        const b = el('button', 'qz-opt'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.append(el('span', 'qz-letter', 'ABCDEFG'[k]), el('span', 'qz-text', o));
        b.onclick = () => choose(k);
        list.append(b);
      });
      root.append(list);
      const foot = el('div', 'qz-foot');
      if (q.hint) { const h = el('button', 'btn quiet qz-hintbtn', 'Show a hint'); h.type = 'button';
        h.onclick = () => { h.replaceWith(el('p', 'qz-hint', q.hint)); }; foot.append(h); }
      root.append(foot);
      root.querySelector('.qz-opt')?.focus({ preventScroll: true });
    }
    function choose(k) {
      if (picked !== null) return;
      picked = k; const q = qs[i], correct = k === q.answer;
      answers.push({ id: q.id || `q${i + 1}`, picked: k, correct });
      root.querySelectorAll('.qz-opt').forEach((b, n) => {
        b.disabled = true; b.setAttribute('aria-checked', String(n === k));
        if (n === q.answer) b.classList.add('right'); else if (n === k) b.classList.add('wrong');
      });
      const fb = el('div', 'qz-feedback ' + (correct ? 'right' : 'wrong'));
      fb.append(el('strong', '', correct ? 'Correct.' : 'Not quite.'), el('span', '', ' ' + (q.explanation || '')));
      const foot = root.querySelector('.qz-foot'); foot.textContent = '';
      const next = el('button', 'btn primary', i + 1 < qs.length ? 'Next question' : 'See my score'); next.type = 'button';
      next.onclick = () => { i++; picked = null; render(); };
      foot.append(next);
      root.insertBefore(fb, foot);
      next.focus({ preventScroll: true });
    }
    function finish() {
      const score = answers.filter(a => a.correct).length, total = qs.length;
      const pct = total ? Math.round(100 * score / total) : 0;
      const box = el('div', 'qz-result');
      box.append(el('p', 'qz-count', 'Your score'), el('p', 'qz-big', `${score} / ${total}`),
        el('p', 'qz-msg', pct === 100 ? 'Perfect. You have this one down.' : pct >= 70 ? 'Nicely done.' : 'Worth another listen, then try again.'));
      const status = el('p', 'qz-status muted', 'Saving…'); box.append(status);
      const again = el('button', 'btn', 'Try the quiz again'); again.type = 'button';
      again.onclick = () => { i = 0; picked = null; answers = []; started = Date.now(); render(); };
      box.append(again);
      root.append(box);
      Promise.resolve(opts.onComplete?.({ score, total, answers, durationS: Math.round((Date.now() - started) / 1000) }))
        .then(msg => { status.textContent = msg || ''; })
        .catch(e => { status.textContent = e.message || 'Could not save this score.'; status.classList.add('bad'); });
    }
    render();
    return { restart() { i = 0; picked = null; answers = []; started = Date.now(); render(); } };
  },
};
