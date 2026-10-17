import Phaser from 'phaser'
import { WIDTH, FONT, CSS, COLORS } from '@/game/constants'
import { WIN_WAVE } from '@/game/data/waves'
import PlayerInput from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { loadScores, addScore, allBots } from '@/game/state/scores'
import { PET_BY_ID } from '@/game/data/pets'
import { sfx } from '@/game/audio/sfx'
import { playMusic } from '@/game/audio/music'

export default class GameOverScene extends Phaser.Scene {
  constructor () {
    super({ key: 'GameOverScene' })
  }

  init (data) {
    this.won = !!data.won
  }

  create () {
    this.cameras.main.setBackgroundColor(COLORS.bg)
    playMusic('menu')
    const title = this.won ? 'DINER SAVED' : 'RUN OVER'
    this.add.text(WIDTH / 2, 40, title, { fontFamily: FONT, fontSize: '24px', color: this.won ? CSS.diner : CSS.danger }).setOrigin(0.5)
    const sub = this.won ? 'SURVIVED THE NIGHT. CLOSING TIME SCORE BELOW.' : 'ONE COOKED. ONE SERVED. BOTH PANICKED.'
    this.add.text(WIDTH / 2, 68, sub, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)

    const waves = Math.min(RunState.wavesCleared, WIN_WAVE)
    // Personal bests are about your own progress, compared with nobody else.
    const prevBestStreak = loadScores().reduce((m, s) => Math.max(m, s.streak || 0), 0)
    const rows = [
      ['WAVES CLEARED', `${waves}/${WIN_WAVE}`],
      ['SERVED / PERFECT', `${RunState.served} / ${RunState.perfect}`],
      ['BEST STREAK', `${RunState.bestStreak}`],
      ['STARS EARNED', `${RunState.stars}`],
      ['TIPS', `$${RunState.tips}`]
    ]
    rows.forEach(([label, value], i) => {
      const y = 86 + i * 16
      this.add.text(WIDTH / 2 - 150, y, label, { fontFamily: FONT, fontSize: '8px', color: CSS.white })
      this.add.text(WIDTH / 2 + 150, y, value, { fontFamily: FONT, fontSize: '8px', color: i === 4 ? CSS.diner : CSS.cook }).setOrigin(1, 0)
    })
    const newStreak = RunState.bestStreak > prevBestStreak && RunState.bestStreak >= 3
    if (RunState.pets.length) {
      const names = RunState.pets.map(id => PET_BY_ID[id].name).join(' & ')
      this.add.text(WIDTH / 2, 166, `DINER PETS: ${names}`, { fontFamily: FONT, fontSize: '8px', color: '#ff9bb0' }).setOrigin(0.5)
      // Pet portraits to the right of the stats, clear of the numbers.
      RunState.pets.forEach((id, i) => {
        this.add.image(WIDTH / 2 + 196 + i * 34, 112, PET_BY_ID[id].texture).setScale(1.5)
      })
    }

    const bots = allBots(this.registry)
    const ai = this.registry.get('ai') || {}
    const mode = bots ? 'BOTS' : ai.cook || ai.server ? 'SOLO' : '2P'
    const entry = { tips: RunState.tips, waves, mode, diff: RunState.difficulty, streak: RunState.bestStreak }
    const rank = bots ? -1 : addScore(entry)
    this.drawScores(rank, !bots && newStreak)

    this.prompt = this.add.text(WIDTH / 2, 330, 'A: PLAY AGAIN   -   B: MENU', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    const bindings = this.registry.get('bindings') || {}
    this.inputs = [new PlayerInput(this, 'cook', bindings.cook), new PlayerInput(this, 'server', bindings.server)]
    this.readyAt = this.game.getTime() + 800

    if (this.registry.get('autoplay')) {
      const game = this.scene.get('GameScene')
      console.info('[duo] run over', JSON.stringify({ won: this.won, waves, served: RunState.served, angry: RunState.angry, tips: RunState.tips, lastWave: game && game.waveStats, mods: [...RunState.modifiers], pets: RunState.pets }))
      this.time.delayedCall(4000, () => this.scene.start('LobbyScene'))
    }
  }

  drawScores (rank, newStreak) {
    const callouts = []
    if (rank >= 0) callouts.push(`NEW HIGH SCORE #${rank + 1}!`)
    if (newStreak) callouts.push('NEW BEST STREAK!')
    if (callouts.length) {
      const t = this.add.text(WIDTH / 2, 180, callouts.join('   '), { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
      this.tweens.add({ targets: t, scale: { from: 1.3, to: 1 }, duration: 500, yoyo: true, repeat: -1 })
      sfx('tip')
    }
    this.add.text(WIDTH / 2, 202, 'BEST RUNS', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    const list = loadScores()
    if (!list.length) {
      this.add.text(WIDTH / 2, 222, '-', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    }
    list.forEach((s, i) => {
      const y = 220 + i * 16
      const mine = i === rank
      const color = mine ? CSS.diner : CSS.white
      this.add.text(WIDTH / 2 - 150, y, `${i + 1}. ${s.mode}${s.diff && s.diff !== 'NORMAL' ? ' ' + s.diff : ''}`, { fontFamily: FONT, fontSize: '8px', color })
      this.add.text(WIDTH / 2 + 20, y, `WAVE ${s.waves}`, { fontFamily: FONT, fontSize: '8px', color }).setOrigin(0.5, 0)
      this.add.text(WIDTH / 2 + 150, y, `$${s.tips}`, { fontFamily: FONT, fontSize: '8px', color }).setOrigin(1, 0)
    })
  }

  update () {
    this.prompt.setAlpha(0.6 + 0.4 * Math.sin(this.time.now / 150))
    this.inputs.forEach(i => i.update())
    if (this.game.getTime() < this.readyAt) return
    if (this.inputs.some(i => i.pressed('interact'))) {
      sfx('confirm')
      this.scene.start('LobbyScene')
    } else if (this.inputs.some(i => i.pressed('back') || i.pressed('pause'))) {
      sfx('confirm')
      this.scene.start('TitleScene', { skipSplash: true })
    }
  }
}
