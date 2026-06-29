import { useEffect, useRef } from 'react'
import * as WaveDrom from 'wavedrom'
import type { WaveJson } from '../model/wavejson'
import { WAVE_SKIN, type SkinName } from './skins'

// Module-level monotonically increasing index so each diagram instance gets a
// unique id namespace (WaveDrom uses it for SVG element / gradient ids).
let nextIndex = 0

interface Props {
  model: WaveJson
  skin: SkinName
  /** Called with the freshly rendered <svg> element (or null on failure). */
  onRendered?: (svg: SVGSVGElement | null) => void
  onError?: (message: string | null) => void
}

export function WaveDromRenderer({ model, skin, onRendered, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef<number>(-1)
  if (indexRef.current < 0) indexRef.current = nextIndex++

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Select the skin by injecting config.skin; the merged WAVE_SKIN holds all.
    const source: WaveJson = {
      ...model,
      config: { ...model.config, skin },
    }
    // renderWaveElement APPENDS — clear first or SVGs stack.
    container.replaceChildren()
    try {
      WaveDrom.renderWaveElement(indexRef.current, source, container, WAVE_SKIN, false)
      const svg = container.querySelector('svg')
      onError?.(null)
      onRendered?.(svg)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      onError?.(message)
      onRendered?.(null)
    }
  }, [model, skin, onRendered, onError])

  return <div className="wavedrom-host" ref={containerRef} />
}
