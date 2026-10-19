// Checks every dining-room floor plan in src/game/data/map.js against the
// rules the game relies on. Run: npm run check:layouts (CI runs it too).
// map.js has no imports, so it can be loaded straight from its source.
import { readFileSync } from 'fs'

const src = readFileSync(new URL('../src/game/data/map.js', import.meta.url), 'utf8')
const { LAYOUTS, KITCHEN_MAX_COL, EXIT_AISLE_COL, PLANT_TILES, PET_DOOR_TILES, isWalkable } =
  await import('data:text/javascript,' + encodeURIComponent(src))

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const base = LAYOUTS.CLASSIC
let failed = false

for (const [id, map] of Object.entries(LAYOUTS)) {
  const errors = []
  const at = (x, y) => (map[y] || '')[x]
  const walk = (x, y) => isWalkable(map, x, y, 'server')
  const find = ch => {
    const out = []
    map.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push({ x, y }) }))
    return out
  }

  if (map.length !== base.length || map.some(r => r.length !== base[0].length)) errors.push('wrong size')
  // Kitchen, pass wall and the queue / entrance column are shared by every plan.
  map.forEach((row, y) => {
    if (row.slice(0, KITCHEN_MAX_COL + 2) !== base[y].slice(0, KITCHEN_MAX_COL + 2)) errors.push(`kitchen differs on row ${y}`)
    if (row.slice(EXIT_AISLE_COL + 1) !== base[y].slice(EXIT_AISLE_COL + 1)) errors.push(`queue/entrance column differs on row ${y}`)
  })

  // Everywhere the Server can get to from their spawn.
  const spawn = find('2')[0]
  const reach = new Set([`${spawn.x},${spawn.y}`])
  const queue = [spawn]
  while (queue.length) {
    const { x, y } = queue.shift()
    for (const [dx, dy] of DIRS) {
      const k = `${x + dx},${y + dy}`
      if (!reach.has(k) && walk(x + dx, y + dy)) { reach.add(k); queue.push({ x: x + dx, y: y + dy }) }
    }
  }
  // A thing is usable if the Server can stand on a non-queue tile next to it.
  const canServe = (x, y) => DIRS.some(([dx, dy]) => reach.has(`${x + dx},${y + dy}`) && at(x + dx, y + dy) !== 'Q')

  const tables = find('T')
  if (tables.length !== 6) errors.push(`${tables.length} tables, expected 6`)
  tables.forEach((t, i) => {
    const chair = t.x + 1
    if (at(chair, t.y) !== '.') errors.push(`T${i + 1} has no free chair tile`)
    // Leaving: down from the seat, then along that row to the aisle.
    for (let x = chair; x <= EXIT_AISLE_COL; x++) if (!walk(x, t.y + 1)) errors.push(`T${i + 1} exit row blocked at column ${x}`)
    if (!canServe(t.x, t.y) && !canServe(chair, t.y)) errors.push(`T${i + 1} unreachable for the Server`)
  })
  find('=').forEach(p => { if (!canServe(p.x, p.y)) errors.push(`pass at row ${p.y} unreachable for the Server`) })
  find('D').forEach(d => { if (!reach.has(`${d.x},${d.y}`)) errors.push('kitchen doorway unreachable for the Server') })
  find('Q').forEach(q => { if (!canServe(q.x, q.y)) errors.push(`queue spot at row ${q.y} can't be greeted`) })

  const entranceRow = find('E')[0].y
  for (let y = 1; y <= entranceRow; y++) if (!walk(EXIT_AISLE_COL, y)) errors.push(`aisle blocked at row ${y}`)
  PLANT_TILES.forEach(([x, y]) => { if (at(x, y) !== '.') errors.push(`plant tile ${x},${y} isn't open floor`) })
  PET_DOOR_TILES.forEach(([x, y]) => { if (!walk(x, y)) errors.push(`pet door tile ${x},${y} isn't walkable`) })

  if (errors.length) {
    failed = true
    errors.forEach(e => console.log(`  ✗ ${id}: ${e}`))
  } else {
    console.log(`  ✓ ${id}`)
  }
}
process.exit(failed ? 1 : 0)
