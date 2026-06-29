import { useRef, useState } from 'react'
import { useEditor } from '../state/store'
import { maxTicks } from '../state/selectors'
import { clockWave, type ClockKind } from '../model/clockgen'
import { serializeModel } from '../model/serialize'
import { parseModel } from '../model/parse'
import { SKIN_NAMES, type SkinName } from '../render/skins'
import { getLatestSvg } from '../export/svgRegistry'
import { svgToString } from '../export/svg'
import { svgToPngBlob } from '../export/png'
import { downloadBlob, downloadText } from '../export/download'
import { buildShareUrl } from '../share/url'

export function Toolbar() {
  const model = useEditor((s) => s.model)
  const applyGuiModel = useEditor((s) => s.applyGuiModel)
  const loadModel = useEditor((s) => s.loadModel)
  const skinName = useEditor((s) => s.skinName)
  const setSkin = useEditor((s) => s.setSkin)

  const fileRef = useRef<HTMLInputElement>(null)
  const [clockKind, setClockKind] = useState<ClockKind>('P')
  const [pngScale, setPngScale] = useState(2)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }

  const addClock = () => {
    const ticks = maxTicks(model)
    const wave = clockWave(clockKind, ticks)
    applyGuiModel({ ...model, signal: [...model.signal, { name: 'clk', wave }] })
  }

  const exportSvg = () => {
    const svg = getLatestSvg()
    if (!svg) return flash('描画SVGが見つかりません')
    downloadText(svgToString(svg), 'timing-chart.svg', 'image/svg+xml')
  }

  const exportPng = async () => {
    const svg = getLatestSvg()
    if (!svg) return flash('描画SVGが見つかりません')
    try {
      const blob = await svgToPngBlob(svg, pngScale)
      downloadBlob(blob, 'timing-chart.png')
    } catch (e) {
      flash(e instanceof Error ? e.message : 'PNG出力に失敗')
    }
  }

  const exportJson = () => {
    downloadText(serializeModel(model), 'timing-chart.wavejson', 'application/json')
  }

  const onLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((text) => {
      const res = parseModel(text)
      if (res.ok && res.model) {
        loadModel(res.model)
        flash('読み込みました')
      } else {
        flash('読み込み失敗: ' + (res.error ?? ''))
      }
    })
    e.target.value = ''
  }

  const share = async () => {
    const url = buildShareUrl(model)
    history.replaceState(null, '', url)
    try {
      await navigator.clipboard.writeText(url)
      flash('共有リンクをコピーしました')
    } catch {
      flash('URLを更新しました（コピーは手動で）')
    }
    if (url.length > 8000) flash('注意: URLが長すぎる可能性があります')
  }

  return (
    <header className="toolbar">
      <span className="app-title">タイミングチャート</span>

      <div className="tb-group">
        <select value={clockKind} onChange={(e) => setClockKind(e.target.value as ClockKind)}>
          <option value="P">clk ↑矢印</option>
          <option value="N">clk ↓矢印</option>
          <option value="p">clk 正</option>
          <option value="n">clk 負</option>
        </select>
        <button onClick={addClock}>クロック生成</button>
      </div>

      <div className="tb-group">
        <label>
          スキン
          <select value={skinName} onChange={(e) => setSkin(e.target.value as SkinName)}>
            {SKIN_NAMES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tb-group">
        <button onClick={exportSvg}>SVG</button>
        <select value={pngScale} onChange={(e) => setPngScale(Number(e.target.value))}>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
        <button onClick={exportPng}>PNG</button>
        <button onClick={exportJson}>JSON保存</button>
        <button onClick={() => fileRef.current?.click()}>JSON読込</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.wavejson,application/json"
          hidden
          onChange={onLoadFile}
        />
      </div>

      <div className="tb-group">
        <button onClick={share}>共有リンク</button>
      </div>

      {toast && <span className="toast">{toast}</span>}
    </header>
  )
}
