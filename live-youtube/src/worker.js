/**
 * SportsCage YouTube RSS feed.
 *
 * This is the worker that youtube-playlist.pinkal.workers.dev is running:
 * each request to /rss.xml fetches the playlists and returns the feed.
 * The homepage widget reads that feed and swaps the embed.
 *
 * Secret (never commit): YOUTUBE_API_KEY
 *   npx wrangler secret put YOUTUBE_API_KEY
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/rss.xml") {
      return new Response("Not Found", { status: 404 });
    }

    const apiKey = env.YOUTUBE_API_KEY;
    const playlistIds = [
      "PL8cF0HCYvU4i24Gby7U1Q4V_wjS03MUCb",
      "PL8cF0HCYvU4jhZkqRcNShmxlJ0113wrFS",
    ];
    const maxResults = 15;

    async function fetchVideosFromPlaylist(playlistId) {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;
      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error("Failed to fetch playlist items");
      const data = await response.json();
      return (
        data.items
          ?.map((video) => ({
            videoId: video.snippet?.resourceId?.videoId || "",
            title: video.snippet?.title || "No title",
            publishedAt: video.snippet?.publishedAt || "",
            url: video.snippet?.resourceId?.videoId
              ? `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`
              : "",
          }))
          .filter((video) => video.videoId) || []
      );
    }

    async function fetchAllVideos() {
      const allVideos = [];
      for (const id of playlistIds) {
        const videos = await fetchVideosFromPlaylist(id);
        allVideos.push(...videos);
      }

      const videoIds = allVideos.map((v) => v.videoId).join(",");
      const liveDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoIds}&key=${apiKey}`;
      const liveResponse = await fetch(liveDetailsUrl);
      if (!liveResponse.ok) throw new Error("Failed to fetch live details");
      const liveData = await liveResponse.json();

      liveData.items?.forEach((video) => {
        const match = allVideos.find((v) => v.videoId === video.id);
        if (match) {
          match.scheduledStartTime = video.liveStreamingDetails?.scheduledStartTime || null;
          match.actualStartTime = video.liveStreamingDetails?.actualStartTime || null;
          match.actualEndTime = video.liveStreamingDetails?.actualEndTime || null;
        }
      });

      return allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    function generateRSS(videos) {
      const rssItems = videos
        .map(
          (video) => `
        <item>
          <title><![CDATA[${video.title}]]></title>
          <link>${video.url}</link>
          <guid>${video.videoId}</guid>
          <pubDate>${video.publishedAt ? new Date(video.publishedAt).toUTCString() : ""}</pubDate>
          ${video.scheduledStartTime ? `<scheduledStartTime>${video.scheduledStartTime}</scheduledStartTime>` : ""}
          ${video.actualStartTime ? `<actualStartTime>${video.actualStartTime}</actualStartTime>` : ""}
          ${video.actualEndTime ? `<actualEndTime>${video.actualEndTime}</actualEndTime>` : ""}
        </item>`
        )
        .join("");

      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Latest YouTube Videos</title>
    <link>https://www.youtube.com</link>
    <description>Combined latest videos from multiple playlists</description>
    ${rssItems}
  </channel>
</rss>`;
    }

    try {
      const latestVideos = await fetchAllVideos();
      const rssFeed = generateRSS(latestVideos);

      return new Response(rssFeed, {
        headers: {
          "Content-Type": "application/rss+xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
