import { Scene } from 'phaser'
import { buildTextures } from '@/game/art/textures'

export default class BootScene extends Scene {
  constructor () {
    super({ key: 'BootScene' })
  }

  create () {
    buildTextures(this)
    this.scene.start('LobbyScene')
  }
}
