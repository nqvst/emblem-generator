import { IMAGE_KEYWORD } from '../model/permalink.ts'
import { readText } from '../model/png-text.ts'
import { el } from '../dom.ts'
import { track } from '../analytics.ts'

const STATUS_DURATION_MS = 5000

interface OpenElements {
  button: HTMLButtonElement // opens a file picker (phones can't drag and drop)
  status: HTMLElement // says what happened
}

// Reopens a PNG saved from this page: picked with the button or dropped anywhere on the page.
export function mountOpenEmblem({ button, status }: OpenElements, apply: (query: string) => void) {
  const open = (file: File) => {
    track('open-image')
    designIn(file)
      .then((query) => {
        if (query) apply(query)
        say(status, query ? `Opened ${file.name}` : `${file.name} has no emblem settings. Only PNGs saved from this page do.`)
      })
      .catch((error: unknown) => {
        console.error(error)
        say(status, `Couldn't read ${file.name}. Is it a PNG?`)
      })
  }
  mountFilePicker(button, open)
  mountDropZone(open)
}

async function designIn(file: File) {
  return readText(new Uint8Array(await file.arrayBuffer())).get(IMAGE_KEYWORD)
}

function mountFilePicker(button: HTMLButtonElement, open: (file: File) => void) {
  const input = el('input', { type: 'file', accept: 'image/png', hidden: true })
  button.after(input)
  button.addEventListener('click', () => input.click())
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (file) open(file)
    input.value = '' // so picking the same file again still fires
  })
}

// While a file is dragged over the window, body.dropping shows a full-page hint (styles.css).
function mountDropZone(open: (file: File) => void) {
  const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false
  const setDropping = (dropping: boolean) => document.body.classList.toggle('dropping', dropping)
  addEventListener('dragover', (event) => {
    if (!carriesFiles(event)) return
    event.preventDefault() // allows the drop
    setDropping(true)
  })
  addEventListener('dragleave', (event) => {
    if (!event.relatedTarget) setDropping(false) // left the window, not just a child element
  })
  addEventListener('drop', (event) => {
    if (!carriesFiles(event)) return
    event.preventDefault() // otherwise the browser navigates to the file
    setDropping(false)
    const file = event.dataTransfer?.files[0]
    if (file) open(file)
  })
}

let clearStatus: ReturnType<typeof setTimeout> | undefined
function say(status: HTMLElement, message: string) {
  status.textContent = message
  clearTimeout(clearStatus)
  clearStatus = setTimeout(() => {
    status.textContent = ''
  }, STATUS_DURATION_MS)
}
