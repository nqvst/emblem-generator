import type { Background, Emblem } from '../model/catalog.ts'
import type { AppState } from '../model/design.ts'
import type { Store } from '../model/store.ts'
import { COLOR_SLOTS } from '../model/design.ts'
import { el, maskLayer, setPressed } from '../dom.ts'

interface TileSpec {
  name: string
  layers: { url: string; className: string }[] // back to front; className picks the colour (styles.css .layer)
}
interface TilePicker {
  tiles: TileSpec[]
  selected: (state: AppState) => string
  pick: (name: string) => void
}

export function mountTiles(container: HTMLElement, store: Store<AppState>, picker: TilePicker) {
  const buttons = picker.tiles.map((tile) => {
    const layers = tile.layers.map(({ url, className }) => maskLayer(url, className))
    const button = el('button', { type: 'button', className: 'tile', title: tile.name }, layers)
    button.setAttribute('aria-label', tile.name)
    button.addEventListener('click', () => picker.pick(tile.name))
    return button
  })
  container.replaceChildren(...buttons)
  store.subscribe((state) => {
    const current = picker.selected(state)
    buttons.forEach((button, i) => setPressed(button, picker.tiles[i].name === current))
  })
}

export function emblemTiles(emblems: Emblem[]): TileSpec[] {
  return emblems.map(({ name, primary, secondary }) => ({
    name,
    layers: [
      ...(secondary ? [{ url: secondary.thumb, className: 'secondary' }] : []),
      { url: primary.thumb, className: 'primary' },
    ],
  }))
}

export function backgroundTiles(backgrounds: Background[]): TileSpec[] {
  return backgrounds.map(({ name, mask }) => ({ name, layers: [{ url: mask.thumb, className: 'background' }] }))
}

// Thumbnails take the chosen colours from CSS variables, so recolouring never touches the tiles themselves.
export function mountThumbnailColors(store: Store<AppState>) {
  store.subscribe((state) => {
    for (const slot of COLOR_SLOTS) document.documentElement.style.setProperty(`--${slot}`, state.colors[slot])
    document.body.classList.toggle('hide-secondary', !state.showSecondary)
  })
}
