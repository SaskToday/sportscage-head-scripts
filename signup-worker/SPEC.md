# Mailchimp Interest-Group Signup Worker: Implementation Spec

## Goal

Replace the Mailchimp embed forms with our own front-end forms that post to a Cloudflare Worker. The Worker upserts the contact into Mailchimp and sets the requested interest group, so:

- New contacts are added as `pending` (double opt-in) with the interest group set.
- Existing subscribers get the new interest group added, without losing existing groups and without changing their subscription status.
- Unsubscribed or cleaned contacts are never silently re-subscribed.
- Bot abuse is limited by Turnstile, rate limits, a honeypot and a circuit breaker that shuts signups off and alerts us.

## Stack

- Cloudflare Worker (TypeScript), deployed with Wrangler
- Cloudflare KV namespace `SIGNUP_STATE` (rate-limit counters, breaker state)
- Cloudflare Turnstile (server-side verification)
- Mailchimp Marketing API v3
- Alert channel: Slack incoming webhook (simplest). Email via Resend or MailChannels is an acceptable alternative.

## Config

### Secrets (`wrangler secret put`)

| Name | Purpose |
|---|---|
| `MAILCHIMP_API_KEY` | Marketing API key |
| `TURNSTILE_SECRET` | Turnstile secret key |
| `ALERT_WEBHOOK_URL` | Slack (or similar) webhook for breaker alerts |

### Vars (`wrangler.toml`)

| Name | Example |
|---|---|
| `MAILCHIMP_DC` | `us21` (the suffix of the API key) |
| `ALLOWED_ORIGINS` | comma-separated list, e.g. `https://sasktoday.ca,https://www.sportscage.com` |
| `BREAKER_MAX_SIGNUPS_PER_HOUR` | e.g. `100` (set to 3-5x normal peak) |
| `TURNSTILE_FAIL_ALERT_PER_10MIN` | e.g. `200` (alert only, does not pause signups) |
| `TURNSTILE_FAIL_MAX_PER_IP_10MIN` | e.g. `5` (blocks that IP) |
| `BREAKER_MAX_MAILCHIMP_ERRORS_PER_5MIN` | e.g. `20` |
| `BODY_MAX_BYTES` | `2048` |
| `BREAKER_COOLDOWN_SECONDS` | e.g. `3600` |
| `EMAIL_MAX_PER_HOUR` | `3` |
| `IP_MAX_PER_HOUR` | `10` |

### Interest map (in code, e.g. `src/interests.ts`)

The client sends a short key, never a raw Mailchimp group ID. The Worker maps the key to an audience ID and interest ID and rejects unknown keys. This stops an attacker from adding people to arbitrary groups. Different newsletters can live in different Mailchimp audiences (for example SaskToday vs SportsCage), so each entry carries its own audience ID. If all audiences are in one Mailchimp account, one API key and `MAILCHIMP_DC` cover them all. If not, add a per-audience key secret and reference it from the entry.

```ts
export const INTERESTS: Record<string, { audienceId: string; interestId: string }> = {
  "riders-all-access": { audienceId: "AUDIENCE_ID_HERE", interestId: "GROUP_ID_HERE" },
  "reginatoday-daily": { audienceId: "AUDIENCE_ID_HERE", interestId: "GROUP_ID_HERE" },
  // one entry per newsletter
};
```

Group IDs come from:
`GET https://{dc}.api.mailchimp.com/3.0/lists/{audience_id}/interest-categories` then
`GET .../interest-categories/{category_id}/interests`.
Include a one-off script or documented curl commands for this.

## Endpoint

`POST /subscribe` (JSON body)

```json
{
  "email": "user@example.com",
  "interest": "riders-all-access",
  "turnstileToken": "...",
  "website": ""
}
```

`website` is the honeypot field (hidden in the form, humans leave it empty).

Also handle `OPTIONS /subscribe` for CORS. There is no admin endpoint in v1 (see Circuit breaker: Reset).

### Request handling order

Do the cheap checks first and the expensive ones last.

