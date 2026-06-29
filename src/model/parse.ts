import JSON5 from 'json5'
import type { WaveJson } from './wavejson'

export interface ParseResult {
  ok: boolean
  model?: WaveJson
  error?: string
}

/**
 * Parse WaveJSON text with JSON5 (relaxed: unquoted keys, trailing commas,
 * comments) and validate the minimum shape WaveDrom requires.
 */
export function parseModel(text: string): ParseResult {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: '入力が空です' }
  }
  let value: unknown
  try {
    value = JSON5.parse(trimmed)
  } catch (e) {
    return { ok: false, error: formatJson5Error(e) }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: 'ルートはオブジェクト { … } である必要があります' }
  }
  const obj = value as Record<string, unknown>
  if (!Array.isArray(obj.signal)) {
    return { ok: false, error: '"signal" 配列が必要です' }
  }
  if (obj.edge !== undefined && !Array.isArray(obj.edge)) {
    return { ok: false, error: '"edge" は配列である必要があります' }
  }
  return { ok: true, model: value as WaveJson }
}

function formatJson5Error(e: unknown): string {
  if (e instanceof Error) {
    // JSON5 errors carry lineNumber/columnNumber properties
    const ln = (e as { lineNumber?: number }).lineNumber
    const col = (e as { columnNumber?: number }).columnNumber
    const loc = ln ? ` (行 ${ln}${col ? `, 列 ${col}` : ''})` : ''
    return `JSON 構文エラー${loc}: ${e.message}`
  }
  return 'JSON 構文エラー'
}
