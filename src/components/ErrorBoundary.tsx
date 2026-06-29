import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Catches render crashes so a malformed model (e.g. one autosaved before a
 * validation fix, or arriving via a crafted share link) shows a recovery panel
 * instead of a white screen the user can't escape. Recovery offers a
 * non-destructive path first (drop the share hash, keep the user's own draft)
 * and only wipes the autosave as a last resort.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface for debugging; no external reporting (fully client-side).
    console.error('描画クラッシュ:', error, info.componentStack)
  }

  // Strip the share hash, then force a real reload. (Replacing to
  // origin+pathname while a hash is present is a same-document navigation that
  // would not reload, so do it via history first, then reload().)
  private reloadWithoutHash() {
    window.history.replaceState(
      null,
      '',
      window.location.origin + window.location.pathname + window.location.search,
    )
    window.location.reload()
  }

  // Default recovery: most crashes come from a bad/crafted share link, so drop
  // the hash and reload from the user's OWN autosaved draft — don't destroy it.
  private softReset = () => {
    this.reloadWithoutHash()
  }

  // Last resort: the autosaved draft itself is the problem — discard it too.
  private hardReset = () => {
    try {
      localStorage.removeItem('timing-chart:model')
    } catch {
      /* ignore */
    }
    this.reloadWithoutHash()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-panel">
          <h1>表示中に問題が発生しました</h1>
          <p>
            データが壊れている可能性があります。まずは
            <b>共有リンクを外して再読み込み</b>
            をお試しください（このブラウザに保存した作図は残ります）。直らない場合のみ、
            保存内容も削除して初期化してください。
          </p>
          <pre className="crash-detail">{this.state.error.message}</pre>
          <div className="crash-actions">
            <button className="primary" onClick={this.softReset}>
              共有リンクを外して再読み込み（保存は残す）
            </button>
            <button onClick={this.hardReset}>保存内容も削除して初期化</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
