import Phaser from 'phaser'
import { WIDTH, HEIGHT, COLORS, CSS, FONT } from '@/game/constants'
import { PAD, nativePadConnected } from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { loadScores } from '@/game/state/scores'
import Settings, { AI_SKILLS, saveSettings } from '@/game/state/settings'
import { playMusic } from '@/game/audio/music'
import { initSfx, sfx } from '@/game/audio/sfx'

const ROLES = ['cook', 'server']

const INFO = {
  cook: { title: 'COOK', color: CSS.cook, tint: COLORS.cook, x: 200, keys: 'KEYS: WASD, SPACE, E, Q' },
  server: { title: 'SERVER', color: CSS.server, tint: COLORS.server, x: 440, keys: 'KEYS: ARROWS, ENTER, SHIFT' }
}

// First pad to press A is the Cook, second is the Server. Keyboard joins as a
// fallback. Pressing A again with one role empty starts with an AI in it.
// `?autoplay` in the URL starts a bot-vs-bot run (soak and balance testing).
export default class LobbyScene extends Phaser.Scene {
  constructor () {
    super({ key: 'LobbyScene' })
  }

  create () {
    this.starting = false
    // The press that opened the lobby may still be held; don't let it join.
    this.openedAt = this.game.getTime()
    initSfx(this)
    playMusic('menu')
    this.cameras.main.setBackgroundColor(COLORS.bg)
    const prev = this.registry.get('bindings') || {}
    const prevKeys = this.registry.get('keyboard') || {}
    this.slots = {
      cook: { pad: this.padAlive(prev.cook) ? prev.cook : null, keys: !!prevKeys.cook },
      server: { pad: this.padAlive(prev.server) ? prev.server : null, keys: !!prevKeys.server }
    }

    this.add.text(WIDTH / 2, 38, 'DUO', { fontFamily: FONT, fontSize: '32px', color: CSS.white }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 76, 'DINER', { fontFamily: FONT, fontSize: '32px', color: CSS.cook }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 108, 'ONE COOKS. ONE SERVES. BOTH PANIC.', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    const best = loadScores()[0]
    if (best) {
      this.add.text(WIDTH / 2, 124, `BEST: $${best.tips} - WAVE ${best.waves} (${best.mode})`, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    }

    this.cards = {}
    ROLES.forEach(role => {
      const info = INFO[role]
      const panel = this.add.rectangle(info.x, 210, 200, 140, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge)
      this.add.text(info.x, 152, info.title, { fontFamily: FONT, fontSize: '16px', color: info.color }).setOrigin(0.5)
      const sprite = this.add.image(info.x, 205, role).setScale(2)
      const status = this.add.text(info.x, 254, '', { fontFamily: FONT, fontSize: '8px', color: CSS.white }).setOrigin(0.5)
      this.add.text(info.x, 296, info.keys, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
      this.tweens.add({ targets: sprite, y: 200, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.cards[role] = { panel, status, info }
    })

    this.prompt = this.add.text(WIDTH / 2, 330, '', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    this.pads = this.add.text(WIDTH / 2, 348, '', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)

    if (this.input.gamepad) {
      this.input.gamepad.on('down', (pad, button) => this.onPad(pad, button.index))
    }
    this.input.keyboard.on('keydown-SPACE', e => !e.repeat && this.onKey('cook'))
    this.input.keyboard.on('keydown-ENTER', e => !e.repeat && this.onKey('server'))
    this.input.keyboard.on('keydown-ESC', e => !e.repeat && this.back())
    this.input.keyboard.on('keydown-BACKSPACE', e => !e.repeat && this.back())
    this.input.keyboard.on('keydown-Q', e => !e.repeat && this.cycleSkill())
    this.input.keyboard.on('keydown-FORWARD_SLASH', e => !e.repeat && this.cycleSkill())
    this.refresh()

    const autoplay = new URLSearchParams(window.location.search).has('autoplay')
    this.registry.set('autoplay', autoplay)
    if (autoplay) this.time.delayedCall(300, () => this.start(true))
  }

  padAlive (index) {
    return nativePadConnected(index)
  }

  ready (role) {
    const s = this.slots[role]
    return s.pad !== null || s.keys
  }

  roleOfPad (index) {
    return ROLES.find(r => this.slots[r].pad === index) || null
  }

  get settling () {
    return this.game.getTime() - this.openedAt < 250
  }

  back () {
    if (this.starting || this.settling) return
    sfx('drop')
    this.scene.start('TitleScene', { skipSplash: true })
  }

  // With one role empty, Y picks how sharp the AI teammate plays.
  cycleSkill () {
    if (this.settling || !this.anyReady() || this.bothReady()) return
    const i = AI_SKILLS.indexOf(Settings.aiSkill)
    Settings.aiSkill = AI_SKILLS[(i + 1) % AI_SKILLS.length]
    saveSettings()
    sfx('select')
    this.refresh()
  }

  onPad (pad, button) {
    if (this.settling) return
    const role = this.roleOfPad(pad.index)
    if (button === PAD.B) {
      if (!role) {
        this.back()
        return
      }
      this.slots[role].pad = null
      sfx('drop')
      this.refresh()
      return
    }
    if (button === PAD.Y) {
      this.cycleSkill()
      return
    }
    if (button !== PAD.A && button !== PAD.START) return
    if (!role) {
      const free = ROLES.find(r => !this.ready(r)) || ROLES.find(r => this.slots[r].pad === null)
      if (free) {
        this.slots[free].pad = pad.index
        this.slots[free].keys = false
        sfx('confirm')
        this.refresh()
        return
      }
    }
    if (this.anyReady()) this.start()
  }

  onKey (role) {
    if (this.settling) return
    if (!this.ready(role)) {
      this.slots[role].keys = true
      sfx('confirm')
      this.refresh()
      return
    }
    this.start()
  }

  bothReady () {
    return ROLES.every(r => this.ready(r))
  }

  anyReady () {
    return ROLES.some(r => this.ready(r))
  }

  refresh () {
    ROLES.forEach(role => {
      const s = this.slots[role]
      const card = this.cards[role]
      let text = s.pad !== null ? `PAD ${s.pad + 1} READY` : s.keys ? 'KEYBOARD READY' : 'PRESS A TO JOIN'
      if (!this.ready(role) && this.anyReady()) text = `AI PLAYS (${Settings.aiSkill})`
      card.status.setText(text).setColor(this.ready(role) ? card.info.color : CSS.white)
      card.panel.setStrokeStyle(2, this.ready(role) ? card.info.tint : COLORS.panelEdge)
    })
    const empty = ROLES.find(r => !this.ready(r))
    let prompt = 'FIRST PAD = COOK  -  SECOND PAD = SERVER  -  B: BACK'
    if (this.bothReady()) prompt = 'PRESS A / START TO OPEN THE DINER'
    else if (this.anyReady()) prompt = `A AGAIN: PLAY WITH AI ${INFO[empty].title}  -  Y: AI SKILL`
    this.prompt.setText(prompt)
  }

  start (allBots = false) {
    if (this.starting) return
    this.starting = true
    sfx('wave')
    this.registry.set('demo', false)
    this.registry.set('ai', {
      cook: allBots || !this.ready('cook'),
      server: allBots || !this.ready('server')
    })
    this.registry.set('bindings', { cook: this.slots.cook.pad, server: this.slots.server.pad })
    this.registry.set('keyboard', { cook: this.slots.cook.keys, server: this.slots.server.keys })
    RunState.reset()
    this.scene.start('GameScene')
  }

  update () {
    const n = this.input.gamepad ? this.input.gamepad.getAll().filter(p => nativePadConnected(p.index)).length : 0
    this.pads.setText(n ? `${n} GAMEPAD${n > 1 ? 'S' : ''} CONNECTED` : 'NO GAMEPAD? PRESS A BUTTON ON IT, OR USE SPACE / ENTER')
    this.prompt.setAlpha(this.anyReady() ? 0.6 + 0.4 * Math.sin(this.time.now / 150) : 1)
  }
}
