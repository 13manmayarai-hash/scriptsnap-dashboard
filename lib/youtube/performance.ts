import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'
import { CACHE_FRESHNESS_MS } from './analytics'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const RANGE_DAYS = 28

export interface PerformanceContext {
  channelTitle: string
  subscriberCount: number
  rangeDays: number
  totals: {
    views: number
    watchTimeHours: number
    subscribersGained: number
    subscribersLost: number
    likes: number
    comments: number
    shares: number
  }
  daily: { date: string; views: number; watchTimeMinutes: number; subscribersNet: number }[]
  topVideos: { videoId: string; title: string; views: number; averageViewPercentage: number; thumbnailUrl?: string }[]
  channelCtr?: { impressions: number; ctr: number }
  aiSummary: { whatsWorking: string[]; whatsNot: string[]; suggestions: string[] }
  competitorVideos: { videoId: string; title: string; channelTitle: string; viewCount: number; thumbnailUrl?: string }[]
}

interface ConnectionRow {
  google_refresh_token: string
  needs_reconnect: boolean
  youtube_channel_id: string | null
  youtube_channel_title: string | null
  cached_performance_context: PerformanceContext | null
  performance_context_cached_at: string | null
}

function isoDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Turns a top video's title into a short search query for finding what
// other creators in the same niche are making — strips hashtags/emoji
// clutter and keeps the first few meaningful words. A lightweight,
// no-extra-API-call stand-in for "the creator's taste."
function extractSearchQuery(title: string): string {
  const cleaned = title
    .replace(/#[A-Za-z0-9_]+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.split(' ').slice(0, 6).join(' ') || title.slice(0, 60)
}

async function generateAiSummary(input: {
  channelTitle: string
  subscriberCount: number
  rangeDays: number
  totals: PerformanceContext['totals']
  recentViews: number
  priorViews: number
  channelCtr?: PerformanceContext['channelCtr']
  topVideos: PerformanceContext['topVideos']
}): Promise<PerformanceContext['aiSummary']> {
  const fallback = { whatsWorking: [], whatsNot: [], suggestions: [] }
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: `You're analyzing a YouTube Shorts creator's real channel performance data from the last ${input.rangeDays} days. Write a concise, honest performance readout in plain language for a small creator — no jargon-heavy corporate tone.

Channel: ${input.channelTitle} (${input.subscriberCount} subscribers)
Totals (last ${input.rangeDays} days): ${input.totals.views} views, ${input.totals.watchTimeHours}h watch time, ${input.totals.subscribersGained} subscribers gained / ${input.totals.subscribersLost} lost, ${input.totals.likes} likes, ${input.totals.comments} comments, ${input.totals.shares} shares
Trend: ${input.recentViews} views in the last 14 days vs ${input.priorViews} views in the 14 days before that
${input.channelCtr ? `Thumbnail CTR: ${input.channelCtr.ctr.toFixed(1)}% on ${input.channelCtr.impressions} impressions` : 'Thumbnail CTR: not enough data yet'}
Top videos this period:
${input.topVideos.map((v) => `- "${v.title}" — ${v.views} views, ${v.averageViewPercentage.toFixed(0)}% average retention`).join('\n') || '(no videos with views in this period)'}

Respond with ONLY a JSON object, no other text: {"whatsWorking": ["short point", ...], "whatsNot": ["short point", ...], "suggestions": ["short actionable point", ...]}
Each array should have 2-4 short (under 20 words) points grounded in the specific numbers above — never generic YouTube advice. If there isn't enough data to say something meaningful in a category, include one honest item saying so instead of inventing a claim.`,
        },
      ],
    })
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const match = textBlock?.text.match(/\{[\s\S]*\}/)
    if (!match) return fallback
    const parsed = JSON.parse(match[0])
    return {
      whatsWorking: Array.isArray(parsed.whatsWorking) ? parsed.whatsWorking.filter((s: unknown) => typeof s === 'string') : [],
      whatsNot: Array.isArray(parsed.whatsNot) ? parsed.whatsNot.filter((s: unknown) => typeof s === 'string') : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s: unknown) => typeof s === 'string') : [],
    }
  } catch (err) {
    console.error('Performance AI summary generation failed:', err)
    return fallback
  }
}

