import type { DrawLayer } from './model/design.ts'

// Masks are decoded once and kept; a failed load is dropped so the next draw retries it.
const images = new Map<string, Promise<HTMLImageElement>>()
const scratch = document.createElement('canvas')

function loadImage(src: string) {
  let loading = images.get(src)
  if (!loading) {
    const img = new Image()
    img.src = src
    loading = img.decode().then(() => img)
    loading.catch(() => images.delete(src))
    images.set(src, loading)
  }
  return loading
}

// Draws the layers, each mask filled with its colour, onto a new size×size canvas.
export async function renderEmblem(layers: DrawLayer[], size: number) {
  const masks = await Promise.all(layers.map((layer) => loadImage(layer.src)))
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size })
  const ctx = canvasContext(canvas)
  layers.forEach((layer, i) => drawTinted(ctx, masks[i], layer.color))
  return canvas
}

function drawTinted(target: CanvasRenderingContext2D, mask: HTMLImageElement, color: string) {
  const { width, height } = target.canvas
  Object.assign(scratch, { width, height }) // resizing also clears it
  const ctx = canvasContext(scratch)
  ctx.drawImage(mask, 0, 0, width, height)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  target.drawImage(scratch, 0, 0)
}

export function canvasContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available in this browser')
  return ctx
}
