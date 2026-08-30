import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'

export const CACHE_FRESHNESS_MS = 24 * 60 * 60 * 1000 // 24h

export interface AnalyticsContext {
  summary: string
  channelTitle: string
}

interface ConnectionRow {
  google_refresh_token: string
  youtube_channel_title: string | null
  needs_reconnect: boolean
  cached_analytics_summary: string | null
  analytics_cached_at: string | null
}

// Builds the short plain-text creator-performance block fed into the
// script-generation prompt. No row → null immediately (no network call at
// all for the common case of a non-connected user). A fresh cache is
// returned as-is; a stale/missing one triggers a real YouTube API refresh.
// Never throws — a YouTube API hiccup should never block generation the
// user already reserved quota for; callers should still wrap this in
// try/catch defensively.
export async function getCreatorAnalyticsContext(
  supabase: SupabaseClient,
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<AnalyticsContext | null> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, youtube_channel_title, needs_reconnect, cached_analytics_summary, analytics_cached_at')
    .eq('user_id', userId)
    .maybeSingle<ConnectionRow>()

  if (!connection || connection.needs_reconnect) return null

  const cacheAge = connection.analytics_cached_at
    ? Date.now() - new Date(connection.analytics_cached_at).getTime()
    : Infinity

  if (!options.forceRefresh && connection.cached_analytics_summary && cacheAge < CACHE_FRESHNESS_MS) {
    return {
      summary: connection.cached_analytics_summary,
      channelTitle: connection.youtube_channel_title || 'your channel',
    }
  }

  try {
    const oauth2Client = getYouTubeOAuthClient()
    oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })
    await oauth2Client.getAccessToken() // mints a fresh ~1hr access token

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client })

    const channelRes = await youtube.channels.list({ part: ['snippet', 'statistics'], mine: true })
    const channel = channelRes.data.items?.[0]
    const channelTitle = channel?.snippet?.title || connection.youtube_channel_title || 'your channel'
    const subscriberCount = channel?.statistics?.subscriberCount

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const topVideosRes = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,averageViewDuration,subscribersGained',
      dimensions: 'video',
      sort: '-views',
      maxResults: 5,
    })

    const videoRows = topVideosRes.data.rows || []
    const videoIds = videoRows.map((row) => String(row[0]))

    let titles: Record<string, string> = {}
    if (videoIds.length > 0) {
      const videosRes = await youtube.videos.list({ part: ['snippet'], id: videoIds })
      titles = Object.fromEntries(
        (videosRes.data.items || []).map((item) => [item.id, item.snippet?.title || 'Untitled'])
      )
    }

    const lines = [`Channel: ${channelTitle}${subscriberCount ? ` (${subscriberCount} subscribers)` : ''}.`]
    if (videoRows.length > 0) {
      lines.push('Top performing recent videos (last 90 days):')
      videoRows.forEach((row, i) => {
        const [videoId, views, avgViewDurationSec] = row
        lines.push(`${i + 1}. "${titles[String(videoId)] || 'Untitled'}" — ${views} views, ~${avgViewDurationSec}s avg watch time`)
      })
    }
    const summary = lines.join('\n')

    await supabase
      .from('youtube_connections')
      .update({
        cached_analytics_summary: summary,
        analytics_cached_at: new Date().toISOString(),
        youtube_channel_title: channelTitle,
      })
      .eq('user_id', userId)

    return { summary, channelTitle }
  } catch (err: any) {
    // Google's signal for a revoked/expired refresh token — stop retrying
    // on every generation and prompt the user to reconnect instead.
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
    } else {
      console.error('YouTube analytics refresh failed:', err)
    }
    return null
  }
}
