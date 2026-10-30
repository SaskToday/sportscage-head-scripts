/**
 * SaskToday newsletter signup injector
 * Injects into #newsletter_signup_inject_container
 *
 * Posts to the Cloudflare signup Worker (see signup-worker/) which upserts
 * Mailchimp contacts and interest groups. Turnstile + honeypot on the client.
 *
 * Preview override: data-newsletter on the container, or ?st_newsletter=<key>
 */
(function () {
  // Shared shell version (layout chrome, Turnstile, success UX, etc.).
  // Each NEWSLETTERS entry also has its own `version` for copy/interest changes.
  // Sent to the API as `{newsletterKey}@{newsletterVersion}+{WIDGET_VERSION}`.
  // Bump the relevant piece and note it in WIDGET_CHANGELOG.md.
  var WIDGET_VERSION = '1.4.0';

  // ---------------------------------------------------------------------------
  // DEPLOY CONFIG — set after Worker + Turnstile are live
  // ---------------------------------------------------------------------------
  var SIGNUP = {
    // e.g. 'https://sasktoday-signup.<account>.workers.dev/subscribe'
    apiUrl: '',
    // Cloudflare Turnstile site key (public)
    turnstileSiteKey: '',
    // Optional override via window before this script loads:
    //   window.SASKTODAY_SIGNUP = { apiUrl: '...', turnstileSiteKey: '...' }
  };

  if (window.SASKTODAY_SIGNUP) {
    if (window.SASKTODAY_SIGNUP.apiUrl) SIGNUP.apiUrl = window.SASKTODAY_SIGNUP.apiUrl;
    if (window.SASKTODAY_SIGNUP.turnstileSiteKey) {
      SIGNUP.turnstileSiteKey = window.SASKTODAY_SIGNUP.turnstileSiteKey;
    }
  }

  // ---------------------------------------------------------------------------
  // CONTENT CONFIG — edit copy / interest keys here
  // Interest keys must match signup-worker/src/interests.ts
  // ---------------------------------------------------------------------------
  var NEWSLETTERS = {
    'regina-today': {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'ReginaToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Regina',
      headlineAfter: ' in a five-minute read.',
      body: "The day's local news in one email, in your inbox every day.",
      legalBrand: 'ReginaToday',
      interestKey: 'reginatoday-daily'
    },

    'saskatoon-today': {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskatoonToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Saskatoon',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Saskatoon news in one daily newsletter, delivered daily.',
      legalBrand: 'SaskatoonToday',
      interestKey: 'saskatoontoday-daily'
    },

    'estevan-today': {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'EstevanToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Estevan',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Estevan news in one daily newsletter, delivered daily.',
      legalBrand: 'EstevanToday',
      interestKey: 'estevantoday-daily'
    },

    // YorktonToday — embed / interest not ready yet
    // 'yorkton-today': { version: '1.0.0', ..., interestKey: 'yorktontoday-daily' },

    sasktoday: {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskToday Daily Newsletter',
      headlineBefore: 'Everything ',
      headlineAccent: 'Sask',
      headlineAfter: ' in a five-minute read.',
      body: 'Key Sask news in one daily newsletter, delivered daily.',
      legalBrand: 'SaskToday',
      // Daily defaulted; Weekly optional — keys match Worker INTERESTS map
      interestChoices: [
        { key: 'sasktoday-daily', label: 'Daily Newsletter', checked: true },
        { key: 'sasktoday-weekly', label: 'Weekly Newsletter', checked: false }
      ]
    },

    'saskag-today': {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SaskAgToday Daily Newsletter',
      headlineBefore: 'Key ',
      headlineAccent: 'Agriculture',
      headlineAfter: ' news in a five-minute read.',
      body:
        'The latest ag news, grain prices and precision weather forecasts. Delivered to you 5 days a week, Monday to Friday.',
      legalBrand: 'SaskAgToday',
      interestKey: 'saskagtoday-daily'
    },

    sportscage: {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'SportsCage Insider Report',
      headlineBefore: '',
      headlineAccent: 'Insider',
      headlineAfter: ' Report',
      body:
        "Covering all Saskatchewan sports. Here you'll find updates on everything from WHL to Curling to Baseball. Sends daily.",
      legalBrand: 'SportsCage',
      interestKey: 'sportscage-insider'
    },

    'crime-cops-court': {
      version: '1.0.0',
      layout: 'tagline-lead',
      accent: '#016a1b',
      whisker: 'Crime, Cops & Court Newsletter',
      headlineBefore: '',
      headlineAccent: 'Sask Crime',
      headlineAfter: " evolves quickly. We'll keep you in the loop.",
      body:
        'Get the latest crime updates from around Sask in our Crime, Cops & Court Report. Delivered 5-days a week to your inbox, Monday - Friday.',
      legalBrand: 'SaskToday',
      interestKey: 'crime-cops-court-daily'
    }
  };

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
  var SUCCESS_FALLBACK =
    "Thanks! Please check your inbox — if you're a new subscriber, we may need you to confirm your subscription.";

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

  /** Per-newsletter content version + shared shell, for Mailchimp Activity. */
  function buildWidgetVersion(newsletterKey, config) {
    var nv =
      config && typeof config.version === 'string' && config.version
        ? config.version
        : '0.0.0';
    var raw = String(newsletterKey || 'unknown') + '@' + nv + '+' + WIDGET_VERSION;
    // Worker / Mailchimp property cap
    return raw.slice(0, 40);
  }

  // ---------------------------------------------------------------------------
  // Targeting
  // ---------------------------------------------------------------------------
  function getQueryNewsletterKey() {
    try {
      return new URLSearchParams(window.location.search).get('st_newsletter');
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
    if (override) return override;

    var path = window.location.pathname || '/';
    for (var i = 0; i < PATH_RULES.length; i++) {
      var rule = PATH_RULES[i];
      for (var j = 0; j < rule.prefixes.length; j++) {
        if (pathMatchesPrefix(path, rule.prefixes[j])) return rule.key;
      }
    }
    return 'sasktoday';
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function ensureFonts() {
    if (document.getElementById('st-nl-tagline-fonts')) return;
    var link = document.createElement('link');
    link.id = 'st-nl-tagline-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Source+Sans+3:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }

  function ensureTurnstileScript(cb) {
    if (!SIGNUP.turnstileSiteKey) {
      cb();
      return;
    }
    if (window.turnstile) {
      cb();
      return;
    }
    var existing = document.getElementById('st-nl-turnstile');
    if (existing) {
      existing.addEventListener('load', function () {
        cb();
      });
      return;
    }
    var s = document.createElement('script');
    s.id = 'st-nl-turnstile';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = function () {
      cb();
    };
    document.head.appendChild(s);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uid(prefix, key) {
    return prefix + '-' + String(key).replace(/[^a-z0-9-]/gi, '');
  }

  function renderInterestChoices(config, formId) {
    if (!config.interestChoices || !config.interestChoices.length) return '';
    var html =
      '<fieldset class="st-nl-choices">' +
      '<legend class="st-nl-choices__legend">Delivery frequency <span class="asterisk">*</span></legend>' +
      '<div class="st-nl-choices__list">';
    for (var i = 0; i < config.interestChoices.length; i++) {
      var choice = config.interestChoices[i];
      var id = formId + '-choice-' + i;
      html +=
        '<label class="st-nl-choice" for="' +
        id +
        '">' +
        '<input type="checkbox" data-interest-key="' +
        escapeHtml(choice.key) +
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
      '<p class="st-nl-choices__error" hidden>Please select at least one option.</p>' +
      '</fieldset>';
    return html;
  }

  function buildTaglineLeadCardHtml(config, newsletterKey) {
    var accent = config.accent || '#016a1b';
    var formId = uid('st-nl-form', newsletterKey);
    var emailId = uid('st-nl-email', newsletterKey);
    var statusId = uid('st-nl-status', newsletterKey);
    var turnstileId = uid('st-nl-ts', newsletterKey);
    var submitId = uid('st-nl-submit', newsletterKey);

    // Note: never put `/* comment */ +` between CSS string fragments — unary +
    // coerces the next string to NaN and corrupts selectors (e.g. "nan.st-tl-card").
    return (
      '<style type="text/css">' +
      // Outer wrap reserves space for the offset accent shadow inside the host slot.
      '.st-tl-wrap {' +
      '  box-sizing: border-box; width: 100%; max-width: 100%;' +
      '  margin-top: 28px; padding: 0 14px 14px 0;' +
      '}' +
      '.st-tl-card {' +
      '  --ink: #141a16; --ink-soft: #3d443f; --muted: #555b56; --placeholder: #6b716c;' +
      '  --accent: ' +
      accent +
      '; --accent-hover: #014d13; --danger: #c4412b; --btn: #111a14;' +
      '  --serif: "Alfa Slab One", Georgia, serif;' +
      '  --sans: "Source Sans 3", system-ui, sans-serif;' +
      '  margin: 0; box-sizing: border-box; width: 100%; max-width: 100%;' +
      '  border: 3px solid var(--ink); background: #fff; padding: 32px 32px 28px;' +
      '  box-shadow: 10px 10px 0 var(--accent);' +
      '  display: flex; flex-direction: column; gap: 14px;' +
      '  font-family: var(--sans); color: var(--ink);' +
      '}' +
      '@media (max-width: 639px) {' +
      '  .st-tl-wrap { padding: 0 10px 10px 0; }' +
      '  .st-tl-card { padding: 22px 18px 22px; box-shadow: 8px 8px 0 var(--accent); }' +
      '  .st-tl-card__headline { font-size: 24px !important; }' +
      '}' +
      '.st-tl-card__whisker { font-size: 11px; line-height: 1; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }' +
      '.st-tl-card__headline { margin: 0; font-family: var(--serif) !important; font-weight: 400; font-size: 32px; line-height: 1.08; color: var(--ink); }' +
      '.st-tl-card__headline-accent { color: var(--accent); }' +
      '.st-tl-card__body { margin: 0; font-size: 14px; line-height: 1.45; color: var(--ink-soft); }' +
      '.st-tl-card a { color: var(--accent); text-decoration: underline; } .st-tl-card a:hover { color: var(--accent-hover); }' +
      '.st-tl-card .st-nl-signup { display: flex; flex-direction: column; gap: 14px; }' +
      '.st-tl-card form { margin: 0; display: flex; flex-direction: column; gap: 12px; }' +
      '.st-tl-card .mc-field-group { display: flex; flex-direction: column; gap: 8px; }' +
      '.st-tl-card .mc-field-group label { font-size: 11px; line-height: 1; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }' +
      '.st-tl-card .asterisk { color: var(--danger); }' +
      '.st-tl-card input[type="email"] {' +
      '  width: 100%; box-sizing: border-box; height: 44px; border: 0; border-bottom: 2px solid var(--ink);' +
      '  border-radius: 0; padding: 0; background: transparent; font-family: var(--sans); font-size: 15px; color: var(--ink); outline: none;' +
      '}' +
      '.st-tl-card input[type="email"]::placeholder { color: var(--placeholder); }' +
      '.st-tl-card input[type="email"]:focus { border-bottom-color: var(--accent); }' +
      '.st-tl-card .st-nl-hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }' +
      '.st-tl-card .st-nl-submit {' +
      '  -webkit-appearance: none; appearance: none; position: relative;' +
      '  display: inline-flex; align-items: center; justify-content: center;' +
      '  height: 48px; width: 100%; background: var(--btn); color: #fff;' +
      '  border: 0; border-radius: 3px; font-family: var(--sans); font-weight: 700; font-size: 13px;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-submit:hover { background: var(--accent); }' +
      '.st-tl-card .st-nl-submit:disabled:not(.is-busy) { opacity: 0.6; cursor: wait; }' +
      '.st-tl-card .st-nl-submit.is-busy { cursor: wait; }' +
      '.st-tl-card .st-nl-submit__label { display: inline-block; }' +
      '.st-tl-card .st-nl-submit.is-busy .st-nl-submit__label { visibility: hidden; }' +
      '.st-tl-card .st-nl-submit__spinner {' +
      '  display: none; box-sizing: border-box; position: absolute; left: 50%; top: 50%;' +
      '  width: 18px; height: 18px; margin: -9px 0 0 -9px;' +
      '  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%;' +
      '  animation: st-nl-spin 0.7s linear infinite;' +
      '}' +
      '.st-tl-card .st-nl-submit.is-busy .st-nl-submit__spinner { display: block; }' +
      '@keyframes st-nl-spin { to { transform: rotate(360deg); } }' +
      '.st-tl-card .st-nl-choices { border: 0 !important; margin: 0; padding: 0; min-width: 0; }' +
      // Host templates often style bare <legend> with underlines / ::after — reset hard.
      '.st-tl-card .st-nl-choices legend,' +
      '.st-tl-card .st-nl-choices .st-nl-choices__legend {' +
      '  font-size: 11px !important; line-height: 1.2 !important; font-weight: 700 !important;' +
      '  letter-spacing: 0.22em !important; text-transform: uppercase !important;' +
      '  color: var(--muted) !important; padding: 0 !important; margin: 0 0 8px !important;' +
      '  float: none !important; width: auto !important; max-width: 100% !important;' +
      '  display: block !important; background: none !important; background-image: none !important;' +
      '  border: 0 !important; border-width: 0 !important; border-bottom: 0 !important;' +
      '  border-style: none !important; box-shadow: none !important;' +
      '  text-decoration: none !important; text-decoration-line: none !important; outline: none !important;' +
      '}' +
      '.st-tl-card .st-nl-choices legend::before,' +
      '.st-tl-card .st-nl-choices legend::after,' +
      '.st-tl-card .st-nl-choices .st-nl-choices__legend::before,' +
      '.st-tl-card .st-nl-choices .st-nl-choices__legend::after {' +
      '  content: none !important; display: none !important; border: 0 !important;' +
      '  background: none !important; box-shadow: none !important; height: 0 !important; width: 0 !important;' +
      '}' +
      '.st-tl-card .st-nl-choices__list { display: flex; flex-direction: column; gap: 8px; }' +
      '.st-tl-card .st-nl-choice { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink); cursor: pointer; text-decoration: none; }' +
      '.st-tl-card .st-nl-choice input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }' +
      '.st-tl-card .st-nl-choices__error, .st-tl-card .st-nl-status { margin: 0; font-size: 13px; line-height: 1.45; }' +
      '.st-tl-card .st-nl-choices__error, .st-tl-card .st-nl-status.is-error { color: var(--danger); }' +
      '.st-tl-card .st-nl-status.is-ok { color: var(--accent-hover); }' +
      '.st-tl-card .st-nl-turnstile { min-height: 0; }' +
      '.st-tl-card .st-nl-success { display: flex; flex-direction: column; gap: 14px; align-items: stretch; }' +
      '.st-tl-card .st-nl-success[hidden], .st-tl-card .st-nl-signup[hidden],' +
      '.st-tl-card .st-tl-card__whisker[hidden], .st-tl-card .st-tl-card__headline[hidden] { display: none !important; }' +
      '.st-tl-card .st-nl-success__check {' +
      '  width: 56px; height: 56px; margin: 0 0 2px; color: var(--accent);' +
      '}' +
      '.st-tl-card .st-nl-success__check svg { display: block; width: 100%; height: 100%; }' +
      '.st-tl-card .st-nl-success__check-circle,' +
      '.st-tl-card .st-nl-success__check-mark {' +
      '  fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;' +
      '}' +
      '.st-tl-card .st-nl-success__check-circle {' +
      '  stroke-dasharray: 166; stroke-dashoffset: 166;' +
      '}' +
      '.st-tl-card .st-nl-success__check-mark {' +
      '  stroke-dasharray: 48; stroke-dashoffset: 48;' +
      '}' +
      '.st-tl-card .st-nl-success__check.is-animating .st-nl-success__check-circle {' +
      '  animation: st-nl-check-circle 0.55s cubic-bezier(0.65, 0, 0.45, 1) forwards;' +
      '}' +
      '.st-tl-card .st-nl-success__check.is-animating .st-nl-success__check-mark {' +
      '  animation: st-nl-check-mark 0.35s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;' +
      '}' +
      '@keyframes st-nl-check-circle { to { stroke-dashoffset: 0; } }' +
      '@keyframes st-nl-check-mark { to { stroke-dashoffset: 0; } }' +
      '.st-tl-card .st-nl-success__title {' +
      '  margin: 0; font-family: var(--serif) !important; font-weight: 400; font-size: 32px;' +
      '  line-height: 1.08; color: var(--ink);' +
      '}' +
      '@media (max-width: 639px) {' +
      '  .st-tl-card .st-nl-success__title { font-size: 24px !important; }' +
      '}' +
      '.st-tl-card .st-nl-success__message { margin: 0; font-size: 14px; line-height: 1.45; color: var(--ink-soft); }' +
      '.st-tl-card .st-nl-success__back {' +
      '  -webkit-appearance: none !important; appearance: none !important;' +
      '  height: 48px; width: 100%; background: transparent !important; color: var(--ink) !important;' +
      '  border: 2px solid var(--ink) !important; border-radius: 3px; box-shadow: none !important;' +
      '  outline: none; font-family: var(--sans); font-weight: 700; font-size: 13px;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-success__back:hover {' +
      '  background: var(--ink) !important; color: #fff !important; border-color: var(--ink) !important;' +
      '}' +
      /* No focus ring on Back — host themes / programmatic focus were painting a green outline. */ +
      '.st-tl-card .st-nl-success__back:focus,' +
      '.st-tl-card .st-nl-success__back:focus-visible,' +
      '.st-tl-card .st-nl-success__back:active {' +
      '  outline: none !important; border-color: var(--ink) !important; box-shadow: none !important;' +
      '}' +
      '.st-tl-card .st-nl-success__title:focus { outline: none; }' +
      '.st-tl-card__legal { margin: 2px 0 0; font-size: 11px; line-height: 1.5; color: var(--muted); }' +
      '</style>' +
      '<div class="st-tl-wrap">' +
      '<div class="st-tl-card" data-newsletter-key="' +
      escapeHtml(newsletterKey) +
      '">' +
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
      '  <div class="st-nl-signup">' +
      '  <p class="st-tl-card__body">' +
      escapeHtml(config.body || '') +
      '</p>' +
      '  <form id="' +
      formId +
      '" novalidate>' +
      (config.interestKey
        ? '<input type="hidden" name="interest" value="' +
          escapeHtml(config.interestKey) +
          '" />'
        : '') +
      renderInterestChoices(config, formId) +
      '    <div class="mc-field-group">' +
      '      <label for="' +
      emailId +
      '">Email address <span class="asterisk">*</span></label>' +
      '      <input type="email" name="email" id="' +
      emailId +
      '" required value="" placeholder="name@email.com" autocomplete="email" />' +
      '    </div>' +
      // Honeypot: avoid name="website" — browsers/password managers often autofill it,
      // which falsely trips the Worker honeypot and skips Mailchimp entirely.
      '    <div class="st-nl-hp" aria-hidden="true">' +
      '      <label>Company URL<input type="text" name="hp_field" tabindex="-1" autocomplete="off" value="" /></label>' +
      '    </div>' +
      '    <div class="st-nl-turnstile" id="' +
      turnstileId +
      '"></div>' +
      '    <p class="st-nl-status" id="' +
      statusId +
      '" role="status" hidden></p>' +
      '    <button type="submit" class="st-nl-submit" id="' +
      submitId +
      '" aria-busy="false">' +
      '<span class="st-nl-submit__label">Sign me up →</span>' +
      '<span class="st-nl-submit__spinner" aria-hidden="true"></span>' +
      '</button>' +
      '  </form>' +
      '  </div>' +
      '  <div class="st-nl-success" hidden>' +
      '    <div class="st-nl-success__check" aria-hidden="true">' +
      '      <svg viewBox="0 0 52 52" focusable="false">' +
      '        <circle class="st-nl-success__check-circle" cx="26" cy="26" r="24"></circle>' +
      '        <path class="st-nl-success__check-mark" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>' +
      '      </svg>' +
      '    </div>' +
      '    <h2 class="st-nl-success__title" tabindex="-1">You\'re all set</h2>' +
      '    <p class="st-nl-success__message" role="status"></p>' +
      '    <button type="button" class="st-nl-success__back">← Back to signup</button>' +
      '  </div>' +
      '  <p class="st-tl-card__legal">' +
      buildLegalHtml(config.legalBrand) +
      '</p>' +
      '</div>' +
      '</div>'
    );
  }

  function setStatus(el, message, kind) {
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = '';
      el.className = 'st-nl-status';
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.className = 'st-nl-status' + (kind ? ' is-' + kind : '');
  }

  function setSubmitBusy(btn, busy) {
    if (!btn) return;
    var on = !!busy;
    btn.disabled = on;
    if (on) btn.classList.add('is-busy');
    else btn.classList.remove('is-busy');
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function collectInterests(form, config) {
    if (config.interestKey) return [config.interestKey];
    var keys = [];
    var boxes = form.querySelectorAll('.st-nl-choices input[type="checkbox"]');
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) {
        keys.push(boxes[i].getAttribute('data-interest-key'));
      }
    }
    return keys;
  }

  function bindSignupForm(root, config, newsletterKey) {
    var form = root.querySelector('form');
    if (!form) return;

    var signupPanel = root.querySelector('.st-nl-signup');
    var successPanel = root.querySelector('.st-nl-success');
    var successMessage = root.querySelector('.st-nl-success__message');
    var successBack = root.querySelector('.st-nl-success__back');
    var successTitle = root.querySelector('.st-nl-success__title');
    var successCheck = root.querySelector('.st-nl-success__check');
    var whiskerEl = root.querySelector('.st-tl-card__whisker');
    var headlineEl = root.querySelector('.st-tl-card__headline');
    var statusEl = root.querySelector('.st-nl-status');
    var submitBtn = root.querySelector('.st-nl-submit');
    var turnstileHost = root.querySelector('.st-nl-turnstile');
    var turnstileWidgetId = null;
    var turnstileToken = '';
    var turnstileMountPromise = null;
    var TURNSTILE_WAIT_MS = 15000;

    function replaySuccessCheck() {
      if (!successCheck) return;
      successCheck.classList.remove('is-animating');
      // Force reflow so the draw animation restarts each success.
      void successCheck.offsetWidth;
      successCheck.classList.add('is-animating');
    }

    function showSignup() {
      if (whiskerEl) whiskerEl.hidden = false;
      if (headlineEl) headlineEl.hidden = false;
      if (signupPanel) signupPanel.hidden = false;
      if (successPanel) successPanel.hidden = true;
      if (successCheck) successCheck.classList.remove('is-animating');
      if (successMessage) successMessage.textContent = '';
      setStatus(statusEl, '', null);
    }

    function showSuccess(message) {
      if (successMessage) {
        successMessage.textContent = message || SUCCESS_FALLBACK;
      }
      if (whiskerEl) whiskerEl.hidden = true;
      if (headlineEl) headlineEl.hidden = true;
      if (signupPanel) signupPanel.hidden = true;
      if (successPanel) successPanel.hidden = false;
      replaySuccessCheck();
      // Focus the title (not Back) so we don't paint a focus ring on the button.
      if (successTitle && typeof successTitle.focus === 'function') {
        successTitle.focus({ preventScroll: true });
      }
    }

    function readTurnstileToken() {
      if (turnstileToken) return turnstileToken;
      if (SIGNUP.turnstileSiteKey && window.turnstile && turnstileWidgetId != null) {
        return window.turnstile.getResponse(turnstileWidgetId) || '';
      }
      return '';
    }

    /**
     * Lazy-mount Turnstile (script + widget). Safe to call many times.
     * Does not run on page load — only when warmed or on submit.
     */
    function ensureTurnstileMounted() {
      if (!SIGNUP.turnstileSiteKey) {
        return Promise.resolve();
      }
      if (turnstileWidgetId != null && window.turnstile) {
        return Promise.resolve();
      }
      if (turnstileMountPromise) return turnstileMountPromise;

      turnstileMountPromise = new Promise(function (resolve) {
        ensureTurnstileScript(function () {
          if (!window.turnstile || !turnstileHost) {
            resolve();
            return;
          }
          if (turnstileWidgetId != null) {
            resolve();
            return;
          }
          turnstileHost.innerHTML = '';
          turnstileToken = '';
          // Managed + interaction-only: invisible unless Cloudflare needs a checkbox.
          turnstileWidgetId = window.turnstile.render(turnstileHost, {
            sitekey: SIGNUP.turnstileSiteKey,
            theme: 'light',
            appearance: 'interaction-only',
            callback: function (token) {
              turnstileToken = token || '';
            },
            'expired-callback': function () {
              turnstileToken = '';
            },
            'error-callback': function () {
              turnstileToken = '';
            }
          });
          resolve();
        });
      });
      return turnstileMountPromise;
    }

    /** Wait until a token exists (or timeout). Used on submit so lazy mount still works. */
    function waitForTurnstileToken(timeoutMs) {
      if (!SIGNUP.turnstileSiteKey) {
        return Promise.resolve('');
      }
      return ensureTurnstileMounted().then(function () {
        var existing = readTurnstileToken();
        if (existing) return existing;

        return new Promise(function (resolve) {
          var started = Date.now();
          var timer = setInterval(function () {
            var token = readTurnstileToken();
            if (token || Date.now() - started >= timeoutMs) {
              clearInterval(timer);
              resolve(token || '');
            }
          }, 100);
        });
      });
    }

    var turnstileWarmStarted = false;
    function warmTurnstile() {
      if (turnstileWarmStarted) return;
      turnstileWarmStarted = true;
      ensureTurnstileMounted();
    }

    // Warm only on real engagement — not viewport (above-the-fold forms would
    // otherwise fire Turnstile for every passer-by). Submit always waits for a token.
    if (SIGNUP.turnstileSiteKey) {
      form.addEventListener('focusin', warmTurnstile);
      form.addEventListener('pointerdown', warmTurnstile);
    }

    if (successBack) {
      successBack.addEventListener('click', function () {
        form.reset();
        if (config.interestChoices) {
          var boxes = form.querySelectorAll('.st-nl-choices input[type="checkbox"]');
          for (var i = 0; i < boxes.length; i++) {
            boxes[i].checked = !!config.interestChoices[i].checked;
          }
        }
        showSignup();
        turnstileToken = '';
        if (SIGNUP.turnstileSiteKey && window.turnstile && turnstileWidgetId != null) {
          window.turnstile.reset(turnstileWidgetId);
        } else {
          turnstileMountPromise = null;
          warmTurnstile();
        }
        var emailInput = form.querySelector('input[name="email"]');
        if (emailInput) emailInput.focus();
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus(statusEl, '', null);

      if (!SIGNUP.apiUrl) {
        setStatus(
          statusEl,
          'Signup is not configured yet (missing Worker URL).',
          'error'
        );
        return;
      }

      var interests = collectInterests(form, config);
      var choiceError = form.querySelector('.st-nl-choices__error');
      if (config.interestChoices && !interests.length) {
        if (choiceError) choiceError.hidden = false;
        return;
      }
      if (choiceError) choiceError.hidden = true;

      var emailInput = form.querySelector('input[name="email"]');
      var email = emailInput ? String(emailInput.value || '').trim() : '';
      if (!email) {
        setStatus(statusEl, 'Please enter your email address.', 'error');
        if (emailInput) emailInput.focus();
        return;
      }

      var honeypot = form.querySelector('input[name="hp_field"]');
      var hpField = honeypot ? String(honeypot.value || '') : '';

      setSubmitBusy(submitBtn, true);

      waitForTurnstileToken(TURNSTILE_WAIT_MS)
        .then(function (token) {
          if (SIGNUP.turnstileSiteKey && !token) {
            setStatus(
              statusEl,
              'Please complete the verification challenge.',
              'error'
            );
            setSubmitBusy(submitBtn, false);
            return null;
          }

          var payload = {
            email: email,
            interests: interests,
            turnstileToken: token || '',
            hp_field: hpField,
            widgetVersion: buildWidgetVersion(newsletterKey, config)
          };
          if (interests.length === 1) payload.interest = interests[0];

          return fetch(SIGNUP.apiUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'omit'
          }).then(function (res) {
            return res.json().then(function (data) {
              return { res: res, data: data || {} };
            });
          });
        })
        .then(function (_ref) {
          if (!_ref) return;
          var res = _ref.res;
          var data = _ref.data;
          if (typeof console !== 'undefined' && console.log) {
            console.log('[SaskToday signup]', res.status, data);
          }
          if (res.ok && data.ok) {
            showSuccess(data.message || SUCCESS_FALLBACK);
          } else if (data.code === 'rate_limited' || res.status === 429) {
            setStatus(
              statusEl,
              data.message || 'Too many attempts, try again later.',
              'error'
            );
          } else if (data.code === 'paused' || res.status === 503) {
            setStatus(
              statusEl,
              data.message ||
                'Signups are temporarily unavailable, please try again later.',
              'error'
            );
          } else if (data.code === 'invalid_email') {
            setStatus(
              statusEl,
              data.message || 'Please check your email address.',
              'error'
            );
          } else {
            setStatus(
              statusEl,
              (data.message || 'Something went wrong. Please try again later.') +
                (data.code ? ' (' + data.code + ')' : ''),
              'error'
            );
          }
        })
        .catch(function (err) {
          setStatus(
            statusEl,
            'Something went wrong. Please try again later. (network/cors)',
            'error'
          );
          if (typeof console !== 'undefined' && console.error) {
            console.error('SaskToday signup failed', err);
          }
        })
        .then(function () {
          setSubmitBusy(submitBtn, false);
          if (
            signupPanel &&
            !signupPanel.hidden &&
            SIGNUP.turnstileSiteKey &&
            window.turnstile &&
            turnstileWidgetId != null
          ) {
            turnstileToken = '';
            window.turnstile.reset(turnstileWidgetId);
          }
        });
    });
  }

  // ---------------------------------------------------------------------------
  // Inject
  // ---------------------------------------------------------------------------
  function renderInto(target, keyOverride) {
    if (!target) return false;

    var key = keyOverride || resolveNewsletterKey(target);
    var config = NEWSLETTERS[key];
    if (!config) return false;

    ensureFonts();

    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildTaglineLeadCardHtml(config, key);

    target.innerHTML = '';
    while (wrapper.firstChild) {
      target.appendChild(wrapper.firstChild);
    }

    bindSignupForm(target, config, key);
    return true;
  }

  function inject() {
    renderInto(document.getElementById('newsletter_signup_inject_container'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  window.SaskTodayNewsletter = {
    NEWSLETTERS: NEWSLETTERS,
    PATH_RULES: PATH_RULES,
    SIGNUP: SIGNUP,
    WIDGET_VERSION: WIDGET_VERSION,
    buildWidgetVersion: buildWidgetVersion,
    resolveNewsletterKey: resolveNewsletterKey,
    renderInto: renderInto,
    inject: inject
  };
})();