// Builds the YouTube Studio-style performance dashboard on the Analytics
// page: real trend data + top videos from the connected channel's own
// Analytics (channel==MINE — the only channel this data is ever available
// for), a Claude-written plain-language readout of it, and a handful of
// other creators' popular videos in a similar niche discovered via a
// public search.list query derived from the channel's own top video.
// Same cache-first / never-throw / invalid_grant-detection shape as
// getTrendingContext/getCreatorAnalyticsContext — a YouTube or Claude
// hiccup here should never break the Analytics page, just skip the section.
export async function getPerformanceContext(
  supabase: SupabaseClient,
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<PerformanceContext | null> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, needs_reconnect, youtube_channel_id, youtube_channel_title, cached_performance_context, performance_context_cached_at')
    .eq('user_id', userId)
    .maybeSingle<ConnectionRow>()

  if (!connection || connection.needs_reconnect) return null

  const cacheAge = connection.performance_context_cached_at
    ? Date.now() - new Date(connection.performance_context_cached_at).getTime()
    : Infinity

  if (!options.forceRefresh && connection.cached_performance_context && cacheAge < CACHE_FRESHNESS_MS) {
    return connection.cached_performance_context
  }

  try {
    const oauth2Client = getYouTubeOAuthClient()
    oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })
    await oauth2Client.getAccessToken()

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client })

    const channelRes = await youtube.channels.list({ part: ['snippet', 'statistics'], mine: true })
    const channel = channelRes.data.items?.[0]
    const channelTitle = channel?.snippet?.title || connection.youtube_channel_title || 'your channel'
    const subscriberCount = Number(channel?.statistics?.subscriberCount) || 0

    const startDate = isoDateDaysAgo(RANGE_DAYS)
    const endDate = isoDateDaysAgo(0)

    const dailyRes = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares',
      dimensions: 'day',
      sort: 'day',
    })
    const dailyRows = dailyRes.data.rows || []

    const daily: PerformanceContext['daily'] = dailyRows.map((row) => ({
      date: String(row[0]),
      views: Number(row[1]) || 0,
      watchTimeMinutes: Number(row[2]) || 0,
      subscribersNet: (Number(row[3]) || 0) - (Number(row[4]) || 0),
    }))

    const totals = dailyRows.reduce(
      (acc, row) => ({
        views: acc.views + (Number(row[1]) || 0),
        watchTimeHours: acc.watchTimeHours + (Number(row[2]) || 0) / 60,
        subscribersGained: acc.subscribersGained + (Number(row[3]) || 0),
        subscribersLost: acc.subscribersLost + (Number(row[4]) || 0),
        likes: acc.likes + (Number(row[5]) || 0),
        comments: acc.comments + (Number(row[6]) || 0),
        shares: acc.shares + (Number(row[7]) || 0),
      }),
      { views: 0, watchTimeHours: 0, subscribersGained: 0, subscribersLost: 0, likes: 0, comments: 0, shares: 0 }
    )
    totals.watchTimeHours = Math.round(totals.watchTimeHours * 10) / 10

    const recentViews = daily.slice(-14).reduce((sum, d) => sum + d.views, 0)
    const priorViews = daily.slice(-28, -14).reduce((sum, d) => sum + d.views, 0)

    let topVideos: PerformanceContext['topVideos'] = []
    try {
      const topVideosRes = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'views,averageViewPercentage',
        dimensions: 'video',
        sort: '-views',
        maxResults: 5,
      })
      const rows = topVideosRes.data.rows || []
      const videoIds = rows.map((row) => String(row[0]))
      let snippetsById: Record<string, { title: string; thumbnailUrl?: string }> = {}
      if (videoIds.length > 0) {
        const videosRes = await youtube.videos.list({ part: ['snippet'], id: videoIds })
        snippetsById = Object.fromEntries(
          (videosRes.data.items || []).map((item) => [
            item.id,
            {
              title: item.snippet?.title || 'Untitled',
              thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || undefined,
            },
          ])
        )
      }
      topVideos = rows.map((row) => {
        const videoId = String(row[0])
        return {
          videoId,
          title: snippetsById[videoId]?.title || 'Untitled',
          thumbnailUrl: snippetsById[videoId]?.thumbnailUrl,
          views: Number(row[1]) || 0,
          averageViewPercentage: Number(row[2]) || 0,
        }
      })
    } catch (err) {
      console.error('Top videos fetch failed:', err)
    }

    let channelCtr: PerformanceContext['channelCtr'] | undefined
    try {
      const ctrRes = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'videoThumbnailImpressions,videoThumbnailImpressionsClickRate',
      })
      const row = ctrRes.data.rows?.[0]
      if (row) {
        channelCtr = { impressions: Number(row[0]) || 0, ctr: Number(row[1]) || 0 }
      }
    } catch (err) {
      // Common for lower-traffic channels — YouTube withholds this data
      // below a traffic threshold rather than erroring cleanly.
    }

    let competitorVideos: PerformanceContext['competitorVideos'] = []
    if (topVideos.length > 0) {
      try {
        const searchQuery = extractSearchQuery(topVideos[0].title)
        const searchRes = await youtube.search.list({
          part: ['snippet'],
          q: searchQuery,
          type: ['video'],
          order: 'viewCount',
          maxResults: 8,
          regionCode: 'IN',
        })
        const candidateIds = (searchRes.data.items || [])
          .filter((item) => item.id?.videoId && item.snippet?.channelId !== connection.youtube_channel_id)
          .map((item) => item.id!.videoId!)
          .slice(0, 6)

        if (candidateIds.length > 0) {
          const videosRes = await youtube.videos.list({ part: ['snippet', 'statistics'], id: candidateIds })
          competitorVideos = (videosRes.data.items || [])
            .filter((item) => item.id && item.snippet?.title)
            .map((item) => ({
              videoId: item.id!,
              title: item.snippet!.title!,
              channelTitle: item.snippet?.channelTitle || 'Unknown channel',
              viewCount: Number(item.statistics?.viewCount) || 0,
              thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || undefined,
            }))
            .sort((a, b) => b.viewCount - a.viewCount)
        }
      } catch (err) {
        console.error('Competitor video search failed:', err)
      }
    }

    const aiSummary = await generateAiSummary({
      channelTitle,
      subscriberCount,
      rangeDays: RANGE_DAYS,
      totals,
      recentViews,
      priorViews,
      channelCtr,
      topVideos,
    })

    const context: PerformanceContext = {
      channelTitle,
      subscriberCount,
      rangeDays: RANGE_DAYS,
      totals,
      daily,
      topVideos,
      channelCtr,
      aiSummary,
      competitorVideos,
    }

    await supabase
      .from('youtube_connections')
      .update({ cached_performance_context: context, performance_context_cached_at: new Date().toISOString() })
      .eq('user_id', userId)

    return context
  } catch (err: any) {
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
    } else {
      console.error('YouTube performance context refresh failed:', err)
    }
    return null
  }
}
