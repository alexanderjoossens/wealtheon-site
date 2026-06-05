/* Wealtheon — shared site behavior */
(function () {
  // Scroll reveal
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // Sticky header shrink/elevate
  function initHeader() {
    var h = document.querySelector('[data-header]');
    if (!h) return;
    var onScroll = function () {
      if (window.scrollY > 24) h.setAttribute('data-scrolled', ''); else h.removeAttribute('data-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Language switcher (visual only)
  function initLang() {
    document.querySelectorAll('[data-lang] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.closest('[data-lang]');
        p.querySelectorAll('button').forEach(function (x) { x.removeAttribute('data-active'); });
        b.setAttribute('data-active', '');
      });
    });
  }

  // Strategy tab / accordion interactions (per-page may hook in)
  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initHeader();
    initLang();
  });
})();
