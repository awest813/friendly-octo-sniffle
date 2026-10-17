import { TILE, MAP_TOP, TUNING } from '@/game/constants'
import RunState from '@/game/state/RunState'
import { tileOf, key, findPath, standTiles } from '@/game/ai/grid'

const STUCK_TIME = 0.6
const MAX_REPATHS = 3
// Whatever happens, a bot never sits on one task longer than this.
const TASK_TIMEOUT = 8

// Base for AI teammates. A brain's decide() returns a task:
//   { target, mode: 'tap' | 'hold', until?, timeout?, then? }
// The runner walks to a floor tile next to the target, faces it, checks the
// player is really targeting it, then taps A or holds X like a human would.
export default class Bot {
  constructor (scene, player) {
    this.scene = scene
    this.player = player
    this.input = player.input
    this.task = null
    this.wait = 0
    this.after = null
  }

  tap (target, then) {
    return { target, mode: 'tap', then }
  }

  hold (target, until, timeout = 4) {
    return { target, mode: 'hold', until, timeout }
  }

  tick (dt) {
    this.input.move.set(0, 0)
    this.input.hold('use', false)
    // Callbacks run a frame after the action so they see its result.
    if (this.after) {
      const fn = this.after
      this.after = null
      fn()
    }
    if (this.wait > 0) {
      this.wait -= dt
      return
    }
    if (!this.task) {
      this.task = this.decide()
      if (!this.task) {
        this.wait = 0.2
        return
      }
    }
    const result = this.run(this.task, dt)
    if (result === 'running') return
    if (result === 'done' && this.task.then) this.after = this.task.then
    if (result === 'failed') this.wait = 0.25
    this.task = null
  }

  speed () {
    return TUNING.playerSpeed * RunState.speedMult(this.player.role)
  }

  plan (task) {
    const role = this.player.role
    const stands = new Map()
    task.target.anchors.forEach(a => {
      const t = tileOf(a.x, a.y)
      standTiles(t.tx, t.ty, role).forEach(s => stands.set(key(s.tx, s.ty), s))
    })
    const feet = this.player.feet
    const blocked = new Set()
    if (task.repaths) {
      const other = this.scene.players.find(p => p !== this.player)
      const o = tileOf(other.feet.x, other.feet.y)
      blocked.add(key(o.tx, o.ty))
    }
    const path = findPath(tileOf(feet.x, feet.y), new Set(stands.keys()), role, blocked)
    if (!path) return false
    const here = tileOf(feet.x, feet.y)
    const end = path.length ? path[path.length - 1] : here
    task.path = path
    task.stand = stands.get(key(end.tx, end.ty))
    task.lastPos = { x: feet.x, y: feet.y }
    task.stuckFor = 0
    task.elapsed = 0
    task.miss = 0
    return true
  }

  steer (tx, ty, dt) {
    const feet = this.player.feet
    const cx = tx * TILE + TILE / 2
    const cy = MAP_TOP + ty * TILE + TILE / 2
    const dx = cx - feet.x
    const dy = cy - feet.y
    const d = Math.hypot(dx, dy)
    if (d < 2) return true
    const scale = Math.min(1, d / Math.max(1, this.speed() * dt))
    this.input.move.set(dx / d * scale, dy / d * scale)
    return false
  }

  // Blocked (usually by the other player): re-plan around them.
  checkStuck (task, dt) {
    const feet = this.player.feet
    task.stuckFor += dt
    if (task.stuckFor < STUCK_TIME) return 'running'
    const moved = Math.hypot(feet.x - task.lastPos.x, feet.y - task.lastPos.y)
    task.lastPos = { x: feet.x, y: feet.y }
    task.stuckFor = 0
    if (moved >= 4) return 'running'
    task.repaths = (task.repaths || 0) + 1
    if (task.repaths > MAX_REPATHS) return 'failed'
    task.path = null
    return 'running'
  }

  run (task, dt) {
    task.age = (task.age || 0) + dt
    if (task.age > TASK_TIMEOUT) return 'failed'
    if (!task.path && !this.plan(task)) return 'failed'

    if (task.path.length) {
      if (this.steer(task.path[0].tx, task.path[0].ty, dt)) task.path.shift()
      return this.checkStuck(task, dt)
    }

    if (!this.steer(task.stand.tx, task.stand.ty, dt)) return this.checkStuck(task, dt)
    this.player.facing.set(task.stand.fx, task.stand.fy)
    if (this.player.target !== task.target) {
      task.miss += dt
      return task.miss > 0.3 ? 'failed' : 'running'
    }
    if (task.mode === 'tap') {
      this.input.tap('interact')
      return 'done'
    }
    task.elapsed += dt
    this.input.hold('use', true)
    if ((task.until && task.until()) || task.elapsed > task.timeout) return 'done'
    return 'running'
  }

  decide () {
    return null
  }
}
