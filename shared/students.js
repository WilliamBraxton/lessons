// Lesson Lab student accounts and scores.
// With Supabase configured (config.js), students sign in with an emailed link and every quiz
// attempt and viewing progress goes to the teacher's gradebook. Without it, or while signed
// out, results are kept on this device only.
(() => {
  const cfg = window.LESSON_LAB_CONFIG || {};
  const URL_ = (cfg.supabaseUrl || '').replace(/\/$/, ''), KEY = cfg.supabaseAnonKey || '';
  const enabled = !!(URL_ && KEY);
  const LS = 'lesson-lab:';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(LS + k); } catch {} },
  };

  // Magic-link redirects land with the session in the URL hash.
  (function absorbRedirect() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('access_token')) {
      store.set('session', { access_token: h.get('access_token'), refresh_token: h.get('refresh_token'),
        expires_at: Math.floor(Date.now() / 1000) + Number(h.get('expires_in') || 3600) });
      history.replaceState(null, '', location.pathname + location.search);
    } else if (h.get('error_description')) {
      store.set('authError', h.get('error_description'));
      history.replaceState(null, '', location.pathname + location.search);
    }
  })();

  async function api(path, { method = 'GET', body, token, prefer } = {}) {
    const headers = { apikey: KEY, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(URL_ + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw new Error((data && (data.msg || data.message || data.error_description || data.error)) || `Request failed (${r.status})`);
    return data;
  }
  async function token() {
    const s = store.get('session');
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const d = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
      store.set('session', { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + d.expires_in });
      return d.access_token;
    } catch { store.del('session'); store.del('user'); return null; }
  }

  const S = {
    enabled,
    takeAuthError() { const e = store.get('authError'); store.del('authError'); return e; },
    async user() {
      if (!enabled) return null;
      const t = await token(); if (!t) return null;
      const cached = store.get('user');
      if (cached && cached.token === t) return cached.user;
      try {
        const u = await api('/auth/v1/user', { token: t });
        const prof = await api(`/rest/v1/profiles?id=eq.${u.id}&select=display_name,class_code`, { token: t });
        const user = { id: u.id, email: u.email, name: prof?.[0]?.display_name || '', classCode: prof?.[0]?.class_code || '' };
        store.set('user', { token: t, user });
        return user;
      } catch { return null; }
    },
    async sendLink(email) {
      const back = location.origin + location.pathname + location.search;
      await api(`/auth/v1/otp?redirect_to=${encodeURIComponent(back)}`, { method: 'POST', body: { email, create_user: true } });
    },
    async saveProfile(name, classCode) {
      const t = await token(); const u = await S.user(); if (!t || !u) throw new Error('Sign in first.');
      await api('/rest/v1/profiles', { method: 'POST', token: t, prefer: 'resolution=merge-duplicates,return=minimal',
        body: { id: u.id, display_name: name, class_code: classCode || null } });
      store.del('user');
    },
    signOut() { store.del('session'); store.del('user'); },
    local: {
      attempts: () => store.get('attempts', []),
      progress: () => store.get('progress', {}),
    },
    // Records a quiz attempt locally, and in the gradebook when signed in. Returns a status line.
    async recordAttempt(a) {
      const rec = { ...a, at: new Date().toISOString() };
      store.set('attempts', [...store.get('attempts', []), rec].slice(-500));
      const u = await S.user();
      if (!enabled) return 'Saved on this device.';
      if (!u) return 'Saved on this device. Sign in on the library page to send scores to your teacher.';
      await api('/rest/v1/attempts', { method: 'POST', token: await token(), prefer: 'return=minimal', body: {
        lesson_slug: a.slug, lesson_title: a.title, lesson_version: a.version || null, score: a.score, total: a.total,
        answers: a.answers, duration_s: a.durationS, watched_pct: a.watchedPct ?? null } });
      return `Sent to your teacher's gradebook as ${u.name || u.email}.`;
    },
    // Highest fraction of the lesson watched, saved locally and (throttled by the caller) to the gradebook.
    async recordProgress(slug, pct, completed) {
      const p = store.get('progress', {});
      const prev = p[slug] || { pct: 0, completed: false };
      p[slug] = { pct: Math.max(prev.pct, pct), completed: prev.completed || completed, at: new Date().toISOString() };
      store.set('progress', p);
      if (!enabled) return;
      const u = await S.user(); if (!u) return;
      try {
        await api('/rest/v1/progress', { method: 'POST', token: await token(), prefer: 'resolution=merge-duplicates,return=minimal',
          body: { user_id: u.id, lesson_slug: slug, max_pct: p[slug].pct, completed: p[slug].completed, updated_at: p[slug].at } });
      } catch (e) { console.warn('progress not saved', e); }
    },
    async myAttempts() {
      const local = store.get('attempts', []);
      const u = await S.user(); if (!u) return local.map(a => ({ slug: a.slug, score: a.score, total: a.total, at: a.at }));
      try {
        const rows = await api(`/rest/v1/attempts?select=lesson_slug,score,total,created_at&order=created_at.desc&limit=500`, { token: await token() });
        return rows.map(r => ({ slug: r.lesson_slug, score: r.score, total: r.total, at: r.created_at }));
      } catch { return local; }
    },
  };
  window.LessonStudents = S;
})();
