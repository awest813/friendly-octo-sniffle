import Phaser from 'phaser'
import { WIDTH, HEIGHT, TILE, MAP_TOP, COLORS, TUNING, FONT } from '@/game/constants'
import { MAP, KITCHEN_MAX_COL, EXIT_AISLE_COL } from '@/game/data/map'
import { WAVES, WIN_WAVE, CRITIC } from '@/game/data/waves'
import { GUESTS, rollGuest } from '@/game/data/guests'
import { PET_BY_ID, ADOPT_EVERY, ENDLESS_ADOPT_SERVED } from '@/game/data/pets'
import Pet from '@/game/entities/Pet'
import { POWERUPS } from '@/game/data/powerups'
import {
  tileCenter, Counter, Hook, Board, Grill, Crate, PlateStack, Sink, Bin, Table
} from '@/game/stations/stations'
import Player from '@/game/entities/Player'
import Customer from '@/game/entities/Customer'
import { plateDish, ingredientTexture } from '@/game/entities/items'
import PlayerInput, { PAD } from '@/game/input/PlayerInput'
import Hud from '@/game/ui/Hud'
import TicketRail from '@/game/ui/TicketRail'
import PauseOverlay from '@/game/ui/PauseOverlay'
import { showReportCard } from '@/game/ui/ReportCard'
import BotInput from '@/game/ai/BotInput'
import Settings from '@/game/state/settings'
import CookBot from '@/game/ai/CookBot'
import ServerBot from '@/game/ai/ServerBot'
import { floatText, shake, banner } from '@/game/ui/fx'
import RunState from '@/game/state/RunState'
import bus from '@/game/state/bus'
import { initSfx, sfx } from '@/game/audio/sfx'
import { playMusic, duckMusic, setMusicIntensity } from '@/game/audio/music'
import AnyInput from '@/game/input/AnyInput'

const CRATES = { B: 'bun', P: 'patty', L: 'lettuce', M: 'tomato' }

export default class GameScene extends Phaser.Scene {
  constructor () {
    super({ key: 'GameScene' })
  }

  create () {
    initSfx(this)
    // Scene systems survive a restart, so clear any pause left from the last run.
    this.time.paused = false
    this.tweens.resumeAll()
    playMusic('game')
    duckMusic(false)
    this.demo = !!this.registry.get('demo')
    this.cameras.main.setBackgroundColor(COLORS.bg)
    this.physics.world.setBounds(0, MAP_TOP, WIDTH, HEIGHT - MAP_TOP)
    this.solids = this.physics.add.staticGroup()
    this.cookOnly = this.physics.add.staticGroup()
    this.stations = []
    this.grid = new Map()
    this.tables = []
    this.customers = []
    this.queue = []
    this.queueSpots = []
    this.leading = null
    this.orderId = 0
    this.paused = false
    this.over = false
    this.waveActive = false
    this.busTimer = 0
    this.alarmTimer = 0
    this.platesGranted = 0
    this.lostRole = null
    this.pets = []

    this.buildMap()

    const bindings = this.registry.get('bindings') || { cook: null, server: null }
    const ai = this.registry.get('ai') || {}
    const inputFor = role => ai[role] ? new BotInput() : new PlayerInput(this, role, bindings[role])
    this.cook = new Player(this, 'cook', this.spawns.cook.x, this.spawns.cook.y, inputFor('cook'))
    this.server = new Player(this, 'server', this.spawns.server.x, this.spawns.server.y, inputFor('server'))
    this.players = [this.cook, this.server]
    this.bots = []
    if (ai.cook) this.bots.push(new CookBot(this, this.cook))
    if (ai.server) this.bots.push(new ServerBot(this, this.server))
    this.players.forEach(p => { if (ai[p.role]) p.tag.setText('AI') })
    this.physics.add.collider([this.cook.body, this.server.body], this.solids)
    this.physics.add.collider(this.cook.body, this.cookOnly)
    this.physics.add.collider(this.cook.body, this.server.body)

    this.hud = new Hud(this)
    this.rail = new TicketRail(this, 146, 3, WIDTH - 150)
    this.hint = this.add.text(WIDTH / 2, HEIGHT - 12, '', {
      fontFamily: FONT, fontSize: '8px', color: '#8a8399'
    }).setOrigin(0.5).setDepth(9100)
    this.overlay = new PauseOverlay(this)
    // Prep countdown before the doors open, over the dining room.
    this.prepText = this.add.text(432, MAP_TOP + 14, '', {
      fontFamily: FONT, fontSize: '8px', color: '#ffd93d', backgroundColor: '#120f1add', padding: { x: 4, y: 3 }
    }).setOrigin(0.5).setDepth(9700).setVisible(false)
    this.prepLeft = 0

    if (this.input.gamepad) {
      this.input.gamepad.on('down', this.onPadDown, this)
      this.events.once('shutdown', () => this.input.gamepad.off('down', this.onPadDown, this))
    }
    // Alt-tabbing away mid-wave shouldn't cost lives.
    this.game.events.on('blur', this.onBlur, this)
    this.events.once('shutdown', () => this.game.events.off('blur', this.onBlur, this))

    if (this.demo) {
      this.demoInput = new AnyInput(this)
      this.demoTime = 0
      this.add.text(WIDTH / 2, HEIGHT / 2 + 60, 'DEMO  -  PRESS ANY BUTTON', {
        fontFamily: FONT, fontSize: '8px', color: '#ffd93d', backgroundColor: '#120f1a', padding: { x: 6, y: 4 }
      }).setOrigin(0.5).setDepth(9990)
    }

    this.time.delayedCall(500, () => this.nextWave())
  }

