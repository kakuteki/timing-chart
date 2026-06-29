import type { WaveJson } from './wavejson'

/** Serialize a model to pretty WaveJSON text (standard JSON, 2-space indent). */
export function serializeModel(model: WaveJson): string {
  return JSON.stringify(model, null, 2)
}
