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

## When to capture

After you bump a newsletter `version` and/or shell `WIDGET_VERSION`, and before (or with) the deploy commit:

```bash
cd signup-worker
npm run snapshot:widgets
# or only one newsletter:
npm run snapshot:widgets -- --only sasktoday
```

Commit the new folder(s) under `widget-snapshots/`. Older folders stay forever so you can compare designs over time.

## Looking up a version

1. Read `widget_version` from the Mailchimp contact Activity event.
2. Open `widget-snapshots/manifest.json` or go straight to  
   `widget-snapshots/<key>/<nlVersion>+shell-<shellVersion>/`.
3. Open `form.png` / `success.png`, or `config.json` for the exact copy fields.
