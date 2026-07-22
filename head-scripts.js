document.addEventListener('DOMContentLoaded', function() {
  (function() {
    var target = document.getElementById('details-widgets');
    if (!target) return;

    if (window.location.pathname.indexOf('/roughriders/riders-community-discussion/') !== -1) return;

    var path = window.location.pathname;
    var isRiders = path.indexOf('/roughriders') === 0 || path.indexOf('/football') === 0 || path.indexOf('/cfl') === 0;

    var html = isRiders ? `
<style type="text/css">
.rr-signup-card {
  --ink: #101a14;
  --ink-55: rgba(16,26,20,.55);
  --ink-50: rgba(16,26,20,.50);
  --green: #1f7a4d;
  --green-deep: #155a39;
  --serif: "stymie", "Georgia", serif;
}
.rr-signup-card { margin-top: 40px; background: #fff; border: 2px solid var(--ink); border-radius: 2px; padding: 28px; box-shadow: 8px 8px 0 0 var(--green); }
@media (min-width: 640px) { .rr-signup-card { padding: 32px; } }
.rr-signup-card__head { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.rr-signup-card__head h2 { font-family: var(--serif) !important; font-weight: 400; font-size: 28px; margin: 0; text-transform: uppercase; line-height: 1.1; }
.rr-signup-card__logo-riders { height: 48px; width: auto; display: block; }
.rr-signup-card__sub { margin: 10px 0 0; font-size: 14px; color: rgba(16,26,20,.7); line-height: 1.5; }
.rr-signup-card__legal { margin-top: 20px; font-size: 11px; line-height: 1.6; color: var(--ink-55); }
.rr-signup-card__legal a { text-decoration: underline; }
.rr-green { color: var(--green) !important; }
#mc_embed_signup .button { height: auto !important; }
.rr-mc-host { margin-top: 24px; }
.rr-mc-host #mc_embed_signup { background: transparent; clear: left; font: inherit; width: 100%; }
.rr-mc-host #mc_embed_signup p { display: none; }
.rr-mc-host #mc_embed_signup form { padding: 0; margin: 0; }
.rr-mc-host #mc_embed_signup > div[style] { max-width: none !important; }
.rr-mc-host .mc-field-group { width: 100%; padding-bottom: 0; }
.rr-mc-host .mc-field-group label { display: block; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: var(--ink-55); margin-bottom: 8px; }
.rr-mc-host .asterisk { color: var(--green); }
.rr-mc-host #mce-EMAIL { width: 100%; background: transparent; border: 0; border-bottom: 2px solid var(--ink); border-radius: 0; padding: 10px 0 12px; font-size: 18px; font-family: inherit; color: var(--ink); outline: none; transition: border-color .2s ease; }
.rr-mc-host #mce-EMAIL:focus { border-bottom-color: var(--green); }
.rr-mc-host .clear { margin-top: 18px; }
.rr-mc-host #mc-embedded-subscribe { -webkit-appearance: none; appearance: none; width: 100%; background: var(--ink); color: #fff; border: 0; border-radius: 2px; padding: 16px 20px; font-family: inherit; font-size: 13px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .2s ease, transform .15s ease; }
.rr-mc-host #mc-embedded-subscribe:hover { background: var(--green); }
.rr-mc-host #mc-embedded-subscribe:active { transform: translateY(1px); }
.rr-mc-host .response { font-size: 13px; padding: 8px 0; }
.rr-mc-host #mce-error-response { color: #b3261e; }
.rr-mc-host #mce-success-response { color: var(--green-deep); }
</style>

<div class="rr-signup-card">
  <div class="rr-signup-card__head">
    <img class="rr-signup-card__logo-riders" src="https://www.vmcdn.ca/f/files/sportscage/roughriders-logo.png" alt="Saskatchewan Roughriders" />
    <h2><span class="rr-green">Riders</span> All Access <span class="rr-green">Report</span></h2>
  </div>
  <p class="rr-signup-card__sub">Daily Riders updates and analysis from those who have played the game at the highest level. Sends daily during Riders season, then semi-frequently.</p>
  <div class="rr-mc-host">
    <div id="mc_embed_shell">
      <div id="mc_embed_signup">
        <p>Our FREE Riders All Access Report keeps you up to date with the most important Riders news. No commitments - unsubscribe anytime.</p>
        <div style="max-width:600px">
          <form action="https://harvardmedia.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&amp;id=e0e70bc1df&amp;f_id=0026b1e6f0"
                method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank">
            <div id="mc_embed_signup_scroll">
              <div class="mc-field-group">
                <label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label>
                <input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required value="" />
              </div>
              <div class="clear" id="mce-responses">
                <div class="response" id="mce-error-response" style="display:none;">&nbsp;</div>
                <div class="response" id="mce-success-response" style="display:none;">&nbsp;</div>
              </div>
              <div aria-hidden="true" style="position:absolute;left:-5000px;">
                <input type="text" name="b_115183fbae903a83f5f107dab_e0e70bc1df" tabindex="-1" value="" />
              </div>
              <input type="hidden" name="group[222940][2]" value="1" />
              <input type="hidden" name="EMFSOURCE" value="sportscage-roughriders-widget" />
              <div class="clear">
                <input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Sign me up →" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <p class="rr-signup-card__legal">By signing up you agree to receive emails from SportsCage, as well as our <a href="https://www.sportscage.com/other/terms-of-service">terms of service</a> and <a href="https://www.sportscage.com/other/privacy-policy">privacy policy</a>. Unsubscribe anytime. 1900 Rose St, Regina SK S4P 0A9.</p>
</div>` : `
<style type="text/css">
.sc-signup-card {
  --ink: #101a14;
  --ink-55: rgba(16,26,20,.55);
  --ink-50: rgba(16,26,20,.50);
  --green: #1f7a4d;
  --green-deep: #155a39;
  --green-bg: rgba(31,122,77,.06);
  --serif: "stymie", "Georgia", serif;
}
.sc-signup-card { margin-top: 40px; background: var(--green-bg); border: 2px solid var(--green); border-radius: 2px; padding: 28px; box-shadow: 8px 8px 0 0 var(--ink); }
@media (min-width: 640px) { .sc-signup-card { padding: 32px; } }
.sc-signup-card__head { display: flex; flex-direction: column; gap: 12px; }
.sc-signup-card__logo-sc { height: 32px; width: auto; max-width: 200px; display: block; object-fit: contain; }
.sc-signup-card__head h2 { font-family: var(--serif) !important; font-weight: 400; font-size: 28px; margin: 0; text-transform: uppercase; line-height: 1.1; }
.sc-signup-card__sub { margin: 10px 0 0; font-size: 14px; color: rgba(16,26,20,.7); line-height: 1.5; }
.sc-signup-card__legal { margin-top: 20px; font-size: 11px; line-height: 1.6; color: var(--ink-55); }
.sc-signup-card__legal a { text-decoration: underline; }
.sc-green { color: var(--green) !important; }
#mc_embed_signup .button { height: auto !important; }
.sc-mc-host { margin-top: 24px; }
.sc-mc-host #mc_embed_signup { background: transparent; clear: left; font: inherit; width: 100%; }
.sc-mc-host #mc_embed_signup p { display: none; }
.sc-mc-host #mc_embed_signup form { padding: 0; margin: 0; }
.sc-mc-host #mc_embed_signup > div[style] { max-width: none !important; }
.sc-mc-host .mc-field-group { width: 100%; padding-bottom: 0; }
.sc-mc-host .mc-field-group label { display: block; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: var(--ink-55); margin-bottom: 8px; }
.sc-mc-host .asterisk { color: var(--green); }
.sc-mc-host #mce-EMAIL { width: 100%; background: transparent; border: 0; border-bottom: 2px solid var(--ink); border-radius: 0; padding: 10px 0 12px; font-size: 18px; font-family: inherit; color: var(--ink); outline: none; transition: border-color .2s ease; }
.sc-mc-host #mce-EMAIL:focus { border-bottom-color: var(--green); }
.sc-mc-host .clear { margin-top: 18px; }
.sc-mc-host #mc-embedded-subscribe { -webkit-appearance: none; appearance: none; width: 100%; background: var(--green); color: #fff; border: 0; border-radius: 2px; padding: 16px 20px; font-family: inherit; font-size: 13px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .2s ease, transform .15s ease; }
.sc-mc-host #mc-embedded-subscribe:hover { background: var(--green-deep); }
.sc-mc-host #mc-embedded-subscribe:active { transform: translateY(1px); }
.sc-mc-host .response { font-size: 13px; padding: 8px 0; }
.sc-mc-host #mce-error-response { color: #b3261e; }
.sc-mc-host #mce-success-response { color: var(--green-deep); }
</style>

<div class="sc-signup-card">
  <div class="sc-signup-card__head">
    <img class="sc-signup-card__logo-sc" src="https://www.vmcdn.ca/files/sportscage/images/logos/HMI-SPORTS-CAGE-RIDERS-green.svg" alt="SportsCage" />
    <h2><span class="sc-green">Insider</span> Report</h2>
  </div>
  <p class="sc-signup-card__sub">Covering all Saskatchewan sports. Here you'll find updates on everything from WHL to Curling to Baseball. Sends daily.</p>
  <div class="sc-mc-host">
    <div id="mc_embed_shell">
      <div id="mc_embed_signup">
        <p>Our FREE SportsCage Insider Report keeps you up to date with the most important sports news. No commitments - unsubscribe anytime.</p>
        <div style="max-width:600px">
          <form action="https://harvardmedia.us18.list-manage.com/subscribe/post?u=115183fbae903a83f5f107dab&amp;id=e0e70bc1df&amp;f_id=002cb1e6f0"
                method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank">
            <div id="mc_embed_signup_scroll">
              <div class="mc-field-group">
                <label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label>
                <input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required value="" />
              </div>
              <div class="clear" id="mce-responses">
                <div class="response" id="mce-error-response" style="display:none;">&nbsp;</div>
                <div class="response" id="mce-success-response" style="display:none;">&nbsp;</div>
              </div>
              <div aria-hidden="true" style="position:absolute;left:-5000px;">
                <input type="text" name="b_115183fbae903a83f5f107dab_e0e70bc1df" tabindex="-1" value="" />
              </div>
              <input type="hidden" name="group[222939][1]" value="1" />
              <input type="hidden" name="EMFSOURCE" value="sportscage-insider-widget" />
              <div class="clear">
                <input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Sign me up →" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <p class="sc-signup-card__legal">By signing up you agree to receive emails from SportsCage, as well as our <a href="https://www.sportscage.com/other/terms-of-service">terms of service</a> and <a href="https://www.sportscage.com/other/privacy-policy">privacy policy</a>. Unsubscribe anytime. 1900 Rose St, Regina SK S4P 0A9.</p>
</div>`;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    while (wrapper.firstChild) {
      target.insertBefore(wrapper.firstChild, target.firstChild);
    }
  })();

  (function() {
      function isRbnLiveWindow() {
        // Production window: July 12, 2026 5:00 PM ET – July 13, 2026 12:00 AM ET
        var start = Date.parse('2026-07-12T17:00:00-04:00');
        var end = Date.parse('2026-07-13T00:00:00-04:00');
        return Date.now() >= start && Date.now() < end;
      }

      function isMobileLayout() {
        return window.matchMedia('(max-width: 991px)').matches;
      }

      function getBannerHeight() {
        return isMobileLayout() ? 38 : 42;
      }

      function getBodyContainerMargin() {
        var bannerHeight = getBannerHeight();
        var header = document.querySelector('header');
        if (!header) {
          return bannerHeight;
        }

        if (isMobileLayout()) {
          if (
            document.body.classList.contains('scrolled') &&
            document.body.classList.contains('has-slot-alert')
          ) {
            return bannerHeight + 136;
          }

          if (
            document.body.classList.contains('has-slot-alert') &&
            document.body.classList.contains('scrollup')
          ) {
            return bannerHeight + 87;
          }
        }

        return bannerHeight + header.offsetHeight;
      }

      function syncBodyOffset() {
        var bodyContainer = document.getElementById('body-container');
        if (!bodyContainer) return;

        bodyContainer.style.setProperty(
          'margin-top',
          getBodyContainerMargin() + 'px',
          'important'
        );
      }

      function bindLayoutSync() {
        var resizeTimer;
        window.addEventListener('resize', function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
            var banner = document.getElementById('sc-rbn-live-banner-v2');
            var height = getBannerHeight();
            if (banner) {
              banner.style.setProperty('--sc-rbn-banner-height', height + 'px');
            }
            document.documentElement.style.setProperty('--sc-rbn-banner-height', height + 'px');
            syncBodyOffset();
          }, 100);
        });

        if (window.MutationObserver) {
          var observer = new MutationObserver(syncBodyOffset);
          observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

          var header = document.querySelector('header');
          if (header) {
            observer.observe(header, { childList: true, subtree: true, attributes: true });
          }
        }
      }

      function buildTickerSegmentHtml() {
        var footballIcon =
          '<span class="sc-rbn-live-banner-v2__football" aria-hidden="true">' +
          '<i class="fa-solid fa-football"></i>' +
          '</span>';

        return (
          '<span class="sc-rbn-live-banner-v2__segment">' +
          'Riders vs Tiger-Cats' +
          footballIcon +
          'Click to watch the Rider Broadcast Network live now' +
          '</span>'
        );
      }

      function injectRbnLiveBannerV2() {
        if (!isRbnLiveWindow()) return;

        if (!document.body || document.getElementById('sc-rbn-live-banner-v2')) return;

        var bannerHeight = getBannerHeight();
        var tickerSegment = buildTickerSegmentHtml();
        var ariaLabel = 'Riders vs Tiger-Cats - Click to watch the Rider Broadcast Network live now. Opens live stream in a new tab.';

        var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = [
          '.sc-rbn-live-banner-v2 {',
          '  --sc-green: #016a1b;',
          '  --sc-green-dark: #014814;',
          '  --sc-rbn-banner-height: 42px;',
          '  display: block;',
          '  width: 100%;',
          '  height: var(--sc-rbn-banner-height);',
          '  background: var(--sc-green);',
          '  border-bottom: 1px solid var(--sc-green-dark);',
          '  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);',
          '}',
          '.sc-rbn-live-banner-v2:hover { background: var(--sc-green-dark); }',
          '.sc-rbn-live-banner-v2__container {',
          '  max-width: 990px;',
          '  height: 100%;',
          '  margin: 0 auto;',
          '  padding: 0 15px;',
          '}',
          '.sc-rbn-live-banner-v2__link {',
          '  display: flex;',
          '  align-items: center;',
          '  height: 100%;',
          '  text-decoration: none !important;',
          '  color: #fff;',
          '}',
          '.sc-rbn-live-banner-v2__link:hover,',
          '.sc-rbn-live-banner-v2__link:focus {',
          '  text-decoration: none !important;',
          '  color: #fff;',
          '}',
          '.sc-rbn-live-banner-v2__inner {',
          '  display: flex;',
          '  align-items: center;',
          '  gap: 12px;',
          '  width: 100%;',
          '  min-width: 0;',
          '}',
          '.sc-rbn-live-banner-v2__icon {',
          '  flex: 0 0 auto;',
          '  display: block;',
          '  width: 28px;',
          '  height: 28px;',
          '}',
          '.sc-rbn-live-banner-v2__icon svg {',
          '  display: block;',
          '  width: 28px;',
          '  height: 28px;',
          '}',
          '.sc-rbn-live-banner-v2__signal {',
          '  transform-box: fill-box;',
          '  transform-origin: center;',
          '}',
          '.sc-rbn-live-banner-v2__signal--inner {',
          '  fill: rgba(255, 255, 255, 0.45);',
          '  animation: sc-rbn-v2-signal-inner 2s ease-in-out infinite;',
          '}',
          '.sc-rbn-live-banner-v2__signal--outer {',
          '  fill: rgba(255, 255, 255, 0.75);',
          '  animation: sc-rbn-v2-signal-outer 2s ease-in-out infinite;',
          '}',
          '.sc-rbn-live-banner-v2__tower { fill: #fff; }',
          '.sc-rbn-live-banner-v2__ticker {',
          '  flex: 1 1 auto;',
          '  min-width: 0;',
          '  overflow: hidden;',
          '  height: 100%;',
          '  display: flex;',
          '  align-items: center;',
          '}',
          '.sc-rbn-live-banner-v2__track {',
          '  display: flex;',
          '  width: max-content;',
          '  animation: sc-rbn-v2-ticker 18s linear infinite;',
          '}',
          '.sc-rbn-live-banner-v2__segment {',
          '  flex: 0 0 auto;',
          '  display: inline-flex;',
          '  align-items: center;',
          '  gap: 0.65rem;',
          '  padding-right: 3rem;',
          '  font-family: "beachwood-variable", sans-serif;',
          '  font-size: 13px;',
          '  font-weight: 600;',
          '  letter-spacing: 0.08em;',
          '  line-height: 1;',
          '  text-transform: uppercase;',
          '  white-space: nowrap;',
          '  color: #fff;',
          '}',
          '.sc-rbn-live-banner-v2__football {',
          '  display: inline-flex;',
          '  align-items: center;',
          '  justify-content: center;',
          '  flex: 0 0 auto;',
          '  color: rgba(255, 255, 255, 0.92);',
          '}',
          '.sc-rbn-live-banner-v2__football i {',
          '  font-size: 14px;',
          '  line-height: 1;',
          '}',
          '@keyframes sc-rbn-v2-signal-inner {',
          '  0%, 100% { opacity: 0.35; transform: scale(0.92); }',
          '  20% { opacity: 1; transform: scale(1); }',
          '  45% { opacity: 0.35; transform: scale(1); }',
          '}',
          '@keyframes sc-rbn-v2-signal-outer {',
          '  0%, 100% { opacity: 0.4; transform: scale(0.88); }',
          '  20% { opacity: 0.4; transform: scale(0.88); }',
          '  45% { opacity: 1; transform: scale(1); }',
          '  70% { opacity: 0.4; transform: scale(1.04); }',
          '}',
          '@keyframes sc-rbn-v2-ticker {',
          '  0% { transform: translateX(0); }',
          '  100% { transform: translateX(-33.333%); }',
          '}',
          '@media (min-width: 992px) {',
          '  body.sc-rbn-live-banner-v2-active .sc-rbn-live-banner-v2 {',
          '    position: fixed;',
          '    top: 0;',
          '    left: 0;',
          '    right: 0;',
          '    z-index: 30;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active header {',
          '    top: var(--sc-rbn-banner-height) !important;',
          '  }',
          '}',
          '@media (max-width: 991px) {',
          '  .sc-rbn-live-banner-v2 { --sc-rbn-banner-height: 38px; }',
          '  body.sc-rbn-live-banner-v2-active .sc-rbn-live-banner-v2 {',
          '    position: fixed;',
          '    top: 0;',
          '    left: 0;',
          '    right: 0;',
          '    z-index: 30;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active header {',
          '    top: var(--sc-rbn-banner-height) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.scrollup header {',
          '    top: var(--sc-rbn-banner-height) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.has-slot-alert.scrollup header,',
          '  body.sc-rbn-live-banner-v2-active.scrolled.has-slot-alert header {',
          '    top: calc(var(--sc-rbn-banner-height) + 27px) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.scroll header {',
          '    top: calc(var(--sc-rbn-banner-height) - 60px) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active .slot-leaderboard .slot-fixed {',
          '    top: var(--sc-rbn-banner-height) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.scrollup .slot-leaderboard .slot-fixed {',
          '    top: calc(var(--sc-rbn-banner-height) + 60px) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.has-slot-alert .slot-leaderboard .slot-fixed {',
          '    top: calc(var(--sc-rbn-banner-height) + 28px) !important;',
          '  }',
          '  body.sc-rbn-live-banner-v2-active.has-slot-alert.scrollup .slot-leaderboard .slot-fixed,',
          '  body.sc-rbn-live-banner-v2-active.scrolled.has-slot-alert .slot-leaderboard .slot-fixed {',
          '    top: calc(var(--sc-rbn-banner-height) + 87px) !important;',
          '  }',
          '}',
          '@media (max-width: 575px) {',
          '  .sc-rbn-live-banner-v2__container { max-width: none; padding: 0 10px; }',
          '  .sc-rbn-live-banner-v2__inner { gap: 8px; }',
          '  .sc-rbn-live-banner-v2__icon,',
          '  .sc-rbn-live-banner-v2__icon svg { width: 24px; height: 24px; }',
          '  .sc-rbn-live-banner-v2__segment { font-size: 11px; letter-spacing: 0.05em; padding-right: 2rem; gap: 0.5rem; }',
          '  .sc-rbn-live-banner-v2__football i { font-size: 12px; }',
          '  .sc-rbn-live-banner-v2__track { animation-duration: 14s; }',
          '}',
          '@media (prefers-reduced-motion: reduce) {',
          '  .sc-rbn-live-banner-v2__signal { animation: none; }',
          '  .sc-rbn-live-banner-v2__signal--inner { opacity: 0.7; transform: none; }',
          '  .sc-rbn-live-banner-v2__signal--outer { opacity: 0.9; transform: none; }',
          '  .sc-rbn-live-banner-v2__track { animation: none; transform: none; }',
          '}'
        ].join('\n');

        document.head.appendChild(style);

        var banner = document.createElement('div');
        banner.id = 'sc-rbn-live-banner-v2';
        banner.className = 'sc-rbn-live-banner-v2';
        banner.style.setProperty('--sc-rbn-banner-height', bannerHeight + 'px');
        document.documentElement.style.setProperty('--sc-rbn-banner-height', bannerHeight + 'px');
        banner.innerHTML = [
          '<div class="sc-rbn-live-banner-v2__container">',
          '  <a class="sc-rbn-live-banner-v2__link" href="https://www.youtube.com/live/p_506H_E6aI?si=S5-scDclZK96NZ7V" target="_blank" rel="noopener noreferrer" aria-label="' + ariaLabel + '">',
          '    <div class="sc-rbn-live-banner-v2__inner">',
          '      <span class="sc-rbn-live-banner-v2__icon" aria-hidden="true">',
          '        <svg viewBox="0 0 193.5 177.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
          '          <path class="sc-rbn-live-banner-v2__signal sc-rbn-live-banner-v2__signal--outer" d="M55.3,156.1c-25.3-14.5-42.3-41.7-42.3-72.9S29.3,26,53.7,11.3L47.2,0C18.9,17,0,47.9,0,83.2s19.7,67.6,49,84.3l6.3-11.4Z"/>',
          '          <path class="sc-rbn-live-banner-v2__signal sc-rbn-live-banner-v2__signal--outer" d="M138.2,156.1c25.3-14.5,42.3-41.7,42.3-72.9,0-30.5-16.3-57.2-40.7-71.9l6.5-11.3c28.3,17,47.2,47.9,47.2,83.2,0,36.1-19.7,67.6-49,84.3l-6.3-11.4Z"/>',
          '          <path class="sc-rbn-live-banner-v2__signal sc-rbn-live-banner-v2__signal--inner" d="M72.1,127.2c-15.1-8.6-25.3-24.8-25.3-43.4s9.8-34.1,24.3-42.8l-6.4-11.4c-18.5,11-30.9,31.1-30.9,54.2s12.9,44,32,54.8l6.3-11.4Z"/>',
          '          <path class="sc-rbn-live-banner-v2__signal sc-rbn-live-banner-v2__signal--inner" d="M121.4,127.2c15.1-8.6,25.3-24.8,25.3-43.4,0-18.2-9.8-34.1-24.3-42.8l6.4-11.4c18.5,11,30.9,31.1,30.9,54.2s-12.9,44-32,54.8l-6.3-11.4Z"/>',
          '          <path class="sc-rbn-live-banner-v2__tower" d="M119.3,82.9c0-12.5-10.1-22.6-22.6-22.6s-22.6,10.1-22.6,22.6,6,17.8,14.4,21.1l-12.4,63.3c0,5.4,4.4,9.8,9.8,9.8h21.7c5.4,0,9.8-4.4,9.8-9.8l-12.7-63.2c8.6-3.2,14.7-11.5,14.7-21.2Z"/>',
          '        </svg>',
          '      </span>',
          '      <div class="sc-rbn-live-banner-v2__ticker" aria-hidden="true">',
          '        <div class="sc-rbn-live-banner-v2__track">',
          '          ' + tickerSegment,
          '          ' + tickerSegment,
          '          ' + tickerSegment,
          '        </div>',
          '      </div>',
          '    </div>',
          '  </a>',
          '</div>'
        ].join('');

        var header = document.querySelector('header');
        if (header && header.parentNode) {
          header.parentNode.insertBefore(banner, header);
        } else {
          document.body.insertBefore(banner, document.body.firstChild);
        }

        document.body.classList.add('sc-rbn-live-banner-v2-active');
        syncBodyOffset();
        bindLayoutSync();

        window.setTimeout(syncBodyOffset, 250);
        window.setTimeout(syncBodyOffset, 1000);
      }

    injectRbnLiveBannerV2();
  })();
});
