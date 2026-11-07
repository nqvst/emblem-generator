import type { AppState, ColorSlot } from '../model/design.ts'
import type { ListedPalette, Swatch } from '../model/palettes.ts'
import type { Store } from '../model/store.ts'
import { COLOR_SLOTS, byName } from '../model/design.ts'
import { el, setPressed } from '../dom.ts'

const SLOT_LABELS: Record<ColorSlot, string> = { primary: 'Primary', secondary: 'Secondary', background: 'Background' }

// Primary / Secondary / Background: shows each layer's colour and picks which one the swatches change.
type NameOf = (hex: string, state: AppState) => string

export function mountSlots(container: HTMLElement, store: Store<AppState>, nameOf: NameOf) {
  const slots = COLOR_SLOTS.map((slot) => {
    const chip = el('div', { className: 'chip' })
    const name = el('small')
    const button = el('button', { type: 'button', className: 'slot' }, [chip, el('span', {}, [SLOT_LABELS[slot], name])])
    button.addEventListener('click', () => store.set({ slot }))
    return { slot, button, chip, name }
  })
  container.replaceChildren(...slots.map(({ button }) => button))
  store.subscribe((state) => {
    for (const { slot, button, chip, name } of slots) {
      setPressed(button, state.slot === slot)
      chip.style.background = state.colors[slot]
      name.textContent = nameOf(state.colors[slot], state)
    }
  })
}

// The colours of the palette on screen, plus a free colour picker at the end.
export function mountSwatches(container: HTMLElement, store: Store<AppState>, palettes: ListedPalette[]) {
  const custom = customSwatch(store)
  let shown: string | undefined
  store.subscribe((state) => {
    if (state.palette !== shown) {
      shown = state.palette
      const swatches = byName(palettes, shown).colors.map((swatch) => swatchButton(store, swatch))
      container.replaceChildren(...swatches, custom.label)
    }
    const current = state.colors[state.slot]
    for (const button of container.querySelectorAll<HTMLElement>('[data-hex]')) setPressed(button, button.dataset.hex === current)
    custom.input.value = current
  })
}

function swatchButton(store: Store<AppState>, [name, hex]: Swatch) {
  const label = name === hex ? hex.toUpperCase() : `${name} ${hex.toUpperCase()}`
  const button = el('button', { type: 'button', className: 'swatch', title: label })
  button.setAttribute('aria-label', label)
  button.style.background = hex
  button.dataset.hex = hex
  button.addEventListener('click', () => setSlotColor(store, hex))
  return button
}

function customSwatch(store: Store<AppState>) {
  const input = el('input', { type: 'color' })
  input.setAttribute('aria-label', 'Custom colour')
  input.addEventListener('input', () => setSlotColor(store, input.value))
  const label = el('label', { className: 'swatch custom', title: 'Custom colour' }, ['+', input])
  return { label, input }
}

function setSlotColor(store: Store<AppState>, hex: string) {
  const { colors, slot } = store.get()
  store.set({ colors: { ...colors, [slot]: hex } })
}
