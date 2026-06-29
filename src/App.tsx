import { Toolbar } from './components/Toolbar'
import { SignalTable } from './components/gui/SignalTable'
import { BusDataPanel } from './components/gui/BusDataPanel'
import { EdgeEditor } from './components/annotations/EdgeEditor'
import { WaveJsonEditor } from './components/text/WaveJsonEditor'
import { PreviewPane } from './components/preview/PreviewPane'

export default function App() {
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
