# SaskToday / SportsCage Mailchimp signup Worker

Cloudflare Worker that replaces Mailchimp embed POSTs. The browser posts JSON to `POST /subscribe`; the Worker verifies Turnstile, rate-limits, and upserts the contact into Mailchimp with the requested interest group(s).

## Why

Mailchimp’s classic embed form does **not** add interest groups when the email is already on the list. This Worker uses the Marketing API so:

- **New** contacts are double opt-in (`pending`) with the interest group(s) set
- **Subscribed** contacts get the new group(s) without losing others or changing status
- **Unsubscribed** contacts are set back to `pending` (fresh confirmation email) **with this signup’s interest group(s) already applied** — those interests remain after they confirm
- **Cleaned** contacts are not re-subscribed; the client still gets the generic 200 (no enumeration)

## Setup

```bash
cd signup-worker
npm install

# KV namespace
npx wrangler kv namespace create SIGNUP_STATE
npx wrangler kv namespace create SIGNUP_STATE --preview
# Paste ids into wrangler.toml

# Secrets
npx wrangler secret put MAILCHIMP_API_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put ALERT_WEBHOOK_URL    # ops / breaker alerts
npx wrangler secret put DIGEST_WEBHOOK_URL   # daily disposable digest (separate chat)
```

## Alerts → Microsoft Teams

Use **two Workflows** if digests should stay out of the ops channel:

| Secret | Purpose | Suggested destination |
|---|---|---|
| `ALERT_WEBHOOK_URL` | Breaker, Mailchimp config, Turnstile wave | Ops / on-call channel |
| `DIGEST_WEBHOOK_URL` | Daily disposable-domain % digest | Separate channel or group chat |

If `DIGEST_WEBHOOK_URL` is unset, the digest falls back to `ALERT_WEBHOOK_URL`.

The Worker POSTs an **Adaptive Card** (`type: "AdaptiveCard"`). Classic Office connectors are retired — use **Workflows**.

### 1. Create each webhook in Teams

For **each** destination:

1. Open that **channel** (create a dedicated one for digests if you like).
2. **⋯ → Workflows**.
3. Template **“Send webhook alerts to a channel”** (or blank + **When a Teams webhook request is received**).
4. **Who can trigger** → **Anyone**.
5. Point **Post card** at the right team/channel → **Save**.
6. Copy the **HTTP POST URL**.

### 2. Store secrets on the Worker

```bash
cd signup-worker
npx wrangler secret put ALERT_WEBHOOK_URL
# paste the ops webhook URL

npx wrangler secret put DIGEST_WEBHOOK_URL
# paste the digest webhook URL
```

### 3. Verify a webhook (Adaptive Card curl)

```bash
URL='PASTE_TEAMS_WEBHOOK_URL'

curl -sS -g -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"AdaptiveCard",
    "$schema":"http://adaptivecards.io/schemas/adaptive-card.json",
    "version":"1.4",
    "body":[{"type":"TextBlock","text":"SaskToday signup worker test alert — ignore.","wrap":true}]
  }'
```

You should see that card within a few seconds (HTTP **202**). If you get **401/403**, the flow is not set to **Anyone**.

### 4. What you’ll see for real trips

Ops alerts include reason, counts, time, cooldown, and KV reset commands. Only **one** alert fires per trip window (deduped in KV).

Create a Turnstile widget (managed mode) for your site hostnames. Put the **site key** in the front-end (`SASKTODAY_SIGNUP.turnstileSiteKey` or edit `sasktoday-newsletter-inject.js`). Put the **secret** in `TURNSTILE_SECRET`.

Confirm interest IDs (especially before production):

```bash
# List categories
curl -s --user "any:$MAILCHIMP_API_KEY" \
  "https://us18.api.mailchimp.com/3.0/lists/b666fb9950/interest-categories"

# List interests in a category
curl -s --user "any:$MAILCHIMP_API_KEY" \
  "https://us18.api.mailchimp.com/3.0/lists/b666fb9950/interest-categories/CATEGORY_ID/interests"
```

Update `src/interests.ts` if IDs differ from the embed-derived values.

## Deploy

```bash
npm run deploy
```

## Production: add the widget to the site

The inject script is hosted on the same Worker (Cloudflare):

`https://sasktoday-signup.nmorrison.workers.dev/sasktoday-newsletter-inject.js`

1. Ensure the page has the slot (you already do):

