// Text metadata in PNG files: tEXt chunks, "keyword\0text" in Latin-1 (https://www.w3.org/TR/png-3/#11tEXt).
// Image viewers ignore chunks they don't know, so adding text never changes how the image looks.

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const CHUNK_OVERHEAD = 12 // length (4) + type (4) + CRC (4)

interface Chunk {
  type: string
  data: Uint8Array
  end: number // offset just past this chunk
}

export function readText(png: Uint8Array): Map<string, string> {
  const texts = new Map<string, string>()
  for (const { type, data } of chunks(png)) {
    const split = data.indexOf(0)
    if (type === 'tEXt' && split > 0) texts.set(latin1(data.subarray(0, split)), latin1(data.subarray(split + 1)))
  }
  return texts
}

// A copy of the PNG with the text added right after the header chunk, where readers look first.
export function withText(png: Uint8Array, entries: Record<string, string>): Uint8Array<ArrayBuffer> {
  const header = chunks(png).next()
  if (header.done || header.value.type !== 'IHDR') throw new Error('PNG has no header chunk')
  const added = Object.entries(entries).map(([keyword, text]) => textChunk(keyword, text))
  const parts = [png.subarray(0, header.value.end), ...added, png.subarray(header.value.end)]
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  parts.reduce((offset, part) => {
    out.set(part, offset)
    return offset + part.length
  }, 0)
  return out
}

function* chunks(png: Uint8Array): Generator<Chunk> {
  if (!SIGNATURE.every((byte, i) => png[i] === byte)) throw new Error('Not a PNG file')
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  let offset = SIGNATURE.length
  while (offset + CHUNK_OVERHEAD <= png.length) {
    const length = view.getUint32(offset)
    const end = offset + CHUNK_OVERHEAD + length
    if (end > png.length) throw new Error('PNG file is cut off')
    yield { type: latin1(png.subarray(offset + 4, offset + 8)), data: png.subarray(offset + 8, end - 4), end }
    offset = end
  }
}

function textChunk(keyword: string, text: string) {
  const data = latin1Bytes(`${keyword}\0${text}`)
  const chunk = new Uint8Array(CHUNK_OVERHEAD + data.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.length)
  chunk.set(latin1Bytes('tEXt'), 4)
  chunk.set(data, 8)
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))
  return chunk
}

const latin1 = (bytes: Uint8Array) => String.fromCharCode(...bytes)

function latin1Bytes(text: string) {
  return Uint8Array.from(text, (char) => {
    const code = char.charCodeAt(0)
    if (code > 255) throw new Error(`PNG text must be Latin-1, got "${char}"`)
    return code
  })
}

// CRC-32 as used by PNG (and zip): reflected polynomial 0xEDB88320.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let crc = n
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  return crc >>> 0
})

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
