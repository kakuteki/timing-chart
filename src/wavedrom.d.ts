// WaveDrom ships no TypeScript types. Declare the subset we use.
declare module 'wavedrom' {
  /** Render WaveJSON into a DOM element using an explicit skin (no window.WaveSkin global). */
  export function renderWaveElement(
    index: number,
    source: unknown,
    outputElement: Element,
    waveSkin?: unknown,
    notFirstSignal?: boolean,
  ): void
  export function renderWaveForm(
    index: number,
    source: unknown,
    output: string,
    notFirstSignal?: boolean,
  ): void
  export const version: string
}

declare module 'wavedrom/skins/default.js' {
  const skin: unknown
  export default skin
}
declare module 'wavedrom/skins/narrow.js' {
  const skin: unknown
  export default skin
}
declare module 'wavedrom/skins/lowkey.js' {
  const skin: unknown
  export default skin
}
declare module 'wavedrom/skins/dark.js' {
  const skin: unknown
  export default skin
}
