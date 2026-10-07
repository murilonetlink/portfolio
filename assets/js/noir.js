/* Versão noir do portfólio: rabiscos, máquina de escrever, lanterna, zoom, arquivo e índice. */
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

  /* ---------- anotações à mão sobre as capturas de tela (coordenadas em pixels da imagem) ---------- */
  const OVERLAYS = {
    lavazap: {
      ink: 'var(--blood-l)', size: 66, head: 34,
      notes: [
        { x: 1560, y: 400, lines: ['uma coluna', 'por box'], arrow: [1556, 345, 1531, 300, -22] },
        { x: 1560, y: 660, lines: ['um cartão', 'por carro'], arrow: [1554, 604, 1512, 538, -22] },
      ],
    },
    aidoc: {
      ink: 'var(--lamp)', size: 56, head: 30,
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

  /* ---------- máquina de escrever na frase da capa ---------- */
  const typewriter = () => {
    const el = $('[data-type]');
    if (!el || reduce) return;
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    const live = document.createElement('span');
    live.setAttribute('aria-hidden', 'true');
    const chars = [];
    text.split(' ').forEach((word, i) => {
      if (i) live.append(' ');
      const w = document.createElement('span');
      w.className = 'w';
      [...word].forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'c';
        c.textContent = ch;
        chars.push(c);
        w.append(c);
      });
      live.append(w);
    });
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.textContent = '';
    el.classList.add('tw');
    el.append(sr, live);

    let i = 0;
    const next = () => {
      if (i > 0) chars[i - 1].classList.remove('cur');
      if (i >= chars.length) return;
      chars[i].classList.add('on', 'cur');
      const ch = chars[i++].textContent;
      setTimeout(next, /[,.]/.test(ch) ? 220 : 28 + Math.random() * 38);
    };
    setTimeout(next, 700);
  };

  /* ---------- lanterna: luz que segue o mouse em toda a página, menos na contracapa ---------- */
  const lanterna = () => {
    if (reduce || !matchMedia('(hover: hover)').matches) return;
    const el = document.createElement('div');
    el.className = 'lanterna';
    el.setAttribute('aria-hidden', 'true');
    document.body.append(el);

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, seen = false, ticking = false;
    const step = () => {
      x += (tx - x) * .14;
      y += (ty - y) * .14;
      el.style.transform = `translate3d(${n1(x)}px, ${n1(y)}px, 0)`;
      raf = Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3 ? requestAnimationFrame(step) : 0;
    };
    const underFooter = (t) => !!(t && t.closest && t.closest('.verso'));

    addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) { seen = true; x = tx; y = ty; }
      el.classList.add('on');
      el.classList.toggle('off', underFooter(e.target));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => el.classList.remove('on'));

    // com o mouse parado, a página rola por baixo dele
    addEventListener('scroll', () => {
      if (!seen || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        el.classList.toggle('off', underFooter(document.elementFromPoint(tx, ty)));
      });
    }, { passive: true });
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

  /* ---------- pastas: folha A3 dos principais e pastas do arquivo ---------- */
  const pastas = () => {
    $$('.arq__well').forEach((well) => {
      const folhas = $$('.folha', well);
      well.style.setProperty('--n', folhas.length);
      folhas.forEach((f, i) => f.style.setProperty('--i', i));
    });
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
    ['capa', 'quem', 'lavazap', 'aidoc', 'arquivo', 'palco', 'contato'].forEach((id) => {
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
    typewriter();
    zoom();
    pastas();
    spy();
    lanterna();
    reveal($$('.fig__over, .stamp, .rv'));

    // círculo e sublinhado dependem do tamanho real do texto, então esperam a fonte carregar
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r));
    loaded.then(() => (document.fonts ? document.fonts.ready : null)).then(() => {
      decorate();
      reveal($$('.scribble'));
    });
  });
})();
