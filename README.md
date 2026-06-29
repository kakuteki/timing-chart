# タイミングチャート エディタ

FPGA・組み込み向けの **タイミングチャート（波形図）** をブラウザ内で作図するツールです。
クロック / データ / 制御信号、立ち上がり・立ち下がりエッジ、High / Low / X / Z、複数bitバス、
セットアップ・ホールド注釈を編集でき、SVG/PNG/JSON 出力と共有リンクに対応します。

- **完全クライアントサイド**（サーバー・DBなし。処理はすべてブラウザ内）
- 描画エンジンは [WaveDrom](https://github.com/wavedrom/wavedrom)
- **ハイブリッド編集**: GUIテーブルと WaveJSON テキストを相互同期
- 配布は GitHub Pages

## 使い方（編集）

- **GUIグリッド**: セルをクリックで状態を順送り（`0→1→p→n→P→N→x→z→=`）。
  - `Shift+クリック` = 逆送り / `Alt+クリック` = 直前セルを延長（`.`）
  - `p/n` クロック、`P/N` 矢印付きクロック、`x` 不定、`z` Hi-Z、`=` バス値
- **バス値**: `=` のセルは「バス値」パネルでラベル（`data[]`）を編集
- **注釈**: 信号を選び tick を指定して「マーカー追加」→ マーカー間を矢印で接続（setup/hold 等）
- **WaveJSON テキスト**: 直接編集も可能。無効なJSONの間は直前の図を保持し、エラーを表示（JSON5構文＝末尾カンマ等も許容）
- **クロック生成 / ＋信号 / ＋tick** はツールバーと信号エディタ上部から

## 出力・共有

- **SVG / PNG（1×/2×/4×） / JSON保存** … ツールバーから
- **JSON読込** … `.wavejson` / `.json` を読み込み
- **共有リンク** … モデルを圧縮してURLハッシュ（`#d=…`）に格納。リンクを開くと復元

## 開発

```bash
npm install
npm run dev        # http://localhost:5173/ （BASE_PATH=/ を内部使用）
npm run build      # 型チェック + 本番ビルド → dist/
npm run preview
```

## GitHub Pages へのデプロイ

1. リポジトリ名は **ASCII の `timing-chart`** にする（非ASCIIはアセットURLが壊れる）。
   別名にする場合は `vite.config.ts` の `base` を `'/<repo>/'` に合わせる。
2. `main` ブランチに push すると `.github/workflows/deploy.yml` が
   ビルド → Pages へ公開（`actions/deploy-pages`）。
3. リポジトリ **Settings → Pages → Source = GitHub Actions** を選択。
4. 公開URL: `https://<user>.github.io/timing-chart/`

## 技術構成

- React + Vite + TypeScript / 状態管理 Zustand
- `src/model` … WaveJSON 型・wave文字列の展開/圧縮（ロスレス）・clock生成・parse(JSON5)/serialize
- `src/render` … WaveDromRenderer（`renderWaveElement` + スキン明示渡し）
- `src/state` … ストア（単一情報源）・GUI変換アクション・セレクタ
- `src/components` … ツールバー / GUIテーブル / バス・注釈パネル / テキスト / プレビュー
- `src/export` … SVG直列化・PNGラスタライズ・ダウンロード
- `src/share` … lz-string によるURL共有
