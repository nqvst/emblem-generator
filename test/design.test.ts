import assert from 'node:assert/strict'
import test from 'node:test'
import type { AppState } from '../src/model/design.ts'
import { drawLayers, fileName, pickDistinct, randomDesign } from '../src/model/design.ts'
import { createStore } from '../src/model/store.ts'

const layer = (name: string) => ({ full: `${name}.png`, thumb: `${name}.thumb.png` })
const emblem = { name: 'Sol', primary: layer('pri'), secondary: layer('sec') }
const background = { name: 'Circle', mask: layer('mask') }
const state: AppState = {
  emblem: 'Sol',
  background: 'Circle',
  colors: { primary: '#111111', secondary: '#222222', background: '#333333' },
  showSecondary: true,
  palette: 'Halo 3',
  category: 'Games & Retro',
  slot: 'primary',
}
// Deterministic stand-in for Math.random (Park–Miller).
let seed = 1
const random = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

await test('layers draw back to front, and the secondary toggle drops the secondary layer', () => {
  assert.deepEqual(drawLayers(state, emblem, background), [
    { src: 'mask.png', color: '#333333' },
    { src: 'sec.png', color: '#222222' },
    { src: 'pri.png', color: '#111111' },
  ])
  assert.deepEqual(drawLayers({ ...state, showSecondary: false }, emblem, background).map(({ src }) => src), ['mask.png', 'pri.png'])
})

await test('download file names are URL and file-system safe', () => {
  assert.equal(fileName({ ...state, emblem: 'Fleur de Lis', background: "Ball O'Fire" }), 'emblem-fleur-de-lis-ball-o-fire.png')
})

await test('pickDistinct avoids repeats unless there are too few values', () => {
  assert.equal(new Set(pickDistinct(['a', 'b', 'c', 'd'], 3, random)).size, 3)
  assert.deepEqual(pickDistinct(['a', 'a'], 3, random), ['a', 'a', 'a'])
})

await test('randomDesign uses three different colours from the palette', () => {
  const choices = { emblems: ['Sol'], backgrounds: ['Circle'], colors: ['#000001', '#000002', '#000003', '#000004'] }
  const { colors } = randomDesign(choices, random)
  assert.ok(colors)
  assert.equal(new Set(Object.values(colors)).size, 3)
})

await test('the store hands every change to its subscribers', () => {
  const store = createStore({ count: 0 })
  const seen: number[] = []
  store.subscribe(({ count }) => seen.push(count))
  store.set({ count: 1 })
  assert.deepEqual(seen, [0, 1])
})
