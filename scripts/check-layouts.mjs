// Checks every dining-room floor plan in src/game/data/map.js against the
// rules the game relies on. Run: npm run check:layouts
import { readFileSync } from 'fs'

const src = readFileSync(new URL('../src/game/data/map.js', import.meta.url), 'utf8')
const { LAYOUTS, KITCHEN_MAX_COL, EXIT_AISLE_COL } = await import('data:text/javascript,' + encodeURIComponent(src))

const FLOOR = new Set(['.', '1', '2', 'Q'])
const base = LAYOUTS.CLASSIC
let failed = false
let bad = false
const fail = (id, msg) => { failed = bad = true; console.log(`  ✗ ${id}: ${msg}`) }

for (const [id, map] of Object.entries(LAYOUTS)) {
  bad = false
  const at = (x, y) => (map[y] || '')[x]
  const walk = (x, y) => FLOOR.has(at(x, y)) && at(x - 1, y) !== 'T'
  if (map.length !== base.length || map.some(r => r.length !== base[0].length)) fail(id, 'wrong size')
  // Kitchen, pass wall and the queue / entrance column are shared by every plan.
  map.forEach((row, y) => {
    if (row.slice(0, KITCHEN_MAX_COL + 2) !== base[y].slice(0, KITCHEN_MAX_COL + 2)) fail(id, `kitchen differs on row ${y}`)
    if (row.slice(EXIT_AISLE_COL + 1) !== base[y].slice(EXIT_AISLE_COL + 1)) fail(id, `queue/entrance column differs on row ${y}`)
  })
  const tables = []
  map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'T') tables.push({ x, y }) }))
  if (tables.length !== 6) fail(id, `${tables.length} tables, expected 6`)
  const entranceRow = map.findIndex(r => r.includes('E'))
  for (let y = 1; y <= entranceRow; y++) if (!walk(EXIT_AISLE_COL, y)) fail(id, `aisle blocked at row ${y}`)
  // Server BFS from the spawn: every table must have a reachable stand tile.
  const spawnY = map.findIndex(r => r.includes('2'))
  const seen = new Set([`${map[spawnY].indexOf('2')},${spawnY}`])
  const queue = [[map[spawnY].indexOf('2'), spawnY]]
  while (queue.length) {
    const [x, y] = queue.shift()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`
      if (!seen.has(k) && walk(x + dx, y + dy)) { seen.add(k); queue.push([x + dx, y + dy]) }
    }
  }
  tables.forEach((t, i) => {
    const chair = t.x + 1
    if (at(chair, t.y) !== '.') fail(id, `T${i + 1} has no free chair tile`)
    // Leaving: down from the seat, then along that row to the aisle.
    for (let x = chair; x <= EXIT_AISLE_COL; x++) if (!walk(x, t.y + 1)) fail(id, `T${i + 1} exit row blocked at column ${x}`)
    const stands = [[t.x, t.y - 1], [t.x, t.y + 1], [t.x - 1, t.y], [chair, t.y - 1], [chair, t.y + 1], [chair + 1, t.y]]
    if (!stands.some(([x, y]) => seen.has(`${x},${y}`))) fail(id, `T${i + 1} unreachable for the Server`)
  })
  if (!bad) console.log(`  ✓ ${id}`)
}
process.exit(failed ? 1 : 0)
