import { TUNING } from '@/game/constants'
import { INGREDIENTS, RECIPES, canAddToPlate } from '@/game/data/recipes'
import { Counter, Hook, Board, Grill, Crate, Bin } from '@/game/stations/stations'
import { isPlate, isCleanPlate, isTool, isPlateReady, plateDish } from '@/game/entities/items'
import Bot from '@/game/ai/Bot'

const subset = (a, b) => a.every(x => b.includes(x))

// Works the oldest open ticket: one plate on an assembly counter, parts
// added as they're ready, finished dish onto a free pass counter.
export default class CookBot extends Bot {
  get stations () {
    const st = this.scene.stations
    return {
      grills: st.filter(x => x instanceof Grill),
      boards: st.filter(x => x instanceof Board),
      assembly: st.filter(x => x.assembly),
      counters: st.filter(x => x instanceof Counter && !x.isPass),
      passes: st.filter(x => x.isPass),
      hook: st.find(x => x instanceof Hook),
      bin: st.find(x => x instanceof Bin),
      crate: id => st.find(x => x instanceof Crate && x.id === id)
    }
  }

  // Tickets still waiting on a dish, most urgent first. Finished dishes that
  // already exist (on the pass, stashed on a spare counter, or in the
  // Server's hands) cover the most urgent matching tickets, since that's who
  // the Server serves first. Counting real dishes instead of remembering
  // which ticket a dish was "for" can't drift when the Server serves a
  // different guest with the same order.
  openOrders () {
    const open = this.scene.rail.tickets
      .map(t => t.order)
      .filter(o => o.customer.state === 'waiting')
    open.sort((a, b) => a.customer.patience - b.customer.patience)
    const ready = this.scene.stations.filter(x => x.isPass || (x instanceof Counter && !x.assembly)).map(x => x.item)
      .concat([this.scene.server.item, this.scene.server.extra])
      .map(plateDish).filter(Boolean)
    return open.filter(o => {
      const i = ready.indexOf(o.recipe)
      if (i < 0) return true
      ready.splice(i, 1)
      return false
    })
  }

  currentOrder () {
    return this.openOrders()[0] || null
  }

  // A plate can match one dish while still being built into another
  // (bun + patty is a burger, and also most of a deluxe).
  finished (contents, dish, orderRecipe) {
    if (!dish) return false
    if (dish === orderRecipe) return true
    const recipe = orderRecipe && RECIPES[orderRecipe]
    if (recipe && subset(contents, recipe.parts)) return false
    return this.openOrders().some(o => o.recipe === dish)
  }

  // Put something down out of the way: the spare counter first, so the
  // assembly counters stay free for building plates.
  stash (S) {
    const free = S.counters.find(c => !c.item && !c.assembly) || S.counters.find(c => !c.item)
    return free ? this.tap(free) : this.tap(S.bin)
  }

  placeHeld (held, S, plateSt, order) {
    const recipe = order && RECIPES[order.recipe]
    if (isPlate(held)) {
      if (held.dirty) return this.tap(this.scene.sink)
      const dish = plateDish(held)
      if (this.finished(held.contents, dish, order && order.recipe)) {
        const pass = S.passes.find(p => !p.item)
        if (!pass) return this.stash(S)
        return this.tap(pass)
      }
      if (held.contents.length && (!recipe || !subset(held.contents, recipe.parts))) return this.tap(S.bin)
      if (!held.contents.length && plateSt) return this.tap(this.scene.plateStack)
      const free = S.assembly.find(a => !a.item)
      return free ? this.tap(free) : this.stash(S)
    }
    if (held.state === 'burnt') return this.tap(S.bin)
    if (held.id === 'patty' && held.state === 'raw') {
      const grill = S.grills.find(g => !g.item && !g.onFire)
      return grill ? this.tap(grill) : this.stash(S)
    }
    if (INGREDIENTS[held.id].chop && held.state === 'raw') {
      const board = S.boards.find(b => !b.item)
      return board ? this.tap(board) : this.stash(S)
    }
    if (isPlateReady(held) && plateSt && canAddToPlate(plateSt.item.contents, held.id) &&
        (!recipe || recipe.parts.includes(held.id))) {
      return this.tap(plateSt)
    }
    return this.stash(S)
  }

