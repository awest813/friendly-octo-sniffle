// 20x10 tiles. Kitchen on the left, dining room on the right.
//   #  wall          .  floor           D  doorway (Cook can't pass)
//   B  bun crate     P  patty crate     L  lettuce crate   M  tomato crate
//   G  grill         g  spare counter (becomes a grill with Double Grill)
//   C  chopping board  c  counter       =  pass counter (reachable from both rooms)
//   K  plate stack   S  sink            X  bin            F  extinguisher hook
//   T  table (customer sits on the tile to its right)
//   Q  queue spot (first Q from the bottom is the front of the queue)
//   E  entrance      1  Cook spawn      2  Server spawn

// Dining-room floor plans. The kitchen (columns 0-7), the queue, the door
// and the exit aisle (column EXIT_AISLE_COL) are the same in every plan;
// only the tables move. Rules every plan follows (checked by
// scripts/check-layouts.mjs): the tile right of a T is its chair, the row
// under each chair is clear all the way to the aisle (that's how guests
// leave), and the aisle is clear down to the entrance row. Tables are
// numbered in reading order and open in that order as waves grow.
export const LAYOUTS = {
  CLASSIC: [
    '####################',
    '#BPLMGg#...........#',
    '#......=.T..T..T...#',
    '#C.....=...........#',
    '#c.1...=..........Q#',
    '#c.....#.T..T..T..Q#',
    '#K.....D..........Q#',
    '#F.....#..2.......Q#',
    '#X....S#...........E',
    '####################'
  ],
  // Zig-zag tables: no straight runs for the Server.
  STAGGERED: [
    '####################',
    '#BPLMGg#...........#',
    '#......=.T....T....#',
    '#C.....=...........#',
    '#c.1...=....T..T..Q#',
    '#c.....#..........Q#',
    '#K.....D.T....T...Q#',
    '#F.....#..2.......Q#',
    '#X....S#...........E',
    '####################'
  ],
  // Tables pulled into the middle of the room around one tight aisle.
  COZY: [
    '####################',
    '#BPLMGg#...........#',
    '#......=...........#',
    '#C.....=.T..T..T...#',
    '#c.1...=..........Q#',
    '#c.....#.T..T..T..Q#',
    '#K.....D..........Q#',
    '#F.....#..2.......Q#',
    '#X....S#...........E',
    '####################'
  ]
}

// The live map. Modules import this array once, so a new floor plan is
// copied into it in place rather than replacing it.
export const MAP = [...LAYOUTS.CLASSIC]

export function useLayout (id) {
  const plan = LAYOUTS[id] || LAYOUTS.CLASSIC
  MAP.splice(0, MAP.length, ...plan)
}

// Plain data and pure functions only, no imports: scripts/check-layouts.mjs
// loads this file directly in Node.

// Spots in the dining room that every plan must leave as open floor: the
// plant pots, and the tiles a pet walks through to reach the door.
export const PLANT_TILES = [[8, 1], [18, 1]]
export const PET_DOOR_TILES = [[17, 7], [17, 8], [16, 8], [17, 6]]

const FLOOR = '.12Q'

// Whether a role can stand on (tx, ty) in `map` (rows of characters). Only
// the Server fits through the kitchen doorway, and the tile right of a table
// is its solid chair.
export function isWalkable (map, tx, ty, role) {
  const ch = map[ty] && map[ty][tx]
  if (!ch) return false
  if (ch === 'D') return role === 'server'
  if (map[ty][tx - 1] === 'T') return false
  return FLOOR.includes(ch)
}

export const KITCHEN_MAX_COL = 6
export const EXIT_AISLE_COL = 17
