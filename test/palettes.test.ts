import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { Category } from '../src/model/palettes.ts'
import { HEX, colorName, listPalettes } from '../src/model/palettes.ts'

const categories = JSON.parse(readFileSync(new URL('../src/data/palettes.json', import.meta.url), 'utf8')) as Category[]
const palettes = listPalettes(categories)

await test('palettes are well formed', () => {
  assert.ok(categories.every((category) => category.palettes.length > 0), 'every category has palettes')
  for (const palette of palettes) {
    assert.ok(palette.source, `${palette.name} needs a source`)
    assert.ok(palette.colors.length >= 2, `${palette.name} needs at least two colours`)
    for (const [name, hex] of palette.colors) assert.match(hex, HEX, `${palette.name} / ${name}: "${hex}" isn't lowercase #rrggbb`)
  }
})

await test('palette names are unique (the app finds palettes by name)', () => {
  const names = palettes.map((palette) => palette.name)
  assert.deepEqual(names.filter((name, i) => names.indexOf(name) !== i), [])
})

await test('colorName prefers the palette on screen, then any palette, then the hex', () => {
  const onScreen = { name: 'A', source: '-', colors: [['Ruby', '#aa0000']] as [string, string][] }
  const other = { name: 'B', source: '-', colors: [['Crimson', '#aa0000'], ['Sky', '#00aaff']] as [string, string][] }
  assert.equal(colorName('#aa0000', onScreen, [other, onScreen]), 'Ruby')
  assert.equal(colorName('#00aaff', onScreen, [other, onScreen]), 'Sky')
  assert.equal(colorName('#123456', onScreen, [other, onScreen]), '#123456')
})