1. **CORS and Origin.** Reject if the `Origin` header is missing or not in `ALLOWED_ORIGINS` (browsers always send it on cross-origin POSTs, while scripts often don't). Set `Access-Control-Allow-Origin` to the matching origin only (never `*`). This is only a cheap filter, since Origin is trivially spoofed outside a browser. Turnstile is the real control.
2. **Parse and validate.** Require `Content-Type: application/json`. Enforce `BODY_MAX_BYTES` (check `Content-Length` and cap the bytes actually read; return 413 if exceeded). Reject malformed JSON. Validate email format and length (max 254). Lowercase and trim the email. Reject unknown `interest` keys with 400.
3. **Honeypot.** If `website` is non-empty, return the normal success response and do nothing else.
4. **Breaker check.** If `breaker:tripped` exists in KV, return 503 with `{ "ok": false, "code": "paused" }`. Do not call Turnstile or Mailchimp.
5. **Turnstile.** POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret, the token and `remoteip` (from `CF-Connecting-IP`). Also check that the response's `hostname` is one of our allowed hostnames (and `action`, if we set one). On failure return 400, increment a per-IP failure counter, and block that IP with 429 after `TURNSTILE_FAIL_MAX_PER_IP_10MIN` failures. Failures also feed an alert-only counter (see Circuit breaker) but never pause signups, since anyone can send junk tokens.
6. **Rate limits.** Per IP (`IP_MAX_PER_HOUR`) and per email (`EMAIL_MAX_PER_HOUR`). Hash the email (SHA-256) for the KV key so addresses aren't stored in plain text. Over the limit returns 429. For the IP limit, the Cloudflare Rate Limiting binding is an acceptable alternative to KV counters.
7. **Count the signup** toward the breaker (see below). This happens only after Turnstile has passed, so junk traffic cannot trip it.
8. **Mailchimp upsert.**
   - `subscriber_hash = md5(lowercase(email))`
   - `PUT https://{dc}.api.mailchimp.com/3.0/lists/{audience_id}/members/{subscriber_hash}` (`audience_id` and the interest ID both come from the `INTERESTS` entry)
   - Basic auth with any username and the API key as the password.
   - Body:
     ```json
     {
       "email_address": "user@example.com",
       "status_if_new": "pending",
       "interests": { "GROUP_ID": true }
     }
     ```
   - Only the listed interests change, so existing groups are preserved.
   - Do not send a `status` field. Existing members keep their status. `status_if_new` only applies to new contacts.
   - Use a timeout. Map Mailchimp errors by error type (the `title`/`detail` in the response body), not by status class:
     - **Member-state errors** (compliance state, forgotten email, cleaned or unsubscribed contacts that can't be updated): return the same generic 200 success as every other case. Never return an error, since that would reveal the address is special. Log server-side only.
     - **Invalid or fake-looking email** (depends on the address, not on our list): return 400 "please check your email address".
     - **Config errors** (401/403 bad key, 404 wrong audience, 400 bad group ID): return 502 with a friendly message, log, send an alert, and count toward the Mailchimp-error breaker. These must never look like success.
     - **Upstream failures** (429, 5xx, timeouts): return 502 with a friendly message and count toward the Mailchimp-error breaker.
     - Anything unrecognized: treat as a config error so it gets noticed.
   - Never pass Mailchimp response bodies through to the client.
9. **Respond with a generic message.** Return the same success payload regardless of whether the contact was new, existing, pending or unsubscribed. This avoids leaking whether an email is on our list. Suggested copy: "Thanks! If you're new, check your inbox to confirm. If you're already subscribed, you're all set."

Note: MD5 is required here by Mailchimp's API (it is an identifier, not a security control). The Workers runtime supports `crypto.subtle.digest("MD5", ...)`.

## Circuit breaker

The Worker is the only thing that holds the Mailchimp key, so "disabling the API" means making the Worker stop calling Mailchimp. We do this with a flag in KV that all signup requests check first.

### Triggers (any one trips it)

- Signups that passed Turnstile and rate limits exceed `BREAKER_MAX_SIGNUPS_PER_HOUR` in the current hour.
- Upstream Mailchimp problems exceed `BREAKER_MAX_MAILCHIMP_ERRORS_PER_5MIN`. Count only 429, 5xx, timeouts and config errors, never member-state errors.

Turnstile failures deliberately do **not** trip the breaker. Anyone can send junk tokens, so that would let an attacker pause signups for everyone. They are handled by per-IP blocking. When failures exceed `TURNSTILE_FAIL_ALERT_PER_10MIN`, the Worker sends a deduplicated alert-only notification (no pause) so we know a bot wave is underway.

### When tripped

1. Write `breaker:tripped` to KV with a JSON value `{ reason, trippedAt }` and `expirationTtl = BREAKER_COOLDOWN_SECONDS` so it auto-resets after the cooldown.
2. Send one alert to `ALERT_WEBHOOK_URL` containing the reason, counts, the time and how to reset. Send the alert only on the transition (guard with a `breaker:alerted` key) so a flood doesn't produce a flood of alerts.
3. All `/subscribe` requests now return 503 `{ "ok": false, "code": "paused" }` until the flag expires or is cleared.

### Reset

- Automatic after the cooldown, or
- Manual: `wrangler kv key delete` for `breaker:tripped` and `breaker:alerted` (document the exact commands in the README).
- No HTTP admin endpoint in v1, since it would add attack surface for little benefit. If one is added later, put it behind Cloudflare Access, rate limit it, and compare secrets in constant time (`crypto.subtle.timingSafeEqual`).
- If the cause is still active, the breaker will trip again, which is the intended behavior.

### Counter implementation note

KV has no atomic increment and is eventually consistent, so counters can undercount slightly under heavy concurrent load. That is fine for a breaker (it trips a little late, not never). Use fixed-window keys like `count:signups:{YYYYMMDDHH}` with a TTL of 2 hours. If we later need exact counts, move the counters to a Durable Object. Keep the counter logic behind a small interface so that swap is easy.

### Additional alerting

Add a Cloudflare notification or alert on Worker request-volume spikes as a second line of defense that does not depend on our code.

## Front end

One reusable snippet per form, with:

- Email input, a hidden honeypot input named `website` (`tabindex="-1"`, `autocomplete="off"`, positioned off-screen, not `display:none`), and a Turnstile widget (managed mode).
- The interest key set per form (for example `data-interest="riders-all-access"`).
- JS that intercepts submit, posts JSON to the Worker, and shows states: submitting, success (generic message above), rate limited ("Too many attempts, try again later"), paused ("Signups are temporarily unavailable, please try again later"), and error.
- Reset the Turnstile widget after each attempt.
- Keep the markup and styling compatible with the existing signup cards (for example the SportsCage "Riders All Access Report" card and the ReginaToday card), so a restyle isn't needed.

## Logging

- Log structured JSON for each request: outcome code, interest key, and a hashed email. Do not log raw emails or the API key.
- Use `wrangler tail` or Workers Logs for debugging.

## Acceptance tests

1. New email: contact created as `pending` with the correct group; confirmation email sent.
2. Existing subscriber, different newsletter: new group added, existing groups intact, status unchanged.
3. Unsubscribed or cleaned contact: not re-subscribed, and the response is identical to other cases. This includes Mailchimp member-state errors (compliance state, forgotten email), which return the generic 200, never a 502.
4. Unknown `interest` key: 400.
5. Disallowed Origin: rejected.
6. Missing or invalid Turnstile token: 400.
7. Honeypot filled: success response, no Mailchimp call.
8. More than `EMAIL_MAX_PER_HOUR` attempts for one email: 429.
9. More than `IP_MAX_PER_HOUR` attempts from one IP: 429.
10. Breaker: force the threshold low in a test environment, confirm it trips, returns 503, sends exactly one alert, and resets via the admin endpoint and via TTL.
11. Mailchimp outage (simulate 500): friendly error, no crash.
12. Missing `Origin` header: rejected.
13. Body over `BODY_MAX_BYTES` or wrong `Content-Type`: rejected (413 / 415).
14. Flood of bad Turnstile tokens: the offending IP is blocked, an alert is sent, and the breaker does **not** trip. Legitimate signups from other IPs still work.
15. Config error (simulate wrong group ID or bad key): 502, alert sent, never a success response.
16. Two newsletters in different audiences: each key resolves to the correct audience and interest.

## Rollout

1. Deploy to a staging Worker route with a test Mailchimp audience or a test group.
2. Switch one low-traffic form on production, keep the original embed code ready as a fallback.
3. Watch logs and breaker counts for two weeks, then tune thresholds from real traffic.
4. Migrate the remaining forms.

## Security notes

- Add a Cloudflare WAF rate-limiting rule on the `/subscribe` route so floods are blocked at the edge before the Worker runs. This also protects the Workers request quota shared with other Workers on the account.
- Never return Mailchimp response bodies or internal error details to the client. Log them server-side only.
- Never log raw emails, the API key or Turnstile tokens.
- Adding an interest to an already-subscribed contact has no extra confirmation, by design. This is worth a nod from whoever owns compliance (CASL applies to Canadian senders).

## Out of scope for now

- Sending existing subscribers a confirmation before adding a group (revisit only if abuse shows up).
- Disposable-email blocking (add later if junk signups appear).
