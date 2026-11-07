import type { AppState, DrawLayer } from '../model/design.ts'
import type { Store } from '../model/store.ts'
import { canvasContext, renderEmblem } from '../render.ts'

interface PreviewElements {
  canvas: HTMLCanvasElement
  caption: HTMLElement
}

// Redraws only when the picture would change. Each draw happens off-screen and is swapped in when done,
// so a slow draw never overwrites a newer one and the canvas never shows half an emblem.
type LayersOf = (state: AppState) => DrawLayer[]

export function mountPreview(store: Store<AppState>, { canvas, caption }: PreviewElements, layersOf: LayersOf) {
  let drawn = ''
  let latest = 0
  const redraw = () => {
    const state = store.get()
    const size = Math.round(canvas.clientWidth * devicePixelRatio)
    const layers = layersOf(state)
    const key = JSON.stringify([size, layers])
    if (key === drawn) return
    drawn = key
    const ticket = ++latest
    caption.textContent = `${state.emblem} · ${state.background}`
    renderEmblem(layers, size)
      .then((image) => ticket === latest && show(canvas, image))
      .catch((error: unknown) => {
        drawn = ''
        caption.textContent = "Couldn't load the artwork. Check your connection and pick again."
        console.error(error)
      })
  }
  store.subscribe(redraw)
  addEventListener('resize', redraw)
}

function show(canvas: HTMLCanvasElement, image: HTMLCanvasElement) {
  if (canvas.width !== image.width) Object.assign(canvas, { width: image.width, height: image.height })
  const ctx = canvasContext(canvas)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0)
}
