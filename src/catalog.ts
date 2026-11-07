// Everything the app can offer, read from src/assets/ and src/data/ at build time.
import type { Category } from './model/palettes.ts'
import { backgroundsFrom, emblemsFrom } from './model/catalog.ts'
import { listPalettes } from './model/palettes.ts'
import emblemOrder from './data/emblem-order.json'
import paletteData from './data/palettes.json'

const files = import.meta.glob<string>('./assets/**/*.png', { eager: true, query: '?url', import: 'default' })

export const emblems = emblemsFrom(files, emblemOrder)
export const backgrounds = backgroundsFrom(files)
export const categories = paletteData as Category[]
export const palettes = listPalettes(categories)
