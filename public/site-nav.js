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

  /* ── Nav bar style: ?nav= overrides the page default ── */
  var m = window.location.search.match(/[?&]nav=([\w-]+)/);
  var style = (m && m[1]) || docEl.getAttribute('data-navstyle') || 'classic';
  if (style && style !== 'classic') docEl.classList.add('navstyle-' + style);

  /* Glass navs solidify on scroll */
  function onScroll() { docEl.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Markup ── */
  var HOMEPAGES = [
    ['/home',       'home',       'Home',      'Red — independent asset management'],
    ['/home1',      'home1',      'Buildings', 'Skyline — bold &amp; centered'],
    ['/home-blue',  'home-blue',  'Blue',      'Cinematic — navy hero'],
    ['/home-white', 'home-white', 'White',     'Light editorial'],
    ['/home6',      'home6',      'Cinematic Red',  'Dark cinematic — video hero'],
    ['/home7',      'home7',      'Cinematic Blue', 'Cinematic — blue accents']
  ];

  function homepageLinks() {
    return HOMEPAGES.map(function (h) {
      return '<a href="' + h[0] + '" data-page="' + h[1] + '" role="menuitem">' +
        '<div><strong>' + h[2] + '</strong><span>' + h[3] + '</span></div></a>';
    }).join('');
  }

  function navHTML() {
    return '' +
    '<nav class="site-nav" id="main-nav"><div class="nav-inner">' +
      '<a href="/home" class="nav-logo"><img src="/uploads/Wealtheon_logo_rgb.png" alt="Wealtheon" class="nav-logo-img" /></a>' +
      '<ul class="nav-links" id="nav-links">' +

        /* Welcome — 4 homepages */
        '<li data-group="home">' +
          '<button class="nav-dropdown-btn" data-dropdown="welcome-dropdown" aria-expanded="false" aria-haspopup="true">Welcome <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="welcome-dropdown" role="menu">' +
            '<div class="dropdown-col-title">Homepages</div>' +
            homepageLinks() +
          '</div>' +
        '</li>' +

        /* Services */
        '<li data-group="services">' +
          '<button class="nav-dropdown-btn" data-dropdown="services-dropdown" aria-expanded="false" aria-haspopup="true">Services <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown" id="services-dropdown" role="menu"><div class="dropdown-grid">' +
            '<div>' +
              '<div class="dropdown-col-title">Direct Lines</div>' +
              '<a href="/services#growth" role="menuitem"><div><strong>Growth</strong><span>High-growth equity strategy</span></div></a>' +
              '<a href="/services#high-conviction" role="menuitem"><div><strong>High Conviction</strong><span>Concentrated best-ideas portfolio</span></div></a>' +
              '<a href="/services#value" role="menuitem"><div><strong>Value</strong><span>Defensive, quality-at-discount</span></div></a>' +
            '</div>' +
            '<div>' +
              '<div class="dropdown-col-title">Funds</div>' +
              '<a href="/services#funds" role="menuitem"><div><strong>High Conviction Fund</strong><span>Concentrated multi-asset</span></div></a>' +
              '<a href="/services#funds" role="menuitem"><div><strong>Value Fund</strong><span>Defensive equity fund</span></div></a>' +
              '<a href="/services#funds" role="menuitem"><div><strong>Protea Fund Growth World Equity</strong><span>Global growth exposure</span></div></a>' +
              '<a href="/services#funds" role="menuitem"><div><strong>DBI-RDT Value Fund</strong><span>Tax-efficient value fund</span></div></a>' +
              '<div class="dropdown-col-title" style="margin-top:0.75rem;">Partners</div>' +
              '<a href="/services#financial-intermediaries" role="menuitem"><div><strong>Financial Intermediaries</strong><span>Partnership &amp; support model</span></div></a>' +
            '</div>' +
          '</div></div>' +
        '</li>' +

        /* About */
        '<li data-group="about">' +
          '<button class="nav-dropdown-btn" data-dropdown="about-dropdown" aria-expanded="false" aria-haspopup="true">About Us <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="about-dropdown" role="menu">' +
            '<a href="/about" role="menuitem"><div><strong>About Us</strong><span>Company, team &amp; offices</span></div></a>' +
          '</div>' +
        '</li>' +

        '<li data-group="impact"><a href="/impact">Impact</a></li>' +
        '<li data-group="foundation"><a href="/foundation">Foundation</a></li>' +
        '<li data-group="news"><a href="/news">News</a></li>' +

        /* Contact */
        '<li data-group="contact">' +
          '<button class="nav-dropdown-btn" data-dropdown="contact-dropdown" aria-expanded="false" aria-haspopup="true">Contact <span class="nav-arrow">▾</span></button>' +
          '<div class="dropdown dropdown-narrow" id="contact-dropdown" role="menu">' +
            '<a href="/contact" role="menuitem"><div><strong>Contact</strong><span>Form &amp; offices</span></div></a>' +
          '</div>' +
        '</li>' +

        '<li data-group="careers"><a href="/careers">Careers</a></li>' +
      '</ul>' +

      '<div class="nav-right">' +
        '<div class="lang-switcher">' +
          '<a href="#" class="active">EN</a><span class="lang-sep">|</span>' +
          '<a href="#">FR</a><span class="lang-sep">|</span><a href="#">NL</a>' +
        '</div>' +
        '<a href="/contact" class="nav-contact-btn">Contact Us</a>' +
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
