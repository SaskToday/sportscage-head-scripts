# Widget version snapshots

Visual + config archives of each newsletter widget build. Use these when Mailchimp Activity shows a `widget_version` like `sasktoday@1.0.1+1.4.0` and you want to see what that signup looked like.

## Layout

```
widget-snapshots/
  manifest.json
  <newsletterKey>/
    <newsletterVersion>+shell-<shellVersion>/
      form.png       # signup form
      success.png    # post-signup screen
      config.json    # NEWSLETTERS entry + versions at capture time
```

Example: `widget-snapshots/sasktoday/1.0.0+shell-1.4.0/form.png`

## When snapshots run (automatic)

You do **not** need to run this by hand for normal updates.

| Trigger | What happens |
|---|---|
| **git commit** that includes `sasktoday-newsletter-inject.js` | `.githooks/pre-commit` runs snapshots and stages `widget-snapshots/` into that same commit |
| **`npm run deploy`** (signup-worker) | `predeploy` syncs the CDN asset **and** re-captures snapshots |

First time in a clone, enable hooks (also set by `npm install` via the `prepare` script):

```bash
git config core.hooksPath .githooks
cd signup-worker && npm install --legacy-peer-deps
```

Escape hatch: `SKIP_WIDGET_SNAPSHOTS=1 git commit …` or `SKIP_WIDGET_SNAPSHOTS=1 npm run deploy`.

Manual (optional):

```bash
cd signup-worker
npm run snapshot:widgets
npm run snapshot:widgets -- --only sasktoday
```

Older version folders stay forever so you can compare designs over time.

## Looking up a version

1. Read `widget_version` from the Mailchimp contact Activity event.
2. Open `widget-snapshots/manifest.json` or go straight to  
   `widget-snapshots/<key>/<nlVersion>+shell-<shellVersion>/`.
3. Open `form.png` / `success.png`, or `config.json` for the exact copy fields.
