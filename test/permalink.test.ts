import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import test from 'node:test'
import { slug } from '../src/model/design.ts'
import { fromQuery, toQuery } from '../src/model/permalink.ts'

const folders = (kind: string) => readdirSync(new URL(`../src/assets/${kind}/`, import.meta.url))
const names = { emblems: folders('emblems'), backgrounds: folders('backgrounds') }
const fallback = {
  emblem: 'Seventh Column',
  background: 'Circle',
  colors: { primary: '#9c3433', secondary: '#dedede', background: '#656565' },
  showSecondary: true,
}
const design = {
  emblem: 'Fleur de Lis',
  background: "Ball O'Fire",
  colors: { primary: '#1e3d2b', secondary: '#6a994e', background: '#f2e8cf' },
  showSecondary: false,
}

await test('a design survives the trip through the URL', () => {
  const query = toQuery(design)
  assert.equal(query, 'emblem=fleur-de-lis&background=ball-o-fire&colors=1e3d2b-6a994e-f2e8cf&secondary=off')
  assert.deepEqual(fromQuery(`?${query}`, names, fallback), design)
})

await test('broken or missing parts fall back without spoiling the rest', () => {
  assert.deepEqual(fromQuery('', names, fallback), fallback)
  assert.deepEqual(fromQuery('?emblem=nope&background=circle&colors=12345-zzzzzz-000000', names, fallback), fallback)
  assert.deepEqual(fromQuery('?emblem=sol&colors=AABBCC-000000-FFFFFF', names, fallback), {
    ...fallback,
    emblem: 'Sol',
    colors: { primary: '#aabbcc', secondary: '#000000', background: '#ffffff' },
  })
})

await test('every emblem and background has its own URL name', () => {
  for (const list of [names.emblems, names.backgrounds]) {
    const slugs = list.map(slug)
    assert.deepEqual(slugs.filter((name, i) => slugs.indexOf(name) !== i), [], 'two names share a URL name')
  }
})
