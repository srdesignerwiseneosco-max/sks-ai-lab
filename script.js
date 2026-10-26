(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const thumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const watchUrl = v => v.type === 'short' ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shortTitle = t => { let x = (t.split(/\s*[\/|]\s*/).find(s => s.replace(/[^\p{L}]/gu, '').length > 3) || t).replace(/^[\d.\-\s]+/, '').replace(/["“”]/g, '').trim(); return x.length > 46 ? x.slice(0, 44).trim() + '…' : x; };

  /* ---------- Nav, theme ---------- */
  const nav = $('.nav'), toggle = $('.nav-toggle'), links = $('#nav-links');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }));
  $('.theme-toggle').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('sks-theme', t); } catch (e) {}
  });

  /* ---------- Reveal ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: 0.1 }) : null;
  const observe = el => io ? io.observe(el) : el.classList.add('visible');
  $$('.reveal').forEach(observe);

  /* ---------- Typing headline ---------- */
  const words = ['Sci-Fi Battles', 'Mythology Epics', 'Horror Mysteries', 'Luxury Ad Films', 'Disaster Movies', 'Cinematic Shorts'];
  const typing = $('#typing');
  if (typing && !reduce) {
    let w = 0, i = words[0].length, del = true;
    const tick = () => {
      const word = words[w];
      i += del ? -1 : 1;
      typing.textContent = word.slice(0, i);
      let delay = del ? 45 : 85;
      if (!del && i === word.length) { del = true; delay = 1600; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  /* ---------- Hero tilt + thumbs ---------- */
  $$('[data-thumb]').forEach(img => { img.src = thumb(img.dataset.thumb, 'maxresdefault'); img.onerror = () => { img.onerror = null; img.src = thumb(img.dataset.thumb); }; });
  const tilt = $('#tilt');
  if (tilt && !reduce && matchMedia('(pointer:fine)').matches) {
    $('.hero').addEventListener('mousemove', e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      tilt.style.transform = `rotateY(${-14 + x * 16}deg) rotateX(${6 - y * 10}deg)`;
    });
  }

  /* ---------- Player modal ---------- */
  const dlg = $('#player'), frame = $('#player-frame');
  const embed = (id, autoplay = 1) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay}&rel=0&modestbranding=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  let lastFocus = null;
  function openPlayer(v) {
    if (!dlg.showModal) { open(watchUrl(v), '_blank', 'noopener'); return; }
    lastFocus = document.activeElement;
    frame.classList.toggle('vertical', v.type === 'short');
    frame.innerHTML = embed(v.id);
    $('#player-title').textContent = v.title;
    $('#player-yt').href = watchUrl(v);
    dlg.showModal();
    $('#player-close').focus();
  }
  const closePlayer = () => dlg.close();
  dlg.addEventListener('close', () => { frame.innerHTML = ''; lastFocus && lastFocus.focus(); });
  $('#player-close').addEventListener('click', closePlayer);
  dlg.addEventListener('click', e => { if (e.target === dlg) closePlayer(); });

  /* ---------- Data ---------- */
  fetch('videos.json').then(r => r.json()).then(init).catch(() => {
    $('#vgrid').innerHTML = `<p class="empty">Couldn't load videos. <a class="link" href="https://www.youtube.com/@TheSKSAILab/videos" target="_blank" rel="noopener">Watch on YouTube ↗</a></p>`;
  });

  function init(data) {
    const { videos, categories } = data;
    const catById = Object.fromEntries(categories.map(c => [c.id, c]));
    $('#stat-cats') && ($('#stat-cats').textContent = categories.length);

    // Featured
    const f = videos.find(v => v.id === data.featured) || videos[0];
    const fImg = $('#featured-thumb');
    fImg.src = thumb(f.id, 'maxresdefault'); fImg.onerror = () => { fImg.onerror = null; fImg.src = thumb(f.id); };
    fImg.alt = `Thumbnail: ${f.title}`;
    $('#featured-title').textContent = f.title;
    $('#featured-cat').textContent = `${catById[f.category].icon} ${catById[f.category].name}${f.duration ? ' · ' + f.duration : ''}`;
    $('#featured-yt').href = watchUrl(f);
    const playFeatured = () => { $('.featured-player').innerHTML = embed(f.id); };
    $('#featured-player').addEventListener('click', playFeatured);
    $('#featured-play').addEventListener('click', playFeatured);

    // Pills
    const pills = $('#pills');
    const allPill = { id: 'all', name: 'All videos', icon: '🎬', count: videos.length };
    [allPill, ...categories].forEach(c => {
      const b = document.createElement('button');
      b.className = 'pill'; b.type = 'button'; b.dataset.cat = c.id;
      b.setAttribute('aria-pressed', c.id === 'all' ? 'true' : 'false');
      b.innerHTML = `<span class="ico" aria-hidden="true">${c.icon}</span>${esc(c.name)}<span class="n">${c.count}</span>`;
      b.addEventListener('click', () => setCat(c.id));
      pills.appendChild(b);
    });

    // Grid
    const grid = $('#vgrid'), more = $('#load-more'), count = $('#result-count'), search = $('#search');
    const PAGE = 12;
    let state = { cat: 'all', q: '', shown: PAGE };
    function filtered() {
      const q = state.q.trim().toLowerCase();
      return videos.filter(v => (state.cat === 'all' || v.category === state.cat) &&
        (!q || v.title.toLowerCase().includes(q) || catById[v.category].name.toLowerCase().includes(q)));
    }
    function card(v, i) {
      const c = catById[v.category];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vcard' + (v.type === 'short' ? ' short' : '');
      b.style.animationDelay = `${(i % PAGE) * 35}ms`;
      b.setAttribute('aria-label', `Play: ${v.title}`);
      b.innerHTML = `<div class="vthumb">
          <img src="${thumb(v.id)}" alt="" loading="lazy" width="480" height="270" />
          <span class="badge cat">${c.icon} ${esc(c.name)}</span>
          ${v.popular ? '<span class="badge hot">🔥 Popular</span>' : ''}
          <span class="badge dur">${v.type === 'short' ? 'SHORT' : esc(v.duration || '')}</span>
          <span class="play" aria-hidden="true"></span>
        </div>
        <div class="vbody"><h3>${esc(v.title)}</h3><p>${c.icon} ${esc(c.name)}</p></div>`;
      b.addEventListener('click', () => openPlayer(v));
      return b;
    }
    function render() {
      const list = filtered();
      grid.innerHTML = '';
      if (!list.length) grid.innerHTML = `<p class="empty">No videos match “${esc(state.q)}”.</p>`;
      list.slice(0, state.shown).forEach((v, i) => grid.appendChild(card(v, i)));
      more.hidden = list.length <= state.shown;
      more.textContent = `Show more (${list.length - state.shown} left)`;
      const label = state.cat === 'all' ? 'all categories' : catById[state.cat].name;
      count.textContent = `${list.length} video${list.length === 1 ? '' : 's'} · ${label}${state.q ? ` · “${state.q}”` : ''}`;
    }
    function setCat(id) {
      state.cat = id; state.shown = PAGE;
      $$('.pill', pills).forEach(p => p.setAttribute('aria-pressed', String(p.dataset.cat === id)));
      render();
    }
    more.addEventListener('click', () => {
      const from = state.shown; state.shown += PAGE; render();
      const cards = $$('.vcard', grid); cards[from] && cards[from].focus({ preventScroll: true });
    });
    let t; search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value; state.shown = PAGE; render(); }, 120); });
    render();

    // Feature cards
    const fgrid = $('#fgrid');
    categories.forEach(c => {
      const vs = videos.filter(v => v.category === c.id);
      const top = vs.find(v => v.popular) || vs[0];
      const ex = vs.slice(0, 2).map(v => `<b>${esc(shortTitle(v.title))}</b>`).join(' · ');
      const el = document.createElement('article');
      el.className = 'fcard reveal';
      el.innerHTML = `<div class="bgthumb" style="background-image:url('${thumb(top.id)}')"></div>
        <div class="fic" aria-hidden="true">${c.icon}</div>
        <h3>${esc(c.name)}</h3>
        <p class="cnt">${c.count} ${c.id === 'shorts' ? 'shorts' : 'videos'}</p>
        <p>${esc(c.desc)}</p>
        <ul>${c.covers.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="ex">Watch: ${ex}</p>
        <button class="go" type="button">Browse ${esc(c.name)} →</button>`;
      $('.go', el).addEventListener('click', () => { setCat(c.id); $('#videos').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
      fgrid.appendChild(el); observe(el);
    });
  }

  /* ---------- Particles ---------- */
  const canvas = $('#particles');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w, h, ps = [];
    const mouse = { x: -1e4, y: -1e4 };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ps = Array.from({ length: Math.min(90, Math.floor(w * h / 16000)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.5 + .5 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const light = document.documentElement.dataset.theme === 'light';
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 110) { p.x += dx / d; p.y += dy / d; }
        ctx.fillStyle = light ? 'rgba(60,50,140,.5)' : 'rgba(200,210,255,.75)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j], ex = p.x - q.x, ey = p.y - q.y, dd = ex * ex + ey * ey;
          if (dd < 15000) {
            ctx.strokeStyle = `rgba(${light ? '90,70,200' : '139,140,246'},${(1 - dd / 15000) * .35})`;
            ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    const hero = $('.hero');
    hero.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e4; });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize(); draw();
  }
})();
