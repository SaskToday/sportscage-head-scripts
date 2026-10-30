# Newsletter widget versions

The front-end inject script (`sasktoday-newsletter-inject.js`) sends a `widgetVersion` on every signup. The Worker writes that value onto the Mailchimp contact **Activity** event so we can see which widget build a person used.

## How to ship a new version

1. Make your copy/design/behavior changes in `sasktoday-newsletter-inject.js` (and Worker if needed).
2. Bump `WIDGET_VERSION` at the top of `sasktoday-newsletter-inject.js` (semver: `MAJOR.MINOR.PATCH`).
3. Add a section below describing what changed.
4. Commit. Optionally tag: `git tag widget-v1.2.0 && git push --tags`.

Use the tag / commit SHA later if you need to check out exactly that UI.

## Version history

### 1.1.0 — 2026-10-30

- Success uses a dedicated panel (hides the form) with **← Back to signup**
- New success copy: check inbox / may need to confirm if new subscriber

### 1.0.0 — 2026-10-29

- Tagline-lead card design (Alfa Slab One / Source Sans 3)
- Posts to Cloudflare signup Worker (not Mailchimp embed)
- Turnstile + honeypot (`hp_field`)
- Interest keys for Regina / Saskatoon / Estevan / SaskToday / SaskAg / Crime / SportsCage
- Activity event `newsletter_signup` includes `widget_version`
