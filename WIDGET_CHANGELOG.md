# Newsletter widget versions

The inject script sends a **composite** `widgetVersion` on every signup. The Worker writes it onto the Mailchimp contact **Activity** event (`newsletter_signup` → `widget_version`).

## Format

```
{newsletterKey}@{newsletterVersion}+{shellVersion}
```

Example: `sasktoday@1.0.0+1.4.0`

| Piece | Where | When to bump |
|---|---|---|
| `newsletterVersion` | `NEWSLETTERS[key].version` | Copy, interests, or layout unique to that newsletter |
| `shellVersion` (`WIDGET_VERSION`) | Top of `sasktoday-newsletter-inject.js` | Shared chrome: Turnstile, success screen, spinner, CSS shell |

Keep both semver (`MAJOR.MINOR.PATCH`). The combined string is capped at 40 characters for Mailchimp.

## How to ship

1. Change the relevant newsletter entry and/or shared shell code.
2. Bump **only** what changed (`version` on that newsletter, and/or `WIDGET_VERSION`).
3. Add a note below.
4. Commit the inject script — **snapshots run automatically** via `.githooks/pre-commit` and are staged into the same commit under `widget-snapshots/`.
5. Deploy (`cd signup-worker && npm run deploy`) — **also** re-captures snapshots in `predeploy`, then syncs the CDN asset. Bump the site embed `?v=` whenever the JS file changed so browsers fetch it.
6. Optionally tag: `git tag widget-vX.Y.Z && git push --tags`.

Manual override if needed: `cd signup-worker && npm run snapshot:widgets`. Skip with `SKIP_WIDGET_SNAPSHOTS=1`.

See [`widget-snapshots/README.md`](widget-snapshots/README.md).

## Newsletter versions (current)

| Key | Version | Notes |
|---|---|---|
| `regina-today` | `1.0.0` | Launch copy |
| `saskatoon-today` | `1.0.0` | Launch copy |
| `estevan-today` | `1.0.0` | Launch copy |
| `sasktoday` | `1.0.0` | Launch copy + daily/weekly choices |
| `saskag-today` | `1.0.0` | Launch copy |
| `sportscage` | `1.0.0` | Launch copy |
| `crime-cops-court` | `1.0.0` | Launch copy |

## Shell version history

### 1.4.0 — 2026-10-30

- Per-newsletter `version` fields; API `widgetVersion` is now `{key}@{nl}+{shell}` (was a single global string)
- Versioned visual archive: `npm run snapshot:widgets` → `widget-snapshots/<key>/<nl>+shell-<shell>/`

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

- Lazy-load Turnstile until the signup form is used

### 1.2.0 — 2026-10-30

- Success panel (“You’re all set”) after signup
- Turnstile Managed + `appearance: interaction-only`

### 1.1.x / 1.0.x

- Initial tagline-lead inject + Worker subscribe path
- Activity event `newsletter_signup` includes `widget_version`
