// ══════════════════════════════════════════
//  Motion — Tesla spirit: darkness, light, restraint. Live, in-page, no video.
// ══════════════════════════════════════════
(function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var outCubic = function (v) { return 1 - Math.pow(1 - v, 3); };
    var outExpo = function (v) { return v >= 1 ? 1 : 1 - Math.pow(2, -10 * v); };
    var inOut = function (v) { return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(2 - 2 * v, 3) / 2; };
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

    // ── Nav: one highlight glides from item to item ──
    var menu = document.querySelector('.menu');
    menu.addEventListener('pointerover', function (e) {
        var a = e.target.closest('a');
        if (!a) return;
        menu.style.setProperty('--x', a.offsetLeft + 'px');
        menu.style.setProperty('--w', a.offsetWidth + 'px');
        if (!menu.classList.contains('hl')) { void menu.offsetWidth; menu.classList.add('hl'); }   // first item: fade in place, no slide
    });
    menu.addEventListener('pointerleave', function () { menu.classList.remove('hl'); });

    // ── Hero figures count up as the specs come in ──
    if (!reduce) document.querySelectorAll('.spec b').forEach(function (b) {
        var n = b.firstChild, m = /^(\D*)(\d+)$/.exec(n.textContent), from = performance.now() + 1100;
        if (!m) return;
        (function tick(now) {
            var k = clamp((now - from) / 1800);
            n.textContent = m[1] + Math.round(m[2] * outExpo(k));
            if (k < 1) requestAnimationFrame(tick);
        })(performance.now());
    });

    // ── Hero: the logo as a matrix of light in a dark studio. A sweep of light unveils it, then a glint
    // glides over it now and then, like a reflection on paint. The cursor is a loupe: pixels part around it,
    // warm up, and settle back. Each pixel is drawn stretched along its velocity (shutter blur).
    var hero = document.querySelector('.hero'), stage = document.getElementById('stage');
    var cv = document.getElementById('matrix'), ctx = cv.getContext('2d');
    var layer = function () { var c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
    var [pl, plx] = layer(), [fx, fxx] = layer(), [g1, g1x] = layer(), [g2, g2x] = layer();   // pixels, light, bloom ×2
    var COLORS = ['#FF5A00', '#FF8A3D', '#FFE4D1', 'rgba(255, 90, 0, 0.07)'];                // rest, warm, hot, not lit yet
    var STEP = 1000 / 60, LOUPE = 110, INTRO = 2.4, GLINT = 9, SHINE = 1.8;                      // ms, px, s, s, s
    var logo = new Image();
    logo.src = '/assets/web/logo.png';
    var W, H, dpr, size, M = 0, L, R, CY, FLOOR, fade, line, x, y, vx, vy, hx, hy, heat, bucket;
    var mx = -1e4, my = -1e4, t0 = 0, last = 0, acc = 0, raf = 0, running = false, awake = false, dirty = false;

    function layout() {
        var s = stage.getBoundingClientRect(), w = Math.round(s.width), h = Math.round(s.height);
        if (w < 12 || h < 12) return false;                      // not laid out yet (hidden tab, CSS pending): wait for the observer
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = w * dpr | 0; H = cv.offsetHeight * dpr | 0;           // the canvas runs below the stage, onto the floor
        [cv, pl, fx].forEach(function (c) { c.width = W; c.height = H; });
        g1.width = W / 8 | 0; g1.height = H / 8 | 0;
        g2.width = W / 24 | 0; g2.height = H / 24 | 0;
        g1x.imageSmoothingQuality = g2x.imageSmoothingQuality = 'high';

        // The letters are transparent cut-outs in the orange block: sample them on a grid.
        var c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true }), d, pts = [];
        c.width = w; c.height = h;
        var k = Math.min(w * 0.8 / logo.naturalWidth, h * 0.92 / logo.naturalHeight) || 0;
        var lw = logo.naturalWidth * k, lh = logo.naturalHeight * k, x0 = (w - lw) / 2, y0 = (h - lh) / 2;
        var step = Math.max(3, Math.min(8, Math.round(w / 150)));
        L = x0 + lw * 0.03; R = x0 + lw * 0.97; CY = y0 + lh / 2; size = step * 0.78;
        try {
            g.drawImage(logo, x0, y0, lw, lh);
            d = g.getImageData(0, 0, w, h).data;
        } catch (e) { return false; }                             // file:// taints the canvas: stay dark
        for (var j = step >> 1; j < h; j += step)
            for (var i = step >> 1; i < w; i += step)
                if (i > L && i < R && j > y0 + lh * 0.05 && j < y0 + lh * 0.95 && d[(j * w + i) * 4 + 3] < 100) pts.push(i, j);
        M = pts.length / 2;
        if (!M) return false;
        [x, y, vx, vy, hx, hy, heat] = Array.from({ length: 7 }, function () { return new Float32Array(M); });
        bucket = new Uint8Array(M);
        for (i = 0; i < M; i++) { x[i] = hx[i] = pts[2 * i]; y[i] = hy[i] = pts[2 * i + 1]; }

        // The floor, just under the lowest row: a line, and a reflection that fades with depth.
        var f = FLOOR = (pts[2 * M - 1] + step) * dpr, depth = lh * 0.22 * dpr;
        fade = ctx.createLinearGradient(0, 0, 0, H);              // erases: everything above the floor, the reflection with depth
        fade.addColorStop(0, '#000');
        fade.addColorStop(f / H, '#000');
        fade.addColorStop(f / H, 'rgba(0, 0, 0, 0)');
        fade.addColorStop(Math.min(1, (f + depth / 2) / H), 'rgba(0, 0, 0, 0.75)');
        fade.addColorStop(Math.min(1, (f + depth) / H), '#000');
        line = ctx.createLinearGradient(0, 0, W, 0);
        line.addColorStop(0, 'rgba(255, 255, 255, 0)');
        line.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        line.addColorStop(1, 'rgba(255, 255, 255, 0)');
        dirty = true;
        return true;
    }

    function physics() {                                          // one 60 Hz step; true while anything still moves
        var live = false;
        for (var i = 0; i < M; i++) {
            vx[i] = (vx[i] + (hx[i] - x[i]) * 0.035) * 0.9;
            vy[i] = (vy[i] + (hy[i] - y[i]) * 0.035) * 0.9;
            var dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy;
            if (d2 < LOUPE * LOUPE) {                              // the loupe: pixels part around the cursor and warm up
                var d = Math.sqrt(d2) + 0.01, f = (1 - d / LOUPE) * 2.4;
                vx[i] += dx / d * f; vy[i] += dy / d * f;
                if (heat[i] < 1 - d / LOUPE) heat[i] = 1 - d / LOUPE;
            }
            x[i] += vx[i]; y[i] += vy[i];
            heat[i] *= 0.95;
            if (heat[i] > 0.01 || vx[i] * vx[i] + vy[i] * vy[i] > 1e-4) live = true;
        }
        return live;
    }

    function bloom(src, a) {                                      // soft glow: two downsampled (blurred) copies of src, added
        g1x.clearRect(0, 0, g1.width, g1.height); g1x.drawImage(src, 0, 0, g1.width, g1.height);
        g2x.clearRect(0, 0, g2.width, g2.height); g2x.drawImage(g1, 0, 0, g2.width, g2.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.6; ctx.drawImage(g1, 0, 0, W, H);
        ctx.globalAlpha = a; ctx.drawImage(g2, 0, 0, W, H);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    function render(t) {
        var i, b, gr, g = (t - INTRO - 3) % GLINT / SHINE;
        var edge = (R - L) * 0.14, front = t < INTRO ? L - edge + (R - L + 2 * edge) * inOut(t / INTRO) : Infinity;

        // The pixels, on their own layer: a quad each, stretched along its velocity and thinned to keep
        // its area; same winding everywhere → one fill per colour. Not lit yet until the sweep passes.
        for (i = 0; i < M; i++) {
            var hot = Math.max(heat[i], Math.min(1, Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]) / 14));
            bucket[i] = hx[i] > front ? 3 : hot > 0.6 ? 2 : hot > 0.25 ? 1 : 0;
        }
        plx.setTransform(1, 0, 0, 1, 0, 0);
        plx.clearRect(0, 0, W, H);
        plx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (b = 0; b < 4; b++) {
            plx.beginPath();
            for (i = 0; i < M; i++) {
                if (bucket[i] !== b) continue;
                var sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]), len = Math.max(size, sp * 1.8);
                var ux = sp > 0.01 ? vx[i] / sp : 1, uy = sp > 0.01 ? vy[i] / sp : 0;
                var hl = len / 2, hw = size * Math.sqrt(size / len) / 2;
                plx.moveTo(x[i] - ux * hl - uy * hw, y[i] - uy * hl + ux * hw);
                plx.lineTo(x[i] + ux * hl - uy * hw, y[i] + uy * hl + ux * hw);
                plx.lineTo(x[i] + ux * hl + uy * hw, y[i] + uy * hl - ux * hw);
                plx.lineTo(x[i] - ux * hl + uy * hw, y[i] - uy * hl - ux * hw);
            }
            plx.fillStyle = COLORS[b];
            plx.fill();
        }

        // The frame: the reflection on the glossy floor, the floor line (lit by the sweep), the pixels, a faint glow.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.setTransform(1, 0, 0, -1, 0, 2 * FLOOR);
        ctx.globalAlpha = 0.16; ctx.drawImage(pl, 0, 0); ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = line; ctx.fillRect(0, FLOOR, Math.min(front * dpr, W), dpr);
        ctx.drawImage(pl, 0, 0);
        bloom(cv, 0.3);

        // Light, masked to the pixels: the white-hot edge of the unveiling, then a glint every GLINT s.
        if (t < INTRO) {
            gr = ctx.createLinearGradient((front - edge) * dpr, 0, (front + edge / 4) * dpr, 0);
            gr.addColorStop(0, 'rgba(255, 120, 40, 0)');
            gr.addColorStop(0.55, 'rgba(255, 170, 110, 0.5)');
            gr.addColorStop(0.8, 'rgba(255, 246, 236, 1)');
            gr.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else if (g >= 0 && g < 1) {
            var bw = (R - L) * 0.1, cx = L - 2 * bw + (R - L + 4 * bw) * inOut(g);
            gr = ctx.createLinearGradient((cx - bw) * dpr, (CY - bw * 0.4) * dpr, (cx + bw) * dpr, (CY + bw * 0.4) * dpr);
            gr.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gr.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            gr.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else return;
        fxx.globalCompositeOperation = 'copy'; fxx.drawImage(pl, 0, 0);
        fxx.globalCompositeOperation = 'source-in'; fxx.fillStyle = gr; fxx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fx, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        bloom(fx, 1);
    }

    function frame(now) {
        raf = running ? requestAnimationFrame(frame) : 0;
        if (!running || !M) return;
        t0 = t0 || now;                                           // the unveiling starts when it can first be seen
        var t = (now - t0) / 1000, g = (t - INTRO - 3) % GLINT, lit = t < INTRO || (g >= 0 && g < SHINE);
        acc = Math.min(acc + now - (last || now), 100); last = now;
        for (; acc >= STEP; acc -= STEP) if (awake) awake = physics();
        if (lit || awake || dirty) { render(t); dirty = lit || awake; }   // all still: one last frame, then idle
    }

    function start() {
        var pending = false, key0 = '';
        new ResizeObserver(function () {                          // (re)build whenever the stage changes size
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () {
                pending = false;
                var s = stage.getBoundingClientRect(), key = Math.round(s.width) + 'x' + Math.round(s.height);
                if (key === key0) return;
                key0 = key;
                if (layout() && reduce) render(INTRO);            // reduced motion: the logo, lit, no loop
            });
        }).observe(stage);
        if (reduce) return;
        new IntersectionObserver(function (es) {
            running = es[0].isIntersecting;
            if (running && !raf) raf = requestAnimationFrame(frame);
        }).observe(hero);
        hero.addEventListener('pointermove', function (e) {
            var r = stage.getBoundingClientRect();
            mx = e.clientX - r.left; my = e.clientY - r.top; awake = true;
        });
        hero.addEventListener('pointerleave', function () { mx = my = -1e4; });
    }

    Promise.race([logo.decode().catch(function () {}), new Promise(function (r) { setTimeout(r, 2500); })]).then(start);

    // ── Scroll: the hero recedes; in the manifesto a light bar ignites and lights the statement, then it's read word by word ──
    var sec = document.getElementById('manifesto'), big = sec.querySelector('.m-big');
    var wds = split(sec.querySelector('.m-text'), 'wd', /(\s+)/), verbs = sec.querySelector('.m-verbs');
    var queued = false;
    function scrub() {
        queued = false;
        var r = sec.getBoundingClientRect(), p = reduce ? 1 : clamp(-r.top / (r.height - innerHeight));
        if (!reduce) hero.style.setProperty('--h', clamp(scrollY / innerHeight).toFixed(4));
        sec.style.setProperty('--p', p.toFixed(4));
        big.style.setProperty('--b', outExpo(clamp((p - 0.02) / 0.2)).toFixed(4));
        big.style.setProperty('--s', outCubic(clamp((p - 0.1) / 0.28)).toFixed(4));
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
