import type { AppState } from '../model/design.ts'
import type { Category, ListedPalette, Swatch } from '../model/palettes.ts'
import type { Store } from '../model/store.ts'
import { byName } from '../model/design.ts'
import { el, setPressed } from '../dom.ts'

interface BrowserElements {
  tabs: HTMLElement // one tab per category
  list: HTMLElement // the palettes of the category on screen
  meta: HTMLElement // name, size and source of the palette on screen
}

export function mountPaletteBrowser(
  elements: BrowserElements,
  store: Store<AppState>,
  categories: Category[],
  palettes: ListedPalette[],
) {
  mountTabs(elements.tabs, store, categories)
  mountList(elements.list, store, palettes)
  mountMeta(elements.meta, store, palettes)
}

function mountTabs(container: HTMLElement, store: Store<AppState>, categories: Category[]) {
  const tabs = categories.map(({ category }) => {
    const tab = el('button', { type: 'button', className: 'tab', textContent: category })
    tab.addEventListener('click', () => store.set({ category }))
    return tab
  })
  container.replaceChildren(...tabs)
  store.subscribe((state) => tabs.forEach((tab, i) => setPressed(tab, categories[i].category === state.category)))
}

function mountList(container: HTMLElement, store: Store<AppState>, palettes: ListedPalette[]) {
  const buttons = palettes.map((palette) => {
    const strip = el('div', { className: 'strip' })
    strip.style.background = stripGradient(palette.colors)
    const label = `${palette.name} · ${palette.colors.length}`
    const button = el('button', { type: 'button', className: 'palette', title: palette.source }, [label, strip])
    button.addEventListener('click', () => store.set({ palette: palette.name }))
    return button
  })
  container.replaceChildren(...buttons)
  store.subscribe((state) => {
    buttons.forEach((button, i) => {
      button.hidden = palettes[i].category !== state.category
      setPressed(button, palettes[i].name === state.palette)
    })
  })
}

function mountMeta(container: HTMLElement, store: Store<AppState>, palettes: ListedPalette[]) {
  store.subscribe((state) => {
    const palette = byName(palettes, state.palette)
    const title = el('span', {}, [el('b', { textContent: palette.name }), ` · ${palette.colors.length} colours`])
    container.replaceChildren(title, el('span', { textContent: palette.source }))
  })
}

// Hard-edged bands, one per colour.
function stripGradient(colors: Swatch[]) {
  const width = 100 / colors.length
  const bands = colors.map(([, hex], i) => `${hex} ${i * width}% ${(i + 1) * width}%`)
  return `linear-gradient(90deg, ${bands.join(', ')})`
}
