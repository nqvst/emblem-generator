import type { AppState } from '../model/design.ts'
import type { Store } from '../model/store.ts'
import { toQuery } from '../model/permalink.ts'
import { track } from '../analytics.ts'

const COPIED_FLASH_MS = 2000

// Keeps the address bar in step with the design. replaceState, so editing doesn't fill the back button's history.
// The URL is left alone until the design differs from the one the page was opened with.
export function mountUrlSync(store: Store<AppState>) {
  let shown = toQuery(store.get())
  store.subscribe((state) => {
    const query = toQuery(state)
    if (query === shown) return
    shown = query
    history.replaceState(history.state, '', `?${query}`)
  })
}

export function mountCopyLink(button: HTMLButtonElement, store: Store<AppState>) {
  const label = button.textContent
  button.addEventListener('click', () => {
    const url = new URL(location.href)
    url.search = toQuery(store.get())
    url.hash = ''
    track('copy-link')
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        button.textContent = 'Link copied'
        setTimeout(() => {
          button.textContent = label
        }, COPIED_FLASH_MS)
      })
      .catch(() => prompt('Copy this link:', url.toString())) // clipboard blocked: let them copy it by hand
  })
}
