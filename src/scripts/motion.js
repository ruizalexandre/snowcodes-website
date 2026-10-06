// ══════════════════════════════════════════
//  Motion — live, in-page, no video
// ══════════════════════════════════════════
(function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var outCubic = function (v) { return 1 - Math.pow(1 - v, 3); };
    var split = function (el, cls, re) {
        var parts = el.textContent.split(re), out = [];
        el.textContent = '';
        parts.forEach(function (s) {
            if (!s.trim()) { el.appendChild(document.createTextNode(s)); return; }
            var e = document.createElement('span');
            e.className = cls; e.textContent = s; el.appendChild(e); out.push(e);
        });
        return out;
    };

    // ── Hero title: per-letter mask reveal ──
    var ci = 0;
    document.querySelectorAll('.hero-title .w').forEach(function (w) {
        split(w, 'ch', '').forEach(function (c) { c.style.setProperty('--i', ci++); });
    });

    // ── Magnetic buttons ──
    if (!reduce) document.querySelectorAll('.btn').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            var r = b.getBoundingClientRect();
            b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.2 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.35 + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    // ── Hero swarm: scattered pixels swirl in and assemble the logo, then hold.
    // Each pixel is drawn stretched along its velocity (shutter blur); cursor repels, click sends a shockwave.
    var hero = document.querySelector('.hero'), stage = document.getElementById('stage');
    var cv = document.getElementById('swarm'), ctx = cv.getContext('2d');
    var g1 = document.createElement('canvas'), g1x = g1.getContext('2d');   // bloom, 1/4 res
    var g2 = document.createElement('canvas'), g2x = g2.getContext('2d');   // wide bloom, 1/12 res
    var STEP = 1000 / 60, COLORS = ['#FF5A00', '#FF8A3D', '#FFE4D1', 'rgba(255, 140, 80, 0.35)'];
    var logo = new Image();
    logo.src = '/assets/web/logo.png';

    var W, H, dpr, cx, cy, size, N = 0, M = 0, pts;
    var x, y, vx, vy, hx, hy, heat, bucket;
    var mx = -1e4, my = -1e4, waves = [], t0 = 0, last = 0, acc = 0, running = false;

    // Logo letters are transparent cut-outs in the orange block: sample those, on a grid.
    function sample(sW, sH, ox, oy) {
        var w = Math.round(sW), h = Math.round(sH), step = Math.max(3, Math.min(8, Math.round(sW / 150)));
        var c = document.createElement('canvas'), out = [];
        c.width = w; c.height = h;
        var g = c.getContext('2d', { willReadFrequently: true });
        var k = Math.min(w * 0.8 / logo.naturalWidth, h * 0.92 / logo.naturalHeight) || 0;
        var lw = logo.naturalWidth * k, lh = logo.naturalHeight * k;
        var L = (w - lw) / 2 + lw * 0.03, R = L + lw * 0.94, T = (h - lh) / 2 + lh * 0.05, B = T + lh * 0.9;
        size = step * 0.78;
        try {
            g.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh);
            var d = g.getImageData(0, 0, w, h).data;
        } catch (e) { return out; }                          // file:// taints the canvas: dust only
        for (var j = step >> 1; j < h; j += step)
            for (var i = step >> 1; i < w; i += step)
                if (i > L && i < R && j > T && j < B && d[(j * w + i) * 4 + 3] < 100) out.push(ox + i, oy + j);
        return out;
    }

    function layout() {
        var r = hero.getBoundingClientRect(), s = stage.getBoundingClientRect();
        N = M = 0;
        if (s.width < 12 || s.height < 12) return;               // not laid out yet (hidden tab, CSS pending): wait for the observer
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = r.width; H = r.height;
        cv.width = W * dpr | 0; cv.height = H * dpr | 0;
        g1.width = W / 4 | 0; g1.height = H / 4 | 0;
        g2.width = W / 12 | 0; g2.height = H / 12 | 0;
        g1x.imageSmoothingQuality = g2x.imageSmoothingQuality = 'high';
        cx = s.left - r.left + s.width / 2; cy = s.top - r.top + s.height / 2;
        pts = sample(s.width, s.height, s.left - r.left, s.top - r.top);
        M = pts.length / 2; N = M + Math.round(W * H / 5000);
        [x, y, vx, vy, hx, hy, heat] = Array.from({ length: 7 }, function () { return new Float32Array(N); });
        bucket = new Uint8Array(N);
        for (var i = 0; i < N; i++) {
            x[i] = hx[i] = Math.random() * W; y[i] = hy[i] = Math.random() * H;
            if (i < M) {                                     // swirl in around the stage centre
                var dx = x[i] - cx, dy = y[i] - cy, d = Math.sqrt(dx * dx + dy * dy) + 1;
                vx[i] = -dy / d * 14; vy[i] = dx / d * 14; heat[i] = 0.6;
            }
        }
    }

    function physics(t) {
        var R = 110;
        for (var i = 0; i < N; i++) {
            var X, Y, k, damp;
            if (i < M) { X = pts[2 * i]; Y = pts[2 * i + 1]; k = 0.035; damp = 0.9; }
            else { X = hx[i] + Math.sin(t * 0.3 + i) * 30; Y = hy[i] + Math.cos(t * 0.23 + i * 1.7) * 30; k = 0.004; damp = 0.95; }
            vx[i] = (vx[i] + (X - x[i]) * k) * damp;
            vy[i] = (vy[i] + (Y - y[i]) * k) * damp;
            var dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy;
            if (d2 < R * R) {
                var d = Math.sqrt(d2) + 0.01, f = (1 - d / R) * 2.4;
                vx[i] += dx / d * f; vy[i] += dy / d * f;
                if (heat[i] < 1 - d / R) heat[i] = 1 - d / R;
            }
            x[i] += vx[i]; y[i] += vy[i];
            heat[i] *= 0.95;
        }
    }

    function shockwave(X, Y, t) {
        for (var i = 0; i < N; i++) {
            var dx = x[i] - X, dy = y[i] - Y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = 26 * Math.exp(-d / 160);
            vx[i] += dx / d * f; vy[i] += dy / d * f;
            heat[i] = Math.max(heat[i], Math.exp(-d / 220));
        }
        waves.push({ x: X, y: Y, t: t });
    }

    function render(t) {
        var i, b;
        if (!N) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        for (i = 0; i < N; i++) {
            var hot = Math.max(heat[i], Math.min(1, Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]) / 14));
            bucket[i] = i >= M ? 3 : hot > 0.6 ? 2 : hot > 0.25 ? 1 : 0;
        }
        // Quad per pixel, stretched along velocity and thinned to keep its area.
        // Same winding everywhere → one fill per colour.
        for (b = 0; b < 4; b++) {
            ctx.beginPath();
            for (i = 0; i < N; i++) {
                if (bucket[i] !== b) continue;
                var s = i >= M ? size * 0.35 : size;
                var sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]), len = Math.max(s, sp * 1.8);
                var ux = sp > 0.01 ? vx[i] / sp : 1, uy = sp > 0.01 ? vy[i] / sp : 0;
                var hl = len / 2, hw = s * Math.sqrt(s / len) / 2;
                ctx.moveTo(x[i] - ux * hl - uy * hw, y[i] - uy * hl + ux * hw);
                ctx.lineTo(x[i] + ux * hl - uy * hw, y[i] + uy * hl + ux * hw);
                ctx.lineTo(x[i] + ux * hl + uy * hw, y[i] + uy * hl - ux * hw);
                ctx.lineTo(x[i] - ux * hl + uy * hw, y[i] - uy * hl - ux * hw);
            }
            ctx.fillStyle = COLORS[b];
            ctx.fill();
        }
        waves = waves.filter(function (w) { return t - w.t < 0.9; });
        waves.forEach(function (w) {
            var k = (t - w.t) / 0.9;
            ctx.beginPath();
            ctx.arc(w.x, w.y, 20 + outCubic(k) * 520, 0, 6.2832);
            ctx.lineWidth = 1.5 * (1 - k) + 0.5;
            ctx.strokeStyle = 'rgba(255, 138, 61,' + (1 - k) + ')';
            ctx.stroke();
        });

        // Bloom: two downsampled copies added back on top
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        g1x.clearRect(0, 0, g1.width, g1.height); g1x.drawImage(cv, 0, 0, g1.width, g1.height);
        g2x.clearRect(0, 0, g2.width, g2.height); g2x.drawImage(g1, 0, 0, g2.width, g2.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5; ctx.drawImage(g1, 0, 0, cv.width, cv.height);
        ctx.globalAlpha = 0.75; ctx.drawImage(g2, 0, 0, cv.width, cv.height);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
        if (!running) return;
        requestAnimationFrame(frame);
        var t = (now - t0) / 1000;
        acc = Math.min(acc + now - last, 100); last = now;
        for (; acc >= STEP; acc -= STEP) physics(t);
        render(t);
    }

    function still() {                                       // reduced motion: the logo, formed, no loop
        for (var i = 0; i < M; i++) { x[i] = pts[2 * i]; y[i] = pts[2 * i + 1]; vx[i] = vy[i] = heat[i] = 0; }
        render(0);
    }

    function start() {
        t0 = last = performance.now();
        var pending = false, size0 = '';
        new ResizeObserver(function () {                     // (re)assemble whenever the stage changes size
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () {
                pending = false;
                var s = stage.getBoundingClientRect(), key = Math.round(s.width) + 'x' + Math.round(s.height);
                if (key === size0) return;
                size0 = key; layout(); if (reduce) still();
            });
        }).observe(stage);
        if (reduce) return;
        new IntersectionObserver(function (es) {
            running = es[0].isIntersecting;
            if (running) { last = performance.now(); requestAnimationFrame(frame); }
        }).observe(hero);
        hero.addEventListener('pointermove', function (e) {
            var r = hero.getBoundingClientRect();
            mx = e.clientX - r.left; my = e.clientY - r.top;
        });
        hero.addEventListener('pointerleave', function () { mx = my = -1e4; });
        stage.addEventListener('pointerdown', function (e) {
            var r = hero.getBoundingClientRect();
            shockwave(e.clientX - r.left, e.clientY - r.top, (performance.now() - t0) / 1000);
        });
    }

    Promise.race([logo.decode().catch(function () {}), new Promise(function (r) { setTimeout(r, 2500); })]).then(start);

    // ── Manifesto: scroll-scrubbed kinetic type ──
    var sec = document.getElementById('manifesto'), chars = [], j = 0;
    sec.querySelectorAll('.m-big .mw').forEach(function (w) {
        var lit = w.classList.contains('em');
        split(w, 'ch', '').forEach(function (c) {
            chars.push({
                el: c, lit: lit ? j++ : -1,
                dx: (Math.random() - 0.5) * 1000, dy: (Math.random() - 0.5) * 700, dz: -300 - Math.random() * 1200,
                rx: (Math.random() - 0.5) * 220, ry: (Math.random() - 0.5) * 220, rz: (Math.random() - 0.5) * 90
            });
        });
    });
    var wds = split(sec.querySelector('.m-text'), 'wd', /(\s+)/), verbs = sec.querySelector('.m-verbs');
    var queued = false;
    function scrub() {
        queued = false;
        var r = sec.getBoundingClientRect(), p = reduce ? 1 : clamp(-r.top / (r.height - innerHeight));
        sec.style.setProperty('--p', p.toFixed(4));
        chars.forEach(function (c, i) {
            var e = 1 - outCubic(clamp((p - i * 0.008) / 0.3));
            c.el.style.transform = e ? 'translate3d(' + c.dx * e + 'px,' + c.dy * e + 'px,' + c.dz * e + 'px) rotateX(' +
                c.rx * e + 'deg) rotateY(' + c.ry * e + 'deg) rotateZ(' + c.rz * e + 'deg)' : '';
            c.el.style.opacity = 1 - e;
            c.el.style.filter = e > 0.01 ? 'blur(' + e * 12 + 'px)' : '';
            if (c.lit >= 0) c.el.classList.toggle('lit', p > 0.4 + c.lit * 0.01);
        });
        verbs.style.setProperty('--v', outCubic(clamp((p - 0.42) / 0.12)));
        wds.forEach(function (w, k) { w.style.opacity = 0.12 + 0.88 * clamp((p - 0.48 - k / wds.length * 0.2) / 0.05); });
    }
    var onScroll = function () { if (!queued) { queued = true; requestAnimationFrame(scrub); } };
    if (!reduce) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
    }
    scrub();
})();
