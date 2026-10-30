# Newsletter widget versions

The front-end inject script (`sasktoday-newsletter-inject.js`) sends a `widgetVersion` on every signup. The Worker writes that value onto the Mailchimp contact **Activity** event so we can see which widget build a person used.

## How to ship a new version

1. Make your copy/design/behavior changes in `sasktoday-newsletter-inject.js` (and Worker if needed).
2. Bump `WIDGET_VERSION` at the top of `sasktoday-newsletter-inject.js` (semver: `MAJOR.MINOR.PATCH`).
3. Add a section below describing what changed.
4. Commit. Optionally tag: `git tag widget-v1.2.0 && git push --tags`.

Use the tag / commit SHA later if you need to check out exactly that UI.

## Version history

### 1.3.6 — 2026-10-30

- Remove green focus outline on Back to signup (was from focusing that button after success); move focus to the success title instead

### 1.3.5 — 2026-10-30

- Success screen: hide main headline, style “You’re all set” as the headline, animated green checkmark, restyle Back button (no host blue border/focus ring)

### 1.3.4 — 2026-10-30

- In-progress signup shows a spinner inside the Sign me up button instead of “Verifying…” / “Submitting…” status text

### 1.3.3 — 2026-10-30

- Fix CSS string concat that turned style selectors into `NaN` (legend reset + wrap padding never applied)
- Same visual intent as 1.3.2: no legend underline, accent shadow inside host slot, ~30% smaller type

### 1.3.2 — 2026-10-30

- Production style polish: reset `legend` underline inheritance, keep accent shadow inside the host slot, ~30% smaller headline/body/legal type (broken in the field — use 1.3.3)

### 1.3.1 — 2026-10-30

- Turnstile warms only on form engagement (focus / pointer), not viewport — better for above-the-fold embeds
- Submit still mounts + waits for a token if the user never interacted first

### 1.3.0 — 2026-10-30

- Lazy Turnstile: load/render on viewport/focus/submit (avoided a verification per pageview)
- Submit waits up to 15s for a token so signup still works if the user hits send immediately

### 1.2.0 — 2026-10-30

- Turnstile `appearance: 'interaction-only'` (Managed widget) — checkbox only when Cloudflare needs a challenge

### 1.1.0 — 2026-10-30

- Success uses a dedicated panel (hides the form) with **← Back to signup**
- New success copy: check inbox / may need to confirm if new subscriber

### 1.0.0 — 2026-10-29

- Tagline-lead card design (Alfa Slab One / Source Sans 3)
- Posts to Cloudflare signup Worker (not Mailchimp embed)
- Turnstile + honeypot (`hp_field`)
- Interest keys for Regina / Saskatoon / Estevan / SaskToday / SaskAg / Crime / SportsCage
- Activity event `newsletter_signup` includes `widget_version`
