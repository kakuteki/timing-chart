import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { WaveJson } from '../model/wavejson'
import { parseModel } from '../model/parse'

const HASH_KEY = 'd'

/** Encode a model into a compressed share string for the URL hash. */
export function encodeShare(model: WaveJson): string {
  return compressToEncodedURIComponent(JSON.stringify(model))
}

/** Build a full shareable URL (current origin+path, model in the hash). */
export function buildShareUrl(model: WaveJson): string {
  const base = window.location.origin + window.location.pathname
  return `${base}#${HASH_KEY}=${encodeShare(model)}`
}

/**
 * Read a model from the current location hash (#d=…), or null if absent /
 * malformed. Never throws.
 */
export function decodeShare(): WaveJson | null {
  try {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return null
    const params = new URLSearchParams(hash)
    const payload = params.get(HASH_KEY)
    if (!payload) return null
    const json = decompressFromEncodedURIComponent(payload)
    if (!json) return null
    const res = parseModel(json)
    return res.ok && res.model ? res.model : null
  } catch {
    return null
  }
}
