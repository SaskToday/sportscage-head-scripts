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
  // Bump when shipping widget changes; add a note in WIDGET_CHANGELOG.md
  var WIDGET_VERSION = '1.2.0';

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
    // 'yorkton-today': { ..., interestKey: 'yorktontoday-daily' },

    sasktoday: {
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
      existing.addEventListener('load', cb);
      return;
    }
    var s = document.createElement('script');
    s.id = 'st-nl-turnstile';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = cb;
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
      '<legend>Delivery frequency <span class="asterisk">*</span></legend>' +
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

    return (
      '<style type="text/css">' +
      '.st-tl-card {' +
      '  --ink: #141a16; --ink-soft: #3d443f; --muted: #555b56; --placeholder: #6b716c;' +
      '  --accent: ' +
      accent +
      '; --accent-hover: #014d13; --danger: #c4412b; --btn: #111a14;' +
      '  --serif: "Alfa Slab One", Georgia, serif;' +
      '  --sans: "Source Sans 3", system-ui, sans-serif;' +
      '  margin-top: 40px; box-sizing: border-box; border: 3px solid var(--ink);' +
      '  background: #fff; padding: 44px 44px 40px; box-shadow: 14px 14px 0 var(--accent);' +
      '  display: flex; flex-direction: column; gap: 20px;' +
      '  font-family: var(--sans); color: var(--ink);' +
      '}' +
      '@media (max-width: 639px) {' +
      '  .st-tl-card { padding: 28px 24px 28px; box-shadow: 10px 10px 0 var(--accent); }' +
      '  .st-tl-card__headline { font-size: 34px !important; }' +
      '}' +
      '.st-tl-card__whisker { font-size: 13px; line-height: 1; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }' +
      '.st-tl-card__headline { margin: 0; font-family: var(--serif) !important; font-weight: 400; font-size: 46px; line-height: 1.06; color: var(--ink); }' +
      '.st-tl-card__headline-accent { color: var(--accent); }' +
      '.st-tl-card__body { margin: 0; font-size: 20px; line-height: 1.45; color: var(--ink-soft); }' +
      '.st-tl-card a { color: var(--accent); } .st-tl-card a:hover { color: var(--accent-hover); }' +
      '.st-tl-card .st-nl-signup { display: flex; flex-direction: column; gap: 20px; }' +
      '.st-tl-card form { margin: 0; display: flex; flex-direction: column; gap: 16px; }' +
      '.st-tl-card .mc-field-group { display: flex; flex-direction: column; gap: 10px; }' +
      '.st-tl-card .mc-field-group label { font-size: 12px; line-height: 1; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }' +
      '.st-tl-card .asterisk { color: var(--danger); }' +
      '.st-tl-card input[type="email"] {' +
      '  width: 100%; box-sizing: border-box; height: 54px; border: 0; border-bottom: 3px solid var(--ink);' +
      '  border-radius: 0; padding: 0; background: transparent; font-family: var(--sans); font-size: 19px; color: var(--ink); outline: none;' +
      '}' +
      '.st-tl-card input[type="email"]::placeholder { color: var(--placeholder); }' +
      '.st-tl-card input[type="email"]:focus { border-bottom-color: var(--accent); }' +
      '.st-tl-card .st-nl-hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }' +
      '.st-tl-card .st-nl-submit {' +
      '  -webkit-appearance: none; appearance: none; height: 60px; width: 100%; background: var(--btn); color: #fff;' +
      '  border: 0; border-radius: 3px; font-family: var(--sans); font-weight: 700; font-size: 16px;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-submit:hover { background: var(--accent); }' +
      '.st-tl-card .st-nl-submit:disabled { opacity: 0.6; cursor: wait; }' +
      '.st-tl-card .st-nl-choices { border: 0; margin: 0; padding: 0; }' +
      '.st-tl-card .st-nl-choices legend { font-size: 12px; line-height: 1; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); padding: 0; margin-bottom: 10px; }' +
      '.st-tl-card .st-nl-choices__list { display: flex; flex-direction: column; gap: 10px; }' +
      '.st-tl-card .st-nl-choice { display: flex; align-items: center; gap: 10px; font-size: 17px; color: var(--ink); cursor: pointer; }' +
      '.st-tl-card .st-nl-choice input { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }' +
      '.st-tl-card .st-nl-choices__error, .st-tl-card .st-nl-status { margin: 0; font-size: 14px; line-height: 1.45; }' +
      '.st-tl-card .st-nl-choices__error, .st-tl-card .st-nl-status.is-error { color: var(--danger); }' +
      '.st-tl-card .st-nl-status.is-ok { color: var(--accent-hover); }' +
      '.st-tl-card .st-nl-turnstile { min-height: 0; }' +
      '.st-tl-card .st-nl-success { display: flex; flex-direction: column; gap: 20px; }' +
      '.st-tl-card .st-nl-success[hidden], .st-tl-card .st-nl-signup[hidden] { display: none !important; }' +
      '.st-tl-card .st-nl-success__title { margin: 0; font-family: var(--serif); font-weight: 400; font-size: 28px; line-height: 1.15; color: var(--ink); }' +
      '.st-tl-card .st-nl-success__message { margin: 0; font-size: 20px; line-height: 1.45; color: var(--ink-soft); }' +
      '.st-tl-card .st-nl-success__back {' +
      '  -webkit-appearance: none; appearance: none; height: 60px; width: 100%; background: transparent; color: var(--ink);' +
      '  border: 3px solid var(--ink); border-radius: 3px; font-family: var(--sans); font-weight: 700; font-size: 16px;' +
      '  letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer;' +
      '}' +
      '.st-tl-card .st-nl-success__back:hover { background: var(--ink); color: #fff; }' +
      '.st-tl-card__legal { margin: 4px 0 0; font-size: 14px; line-height: 1.55; color: var(--muted); }' +
      '</style>' +
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
      '">Sign me up →</button>' +
      '  </form>' +
      '  </div>' +
      '  <div class="st-nl-success" hidden>' +
      '    <p class="st-nl-success__title">You\'re all set</p>' +
      '    <p class="st-nl-success__message" role="status"></p>' +
      '    <button type="button" class="st-nl-success__back">← Back to signup</button>' +
      '  </div>' +
      '  <p class="st-tl-card__legal">' +
      buildLegalHtml(config.legalBrand) +
      '</p>' +
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
    var statusEl = root.querySelector('.st-nl-status');
    var submitBtn = root.querySelector('.st-nl-submit');
    var turnstileHost = root.querySelector('.st-nl-turnstile');
    var turnstileWidgetId = null;

    function showSignup() {
      if (signupPanel) signupPanel.hidden = false;
      if (successPanel) successPanel.hidden = true;
      if (successMessage) successMessage.textContent = '';
      setStatus(statusEl, '', null);
    }

    function showSuccess(message) {
      if (successMessage) {
        successMessage.textContent = message || SUCCESS_FALLBACK;
      }
      if (signupPanel) signupPanel.hidden = true;
      if (successPanel) successPanel.hidden = false;
      if (successBack) successBack.focus();
    }

    function renderTurnstile() {
      if (!SIGNUP.turnstileSiteKey || !window.turnstile || !turnstileHost) return;
      turnstileHost.innerHTML = '';
      // Managed widget in Cloudflare dashboard + interaction-only here:
      // most visitors see nothing; checkbox only appears when a challenge is needed.
      turnstileWidgetId = window.turnstile.render(turnstileHost, {
        sitekey: SIGNUP.turnstileSiteKey,
        theme: 'light',
        appearance: 'interaction-only'
      });
    }

    ensureTurnstileScript(renderTurnstile);

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
        if (SIGNUP.turnstileSiteKey && window.turnstile && turnstileWidgetId != null) {
          window.turnstile.reset(turnstileWidgetId);
        } else {
          renderTurnstile();
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

      var turnstileToken = '';
      if (SIGNUP.turnstileSiteKey && window.turnstile && turnstileWidgetId != null) {
        turnstileToken = window.turnstile.getResponse(turnstileWidgetId) || '';
        if (!turnstileToken) {
          setStatus(statusEl, 'Please complete the verification challenge.', 'error');
          return;
        }
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus(statusEl, 'Submitting…', null);

      var payload = {
        email: email,
        interests: interests,
        turnstileToken: turnstileToken,
        hp_field: hpField,
        widgetVersion: WIDGET_VERSION
      };
      if (interests.length === 1) payload.interest = interests[0];

      fetch(SIGNUP.apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit'
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { res: res, data: data || {} };
          });
        })
        .then(function (_ref) {
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
          if (submitBtn) submitBtn.disabled = false;
          if (
            signupPanel &&
            !signupPanel.hidden &&
            SIGNUP.turnstileSiteKey &&
            window.turnstile &&
            turnstileWidgetId != null
          ) {
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
    resolveNewsletterKey: resolveNewsletterKey,
    renderInto: renderInto,
    inject: inject
  };
})();
