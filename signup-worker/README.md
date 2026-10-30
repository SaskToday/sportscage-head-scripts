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
npx wrangler secret put ALERT_WEBHOOK_URL   # Teams webhook URL (see below)
```

## Alerts → Microsoft Teams

The Worker POSTs `{ "text": "…" }` to `ALERT_WEBHOOK_URL` when the circuit breaker trips, Mailchimp config errors spike, or a Turnstile failure wave is detected. Classic Office connectors are retired — use **Workflows**.

### 1. Create the webhook in Teams

1. Open the **team/channel** that should get signup alerts (e.g. a private ops channel).
2. Next to the channel name, open **⋯ → Workflows**.
3. Prefer the template **“Send webhook alerts to a channel”** (or create from blank with trigger **“When a Teams webhook request is received”**).
4. Set **Who can trigger the flow** to **Anyone** (required so the Worker can POST without a user OAuth token).
5. Confirm the flow posts to the channel you want → **Save**.
6. Copy the **HTTP POST URL** the workflow shows after save.

### 2. Store it on the Worker

```bash
cd signup-worker
npx wrangler secret put ALERT_WEBHOOK_URL
# paste the Teams webhook URL when prompted (do not commit it)
```

### 3. Verify the webhook (before relying on the breaker)

Paste your URL into this curl (does not touch Mailchimp or the Worker):

```bash
curl -sS -X POST 'PASTE_TEAMS_WEBHOOK_URL' \
  -H 'Content-Type: application/json' \
  -d '{"text":"SaskToday signup worker test alert — you can ignore this."}'
```

You should see that message in the channel within a few seconds. If you get **401/403**, the flow is not set to **Anyone**.

### 4. What you’ll see for real trips

Alerts include reason, counts, time, cooldown, and the `wrangler kv key delete` commands to clear `breaker:tripped` / `breaker:alerted`. Only **one** alert fires per trip window (deduped in KV).

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

Point the front-end at the Worker:

```html
<script>
  window.SASKTODAY_SIGNUP = {
    apiUrl: 'https://sasktoday-signup.<your-subdomain>.workers.dev/subscribe',
    turnstileSiteKey: '<TURNSTILE_SITE_KEY>'
  };
</script>
<script src="/path/to/sasktoday-newsletter-inject.js"></script>
```

Also set `ALLOWED_ORIGINS` and `TURNSTILE_ALLOWED_HOSTNAMES` in `wrangler.toml` to your real hosts.

## Circuit breaker reset

There is **no** HTTP admin reset endpoint. After a trip:

- Wait for `BREAKER_COOLDOWN_SECONDS` (KV TTL), or
- `npx wrangler kv key delete --binding SIGNUP_STATE "breaker:tripped"`
- `npx wrangler kv key delete --binding SIGNUP_STATE "breaker:alerted"`

## Edge rate limit

Add a Cloudflare WAF rate-limiting rule on `/subscribe` so floods are blocked before Worker invocation (protects shared Workers quota).

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
