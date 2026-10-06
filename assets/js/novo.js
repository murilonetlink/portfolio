/* Versão nova do portfólio: rabiscos, gráficos com os dados do GitHub, zoom e índice. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svgEl = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };
  const label = (parent, str, attrs) => {
    const t = svgEl('text', attrs, parent);
    t.textContent = str;
    return t;
  };

  /* ---------- traço à mão: aleatório com semente, então o tremido é sempre o mesmo ---------- */
  const seeded = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const n1 = (n) => Math.round(n * 10) / 10;

  // curva suave passando pelos pontos (Catmull-Rom convertido em Bézier)
  const smooth = (p) => {
    let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += `C${n1(b[0] + (c[0] - a[0]) / 6)} ${n1(b[1] + (c[1] - a[1]) / 6)} ${n1(c[0] - (e[0] - b[0]) / 6)} ${n1(c[1] - (e[1] - b[1]) / 6)} ${n1(c[0])} ${n1(c[1])}`;
    }
    return d;
  };
  const poly = (p) => 'M' + p.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L');

  // laço de caneta; turns > 1 deixa a ponta passar do começo, como numa volta de verdade
  const loop = (cx, cy, rx, ry, rnd, turns = 1.12) => {
    const n = 9, a0 = rnd() * Math.PI * 2, pts = [];
    for (let i = 0; i <= Math.round(n * turns); i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      const k = 1 + (rnd() - .5) * .14 + (i / n) * .035;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smooth(pts);
  };

  // preenchimento em zigue-zague dentro de um círculo
  const hatch = (cx, cy, r, rnd, gap) => {
    const ang = (-35 + (rnd() - .5) * 14) * Math.PI / 180;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, R = r * .86;
    const j = () => (rnd() - .5) * 1.6;
    const pts = [];
    let flip = false;
    for (let t = -R; t <= R; t += gap) {
      const h = Math.sqrt(Math.max(R * R - t * t, 0));
      const a = [cx + nx * t - dx * h + j(), cy + ny * t - dy * h + j()];
      const b = [cx + nx * t + dx * h + j(), cy + ny * t + dy * h + j()];
      pts.push(...(flip ? [b, a] : [a, b]));
      flip = !flip;
    }
    return poly(pts);
  };

  // risco curto levemente torto (placar)
  const tick = (x1, y1, x2, y2, rnd, amp = 1.4) => {
    const w = () => (rnd() - .5) * amp;
    return `M${n1(x1 + w())} ${n1(y1 + w())}Q${n1((x1 + x2) / 2 + w() * 2)} ${n1((y1 + y2) / 2 + w() * 2)} ${n1(x2 + w())} ${n1(y2 + w())}`;
  };

  // linha quase reta que oscila um pouco
  const wavy = (x1, x2, y, amp, rnd, step = 40) => {
    const pts = [];
    for (let x = x1; x < x2; x += step) pts.push([x, y + (rnd() - .5) * amp]);
    pts.push([x2, y + (rnd() - .5) * amp]);
    return smooth(pts);
  };

  const arrow = (x1, y1, x2, y2, bend = 0, head = 11) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend;
    const ang = Math.atan2(y2 - cy, x2 - cx);
    const wing = (s) => `${n1(x2 - head * Math.cos(ang + s))} ${n1(y2 - head * Math.sin(ang + s))}`;
    return `M${n1(x1)} ${n1(y1)}Q${n1(cx)} ${n1(cy)} ${n1(x2)} ${n1(y2)}M${wing(.45)}L${n1(x2)} ${n1(y2)}L${wing(-.45)}`;
  };

  const setLen = (svg) => {
    let len = 0;
    $$('path', svg).forEach((p) => { len = Math.max(len, p.getTotalLength()); });
    svg.style.setProperty('--len', Math.ceil(len) + 2);
  };

  /* ---------- dados: perfil público do GitHub (murilonetlink), coletado em 06/10/2026, dias em UTC ---------- */
  const GH = {
    start: '2026-02-16',
    weeks: 17,
    days: {
      '2026-02-18': 4, '2026-02-19': 1, '2026-02-25': 6, '2026-02-26': 2,
      '2026-03-06': 4, '2026-03-13': 8, '2026-03-20': 1, '2026-03-27': 11,
      '2026-04-10': 6, '2026-04-15': 8, '2026-04-17': 5, '2026-04-18': 6,
      '2026-05-16': 1, '2026-05-19': 1, '2026-05-21': 1, '2026-05-22': 1, '2026-05-24': 1,
      '2026-05-26': 2, '2026-05-27': 1, '2026-05-29': 1, '2026-05-31': 1,
      '2026-06-10': 1, '2026-06-11': 5, '2026-06-12': 5,
    },
    repos: { '2026-02-18': '1', '2026-02-25': '2', '2026-02-26': '3 · 4', '2026-03-06': '5', '2026-04-15': '6' },
  };
  const WD = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const WD_LONG = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DAY = 864e5;
  const utc = (s) => Date.parse(s + 'T00:00:00Z');
  const dow = (s) => (new Date(utc(s)).getUTCDay() + 6) % 7; // segunda = 0
  const weekOf = (s) => Math.floor((utc(s) - utc(GH.start)) / DAY / 7);
  const fmt = (s) => s.split('-').reverse().join('/');
  const entries = Object.entries(GH.days);
  const total = entries.reduce((a, [, n]) => a + n, 0);
  const peak = Math.max(...entries.map(([, n]) => n));
  const friday = entries.reduce((a, [iso, n]) => a + (dow(iso) === 4 ? n : 0), 0);

  const calendar = () => {
    const svg = $('#chart-cal');
    if (!svg) return;
    const C = 42, L = 58, T = 62, R = 190;
    const W = L + GH.weeks * C + R, H = T + 7 * C + 36;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rnd = seeded(11);
    const gx = (w) => L + w * C + C / 2, gy = (d) => T + d * C + C / 2;
    const radius = (n) => 6.5 + 13 * Math.sqrt((n - 1) / (peak - 1));
    const right = L + GH.weeks * C;

    svgEl('path', { class: 'band', d: wavy(L - 8, right + 6, gy(4), 5, rnd, 60) }, svg);

    WD.forEach((n, d) => label(svg, n, { class: 't-lab', x: L - 14, y: gy(d) + 4, 'text-anchor': 'end' }));
    for (let w = 0; w < GH.weeks; w++) {
      const monday = new Date(utc(GH.start) + w * 7 * DAY);
      if (w === 0 || monday.getUTCDate() <= 7) label(svg, MONTHS[monday.getUTCMonth()], { class: 't-lab', x: L + w * C + 4, y: 22 });
    }

    for (let w = 0; w < GH.weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const iso = new Date(utc(GH.start) + (w * 7 + d) * DAY).toISOString().slice(0, 10);
        if (!GH.days[iso]) svgEl('circle', { class: 'pencil', cx: n1(gx(w) + (rnd() - .5) * 2), cy: n1(gy(d) + (rnd() - .5) * 2), r: 1.4 }, svg);
      }
    }

    const tip = $('#cal-tip');
    const tipDefault = tip ? tip.textContent : '';
    entries.forEach(([iso, n], i) => {
      const cx = gx(weekOf(iso)), cy = gy(dow(iso)), r = radius(n);
      const g = svgEl('g', { class: 'mark', style: `--i:${i}` }, svg);
      svgEl('path', { class: 'ink', d: loop(cx, cy, r, r, rnd) }, g);
      svgEl('path', { class: 'ink ink--thin', d: loop(cx, cy, r * .95, r * .95, rnd, 1.05) }, g);
      svgEl('path', { class: 'ink ink--thin', d: hatch(cx, cy, r, rnd, Math.max(2.6, 7 - n * .45)) }, g);
      svgEl('circle', { cx, cy, r: C / 2 - 2, fill: 'transparent' }, g);
      const say = () => { if (tip) tip.textContent = `${fmt(iso)} · ${WD_LONG[dow(iso)]} · ${n} ${n === 1 ? 'contribuição' : 'contribuições'}`; };
      g.addEventListener('mouseenter', say);
      g.addEventListener('click', say);
      g.addEventListener('mouseleave', () => { if (tip) tip.textContent = tipDefault; });
    });

    Object.entries(GH.repos).forEach(([iso, txt]) => {
      const r = radius(GH.days[iso]);
      label(svg, txt, { class: 't-hand t-red note', x: n1(gx(weekOf(iso)) + r * .7 + 4), y: n1(gy(dow(iso)) - r * .7 - 2) });
    });

    const note = (str, x, y, cls = '') => label(svg, str, { class: `t-hand note ${cls}`, x, y });
    const pen = (d) => svgEl('path', { class: 'pen note', d }, svg);

    note(`sextas: ${friday} de ${total}`, right + 36, gy(4) + 10);
    pen(arrow(right + 30, gy(4) + 2, right - 6, gy(4), -6));

    note('segundas: nenhuma', right + 36, gy(0) + 10);

    const [peakIso] = entries.find(([, n]) => n === peak);
    const px = gx(weekOf(peakIso));
    note(`recorde: ${peak}`, px - 36, gy(6) + 14);
    pen(arrow(px, gy(6) - 6, px, gy(dow(peakIso)) + radius(peak) + 6, 0, 10));

    // março teve quatro sextas seguidas (6, 13, 20 e 27)
    const mx = gx(3) + C / 2;
    pen(loop(mx, gy(4), 2 * C + 12, C / 2 - 2, rnd, 1.06));
    note('quatro sextas seguidas', gx(2) - 6, gy(2) + 6, 't-red');
    pen(arrow(mx, gy(2) + 16, mx, gy(4) - C / 2 - 6, 0, 10));
  };

  const tally = () => {
    const svg = $('#chart-tally');
    if (!svg) return;
    const rowH = 40, L = 54, T = 14, W = 500, H = T + 7 * rowH + 10;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rnd = seeded(23), counts = Array(7).fill(0);
    entries.forEach(([iso, n]) => { counts[dow(iso)] += n; });
    const y = (d) => T + d * rowH + rowH / 2;

    svgEl('path', { class: 'band', d: wavy(L - 10, W - 12, y(4), 5, rnd, 60) }, svg);

    let idx = 0;
    counts.forEach((n, d) => {
      label(svg, WD[d], { class: 't-lab', x: L - 14, y: y(d) + 4, 'text-anchor': 'end' });
      if (!n) { label(svg, 'nada', { class: 't-hand', x: L, y: y(d) + 8 }); return; }
      let x = L;
      for (let g = 0; g < Math.floor(n / 5); g++) {
        const grp = svgEl('g', { class: 'mark', style: `--i:${idx++}` }, svg);
        for (let i = 0; i < 4; i++) svgEl('path', { class: 'ink', d: tick(x + i * 9, y(d) - 14, x + i * 9, y(d) + 14, rnd) }, grp);
        svgEl('path', { class: 'ink', d: tick(x - 6, y(d) + 10, x + 33, y(d) - 10, rnd) }, grp);
        x += 46;
      }
      const rest = n % 5;
      if (rest) {
        const grp = svgEl('g', { class: 'mark', style: `--i:${idx++}` }, svg);
        for (let i = 0; i < rest; i++) svgEl('path', { class: 'ink', d: tick(x + i * 9, y(d) - 14, x + i * 9, y(d) + 14, rnd) }, grp);
        x += rest * 9;
      }
      label(svg, String(n), { class: 't-num', x: x + 12, y: y(d) + 5 });
    });
  };

  const ledger = () => {
    const body = $('#ledger tbody');
    if (!body) return;
    entries.forEach(([iso, n]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmt(iso)}</td><td>${WD[dow(iso)]}</td><td>${n}</td>`;
      body.append(tr);
    });
  };

  /* ---------- anotações à mão sobre as capturas de tela (coordenadas em pixels da imagem) ---------- */
  const OVERLAYS = {
    lavazap: {
      ink: 'var(--red)', size: 66, head: 34,
      notes: [
        { x: 1560, y: 400, lines: ['uma coluna', 'por box'], arrow: [1556, 345, 1531, 300, -22] },
        { x: 1560, y: 660, lines: ['um cartão', 'por carro'], arrow: [1554, 604, 1512, 538, -22] },
      ],
    },
    aidoc: {
      ink: 'var(--yellow)', size: 56, head: 30,
      notes: [
        { x: 296, y: 560, lines: ['um módulo por', 'tecnologia'], arrow: [290, 505, 244, 342, 24] },
        { x: 1288, y: 470, lines: ['contexto + um', '.zip por fluxo'], arrow: [1284, 415, 1207, 342, 24] },
      ],
    },
  };

  const overlays = () => {
    $$('[data-overlay]').forEach((svg) => {
      const cfg = OVERLAYS[svg.dataset.overlay];
      if (!cfg) return;
      cfg.notes.forEach((n) => {
        const t = svgEl('text', { x: n.x, y: n.y, fill: cfg.ink, 'font-size': cfg.size }, svg);
        n.lines.forEach((ln, i) => {
          const s = svgEl('tspan', { x: n.x, dy: i ? cfg.size * .95 : 0 }, t);
          s.textContent = ln;
        });
        svgEl('path', { d: arrow(...n.arrow, cfg.head), stroke: cfg.ink }, svg);
      });
    });
  };

  /* ---------- rabiscos (círculo, sublinhado e setas) ---------- */
  const arrows = () => {
    $$('svg[data-arrow]').forEach((svg) => {
      const [x1, y1, x2, y2, bend] = svg.dataset.arrow.split(',').map(Number);
      svgEl('path', { d: arrow(x1, y1, x2, y2, bend) }, svg);
      svg.classList.add('scribble');
      setLen(svg);
    });
  };

  const decorate = () => {
    $$('[data-scribble]').forEach((host, i) => {
      const rnd = seeded(100 + i);
      const svg = svgEl('svg', { class: 'scribble', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
      host.append(svg);
      const { width: w, height: h } = svg.getBoundingClientRect();
      if (!w || !h) { svg.remove(); return; }
      svg.setAttribute('viewBox', `0 0 ${n1(w)} ${n1(h)}`);
      const d = host.dataset.scribble === 'circle'
        ? loop(w / 2, h / 2, w / 2 - 2, h / 2 - 2, rnd, 1.1)
        : wavy(2, w - 2, h / 2, h * .5, rnd, 26);
      svgEl('path', { d }, svg);
      setLen(svg);
    });
  };

  /* ---------- ampliar imagem ---------- */
  const zoom = () => {
    const dlg = $('#zoom');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const img = $('img', dlg);
    $$('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
      img.src = b.dataset.zoom;
      img.alt = ($('img', b) || {}).alt || '';
      dlg.showModal();
    }));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  };

  /* ---------- pastas: folha A3 dos principais e caixas do arquivo ---------- */
  const pastas = () => {
    $$('[data-pasta]').forEach((btn) => {
      const dlg = document.getElementById(btn.dataset.pasta);
      if (!dlg || typeof dlg.showModal !== 'function') return;
      btn.addEventListener('click', () => dlg.showModal());
    });
    $$('dialog.dossie').forEach((dlg) => dlg.addEventListener('click', (e) => {
      const r = dlg.getBoundingClientRect();
      const onBackdrop = e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
      if (onBackdrop || e.target.closest('a[href^="#"]')) dlg.close();
    }));
  };

  /* ---------- índice: destaca a página em que você está ---------- */
  const spy = () => {
    if (!('IntersectionObserver' in window)) return;
    const links = new Map($$('.strip nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = links.get(e.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['capa', 'quem', 'lavazap', 'aidoc', 'arquivo', 'dados', 'palco', 'contato'].forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
  };

  /* ---------- entra em cena quando aparece na tela ---------- */
  const reveal = (targets) => {
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: .3 });
    targets.forEach((t) => io.observe(t));
  };

  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  ready(() => {
    const year = $('#ano');
    if (year) year.textContent = new Date().getFullYear();

    arrows();
    overlays();
    calendar();
    tally();
    ledger();
    zoom();
    pastas();
    spy();
    reveal($$('.chart, .fig__over'));

    // círculo e sublinhado dependem do tamanho real do texto, então esperam a fonte carregar
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r));
    loaded.then(() => (document.fonts ? document.fonts.ready : null)).then(() => {
      decorate();
      reveal($$('.scribble'));
    });
  });
})();
