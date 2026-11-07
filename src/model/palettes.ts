// Colour palettes, grouped into categories (src/data/palettes.json).

export type Swatch = [name: string, hex: string] // hex is lowercase #rrggbb; unnamed colours use the hex as name
export interface Palette {
  name: string
  source: string
  colors: Swatch[]
}
export interface Category {
  category: string
  palettes: Palette[]
}
export interface ListedPalette extends Palette {
  category: string
}

export const HEX = /^#[0-9a-f]{6}$/

export function listPalettes(categories: Category[]): ListedPalette[] {
  return categories.flatMap(({ category, palettes }) => palettes.map((palette) => ({ ...palette, category })))
}

// A colour's name: from the palette on screen if it's there, else from any palette, else its hex.
export function colorName(hex: string, onScreen: Palette, all: Palette[]): string {
  const lookup = (palette: Palette) => palette.colors.find(([, value]) => value === hex)
  const found = lookup(onScreen) ?? all.map(lookup).find(Boolean)
  return found && found[0] !== hex ? found[0] : hex.toUpperCase()
}
