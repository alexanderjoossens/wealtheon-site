/* ============================================================
   WEALTHEON — Shared site navigation (single source of truth)
   Inject by placing <div id="site-nav"></div> near the top of <body>
   and loading this script + site-nav.css.

   Per-page config via <html> data attributes:
     data-page="home|home1|home-blue|home-white|services|about|contact|data"
        → highlights the matching nav item.
     data-navstyle="classic|red|glass-light|glass-dark|glass-pill"
        → default nav bar style (overridable live with ?nav=<style>).
   ============================================================ */
(function () {
  var docEl = document.documentElement;

  /* ── Colour style theme (red default ↔ blue), persisted across pages.
       Applied immediately (script runs in <head>) to avoid a flash. ── */
  var THEME_KEY = 'wealtheon_theme';
  var THEMES = [
    ['red',       'Red'],
    ['blue',      'Blue'],
    ['buildings', 'Buildings'],
    ['light',     'Light']
  ];
  function isTheme(t) { return THEMES.some(function (x) { return x[0] === t; }); }
  function readTheme() {
    var t;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    return isTheme(t) ? t : 'red';
  }
  function applyTheme(t) {
    docEl.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    document.querySelectorAll('.style-toggle .st-opt').forEach(function (b) {
      if (b.getAttribute('data-key') === t) b.setAttribute('data-active', '');
      else b.removeAttribute('data-active');
    });
  }
  applyTheme(readTheme());

  function toggleHTML() {
    var opts = THEMES.map(function (t) {
      return '<button class="st-opt" type="button" data-key="' + t[0] + '" aria-label="' + t[1] + ' style">' +
        '<span class="st-dot"></span><span class="st-text">' + t[1] + '</span></button>';
    }).join('');
    return '<div class="style-toggle" role="group" aria-label="Colour style">' +
      '<span class="st-label">Style</span>' +
      '<div class="st-track">' + opts + '</div></div>';
  }
  function mountToggle() {
    if (document.querySelector('.style-toggle')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = toggleHTML();
    var el = wrap.firstChild;
    el.addEventListener('click', function (e) {
      var btn = e.target.closest('.st-opt');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      if (isHomepage()) {
        var dest = L(STYLE_HOME[key] || '/home');
        try { localStorage.setItem(THEME_KEY, key); } catch (e2) {}
        if (dest.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '')) {
          applyTheme(key);                /* already on this variant → just recolour */
        } else {
          window.location.assign(dest);   /* go to the chosen homepage variant */
        }
      } else {
        applyTheme(key);                  /* off a homepage → colour theme only */
      }
    });
    document.body.appendChild(el);
    applyTheme(readTheme()); /* sync active state now the buttons exist */
  }

  /* ── Nav bar style: ?nav= overrides the page default ── */
  var m = window.location.search.match(/[?&]nav=([\w-]+)/);
  var style = (m && m[1]) || docEl.getAttribute('data-navstyle') || 'classic';
  if (style && style !== 'classic') docEl.classList.add('navstyle-' + style);

  /* Glass navs solidify on scroll */
  function onScroll() { docEl.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Language (EN at root, FR at /fr/…, NL at /nl/…) ──────────
     Single source of truth for all in-nav links + the EN|FR|NL
     switcher. Translated pages are real files (good for SEO);
     the switcher links are real <a href> to the same page in the
     other language. ── */
  var NAV_I18N = {
    en: { welcome:'Welcome', homepages:'Homepages', services:'Services', about:'About Us',
          foundation:'Foundation', careers:'Careers', contact:'Contact', contactUs:'Contact Us',
          directLines:'Direct Lines', directLinesDesc:'Growth, Value &amp; High Conviction strategies',
          funds:'Funds', fundsDesc:'Our regulated investment funds',
          partners:'Partners', partnersDesc:'How we work with advisers &amp; intermediaries',
          contactDesc:'Form &amp; offices' },
    fr: { welcome:'Accueil', homepages:'Pages d’accueil', services:'Services', about:'À propos',
          foundation:'Fondation', careers:'Carrières', contact:'Contact', contactUs:'Nous contacter',
          directLines:'Lignes directes', directLinesDesc:'Stratégies Croissance, Valeur &amp; Haute Conviction',
          funds:'Fonds', fundsDesc:'Nos fonds d’investissement réglementés',
          partners:'Partenaires', partnersDesc:'Notre collaboration avec conseillers &amp; intermédiaires',
          contactDesc:'Formulaire &amp; bureaux' },
    nl: { welcome:'Welkom', homepages:'Homepagina’s', services:'Diensten', about:'Over ons',
          foundation:'Stichting', careers:'Vacatures', contact:'Contact', contactUs:'Contacteer ons',
          directLines:'Directe lijnen', directLinesDesc:'Groei-, Waarde- &amp; High Conviction-strategieën',
          funds:'Fondsen', fundsDesc:'Onze gereglementeerde beleggingsfondsen',
          partners:'Partners', partnersDesc:'Hoe we samenwerken met adviseurs &amp; tussenpersonen',
          contactDesc:'Formulier &amp; kantoren' }
  };
  var _p = window.location.pathname;
  var _lm = _p.match(/^\/(fr|nl)(?=\/|$)/);
  var LANG = _lm ? _lm[1] : 'en';
  var BASEPATH = _lm ? (_p.slice(3) || '/') : _p;   /* canonical EN path, e.g. /about */
  var T = NAV_I18N[LANG] || NAV_I18N.en;
  if (!docEl.getAttribute('lang')) docEl.setAttribute('lang', LANG);
  /* Build an in-language href for a canonical EN path */
  function L(p) { if (LANG === 'en') return p; if (p === '/') return '/' + LANG + '/'; return '/' + LANG + p; }
  /* Build the href to switch the current page into another language */
  function switchHref(code) { if (code === 'en') return BASEPATH; if (BASEPATH === '/') return '/' + code + '/'; return '/' + code + BASEPATH; }

  /* ── On a homepage, the Style toggle doubles as a homepage-variant chooser:
       Red/Blue recolour the cinematic home (stay on /home), Buildings → /home1,
       Light → /home-white — navigating in the CURRENT language. Off a homepage
       it just sets the colour theme (unchanged behaviour). ── */
  var HOME_KEYS  = { home:1, home1:1, 'home-blue':1, 'home-white':1, home6:1, home7:1 };
  var HOME_PATHS = { '/home':1, '/home1':1, '/home6':1, '/home7':1, '/home-blue':1, '/home-white':1 };
  var STYLE_HOME = { red:'/home', blue:'/home', buildings:'/home1', light:'/home-white' };
  function isHomepage() { return !!HOME_KEYS[docEl.getAttribute('data-page')] || !!HOME_PATHS[BASEPATH]; }

  /* ── Markup ── */
  var HOMEPAGES = [
    ['/home',       'home',       'Home',      'Cinematic — toggle red/blue style'],
    ['/home1',      'home1',      'Buildings', 'Skyline — bold &amp; centered'],
    ['/home-blue',  'home-blue',  'Navy',      'Cinematic navy hero'],
    ['/home-white', 'home-white', 'Light',     'Light editorial']
  ];

  function homepageLinks() {
    return HOMEPAGES.map(function (h) {
      return '<a href="' + L(h[0]) + '" data-page="' + h[1] + '" role="menuitem">' +
        '<div><strong>' + h[2] + '</strong><span>' + h[3] + '</span></div></a>';
    }).join('');
  }

  function langSwitcher() {
    function a(code, label) {
      return '<a href="' + switchHref(code) + '" hreflang="' + code + '" lang="' + code + '"' +
        (LANG === code ? ' class="active" aria-current="true"' : '') + '>' + label + '</a>';
    }
    return '<div class="lang-switcher">' +
      a('en', 'EN') + '<span class="lang-sep">|</span>' +
      a('fr', 'FR') + '<span class="lang-sep">|</span>' +
      a('nl', 'NL') + '</div>';
  }

  function navHTML() {
    return '' +
    '<nav class="site-nav" id="main-nav"><div class="nav-inner">' +
      '<a href="' + L('/home') + '" class="nav-logo"><img src="/uploads/Wealtheon_logo_rgb.png" alt="Wealtheon" class="nav-logo-img" /></a>' +
      '<ul class="nav-links" id="nav-links">' +

        /* Welcome — 4 homepages */
        '<li data-group="home">' +
          '<button class="nav-dropdown-btn" data-dropdown="welcome-dropdown" aria-expanded="false" aria-haspopup="true">' + T.welcome + ' <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="welcome-dropdown" role="menu">' +
            '<div class="dropdown-col-title">' + T.homepages + '</div>' +
            homepageLinks() +
          '</div>' +
        '</li>' +

        /* Services */
        '<li data-group="services">' +
          '<button class="nav-dropdown-btn" data-dropdown="services-dropdown" aria-expanded="false" aria-haspopup="true">' + T.services + ' <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="services-dropdown" role="menu">' +
            '<a href="' + L('/direct-lines') + '" role="menuitem"><div><strong>' + T.directLines + '</strong><span>' + T.directLinesDesc + '</span></div></a>' +
            '<a href="' + L('/funds') + '" role="menuitem"><div><strong>' + T.funds + '</strong><span>' + T.fundsDesc + '</span></div></a>' +
            '<a href="' + L('/partners') + '" role="menuitem"><div><strong>' + T.partners + '</strong><span>' + T.partnersDesc + '</span></div></a>' +
          '</div>' +
        '</li>' +

        /* About — plain link, no dropdown */
        '<li data-group="about"><a href="' + L('/about') + '">' + T.about + '</a></li>' +

        '<li data-group="foundation"><a href="' + L('/foundation') + '">' + T.foundation + '</a></li>' +

        '<li data-group="careers"><a href="' + L('/careers') + '">' + T.careers + '</a></li>' +

        /* Contact — plain link, far right */
        '<li data-group="contact"><a href="' + L('/contact') + '">' + T.contact + '</a></li>' +
      '</ul>' +

      '<div class="nav-right">' +
        langSwitcher() +
        '<a href="' + L('/contact') + '" class="nav-contact-btn">' + T.contactUs + '</a>' +
        '<button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div></nav>';
  }

  /* ── Active highlighting ── */
  var HOME_PAGES = { home:1, home1:1, 'home-blue':1, 'home-white':1, home6:1, home7:1 };

  function markActive(root, page) {
    if (!page) return;
    var group = HOME_PAGES[page] ? 'home' : page;
    var li = root.querySelector('.nav-links > li[data-group="' + group + '"]');
    if (li) {
      var trigger = li.querySelector(':scope > button, :scope > a');
      if (trigger) trigger.classList.add('active');
    }
    if (HOME_PAGES[page]) {
      var link = root.querySelector('#welcome-dropdown a[data-page="' + page + '"]');
      if (link) link.classList.add('active');
    }
  }

  /* ── Dropdown + mobile wiring ── */
  function wire(root) {
    root.querySelectorAll('.nav-dropdown-btn').forEach(function (btn) {
      var dd = document.getElementById(btn.getAttribute('data-dropdown'));
      if (!dd) return;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        root.querySelectorAll('.dropdown.open').forEach(function (d) { if (d !== dd) d.classList.remove('open'); });
        var open = dd.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        var arrow = btn.querySelector('.nav-arrow');
        if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
      });
      dd.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    document.addEventListener('click', function () {
      root.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
      root.querySelectorAll('.nav-dropdown-btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        var a = b.querySelector('.nav-arrow'); if (a) a.style.transform = '';
      });
    });

    var toggle = root.querySelector('#nav-toggle');
    var links = root.querySelector('#nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        links.classList.toggle('open');
      });
    }
  }

  function init() {
    mountToggle();
    var mount = document.getElementById('site-nav');
    if (!mount) return;
    mount.innerHTML = navHTML();
    markActive(mount, docEl.getAttribute('data-page'));
    wire(mount);
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
