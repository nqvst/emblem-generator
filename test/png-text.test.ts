import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { readText, withText } from '../src/model/png-text.ts'

const png = new Uint8Array(readFileSync(new URL('../src/assets/emblems/Sol/primary.thumb.png', import.meta.url)))

await test('text written into a PNG reads back', () => {
  const tagged = withText(png, { 'halo3-emblem': 'emblem=sol&colors=1e3d2b-6a994e-f2e8cf', Software: 'Test' })
  assert.equal(readText(tagged).get('halo3-emblem'), 'emblem=sol&colors=1e3d2b-6a994e-f2e8cf')
  assert.equal(readText(tagged).get('Software'), 'Test')
  assert.deepEqual(tagged.subarray(tagged.length - 12), png.subarray(png.length - 12), 'IEND still ends the file')
})

await test('the added chunk carries a valid CRC', () => {
  // Expected value from Python: zlib.crc32(b'tEXta\x00b') == 0xdc49a23b
  const tagged = withText(png, { a: 'b' })
  const textStart = 8 + 25 // signature + IHDR chunk
  const crcOffset = textStart + 8 + 'a\0b'.length // past length + type + data
  assert.equal(new DataView(tagged.buffer).getUint32(crcOffset), 0xdc49a23b)
})

await test('a PNG without text has none, and other files are rejected', () => {
  assert.equal(readText(png).size, 0)
  assert.throws(() => readText(new TextEncoder().encode('GIF89a not a png')), /Not a PNG/)
})
