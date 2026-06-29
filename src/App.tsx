import { useEffect, useState } from 'react'
import { useEditor } from './state/store'
import { Toolbar } from './components/Toolbar'
import { SignalTable } from './components/gui/SignalTable'
import { BusDataPanel } from './components/gui/BusDataPanel'
import { EdgeEditor } from './components/annotations/EdgeEditor'
import { WaveJsonEditor } from './components/text/WaveJsonEditor'
import { PreviewPane } from './components/preview/PreviewPane'

type Tab = 'gui' | 'text' | 'preview'

export default function App() {
  const [tab, setTab] = useState<Tab>('gui')

  // Global undo/redo shortcuts. Skip when a text field is focused so the
  // browser's native field-level undo keeps working inside the editors.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.isComposing) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      const st = useEditor.getState()
      if (k === 'z' && !e.shiftKey) {
        if (st.past.length === 0) return
        e.preventDefault()
        st.undo()
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        if (st.future.length === 0) return
        e.preventDefault()
        st.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <Toolbar />

      <nav className="tabbar" role="tablist" aria-label="表示切替">
        <button role="tab" aria-selected={tab === 'gui'} onClick={() => setTab('gui')}>
          編集
        </button>
        <button role="tab" aria-selected={tab === 'text'} onClick={() => setTab('text')}>
          WaveJSON
        </button>
        <button
          role="tab"
          className="preview-tab"
          aria-selected={tab === 'preview'}
          onClick={() => setTab('preview')}
        >
          プレビュー
        </button>
      </nav>

      <main className="workspace" data-tab={tab}>
        <div className="pane pane-editor">
          <SignalTable />
          <details className="panel">
            <summary>バス値</summary>
            <BusDataPanel />
          </details>
          <details className="panel">
            <summary>注釈（セットアップ / ホールド）</summary>
            <EdgeEditor />
          </details>
        </div>
        <div className="pane pane-text">
          <WaveJsonEditor />
        </div>
        <div className="pane pane-preview">
          <PreviewPane />
        </div>
      </main>
    </div>
  )
}
