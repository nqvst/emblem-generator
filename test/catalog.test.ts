import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { backgroundsFrom, emblemsFrom, orderBy } from '../src/model/catalog.ts'

const src = new URL('../src/', import.meta.url)
const paths = readdirSync(new URL('assets/', src), { recursive: true, encoding: 'utf8' }).filter((path) => path.endsWith('.png'))
const files = Object.fromEntries(paths.map((path) => [`./assets/${path}`, path]))
const order = JSON.parse(readFileSync(new URL('data/emblem-order.json', src), 'utf8')) as string[]

// PNG stores width and height in the IHDR chunk, right after the 8-byte signature and chunk header.
const pngSize = (path: string) => {
  const bytes = readFileSync(new URL(`assets/${path}`, src))
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

await test('every emblem and background has its masks and thumbnails', () => {
  // emblemsFrom / backgroundsFrom throw on a folder with a missing file.
  const emblems = emblemsFrom(files, order)
  const backgrounds = backgroundsFrom(files)
  const layers = emblems.flatMap((emblem) => [emblem.primary, emblem.secondary ?? []].flat())
    .concat(backgrounds.map((background) => background.mask))
  assert.equal(layers.length * 2, paths.length, 'every PNG in src/assets/ should belong to a layer')
  assert.ok(backgrounds.some((background) => background.name === 'Circle'), 'main.ts starts on the Circle background')
})

await test('full masks are the export size, thumbnails are small', () => {
  for (const path of paths) {
    const [width, height] = pngSize(path)
    assert.equal(width, height, `${path} should be square`)
    assert.equal(width, path.endsWith('.thumb.png') ? 112 : 512, `${path} has the wrong size`)
  }
})

await test('the emblem order names real emblems, once each', () => {
  const names = new Set(emblemsFrom(files, order).map((emblem) => emblem.name))
  assert.equal(new Set(order).size, order.length, 'emblem-order.json has duplicates')
  for (const name of order) assert.ok(names.has(name), `emblem-order.json lists "${name}", which has no folder`)
})

await test('orderBy puts listed names first, the rest alphabetically', () => {
  const items = ['d', 'b', 'a', 'c'].map((name) => ({ name }))
  assert.deepEqual(orderBy(items, ['c', 'a']).map(({ name }) => name), ['c', 'a', 'b', 'd'])
})
