<script>
document.addEventListener('DOMContentLoaded', function() {
  (function() {
    var target = document.getElementById('details-widgets');
    if (!target) return;

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
  <p class="rr-signup-card__legal">By signing up you agree to receive emails from SportsCage, as well as our <a href="https://www.sportscage.com/other/terms-of-service">terms of service</a> and <a href="https://www.sportscage.com/other/privacy-policy">privacy policy</a>. 1900 Rose St, Regina SK S4P 0A9.</p>
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
  <p class="sc-signup-card__legal">By signing up you agree to receive emails from SportsCage, as well as our <a href="https://www.sportscage.com/other/terms-of-service">terms of service</a> and <a href="https://www.sportscage.com/other/privacy-policy">privacy policy</a>. 1900 Rose St, Regina SK S4P 0A9.</p>
</div>`;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    while (wrapper.firstChild) {
      target.insertBefore(wrapper.firstChild, target.firstChild);
    }
  })();
});
</script>
