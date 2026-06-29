import type { WaveJson, WaveLane, WaveSignal } from '../model/wavejson'
import { waveLength } from '../model/wave-codec'

export type RowKind = 'signal' | 'group-label' | 'spacer'

export interface Row {
  kind: RowKind
  /** Present for kind === 'signal'. */
  signal?: WaveSignal
  /** Present for kind === 'group-label'. */
  label?: string
  /** Path of indices into model.signal to reach this lane. */
  path: number[]
  depth: number
}

/** Flatten the (possibly nested) signal tree into display rows. */
export function flattenSignals(model: WaveJson): Row[] {
  return walk(model.signal, [], 0)
}

function walk(lanes: WaveLane[], path: number[], depth: number): Row[] {
  const rows: Row[] = []
  lanes.forEach((lane, i) => {
    const p = [...path, i]
    if (typeof lane === 'string') {
      rows.push({ kind: 'group-label', label: lane, path: p, depth })
    } else if (Array.isArray(lane)) {
      rows.push(...walk(lane, p, depth + 1))
    } else if (Object.keys(lane).length === 0) {
      rows.push({ kind: 'spacer', path: p, depth })
    } else {
      rows.push({ kind: 'signal', signal: lane, path: p, depth })
    }
  })
  return rows
}

/** The number of tick columns to display = longest wave among all signals. */
export function maxTicks(model: WaveJson): number {
  let max = 0
  for (const row of flattenSignals(model)) {
    if (row.kind === 'signal' && row.signal?.wave) {
      max = Math.max(max, waveLength(row.signal.wave))
    }
  }
  return Math.max(max, 1)
}

/** Collect node-marker letters already used across the model (for allocation). */
export function usedNodeLetters(model: WaveJson): Set<string> {
  const used = new Set<string>()
  for (const row of flattenSignals(model)) {
    const node = row.signal?.node
    if (!node) continue
    for (const ch of node) {
      if (/[A-Za-z]/.test(ch)) used.add(ch)
    }
  }
  return used
}

/** Lowest unused marker letter (a-z then A-Z), or null if exhausted. */
export function nextNodeLetter(model: WaveJson): string | null {
  const used = usedNodeLetters(model)
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const ch of pool) {
    if (!used.has(ch)) return ch
  }
  return null
}
