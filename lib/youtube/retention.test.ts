import { describe, it, expect } from 'vitest'
import { detectDips, parseDurationSeconds } from './retention'

describe('parseDurationSeconds', () => {
  it('parses hours, minutes, and seconds', () => {
    expect(parseDurationSeconds('PT1H2M3S')).toBe(3723)
  })

  it('parses minutes and seconds only', () => {
    expect(parseDurationSeconds('PT4M30S')).toBe(270)
  })

  it('parses seconds only', () => {
    expect(parseDurationSeconds('PT45S')).toBe(45)
  })

  it('returns null for missing input', () => {
    expect(parseDurationSeconds(null)).toBeNull()
    expect(parseDurationSeconds(undefined)).toBeNull()
  })

  it('returns null for unparseable input', () => {
    expect(parseDurationSeconds('not-a-duration')).toBeNull()
  })
})

describe('detectDips', () => {
  const point = (elapsedRatio: number, watchRatio: number) => ({ elapsedRatio, watchRatio })

  it('returns no dips for a flat retention curve', () => {
    const curve = [point(0, 1.0), point(0.25, 0.99), point(0.5, 0.98), point(0.75, 0.97), point(1, 0.96)]
    expect(detectDips(curve, 100)).toEqual([])
  })

  it('detects a single clear drop', () => {
    const curve = [
      point(0, 1.0),
      point(0.2, 0.95),
      point(0.4, 0.6), // sharp drop here
      point(0.6, 0.59),
      point(0.8, 0.58),
      point(1, 0.57),
    ]
    const dips = detectDips(curve, 100)
    expect(dips.length).toBe(1)
    expect(dips[0].startSeconds).toBe(0)
    expect(dips[0].endSeconds).toBe(40)
    expect(dips[0].dropPercent).toBe(40)
  })

  it('ignores drops smaller than the threshold', () => {
    const curve = [point(0, 1.0), point(0.3, 0.97), point(0.6, 0.95), point(1, 0.93)]
    expect(detectDips(curve, 100)).toEqual([])
  })

  it('detects multiple separated dips', () => {
    const curve = [
      point(0, 1.0),
      point(0.1, 0.6), // dip 1
      point(0.2, 0.62),
      point(0.5, 0.6),
      point(0.6, 0.2), // dip 2
      point(0.7, 0.22),
      point(1, 0.2),
    ]
    const dips = detectDips(curve, 200)
    expect(dips.length).toBe(2)
  })

  it('falls back to 0 seconds when duration is unknown', () => {
    const curve = [point(0, 1.0), point(0.5, 0.5), point(1, 0.4)]
    const dips = detectDips(curve, null)
    expect(dips.length).toBeGreaterThan(0)
    expect(dips[0].startSeconds).toBe(0)
    expect(dips[0].endSeconds).toBe(0)
  })
})
