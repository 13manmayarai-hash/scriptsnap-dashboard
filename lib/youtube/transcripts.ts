import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getYouTubeOAuthClient } from './oauth'
import { parseDurationSeconds } from './retention'

const MAX_VIDEOS = 10

export interface IngestResult {
  ingestedCount: number
  skippedCount: number
  needsReconnect: boolean
  error?: string
}

// Strips SRT/SBV sequence numbers and timestamp lines, leaving plain
// spoken text. YouTube's caption download can return either format
// depending on the track's source; both share the same "everything that
// isn't a number or a timestamp line is dialogue" shape, so one parser
// covers both without needing to know which format came back.
function parseCaptionTrack(raw: string): string {
  const lines = raw.split(/\r?\n/)
  const textLines = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (/^\d+$/.test(trimmed)) return false // sequence number
    if (/\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}/.test(trimmed)) return false // timestamp line
    return true
  })
  return textLines.join(' ').replace(/\s+/g, ' ').trim()
}

// Pulls the connected channel's most recent videos' actual captions —
// real transcripts, not ScriptSnap's own generated text (that's what
// voiceprint/analyze.ts uses as a fallback when this hasn't been run).
// Requires the youtube.force-ssl scope; a connection made before that
// scope was added will fail with insufficientPermissions on the first
// captions.download call, which this function turns into needs_reconnect
// so the existing Settings reconnect flow handles it — the same pattern
// already used for invalid_grant elsewhere in this codebase.
export async function ingestChannelTranscripts(
  supabase: SupabaseClient,
  userId: string
): Promise<IngestResult> {
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token, needs_reconnect')
    .eq('user_id', userId)
    .maybeSingle<{ google_refresh_token: string; needs_reconnect: boolean }>()

  if (!connection || connection.needs_reconnect) {
    return { ingestedCount: 0, skippedCount: 0, needsReconnect: !!connection?.needs_reconnect }
  }

  const oauth2Client = getYouTubeOAuthClient()
  oauth2Client.setCredentials({ refresh_token: connection.google_refresh_token })

  try {
    await oauth2Client.getAccessToken()
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    const channelRes = await youtube.channels.list({ part: ['contentDetails'], mine: true })
    const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return { ingestedCount: 0, skippedCount: 0, needsReconnect: false, error: 'Could not find your uploads.' }
    }

    const playlistRes = await youtube.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: MAX_VIDEOS,
    })
    const videoIds = (playlistRes.data.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id)

    if (videoIds.length === 0) {
      return { ingestedCount: 0, skippedCount: 0, needsReconnect: false }
    }

    const videosRes = await youtube.videos.list({ part: ['snippet', 'contentDetails'], id: videoIds })
    const videosById = Object.fromEntries((videosRes.data.items || []).map((v) => [v.id, v]))

    let ingestedCount = 0
    let skippedCount = 0

    for (const videoId of videoIds) {
      try {
        const captionsRes = await youtube.captions.list({ part: ['snippet'], videoId })
        const tracks = captionsRes.data.items || []
        // Prefer a manually-created track over auto-generated (ASR) —
        // more accurate to the creator's actual delivery — but fall back
        // to ASR since most small creators never add manual captions.
        const track = tracks.find((t) => t.snippet?.trackKind !== 'ASR') || tracks[0]
        if (!track?.id) {
          skippedCount++
          continue
        }

        const downloadRes = await youtube.captions.download(
          { id: track.id, tfmt: 'srt' },
          { responseType: 'text' }
        )
        const transcript = parseCaptionTrack(String(downloadRes.data))
        if (!transcript) {
          skippedCount++
          continue
        }

        const video = videosById[videoId]
        await supabase.from('video_transcripts').upsert({
          video_id: videoId,
          user_id: userId,
          title: video?.snippet?.title || null,
          transcript,
          is_auto_generated: track.snippet?.trackKind === 'ASR',
          video_duration_seconds: parseDurationSeconds(video?.contentDetails?.duration),
          ingested_at: new Date().toISOString(),
        })
        ingestedCount++
      } catch (err: any) {
        // insufficientPermissions means the connection's token predates
        // the force-ssl scope — every remaining video would fail the same
        // way, so stop here and ask for reconnect rather than burning
        // API quota on captions.list calls that can't succeed.
        if (isInsufficientPermissions(err)) {
          await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
          return { ingestedCount, skippedCount, needsReconnect: true }
        }
        // Any other per-video failure (captions disabled, private video,
        // transient API error) shouldn't abort the rest of the channel.
        skippedCount++
      }
    }

    return { ingestedCount, skippedCount, needsReconnect: false }
  } catch (err: any) {
    if (isInsufficientPermissions(err)) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
      return { ingestedCount: 0, skippedCount: 0, needsReconnect: true }
    }
    const isRevoked = err?.response?.data?.error === 'invalid_grant' || err?.message?.includes('invalid_grant')
    if (isRevoked) {
      await supabase.from('youtube_connections').update({ needs_reconnect: true }).eq('user_id', userId)
      return { ingestedCount: 0, skippedCount: 0, needsReconnect: true }
    }
    console.error('Transcript ingestion failed:', err)
    return { ingestedCount: 0, skippedCount: 0, needsReconnect: false, error: 'Could not fetch transcripts — try again in a moment.' }
  }
}

function isInsufficientPermissions(err: any): boolean {
  const reason = err?.response?.data?.error?.errors?.[0]?.reason || err?.errors?.[0]?.reason
  return reason === 'insufficientPermissions'
}
