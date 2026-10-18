// 20x10 tiles. Kitchen on the left, dining room on the right.
//   #  wall          .  floor           D  doorway (Cook can't pass)
//   B  bun crate     P  patty crate     L  lettuce crate   M  tomato crate
//   G  grill         g  spare counter (becomes a grill with Double Grill)
//   C  chopping board  c  counter       =  pass counter (reachable from both rooms)
//   K  plate stack   S  sink            X  bin            F  extinguisher hook
//   T  table (customer sits on the tile to its right)
//   Q  queue spot (first Q from the bottom is the front of the queue)
//   E  entrance      1  Cook spawn      2  Server spawn
export const MAP = [
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
]

export const KITCHEN_MAX_COL = 6
export const EXIT_AISLE_COL = 17
