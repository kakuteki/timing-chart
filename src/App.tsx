import { useEffect } from 'react'
import { useEditor } from './state/store'
import { Toolbar } from './components/Toolbar'
import { SignalTable } from './components/gui/SignalTable'
import { BusDataPanel } from './components/gui/BusDataPanel'
import { EdgeEditor } from './components/annotations/EdgeEditor'
import { WaveJsonEditor } from './components/text/WaveJsonEditor'
import { PreviewPane } from './components/preview/PreviewPane'

export default function App() {
  // Global undo/redo shortcuts. Skip when a text field is focused so the
  // browser's native field-level undo keeps working inside the editors.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditor.getState().undo()
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault()
        useEditor.getState().redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <Toolbar />
      <main className="layout">
        <div className="col col-gui">
          <SignalTable />
          <BusDataPanel />
          <EdgeEditor />
        </div>
        <div className="col col-text">
          <WaveJsonEditor />
        </div>
        <div className="col col-preview">
          <PreviewPane />
        </div>
      </main>
    </div>
  )
}
