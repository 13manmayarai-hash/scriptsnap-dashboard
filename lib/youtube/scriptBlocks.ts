import type { RetentionDip } from './retention'

export interface ScriptBlock {
  text: string
  dip?: RetentionDip
}

export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
}

// Approximates where in the script text a retention dip "happened" by
// assuming roughly even pacing across the video's duration — there's no
// forced word-to-timestamp alignment here (that needs real audio
// transcription/alignment, out of scope), so this is a labeled estimate,
// not a claim of precision.
export function buildScriptBlocks(
  scriptText: string,
  dips: RetentionDip[],
  videoDurationSeconds: number | null | undefined
): ScriptBlock[] {
  const words = scriptText.split(/\s+/).filter(Boolean)
  const totalWords = words.length

  if (!videoDurationSeconds || dips.length === 0 || totalWords === 0) {
    return [{ text: scriptText }]
  }

  const cuts = dips
    .map((dip) => ({
      wordIndex: Math.min(totalWords, Math.max(1, Math.round((dip.startSeconds / videoDurationSeconds) * totalWords))),
      dip,
    }))
    .sort((a, b) => a.wordIndex - b.wordIndex)

  const blocks: ScriptBlock[] = []
  let cursor = 0
  for (const { wordIndex, dip } of cuts) {
    if (wordIndex > cursor) {
      blocks.push({ text: words.slice(cursor, wordIndex).join(' '), dip })
      cursor = wordIndex
    }
  }
  if (cursor < totalWords) {
    blocks.push({ text: words.slice(cursor).join(' ') })
  }
  return blocks.length > 0 ? blocks : [{ text: scriptText }]
}