  addSolid (x, y, group = this.solids) {
    group.add(this.add.zone(x, y, TILE, TILE))
  }

  addStation (s) {
    this.stations.push(s)
    this.grid.set(`${s.tx},${s.ty}`, s)
    if (s instanceof Table) this.grid.set(`${s.tx + 1},${s.ty}`, s)
    return s
  }

  removeStation (s) {
    this.stations.splice(this.stations.indexOf(s), 1)
    this.grid.delete(`${s.tx},${s.ty}`)
    s.destroy()
  }

  buildMap () {
    const sinks = []
    let tableNo = 0
    this.spawns = {}
    MAP.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const c = tileCenter(tx, ty)
        if (ch === '#') {
          this.add.image(c.x, c.y, 'wall').setDepth(c.y - 16)
          this.addSolid(c.x, c.y)
          return
        }
        this.add.image(c.x, c.y, tx <= KITCHEN_MAX_COL ? 'floor_k' : 'floor_d').setDepth(0)
        if (CRATES[ch]) this.addStation(new Crate(this, tx, ty, CRATES[ch]))
        else if (ch === 'G') this.addStation(new Grill(this, tx, ty))
        else if (ch === 'g') this.spare = this.addStation(new Counter(this, tx, ty))
        else if (ch === 'C') this.addStation(new Board(this, tx, ty))
        else if (ch === 'c') this.addStation(new Counter(this, tx, ty)).assembly = true
        else if (ch === '=') this.addStation(new Counter(this, tx, ty, 'pass')).isPass = true
        else if (ch === 'K') this.plateStack = this.addStation(new PlateStack(this, tx, ty))
        else if (ch === 'S') sinks.push([tx, ty])
        else if (ch === 'X') this.addStation(new Bin(this, tx, ty))
        else if (ch === 'F') this.addStation(new Hook(this, tx, ty))
        else if (ch === 'T') this.tables.push(this.addStation(new Table(this, tx, ty, ++tableNo)))
        else if (ch === 'Q') this.queueSpots.push(c)
        else if (ch === 'E') {
          this.entrance = c
          this.addSolid(c.x, c.y)
        } else if (ch === 'D') {
          this.add.image(c.x, c.y, 'door').setDepth(1)
          this.addSolid(c.x, c.y, this.cookOnly)
        } else if (ch === '1') this.spawns.cook = c
        else if (ch === '2') this.spawns.server = c
      })
    })
    sinks.forEach(([tx, ty]) => {
      this.sink = this.addStation(new Sink(this, tx, ty, this.plateStack))
    })
    this.tables.forEach(t => t.setOpen(false))
    // Front of the queue is the spot nearest the entrance.
    this.queueSpots.sort((a, b) => b.y - a.y)
  }

  // --- waves ---------------------------------------------------------------

  waveConfig (n) {
    return WAVES[Math.min(n, WAVES.length) - 1]
  }

  nextWave () {
    RunState.wave++
    const cfg = this.waveConfig(RunState.wave)
    if (cfg.draft) {
      this.scene.launch('DraftScene', {
        onPick: () => {
          this.scene.resume()
          this.primeInputs()
          this.refreshModifiers()
          this.startWave(cfg)
        }
      })
      this.scene.pause()
      return
    }
    this.startWave(cfg)
  }

  startWave (cfg) {
    const n = RunState.wave
    this.waveCfg = cfg
    this.spawned = 0
    this.waveServed = 0
    // angryBy: where walkouts happened (queued / following / ready / waiting) for balance logs.
    this.waveStats = { served: 0, perfect: 0, angry: 0, angryBy: {} }
    this.criticsLeft = cfg.critics || 0
    // PlateUp-style prep: a few calm seconds to pre-chop and pre-grill.
    this.prepLeft = n === 1 ? TUNING.firstPrepTime : TUNING.prepTime
    this.spawnTimer = this.prepLeft + 0.5
    this.lastCalled = false
    this.chain = null
    setMusicIntensity(1)
    this.waveActive = true
    this.tables.forEach((t, i) => t.setOpen(t.open || i < cfg.tables))
    banner(this, cfg.endless ? 'CLOSING TIME' : `WAVE ${n}`, `${cfg.name} - ${cfg.tag}`)
    sfx('wave')
    bus.emit('wave_started', { wave: n, config: cfg })
  }

  get difficulty () {
    if (!this.waveCfg || !this.waveCfg.endless) return 1
    return Math.pow(TUNING.endlessScale, Math.floor(this.waveServed / TUNING.endlessStep))
  }

  updateSpawning (dt) {
    const cfg = this.waveCfg
    if (!this.waveActive || this.spawned >= cfg.customers) return
    this.spawnTimer -= dt
    if (this.spawnTimer > 0) return
    if (this.queue.length >= this.queueSpots.length) {
      this.spawnTimer = 1
      return
    }
    const group = cfg.group || 1
    for (let i = 0; i < group && this.spawned < cfg.customers && this.queue.length < this.queueSpots.length; i++) {
      this.spawnCustomer(cfg, i)
    }
    // Final stretch: call it out and pick up the tempo.
    if (!cfg.endless && !this.lastCalled && this.spawned >= cfg.customers) {
      this.lastCalled = true
      floatText(this, 432, MAP_TOP + 40, 'LAST GUESTS!', '#ff3b8d')
      setMusicIntensity(1.12)
    }
    this.spawnTimer = cfg.spawnEvery * RunState.diff.spawn / this.difficulty
  }

  spawnCustomer (cfg, offset) {
    const remaining = cfg.customers - this.spawned
    const critic = this.criticsLeft > 0 && Math.random() < this.criticsLeft / remaining
    if (critic) this.criticsLeft--
    const variants = this.registry.get('customerVariants')
    const guest = critic ? GUESTS.critic : rollGuest(RunState.wave, this.hasPet('pepper') ? 2 : 1)
    const menu = guest.orders ? cfg.recipes.filter(r => guest.orders.includes(r)) : cfg.recipes
    const c = new Customer(this, {
      x: this.entrance.x + TILE + offset * 18,
      y: this.entrance.y,
      texture: `customer${Phaser.Math.Between(0, variants - 1)}`,
      order: Phaser.Utils.Array.GetRandom(menu.length ? menu : cfg.recipes),
      patience: (critic ? CRITIC.patience : cfg.patience * guest.patience) / this.difficulty,
      guest
    })
    if (guest.golden) {
      floatText(this, this.entrance.x - TILE, this.entrance.y - 40, 'BIG TIPPER!', '#ffd93d')
      sfx('lucky')
    }
    this.spawned++
    this.customers.push(c)
    this.queue.push(c)
    this.walkToQueue(c, this.queue.length - 1, true)
  }

  walkToQueue (c, index, fromDoor = false) {
    const spot = this.queueSpots[index]
    const points = fromDoor ? [{ x: this.entrance.x - TILE, y: this.entrance.y }, spot] : [spot]
    const arrive = () => {
      if (c.state !== 'entering') return
      c.setState('queued')
      c.resetPatience(RunState.patienceMult())
    }
    c.walk(points, c.state === 'entering' ? arrive : null)
  }

  reflowQueue () {
    this.queue.forEach((c, i) => this.walkToQueue(c, i))
  }

  checkWaveCleared () {
    const cfg = this.waveCfg
    if (!this.waveActive || cfg.endless) return
    if (this.spawned < cfg.customers || this.customers.length) return
    this.waveActive = false
    const n = RunState.wave
    RunState.wavesCleared = n
    RunState.calm = false
    if (this.registry.get('autoplay')) {
      console.info('[duo] wave cleared', n, JSON.stringify({ served: RunState.served, angry: RunState.angry, lives: RunState.lives, tips: RunState.tips, wave: this.waveStats, streak: RunState.streak, mods: [...RunState.modifiers], pets: RunState.pets }))
    }
    bus.emit('wave_cleared', { wave: n })
    sfx('wave')
    setMusicIntensity(1)
    const { stars, bonus } = this.rateWave(n)
    RunState.tips += bonus
    RunState.stars += stars
    showReportCard(this, {
      title: n === WIN_WAVE ? 'DINER SAVED!' : `WAVE ${n} CLEAR`,
      subtitle: n === WIN_WAVE ? 'NOW SURVIVE CLOSING TIME' : this.waveCfg.name,
      stats: this.waveStats,
      streak: RunState.streak,
      stars,
      bonus
    })
    this.time.delayedCall(4200, () => this.betweenWaves())
  }

  // 3 stars: no walkouts and at least half the serves PERFECT. 2: no walkouts.
  // 1: cleared anyway. Bonus tips grow with the wave.
  rateWave (n) {
    const s = this.waveStats
    let stars = 1
    if (s.angry === 0) stars = s.served > 0 && s.perfect * 2 >= s.served ? 3 : 2
    const bonus = [0, 3, 8, 15][stars] + n * stars
    return { stars, bonus }
  }

  // Shop opens after every wave from wave 2 on, then any draft, then the wave.
  // Between waves: shop (from wave 2), Adoption Day (every 5th wave), then
  // nextWave() handles any draft.
  betweenWaves () {
    const steps = []
    if (RunState.wave >= 2) steps.push('ShopScene')
    if (RunState.wave % ADOPT_EVERY === 0) steps.push('AdoptScene')
    this.runSteps(steps, () => this.nextWave())
  }

  // Overlay scenes one after another, pausing the game under them.
  runSteps (steps, done) {
    if (!steps.length) {
      done()
      return
    }
    const key = steps.shift()
    duckMusic(true)
    this.scene.launch(key, {
      onDone: () => {
        duckMusic(false)
        this.scene.resume()
        this.primeInputs()
        this.syncPlates()
        this.syncPets()
        this.runSteps(steps, done)
      }
    })
    this.scene.pause()
  }

  hasPet (id) {
    return RunState.pets.includes(id)
  }

  // New adoptees trot in through the front door.
  syncPets () {
    RunState.pets.forEach(id => {
      if (this.pets.some(p => p.def.id === id)) return
      const pet = new Pet(this, PET_BY_ID[id], this.entrance.x + TILE, this.entrance.y)
      pet.path = [{ tx: 18, ty: 8 }, { tx: 17, ty: 8 }]
      this.pets.push(pet)
      floatText(this, this.entrance.x - TILE * 2, this.entrance.y - 40, `${pet.def.name} JOINED THE DINER!`, '#ffd93d')
      sfx(pet.def.kind === 'DOG' ? 'woof' : 'meow')
    })
  }

  onPetted (pet) {
    const boost = pet.boost
    this.customers.forEach(c => {
      if (c.ticking) c.patience = Math.min(c.patienceMax, c.patience + boost)
    })
    RunState.petted++
    sfx(pet.def.kind === 'DOG' ? 'woof' : 'meow')
    floatText(this, pet.pos.x, pet.pos.y - 30, `+${boost}s PATIENCE`, '#ff9bb0')
  }

  // Pet auras: how fast a guest loses patience, and their tip bonus.
  petDrain (c) {
    let m = 1
    if (c.state === 'queued' && this.hasPet('beans')) m *= 0.5
    this.pets.forEach(p => { if (p.def.id === 'sunny' && p.near(c.pos.x, c.pos.y)) m *= 0.5 })
    return m
  }

  petTip (c) {
    return this.pets.some(p => p.def.id === 'biscuit' && p.near(c.pos.x, c.pos.y)) ? 1.3 : 1
  }

  syncPlates () {
    while (this.platesGranted < RunState.bonusPlates) {
      this.plateStack.addPlate()
      this.platesGranted++
    }
  }

  primeInputs () {
    this.players.forEach(p => { p.input.update(); p.input.update() })
  }

  // --- service -------------------------------------------------------------

  follow (c) {
    if (this.leading) return false
    this.queue.splice(this.queue.indexOf(c), 1)
    this.reflowQueue()
    this.leading = c
    c.path = []
    c.setState('following')
    sfx('seat')
    return true
  }

  // Diner Dash-style chain: the same Server action back to back pays a bit
  // extra (seat, seat, seat...). Rewards batching instead of zig-zagging.
  chainAction (type, x, y) {
    if (this.chain && this.chain.type === type) this.chain.count++
    else this.chain = { type, count: 1 }
    const n = this.chain.count
    if (n < 2) return
    const bonus = TUNING.chainBonus * Math.min(n - 1, 4)
    RunState.tips += bonus
    this.hud.bumpTips()
    this.time.delayedCall(300, () => floatText(this, x, y - 70, `${type.toUpperCase()} CHAIN x${n} +$${bonus}`, '#b06ef7'))
  }

  seat (c, table) {
    this.chainAction('seat', table.x, table.y)
    this.leading = null
    table.customer = c
    c.table = table
    c.setState('sitting')
    c.walk([table.seat], () => {
      if (c.state !== 'sitting') return
      c.setState('ready')
      c.resetPatience(RunState.patienceMult())
    })
    sfx('seat')
  }

  takeOrder (c) {
    const order = { id: ++this.orderId, table: c.table.number, recipe: c.order, customer: c }
    c.ticket = order
    this.chainAction('order', c.pos.x, c.pos.y)
    c.setState('waiting')
    c.resetPatience(RunState.patienceMult() * TUNING.foodPatienceMult)
    bus.emit('order_taken', { order })
  }

  deliver (c, player) {
    const hand = ['item', 'extra'].find(k => plateDish(player[k]) === c.order)
    if (!hand) {
      sfx('error')
      shake(this)
      player.input.rumble(250, 0.8, 0.5)
      floatText(this, c.pos.x, c.pos.y - 40, 'WRONG!', '#ff4040')
      return true
    }
    const both = !!(player.item && player.extra)
    const served = player[hand]
    if (hand === 'item') player.setItem(null)
    else player.setExtra(null)
    c.table.itemView.setItem(served)
    bus.emit('order_closed', { order: c.ticket, served: true })
    c.ticket = null
    const ratio = c.ratio
    c.setState('eating')
    c.eatTimer = TUNING.eatTime * c.guest.eat

    // Serve quality: PERFECT rewards speed, CLUTCH celebrates a last-second save.
    const quality = ratio >= TUNING.perfectAt ? 'PERFECT' : ratio < TUNING.clutchBelow ? 'CLUTCH' : null
    RunState.streak++
    RunState.bestStreak = Math.max(RunState.bestStreak, RunState.streak)
    const speed = TUNING.speedTip * ratio
    const octo = both ? TUNING.octoBonus : 0
    const chef = served.quality || 0
    const bonus = (quality === 'PERFECT' ? TUNING.perfectBonus : quality === 'CLUTCH' ? TUNING.clutchBonus : 0) + chef * TUNING.chefBonus
    const tip = Math.round((TUNING.baseTip + speed) * RunState.tipMult() * c.guest.tip * RunState.streakMult() * this.petTip(c)) + octo + bonus
    RunState.tips += tip
    RunState.served++
    if (quality === 'PERFECT') RunState.perfect++
    if (quality === 'CLUTCH') RunState.clutch++
    this.waveServed++
    this.waveStats.served++
    if (quality === 'PERFECT') this.waveStats.perfect++
    bus.emit('tip_earned', { amount: tip, x: c.pos.x, y: c.pos.y })

    floatText(this, c.pos.x, c.pos.y - 40, octo ? `+$${tip} OCTO!` : `+$${tip}`)
    if (quality) {
      this.time.delayedCall(220, () => floatText(this, c.pos.x, c.pos.y - 52, `${quality}!`, quality === 'PERFECT' ? '#00ffd0' : '#ff3b8d'))
    }
    if (chef) {
      this.time.delayedCall(660, () => floatText(this, c.pos.x, c.pos.y - 76, `CHEF'S KISS +$${chef * TUNING.chefBonus}`, '#ffd93d'))
    }
    this.chainAction('serve', c.pos.x, c.pos.y - 12)
    if ([3, 5, 10, 15, 20].includes(RunState.streak)) {
      this.time.delayedCall(440, () => floatText(this, c.pos.x, c.pos.y - 64, `${RunState.streak} STREAK!`, '#f79a3e'))
    }
    this.hud.bumpTips()
    this.hud.bumpStreak()
    // Closing Time never "clears", so every N guests served counts as 5 waves.
    if (this.waveCfg.endless && this.waveServed % ENDLESS_ADOPT_SERVED === 0) {
      this.time.delayedCall(800, () => { if (!this.over) this.runSteps(['AdoptScene'], () => {}) })
    }
    sfx('tip')
    sfx('streak', RunState.streak)
    return true
  }

  leave (c, angry) {
    const qi = this.queue.indexOf(c)
    if (qi >= 0) {
      this.queue.splice(qi, 1)
      this.reflowQueue()
    }
    if (this.leading === c) this.leading = null
    if (c.ticket) {
      bus.emit('order_closed', { order: c.ticket, served: false })
      c.ticket = null
    }

    const exit = { x: this.entrance.x + TILE * 1.5, y: this.entrance.y }
    const aisleX = EXIT_AISLE_COL * TILE + TILE / 2
    let path
    if (c.table) {
      const t = c.table
      const below = t.seat.y + TILE
      path = [{ x: t.seat.x, y: below }, { x: aisleX, y: below }, { x: aisleX, y: this.entrance.y }, exit]
      t.customer = null
      c.table = null
    } else {
      path = [{ x: this.queueSpots[0].x, y: this.entrance.y }, exit]
    }

    const angryFrom = c.state
    c.setState('leaving')
    if (angry) {
      c.setAngry()
      RunState.lives--
      RunState.angry++
      if (this.waveStats) {
        this.waveStats.angry++
        this.waveStats.angryBy[angryFrom] = (this.waveStats.angryBy[angryFrom] || 0) + 1
      }
      if (RunState.streak >= 3) floatText(this, c.pos.x, c.pos.y - 52, 'STREAK RESET', '#8a8399')
      RunState.streak = 0
      bus.emit('customer_left_angry', { customer: c })
      bus.emit('life_lost', { lives: RunState.lives })
      sfx('angry')
      shake(this, 0.01, 260)
      this.players.forEach(p => p.input.rumble(350, 1, 0.6))
      floatText(this, c.pos.x, c.pos.y - 40, '-1 LIFE', '#ff4040')
      if (RunState.lives <= 0) this.runOver()
    }

    c.walk(path, () => {
      c.destroy()
      this.customers.splice(this.customers.indexOf(c), 1)
    })
  }

  onBurn (grill) {
    sfx('burn')
    shake(this, 0.008, 220)
    this.cook.input.rumble(300, 0.9, 0.4)
    floatText(this, grill.x, grill.y - 24, 'BURNT!', '#ff4040')
  }

  get fireEnabled () {
    return !!(this.waveCfg && this.waveCfg.fire)
  }

  get fires () {
    return this.stations.filter(s => s.onFire).length
  }

  onFire (grill) {
    sfx('fire')
    shake(this, 0.012, 300)
    this.players.forEach(p => p.input.rumble(400, 1, 0.8))
    floatText(this, grill.x, grill.y - 24, 'FIRE!', '#ff4040')
    this.alarmTimer = 1
  }

  onFireOut (grill) {
    sfx('fireOut')
    floatText(this, grill.x, grill.y - 24, 'PHEW', '#7ed957')
  }

  // Ingredient Cannon: fire the held ingredient along the facing direction.
  // It lands on the first station in the way that can take it, or in the
  // other player's empty hands.
  throwItem (p) {
    const item = p.item
    const fail = () => {
      sfx('error')
      floatText(this, p.feet.x, p.feet.y - 44, 'NO TARGET', '#8a8399')
    }
    if (!item || item.type !== 'ing') return fail()
    const mate = this.players.find(o => o !== p)
    const dir = p.facing.clone().normalize()
    const sx = p.feet.x
    const sy = p.feet.y - 6
    let target = null
    for (let d = 12; d <= TUNING.throwRange && !target; d += 6) {
      const x = sx + dir.x * d
      const y = sy + dir.y * d
      if (!mate.item && Phaser.Math.Distance.Between(x, y, mate.feet.x, mate.feet.y - 6) < 14) {
        target = mate
        break
      }
      const tx = Math.floor(x / TILE)
      const ty = Math.floor((y - MAP_TOP) / TILE)
      const st = this.grid.get(`${tx},${ty}`)
      if (st) target = st
      else if (!MAP[ty] || '#E'.includes(MAP[ty][tx] || '#')) break
    }
    if (!target) return fail()

    let view
    if (target === mate) {
      mate.setItem(item)
      view = mate.itemView
    } else {
      if (!target.receive(item)) return fail()
      view = target.itemView
    }
    p.setItem(null)
    view.setVisible(false)
    const end = target === mate ? { x: mate.feet.x, y: mate.feet.y - 30 } : { x: target.x, y: target.y - 6 }
    const dist = Phaser.Math.Distance.Between(sx, sy - 24, end.x, end.y)
    const shot = this.add.image(sx, sy - 24, ingredientTexture(item.id, item.state)).setDepth(9300)
    const arc = { t: 0 }
    this.tweens.add({
      targets: arc,
      t: 1,
      duration: Math.max(160, dist * 1.4),
      onUpdate: () => {
        shot.setPosition(
          Phaser.Math.Linear(sx, end.x, arc.t),
          Phaser.Math.Linear(sy - 24, end.y, arc.t) - Math.sin(arc.t * Math.PI) * 24
        )
        shot.setAngle(arc.t * 720)
      },
      onComplete: () => {
        shot.destroy()
        view.setVisible(true)
        sfx('drop')
      }
    })
    sfx('throw')
  }

  runOver () {
    if (this.over) return
    this.over = true
    this.waveActive = false
    const won = RunState.wavesCleared >= WIN_WAVE
    bus.emit('run_over', { won })
    this.players.forEach(p => p.body.setVelocity(0, 0))
    banner(this, won ? 'LAST CALL!' : 'RUN OVER', won ? 'THE DINER CLOSES' : 'TOO MANY ANGRY CUSTOMERS', won ? '#ffd93d' : '#ff4040', 1800)
    this.time.delayedCall(2200, () => {
      if (this.demo) this.scene.start('TitleScene', { skipSplash: true })
      else this.scene.start('GameOverScene', { won })
    })
  }

  refreshModifiers () {
    const icons = POWERUPS.filter(p => RunState.has(p.id)).map(p => p.icon)
    this.hud.showModifiers(icons)
  }

  // --- frame ---------------------------------------------------------------

  pickTarget (p) {
    const probe = p.probe()
    const feet = p.feet
    let best = null
    let bestD = TUNING.interactRadius
    const candidates = this.stations.concat(this.queue.filter(c => c.state === 'queued'), this.pets)
    candidates.forEach(t => {
      if (!t.reachableBy(p)) return
      t.anchors.forEach(a => {
        const d = Phaser.Math.Distance.Between(probe.x, probe.y, a.x, a.y)
        if (d < bestD && Phaser.Math.Distance.Between(feet.x, feet.y, a.x, a.y) < 46) {
          best = t
          bestD = d
        }
      })
    })
    return best
  }

  updatePlayer (p, dt) {
    p.update(dt)
    const target = this.pickTarget(p)
    p.setTarget(target)
    const human = !(p.input instanceof BotInput)
    p.showPrompt(human && Settings.prompts && target ? target.prompt(p) : null, target)
    if (p.input.pressed('interact')) {
      let ok = false
      if (target instanceof Customer) ok = this.follow(target)
      else if (target) ok = target.interact(p)
      if (!ok) sfx('error')
    }
    if (target && p.input.held('use')) target.use(p, dt)
    if (p.role === 'cook' && RunState.has('cannon') && p.input.pressed('throw')) this.throwItem(p)
  }

  updateModifiers (dt) {
    if (RunState.has('grill') && this.spare && !this.spare.item) {
      const { tx, ty } = this.spare
      this.removeStation(this.spare)
      this.spare = null
      const g = this.addStation(new Grill(this, tx, ty))
      floatText(this, g.x, g.y - 20, 'GRILL #2', '#00ffd0')
    }
    if (RunState.has('busboy')) {
      this.busTimer += dt
      if (this.busTimer >= TUNING.busboyInterval) {
        this.busTimer = 0
        const t = this.tables.find(tb => tb.dirty)
        if (t) {
          t.setDirty(false)
          this.sink.addDirty()
          floatText(this, t.x, t.y - 20, 'BEEP BOOP', '#aab3c5')
        }
      }
    }
  }

  updatePrep (dt) {
    if (this.prepLeft <= 0) return
    this.prepLeft -= dt
    if (this.prepLeft <= 0) {
      this.prepText.setVisible(false)
      floatText(this, 432, MAP_TOP + 30, 'DOORS OPEN!', '#7ed957')
      sfx('ding')
      return
    }
    this.prepText.setText(`PREP TIME - DOORS OPEN IN ${Math.ceil(this.prepLeft)}`).setVisible(true)
  }

  updateHint (fires) {
    if (fires) {
      const blink = Math.floor(this.time.now / 300) % 2 === 0
      this.hint.setText('FIRE! GRAB THE RED EXTINGUISHER AND HOLD X ON THE GRILL').setColor(blink ? '#ff4040' : '#ffd93d')
    } else {
      this.hint.setText((this.waveCfg && this.waveCfg.hint) || '').setColor('#8a8399')
    }
  }

  setPaused (on) {
    this.paused = on
    duckMusic(on)
    if (on) {
      this.physics.pause()
      this.tweens.pauseAll()
      this.time.paused = true
      this.players.forEach(p => p.body.setVelocity(0, 0))
    } else {
      this.physics.resume()
      this.tweens.resumeAll()
      this.time.paused = false
      this.overlay.hide()
    }
  }

  onBlur () {
    if (!this.paused && !this.over && !this.demo && this.scene.isActive()) this.openPauseMenu()
  }

  openSettings () {
    this.subMenu = true
    this.scene.launch('SettingsScene', {
      onClose: () => {
        this.subMenu = false
        this.primeInputs()
      }
    })
  }

  openPauseMenu () {
    this.setPaused(true)
    sfx('pause')
    this.overlay.showMenu({
      resume: () => this.setPaused(false),
      settings: () => this.openSettings(),
      restart: () => {
        RunState.reset()
        this.scene.restart()
      },
      quit: () => this.scene.start('TitleScene', { skipSplash: true })
    })
  }

  // A pad that drops out pauses the game until that role gets a pad or the keyboard back.
  checkLostPads () {
    const lost = this.players.find(p => p.input.padLost)
    if (!lost) return false
    this.lostRole = lost.role
    this.setPaused(true)
    sfx('error')
    this.overlay.showLost(lost.role, lost.role === 'cook' ? 'SPACE' : 'ENTER')
    return true
  }

  onPadDown (pad, button) {
    if (!this.lostRole || button.index !== PAD.A) return
    const other = this.players.find(p => p.role !== this.lostRole)
    if (other.input.padIndex === pad.index) return
    this.rebind(this.lostRole, pad.index)
  }

  rebind (role, padIndex) {
    const player = this.players.find(p => p.role === role)
    player.input.padIndex = padIndex
    this.registry.set('bindings', { ...(this.registry.get('bindings') || {}), [role]: padIndex })
    this.lostRole = null
    this.setPaused(false)
    this.primeInputs()
    sfx('confirm')
  }

  updatePaused () {
    if (this.subMenu) return
    if (this.lostRole) {
      const p = this.players.find(pl => pl.role === this.lostRole)
      if (p.input.pressed('interact')) this.rebind(this.lostRole, null)
      return
    }
    const inputs = this.players.map(p => p.input)
    if (inputs.some(i => i.pressed('pause') || i.pressed('back'))) {
      this.setPaused(false)
      return
    }
    this.overlay.menu.handle(inputs)
  }

  // Attract mode: any button (or 2 minutes) goes back to the title screen.
  updateDemo (dt) {
    this.demoInput.update()
    this.demoTime += dt
    if (this.demoInput.anyPressed() || this.demoTime > 120) {
      this.scene.start('TitleScene', { skipSplash: true })
      return true
    }
    return false
  }

  update (time, delta) {
    const dt = Math.min(delta / 1000, 0.05)
    if (this.demo && this.updateDemo(dt)) return
    if (!this.paused && !this.over) this.bots.forEach(b => b.tick(dt))
    this.players.forEach(p => p.input.update())
    if (this.paused) {
      this.updatePaused()
      return
    }
    if (this.over) {
      this.players.forEach(p => p.body.setVelocity(0, 0))
      return
    }
    if (this.checkLostPads()) return
    if (this.players.some(p => p.input.pressed('pause'))) {
      this.openPauseMenu()
      return
    }

    this.updateSpawning(dt)
    this.players.forEach(p => this.updatePlayer(p, dt))
    this.stations.forEach(s => s.update(dt))

    const fires = this.fires
    const drain = fires ? TUNING.fireDrain : 1
    if (fires) {
      this.alarmTimer -= dt
      if (this.alarmTimer <= 0) {
        sfx('fire')
        this.alarmTimer = 1.2
      }
    }

    this.pets.forEach(p => p.update(dt))
    const mochi = this.pets.find(p => p.def.id === 'mochi')
    this.customers.slice().forEach(c => {
      if (mochi && c.state === 'eating' && mochi.near(c.pos.x, c.pos.y)) c.eatTimer -= dt
      const expired = c.update(dt, c.state === 'following' ? this.server : null, drain * this.petDrain(c))
      if (expired && !this.over) this.leave(c, true)
      else if (c.state === 'eating' && c.eatTimer <= 0) {
        c.table.setDirty(true)
        this.leave(c, false)
      }
    })

    this.updateModifiers(dt)
    this.checkWaveCleared()
    const cfg = this.waveCfg
    this.hud.update(cfg && !cfg.endless && this.waveStats ? (this.waveStats.served + this.waveStats.angry) / cfg.customers : null)
    this.updateHint(fires)
    this.updatePrep(dt)
    this.rail.update()
  }
}
