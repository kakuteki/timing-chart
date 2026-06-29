import { svgToString, svgPixelSize } from './svg'

/**
 * Rasterize a rendered <svg> to a PNG Blob at `scale`× resolution.
 * Draws the serialized SVG onto an offscreen canvas via an Image.
 */
// Conservative canvas limits (Chrome ~16384/side; keep margin for other UAs).
const MAX_SIDE = 16384
const MAX_AREA = 16384 * 8192

export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const { width, height } = svgPixelSize(svg)
  // Clamp the effective scale so a large chart at 4× can't silently exceed the
  // canvas dimension/area limit and make toBlob return null.
  const sideCap = Math.min(MAX_SIDE / width, MAX_SIDE / height)
  const areaCap = Math.sqrt(MAX_AREA / (width * height))
  const eff = Math.max(0.1, Math.min(scale, sideCap, areaCap))
  const source = svgToString(svg)
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)

  const img = new Image()
  img.width = width
  img.height = height

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG画像の読み込みに失敗しました'))
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * eff))
  canvas.height = Math.max(1, Math.round(height * eff))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした')
  // White background (WaveDrom SVG is transparent).
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG への変換に失敗しました'))
    }, 'image/png')
  })
}
