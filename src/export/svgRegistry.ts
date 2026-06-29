// Holds a reference to the most recently rendered preview <svg> so the toolbar
// can export it without prop-drilling through the component tree.
let latest: SVGSVGElement | null = null

export function setLatestSvg(svg: SVGSVGElement | null): void {
  latest = svg
}

export function getLatestSvg(): SVGSVGElement | null {
  return latest
}
