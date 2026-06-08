/* Wealtheon — shared "Home" dropdown for standalone design/hero pages.
   Injects a "Home ▾" menu next to the nav logo (works regardless of the
   page's own nav framework: chrome.js, React <App/>, or React <Hero/>),
   so you can jump to any homepage variant from any hero. */
(function () {
  var HOMES = [
    ['Home 1', '/home1', 'Skyline'],
    ['Home 2', '/home2', 'Growth'],
    ['Home 3', '/home3', 'Horizon'],
    ['Home 4', '/home4', 'Partnership'],
    ['Home 5', '/home5', 'Minimal'],
    ['Home 6', '/home6', 'Cinematic — rood'],
    ['Home 7', '/home7', 'Cinematic — blauw'],
    ['Design hub', 'index.html', 'Vergelijk alle richtingen']
  ];

  function injectCss() {
    if (document.getElementById('wh-home-menu-css')) return;
    var s = document.createElement('style');
    s.id = 'wh-home-menu-css';
    s.textContent =
      '.wh-hm{position:relative;display:inline-flex;align-items:center;margin-left:16px;font-family:Inter,system-ui,sans-serif;}' +
      '.wh-hm>button{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:14.5px;font-weight:500;line-height:1;cursor:pointer;color:inherit;background:rgba(127,127,127,0.14);border:1px solid rgba(127,127,127,0.28);border-radius:8px;padding:7px 12px;}' +
      '.wh-hm>button .wh-ca{font-size:9px;opacity:.6;}' +
      '.wh-hm-menu{position:absolute;top:100%;left:0;margin-top:8px;min-width:230px;background:#fff;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:8px;opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .18s ease,transform .18s ease,visibility .18s;z-index:9999;}' +
      '.wh-hm.open .wh-hm-menu{opacity:1;visibility:visible;transform:none;}' +
      '.wh-hm-menu a{display:block;padding:9px 14px;border-radius:7px;text-decoration:none;color:#1A1A1A;border-left:2px solid transparent;transition:background .15s,border-color .15s;}' +
      '.wh-hm-menu a:hover{background:#F3F2EF;border-left-color:#E11B22;}' +
      '.wh-hm-menu a strong{display:block;font-size:14px;font-weight:600;font-family:"Source Serif 4",Palatino,serif;}' +
      '.wh-hm-menu a span{display:block;font-size:12px;color:#6A6E78;margin-top:1px;}';
    document.head.appendChild(s);
  }

  function build() {
    var wrap = document.createElement('div');
    wrap.className = 'wh-hm';
    var btn = document.createElement('button');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = 'Home <span class="wh-ca">▾</span>';
    var menu = document.createElement('div');
    menu.className = 'wh-hm-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = HOMES.map(function (h) {
      return '<a href="' + h[1] + '"><strong>' + h[0] + '</strong><span>' + h[2] + '</span></a>';
    }).join('');
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    return wrap;
  }

  function inject() {
    if (document.querySelector('.wh-hm')) return true;
    var img = document.querySelector('img[src*="logo-wealtheon"], img[alt="Wealtheon"]');
    if (img) {
      var logoLink = img.closest('a') || img.parentElement;
      if (logoLink && logoLink.parentElement) {
        injectCss();
        logoLink.parentElement.insertBefore(build(), logoLink.nextSibling);
        return true;
      }
    }
    // Fallback for pages without a Wealtheon logo (e.g. VEX): use the first nav.
    var nav = document.querySelector('nav');
    if (nav && nav.firstElementChild) {
      injectCss();
      nav.insertBefore(build(), nav.firstElementChild.nextSibling);
      return true;
    }
    return false;
  }

  // The header may be rendered asynchronously (chrome.js on DOMContentLoaded,
  // React after hydration). Poll for the logo for a few seconds.
  var tries = 0;
  function attempt() {
    if (inject()) return;
    if (tries++ < 40) setTimeout(attempt, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attempt);
  else attempt();
})();
