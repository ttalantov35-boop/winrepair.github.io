/* ==========================================================
   WinRepair Toolkit — скрипты сайта
   ========================================================== */
(function () {
  'use strict';

  const CFG = window.SITE_CONFIG || {};
  const I18N = window.I18N || { en: {}, js: { ru: {}, en: {} } };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  let lang = 'ru';
  const t = key => (I18N.js[lang] || I18N.js.ru)[key];

  /* ---------- Тост ---------- */
  const toastEl = $('.js-toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  /* ==========================================================
     Язык
     ========================================================== */
  const ruText = new Map();
  const ruAttr = new Map();
  $$('[data-i18n]').forEach(el => ruText.set(el, el.textContent));
  $$('[data-i18n-attr]').forEach(el => {
    const pairs = el.getAttribute('data-i18n-attr').split(';').map(p => p.split(':'));
    ruAttr.set(el, pairs.map(([attr, key]) => [attr, key, el.getAttribute(attr)]));
  });

  function applyLang(next) {
    lang = next === 'en' ? 'en' : 'ru';
    const dict = I18N.en;
    ruText.forEach((ru, el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = lang === 'en' && dict[key] ? dict[key] : ru;
    });
    ruAttr.forEach((pairs, el) => {
      pairs.forEach(([attr, key, ru]) => {
        el.setAttribute(attr, lang === 'en' && dict[key] ? dict[key] : ru);
      });
    });
    document.documentElement.lang = lang;
    $('.js-lang').textContent = lang === 'en' ? 'RU' : 'EN';
    document.title = lang === 'en'
      ? 'WinRepair Toolkit — free repair utility for Windows 10 and 11'
      : 'WinRepair Toolkit — бесплатная утилита для ремонта Windows 10 и 11';
    store.set('wrt-lang', lang);
    renderRelease();
    setGiscusLang();
  }

  $('.js-lang').addEventListener('click', () => applyLang(lang === 'ru' ? 'en' : 'ru'));

  const root = document.documentElement;

  /* ==========================================================
     Шапка, прогресс прокрутки, «наверх», активный пункт меню
     ========================================================== */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const toTop = $('.js-to-top');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 8);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop.classList.toggle('show', y > innerHeight * 1.2);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const navLinks = $$('.main-nav a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) sectionObserver.observe(s); });

  /* ---------- Мобильное меню ---------- */
  const burger = $('.js-burger');
  const nav = $('#main-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen'));
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); } });
  document.addEventListener('click', e => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });

  /* ==========================================================
     Hero: подсветка за курсором, наклон скриншота, плашки
     ========================================================== */
  const hero = $('.hero');
  const frame = $('.showcase-frame');
  const chips = $$('.chip');

  // шапка становится «тёмной», пока виден hero
  const heroObserver = new IntersectionObserver(entries => {
    header.classList.toggle('on-dark', entries[0].isIntersecting);
  }, { rootMargin: `-${parseInt(getComputedStyle(root).getPropertyValue('--header-h')) || 68}px 0px 0px 0px` });
  heroObserver.observe(hero);

  if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  function tilt() {
    if (reduceMotion) { frame.style.setProperty('--tilt', '0deg'); return; }
    const r = frame.getBoundingClientRect();
    // от 22° внизу экрана до 0°, когда скриншот поднялся к середине
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.6)));
    frame.style.setProperty('--tilt', (22 * (1 - p)).toFixed(2) + 'deg');
  }
  addEventListener('scroll', () => requestAnimationFrame(tilt), { passive: true });
  addEventListener('resize', tilt);
  tilt();

  chips.forEach((c, i) => setTimeout(() => c.classList.add('show'), reduceMotion ? 0 : 1300 + i * 700));

  /* ==========================================================
     GitHub: ссылки, звёзды, релизы
     ========================================================== */
  const gh = CFG.github || {};
  const ghConfigured = gh.owner && gh.repo && gh.owner !== 'your-username';
  const repoUrl = `https://github.com/${gh.owner}/${gh.repo}`;
  const releasesUrl = repoUrl + '/releases';
  const latestUrl = releasesUrl + '/latest';

  function setLink(sel, href) {
    $$(sel).forEach(a => {
      if (ghConfigured) { a.href = href; return; }
      a.href = '#';
      a.addEventListener('click', e => { e.preventDefault(); toast(t('notConfigured')); });
    });
  }
  setLink('.js-gh-repo', repoUrl);
  setLink('.js-gh-releases', releasesUrl);
  setLink('.js-gh-issues', repoUrl + '/issues');
  setLink('.js-gh-license', repoUrl + '/blob/HEAD/LICENSE');
  setLink('.js-dl-x64', latestUrl);
  setLink('.js-dl-x86', latestUrl);

  const profile = $('.js-gh-profile');
  if (ghConfigured) { profile.href = 'https://github.com/' + gh.owner; $('.js-gh-profile-text').textContent = '@' + gh.owner; }
  else setLink('.js-gh-profile', '#');

  let release = null;   // последний релиз
  let releases = [];
  let totalDownloads = 0;

  async function ghFetch(path) {
    const key = 'wrt-gh:' + path;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached && Date.now() - cached.t < 10 * 60 * 1000) return cached.d;
    } catch (e) {}
    const res = await fetch('https://api.github.com/repos/' + gh.owner + '/' + gh.repo + path, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
    return d;
  }

  const fmtSize = b => b > 1048576 ? (b / 1048576).toLocaleString(t('locale'), { maximumFractionDigits: 1 }) + ' ' + t('mb') : Math.round(b / 1024) + ' ' + t('kb');
  const exes = rel => (rel.assets || []).filter(a => /\.exe$/i.test(a.name));
  const findBy = (list, keys) => list.find(a => keys.some(k => a.name.toLowerCase().includes(String(k).toLowerCase())));

  // Определение разрядности Windows посетителя
  let arch = /WOW64|Win64|x64|amd64/i.test(navigator.userAgent) ? 'x64' : (/Windows/i.test(navigator.userAgent) ? 'x86' : 'x64');
  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['bitness']).then(v => {
      if (v.bitness === '32') arch = 'x86'; else if (v.bitness === '64') arch = 'x64';
      markRecommended();
    }).catch(() => {});
  }
  function markRecommended() {
    const a64 = $('.js-dl-x64'), a86 = $('.js-dl-x86');
    const rec = lang === 'en' ? 'your PC' : 'ваш ПК';
    [a64, a86].forEach(a => a.removeAttribute('data-rec'));
    (arch === 'x86' ? a86 : a64).setAttribute('data-rec', rec);
    a64.classList.toggle('btn-primary', arch !== 'x86'); a64.classList.toggle('btn-glow', arch !== 'x86'); a64.classList.toggle('btn-glass', arch === 'x86');
    a86.classList.toggle('btn-primary', arch === 'x86'); a86.classList.toggle('btn-glow', arch === 'x86'); a86.classList.toggle('btn-glass', arch !== 'x86');
  }

  function renderRelease() {
    markRecommended();
    const shaBox = $('.js-sha');
    if (!release) {
      const size = lang === 'en' ? '1.8 MB' : '1,8 МБ';   // размер по умолчанию, пока нет релиза
      $('.js-size').textContent = size;
      $('.js-file-meta').textContent = 'winrepair.exe, ' + size;
      if (!shaBox.dataset.ready) shaBox.textContent = t('noSha');
      return;
    }
    const A = CFG.assets || {};
    const list = exes(release);
    const x64 = findBy(list, A.x64 || ['x64']) || (list.length === 1 ? list[0] : list.find(a => !findBy([a], A.x86 || ['x86'])));
    const x86 = findBy(list, A.x86 || ['x86']);
    const ver = release.tag_name.replace(/^v/i, '');

    $('.js-version').textContent = ver;
    $('.js-version-badge').textContent = 'v' + ver;
    $('.js-release-date').textContent = new Date(release.published_at).toLocaleDateString(t('locale'));
    if (totalDownloads > 0) $('.js-dl-count').textContent = t('downloads')(totalDownloads);

    if (x64) { $('.js-dl-x64').href = x64.browser_download_url; }
    if (x86) { $('.js-dl-x86').href = x86.browser_download_url; } else if (x64) { $('.js-dl-x86').hidden = true; }
    const pick = (arch === 'x86' && x86) ? x86 : (x64 || x86);
    if (pick) {
      $('.js-size').textContent = fmtSize(pick.size);
      $('.js-file-meta').textContent = `${pick.name}, ${fmtSize(pick.size)}`;
      $$('.js-dl-primary').forEach(a => { a.href = pick.browser_download_url; });
      if (pick.digest && pick.digest.startsWith('sha256:')) { shaBox.textContent = pick.digest.slice(7); shaBox.dataset.ready = '1'; shaBox.title = pick.digest.slice(7); }
      else if (!shaBox.dataset.ready) shaBox.textContent = t('noSha');
    }

  }

  async function loadGitHub() {
    if (!ghConfigured) return;
    try {
      const repo = await ghFetch('');
      const stars = $('.js-gh-stars');
      stars.textContent = repo.stargazers_count >= 1000 ? (repo.stargazers_count / 1000).toFixed(1) + 'k' : repo.stargazers_count;
      stars.hidden = false;
    } catch (e) { /* без звёзд — не страшно */ }
    try {
      releases = (await ghFetch('/releases?per_page=10')).filter(r => !r.draft);
      release = releases.find(r => !r.prerelease) || releases[0] || null;
      totalDownloads = releases.reduce((sum, r) => sum + (r.assets || []).reduce((s, a) => s + a.download_count, 0), 0);
      renderRelease();
    } catch (e) { /* ссылки уже ведут на страницу релизов */ }
  }
  loadGitHub();

  $('.js-copy-sha').addEventListener('click', async () => {
    const el = $('.js-sha');
    if (!el.dataset.ready) { toast(t('noSha')); return; }
    try { await navigator.clipboard.writeText(el.textContent.trim()); toast(t('copied')); }
    catch (e) { toast(t('copyFail')); }
  });

  /* ==========================================================
     Комментарии: Giscus (GitHub Discussions)
     ========================================================== */
  const G = CFG.giscus || {};
  const giscusOn = G.repo && G.repoId && G.categoryId;
  const giscusTheme = () => 'transparent_dark';
  function sendGiscus(msg) {
    const frame = $('iframe.giscus-frame');
    if (frame) frame.contentWindow.postMessage({ giscus: { setConfig: msg } }, 'https://giscus.app');
  }
  function setGiscusLang() { sendGiscus({ lang }); }

  function loadGiscus() {
    const box = $('.js-comments');
    $('.js-comments-setup').remove();
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    Object.entries({
      'data-repo': G.repo, 'data-repo-id': G.repoId,
      'data-category': G.category || 'General', 'data-category-id': G.categoryId,
      'data-mapping': 'pathname', 'data-strict': '0', 'data-reactions-enabled': '1',
      'data-emit-metadata': '0', 'data-input-position': 'top',
      'data-theme': giscusTheme(), 'data-lang': lang, 'data-loading': 'lazy'
    }).forEach(([k, v]) => s.setAttribute(k, v));
    s.crossOrigin = 'anonymous'; s.async = true;
    box.append(s);
  }
  if (giscusOn) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { loadGiscus(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe($('#comments'));
  }

  /* ==========================================================
     Контакты и форма
     ========================================================== */
  const C = CFG.contacts || {};
  const notSet = a => { a.removeAttribute('target'); a.addEventListener('click', e => { e.preventDefault(); toast(t('contactNotSet')); }); };
  const emailA = $('.js-email');
  if (C.email) { emailA.href = 'mailto:' + C.email; $('.js-email-text').textContent = C.email; }
  else notSet(emailA);
  const tgA = $('.js-telegram');
  if (C.telegram) { const nick = C.telegram.replace(/^@/, ''); tgA.href = 'https://t.me/' + nick; $('.js-telegram-text').textContent = '@' + nick; }
  else notSet(tgA);
  $('.js-author').textContent = C.author || 'WinRepair Toolkit';
  $('.js-year').textContent = new Date().getFullYear();

  const form = $('.js-contact-form');
  const status = $('.js-form-status');
  function validate() {
    let ok = true;
    $$('input, textarea', form).forEach(input => {
      const valid = input.checkValidity() && input.value.trim().length > 0;
      input.closest('.field').classList.toggle('invalid', !valid);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    return ok;
  }
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => {
    if (i.closest('.field').classList.contains('invalid')) validate();
  }));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = 'form-status js-form-status';
    if (!validate()) {
      status.textContent = t('fixErrors'); status.classList.add('err');
      $('.field.invalid input, .field.invalid textarea', form).focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (CFG.formEndpoint) {
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; status.textContent = t('sending');
      try {
        const res = await fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(res.status);
        form.reset(); status.textContent = t('sent'); status.classList.add('ok');
      } catch (err) {
        status.textContent = t('sendFail'); status.classList.add('err');
      } finally { btn.disabled = false; }
      return;
    }
    if (C.email) {
      const topic = $('#cf-topic option:checked').textContent;
      const body = `${data.message}\n\n— ${data.name} <${data.email}>`;
      location.href = `mailto:${C.email}?subject=${encodeURIComponent('WinRepair Toolkit: ' + topic)}&body=${encodeURIComponent(body)}`;
      status.textContent = t('mailOpened'); status.classList.add('ok');
      return;
    }
    status.textContent = t('noContact'); status.classList.add('err');
  });

  /* ---------- Конфиденциальность ---------- */
  const dlg = $('.js-privacy');
  $$('.js-privacy-open').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }));
  $('.js-privacy-close').addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------- Старт: язык ---------- */
  const savedLang = store.get('wrt-lang');
  const initial = savedLang || ((navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en');
  if (initial !== 'ru') applyLang(initial); else { lang = 'ru'; renderRelease(); }
})();
