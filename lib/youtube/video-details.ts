import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface VideoDetails {
  videoId: string
  title: string
  description: string
  hashtags: string[]
  publishedAt: string | null
  durationLabel: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  // Only ever populated for the connected channel's own videos — YouTube
  // has no API path to another channel's retention/CTR data, even with a
  // real OAuth grant, so this is always absent for "Trending now" videos.
  analytics?: {
    averageViewDuration: number
    averageViewPercentage: number
    ctr?: number
    impressions?: number
  }
  ctrUnavailable?: boolean
  // Only populated for videos NOT on the connected channel — a Claude
  // hypothesis from public data only, explicitly not real analytics.
  performanceNote?: string
}

function parseHashtags(...sources: string[]): string[] {
  const found = new Set<string>()
  for (const source of sources) {
    const matches = source.match(/#[A-Za-z0-9_]+/g) || []
    matches.forEach((m) => found.add(m))
  }
  return Array.from(found).slice(0, 15)
}

function formatDuration(iso?: string | null): string | null {
  if (!iso) return null
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return null
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const totalMinutes = hours * 60 + minutes
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}` : `${totalMinutes}:${paddedSeconds}`
}

async function generatePerformanceNote(details: {
  title: string
  description: string
  durationLabel: string | null
  viewCount: number
  likeCount: number
  commentCount: number
}): Promise<string | undefined> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: `Here is a trending YouTube Short's public data. In 1-2 sentences, hypothesize what's likely driving its performance — grounded in specifics from the title/description (hook style, format, hashtag choices), not generic advice. You do not have access to this channel's real analytics (no CTR or retention data), so do not claim to know those numbers — only reason from what's given.

Title: ${details.title}
Description: ${details.description.slice(0, 500)}
Duration: ${details.durationLabel || 'unknown'}
Views: ${details.viewCount.toLocaleString()}
Likes: ${details.likeCount.toLocaleString()}
Comments: ${details.commentCount.toLocaleString()}

Respond with ONLY the 1-2 sentence hypothesis, no preamble or labels.`,
        },
      ],
    })
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    return textBlock?.text.trim() || undefined
  } catch (err) {
    console.error('Performance note generation failed:', err)
    return undefined
  }
}

// On-demand fetch for the Ideas page's per-card breakdown expander —
// deliberately uncached (like getTrendingVideosForFilter in ./trending):
// a targeted, explicit-click fetch, not a page-load cost. `source: 'own'`
// only for videos already known to belong to the connected channel (the
// "From your channel" cards) — attempts real retention/CTR analytics.
// `source: 'trending'` is for anyone else's video — public stats plus a
// labeled AI hypothesis, never real analytics we have no access to.
export async function getVideoDetails(
  supabase: SupabaseClient,
  userId: string,
  options: { videoId: string; source: 'own' | 'trending' }
): Promise<VideoDetails | null> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, needs_reconnect')
    .eq('user_id', userId)
    .maybeSingle<{ google_refresh_token: string; needs_reconnect: boolean }>()

  if (!connection || connection.needs_reconnect) return null

  try {
    const oauth2Client = getYouTubeOAuthClient()
    oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })
    await oauth2Client.getAccessToken()

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const videosRes = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [options.videoId],
    })
    const item = videosRes.data.items?.[0]
    if (!item) return null

    const title = item.snippet?.title || ''
    const description = item.snippet?.description || ''
    const tags = item.snippet?.tags || []
    const durationLabel = formatDuration(item.contentDetails?.duration)

    const details: VideoDetails = {
      videoId: options.videoId,
      title,
      description,
      hashtags: parseHashtags(title, description, tags.map((t) => `#${t}`).join(' ')),
      publishedAt: item.snippet?.publishedAt || null,
      durationLabel,
      viewCount: Number(item.statistics?.viewCount) || 0,
      likeCount: Number(item.statistics?.likeCount) || 0,
      commentCount: Number(item.statistics?.commentCount) || 0,
    }

    if (options.source === 'own') {
      const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client })
      const endDate = new Date().toISOString().slice(0, 10)
      const startDate = '2005-01-01' // YouTube's own founding year — covers the video's full lifetime

      try {
        const engagementRes = await youtubeAnalytics.reports.query({
          ids: 'channel==MINE',
          startDate,
          endDate,
          metrics: 'averageViewDuration,averageViewPercentage',
          filters: `video==${options.videoId}`,
        })
        const row = engagementRes.data.rows?.[0]
        if (row) {
          details.analytics = {
            averageViewDuration: Number(row[0]) || 0,
            averageViewPercentage: Number(row[1]) || 0,
          }
        }
      } catch (err) {
        console.error('Video engagement analytics fetch failed:', err)
      }

      // Thumbnail-impression CTR is a separate report from the engagement
      // metrics above and is often withheld by YouTube for lower-traffic
      // videos — a missing/empty row is normal, not an error.
      try {
        const reachRes = await youtubeAnalytics.reports.query({
          ids: 'channel==MINE',
          startDate,
          endDate,
          metrics: 'videoThumbnailImpressions,videoThumbnailImpressionsClickRate',
          filters: `video==${options.videoId}`,
        })
        const row = reachRes.data.rows?.[0]
        if (row && details.analytics) {
          details.analytics.impressions = Number(row[0]) || 0
          details.analytics.ctr = Number(row[1]) || 0
        } else {
          details.ctrUnavailable = true
        }
      } catch (err) {
        details.ctrUnavailable = true
      }
    } else {
      details.performanceNote = await generatePerformanceNote({
        title,
        description,
        durationLabel,
        viewCount: details.viewCount,
        likeCount: details.likeCount,
        commentCount: details.commentCount,
      })
    }

    return details
  } catch (err: any) {
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
    } else {
      console.error('YouTube video-details fetch failed:', err)
    }
    return null
  }
}
