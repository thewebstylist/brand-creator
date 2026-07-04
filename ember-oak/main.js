/* EMBER & OAK — hero scrub, parallax, reveals, reservation form */
(() => {
  'use strict';

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);

  const loader = $('#loader');
  const loaderFill = $('#loaderFill');
  const nav = $('#nav');
  const hero = $('#hero');
  const heroVideo = $('#heroVideo');
  const heroTitle = $('#heroTitle');
  const heroKicker = $('#heroKicker');
  const heroTag = $('#heroTag');
  const heroHint = $('#heroHint');

  /* ---------- video loading ----------
     The hero clip is fetched as a blob so every frame is buffered before
     scrubbing begins — seeking then never stalls on the network. */
  const HERO_SRC = 'assets/video/fire.mp4';
  let heroReady = false;

  function fetchAsBlob(url, onProgress) {
    return fetch(url).then(async (res) => {
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const total = +res.headers.get('Content-Length') || 0;
      if (!res.body || !total) return res.blob();
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress) onProgress(received / total);
      }
      return new Blob(chunks, { type: 'video/mp4' });
    });
  }

  function initHeroVideo() {
    return fetchAsBlob(HERO_SRC, (p) => {
      loaderFill.style.width = `${Math.round(p * 100)}%`;
    })
      .then((blob) => new Promise((resolve) => {
        heroVideo.src = URL.createObjectURL(blob);
        heroVideo.addEventListener('loadedmetadata', () => {
          heroVideo.currentTime = 0.001; // paint the first frame
          heroReady = true;
          heroVideo.classList.add('is-ready');
          resolve();
        }, { once: true });
        heroVideo.load();
      }));
  }

  /* Ambient loops (story / private) lazy-load once near the viewport. */
  function initLoops() {
    const loops = document.querySelectorAll('video.js-loop');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const v = e.target;
        io.unobserve(v);
        fetchAsBlob(v.dataset.src).then((blob) => {
          v.src = URL.createObjectURL(blob);
          v.addEventListener('canplay', () => {
            v.classList.add('is-ready');
            v.play().catch(() => {});
          }, { once: true });
          v.load();
        }).catch(() => {});
      });
    }, { rootMargin: '600px' });
    loops.forEach((v) => io.observe(v));
  }

  /* ---------- hero scrub + tracking-in title ---------- */
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let displayTime = 0;

  function heroProgress() {
    const rect = hero.getBoundingClientRect();
    const track = rect.height - innerHeight;
    return track > 0 ? clamp01(-rect.top / track) : 1;
  }

  function renderHero(p) {
    // Title tracks in over the first quarter of the scroll.
    const tin = prefersReduced ? 1 : ease(clamp01(p / 0.24));
    heroTitle.style.setProperty('--tin', tin.toFixed(3));
    heroTitle.style.setProperty('--track', `${(0.55 - 0.41 * tin).toFixed(3)}em`);
    heroTag.style.opacity = ease(clamp01((p - 0.16) / 0.18)).toFixed(3);
    heroKicker.style.opacity = ease(clamp01((p - 0.24) / 0.2)).toFixed(3);
    heroHint.style.opacity = p > 0.04 ? 0 : 1;
    nav.classList.toggle('is-visible', p > 0.62 || prefersReduced);
  }

  function tick() {
    const p = heroProgress();
    renderHero(p);
    if (heroReady && heroVideo.duration) {
      // Ease toward the target frame so the scrub feels weighted, not jittery.
      const target = p * (heroVideo.duration - 0.05);
      displayTime += (target - displayTime) * 0.14;
      if (Math.abs(displayTime - target) < 0.002) displayTime = target;
      if (Math.abs(heroVideo.currentTime - displayTime) > 1 / 120 && heroVideo.seekable.length) {
        heroVideo.currentTime = displayTime;
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- slow parallax on panel media ---------- */
  function initParallax() {
    if (prefersReduced) return;
    const els = [...document.querySelectorAll('[data-parallax]')];
    const update = () => {
      els.forEach((el) => {
        const host = el.closest('.panel');
        const r = host.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const mid = r.top + r.height / 2 - innerHeight / 2;
        el.style.transform = `translateY(${(mid * +el.dataset.parallax).toFixed(1)}px)`;
      });
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- reveals ---------- */
  function initReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18 });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  /* ---------- nav backdrop past the hero ---------- */
  function initNav() {
    addEventListener('scroll', () => {
      nav.classList.toggle('is-solid', scrollY > hero.offsetHeight - innerHeight * 0.5);
    }, { passive: true });
  }

  /* ---------- reservation form ---------- */
  function initForm() {
    const form = $('#resform');
    const date = $('#resDate');
    const party = $('#resParty');
    const time = $('#resTime');
    const done = $('#resDone');
    const doneCopy = $('#resDoneCopy');

    const today = new Date();
    date.min = today.toISOString().slice(0, 10);
    const dflt = new Date(today); dflt.setDate(dflt.getDate() + 1);
    date.value = dflt.toISOString().slice(0, 10);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!date.value) { date.classList.add('is-error'); date.focus(); return; }
      date.classList.remove('is-error');
      const when = new Date(`${date.value}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      const seats = party.options[party.selectedIndex].text.toLowerCase();
      doneCopy.textContent =
        `${when}, ${time.value} in the evening — ${seats}. ` +
        'We hold it twenty minutes past the hour; the fire will be waiting.';
      done.hidden = false;
    });
  }

  /* ---------- boot ---------- */
  function dismissLoader() {
    loaderFill.style.width = '100%';
    setTimeout(() => loader.classList.add('is-done'), 250);
  }

  initLoops();
  initReveals();
  initParallax();
  initNav();
  initForm();
  renderHero(0);

  initHeroVideo()
    .catch(() => { /* video missing — the veil and title still carry the hero */ })
    .then(() => {
      dismissLoader();
      requestAnimationFrame(tick);
    });
})();
