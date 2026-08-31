import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'
import { CACHE_FRESHNESS_MS } from './analytics'

export interface RetentionPoint {
  elapsedRatio: number
  watchRatio: number
}

export interface RetentionDip {
  startSeconds: number
  endSeconds: number
  dropPercent: number
}

export interface RetentionAnalysis {
  videoDurationSeconds: number | null
  curve: RetentionPoint[]
  dips: RetentionDip[]
}

// A dip is a contiguous drop of at least DIP_THRESHOLD (in watch-ratio
// points, where the API's ratio is ~0-1) within a short window of
// buckets — catches a real fall-off, not point-to-point measurement
// noise. WINDOW_BUCKETS is small since YouTube returns ~100 buckets
// across the whole video regardless of length.
const DIP_THRESHOLD = 0.08
const WINDOW_BUCKETS = 3

export function parseDurationSeconds(iso?: string | null): number | null {
  if (!iso) return null
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return null
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

export function detectDips(curve: RetentionPoint[], durationSeconds: number | null): RetentionDip[] {
  const dips: RetentionDip[] = []
  let i = 0
  while (i < curve.length - 1) {
    const windowEnd = Math.min(i + WINDOW_BUCKETS, curve.length)
    let troughIdx = i
    let trough = curve[i].watchRatio
    for (let j = i; j < windowEnd; j++) {
      if (curve[j].watchRatio < trough) {
        trough = curve[j].watchRatio
        troughIdx = j
      }
    }
    const drop = curve[i].watchRatio - trough
    if (drop >= DIP_THRESHOLD) {
      dips.push({
        startSeconds: durationSeconds ? Math.round(curve[i].elapsedRatio * durationSeconds) : 0,
        endSeconds: durationSeconds ? Math.round(curve[troughIdx].elapsedRatio * durationSeconds) : 0,
        dropPercent: Math.round(drop * 1000) / 10,
      })
      i = troughIdx + 1
    } else {
      i += 1
    }
  }
  return dips
}

// Per-video second-by-second-ish retention curve + detected drop-off
// points, for a video the connected channel actually owns (YouTube's
// `channel==MINE` scoping makes this safe-by-construction — querying a
// videoId that isn't on the connected channel just returns no rows, the
// same trust model already used by getVideoDetails/getPerformanceContext
// in this codebase, not a new pattern). Never throws; a hiccup here
// should never break whatever page called it.
export async function getRetentionAnalysis(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<RetentionAnalysis | null> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, needs_reconnect')
    .eq('user_id', userId)
    .maybeSingle<{ google_refresh_token: string; needs_reconnect: boolean }>()

  if (!connection || connection.needs_reconnect) return null

  if (!options.forceRefresh) {
    const { data: cached } = await supabase
      .from('video_retention_cache')
      .select('video_duration_seconds, retention_curve, dips, cached_at')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .maybeSingle()

    if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_FRESHNESS_MS) {
      return {
        videoDurationSeconds: cached.video_duration_seconds,
        curve: cached.retention_curve,
        dips: cached.dips,
      }
    }
  }

  try {
    const oauth2Client = getYouTubeOAuthClient()
    oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })
    await oauth2Client.getAccessToken()

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client })

    const videoRes = await youtube.videos.list({ part: ['contentDetails'], id: [videoId] })
    const videoDurationSeconds = parseDurationSeconds(videoRes.data.items?.[0]?.contentDetails?.duration)

    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = '2005-01-01'

    const curveRes = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'audienceWatchRatio',
      dimensions: 'elapsedVideoTimeRatio',
      filters: `video==${videoId}`,
      sort: 'elapsedVideoTimeRatio',
    })

    const curve: RetentionPoint[] = (curveRes.data.rows || []).map((row) => ({
      elapsedRatio: Number(row[0]) || 0,
      watchRatio: Number(row[1]) || 0,
    }))

    if (curve.length === 0) {
      // Video isn't on this channel, or YouTube hasn't attributed retention
      // data yet (very new/low-view videos) — not an error, just nothing to show.
      return null
    }

    const dips = detectDips(curve, videoDurationSeconds)

    await supabase.from('video_retention_cache').upsert({
      video_id: videoId,
      user_id: userId,
      video_duration_seconds: videoDurationSeconds,
      retention_curve: curve,
      dips,
      cached_at: new Date().toISOString(),
    })

    return { videoDurationSeconds, curve, dips }
  } catch (err: any) {
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
    } else {
      console.error('Retention analysis fetch failed:', err)
    }
    return null
  }
}
