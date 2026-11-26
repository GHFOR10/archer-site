/* ═══════════════════════════════════════════════════════════
   ARCHER — hero canvas: particles · links · data streams
   Dependency-free, DPR-capped, pauses when off-screen.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) { canvas.style.display = 'none'; return; }

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var W = 0, H = 0, DPR = 1;
  var particles = [], streams = [], raf = null, running = false;
  var mouse = { x: -9999, y: -9999, active: false };
  var t = 0;

  var RED = '255,45,63';
  var HOT = '255,140,110';

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    build();
  }

  function build() {
    var area = W * H;
    var isMobile = W < 720;
    var count = Math.round(Math.min(isMobile ? 34 : 84, Math.max(22, area / 16000)));

    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.22, 0.22),
        r: rand(0.7, 2.1),
        a: rand(0.25, 0.85),
        ph: rand(0, Math.PI * 2)
      });
    }

    // horizontal "data streams"
    streams = [];
    var sCount = isMobile ? 3 : 6;
    for (var s = 0; s < sCount; s++) {
      streams.push({
        y: rand(H * 0.08, H * 0.95),
        len: rand(W * 0.08, W * 0.28),
        x: rand(-W * 0.4, W),
        sp: rand(0.35, 1.05),
        a: rand(0.05, 0.16)
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    // ── links ──
    var maxD = W < 720 ? 96 : 132;
    var maxD2 = maxD * maxD;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < maxD2) {
          var o = (1 - d2 / maxD2) * 0.22;
          ctx.strokeStyle = 'rgba(' + RED + ',' + o.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    // ── mouse links ──
    if (mouse.active) {
      for (var m = 0; m < particles.length; m++) {
        var pm = particles[m];
        var mdx = pm.x - mouse.x, mdy = pm.y - mouse.y;
        var md2 = mdx * mdx + mdy * mdy;
        var mr = 168;
        if (md2 < mr * mr) {
          var mo = (1 - md2 / (mr * mr)) * 0.4;
          ctx.strokeStyle = 'rgba(' + HOT + ',' + mo.toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(pm.x, pm.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // ── particles ──
    for (var k = 0; k < particles.length; k++) {
      var pt = particles[k];
      pt.x += pt.vx;
      pt.y += pt.vy;

      if (pt.x < -8) pt.x = W + 8;
      if (pt.x > W + 8) pt.x = -8;
      if (pt.y < -8) pt.y = H + 8;
      if (pt.y > H + 8) pt.y = -8;

      var tw = 0.65 + 0.35 * Math.sin(t * 1.7 + pt.ph);
      var alpha = pt.a * tw;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + RED + ',' + alpha.toFixed(3) + ')';
      ctx.shadowColor = 'rgba(' + RED + ',0.9)';
      ctx.shadowBlur = 9;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── streams ──
    for (var s = 0; s < streams.length; s++) {
      var st = streams[s];
      st.x += st.sp;
      if (st.x - st.len > W + 40) {
        st.x = -st.len - rand(0, W * 0.6);
        st.y = rand(H * 0.08, H * 0.95);
      }
      var g = ctx.createLinearGradient(st.x - st.len, st.y, st.x, st.y);
      g.addColorStop(0, 'rgba(' + RED + ',0)');
      g.addColorStop(0.6, 'rgba(' + RED + ',' + (st.a * 0.7).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + HOT + ',' + st.a.toFixed(3) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(st.x - st.len, st.y);
      ctx.lineTo(st.x, st.y);
      ctx.stroke();
    }

    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  // pointer (mouse + touch)
  function move(e) {
    var rect = canvas.getBoundingClientRect();
    var pt = e.touches ? e.touches[0] : e;
    mouse.x = pt.clientX - rect.left;
    mouse.y = pt.clientY - rect.top;
    mouse.active = true;
  }
  function leave() { mouse.active = false; mouse.x = mouse.y = -9999; }

  window.addEventListener('mousemove', move, { passive: true });
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseleave', leave);

  // repaint on resize (debounced)
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 160);
  });

  // pause when the hero is scrolled away or tab is hidden
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) start(); else stop();
      });
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (isHeroVisible()) start();
  });

  function isHeroVisible() {
    var r = canvas.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  resize();
  start();
})();
