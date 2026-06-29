// WaveJSON model types (the subset WaveDrom understands that this editor edits).
// Reference: https://github.com/wavedrom/schema

/** A single signal row. */
export interface WaveSignal {
  name?: string
  /** One char per tick; '.' extends the previous level. e.g. "p..x34.5z" */
  wave?: string
  /** Bus/data labels consumed left-to-right by '=' and '2'..'9' cells. */
  data?: string[] | string
  /** Marker letters aligned to `wave`, for edge annotations. e.g. "..a..b" */
  node?: string
  /** Clock period multiplier. */
  period?: number
  /** Horizontal phase shift. */
  phase?: number
}

/** A group is [label, ...items]; items may be signals or nested groups. */
export type WaveItem = WaveSignal | WaveLane[]
export type WaveLane = WaveSignal | string | WaveLane[]

export interface WaveHead {
  text?: unknown
  tick?: number
  tock?: number
  every?: number
}

export interface WaveConfig {
  hscale?: number
  skin?: string
}

export interface WaveJson {
  signal: WaveLane[]
  edge?: string[]
  config?: WaveConfig
  head?: WaveHead
  foot?: WaveHead
}

/** Type guard: a plain signal object (not a nested group array, not a label). */
export function isSignal(lane: WaveLane): lane is WaveSignal {
  return typeof lane === 'object' && !Array.isArray(lane)
}

/** Normalize a signal's data field to an array of labels. */
export function dataToArray(data: WaveSignal['data']): string[] {
  if (!data) return []
  if (Array.isArray(data)) return data.slice()
  return data.split(/\s+/).filter((s) => s.length > 0)
}
