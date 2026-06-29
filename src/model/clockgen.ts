// Clock waveform generation.

export type ClockKind = 'p' | 'n' | 'P' | 'N'

/**
 * Build a clock wave string of `cycles` periods.
 * 'p'/'n' = positive/negative clock; 'P'/'N' = same with edge arrows.
 * Uses "<kind>" + "." * (cycles-1) so each '.' repeats the clock period.
 */
export function clockWave(kind: ClockKind, cycles: number): string {
  if (cycles <= 0) return ''
  return kind + '.'.repeat(cycles - 1)
}
