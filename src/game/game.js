import Phaser from 'phaser'
import { WIDTH, HEIGHT } from '@/game/constants'
import BootScene from '@/game/scenes/BootScene'
import LobbyScene from '@/game/scenes/LobbyScene'
import GameScene from '@/game/scenes/GameScene'
import DraftScene from '@/game/scenes/DraftScene'
import GameOverScene from '@/game/scenes/GameOverScene'
import RunState from '@/game/state/RunState'

function launch (containerId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: containerId,
    backgroundColor: '#120f1a',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      gamepad: true
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [BootScene, LobbyScene, GameScene, DraftScene, GameOverScene]
  })
}

export default launch
export { launch, RunState }
