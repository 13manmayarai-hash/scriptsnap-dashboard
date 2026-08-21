import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'
import { CACHE_FRESHNESS_MS } from './analytics'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Standard YouTube video category IDs -> display label. Hardcoded rather
// than an extra videoCategories.list call — these are stable, and a rare
// Google rename needs a one-line fix here, not a migration.
const CATEGORY_LABELS: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
}

export interface TrendingContext {
  channelKeywords: { phrase: string; exampleTitle: string; viewCount?: number }[]
  trendingCategoryLabel: string | null
  trendingVideos: { videoId: string; title: string; channelTitle: string; viewCount: number }[]
}

interface ConnectionRow {
  google_refresh_token: string
  needs_reconnect: boolean
  cached_trending_context: TrendingContext | null
  trending_context_cached_at: string | null
}

function majorityCategoryId(categoryIds: (string | null | undefined)[]): string | undefined {
  const counts: Record<string, number> = {}
  for (const id of categoryIds) {
    if (!id) continue
    counts[id] = (counts[id] || 0) + 1
  }
  const entries = Object.entries(counts)
  if (entries.length === 0) return undefined
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

async function extractKeywords(
  titles: string[],
  viewsByTitle: Record<string, number>
): Promise<{ phrase: string; exampleTitle: string; viewCount?: number }[]> {
  if (titles.length === 0) return []

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      // Titles get copied back verbatim (many YouTube Shorts titles run
      // 20-30+ tokens, especially hashtag-stuffed ones) — up to 8 of them
      // plus JSON structure previously overflowed a 400-token budget,
      // truncating the response mid-array so the closing `]` never
      // appeared and the regex below silently matched nothing.
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: `These are recent video titles from one YouTube creator's channel. Identify up to 8 recurring topics or subject phrases across them — things this creator's audience clearly responds to, not generic words. For each, pick the single title that best represents it, copied EXACTLY as given. Respond with ONLY a JSON array, no other text: [{"phrase": "short topic phrase", "exampleTitle": "exact title from the list"}]

TITLES:
${titles.map((t) => `- ${t}`).join('\n')}`,
        },
      ],
    })
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const match = textBlock?.text.match(/\[[\s\S]*\]/)
    if (!match) {
      console.error('Keyword extraction: no JSON array in response', textBlock?.text?.slice(0, 200))
      return fallbackKeywordsFromTitles(titles, viewsByTitle)
    }
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackKeywordsFromTitles(titles, viewsByTitle)

    const extracted = parsed
      .filter((item) => item && typeof item.phrase === 'string' && typeof item.exampleTitle === 'string')
      .map((item) => ({
        phrase: item.phrase,
        exampleTitle: item.exampleTitle,
        viewCount: viewsByTitle[item.exampleTitle],
      }))
    return extracted.length > 0 ? extracted : fallbackKeywordsFromTitles(titles, viewsByTitle)
  } catch (err) {
    console.error('Keyword extraction failed:', err)
    return fallbackKeywordsFromTitles(titles, viewsByTitle)
  }
}

// If extraction fails or the model returns nothing usable, fall back to
// the creator's own top-viewed recent titles directly rather than showing
// an empty/misleading "not enough videos" state when videos clearly exist.
function fallbackKeywordsFromTitles(
  titles: string[],
  viewsByTitle: Record<string, number>
): { phrase: string; exampleTitle: string; viewCount?: number }[] {
  return [...titles]
    .sort((a, b) => (viewsByTitle[b] || 0) - (viewsByTitle[a] || 0))
    .slice(0, 5)
    .map((title) => ({ phrase: title, exampleTitle: title, viewCount: viewsByTitle[title] }))
}

// Builds "From your channel" (recurring topics, Claude-extracted from your
// own recent titles) and "Trending now" (real mostPopular videos in your
// channel's inferred content category) for the Ideas page. Same
// cache-first / never-throw / invalid_grant-detection shape as
// getCreatorAnalyticsContext in ./analytics — a YouTube or Claude hiccup
// here should never break the Ideas page, just skip the suggestions.
export async function getTrendingContext(
  supabase: SupabaseClient,
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<TrendingContext | null> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, needs_reconnect, cached_trending_context, trending_context_cached_at')
    .eq('user_id', userId)
    .maybeSingle<ConnectionRow>()

  if (!connection || connection.needs_reconnect) return null

  const cacheAge = connection.trending_context_cached_at
    ? Date.now() - new Date(connection.trending_context_cached_at).getTime()
    : Infinity

  if (!options.forceRefresh && connection.cached_trending_context && cacheAge < CACHE_FRESHNESS_MS) {
    return connection.cached_trending_context
  }

  try {
    const oauth2Client = getYouTubeOAuthClient()
    oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })
    await oauth2Client.getAccessToken()

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    const channelRes = await youtube.channels.list({ part: ['contentDetails'], mine: true })
    const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    let recentVideoIds: string[] = []
    if (uploadsPlaylistId) {
      const playlistRes = await youtube.playlistItems.list({
        playlistId: uploadsPlaylistId,
        part: ['contentDetails'],
        maxResults: 25,
      })
      recentVideoIds = (playlistRes.data.items || [])
        .map((item) => item.contentDetails?.videoId)
        .filter((id): id is string => !!id)
    }

    let channelKeywords: TrendingContext['channelKeywords'] = []
    let categoryLabel: string | null = null
    let inferredCategoryId: string | undefined

    if (recentVideoIds.length > 0) {
      const videosRes = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: recentVideoIds,
      })
      const items = videosRes.data.items || []

      const titles = items.map((item) => item.snippet?.title).filter((t): t is string => !!t)
      const viewsByTitle: Record<string, number> = {}
      items.forEach((item) => {
        if (item.snippet?.title) {
          viewsByTitle[item.snippet.title] = Number(item.statistics?.viewCount) || 0
        }
      })

      channelKeywords = await extractKeywords(titles, viewsByTitle)

      const catId = majorityCategoryId(items.map((item) => item.snippet?.categoryId))
      categoryLabel = catId ? CATEGORY_LABELS[catId] || null : null
      inferredCategoryId = catId
    }

    const trendingRes = await youtube.videos.list({
      chart: 'mostPopular',
      regionCode: 'IN',
      videoCategoryId: inferredCategoryId,
      part: ['snippet', 'statistics'],
      maxResults: 10,
    })

    const trendingVideos: TrendingContext['trendingVideos'] = (trendingRes.data.items || [])
      .filter((item) => item.id && item.snippet?.title)
      .map((item) => ({
        videoId: item.id!,
        title: item.snippet!.title!,
        channelTitle: item.snippet?.channelTitle || 'Unknown channel',
        viewCount: Number(item.statistics?.viewCount) || 0,
      }))

    const context: TrendingContext = { channelKeywords, trendingCategoryLabel: categoryLabel, trendingVideos }

    await supabase
      .from('youtube_connections')
      .update({ cached_trending_context: context, trending_context_cached_at: new Date().toISOString() })
      .eq('user_id', userId)

    return context
  } catch (err: any) {
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
    } else {
      console.error('YouTube trending refresh failed:', err)
    }
    return null
  }
}
