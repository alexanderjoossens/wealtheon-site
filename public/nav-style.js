/* Nav style switcher — pick a nav bar variation via ?nav=<style>.
   Styles: classic (default) | red | glass-light | glass-dark | glass-pill
   Adds `navstyle-<style>` to <html>; CSS does the rest.
   Also toggles `is-scrolled` on <html> so glass navs solidify on scroll. */
(function () {
  var m = window.location.search.match(/[?&]nav=([\w-]+)/);
  if (m) {
    document.documentElement.classList.add('navstyle-' + m[1]);
  }
  function onScroll() {
    document.documentElement.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', onScroll);
})();
