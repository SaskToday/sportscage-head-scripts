# SportsCage live YouTube embed

The working pair from `Harvard-Media/Interactive` `CloudFlair`:

- `src/worker.js` is the worker that `https://youtube-playlist.pinkal.workers.dev/rss.xml` is serving. Each request loads two YouTube playlists, adds live start and end times, and returns an RSS feed.
- `widget/sports-cage-live-yt-video.html` is the homepage widget. It reads that feed and points `#iframe-section` at the show that should be on.

`Worker.js` in the old folder (the KV and 6-hour cron version) is not included. That rewrite is not what the live URL returns.

## Deploy

From this folder, after `npm install`:

```bash
npx wrangler secret put YOUTUBE_API_KEY
npm run deploy
```

The worker name is `sportscage-live-youtube`, so the feed will be:

`https://sportscage-live-youtube.nmorrison.workers.dev/rss.xml`

The widget still calls the existing Pinkal worker. Change `RSS_URL` in the widget after this feed returns XML, then paste the widget into the homepage WYSIWYG. The YouTube API key is a Cloudflare secret. Do not commit it.
