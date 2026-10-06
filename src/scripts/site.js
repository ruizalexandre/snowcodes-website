(function () {
    // ── Email obfuscation ──
    var p = ['Y29udGFjdA==', 'c25vd2NvZGVz', 'ZnI='];
    var addr = atob(p[0]) + '@' + atob(p[1]) + '.' + atob(p[2]);
    var btn = document.getElementById('contact-btn');
    if (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'mailto:' + addr;
        });
    }

    // ── Footer year: set at build time, refreshed here in case no rebuild happened since New Year ──
    document.getElementById('year').textContent = new Date().getFullYear();

    // ── Header on scroll ──
    var header = document.getElementById('header');
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Scroll reveal ──
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (n) { io.observe(n); });

    // ── Smooth scroll for anchors ──
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        if (a.id === 'contact-btn') return;
        a.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#' || href === '#top') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            var t = document.querySelector(href);
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
})();
