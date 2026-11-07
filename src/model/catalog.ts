// Turns the list of artwork files into emblems and backgrounds. In the app the list comes from Vite
// (src/catalog.ts), in tests from the file system, so this file only ever sees paths.
//
// src/assets/emblems/<Name>/primary.png      (+ secondary.png), each with a .thumb.png beside it
// src/assets/backgrounds/<Name>/mask.png     (+ mask.thumb.png)

export interface Layer {
  full: string // 512×512 mask, drawn into the preview and the download
  thumb: string // small mask for the picker grids
}
export interface Emblem {
  name: string
  primary: Layer
  secondary?: Layer
}
export interface Background {
  name: string
  mask: Layer
}

type AssetFiles = Record<string, string> // './assets/emblems/Sol/primary.png' → URL

type Kind = 'emblems' | 'backgrounds'
type Folder = Map<string, Partial<Layer>> // layer name → its files
const LAYER_FILE = /^\.\/assets\/(emblems|backgrounds)\/([^/]+)\/(\w+?)(\.thumb)?\.png$/

export function emblemsFrom(files: AssetFiles, order: string[]): Emblem[] {
  const emblems = [...foldersOf(files, 'emblems')].map(([name, folder]) => ({
    name,
    primary: requiredLayer(name, folder, 'primary'),
    secondary: optionalLayer(name, folder, 'secondary'),
  }))
  return orderBy(emblems, order)
}

export function backgroundsFrom(files: AssetFiles): Background[] {
  const backgrounds = [...foldersOf(files, 'backgrounds')].map(([name, folder]) => ({
    name,
    mask: requiredLayer(name, folder, 'mask'),
  }))
  return orderBy(backgrounds, [])
}

// Names listed in `order` come first, in that order; the rest follow alphabetically.
export function orderBy<T extends { name: string }>(items: T[], order: string[]): T[] {
  const rank = (item: T) => (order.includes(item.name) ? order.indexOf(item.name) : order.length)
  return [...items].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

function foldersOf(files: AssetFiles, kind: Kind) {
  const folders = new Map<string, Folder>()
  for (const [path, url] of Object.entries(files)) {
    const match = LAYER_FILE.exec(path)
    if (match?.[1] !== kind) continue
    const [, , name, layer, thumb] = match
    const folder = folders.get(name) ?? new Map<string, Partial<Layer>>()
    folder.set(layer, { ...folder.get(layer), [thumb ? 'thumb' : 'full']: url })
    folders.set(name, folder)
  }
  return folders
}

function optionalLayer(name: string, folder: Folder, layer: string): Layer | undefined {
  const files = folder.get(layer)
  if (!files) return undefined
  if (!files.full || !files.thumb) throw new Error(`${name}: needs both ${layer}.png and ${layer}.thumb.png`)
  return { full: files.full, thumb: files.thumb }
}

function requiredLayer(name: string, folder: Folder, layer: string): Layer {
  const found = optionalLayer(name, folder, layer)
  if (!found) throw new Error(`${name}: missing ${layer}.png`)
  return found
}
