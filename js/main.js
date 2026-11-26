/* ═══════════════════════════════════════════════════════════
   ARCHER — UI logic: boot · nav · reveal · typer · counters
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── 1. BOOT ─────────── */
  (function boot() {
    var el = $('#boot'), log = $('#bootLog');
    if (!el) return;

    var lines = [
      'ARCHER KERNEL v3.0 …',
      'loading tools … ok',
      'memory: ready · queue: idle',
      'HUD link: online'
    ];

    if (reduce) { el.classList.add('is-done'); return; }

    var i = 0;
    function next() {
      if (i >= lines.length) {
        setTimeout(function () {
          el.classList.add('is-done');
          document.body.classList.add('booted');
        }, 260);
        return;
      }
      if (log) log.textContent = lines[i];
      i++;
      setTimeout(next, 320);
    }
    next();

    // hard safety: never trap the user behind the boot screen
    setTimeout(function () { el.classList.add('is-done'); }, 3200);
  })();

  /* ─────────── 2. HEADER STATE ─────────── */
  var hdr = $('#hdr');
  var totop = $('#totop');
  var lastY = -1;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (y === lastY) return;
    lastY = y;
    if (hdr) hdr.classList.toggle('is-stuck', y > 24);
    if (totop) totop.classList.toggle('is-on', y > 620);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (totop) {
    totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ─────────── 3. MOBILE NAV ─────────── */
  var burger = $('#burger'), nav = $('#nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (burger) {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ─────────── 4. SMOOTH ANCHOR SCROLL (header offset) ─────────── */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = $(id);
      if (!target) return;

      e.preventDefault();
      closeNav();

      var offset = (hdr ? hdr.offsetHeight : 0) + 10;
      var top = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - offset;

      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ─────────── 5. REVEAL ON SCROLL ─────────── */
  var revealEls = $$('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var d = parseInt(el.getAttribute('data-delay') || '0', 10);
        el.style.transitionDelay = (d * 70) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ─────────── 6. TYPER ─────────── */
  (function typer() {
    var el = $('#typer');
    if (!el) return;

    var lines = [
      'python3 archer.py --task "build telegram bot"',
      'run → read traceback → fix → run again',
      'git commit -m "auto: working build"',
      'status: DONE · cost report sent'
    ];

    if (reduce) { el.textContent = lines[0]; return; }

    var li = 0, ci = 0, deleting = false;

    function tick() {
      var cur = lines[li];

      if (!deleting) {
        ci++;
        el.textContent = cur.slice(0, ci);
        if (ci >= cur.length) {
          deleting = true;
          setTimeout(tick, 1900);
          return;
        }
        setTimeout(tick, 32 + Math.random() * 34);
      } else {
        ci--;
        el.textContent = cur.slice(0, ci);
        if (ci <= 0) {
          deleting = false;
          li = (li + 1) % lines.length;
          setTimeout(tick, 380);
          return;
        }
        setTimeout(tick, 14);
      }
    }
    setTimeout(tick, 900);
  })();

  /* ─────────── 7. COUNTERS ─────────── */
  (function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduce) { el.textContent = String(target); return; }

      var start = performance.now(), dur = 1400;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ─────────── 8. CARD SPOTLIGHT ─────────── */
  (function spotlight() {
    if (reduce || window.matchMedia('(hover: none)').matches) return;

    $$('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();

  /* ─────────── 9. ACTIVE NAV LINK ─────────── */
  (function activeNav() {
    if (!('IntersectionObserver' in window)) return;

    var links = $$('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) {
      var sec = $(a.getAttribute('href'));
      if (sec) map[sec.id] = a;
    });
    var ids = Object.keys(map);
    if (!ids.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[en.target.id];
        if (a) a.classList.add('is-active');
      });
    }, { threshold: 0.35, rootMargin: '-25% 0px -45% 0px' });

    ids.forEach(function (id) { io.observe($('#' + id)); });
  })();

  /* ─────────── 10. FOOTER YEAR ─────────── */
  var yr = $('#yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ─────────── 11. BODY BOOTED (safe fallback) ─────────── */
  window.addEventListener('load', function () {
    var b = $('#boot');
    if (b) setTimeout(function () { b.classList.add('is-done'); }, 400);
  });
})();