  decide () {
    const S = this.stations
    const held = this.player.item

    const fire = S.grills.find(g => g.onFire)
    if (fire) {
      if (isTool(held, 'extinguisher')) return this.hold(fire, () => !fire.onFire)
      if (held) return this.stash(S)
      return isTool(S.hook.item) ? this.tap(S.hook) : null
    }
    if (isTool(held)) return this.tap(S.hook)

    const order = this.currentOrder()
    const recipe = order && RECIPES[order.recipe]
    // A finished dish for another ticket, parked on an assembly counter while
    // the pass was full, isn't the plate we're building: leave it be.
    const parked = a => {
      const dish = plateDish(a.item)
      return !!dish && dish !== (order && order.recipe) && this.finished(a.item.contents, dish, order && order.recipe)
    }
    const plateSt = S.assembly.find(a => isCleanPlate(a.item) && !parked(a)) || null
    if (held) return this.placeHeld(held, S, plateSt, order)

    const burnt = S.grills.find(g => g.item && g.item.state === 'burnt')
    if (burnt) return this.tap(burnt)

    // A finished dish stashed while the pass was full goes out as soon as it can.
    const stashedDish = S.counters.find(c => c !== plateSt && plateDish(c.item) && (!c.assembly || parked(c)))
    if (stashedDish && S.passes.some(p => !p.item)) return this.tap(stashedDish)

    if (plateSt) {
      const dish = plateDish(plateSt.item)
      if (this.finished(plateSt.item.contents, dish, order && order.recipe) && S.passes.some(p => !p.item)) return this.tap(plateSt)
      if (recipe && !subset(plateSt.item.contents, recipe.parts)) return this.tap(plateSt)
    }

    const onPlate = plateSt ? plateSt.item.contents : []
    const needs = recipe ? recipe.parts.filter(p => !onPlate.includes(p)) : []

    const cooked = S.grills.find(g => g.item && g.item.state === 'cooked')
    if (cooked && plateSt && needs.includes('patty')) return this.tap(cooked)
    // Rescue a patty that's about to burn even if nothing needs it yet.
    if (cooked && cooked.timer > TUNING.grillCookTime + TUNING.grillBurnTime * 0.6) return this.tap(cooked)

    const chopped = S.boards.find(b => b.item && b.item.state === 'chopped')
    if (chopped && plateSt && needs.includes(chopped.item.id)) return this.tap(chopped)
    const raw = S.boards.find(b => b.choppable)
    if (raw) return this.hold(raw, () => !raw.choppable)

    // Any counter can hold a stashed part, the spare assembly counter included.
    const stashed = plateSt && S.counters.find(c => c !== plateSt && isPlateReady(c.item) && needs.includes(c.item.id))
    if (stashed) return this.tap(stashed)

    // Grilling is the slowest step: keep a patty going for every open order that needs one.
    const pattyDemand = this.openOrders().filter(o => RECIPES[o.recipe].parts.includes('patty')).length -
      (onPlate.includes('patty') ? 1 : 0)
    const pattySupply = S.grills.filter(g => g.item && g.item.id === 'patty' && g.item.state !== 'burnt').length +
      S.counters.filter(c => c.item && c.item.id === 'patty' && c.item.state === 'cooked').length
    if (pattyDemand > pattySupply && S.grills.some(g => !g.item && !g.onFire)) return this.tap(S.crate('patty'))

    if (!recipe) return null
    if (!plateSt) {
      const free = S.assembly.some(a => !a.item)
      return this.scene.plateStack.count > 0 && free ? this.tap(this.scene.plateStack) : null
    }

    for (const part of needs) {
      if (part === 'patty') {
        if (S.grills.some(g => g.item && g.item.id === 'patty' && g.item.state !== 'burnt')) continue
        if (S.counters.some(c => c.item && c.item.id === 'patty' && c.item.state === 'cooked')) continue
        if (S.grills.some(g => !g.item && !g.onFire)) return this.tap(S.crate('patty'))
        continue
      }
      if (INGREDIENTS[part].chop) {
        if (S.boards.some(b => b.item && b.item.id === part)) continue
        if (S.boards.some(b => !b.item)) return this.tap(S.crate(part))
        continue
      }
      return this.tap(S.crate(part))
    }
    return null
  }
}
