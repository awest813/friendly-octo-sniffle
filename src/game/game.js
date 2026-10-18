import Phaser from 'phaser'
import { WIDTH, HEIGHT } from '@/game/constants'
import BootScene from '@/game/scenes/BootScene'
import TitleScene from '@/game/scenes/TitleScene'
import HowToPlayScene from '@/game/scenes/HowToPlayScene'
import ScoresScene from '@/game/scenes/ScoresScene'
import SettingsScene from '@/game/scenes/SettingsScene'
import LobbyScene from '@/game/scenes/LobbyScene'
import GameScene from '@/game/scenes/GameScene'
import DraftScene from '@/game/scenes/DraftScene'
import ShopScene from '@/game/scenes/ShopScene'
import AdoptScene from '@/game/scenes/AdoptScene'
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
    // Order is draw order: overlays (Draft, Shop, Adopt, Settings) come after the scenes they cover.
    scene: [BootScene, TitleScene, HowToPlayScene, ScoresScene, LobbyScene, GameScene, DraftScene, ShopScene, AdoptScene, GameOverScene, SettingsScene]
  })
}

export default launch
export { launch, RunState }
