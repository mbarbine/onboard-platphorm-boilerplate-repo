/**
 * Feed switch.
 *
 * Feeds are OFF by default: an app enables its feed only when it publishes
 * dated content, by setting NEXT_PUBLIC_FEED_ENABLED=true. While off,
 * /rss.xml 404s, the sitemap omits it, and the layout emits no feed
 * autodiscovery link — so a feedless app advertises no empty feed.
 * When on but with zero published documents, /rss.xml also 404s instead
 * of emitting an empty channel.
 */
export const FEED_ENABLED = process.env.NEXT_PUBLIC_FEED_ENABLED === 'true'
