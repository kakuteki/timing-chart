import { create } from 'zustand'
import type { WaveJson } from '../model/wavejson'
import { serializeModel } from '../model/serialize'
import { parseModel } from '../model/parse'
import type { SkinName } from '../render/skins'
import { DEFAULT_MODEL } from './defaultModel'
import { decodeShare } from '../share/url'

/** Pick the initial model from a #d= share hash, falling back to the default. */
function initialModel(): WaveJson {
  const shared = decodeShare()
  return shared ?? DEFAULT_MODEL
}

const startModel = initialModel()

export interface EditorState {
  /** Canonical model — the single source of truth that drives rendering. */
  model: WaveJson
  /** Last model that parsed/validated OK; the renderer always uses this. */
  lastValidModel: WaveJson
  /** Raw text shown in the WaveJSON editor (may be mid-edit / invalid). */
  textBuffer: string
  /** Which surface produced the latest model change. */
  editSource: 'gui' | 'text' | 'load'
  /** Parse error from the text editor, or null when text is valid. */
  parseError: string | null
  /** True while the text editor is focused (it then "owns" its buffer). */
  textFocused: boolean
  skinName: SkinName
  /** Path of the currently selected signal row (for bus/annotation panels). */
  selectedPath: number[] | null

  /** Apply a model produced by the GUI; regenerates the text buffer. */
  applyGuiModel: (model: WaveJson) => void
  /** Update the raw text buffer without parsing (responsive typing). */
  setText: (text: string) => void
  /** Parse the current text buffer and, if valid, promote it to the model. */
  commitText: () => void
  setTextFocused: (focused: boolean) => void
  /** Replace everything from a loaded file / share link. */
  loadModel: (model: WaveJson) => void
  setSkin: (skin: SkinName) => void
  setSelectedPath: (path: number[] | null) => void
}

export const useEditor = create<EditorState>((set, get) => ({
  model: startModel,
  lastValidModel: startModel,
  textBuffer: serializeModel(startModel),
  editSource: 'load',
  parseError: null,
  textFocused: false,
  skinName: (startModel.config?.skin as SkinName) ?? 'default',
  selectedPath: null,

  applyGuiModel: (model) =>
    set({
      model,
      lastValidModel: model,
      textBuffer: serializeModel(model),
      editSource: 'gui',
      parseError: null,
    }),

  setText: (text) => set({ textBuffer: text }),

  commitText: () => {
    const { textBuffer } = get()
    const res = parseModel(textBuffer)
    if (res.ok && res.model) {
      // Promote to model but DO NOT rewrite textBuffer — the user owns it.
      set({
        model: res.model,
        lastValidModel: res.model,
        editSource: 'text',
        parseError: null,
      })
    } else {
      set({ parseError: res.error ?? 'パースに失敗しました' })
    }
  },

  setTextFocused: (focused) => set({ textFocused: focused }),

  loadModel: (model) =>
    set({
      model,
      lastValidModel: model,
      textBuffer: serializeModel(model),
      editSource: 'load',
      parseError: null,
      skinName: (model.config?.skin as SkinName) ?? get().skinName,
    }),

  setSkin: (skin) => set({ skinName: skin }),

  setSelectedPath: (path) => set({ selectedPath: path }),
}))
