import type { AppState, DrawLayer } from '../model/design.ts'
import type { Store } from '../model/store.ts'
import { fileName } from '../model/design.ts'
import { el } from '../dom.ts'
import { renderEmblem } from '../render.ts'
import { track } from '../analytics.ts'

const EXPORT_SIZE = 512
const REVOKE_DELAY_MS = 1000 // the download has started by then

export function mountSecondaryToggle(checkbox: HTMLInputElement, store: Store<AppState>) {
  checkbox.addEventListener('change', () => store.set({ showSecondary: checkbox.checked }))
  store.subscribe((state) => {
    checkbox.checked = state.showSecondary
  })
}

export function mountRandomize(button: HTMLButtonElement, store: Store<AppState>, randomize: () => Partial<AppState>) {
  button.addEventListener('click', () => {
    store.set(randomize())
    track('randomize')
  })
}

type LayersOf = (state: AppState) => DrawLayer[]

export function mountSave(button: HTMLButtonElement, store: Store<AppState>, layersOf: LayersOf) {
  button.addEventListener('click', () => {
    const state = store.get()
    track('download', { emblem: state.emblem, background: state.background, palette: state.palette })
    download(state, layersOf(state)).catch((error: unknown) => {
      console.error(error)
      alert("Sorry, the emblem couldn't be saved. Please try again.")
    })
  })
}

async function download(state: AppState, layers: DrawLayer[]) {
  const canvas = await renderEmblem(layers, EXPORT_SIZE)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  if (!blob) throw new Error('Canvas could not be encoded as PNG')
  const link = el('a', { href: URL.createObjectURL(blob), download: fileName(state) })
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), REVOKE_DELAY_MS)
}
