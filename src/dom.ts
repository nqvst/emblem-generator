export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error(`#${id} is missing from index.html`)
  return found as T
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children)
  return node
}

// Toggle buttons say whether they're the current choice; the CSS styles [aria-pressed="true"].
export function setPressed(button: HTMLElement, pressed: boolean) {
  button.setAttribute('aria-pressed', String(pressed))
}

// A layer of a thumbnail: the mask image cut out of a block of colour (see .layer in styles.css).
export function maskLayer(url: string, className: string) {
  const layer = el('div', { className: `layer ${className}` })
  layer.style.setProperty('--mask', `url("${url}")`)
  return layer
}
