import type { Background, Emblem } from './catalog.ts'

export type ColorSlot = 'primary' | 'secondary' | 'background'
export const COLOR_SLOTS: ColorSlot[] = ['primary', 'secondary', 'background']
export type Colors = Record<ColorSlot, string>

export interface AppState {
  emblem: string // emblem name
  background: string // background shape name
  colors: Colors // lowercase #rrggbb per layer
  showSecondary: boolean // Halo 3's "toggle secondary"
  palette: string // palette whose swatches are on screen
  category: string // palette category tab on screen
  slot: ColorSlot // which layer a swatch click recolours
}

export interface DrawLayer {
  src: string // URL of a white-on-alpha mask
  color: string
}

export function byName<T extends { name: string }>(items: T[], name: string): T {
  return items.find((item) => item.name === name) ?? items[0]
}

// Back to front: background shape, secondary, primary.
export function drawLayers(state: AppState, emblem: Emblem, background: Background): DrawLayer[] {
  const layers = [{ src: background.mask.full, color: state.colors.background }]
  if (state.showSecondary && emblem.secondary) {
    layers.push({ src: emblem.secondary.full, color: state.colors.secondary })
  }
  layers.push({ src: emblem.primary.full, color: state.colors.primary })
  return layers
}

// URL- and file-safe form of a name: "Ball O'Fire" → "ball-o-fire".
export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function fileName(state: AppState) {
  return `emblem-${slug(state.emblem)}-${slug(state.background)}.png`
}

// `count` different values in random order; repeats only when there aren't enough distinct ones.
export function pickDistinct<T>(values: T[], count: number, random: () => number): T[] {
  const shuffled = [...new Set(values)]
    .map((value) => ({ value, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ value }) => value)
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length])
}

export interface Choices {
  emblems: string[]
  backgrounds: string[]
  colors: string[] // the palette on screen
}

// A random emblem and background, coloured with three different colours from the palette when it has them.
export function randomDesign(choices: Choices, random: () => number): Partial<AppState> {
  const pick = (names: string[]) => names[Math.floor(random() * names.length)]
  const [primary, secondary, background] = pickDistinct(choices.colors, 3, random)
  return {
    emblem: pick(choices.emblems),
    background: pick(choices.backgrounds),
    colors: { primary, secondary, background },
  }
}
