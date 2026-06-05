/* Wealtheon — shared site chrome (floating "VEX" glass nav + footer).
   Each page: <body data-page="diensten">, with <div id="site-header"></div>
   near the top and <div id="site-footer"></div> at the bottom. */
(function () {
  var NAV = [
    { key: 'diensten', label: 'Diensten', href: 'Diensten.html', children: [
      { label: 'Value', href: 'Strategie — Value.html', note: 'Patrimoniale ankerpositie' },
      { label: 'Growth', href: 'Strategie — Growth.html', note: 'Kern van de portefeuille' },
      { label: 'High Conviction', href: 'Strategie — High Conviction.html', note: 'Offensieve satelliet' },
      { label: 'Fondsen', href: 'Diensten.html#fondsen', note: 'Ons fondsenaanbod' },
      { label: 'Financiële tussenpersonen', href: 'Diensten.html#tussenpersonen', note: 'Samenwerkingsmodel' }
    ]},
    { key: 'over', label: 'Over ons', href: 'Over ons.html' },
    { key: 'impact', label: 'Impact', href: 'Over ons.html#impact' },
    { key: 'nieuws', label: 'Nieuws', href: 'Over ons.html#nieuws' },
    { key: 'careers', label: 'Careers', href: 'Contact.html#careers' }
  ];

  function buildHeader(active) {
    var items = NAV.map(function (n) {
      var isActive = n.key === active ? ' data-active' : '';
      if (n.children) {
        var sub = n.children.map(function (c) {
          return '<a class="wc-dd-item" href="' + c.href + '"><span class="wc-dd-label">' + c.label +
            '</span><span class="wc-dd-note">' + c.note + '</span></a>';
        }).join('');
        return '<div class="wc-navitem wc-has-dd">' +
          '<a href="' + n.href + '"' + isActive + '>' + n.label + ' <span class="wc-caret">▾</span></a>' +
          '<div class="wc-dd"><div class="wc-dd-inner">' + sub + '</div></div></div>';
      }
      return '<div class="wc-navitem"><a href="' + n.href + '"' + isActive + '>' + n.label + '</a></div>';
    }).join('');

    return '<div class="wc-header" data-header><div class="wc-barwrap"><nav class="wc-bar">' +
      '<a class="wc-logo" href="Wealtheon Hero.html"><img src="wealtheon-site/assets/logo-wealtheon.png" alt="Wealtheon"/></a>' +
      '<div class="wc-nav">' + items + '</div>' +
      '<div class="wc-right">' +
        '<div class="wc-lang" data-lang><button data-active>NL</button><button>FR</button><button>EN</button></div>' +
        '<a class="wc-cta" href="Contact.html">Plan een gesprek</a>' +
      '</div>' +
    '</nav></div></div>';
  }

  function buildFooter() {
    return '<footer class="wc-footer"><div class="wrap">' +
      '<div class="wc-foot-grid">' +
        '<div class="wc-foot-col">' +
          '<img class="logo-negative" src="wealtheon-site/assets/logo-wealtheon.png" alt="Wealtheon"/>' +
          '<p>Onafhankelijke Belgische vermogensbeheerder sinds 1971. Fee-only, in familiehanden.</p>' +
          '<div class="wc-foot-region"><span>Regio</span><button data-active>Europa</button><button>Zwitserland</button></div>' +
        '</div>' +
        '<div><h5>Diensten</h5><ul>' +
          '<li><a href="Strategie — Value.html">Value</a></li>' +
          '<li><a href="Strategie — Growth.html">Growth</a></li>' +
          '<li><a href="Strategie — High Conviction.html">High Conviction</a></li>' +
          '<li><a href="Diensten.html#fondsen">Fondsen</a></li>' +
          '<li><a href="Diensten.html#tussenpersonen">Tussenpersonen</a></li>' +
        '</ul></div>' +
        '<div><h5>Wealtheon</h5><ul>' +
          '<li><a href="Over ons.html">Over ons</a></li>' +
          '<li><a href="Over ons.html#impact">Impact</a></li>' +
          '<li><a href="Over ons.html#nieuws">Nieuws</a></li>' +
          '<li><a href="Contact.html#careers">Careers</a></li>' +
        '</ul></div>' +
        '<div><h5>Kantoren</h5><ul><li>Brussel</li><li>Waregem</li><li>Eindhoven</li><li>Genève</li></ul></div>' +
      '</div>' +
      '<div class="wc-foot-bot">' +
        '<span>© 2026 Wealtheon Asset Management · www.wealtheon.eu</span>' +
        '<span class="wc-legal"><a href="#">Privacy</a><a href="#">Disclaimer</a><a href="#">ESG-beleid</a><a href="#">Klachten</a></span>' +
      '</div>' +
    '</div></footer>';
  }

  function init() {
    var active = document.body.getAttribute('data-page') || '';
    var h = document.getElementById('site-header');
    var f = document.getElementById('site-footer');
    if (h) h.innerHTML = buildHeader(active);
    if (f) f.innerHTML = buildFooter();

    var hdr = document.querySelector('.wc-header');
    if (hdr) {
      var onScroll = function () { if (window.scrollY > 16) hdr.setAttribute('data-scrolled',''); else hdr.removeAttribute('data-scrolled'); };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }
    document.querySelectorAll('[data-lang] button, .wc-foot-region button').forEach(function (b) {
      b.addEventListener('click', function () {
        b.parentElement.querySelectorAll('button').forEach(function (x){ x.removeAttribute('data-active'); });
        b.setAttribute('data-active','');
      });
    });

    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(function (e){ io.observe(e); });
    } else { els.forEach(function (e){ e.classList.add('in'); }); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
