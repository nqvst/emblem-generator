import './styles.css'
import type { AppState } from './model/design.ts'
import { backgrounds, categories, emblems, palettes } from './catalog.ts'
import { byName, drawLayers, randomDesign } from './model/design.ts'
import { colorName } from './model/palettes.ts'
import { createStore } from './model/store.ts'
import { byId } from './dom.ts'
import { backgroundTiles, emblemTiles, mountThumbnailColors, mountTiles } from './ui/tiles.ts'
import { mountSlots, mountSwatches } from './ui/colors.ts'
import { mountPaletteBrowser } from './ui/palette-browser.ts'
import { mountPreview } from './ui/preview.ts'
import { mountRandomize, mountSave, mountSecondaryToggle } from './ui/actions.ts'
import { fromQuery } from './model/permalink.ts'
import { mountCopyLink, mountUrlSync } from './ui/permalink.ts'
import { mountOpenEmblem } from './ui/open-emblem.ts'

const defaults: AppState = {
  emblem: emblems[0].name,
  background: byName(backgrounds, 'Circle').name,
  colors: { primary: '#9c3433', secondary: '#dedede', background: '#656565' }, // Halo 3 Red, White, Steel
  showSecondary: true,
  palette: palettes[0].name,
  category: palettes[0].category,
  slot: 'primary',
}
const names = { emblems: emblems.map(({ name }) => name), backgrounds: backgrounds.map(({ name }) => name) }
const store = createStore<AppState>({ ...defaults, ...fromQuery(location.search, names, defaults) }) // shared links

const layersOf = (state: AppState) =>
  drawLayers(state, byName(emblems, state.emblem), byName(backgrounds, state.background))
const nameOf = (hex: string, state: AppState) => colorName(hex, byName(palettes, state.palette), palettes)
const randomize = () => randomDesign({
  ...names,
  colors: byName(palettes, store.get().palette).colors.map(([, hex]) => hex),
}, Math.random)

mountThumbnailColors(store)
mountTiles(byId('emblems'), store, {
  tiles: emblemTiles(emblems),
  selected: (state) => state.emblem,
  pick: (emblem) => store.set({ emblem }),
})
mountTiles(byId('backgrounds'), store, {
  tiles: backgroundTiles(backgrounds),
  selected: (state) => state.background,
  pick: (background) => store.set({ background }),
})
mountSlots(byId('slots'), store, nameOf)
mountPaletteBrowser({ tabs: byId('categories'), list: byId('palettes'), meta: byId('palette-meta') }, store, categories, palettes)
mountSwatches(byId('swatches'), store, palettes)
mountPreview(store, { canvas: byId<HTMLCanvasElement>('preview'), caption: byId('caption') }, layersOf)
mountSecondaryToggle(byId<HTMLInputElement>('show-secondary'), store)
mountRandomize(byId<HTMLButtonElement>('randomize'), store, randomize)
mountSave(byId<HTMLButtonElement>('save'), store, layersOf)
mountCopyLink(byId<HTMLButtonElement>('copy-link'), store)
mountUrlSync(store)
mountOpenEmblem({ button: byId<HTMLButtonElement>('open'), status: byId('status') }, (query) =>
  store.set(fromQuery(query, names, store.get())))
