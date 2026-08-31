import { describe, it, expect } from 'vitest'
import { buildScriptBlocks, formatSeconds } from './scriptBlocks'
import type { RetentionDip } from './retention'

describe('formatSeconds', () => {
  it('formats sub-minute durations as seconds', () => {
    expect(formatSeconds(45)).toBe('45s')
  })

  it('formats minute-plus durations as m:ss', () => {
    expect(formatSeconds(90)).toBe('1:30')
  })

  it('pads seconds under 10', () => {
    expect(formatSeconds(65)).toBe('1:05')
  })
})

describe('buildScriptBlocks', () => {
  const dip = (startSeconds: number, endSeconds: number): RetentionDip => ({
    startSeconds,
    endSeconds,
    dropPercent: 30,
  })

  it('returns the whole script as one block when there is no video duration', () => {
    const blocks = buildScriptBlocks('one two three four', [dip(1, 2)], null)
    expect(blocks).toEqual([{ text: 'one two three four' }])
  })

  it('returns the whole script as one block when there are no dips', () => {
    const blocks = buildScriptBlocks('one two three four', [], 100)
    expect(blocks).toEqual([{ text: 'one two three four' }])
  })

  it('returns the whole script as one block for empty text', () => {
    const blocks = buildScriptBlocks('   ', [dip(1, 2)], 100)
    expect(blocks).toEqual([{ text: '   ' }])
  })

  it('splits the script at a dip proportional to elapsed video time', () => {
    // 10 words, 100s video, dip starts at 50s (halfway) -> cut at word 5
    const words = Array.from({ length: 10 }, (_, i) => `w${i + 1}`).join(' ')
    const blocks = buildScriptBlocks(words, [dip(50, 60)], 100)
    expect(blocks.length).toBe(2)
    expect(blocks[0].text).toBe('w1 w2 w3 w4 w5')
    expect(blocks[0].dip).toEqual(dip(50, 60))
    expect(blocks[1].text).toBe('w6 w7 w8 w9 w10')
    expect(blocks[1].dip).toBeUndefined()
  })

  it('preserves every word across all blocks (no words lost or duplicated)', () => {
    const words = Array.from({ length: 20 }, (_, i) => `w${i + 1}`)
    const blocks = buildScriptBlocks(words.join(' '), [dip(20, 25), dip(70, 75)], 100)
    const rejoined = blocks.map((b) => b.text).join(' ')
    expect(rejoined.split(' ')).toEqual(words)
  })

  it('sorts multiple dips by position even if passed out of order', () => {
    const words = Array.from({ length: 10 }, (_, i) => `w${i + 1}`).join(' ')
    const blocks = buildScriptBlocks(words, [dip(80, 90), dip(20, 30)], 100)
    // Earlier dip (20s) should annotate the first block, later dip (80s) the second-to-last
    expect(blocks[0].dip).toEqual(dip(20, 30))
    expect(blocks.some((b) => b.dip && b.dip.startSeconds === 80)).toBe(true)
  })
})
