import { svgToString, svgPixelSize } from './svg'

/**
 * Rasterize a rendered <svg> to a PNG Blob at `scale`× resolution.
 * Draws the serialized SVG onto an offscreen canvas via an Image.
 */
export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const { width, height } = svgPixelSize(svg)
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
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
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
