// An emblem as URL query parameters, so a design can be bookmarked and shared.
// Saved PNGs carry the same query in a text chunk named IMAGE_KEYWORD, so they can be opened again.
//   ?emblem=sol&background=circle&colors=1e3d2b-6a994e-f2e8cf          (primary-secondary-background)
//   &secondary=off                                                      only when the secondary layer is hidden
import type { AppState, Colors } from './design.ts'
import { COLOR_SLOTS, slug } from './design.ts'
import { HEX } from './palettes.ts'

export const IMAGE_KEYWORD = 'halo3-emblem'

type Design = Pick<AppState, 'emblem' | 'background' | 'colors' | 'showSecondary'>
interface Names {
  emblems: string[]
  backgrounds: string[]
}

export function toQuery(design: Design) {
  const params = new URLSearchParams({
    emblem: slug(design.emblem),
    background: slug(design.background),
    colors: COLOR_SLOTS.map((slot) => design.colors[slot].slice(1)).join('-'),
  })
  if (!design.showSecondary) params.set('secondary', 'off')
  return params.toString()
}

// Takes whatever part of the query is valid; anything missing or unknown keeps its value from `fallback`.
export function fromQuery(query: string, names: Names, fallback: Design): Design {
  const params = new URLSearchParams(query)
  const named = (list: string[], key: string) => list.find((name) => slug(name) === params.get(key))
  return {
    emblem: named(names.emblems, 'emblem') ?? fallback.emblem,
    background: named(names.backgrounds, 'background') ?? fallback.background,
    colors: colorsFrom(params.get('colors')) ?? fallback.colors,
    showSecondary: params.has('secondary') ? params.get('secondary') !== 'off' : fallback.showSecondary,
  }
}

function colorsFrom(value: string | null): Colors | undefined {
  const hexes = (value ?? '').toLowerCase().split('-').map((hex) => `#${hex}`)
  if (hexes.length !== COLOR_SLOTS.length || !hexes.every((hex) => HEX.test(hex))) return undefined
  const [primary, secondary, background] = hexes
  return { primary, secondary, background }
}
