(function () {
    // ── Contact details: stored encoded, decoded only on a real click, so scrapers never find them in the page ──
    var mail = function () { return atob('Y29udGFjdA==') + '@' + atob('c25vd2NvZGVz') + '.' + atob('ZnI='); };
    var phone = function () { return atob('MDYz') + atob('Mzcw') + atob('MTYzNQ=='); };   // 10 digits, French format
    var btn = document.getElementById('contact-btn');
    if (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (e.isTrusted) window.location.href = 'mailto:' + mail();
        });
    }
    document.querySelectorAll('[data-reveal]').forEach(function (b) {
        b.addEventListener('click', function (e) {
            if (!e.isTrusted) return;                            // a script's .click() doesn't count
            var a = document.createElement('a'), tel = b.dataset.reveal === 'tel', v = tel ? phone() : mail();
            a.href = tel ? 'tel:+33' + v.slice(1) : 'mailto:' + v;
            a.textContent = tel ? v.replace(/\d\d(?=\d)/g, '$& ') : v;
            b.replaceWith(a);
            a.focus();
        });
    });

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
