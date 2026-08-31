import { describe, it, expect } from 'vitest'
import { computeVoiceMetrics } from './metrics'

describe('computeVoiceMetrics', () => {
  it('returns null avgWpm when no sample has a known duration', () => {
    const metrics = computeVoiceMetrics([{ text: 'one two three four five' }])
    expect(metrics.avgWpm).toBeNull()
  })

  it('computes avgWpm from word count and duration', () => {
    // 10 words in 60 seconds -> 10 WPM
    const metrics = computeVoiceMetrics([
      { text: 'one two three four five six seven eight nine ten', durationSeconds: 60 },
    ])
    expect(metrics.avgWpm).toBe(10)
  })

  it('averages WPM across multiple timed samples', () => {
    const metrics = computeVoiceMetrics([
      { text: Array(60).fill('word').join(' '), durationSeconds: 60 }, // 60 wpm
      { text: Array(120).fill('word').join(' '), durationSeconds: 60 }, // 120 wpm
    ])
    expect(metrics.avgWpm).toBe(90)
  })

  it('ignores untimed samples when computing WPM but still uses them for other metrics', () => {
    const metrics = computeVoiceMetrics([
      { text: Array(60).fill('word').join(' '), durationSeconds: 60 }, // 60 wpm
      { text: 'no duration here at all' }, // excluded from WPM
    ])
    expect(metrics.avgWpm).toBe(60)
  })

  it('computes average sentence length across sentences, not samples', () => {
    // sentence lengths: 3, 5
    const metrics = computeVoiceMetrics([{ text: 'one two three. four five six seven eight.' }])
    expect(metrics.avgSentenceLength).toBe(4)
  })

  it('returns 0 sentence length for empty input', () => {
    const metrics = computeVoiceMetrics([])
    expect(metrics.avgSentenceLength).toBe(0)
    expect(metrics.vocabularyRichness).toBe(0)
  })

  it('computes vocabulary richness as unique-word ratio', () => {
    // 4 words, 2 unique ("the" repeated 3x is a stopword but still counted for richness)
    const metrics = computeVoiceMetrics([{ text: 'apple apple banana banana' }])
    expect(metrics.vocabularyRichness).toBe(0.5)
  })

  it('only flags a phrase as a catchphrase when it appears in 2+ different samples', () => {
    const metrics = computeVoiceMetrics([
      { text: "let's dive into this crazy topic today" },
      { text: "let's dive into another wild story" },
      { text: 'a completely unrelated sentence here' },
    ])
    expect(metrics.topCatchphrases.some((c) => c.phrase === "let's dive into")).toBe(true)
  })

  it('does not flag a phrase repeated only within a single sample', () => {
    const metrics = computeVoiceMetrics([
      { text: 'subscribe now subscribe now subscribe now' },
      { text: 'a totally different unrelated video about cooking' },
    ])
    expect(metrics.topCatchphrases.some((c) => c.phrase === 'subscribe now')).toBe(false)
  })

  it('excludes all-stopword phrases from catchphrases', () => {
    const metrics = computeVoiceMetrics([
      { text: 'this is that and this is' },
      { text: 'this is that and this is' },
    ])
    expect(metrics.topCatchphrases.some((c) => c.phrase === 'this is')).toBe(false)
  })

  it('respects the topN limit', () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({
      text: `unique catchphrase number ${i} appears here twice unique catchphrase number ${i}`,
    }))
    const metrics = computeVoiceMetrics(samples, 3)
    expect(metrics.topCatchphrases.length).toBeLessThanOrEqual(3)
  })
})
