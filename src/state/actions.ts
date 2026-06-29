// Pure model mutations used by the GUI editor. Each returns a NEW model
// (structural sharing along the touched path) so React/Zustand sees a change.

import type { WaveJson, WaveLane, WaveSignal } from '../model/wavejson'
import { dataToArray } from '../model/wavejson'
import {
  setTick,
  extendTick,
  resizeWave,
  busSegmentCount,
  isBusState,
} from '../model/wave-codec'
import { flattenSignals, maxTicks } from './selectors'

/** Replace the lane at `path` by applying `updater`; returns a new lane array. */
function updateLane(
  lanes: WaveLane[],
  path: number[],
  updater: (lane: WaveLane) => WaveLane,
): WaveLane[] {
  const [head, ...rest] = path
  const copy = lanes.slice()
  if (rest.length === 0) {
    copy[head] = updater(copy[head])
  } else {
    copy[head] = updateLane(copy[head] as WaveLane[], rest, updater)
  }
  return copy
}

/** Remove the lane at `path`; returns a new lane array. */
function removeLane(lanes: WaveLane[], path: number[]): WaveLane[] {
  const [head, ...rest] = path
  const copy = lanes.slice()
  if (rest.length === 0) {
    copy.splice(head, 1)
  } else {
    copy[head] = removeLane(copy[head] as WaveLane[], rest)
  }
  return copy
}

function updateSignal(
  model: WaveJson,
  path: number[],
  updater: (sig: WaveSignal) => WaveSignal,
): WaveJson {
  return {
    ...model,
    signal: updateLane(model.signal, path, (lane) => updater(lane as WaveSignal)),
  }
}

/** Keep a signal's data[] length in sync with its bus-segment count. */
function reconcileData(sig: WaveSignal): WaveSignal {
  const need = sig.wave ? busSegmentCount(sig.wave) : 0
  if (need === 0) {
    if (sig.data === undefined) return sig
    const { data, ...rest } = sig
    void data
    return rest
  }
  const arr = dataToArray(sig.data)
  while (arr.length < need) arr.push('')
  arr.length = need
  return { ...sig, data: arr }
}

/** Set a single cell's state; reconciles data labels for bus transitions. */
export function setCellState(
  model: WaveJson,
  path: number[],
  tick: number,
  value: string,
): WaveJson {
  return updateSignal(model, path, (sig) => {
    const wave = setTick(sig.wave ?? '', tick, value)
    return reconcileData({ ...sig, wave })
  })
}

/** Make the cell at `tick` extend the previous cell ('.'). */
export function extendCell(model: WaveJson, path: number[], tick: number): WaveJson {
  return updateSignal(model, path, (sig) => {
    const wave = extendTick(sig.wave ?? '', tick)
    return reconcileData({ ...sig, wave })
  })
}

export function setSignalName(model: WaveJson, path: number[], name: string): WaveJson {
  return updateSignal(model, path, (sig) => ({ ...sig, name }))
}

export function setSignalNode(model: WaveJson, path: number[], node: string): WaveJson {
  return updateSignal(model, path, (sig) => {
    if (node.replace(/\./g, '').length === 0) {
      const { node: _n, ...rest } = sig
      void _n
      return rest
    }
    return { ...sig, node }
  })
}

/** Replace the data label at bus-segment index `dataIndex`. */
export function setDataLabel(
  model: WaveJson,
  path: number[],
  dataIndex: number,
  label: string,
): WaveJson {
  return updateSignal(model, path, (sig) => {
    const arr = dataToArray(sig.data)
    while (arr.length <= dataIndex) arr.push('')
    arr[dataIndex] = label
    return { ...sig, data: arr }
  })
}

/** Replace the entire data array (used by the bus data panel). */
export function setData(model: WaveJson, path: number[], data: string[]): WaveJson {
  return updateSignal(model, path, (sig) => ({ ...sig, data }))
}

/** Append a new signal at the top level. */
export function addSignal(model: WaveJson, name = 'sig'): WaveJson {
  const ticks = maxTicks(model)
  const wave = '0'.padEnd(ticks, '.')
  return { ...model, signal: [...model.signal, { name, wave }] }
}

/** Append a spacer ({}) at the top level. */
export function addSpacer(model: WaveJson): WaveJson {
  return { ...model, signal: [...model.signal, {}] }
}

export function removeRow(model: WaveJson, path: number[]): WaveJson {
  return { ...model, signal: removeLane(model.signal, path) }
}

/** Move a top-level row up/down by one. Only reorders within the root array. */
export function moveRow(model: WaveJson, path: number[], dir: -1 | 1): WaveJson {
  if (path.length !== 1) return model // nested reorder unsupported in v1
  const i = path[0]
  const j = i + dir
  if (j < 0 || j >= model.signal.length) return model
  const next = model.signal.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return { ...model, signal: next }
}

/** Set the global tick count: resize every signal's wave to `ticks`. */
export function setTickCount(model: WaveJson, ticks: number): WaveJson {
  const clamped = Math.max(1, ticks)
  const resize = (lanes: WaveLane[]): WaveLane[] =>
    lanes.map((lane) => {
      if (typeof lane === 'string') return lane
      if (Array.isArray(lane)) return resize(lane)
      if (Object.keys(lane).length === 0) return lane
      const sig = lane as WaveSignal
      if (sig.wave === undefined) return sig
      return reconcileData({ ...sig, wave: resizeWave(sig.wave, clamped) })
    })
  return { ...model, signal: resize(model.signal) }
}

export function addTick(model: WaveJson): WaveJson {
  return setTickCount(model, maxTicks(model) + 1)
}

export function removeTick(model: WaveJson): WaveJson {
  return setTickCount(model, Math.max(1, maxTicks(model) - 1))
}

/** All edge strings currently defined. */
export function getEdges(model: WaveJson): string[] {
  return model.edge ? model.edge.slice() : []
}

export function setEdges(model: WaveJson, edges: string[]): WaveJson {
  if (edges.length === 0) {
    const { edge: _e, ...rest } = model
    void _e
    return rest
  }
  return { ...model, edge: edges }
}

/** Convenience: does the model use any bus state needing data labels? */
export function hasBus(sig: WaveSignal): boolean {
  if (!sig.wave) return false
  for (const ch of sig.wave) if (isBusState(ch)) return true
  return false
}

/** Reference flatten for callers that mutate by displayed row. */
export { flattenSignals }
