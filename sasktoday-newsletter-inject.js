/**
 * SaskToday newsletter signup injector
 * Injects into #newsletter_signup_inject_container
 *
 * Content config (titles, descriptions, Mailchimp IDs) lives in NEWSLETTERS below.
 * Path rules live in PATH_RULES. Unmatched paths fall back to "sasktoday".
 *
 * Preview override: set data-newsletter on the container, or ?st_newsletter=<key>
 */
(function () {
  // ---------------------------------------------------------------------------
  // CONTENT CONFIG — edit descriptions / Mailchimp IDs here
  // ---------------------------------------------------------------------------
  var NEWSLETTERS = {
    'regina-today': {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'ReginaToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Regina',
      headlineAfter: ' in a five-minute read.',
      body: "The day's local news in one email, in your inbox every day.",
      legalBrand: 'ReginaToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      // Auto-opt into interest group (hidden field)
      groupField: 'group[24][8]',
      // MMERGE18 = Opt In Source on the SaskToday audience
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-regina-widget'
    },

    'saskatoon-today': {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskatoonToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Saskatoon',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Saskatoon news in one daily newsletter, delivered daily.',
      legalBrand: 'SaskatoonToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      groupField: 'group[26][32]',
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-saskatoon-widget'
    },

    'estevan-today': {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'EstevanToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Estevan',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Estevan news in one daily newsletter, delivered daily.',
      legalBrand: 'EstevanToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      groupField: 'group[13][1]',
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-estevan-widget'
    },

    // YorktonToday — embed not ready yet; path rules reserved below
    // 'yorkton-today': { ... },

    sasktoday: {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Sask',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Sask news in one daily newsletter, delivered daily.',
      legalBrand: 'SaskToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      // Main newsletter: show Daily / Weekly choices (Daily defaulted)
      interestChoices: [
        { name: 'group[14][2]', label: 'Daily Newsletter', checked: true },
        { name: 'group[14][4]', label: 'Weekly Newsletter', checked: false }
      ],
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-main-widget'
    },

    'saskag-today': {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskAgToday Daily Newsletter',
      headlineBefore: 'Key ',
      headlineAccent: 'Agriculture',
      headlineAfter: ' news in a five-minute read.',
      body:
        'The latest ag news, grain prices and precision weather forecasts. Delivered to you 5 days a week, Monday to Friday.',
      legalBrand: 'SaskAgToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      groupField: 'group[222934][64]',
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-saskag-widget'
    },

    sportscage: {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SportsCage Insider Report',
      // Mirrored from SportsCage site Insider widget (not Riders)
      headlineBefore: '',
      headlineAccent: 'Insider',
      headlineAfter: ' Report',
      body:
        'Covering all Saskatchewan sports. Here you\'ll find updates on everything from WHL to Curling to Baseball. Sends daily.',
      legalBrand: 'SportsCage',
      formAction:
        'https://harvardmedia.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=e0e70bc1df&f_id=002cb1e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_e0e70bc1df',
      groupField: 'group[222939][1]',
      sourceField: 'EMFSOURCE',
      sourceValue: 'sasktoday-sportscage-widget'
    },

    'crime-cops-court': {
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'Crime, Cops & Court Newsletter',
      headlineBefore: '',
      headlineAccent: 'Sask Crime',
      headlineAfter: " evolves quickly. We'll keep you in the loop.",
      body:
        'Get the latest crime updates from around Sask in our Crime, Cops & Court Report. Delivered 5-days a week to your inbox, Monday - Friday.',
      legalBrand: 'SaskToday',
      formAction:
        'https://sasktoday.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&id=b666fb9950&f_id=00cab6e6f0',
      honeypot: 'b_115183fbae903a83f5f107dab_b666fb9950',
      groupField: 'group[25][16]',
      sourceField: 'MMERGE18',
      sourceValue: 'sasktoday-crime-widget'
    }
  };
  // First matching prefix wins. Fallback: sasktoday.
  var PATH_RULES = [
    { prefixes: ['/regina-today', '/southwest/regina-news'], key: 'regina-today' },
    { prefixes: ['/saskatoon-today', '/north/saskatoon'], key: 'saskatoon-today' },
    {
      prefixes: ['/estevan-today', '/southeast/estevan-mercury', '/southeast/estevanmercury'],
      key: 'estevan-today'
    },
    {
      prefixes: ['/yorkton-today', '/central/yorkton-this-week', '/central/yorktonthisweek'],
      key: 'yorkton-today'
    },
    { prefixes: ['/agriculture'], key: 'saskag-today' },
    { prefixes: ['/sports'], key: 'sportscage' },
    { prefixes: ['/crime-cops-court'], key: 'crime-cops-court' }
  ];

  var MAILING_ADDRESS = '1900 Rose St, Regina SK S4P 0A9';
  var TERMS_URL = 'https://www.sasktoday.ca/other/terms-of-service';
  var PRIVACY_URL = 'https://www.sasktoday.ca/other/privacy-policy';

  function buildLegalHtml(brand) {
    return (
      'By signing up you agree to receive emails from ' +
      escapeHtml(brand || 'SaskToday') +
      ', as well as our ' +
      '<a href="' +
      TERMS_URL +
      '">terms of service</a> and ' +
      '<a href="' +
      PRIVACY_URL +
      '">privacy policy</a>. ' +
      'Unsubscribe anytime. ' +
      MAILING_ADDRESS +
      '.'
    );
  }

  // ---------------------------------------------------------------------------
  // Targeting
  // ---------------------------------------------------------------------------
  function getQueryNewsletterKey() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('st_newsletter');
    } catch (e) {
      return null;
    }
  }

  function pathMatchesPrefix(path, prefix) {
    return path === prefix || path.indexOf(prefix + '/') === 0;
  }

  function resolveNewsletterKey(container) {
    var override =
      (container && container.getAttribute('data-newsletter')) || getQueryNewsletterKey();
    if (override && NEWSLETTERS[override]) return override;
    // Known key requested but not configured yet (e.g. yorkton-today)
    if (override) return override;

    var path = window.location.pathname || '/';
    for (var i = 0; i < PATH_RULES.length; i++) {
      var rule = PATH_RULES[i];
      for (var j = 0; j < rule.prefixes.length; j++) {
        if (pathMatchesPrefix(path, rule.prefixes[j])) {
          return rule.key;
        }
      }
    }
    return 'sasktoday';
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function ensureFonts(config) {
    if (config.layout === 'tagline-lead') {
      if (document.getElementById('st-nl-tagline-fonts')) return;
      var preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect);

      var link = document.createElement('link');
      link.id = 'st-nl-tagline-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Source+Sans+3:wght@400;600;700&display=swap';
      document.head.appendChild(link);
      return;
    }

    if (document.getElementById('st-nl-montserrat')) return;
    var mont = document.createElement('link');
    mont.id = 'st-nl-montserrat';
    mont.rel = 'stylesheet';
    mont.href =
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap';
    document.head.appendChild(mont);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTitle(config) {
    if (config.titleStyle === 'today') {
      var title = config.title;
      var idx = title.lastIndexOf('Today');
      if (idx > 0) {
        var city = title.slice(0, idx);
        return (
          '<span class="st-nl-green">' +
          escapeHtml(city) +
          '</span>Today'
        );
      }
    }
    return escapeHtml(config.title);
  }

  function renderInterestFields(config) {
    if (config.interestChoices && config.interestChoices.length) {
      var html =
        '<fieldset class="st-nl-choices">' +
        '<legend>Delivery frequency <span class="asterisk">*</span></legend>' +
        '<div class="st-nl-choices__list">';
      for (var i = 0; i < config.interestChoices.length; i++) {
        var choice = config.interestChoices[i];
        var id = 'st-nl-choice-' + i;
        html +=
          '<label class="st-nl-choice" for="' +
          id +
          '">' +
          '<input type="checkbox" name="' +
          escapeHtml(choice.name) +
          '" id="' +
          id +
          '" value="1"' +
          (choice.checked ? ' checked' : '') +
          ' />' +
          '<span>' +
          escapeHtml(choice.label) +
          '</span>' +
          '</label>';
      }
      html +=
        '</div>' +
        '<p class="st-nl-choices__error" id="st-nl-choices-error" hidden>Please select at least one option.</p>' +
        '</fieldset>';
      return html;
    }

    if (config.groupField) {
      return (
        '<input type="hidden" name="' +
        escapeHtml(config.groupField) +
        '" value="1" />'
      );
    }
    return '';
  }

  function renderFormFields(config) {
    return (
      renderInterestFields(config) +
      '            <div class="clear" id="mce-responses">' +
      '              <div class="response" id="mce-error-response" style="display:none;">&nbsp;</div>' +
      '              <div class="response" id="mce-success-response" style="display:none;">&nbsp;</div>' +
      '            </div>' +
      '            <div aria-hidden="true" style="position:absolute;left:-5000px;">' +
      '              <input type="text" name="' +
      escapeHtml(config.honeypot) +
      '" tabindex="-1" value="" />' +
      '            </div>' +
      (config.sourceField
        ? '            <input type="hidden" name="' +
          escapeHtml(config.sourceField) +
          '" value="' +
          escapeHtml(config.sourceValue || '') +
          '" />'
        : '')
    );
  }

  function buildTaglineLeadCardHtml(config) {
    var accent = config.accent || '#016a1b';
    return (
      '<style type="text/css">' +
      '.st-tl-card {' +
      '  --ink: #141a16;' +
      '  --ink-soft: #3d443f;' +
      '  --muted: #555b56;' +
      '  --placeholder: #6b716c;' +
      '  --accent: ' +
      accent +
      ';' +
      '  --accent-hover: #014d13;' +
      '  --danger: #c4412b;' +
      '  --btn: #111a14;' +
      '  --serif: "Alfa Slab One", Georgia, serif;' +
      '  --sans: "Source Sans 3", system-ui, sans-serif;' +
      '  margin-top: 40px;' +
      '  box-sizing: border-box;' +
      '  border: 3px solid var(--ink);' +
      '  background: #fff;' +
      '  padding: 44px 44px 40px;' +
      '  box-shadow: 14px 14px 0 var(--accent);' +
      '  display: flex;' +
      '  flex-direction: column;' +
      '  gap: 20px;' +
      '  font-family: var(--sans);' +
      '  color: var(--ink);' +
      '}' +
      '@media (max-width: 639px) {' +
      '  .st-tl-card { padding: 28px 24px 28px; box-shadow: 10px 10px 0 var(--accent); }' +
      '  .st-tl-card__headline { font-size: 34px !important; }' +
      '}' +
      '.st-tl-card__whisker {' +
      '  font-size: 13px; line-height: 1; font-weight: 700;' +
      '  letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);' +
      '}' +
      '.st-tl-card__headline {' +
      '  margin: 0; font-family: var(--serif) !important; font-weight: 400;' +
      '  font-size: 46px; line-height: 1.06; color: var(--ink);' +
      '}' +
      '.st-tl-card__headline-accent { color: var(--accent); }' +
      '.st-tl-card__body {' +
      '  margin: 0; font-size: 20px; line-height: 1.45; color: var(--ink-soft);' +
      '}' +
      '.st-tl-card a { color: var(--accent); }' +
      '.st-tl-card a:hover { color: var(--accent-hover); }' +
      '.st-tl-card .st-mc-host { margin-top: 8px; }' +
      '.st-tl-card #mc_embed_signup { background: transparent; clear: left; font: inherit; width: 100%; }' +
      '.st-tl-card #mc_embed_signup form { padding: 0; margin: 0; }' +
      '.st-tl-card .mc-field-group { width: 100%; padding-bottom: 0; display: flex; flex-direction: column; gap: 10px; }' +
      '.st-tl-card .mc-field-group label {' +
      '  font-size: 12px; line-height: 1; font-weight: 700;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted);' +
      '}' +
      '.st-tl-card .asterisk { color: var(--danger); }' +
      '.st-tl-card #mce-EMAIL {' +
      '  width: 100%; box-sizing: border-box; height: 54px;' +
      '  border: 0; border-bottom: 3px solid var(--ink); border-radius: 0;' +
      '  padding: 0; background: transparent;' +
      '  font-family: var(--sans); font-size: 19px; color: var(--ink); outline: none;' +
      '}' +
      '.st-tl-card #mce-EMAIL::placeholder { color: var(--placeholder); }' +
      '.st-tl-card #mce-EMAIL:focus { border-bottom-color: var(--accent); }' +
      '.st-tl-card .clear { margin-top: 18px; }' +
      '.st-tl-card #mc-embedded-subscribe {' +
      '  -webkit-appearance: none; appearance: none;' +
      '  height: 60px; width: 100%; background: var(--btn); color: #fff;' +
      '  border: 0; border-radius: 3px;' +
      '  font-family: var(--sans); font-weight: 700; font-size: 16px;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer;' +
      '  transition: background .2s ease, transform .15s ease;' +
      '}' +
      '.st-tl-card #mc-embedded-subscribe:hover { background: var(--accent); }' +
      '.st-tl-card #mc-embedded-subscribe:active { transform: translateY(1px); }' +
      '.st-tl-card .response { font-size: 13px; padding: 8px 0; }' +
      '.st-tl-card #mce-error-response { color: var(--danger); }' +
      '.st-tl-card #mce-success-response { color: var(--accent-hover); }' +
      '.st-tl-card .st-nl-choices { border: 0; margin: 16px 0 0; padding: 0; }' +
      '.st-tl-card .st-nl-choices legend {' +
      '  font-size: 12px; line-height: 1; font-weight: 700;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted);' +
      '  padding: 0; margin-bottom: 10px;' +
      '}' +
      '.st-tl-card .st-nl-choices__list { display: flex; flex-direction: column; gap: 10px; }' +
      '.st-tl-card .st-nl-choice {' +
      '  display: flex; align-items: center; gap: 10px;' +
      '  font-size: 17px; color: var(--ink); cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-choice input {' +
      '  width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-choices__error {' +
      '  margin: 8px 0 0; font-size: 13px; color: var(--danger);' +
      '}' +
      '.st-tl-card__legal {' +
      '  margin: 4px 0 0; font-size: 14px; line-height: 1.55; color: var(--muted);' +
      '}' +
      '</style>' +
      '<div class="st-tl-card">' +
      '  <div class="st-tl-card__whisker">' +
      escapeHtml(config.whisker) +
      '</div>' +
      '  <h1 class="st-tl-card__headline">' +
      escapeHtml(config.headlineBefore || '') +
      (config.headlineAccent
        ? '<span class="st-tl-card__headline-accent">' +
          escapeHtml(config.headlineAccent) +
          '</span>'
        : '') +
      escapeHtml(config.headlineAfter || '') +
      '</h1>' +
      '  <p class="st-tl-card__body">' +
      escapeHtml(config.body || '') +
      '</p>' +
      '  <div class="st-mc-host">' +
      '    <div id="mc_embed_shell">' +
      '      <div id="mc_embed_signup">' +
      '        <form action="' +
      escapeHtml(config.formAction) +
      '" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>' +
      '          <div id="mc_embed_signup_scroll">' +
      '            <div class="mc-field-group">' +
      '              <label for="mce-EMAIL">Email address <span class="asterisk">*</span></label>' +
      '              <input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required value="" placeholder="name@email.com" />' +
      '            </div>' +
      renderFormFields(config) +
      '            <div class="clear">' +
      '              <input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Sign me up →" />' +
      '            </div>' +
      '          </div>' +
      '        </form>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <p class="st-tl-card__legal">' +
      buildLegalHtml(config.legalBrand) +
      '</p>' +
      '</div>'
    );
  }

  function buildLegacyCardHtml(config) {
    return (
      '<style type="text/css">' +
      // Card chrome mirrors SportsCage Riders widget (white bg, ink border, green shadow)
      '.st-signup-card {' +
      '  --ink: #101a14;' +
      '  --ink-55: rgba(16,26,20,.55);' +
      '  --ink-50: rgba(16,26,20,.50);' +
      '  --green: #1f7a4d;' +
      '  --green-deep: #155a39;' +
      '  --title-green: #016a1b;' +
      '  --display: "Montserrat", "Arial Black", sans-serif;' +
      '}' +
      '.st-signup-card { margin-top: 40px; background: #fff; border: 2px solid var(--ink); border-radius: 2px; padding: 28px; box-shadow: 8px 8px 0 0 var(--green); }' +
      '@media (min-width: 640px) { .st-signup-card { padding: 32px; } }' +
      '.st-signup-card__head h2 { font-family: var(--display) !important; font-weight: 900; font-size: 28px; margin: 0; text-transform: uppercase; line-height: 1.1; letter-spacing: -0.02em; color: var(--ink); }' +
      '.st-nl-green { color: var(--title-green) !important; }' +
      '.st-signup-card__sub { margin: 10px 0 0; font-size: 14px; color: rgba(16,26,20,.7); line-height: 1.5; }' +
      '.st-signup-card__legal { margin-top: 20px; font-size: 11px; line-height: 1.6; color: var(--ink-55); }' +
      '.st-signup-card__legal a { text-decoration: underline; color: inherit; }' +
      '#mc_embed_signup .button { height: auto !important; }' +
      '.st-mc-host { margin-top: 24px; }' +
      '.st-mc-host #mc_embed_signup { background: transparent; clear: left; font: inherit; width: 100%; }' +
      '.st-mc-host #mc_embed_signup form { padding: 0; margin: 0; }' +
      '.st-mc-host .mc-field-group { width: 100%; padding-bottom: 0; }' +
      '.st-mc-host .mc-field-group label { display: block; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: var(--ink-55); margin-bottom: 8px; }' +
      '.st-mc-host .asterisk { color: var(--green); }' +
      '.st-mc-host #mce-EMAIL { width: 100%; background: transparent; border: 0; border-bottom: 2px solid var(--ink); border-radius: 0; padding: 10px 0 12px; font-size: 18px; font-family: inherit; color: var(--ink); outline: none; transition: border-color .2s ease; box-sizing: border-box; }' +
      '.st-mc-host #mce-EMAIL:focus { border-bottom-color: var(--green); }' +
      '.st-mc-host .clear { margin-top: 18px; }' +
      '.st-mc-host #mc-embedded-subscribe { -webkit-appearance: none; appearance: none; width: 100%; background: var(--ink); color: #fff; border: 0; border-radius: 2px; padding: 16px 20px; font-family: inherit; font-size: 13px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .2s ease, transform .15s ease; }' +
      '.st-mc-host #mc-embedded-subscribe:hover { background: var(--green); }' +
      '.st-mc-host #mc-embedded-subscribe:active { transform: translateY(1px); }' +
      '.st-mc-host .response { font-size: 13px; padding: 8px 0; }' +
      '.st-mc-host #mce-error-response { color: #b3261e; }' +
      '.st-mc-host #mce-success-response { color: var(--green-deep); }' +
      '.st-nl-choices { border: 0; margin: 20px 0 0; padding: 0; }' +
      '.st-nl-choices legend { font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: var(--ink-55); padding: 0; margin-bottom: 10px; }' +
      '.st-nl-choices__list { display: flex; flex-direction: column; gap: 10px; }' +
      '.st-nl-choice { display: flex; align-items: center; gap: 10px; font-size: 15px; color: var(--ink); cursor: pointer; }' +
      '.st-nl-choice input { width: 18px; height: 18px; accent-color: var(--green); cursor: pointer; }' +
      '.st-nl-choices__error { margin: 8px 0 0; font-size: 13px; color: #b3261e; }' +
      '</style>' +
      '<div class="st-signup-card">' +
      '  <div class="st-signup-card__head">' +
      '    <h2>' +
      renderTitle(config) +
      '</h2>' +
      '  </div>' +
      '  <p class="st-signup-card__sub">' +
      escapeHtml(config.description) +
      '</p>' +
      '  <div class="st-mc-host">' +
      '    <div id="mc_embed_shell">' +
      '      <div id="mc_embed_signup">' +
      '        <form action="' +
      escapeHtml(config.formAction) +
      '" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>' +
      '          <div id="mc_embed_signup_scroll">' +
      '            <div class="mc-field-group">' +
      '              <label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label>' +
      '              <input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required value="" />' +
      '            </div>' +
      renderFormFields(config) +
      '            <div class="clear">' +
      '              <input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Sign me up →" />' +
      '            </div>' +
      '          </div>' +
      '        </form>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <p class="st-signup-card__legal">' +
      buildLegalHtml('SaskToday') +
      '</p>' +
      '</div>'
    );
  }

  function buildCardHtml(config) {
    if (config.layout === 'tagline-lead') {
      return buildTaglineLeadCardHtml(config);
    }
    return buildLegacyCardHtml(config);
  }

  function bindInterestValidation(root, config) {
    if (!config.interestChoices || !config.interestChoices.length) return;
    var form = root.querySelector('#mc-embedded-subscribe-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      var boxes = form.querySelectorAll('.st-nl-choices input[type="checkbox"]');
      var anyChecked = false;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
          anyChecked = true;
          break;
        }
      }
      var errorEl = form.querySelector('#st-nl-choices-error');
      if (!anyChecked) {
        e.preventDefault();
        if (errorEl) errorEl.hidden = false;
        return;
      }
      if (errorEl) errorEl.hidden = true;
    });
  }

  // ---------------------------------------------------------------------------
  // Inject
  // ---------------------------------------------------------------------------
  function renderInto(target, keyOverride) {
    if (!target) return false;

    var key = keyOverride || resolveNewsletterKey(target);
    var config = NEWSLETTERS[key];
    if (!config) {
      // Path matched a reserved key (e.g. yorkton-today) with no config yet
      return false;
    }

    ensureFonts(config);

    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildCardHtml(config);

    target.innerHTML = '';
    while (wrapper.firstChild) {
      target.appendChild(wrapper.firstChild);
    }

    bindInterestValidation(target, config);
    return true;
  }

  function inject() {
    var target = document.getElementById('newsletter_signup_inject_container');
    renderInto(target);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Expose for previews / debugging
  window.SaskTodayNewsletter = {
    NEWSLETTERS: NEWSLETTERS,
    PATH_RULES: PATH_RULES,
    resolveNewsletterKey: resolveNewsletterKey,
    renderInto: renderInto,
    inject: inject
  };
})();