import { Hook, Bin } from '@/game/stations/stations'
import { isCleanPlate, isDirtyPlate, isServable, isTool, plateDish } from '@/game/entities/items'
import Customer from '@/game/entities/Customer'
import Bot from '@/game/ai/Bot'

const byPatience = (a, b) => a.patience - b.patience

// Front of house priorities: deliver what's in hand, seat whoever is
// following, take orders, pick up dishes for waiting tables, greet the
// queue, then bus dirty tables.
export default class ServerBot extends Bot {
  decide () {
    const s = this.scene
    const held = this.player.item
    const bin = s.stations.find(x => x instanceof Bin)
    const passes = s.stations.filter(x => x.isPass)
    const waiting = s.customers.filter(c => c.state === 'waiting' && c.table)

    if (held) {
      if (isDirtyPlate(held)) return this.tap(s.sink)
      if (isServable(held)) {
        const dish = plateDish(held)
        const c = waiting.filter(w => w.order === dish).sort(byPatience)[0]
        return c ? this.tap(c.table) : this.tap(bin)
      }
      if (isCleanPlate(held)) return this.tap(s.plateStack)
      if (isTool(held)) return this.tap(s.stations.find(x => x instanceof Hook))
      return this.tap(bin)
    }

    if (s.leading) {
      const table = s.tables.find(t => t.free)
      return table ? this.tap(table) : null
    }

    const ready = s.customers.filter(c => c.state === 'ready' && c.table).sort(byPatience)[0]
    if (ready) return this.tap(ready.table)

    const pass = passes.find(p => {
      const dish = plateDish(p.item)
      return dish && waiting.some(c => c.order === dish)
    })
    if (pass) return this.tap(pass)

    const queued = s.queue.filter(c => c.state === 'queued').sort(byPatience)[0]
    // Greeting anyone in the queue is as good as greeting the one we aimed for.
    const anyQueued = c => c instanceof Customer && c.state === 'queued'
    if (queued && s.tables.some(t => t.free)) return this.tap(queued, null, anyQueued)

    const dirty = s.tables.find(t => t.dirty)
    if (dirty) return this.tap(dirty)

    // Dishes nobody is waiting for clog the pass: clear one.
    if (passes.every(p => p.item)) return this.tap(passes[0])

    // Nothing urgent: give a pet some love (it calms every waiting guest).
    const pet = s.pets.find(p => p.cooldown <= 0)
    if (pet && s.customers.some(c => c.ticking)) return this.tap(pet)
    return null
  }
}
