import { TILE, MAP_TOP } from '@/game/constants'
import { MAP } from '@/game/data/map'

const FLOOR = new Set(['.', '1', '2', 'Q'])

export const key = (tx, ty) => `${tx},${ty}`

export function tileOf (x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor((y - MAP_TOP) / TILE) }
}

export function walkable (tx, ty, role) {
  const ch = MAP[ty] && MAP[ty][tx]
  if (!ch) return false
  if (ch === 'D') return role === 'server'
  // The tile right of a table is its (solid) chair.
  if (MAP[ty][tx - 1] === 'T') return false
  return FLOOR.has(ch)
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// Shortest 4-way path from `start` to the nearest tile in `goals` (a Set of keys).
// `blocked` tiles are avoided unless they are the start. Returns tiles after
// the start, or null when no goal is reachable.
export function findPath (start, goals, role, blocked = new Set()) {
  const startKey = key(start.tx, start.ty)
  if (goals.has(startKey)) return []
  const prev = new Map([[startKey, null]])
  const queue = [start]
  while (queue.length) {
    const cur = queue.shift()
    for (const [dx, dy] of DIRS) {
      const nx = cur.tx + dx
      const ny = cur.ty + dy
      const k = key(nx, ny)
      if (prev.has(k) || blocked.has(k) || !walkable(nx, ny, role)) continue
      prev.set(k, key(cur.tx, cur.ty))
      if (goals.has(k)) {
        const path = []
        let at = k
        while (at && at !== startKey) {
          const [px, py] = at.split(',').map(Number)
          path.unshift({ tx: px, ty: py })
          at = prev.get(at)
        }
        return path
      }
      queue.push({ tx: nx, ty: ny })
    }
  }
  return null
}

// Floor tiles next to a target tile, each with the direction to face it.
export function standTiles (tx, ty, role) {
  return DIRS
    .map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy, fx: -dx, fy: -dy }))
    .filter(t => walkable(t.tx, t.ty, role))
}
