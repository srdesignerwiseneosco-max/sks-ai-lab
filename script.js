/* sks Ai Lab — v3 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const thumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const watchUrl = v => v.type === 'short' ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const shortTitle = t => {
    let x = (t.split(/\s*[\/|]\s*/).find(s => s.replace(/[^\p{L}]/gu, '').length > 3) || t)
      .replace(/^[\d.\-\s]+/, '').replace(/["“”]/g, '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s{2,}/g, ' ').trim();
    return x.length > 46 ? x.slice(0, 44).trim() + '…' : x;
  };
  const maxres = (img, id) => { img.src = thumb(id, 'maxresdefault'); img.onerror = () => { img.onerror = null; img.src = thumb(id); }; };

  /* intro */
  requestAnimationFrame(() => setTimeout(() => document.documentElement.classList.add('loaded'), 60));

  /* nav */
  const nav = $('.nav'), toggle = $('.nav-toggle'), links = $('#nav-links');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const setMenu = open => { links.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  $('.theme-toggle').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('sks-theme', t); } catch (e) {}
  });

  /* reveal */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }) : null;
  const observe = el => io ? io.observe(el) : el.classList.add('visible');
  $$('.reveal').forEach(observe);

  /* cursor glow */
  const glow = $('.cursor-glow');
  if (fine && !reduce) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, running = false;
    const loop = () => { cx += (x - cx) * 0.14; cy += (y - cy) * 0.14; glow.style.transform = `translate3d(${cx}px,${cy}px,0)`; if (Math.abs(x - cx) + Math.abs(y - cy) > 0.5) requestAnimationFrame(loop); else running = false; };
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; glow.classList.add('on'); if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
  } else glow.remove();

  /* player */
  const dlg = $('#player'), frame = $('#player-frame');
  const embed = id => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  let lastFocus = null;
  function openPlayer(v) {
    if (typeof dlg.showModal !== 'function') { open(watchUrl(v), '_blank', 'noopener'); return; }
    lastFocus = document.activeElement;
    frame.classList.toggle('vertical', v.type === 'short');
    frame.innerHTML = embed(v.id);
    $('#player-title').textContent = v.title;
    $('#player-yt').href = watchUrl(v);
    dlg.showModal();
    $('#player-close').focus();
  }
  dlg.addEventListener('close', () => { frame.innerHTML = ''; lastFocus && lastFocus.focus(); });
  $('#player-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  fetch('videos.json').then(r => r.json()).then(init).catch(() => {
    $('#rows').innerHTML = `<p class="container empty">Couldn't load the library. <a class="link" href="https://www.youtube.com/@TheSKSAILab/videos" target="_blank" rel="noopener">Watch on YouTube</a></p>`;
  });

  function init(data) {
    const { videos, categories, channel } = data;
    const cat = Object.fromEntries(categories.map(c => [c.id, c]));
    const byId = Object.fromEntries(videos.map(v => [v.id, v]));
    const longs = videos.filter(v => v.type !== 'short');
    $$('[data-stat]').forEach(el => { const k = el.dataset.stat; el.textContent = k === 'genres' ? categories.length : (channel[k] || el.textContent); });

    /* hero slideshow */
    const slideIds = ['5Vnapqam9xk', 'PwADwnbOELY', '0xodN6TWsQ0', 'IqcX8OT-2Ww', 'jTuWgL3q94I'].filter(id => byId[id]);
    const bg = $('#hero-bg'), capTitle = $('#cap-title'), dots = $('#cap-dots');
    const first = $('.slide', bg); first.dataset.id = slideIds[0];
    $('img', first).onerror = function () { this.onerror = null; this.src = thumb(slideIds[0]); };
    slideIds.slice(1).forEach(id => { const s = document.createElement('div'); s.className = 'slide'; s.dataset.id = id; bg.appendChild(s); });
    dots.innerHTML = slideIds.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');
    capTitle.textContent = shortTitle(byId[slideIds[0]].title);
    const slides = $$('.slide', bg);
    const ensureImg = s => { if (!$('img', s)) { const img = new Image(); img.alt = ''; img.decoding = 'async'; maxres(img, s.dataset.id); s.appendChild(img); } };
    let cur = 0;
    if (!reduce && slides.length > 1) {
      setTimeout(() => ensureImg(slides[1]), 2500);
      setInterval(() => {
        if (document.hidden) return;
        const next = (cur + 1) % slides.length;
        ensureImg(slides[next]); ensureImg(slides[(next + 1) % slides.length]);
        slides[cur].classList.remove('is-active'); slides[next].classList.add('is-active');
        $$('i', dots).forEach((d, i) => d.classList.toggle('on', i === next));
        capTitle.style.opacity = 0;
        setTimeout(() => { capTitle.textContent = shortTitle(byId[slides[next].dataset.id].title); capTitle.style.opacity = 1; }, 400);
        cur = next;
      }, 6000);
    }

    /* now showing */
    const f = byId[data.featured] || longs[0], fc = cat[f.category];
    maxres($('#ns-thumb'), f.id);
    $('#ns-thumb').alt = `Thumbnail: ${f.title}`;
    $('#ns-genre').innerHTML = `${icon('g-' + fc.id)}${esc(fc.name)}`;
    $('#ns-title-text').textContent = shortTitle(f.title);
    $('#ns-full').textContent = f.title;
    $('#ns-runtime').textContent = f.duration || '—';
    $('#ns-yt').href = watchUrl(f);
    const playInline = () => { const m = $('#ns-play'); if (!$('iframe', m)) m.insertAdjacentHTML('beforeend', embed(f.id)); };
    $('#ns-play').addEventListener('click', playInline);
    $('#ns-play-btn').addEventListener('click', () => { playInline(); $('#ns-play').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
    $('#hero-watch').addEventListener('click', () => openPlayer(f));

    /* marquee */
    const mItems = longs.slice(0, 16).map(v => `<span>${esc(shortTitle(v.title))}${icon('i-star')}</span>`).join('');
    $('#marquee').innerHTML = `<div style="display:flex">${mItems}</div><div style="display:flex" aria-hidden="true">${mItems}</div>`;

    /* cards */
    const card = v => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card' + (v.type === 'short' ? ' short' : '');
      b.setAttribute('aria-label', `Play: ${v.title}`);
      b.innerHTML = `<div class="card-media"><img src="${thumb(v.id)}" alt="" loading="lazy" decoding="async" width="480" height="360" />
        ${v.popular ? '<span class="hot">Popular</span>' : ''}
        ${v.type === 'short' ? '<span class="dur">SHORT</span>' : (v.duration ? `<span class="dur">${esc(v.duration)}</span>` : '')}
        <span class="pl">${icon('i-play')}</span></div>
        <p class="card-title">${esc(v.title)}</p>`;
      b.addEventListener('click', () => openPlayer(v));
      return b;
    };

    /* rows */
    const rows = $('#rows'), chips = $('#chips');
    categories.forEach(c => {
      const vs = videos.filter(v => v.category === c.id);
      if (!vs.length) return;
      const row = document.createElement('section');
      row.className = 'row reveal'; row.id = 'row-' + c.id; row.setAttribute('aria-labelledby', `rh-${c.id}`);
      row.innerHTML = `<div class="container row-head"><h3 id="rh-${c.id}"><span class="gi">${icon('g-' + c.id)}</span>${esc(c.name)} <small>${vs.length} ${c.id === 'shorts' ? 'shorts' : 'videos'}</small></h3>
        <div class="row-nav"><button class="icon-btn" type="button" data-dir="-1" aria-label="Scroll ${esc(c.name)} left">${icon('i-left')}</button><button class="icon-btn" type="button" data-dir="1" aria-label="Scroll ${esc(c.name)} right">${icon('i-right')}</button></div></div>
        <div class="track${c.id === 'shorts' ? ' shorts' : ''}" tabindex="-1"></div>`;
      const track = $('.track', row);
      vs.forEach(v => track.appendChild(card(v)));
      const [prev, next] = $$('.row-nav button', row);
      const upd = () => { prev.disabled = track.scrollLeft < 8; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; };
      $$('.row-nav button', row).forEach(btn => btn.addEventListener('click', () => track.scrollBy({ left: +btn.dataset.dir * track.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' })));
      track.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); setTimeout(upd, 100);
      rows.appendChild(row); observe(row);

      const chip = document.createElement('a');
      chip.className = 'chip'; chip.href = '#row-' + c.id;
      chip.innerHTML = `${icon('g-' + c.id)}${esc(c.name)}<small>${vs.length}</small>`;
      chip.addEventListener('click', () => { if (search.value) { search.value = ''; runSearch(); } $$('.chip', chips).forEach(x => x.removeAttribute('aria-current')); chip.setAttribute('aria-current', 'true'); });
      chips.appendChild(chip);
    });

    /* search */
    const search = $('#search'), grid = $('#search-grid'), count = $('#result-count');
    count.textContent = `${videos.length} titles across ${categories.length} genres`;
    function runSearch() {
      const q = search.value.trim().toLowerCase();
      if (!q) { grid.hidden = true; grid.innerHTML = ''; rows.hidden = false; count.textContent = `${videos.length} titles across ${categories.length} genres`; return; }
      const list = videos.filter(v => v.title.toLowerCase().includes(q) || cat[v.category].name.toLowerCase().includes(q));
      rows.hidden = true; grid.hidden = false; grid.innerHTML = '';
      if (!list.length) grid.innerHTML = `<p class="empty">No titles match “${esc(search.value)}”.</p>`;
      list.forEach(v => grid.appendChild(card(v)));
      count.textContent = `${list.length} result${list.length === 1 ? '' : 's'} for “${search.value}”`;
    }
    let t; search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(runSearch, 140); });

    /* genres */
    const gg = $('#genre-grid');
    categories.forEach(c => {
      const vs = videos.filter(v => v.category === c.id);
      if (!vs.length) return;
      const top = vs.find(v => v.popular) || vs[0];
      const el = document.createElement('article');
      el.className = 'genre reveal';
      el.style.setProperty('--bgimg', `url('${thumb(top.id)}')`);
      el.innerHTML = `<span class="gi">${icon('g-' + c.id)}</span>
        <h3>${esc(c.name)}</h3><p class="cnt">${vs.length} ${c.id === 'shorts' ? 'shorts' : 'videos'}</p>
        <p>${esc(c.desc)}</p>
        <ul>${c.covers.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="ex">e.g. ${vs.slice(0, 2).map(v => `<b>${esc(shortTitle(v.title))}</b>`).join(' · ')}</p>
        <a class="go" href="#row-${c.id}">Browse ${esc(c.name)}${icon('i-arrow')}</a>`;
      gg.appendChild(el); observe(el);
    });

    /* CTA collage */
    $('#cta-bg').innerHTML = longs.slice(0, 18).map(v => `<img src="${thumb(v.id, 'mqdefault')}" alt="" loading="lazy" decoding="async" width="320" height="180" />`).join('');
  }
})();
