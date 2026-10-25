(() => {
  // ---------- Content lives in js/content.js ----------
  const SITE = window.SITE;
  const TAGLINE = SITE.tagline;
  const QA = SITE.qa;
  const GROUPS = SITE.groups;
  const ROTATE_MS = SITE.rotateMs || 2800;
  const SHOWN = SITE.shown;
  const EGGS = SITE.eggs;
  const KEYS = SITE.keys;
  // The worker in worker/ answers questions nothing here matches; empty turns it off
  const AI_URL = 'https://kostiskarampinas-ask.kostis-rpk.workers.dev';
  const MAX_ASKS = 10; // model questions per page visit; curated answers are unlimited
  const RX = KEYS.map(([id, ks]) => [id, ks.map((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))]);
  const matchId = (t) => { for (const [id, rs] of RX) if (rs.some((r) => r.test(t))) return id; return null; };

  // ---------- Elements ----------
  const root = document.documentElement;
  const h1 = document.getElementById('tag');
  const ask = document.getElementById('ask');
  const form = document.getElementById('form');
  const input = document.getElementById('q');
  const out = document.getElementById('out');
  const askedEl = document.getElementById('asked');
  const answerEl = document.getElementById('answer');
  const caret = document.getElementById('caret');
  const extraEl = document.getElementById('extra');
  const live = document.getElementById('live');
  const label = document.getElementById('label');
  const sugsEl = document.getElementById('sugs');
  const themeBtn = document.getElementById('theme');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchUI = matchMedia('(hover: none)').matches;

  // ---------- Build the tagline as weighted letters ----------
  h1.setAttribute('aria-label', TAGLINE);
  h1.textContent = '';
  const chars = [];
  const DIM = 0.6; // opacity of the words not in focus; matches .tag .c in site.css
  const TINT = 0.3; // how much of the dot's colour the word in focus takes on
  const SETTLED = 0.85; // opacity of the whole line once every word group has had its turn
  TAGLINE.split(' ').forEach((word, wi, arr) => {
    const g = GROUPS.findIndex((grp) => grp.includes(word));
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch;
      w.appendChild(c);
      chars.push({ el: c, x: 0, y: 0, cur: 260, written: 260, g, e: 0, op: DIM, tint: 0, pk: 0 });
    }
    h1.appendChild(w);
    if (wi < arr.length - 1) h1.appendChild(document.createTextNode(' '));
  });
  const N = chars.length;

  // The tagline's final full stop: magenta, and alive (see "The dot" below)
  const dot = chars[N - 1].el;
  dot.classList.add('dot');

  let rest = 260, restEm = 560, peak = 820, fs = 80;
  function readTokens() {
    const cs = getComputedStyle(root);
    rest = parseFloat(cs.getPropertyValue('--rest')) || 260;
    peak = parseFloat(cs.getPropertyValue('--peak')) || 820;
    restEm = parseFloat(cs.getPropertyValue('--rest-em')) || 560;
  }
  function measure() {
    readTokens();
    fs = parseFloat(getComputedStyle(h1).fontSize) || 80;
    for (const c of chars) { const base = reduce && c.g === 0 ? restEm : rest; c.e = 0; c.el.style.width = ''; c.el.style.fontWeight = base; c.cur = base; c.written = base; }
    const hb = h1.getBoundingClientRect();
    for (const c of chars) {
      const r = c.el.getBoundingClientRect();
      c.x = r.left - hb.left + r.width / 2;
      c.y = r.top - hb.top + r.height / 2;
      c.w = r.width;
    }
    for (const c of chars) c.el.style.width = c.w + 'px';
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  // ---------- Pointer and touch ----------
  const ptr = { x: 0, y: 0, active: false, last: -1e9 };
  const sp = { x: null, y: null };
  let inf = 0;
  const IDLE = 2600;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.last = performance.now();
  }, { passive: true });
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget && e.pointerType !== 'touch') ptr.active = false; });
  const onTouch = (e) => {
    const t = e.touches[0]; if (!t) return;
    ptr.x = t.clientX; ptr.y = t.clientY; ptr.active = true; ptr.last = performance.now();
  };
  addEventListener('touchstart', onTouch, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });

  // ---------- Focus / theme wave ----------
  let waveT0 = null;
  // One pass through the groups, then the line settles: brighter, with every word that had its turn kept pink
  let active = 0, rotT = performance.now(), settled = false, dimNow = DIM;
  const wave = () => { if (!reduce) waveT0 = performance.now(); };

  // Each weight change re-lays out the line, so the ambient rotation writes at half rate and the loop sleeps off-screen
  let odd = false, tagSeen = true;
  new IntersectionObserver(([e]) => { tagSeen = e.isIntersecting; }).observe(h1);
  function frame(now) {
    odd = !odd;
    if (!reduce && tagSeen) {
      const hb = h1.getBoundingClientRect();
      let tx = null, ty = null, want = 0;
      const recent = now - ptr.last < IDLE;
      if (ptr.active && recent) { tx = ptr.x - hb.left; ty = ptr.y - hb.top; want = 1; }
      if (tx !== null) {
        if (sp.x === null || inf < 0.02) { sp.x = tx; sp.y = ty; }
        else { sp.x += (tx - sp.x) * 0.22; sp.y += (ty - sp.y) * 0.22; }
      }
      inf += (want - inf) * (want ? 0.12 : 0.05);

      const holding = ptr.active && recent;
      if (!settled && now - rotT > ROTATE_MS && waveT0 === null) {
        active++; rotT = now;
        if (active === GROUPS.length) { settled = true; active = -2; } // -2: no group (-1 marks words outside any group)
      }
      dimNow += ((settled ? SETTLED : DIM) - dimNow) * 0.03;

      const R = fs * 2.3;
      let wf = -1;
      if (waveT0 !== null) {
        wf = ((now - waveT0) / 1000) * (N / 0.85);
        if (wf > N + 16) { waveT0 = null; wf = -1; }
      }
      for (let i = 0; i < N; i++) {
        const c = chars[i];
        let b = 0;
        if (sp.x !== null && inf > 0.002) {
          const d = Math.hypot(c.x - sp.x, (c.y - sp.y) * 1.25);
          const f = Math.max(0, 1 - d / R);
          b = f * f * (3 - 2 * f) * inf;
        }
        if (wf >= 0) {
          const dd = wf - i;
          if (dd > 0 && dd < 16) b = Math.max(b, Math.sin(Math.PI * dd / 16));
        }
        c.e += ((c.g === active ? 1 : 0) - c.e) * 0.045;
        const base = rest + (restEm - rest) * c.e;
        const target = base + (peak - base) * b;
        c.cur += (target - c.cur) * 0.2;
        if ((holding ? Math.abs(c.cur - c.written) > 0.6 : odd && Math.abs(c.cur - c.written) > 2)) { c.written = c.cur; c.el.style.fontWeight = Math.round(c.cur); }
        // Words not in focus sit slightly faded, so the heavy ones read even stronger; the dot stays at full colour
        const op = i === N - 1 ? 1 : dimNow + (1 - dimNow) * Math.max(c.e, b);
        if (Math.abs(op - c.op) > 0.02) { c.op = op; c.el.style.opacity = op.toFixed(2); }
        // ...and the word in focus picks up a little of the dot's colour, and keeps it
        c.pk = Math.max(c.pk, c.e);
        const tint = i === N - 1 ? 0 : Math.round(c.pk * TINT * 100);
        if (tint !== c.tint) { c.tint = tint; c.el.style.color = tint ? 'color-mix(in oklab, var(--fg), var(--signal) ' + tint + '%)' : ''; }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Ask ----------
  let sugsOpen = false;
  let mode = 'idle', cur = null, typer = null, sugDelay = 0, rv = null, sugKey = '', aiSeq = 0, aiAnswer = false, asks = 0;

  // ---------- Instrument: scale, marker, knob, readout ----------
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('count');
  const scaleEl = document.getElementById('scale');
  const mark = document.getElementById('mark');
  const ctx = document.createElement('canvas').getContext('2d');
  let ticks = [], tickX = [], busy = false;
  // 50-character limit, enforced with a bit of attitude
  const MAX = 50;
  const fmt = (n) => String(n).padStart(2, '0') + '/' + MAX;
  const errEl = document.getElementById('err');
  const QUIPS = SITE.quips;
  let quip = -1, errT = null;
  function complain() {
    quip = (quip + 1 + Math.floor(Math.random() * (QUIPS.length - 1))) % QUIPS.length;
    errEl.textContent = QUIPS[quip];
    errEl.hidden = false;
    if (petAlive) petFx('angry', 560);
    const f = document.getElementById('form');
    if (!reduce) { f.classList.remove('nudge'); void f.offsetWidth; f.classList.add('nudge'); }
    clearTimeout(errT);
    errT = setTimeout(() => { errEl.hidden = true; }, 4000);
  }
  function buildScale() {
    ticks.forEach((t) => t.remove());
    ticks = []; tickX = [];
    const W = scaleEl.clientWidth;
    const n = Math.max(12, Math.floor(W / 10) + 1);
    for (let i = 0; i < n; i++) {
      const x = i * (W - 1) / (n - 1);
      const t = document.createElement('span');
      t.className = 'tick' + (i % 5 === 0 ? ' major' : '');
      t.style.left = x + 'px';
      t.style.setProperty('--i', i);
      scaleEl.insertBefore(t, mark);
      ticks.push(t); tickX.push(x);
    }
    track();
  }
  function caretX() {
    const cs = getComputedStyle(input);
    ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
    const pos = input.selectionStart == null ? input.value.length : input.selectionStart;
    const w = ctx.measureText(input.value.slice(0, pos)).width - input.scrollLeft;
    return Math.max(0, Math.min(scaleEl.clientWidth, w));
  }
  function track() {
    if (input.value.length > MAX) {
      const p = Math.min(MAX, input.selectionStart == null ? MAX : input.selectionStart);
      input.value = input.value.slice(0, MAX);
      try { input.setSelectionRange(p, p); } catch (e) {}
      complain();
    } else if (input.value.length < MAX - 4) { errEl.hidden = true; }
    const x = caretX();
    mark.style.transform = 'translateX(' + (x - 4) + 'px)';
    const has = input.value.length > 0;
    for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('lit', has && tickX[i] <= x + 0.5);
    countEl.textContent = fmt(input.value.length);
    countEl.classList.toggle('full', input.value.length >= MAX);
  }
  function refreshStatus() {
    let s = 'ready';
    if (busy) s = 'answering';
    else if (ask.classList.contains('is-focus')) s = input.value ? 'listening · ↵ to ask' : 'listening';
    else if (mode === 'answer') s = aiAnswer ? 'answered · ai' : 'answered';
    else if (mode === 'fallback') s = 'no match';
    else if (mode === 'limit') s = 'limit reached';
    statusEl.textContent = s;
  }
  // The dot hops over, then the answer is written out with the dot riding at its end.
  // The answer's own full stop is dropped: the dot is the full stop.
  // Rich parts of an answer: CV rows and project links, revealed after the sentence
  function renderExtra(item) {
    extraEl.textContent = '';
    if (!item || (!item.cv && !item.links)) { extraEl.hidden = true; return; }
    let i = 0;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    // **text** in a note is the part worth noticing; built as nodes, never as HTML
    const note = (text) => { const n = el('span', 'note'); text.split(/\*\*(.+?)\*\*/).forEach((part, i) => n.append(i % 2 ? el('b', null, part) : part)); return n; };
    if (item.cv) {
      const ol = el('ol', 'cv');
      for (const r of item.cv) {
        const li = el('li', r.to === 'now' ? 'current' : '');
        li.style.setProperty('--i', i++);
        const when = el('span', 'when', r.from + ' – ');
        when.append(r.to === 'now' ? el('b', '', 'now') : r.to);
        const what = el('span', 'what');
        what.append(el('span', 'role', r.role), el('span', 'org', r.org));
        if (r.note) what.append(note(r.note));
        li.append(when, what);
        ol.append(li);
      }
      extraEl.append(ol);
    }
    if (item.links) {
      const ul = el('ul', 'links');
      for (const l of item.links) {
        const li = el('li');
        li.style.setProperty('--i', i++);
        if (l.copy) {
          const row = el('div', 'link');
          const val = el('span', 'host', l.copy);
          const btn = el('button', 'copy', 'copy');
          btn.type = 'button';
          btn.addEventListener('click', () => {
            const done = () => { btn.textContent = 'copied'; setTimeout(() => { btn.textContent = 'copy'; }, 1600); };
            const sel = () => { const r = document.createRange(); r.selectNodeContents(val); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
            try { navigator.clipboard.writeText(l.copy).then(done, sel); } catch (e) { sel(); }
          });
          row.append(el('span', 'lbl', l.label), val, btn);
          li.append(row);
        } else {
          const a = el('a', 'link');
          a.href = l.url || '#';
          if (/^https?:/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
          a.append(el('span', 'lbl', l.label), el('span', 'host', l.host), el('span', 'arr', '↗'));
          li.append(a);
        }
        if (l.note) li.append(note(l.note));
        ul.append(li);
      }
      extraEl.append(ul);
    }
    extraEl.hidden = false;
  }

  // The whole answer is laid out at once, so the page never reflows; it scrolls into view once
  function settle() {
    const r = out.getBoundingClientRect();
    const over = Math.min(r.bottom + 24 - innerHeight, r.top - 16);
    if (over > 0) scrollBy({ top: over, behavior: reduce ? 'auto' : 'smooth' });
  }
  // Words fade in one after another (CSS), the dot gliding along at the newest one
  function showAnswer(text, q, kind, item) {
    clearTimeout(typer);
    askedEl.textContent = q;
    out.classList.remove('reveal'); void out.offsetWidth; out.classList.add('reveal');
    if (reduce) { answerEl.textContent = text; renderExtra(item); requestAnimationFrame(settle); return; }
    const words = [];
    out.hidden = false;
    answerEl.textContent = '';
    text.replace(/\.\s*$/, '').split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s/.test(part)) { answerEl.append(part); return; }
      const w = document.createElement('span');
      w.className = 'w';
      answerEl.append(w);
      w.textContent = part;
      words.push(w);
    });
    const step = Math.min(34, 1500 / words.length), total = Math.round(step * (words.length - 1));
    words.forEach((w, i) => w.style.setProperty('--i', Math.round(i * step) + 'ms'));
    extraEl.style.setProperty('--d', total + 'ms');
    renderExtra(item);
    sugDelay = total + 250;
    const last = words[words.length - 1].getClientRects();
    rv = { words, step, t0: performance.now(), off: caret.getBoundingClientRect().top - last[last.length - 1].bottom };
    busy = true; ask.classList.add('busy');
    petDeliver();
    requestAnimationFrame(settle);
    typer = setTimeout(() => {
      rv = null;
      busy = false; ask.classList.remove('busy'); refreshStatus();
      petReact(kind);
    }, total + 250);
  }
  ['input', 'keyup', 'click', 'select', 'scroll'].forEach((ev) => input.addEventListener(ev, () => { track(); refreshStatus(); }));
  let sT;
  addEventListener('resize', () => { clearTimeout(sT); sT = setTimeout(buildScale, 140); });
  buildScale();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildScale);
  // A suggestion is an answer id, or { id, q } to ask it in other words
  function setSugs(sugs, lbl) {
    const key = sugs.map((s) => s.q || s).join(',') + '|' + lbl;
    if (key === sugKey) return;
    sugKey = key;
    sugsEl.style.setProperty('--d', sugDelay + 'ms');
    sugDelay = 0;
    sugsEl.textContent = '';
    sugs.forEach((s, i) => {
      const id = s.id || s;
      const q = s.q || QA.find((x) => x.id === id).q;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.style.setProperty('--i', i);
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => askQ(q, id));
      sugsEl.appendChild(b);
    });
    label.textContent = lbl;
    label.hidden = !lbl;
  }
  function render() {
    const focused = ask.classList.contains('is-focus');
    const show = mode !== 'idle' || focused || sugsOpen;
    if (!show) { sugsEl.hidden = true; label.hidden = true; sugKey = ''; }
    else {
      if (mode === 'answer') {
        const path = SITE.paths.find((p) => p.ids.includes(cur));
        setSugs(path ? [...path.ids.filter((id) => id !== cur), path.exit] : SHOWN.filter((id) => id !== cur), 'Ask another');
      }
      else setSugs(SHOWN, '');
      sugsEl.hidden = false;
    }
    out.hidden = mode === 'idle';
    h1.parentElement.classList.toggle('has-answer', mode !== 'idle');
  }
  function askQ(text, forceId) {
    text = (text || '').trim();
    if (!text) { input.focus(); return; }
    const seq = ++aiSeq;
    aiAnswer = false;
    const egg = !forceId && EGGS.find((e) => e.re.test(text));
    if (egg) {
      input.value = ''; mode = 'answer'; cur = null;
      live.textContent = egg.a; showAnswer(egg.a, text, 'egg');
      if (touchUI) input.blur();
      sugKey = ''; track(); refreshStatus(); render();
      return;
    }
    const id = forceId || matchId(text);
    const hit = QA.find((x) => x.id === id);
    input.value = '';
    ask.classList.remove('has-text');
    const noMatch = () => {
      mode = 'fallback'; cur = null;
      const msg = "That one's outside what I can answer here. Try one of these:";
      live.textContent = msg;
      showAnswer(msg, text, 'no');
    };
    if (!hit && AI_URL && ++asks > MAX_ASKS) {
      mode = 'limit'; cur = null;
      live.textContent = SITE.limit;
      showAnswer(SITE.limit, text, 'no', QA.find((x) => x.id === 'hire'));
    } else if (!hit && AI_URL) {
      busy = true; ask.classList.add('busy'); P.think = true;
      fetch(AI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: text }), signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && d.a, () => null)
        .then((a) => {
          if (seq !== aiSeq) return;
          busy = false; ask.classList.remove('busy'); P.think = false;
          if (a) { mode = 'answer'; cur = null; aiAnswer = true; live.textContent = a; showAnswer(a, text, 'yes'); }
          else noMatch();
          sugKey = ''; refreshStatus(); render();
        });
    } else if (!hit) {
      noMatch();
    } else {
      mode = 'answer'; cur = hit.id;
      live.textContent = hit.a;
      showAnswer(hit.a, text, 'yes', hit);
    }
    if (touchUI) input.blur();
    sugKey = '';
    track();
    refreshStatus();
    render();
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); askQ(input.value); });
  input.addEventListener('input', () => {
    ask.classList.toggle('has-text', !!input.value.trim());
    if (petAlive && P.mode !== 'ruler' && !petBusy) travel('ruler'); // you start typing, it comes back to watch
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') input.blur(); });
  ask.addEventListener('focusin', () => {
    if (!ask.classList.contains('is-focus')) { ask.classList.add('is-focus'); if (document.activeElement === input) wave(); render(); refreshStatus(); }
  });
  ask.addEventListener('focusout', (e) => {
    if (!ask.contains(e.relatedTarget)) { ask.classList.remove('is-focus'); render(); refreshStatus(); }
  });

  // ---------- More easter eggs ----------
  // Konami code: the letters scatter and fall back into place
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0;
  addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos < KONAMI.length) return;
    kpos = 0;
    if (reduce) return;
    for (const c of chars) {
      const dx = (Math.random() - 0.5) * fs * 1.6, dy = (Math.random() - 0.5) * fs * 1.4, r = (Math.random() - 0.5) * 70;
      const off = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + r.toFixed(1) + 'deg)';
      c.el.animate([{ transform: 'none' }, { transform: off, offset: 0.3 }, { transform: off, offset: 0.55 }, { transform: 'none' }], { duration: 2000, easing: 'cubic-bezier(.2,.7,0,1)' });
    }
    statusEl.textContent = 'cheat code accepted';
    if (petAlive) petFx('happy', 1400);
    setTimeout(refreshStatus, 2600);
  });

  // Idle for a while: the readout checks in
  let lastAct = performance.now(), dozing = false;
  const wake = () => {
    lastAct = performance.now();
    if (dozing) { dozing = false; refreshStatus(); if (P.sleep) { P.sleep = false; zz.hidden = true; petFx('happy', 650); } }
  };
  ['pointermove', 'keydown', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  setInterval(() => {
    if (!dozing && !busy && !ask.classList.contains('is-focus') && performance.now() - lastAct > 22000) {
      dozing = true; statusEl.textContent = 'still there?';
      if (petAlive && !petBusy) { P.sleep = true; zz.hidden = false; } // the dot dozes off
    }
  }, 1000);

  // ---------- The dot: the page's pet ----------
  // It starts as the tagline's full stop. After a reading pause it falls out of the sentence,
  // bounces on the floor, hops up onto the input's ruler and follows your typing.
  // When you ask, it hops to the answer, rides along as it is written, and ends it as the full stop.
  const pet = document.createElement('div');
  pet.className = 'pet';
  pet.setAttribute('aria-hidden', 'true');
  pet.hidden = true;
  const zz = document.createElement('div');
  zz.className = 'zz';
  zz.setAttribute('aria-hidden', 'true');
  zz.innerHTML = '<span>z</span><span>z</span>';
  zz.hidden = true;
  document.body.append(pet, zz);

  let petAlive = false, petBusy = false, dropP = null, wantAnswer = false;
  const P = { x: 0, y: 0, s: 12, mode: null, tw: null, fx: null, sleep: false, think: false, anim: false };
  const EASE = { lin: (t) => t, in: (t) => t * t, out: (t) => 1 - (1 - t) * (1 - t) };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function tween(x, y, dur, e, h) {
    return new Promise((res) => {
      if (P.tw) P.tw.res();
      P.tw = { fx: P.x, fy: P.y, tx: x, ty: y, t0: performance.now(), dur: Math.max(16, dur), e: EASE[e || 'lin'], h: h || 0, res };
    });
  }
  function petFx(kind, dur, p) { P.fx = { kind, t0: performance.now(), dur, p: p == null ? 1 : p }; }
  function anchorFor(m) {
    if (m === 'ruler') {
      const r = scaleEl.getBoundingClientRect();
      return { x: r.left + scrollX + Math.max(P.s * 0.6, caretX()), y: r.top + scrollY - P.s / 2 };
    }
    if (m === 'answer') {
      const c = caret.getBoundingClientRect();
      let x = c.left, y = c.top;
      const i = rv ? Math.floor((performance.now() - rv.t0) / rv.step) : -1;
      if (rv && i < rv.words.length - 1) {
        const rs = rv.words[Math.max(0, i)].getClientRects(), w = rs[rs.length - 1];
        if (w) { x = w.right; y = w.bottom + rv.off; }
      }
      return { x: x + scrollX + P.s * 0.75, y: y + scrollY - P.s / 2 - 1 };
    }
    return null;
  }
  async function hopTo(a) {
    const d = Math.hypot(a.x - P.x, a.y - P.y);
    petFx('squash', 150, 0.7);
    await wait(110);
    await tween(a.x, a.y, Math.min(760, Math.max(300, d * 1.2)), 'lin', Math.min(200, Math.max(24, d * 0.3)));
    petFx('squash', 220, 1);
  }
  async function travel(m) {
    if (m === 'ruler') wantAnswer = false;
    petBusy = true; P.mode = null; P.sleep = false; zz.hidden = true;
    let a = anchorFor(m);
    if (a && Math.hypot(a.x - P.x, a.y - P.y) > 480) {
      await hopTo({ x: (P.x + a.x) / 2, y: Math.max(P.y, a.y) });
      a = anchorFor(m);
    }
    if (a) await hopTo(a);
    P.mode = wantAnswer ? 'answer' : m; petBusy = false;
  }
  function spawn() {
    if (petAlive) return;
    P.s = Math.max(10, Math.round(fs * 0.13));
    pet.style.width = pet.style.height = P.s + 'px';
    pet.style.margin = (-P.s / 2) + 'px 0 0 ' + (-P.s / 2) + 'px';
    const r = dot.getBoundingClientRect();
    P.x = r.left + scrollX + r.width / 2;
    P.y = r.top + scrollY + r.height * 0.78 - P.s / 2;
    pet.style.transform = pose(P.x, P.y, 1, 1);
    dot.style.visibility = 'hidden';
    root.classList.add('pet-alive');
    pet.hidden = false;
    petAlive = true;
  }
  // Scale squashes towards the bottom edge, so it stays on whatever it sits on
  const pose = (x, y, sx, sy) => 'translate(' + x.toFixed(1) + 'px,' + (y + (P.s / 2) * (1 - sy)).toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  // The whole drop is worked out up front and handed to the compositor, so a busy main thread can't stutter it:
  // fall, two bounces, a beat, then one arc onto the ruler (or the answer, if you already asked)
  async function drop() {
    spawn(); petBusy = true; P.mode = null;
    const x0 = P.x, y0 = P.y, floor = scrollY + innerHeight - 22 - P.s / 2;
    const d = Math.max(40, floor - y0), h = Math.min(150, d * 0.24);
    const home = wantAnswer || mode !== 'idle' ? 'answer' : 'ruler';
    const a = anchorFor(home);
    const arc = Math.min(220, Math.max(60, Math.hypot(a.x - x0, a.y - floor) * 0.3));
    // One gravity for every part, so the fall and the bounces feel like the same body
    const G = 0.004; // px/ms²
    // A ballistic hop from a to b peaking at apex: its duration, and its pose over t (0..1), stretched with its speed
    const fly = (xa, ya, xb, yb, apex) => {
      const vy = Math.sqrt(2 * G * (ya - apex)), T = (vy + Math.sqrt(2 * G * (yb - apex))) / G;
      return [T, (t) => { const ms = t * T, st = Math.min(0.22, Math.abs(G * ms - vy) * 0.13); return [xa + (xb - xa) * t, ya - vy * ms + (G * ms * ms) / 2, 1 - st * 0.6, 1 + st]; }];
    };
    // Squash on landing, harder the faster it came down
    const land = (x, y, fell) => { const p = Math.min(1.2, Math.sqrt(2 * G * fell) * 0.65); return [100 + 60 * p, (t) => { const k = Math.sin(Math.PI * t) * 0.38 * p; return [x, y, 1 + k, 1 - k]; }]; };
    const pop = P.s * 2.5, top = Math.min(floor, a.y) - arc;
    const segs = [
      [90, (t) => { const k = Math.sin(Math.PI * t) * 0.17; return [x0, y0, 1 + k, 1 - k]; }], // a crouch, then it hops out of the sentence
      fly(x0, y0, x0, floor, y0 - pop),
      land(x0, floor, d + pop),
      fly(x0, floor, x0, floor, floor - h),
      land(x0, floor, h),
      fly(x0, floor, x0, floor, floor - h * 0.32),
      land(x0, floor, h * 0.32),
      [220, () => [x0, floor, 1, 1]],
      [140, (t) => { const k = Math.sin(Math.PI * t) * 0.27; return [x0, floor, 1 + k, 1 - k]; }],
      fly(x0, floor, a.x, a.y, top),
      land(a.x, a.y, a.y - top)
    ];
    const total = segs.reduce((n, sg) => n + sg[0], 0), frames = [];
    let t0 = 0;
    for (const [dur, f] of segs) {
      for (let ms = 0; ms < dur; ms += 1000 / 120) { const [x, y, sx, sy] = f(ms / dur); frames.push({ offset: (t0 + ms) / total, transform: pose(x, y, sx, sy) }); }
      t0 += dur;
    }
    frames.push({ offset: 1, transform: pose(a.x, a.y, 1, 1) });
    P.x = a.x; P.y = a.y; P.anim = true;
    await pet.animate(frames, { duration: total }).finished.catch(() => {});
    P.anim = false;
    P.mode = wantAnswer || mode !== 'idle' ? 'answer' : 'ruler'; petBusy = false;
    if (home === 'ruler' && mode === 'idle') {
      // Phones skip focus (it would pop the keyboard), so open the suggestions directly instead
      if (!touchUI && document.activeElement !== input) input.focus({ preventScroll: true });
      else if (touchUI) { sugsOpen = true; render(); }
      // On small screens the suggestions sit below the fold: bring them up, without pushing the input out of view
      if (innerWidth <= 640) requestAnimationFrame(() => {
        const over = Math.min(sugsEl.getBoundingClientRect().bottom + 24 - innerHeight, ask.getBoundingClientRect().top - 16);
        if (over > 0) scrollBy({ top: over, behavior: 'smooth' });
      });
    }
  }
  // No commute: it glides to the answer as it's written; a hop in flight lands there instead
  function petDeliver() {
    if (!petAlive) spawn();
    wantAnswer = true;
    if (!petBusy) { P.mode = 'answer'; P.sleep = false; zz.hidden = true; }
  }
  function petReact(kind) {
    if (!petAlive) return;
    if (kind === 'no') petFx('no', 750);
    else if (kind === 'egg') petFx('happy', 800);
    else petFx('squash', 260, 0.8);
  }
  function petFrame(now) {
    if (petAlive && !P.anim) {
      let sx = 1, sy = 1, ox = 0, oy = 0;
      if (P.tw) {
        const w = P.tw, t = Math.min(1, (now - w.t0) / w.dur), k = w.e(t);
        P.x = w.fx + (w.tx - w.fx) * k;
        P.y = w.fy + (w.ty - w.fy) * k - (w.h ? 4 * w.h * t * (1 - t) : 0);
        if (w.h) { const st = 0.14 * Math.sin(Math.PI * t); sx -= st; sy += st; }
        if (t >= 1) { P.tw = null; w.res(); }
      } else if (P.mode && !petBusy) {
        const a = anchorFor(P.mode);
        if (a) {
          const d = Math.hypot(a.x - P.x, a.y - P.y);
          if (d > 70 && P.mode === 'ruler') { petBusy = true; hopTo(a).then(() => { petBusy = false; }); } // e.g. the layout moved
          else { const k = P.mode === 'answer' ? Math.min(0.2, P.s * 2.5 / (d || 1)) : 0.28; P.x += (a.x - P.x) * k; P.y += (a.y - P.y) * k; } // capped speed: a glide, never a leap
        }
      }
      if (!P.tw) {
        if (P.sleep) { sx *= 1.28; sy *= 0.62; }
        else { const b = P.think ? Math.sin(now / 160) * 0.16 : Math.sin(now / 620) * 0.045; sx *= 1 + b; sy *= 1 - b; } // breathing, quicker while thinking
      }
      if (P.fx) {
        const f = P.fx, t = (now - f.t0) / f.dur;
        if (t >= 1) P.fx = null;
        else if (f.kind === 'squash') { const s = Math.sin(Math.PI * t) * 0.38 * f.p; sx *= 1 + s; sy *= 1 - s; }
        else if (f.kind === 'no') { ox = Math.sin(t * Math.PI * 6) * P.s * 0.55 * (1 - t); }
        else if (f.kind === 'angry') { ox = (Math.random() - 0.5) * P.s * 0.5; oy = (Math.random() - 0.5) * P.s * 0.3; }
        else if (f.kind === 'happy') { oy = -Math.abs(Math.sin(t * Math.PI * 2)) * P.s * 1.8; }
        else if (f.kind === 'squint') { const a = t < 0.12 ? t / 0.12 : t > 0.7 ? (1 - t) / 0.3 : 1; sx *= 1 + 0.32 * a; sy *= 1 - 0.55 * a; ox = t < 0.7 ? Math.sin(t * 60) * 0.6 * a : 0; }
      }
      pet.style.transform = pose(P.x + ox, P.y + oy, sx, sy);
      if (P.sleep) zz.style.transform = 'translate(' + (P.x + P.s * 0.5).toFixed(1) + 'px,' + (P.y - P.s * 2.2).toFixed(1) + 'px)';
    }
    requestAnimationFrame(petFrame);
  }
  if (!reduce) requestAnimationFrame(petFrame);

  // Poke it and it jumps; poke the full stop in the tagline and it falls out early
  pet.addEventListener('click', () => { if (P.sleep) { P.sleep = false; zz.hidden = true; } petFx('happy', 800); });
  dot.addEventListener('click', () => { if (!petAlive && !reduce) dropP = drop(); });

  // It falls out on its own once, after roughly the time it takes to read the tagline
  const READ_MS = Math.round((TAGLINE.split(' ').length / 4.5) * 1000 + 600); // a brisk read (~270 words a minute), plus a beat
  let autoT = null;
  const armDrop = () => {
    clearTimeout(autoT);
    autoT = setTimeout(() => {
      if (document.hidden) { document.addEventListener('visibilitychange', armDrop, { once: true }); return; }
      if (petAlive || reduce || ask.classList.contains('is-focus')) return;
      dropP = drop();
    }, READ_MS);
  };
  if (document.hidden) document.addEventListener('visibilitychange', armDrop, { once: true }); else armDrop();

  // For whoever opens the console
  try {
    console.log('%c.', 'color:#FF00C8;font:900 64px/1 system-ui');
    console.log('you opened the console, so you probably build things too. say hi: ' + SITE.email);
  } catch (e) {}

  // ---------- Theme ----------
  const mq = matchMedia('(prefers-color-scheme: dark)');
  try { const saved = localStorage.getItem('theme'); if (saved === 'dark' || saved === 'light') root.dataset.theme = saved; } catch (e) {}
  const effective = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');
  function syncBtn() {
    const m = effective();
    themeBtn.dataset.mode = m;
    themeBtn.setAttribute('aria-label', m === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  syncBtn();
  if (mq.addEventListener) mq.addEventListener('change', () => { syncBtn(); measure(); });
  themeBtn.addEventListener('click', () => {
    const next = effective() === 'dark' ? 'light' : 'dark';
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    // the dot reacts when the wipe reaches it: squints at the light, glows in the dark
    if (petAlive && !reduce) {
      const pr = pet.getBoundingClientRect();
      const reach = Math.min(1, Math.hypot(pr.left - x, pr.top - y) / Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
      setTimeout(() => {
        if (P.sleep) { P.sleep = false; zz.hidden = true; }
        if (next === 'light') petFx('squint', 1200);
        else { pet.classList.remove('glow'); void pet.offsetWidth; pet.classList.add('glow'); petFx('happy', 700); }
      }, 120 + 620 * reach);
    }
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncBtn();
      measure();
    };
    if (!document.startViewTransition || reduce) { apply(); wave(); return; }
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 750, easing: 'cubic-bezier(.2,.7,0,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    vt.finished.then(wave).catch(wave);
  });
})();
