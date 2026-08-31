export interface VoiceSample {
  text: string
  durationSeconds?: number | null
}

export interface VoiceMetrics {
  avgWpm: number | null
  avgSentenceLength: number
  vocabularyRichness: number
  topCatchphrases: { phrase: string; count: number }[]
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of',
  'in', 'on', 'at', 'for', 'with', 'this', 'that', 'it', 'you', 'i', 'we',
  'my', 'your', 'so', 'be', 'if', 'as', 'just', 'not', 'do', 'did',
])

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) || []
}

function sentencesOf(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
}

// Recurring 2-4 word phrases that appear as an exact match in at least
// two DIFFERENT samples — a real cross-video catchphrase, not just a
// phrase repeated within one script's own natural repetition.
function extractCatchphrases(samples: VoiceSample[], topN: number): { phrase: string; count: number }[] {
  const phraseToSampleIndices = new Map<string, Set<number>>()

  samples.forEach((sample, sampleIndex) => {
    const words = wordsOf(sample.text)
    for (const n of [2, 3, 4]) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n)
        // Skip phrases that are entirely stopwords — not a meaningful tic.
        if (gram.every((w) => STOPWORDS.has(w))) continue
        const phrase = gram.join(' ')
        if (!phraseToSampleIndices.has(phrase)) phraseToSampleIndices.set(phrase, new Set())
        phraseToSampleIndices.get(phrase)!.add(sampleIndex)
      }
    }
  })

  return Array.from(phraseToSampleIndices.entries())
    .filter(([, indices]) => indices.size >= 2)
    .map(([phrase, indices]) => ({ phrase, count: indices.size }))
    .sort((a, b) => b.count - a.count || b.phrase.length - a.phrase.length)
    .slice(0, topN)
}

// Deterministic, non-AI writing metrics computed directly from real text
// (and, where duration is known, real pacing) — grounding for the
// Claude-written prose summary rather than letting the model guess
// numbers it has no way to verify.
export function computeVoiceMetrics(samples: VoiceSample[], topCatchphraseCount = 5): VoiceMetrics {
  const wpmSamples = samples.filter((s) => s.durationSeconds && s.durationSeconds > 0)
  const avgWpm =
    wpmSamples.length > 0
      ? Math.round(
          wpmSamples.reduce((sum, s) => sum + wordsOf(s.text).length / (s.durationSeconds! / 60), 0) / wpmSamples.length
        )
      : null

  const allSentenceLengths = samples.flatMap((s) => sentencesOf(s.text).map((sent) => wordsOf(sent).length))
  const avgSentenceLength =
    allSentenceLengths.length > 0
      ? Math.round((allSentenceLengths.reduce((a, b) => a + b, 0) / allSentenceLengths.length) * 10) / 10
      : 0

  const allWords = samples.flatMap((s) => wordsOf(s.text))
  const vocabularyRichness = allWords.length > 0 ? Math.round((new Set(allWords).size / allWords.length) * 1000) / 1000 : 0

  const topCatchphrases = extractCatchphrases(samples, topCatchphraseCount)

  return { avgWpm, avgSentenceLength, vocabularyRichness, topCatchphrases }
}
