import Phaser from 'phaser'
import { INGREDIENTS, RECIPES, matchRecipe, canAddToPlate } from '@/game/data/recipes'

export const ingredient = (id, state = 'raw') => ({ type: 'ing', id, state })
export const plate = (dirty = false) => ({ type: 'plate', contents: [], dirty })

export const isPlate = item => !!item && item.type === 'plate'
export const isCleanPlate = item => isPlate(item) && !item.dirty
export const isDirtyPlate = item => isPlate(item) && item.dirty

export function isPlateReady (item) {
  return !!item && item.type === 'ing' && INGREDIENTS[item.id].plateReady === item.state
}

export function ingredientTexture (id, state) {
  return `${id}_${state}`
}

// Plate-ready texture for an ingredient id (what a ticket should show).
export function readyTexture (id) {
  return ingredientTexture(id, INGREDIENTS[id].plateReady)
}

// Try to put `ing` on `plateItem`. Returns true and mutates the plate on success.
export function addToPlate (plateItem, ing) {
  if (!isCleanPlate(plateItem) || !isPlateReady(ing)) return false
  if (!canAddToPlate(plateItem.contents, ing.id)) return false
  plateItem.contents.push(ing.id)
  return true
}

// Combine whatever the player holds with whatever sits on a slot.
// Returns 'player' or 'slot' for whichever keeps the plate, or null.
export function combine (held, onSlot) {
  if (isCleanPlate(held) && addToPlate(held, onSlot)) return 'player'
  if (isCleanPlate(onSlot) && addToPlate(onSlot, held)) return 'slot'
  return null
}

export function plateDish (item) {
  return isCleanPlate(item) ? matchRecipe(item.contents) : null
}

const FAN = [[-5, -6], [5, -6], [0, -11]]

// Renders any item: a single ingredient, or a plate with its contents.
export class ItemView extends Phaser.GameObjects.Container {
  constructor (scene, x, y) {
    super(scene, x, y)
    scene.add.existing(this)
    this.item = undefined
  }

  setItem (item) {
    this.removeAll(true)
    this.item = item
    if (!item) return this
    if (item.type === 'ing') {
      this.add(this.scene.add.image(0, 0, ingredientTexture(item.id, item.state)))
      return this
    }
    this.add(this.scene.add.image(0, 0, item.dirty ? 'plate_dirty' : 'plate'))
    const dish = plateDish(item)
    if (dish) {
      this.add(this.scene.add.image(0, -6, RECIPES[dish].icon))
    } else {
      item.contents.forEach((id, i) => {
        const [dx, dy] = FAN[i] || [0, -8 - i * 3]
        this.add(this.scene.add.image(dx, dy, readyTexture(id)))
      })
    }
    return this
  }

  refresh () {
    return this.setItem(this.item)
  }
}
