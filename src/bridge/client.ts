// Bridge client: keeps the in-browser model in sync with the local bridge
// server (bridge/server.mjs) over SSE + POST, so an external tool like Claude
// Code can drive the chart and pick up the user's edits.
//
// Convergence: every change carries a server-assigned monotonic `rev` and the
// editor's `source` id. Clients apply only strictly-newer revs and skip their
// own echoes — so even with multiple browsers the latest writer wins and state
// converges (no content-based guessing, no echo loop).

import { useEditor } from '../state/store'
import type { WaveJson } from '../model/wavejson'

export const DEFAULT_BRIDGE_URL = 'http://localhost:51123'

export type BridgeStatus = 'connecting' | 'connected' | 'error' | 'disconnected'

let es: EventSource | null = null
let unsub: (() => void) | null = null
let pushTimer: number | undefined
let suppressPush = false // true while applying a remote frame (don't echo it back)
let clientId = ''
let lastRev = -1
let firstFrame = true

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return 'c' + Date.now().toString(36) + Math.floor(performance.now()).toString(36)
  }
}

function postModel(url: string, model: unknown, onStatus?: (s: BridgeStatus) => void): void {
  fetch(`${url}/model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': clientId },
    body: JSON.stringify(model),
  }).catch(() => onStatus?.('error'))
}

/** Connect to the bridge and start bidirectional sync. Idempotent. */
export function bridgeConnect(url: string, onStatus?: (s: BridgeStatus) => void): void {
  bridgeDisconnect()
  clientId = newId()
  lastRev = -1
  firstFrame = true
  onStatus?.('connecting')

  es = new EventSource(`${url}/events`)
  es.onopen = () => onStatus?.('connected')
  es.onerror = () => onStatus?.('error')
  es.onmessage = (ev) => {
    let frame: { model?: unknown; rev?: number; source?: string }
    try {
      frame = JSON.parse(ev.data)
    } catch {
      return
    }
    const rev = typeof frame.rev === 'number' ? frame.rev : lastRev + 1
    if (rev <= lastRev) return // stale frame
    lastRev = rev

    if (firstFrame) {
      // Local wins on connect: don't overwrite the chart the user has open —
      // publish it to the bridge instead so external tools start from it.
      firstFrame = false
      postModel(url, useEditor.getState().model, onStatus)
      return
    }
    if (frame.source && frame.source === clientId) return // our own echo
    const incoming = frame.model as WaveJson | undefined
    if (!incoming || !Array.isArray(incoming.signal)) return
    suppressPush = true
    try {
      useEditor.getState().loadModel(incoming)
    } finally {
      suppressPush = false
    }
  }

  // Push local model edits to the bridge (debounced).
  let last = useEditor.getState().model
  unsub = useEditor.subscribe((s) => {
    if (s.model === last) return
    last = s.model
    if (suppressPush) return
    if (pushTimer) window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => postModel(url, s.model, onStatus), 300)
  })
}

/** Stop syncing and close the connection. */
export function bridgeDisconnect(): void {
  if (pushTimer) window.clearTimeout(pushTimer)
  pushTimer = undefined
  es?.close()
  es = null
  unsub?.()
  unsub = null
  suppressPush = false
  firstFrame = true
  lastRev = -1
}
