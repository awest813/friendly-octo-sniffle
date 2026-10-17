import { Scene } from 'phaser'
import { buildTextures } from '@/game/art/textures'
import { initSfx, audioContext } from '@/game/audio/sfx'
import { initMusic } from '@/game/audio/music'

export default class BootScene extends Scene {
  constructor () {
    super({ key: 'BootScene' })
  }

  create () {
    buildTextures(this)
    initSfx(this)
    initMusic(audioContext())
    this.scene.start('TitleScene')
  }
}
