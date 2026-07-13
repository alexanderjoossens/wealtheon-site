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

  /* ── Colour style: red only. The former red/blue/buildings/light "Style"
       switcher has been removed, so force the red theme on every page and
       clear any previously-persisted choice — a returning visitor who once
       picked another style still gets red. Applied immediately (script runs
       in <head>) to avoid a flash. ── */
  docEl.setAttribute('data-theme', 'red');
  try { localStorage.removeItem('wealtheon_theme'); } catch (e) {}

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
          news:'News', foundation:'Foundation', careers:'Careers', contact:'Contact', contactUs:'Contact Us',
          directLines:'Direct Lines', directLinesDesc:'Growth, Value &amp; High Conviction strategies',
          funds:'Funds', fundsDesc:'Our regulated investment funds',
          partners:'Partners', partnersDesc:'How we work with advisers &amp; intermediaries',
          contactDesc:'Form &amp; offices' },
    fr: { welcome:'Accueil', homepages:'Pages d’accueil', services:'Services', about:'À propos',
          news:'Actualités', foundation:'Fondation', careers:'Carrières', contact:'Contact', contactUs:'Nous contacter',
          directLines:'Lignes directes', directLinesDesc:'Stratégies Croissance, Valeur &amp; Haute Conviction',
          funds:'Fonds', fundsDesc:'Nos fonds d’investissement réglementés',
          partners:'Partenaires', partnersDesc:'Notre collaboration avec conseillers &amp; intermédiaires',
          contactDesc:'Formulaire &amp; bureaux' },
    nl: { welcome:'Welkom', homepages:'Homepagina’s', services:'Diensten', about:'Over ons',
          news:'Nieuws', foundation:'Stichting', careers:'Vacatures', contact:'Contact', contactUs:'Contacteer ons',
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
      a('nl', 'NL') + '<span class="lang-sep">|</span>' +
      a('fr', 'FR') + '<span class="lang-sep">|</span>' +
      a('en', 'EN') + '</div>';
  }

  function navHTML() {
    return '' +
    '<nav class="site-nav" id="main-nav"><div class="nav-inner">' +
      '<a href="' + L('/home') + '" class="nav-logo"><img src="/uploads/Wealtheon_logo_rgb.png" alt="Wealtheon" class="nav-logo-img" /></a>' +
      '<ul class="nav-links" id="nav-links">' +

        /* Welcome — plain link to the homepage (no dropdown) */
        '<li data-group="home"><a href="' + L('/home') + '">' + T.welcome + '</a></li>' +

        /* Services */
        '<li data-group="services">' +
          '<button class="nav-dropdown-btn" data-dropdown="services-dropdown" aria-expanded="false" aria-haspopup="true">' + T.services + ' <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="services-dropdown" role="menu">' +
            '<a href="' + L('/direct-lines') + '" role="menuitem"><div><strong>' + T.directLines + '</strong><span>' + T.directLinesDesc + '</span></div></a>' +
            '<a href="' + L('/funds') + '" role="menuitem"><div><strong>' + T.funds + '</strong><span>' + T.fundsDesc + '</span></div></a>' +
            '<a href="' + L('/partners') + '" role="menuitem"><div><strong>' + T.partners + '</strong><span>' + T.partnersDesc + '</span></div></a>' +
          '</div>' +
        '</li>' +

        /* Funds — individual fund pages */
        '<li data-group="funds">' +
          '<button class="nav-dropdown-btn" data-dropdown="funds-dropdown" aria-expanded="false" aria-haspopup="true">' + T.funds + ' <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="funds-dropdown" role="menu">' +
            '<a href="' + L('/fund-world-equity') + '" role="menuitem"><div><strong>Wealtheon World Equity</strong><span>FundPartner Solutions S.A.</span></div></a>' +
            '<a href="' + L('/fund-value-world-equity') + '" role="menuitem"><div><strong>Wealtheon Value World Equity</strong><span>ISIN LU3238191574</span></div></a>' +
            '<a href="' + L('/fund-high-conviction') + '" role="menuitem"><div><strong>Wealtheon High Conviction World Equity</strong><span>ISIN LU3238190766</span></div></a>' +
            '<a href="' + L('/fund-dbi-rdt') + '" role="menuitem"><div><strong>DBI-RDT Value Fund</strong><span>Wealtheon Global Equity Value DBI-RDT</span></div></a>' +
          '</div>' +
        '</li>' +

        /* About — plain link, no dropdown */
        '<li data-group="about"><a href="' + L('/about') + '">' + T.about + '</a></li>' +

        /* News & Insights — syndicated LinkedIn posts */
        '<li data-group="news"><a href="' + L('/news') + '">' + T.news + '</a></li>' +

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

  /* ── Footer: shared "Juridische info" (legal) column ──────────
     Injected so every page's footer stays in sync from one place.
     Replaces a page's placeholder "Legal" column in situ when present,
     otherwise appends a new column. ── */
  var LEGAL_LINKS = [
    ['/esg-beleid',              'ESG Beleid'],
    ['/klacht',                  'Klacht'],
    ['/beleggersrechten',        'De samenvatting van de rechten van de belegger'],
    ['/top-5-execution-venues',  'Top 5 execution venues']
  ];
  function mountFooterLegal() {
    var linksHTML = LEGAL_LINKS.map(function (l) {
      return '<li><a href="' + l[0] + '">' + l[1] + '</a></li>';
    }).join('');
    document.querySelectorAll('.site-footer .footer-inner').forEach(function (inner) {
      if (inner.getAttribute('data-legal-done')) return;
      inner.setAttribute('data-legal-done', '1');
      var legalCol = null;
      inner.querySelectorAll('.footer-col').forEach(function (c) {
        var h = c.querySelector('h4');
        if (h && /^(legal|juridische info)$/i.test(h.textContent.trim())) legalCol = c;
      });
      if (!legalCol) {
        legalCol = document.createElement('div');
        legalCol.className = 'footer-col';
        inner.appendChild(legalCol);
      }
      legalCol.classList.add('footer-col--legal');
      legalCol.innerHTML = '<h4>Juridische info</h4><ul>' + linksHTML + '</ul>';
    });
  }

  function init() {
    mountFooterLegal();
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