```html
<div id="newsletter_signup_inject_container"></div>
```

2. Near the end of `<body>` (after that div), add config + script:

```html
<script>
  window.SASKTODAY_SIGNUP = {
    apiUrl: 'https://sasktoday-signup.nmorrison.workers.dev/subscribe',
    turnstileSiteKey: '0x4AAAAAAFrrf0dzX9fWkC6B'
  };
</script>
<script
  src="https://sasktoday-signup.nmorrison.workers.dev/sasktoday-newsletter-inject.js?v=1.3.3"
  defer
></script>
```

Bump `?v=` when you ship a new `WIDGET_VERSION` so browsers pick up the file.

Path targeting (Regina / Saskatoon / etc.) uses `window.location.pathname` automatically — no per-section script changes.

After `npm run deploy`, `predeploy` syncs `../sasktoday-newsletter-inject.js` into `public/` so the CDN copy matches the repo.

Also set `ALLOWED_ORIGINS` and `TURNSTILE_ALLOWED_HOSTNAMES` in `wrangler.toml` to your real hosts (already includes `sasktoday.ca` / `www.sasktoday.ca`).

## Circuit breaker reset

There is **no** HTTP admin reset endpoint. After a trip:

- Wait for `BREAKER_COOLDOWN_SECONDS` (KV TTL), or
- `npx wrangler kv key delete --binding SIGNUP_STATE "breaker:tripped"`
- `npx wrangler kv key delete --binding SIGNUP_STATE "breaker:alerted"`

## Edge rate limit

Add a Cloudflare WAF rate-limiting rule on `/subscribe` so floods are blocked before Worker invocation (protects shared Workers quota).

## Disposable-domain monitoring (observe-only)

Verified signups (past Turnstile + rate limits) are checked against a snapshot of the [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) community list. **Matches are not blocked** — we only:

- Set `disposableHit: true` on the success log line
- Increment KV `count:disposable:YYYYMMDDHH` (kept ~3 days, same as signup counters)

**Daily Teams digest** (cron `10 6 * * *` UTC ≈ end of day America/Edmonton): previous local calendar day’s disposable matches as a **percentage of verified signups**, posted to `DIGEST_WEBHOOK_URL`. Example:

```
SaskToday signup digest (2026-10-30 America/Edmonton)
Verified signups: 40
Disposable-domain matches: 2 (5.0% of verified)
Observe-only — matches are not blocked.
```

```bash
# Current UTC hour hit count
npx wrangler kv key get --binding SIGNUP_STATE --remote --preview false \
  "count:disposable:$(date -u +%Y%m%d%H)"

# Manually fire the digest (optional test): put a short-lived KV token, POST, delete token
npx wrangler kv key put --binding SIGNUP_STATE --remote --preview false \
  ops:run_digest_token 'YOUR_TEMP_TOKEN' --ttl 600
curl -sS -X POST https://sasktoday-signup.nmorrison.workers.dev/ops/run-digest \
  -H 'x-ops-token: YOUR_TEMP_TOKEN'
npx wrangler kv key delete --binding SIGNUP_STATE --remote --preview false ops:run_digest_token

# Refresh the bundled domain snapshot, then redeploy
npm run refresh:disposable-domains
npm run deploy
```

If monitoring shows real abuse, we can flip matched domains to a 400 later; until then legitimate subscribers are never rejected for list membership alone.

## Tests

```bash
npm test
npm run typecheck
```

## Widget versioning

The inject script defines `WIDGET_VERSION` and sends it on every `/subscribe` call. The Worker attaches `widget_version` to the Mailchimp Activity event `newsletter_signup`.

Keep a human history in repo-root [`WIDGET_CHANGELOG.md`](../WIDGET_CHANGELOG.md). Bump the constant whenever you ship meaningful widget changes; optionally `git tag widget-vX.Y.Z`.

## Interest keys

| Key | Audience | Notes |
|---|---|---|
| `reginatoday-daily` | SaskToday | |
| `saskatoontoday-daily` | SaskToday | |
| `estevantoday-daily` | SaskToday | |
| `sasktoday-daily` / `sasktoday-weekly` | SaskToday | Main form can send both |
| `saskagtoday-daily` | SaskToday | |
| `crime-cops-court-daily` | SaskToday | |
| `sportscage-insider` | SportsCage | Different list ID |

Body accepts `interest` (string) and/or `interests` (string[]).
