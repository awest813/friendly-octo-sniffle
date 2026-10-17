import Phaser from 'phaser'
import { WIDTH, HEIGHT, TILE, MAP_TOP, COLORS, TUNING, FONT } from '@/game/constants'
import { MAP, KITCHEN_MAX_COL, EXIT_AISLE_COL } from '@/game/data/map'
import { WAVES, WIN_WAVE, CRITIC } from '@/game/data/waves'
import { POWERUPS } from '@/game/data/powerups'
import {
  tileCenter, Counter, Board, Grill, Crate, PlateStack, Sink, Bin, Table
} from '@/game/stations/stations'
import Player from '@/game/entities/Player'
import Customer from '@/game/entities/Customer'
import { plateDish } from '@/game/entities/items'
import PlayerInput from '@/game/input/PlayerInput'
import Hud from '@/game/ui/Hud'
import TicketRail from '@/game/ui/TicketRail'
import { floatText, shake, banner } from '@/game/ui/fx'
import RunState from '@/game/state/RunState'
import bus from '@/game/state/bus'
import { initSfx, sfx } from '@/game/audio/sfx'

const CRATES = { B: 'bun', P: 'patty', L: 'lettuce', M: 'tomato' }

export default class GameScene extends Phaser.Scene {
  constructor () {
    super({ key: 'GameScene' })
  }

  create () {
    initSfx(this)
    this.cameras.main.setBackgroundColor(COLORS.bg)
    this.physics.world.setBounds(0, MAP_TOP, WIDTH, HEIGHT - MAP_TOP)
    this.solids = this.physics.add.staticGroup()
    this.cookOnly = this.physics.add.staticGroup()
    this.stations = []
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

    this.buildMap()

    const bindings = this.registry.get('bindings') || { cook: null, server: null }
    this.cook = new Player(this, 'cook', this.spawns.cook.x, this.spawns.cook.y, new PlayerInput(this, 'cook', bindings.cook))
    this.server = new Player(this, 'server', this.spawns.server.x, this.spawns.server.y, new PlayerInput(this, 'server', bindings.server))
    this.players = [this.cook, this.server]
    this.physics.add.collider([this.cook.body, this.server.body], this.solids)
    this.physics.add.collider(this.cook.body, this.cookOnly)
    this.physics.add.collider(this.cook.body, this.server.body)

    this.hud = new Hud(this)
    this.rail = new TicketRail(this, 146, 3, WIDTH - 150)
    this.hint = this.add.text(WIDTH / 2, HEIGHT - 12, '', {
      fontFamily: FONT, fontSize: '8px', color: '#8a8399'
    }).setOrigin(0.5).setDepth(9100)
    this.pauseText = this.add.text(WIDTH / 2, HEIGHT / 2, 'PAUSED', {
      fontFamily: FONT, fontSize: '16px', color: '#ffd93d', backgroundColor: '#120f1a', padding: { x: 12, y: 10 }
    }).setOrigin(0.5).setDepth(9900).setVisible(false)

    this.time.delayedCall(500, () => this.nextWave())
  }

  addSolid (x, y, group = this.solids) {
    group.add(this.add.zone(x, y, TILE, TILE))
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
        if (CRATES[ch]) this.stations.push(new Crate(this, tx, ty, CRATES[ch]))
        else if (ch === 'G') this.stations.push(new Grill(this, tx, ty))
        else if (ch === 'g') this.stations.push(this.spare = new Counter(this, tx, ty))
        else if (ch === 'C') this.stations.push(new Board(this, tx, ty))
        else if (ch === 'c') this.stations.push(new Counter(this, tx, ty))
        else if (ch === '=') this.stations.push(new Counter(this, tx, ty, 'pass'))
        else if (ch === 'K') this.stations.push(this.plateStack = new PlateStack(this, tx, ty))
        else if (ch === 'S') sinks.push([tx, ty])
        else if (ch === 'X') this.stations.push(new Bin(this, tx, ty))
        else if (ch === 'T') {
          const t = new Table(this, tx, ty, ++tableNo)
          this.tables.push(t)
          this.stations.push(t)
        } else if (ch === 'Q') this.queueSpots.push(c)
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
      this.sink = new Sink(this, tx, ty, this.plateStack)
      this.stations.push(this.sink)
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
          this.players.forEach(p => { p.input.update(); p.input.update() })
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
    this.criticsLeft = cfg.critics || 0
    this.spawnTimer = 2.5
    this.waveActive = true
    this.tables.forEach((t, i) => t.setOpen(t.open || i < cfg.tables))
    banner(this, cfg.endless ? 'CLOSING TIME' : `WAVE ${n}`, `${cfg.name} - ${cfg.tag}`)
    sfx('wave')
    this.hint.setText(n <= 2 ? 'COOK: BUN+GRILLED PATTY ON A PLATE > PASS   SERVER: SEAT>ORDER>SERVE>BUS' : '')
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
    this.spawnTimer = cfg.spawnEvery / this.difficulty
  }

  spawnCustomer (cfg, offset) {
    const remaining = cfg.customers - this.spawned
    const critic = this.criticsLeft > 0 && Math.random() < this.criticsLeft / remaining
    if (critic) this.criticsLeft--
    const variants = this.registry.get('customerVariants')
    const c = new Customer(this, {
      x: this.entrance.x + TILE + offset * 18,
      y: this.entrance.y,
      texture: critic ? 'critic' : `customer${Phaser.Math.Between(0, variants - 1)}`,
      order: Phaser.Utils.Array.GetRandom(cfg.recipes),
      patience: (critic ? CRITIC.patience : cfg.patience) / this.difficulty,
      critic
    })
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
    bus.emit('wave_cleared', { wave: n })
    sfx('wave')
    if (n === WIN_WAVE) {
      banner(this, 'DINER SAVED!', 'NOW SURVIVE CLOSING TIME', '#ffd93d', 2600)
    } else {
      banner(this, `WAVE ${n} CLEAR`, `TIPS $${RunState.tips}`, '#7ed957')
    }
    this.time.delayedCall(n === WIN_WAVE ? 3200 : 2600, () => this.nextWave())
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

  seat (c, table) {
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
    c.setState('waiting')
    c.resetPatience(RunState.patienceMult() * TUNING.foodPatienceMult)
    bus.emit('order_taken', { order })
  }

  deliver (c, player) {
    const dish = plateDish(player.item)
    if (dish !== c.order) {
      sfx('error')
      shake(this)
      player.input.rumble(250, 0.8, 0.5)
      floatText(this, c.pos.x, c.pos.y - 40, 'WRONG!', '#ff4040')
      return true
    }
    const served = player.item
    player.setItem(null)
    c.table.itemView.setItem(served)
    bus.emit('order_closed', { order: c.ticket, served: true })
    c.ticket = null
    c.setState('eating')
    c.eatTimer = TUNING.eatTime

    const speed = TUNING.speedTip * c.ratio
    const tip = Math.round((TUNING.baseTip + speed) * RunState.tipMult() * (c.critic ? CRITIC.tipMult : 1))
    RunState.tips += tip
    RunState.served++
    this.waveServed++
    bus.emit('tip_earned', { amount: tip, x: c.pos.x, y: c.pos.y })
    floatText(this, c.pos.x, c.pos.y - 40, `+$${tip}`)
    this.hud.bumpTips()
    sfx('tip')
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

    c.setState('leaving')
    if (angry) {
      c.setAngry()
      RunState.lives--
      RunState.angry++
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

  runOver () {
    if (this.over) return
    this.over = true
    this.waveActive = false
    const won = RunState.wavesCleared >= WIN_WAVE
    bus.emit('run_over', { won })
    this.players.forEach(p => p.body.setVelocity(0, 0))
    banner(this, won ? 'LAST CALL!' : 'RUN OVER', won ? 'THE DINER CLOSES' : 'TOO MANY ANGRY CUSTOMERS', won ? '#ffd93d' : '#ff4040', 1800)
    this.time.delayedCall(2200, () => this.scene.start('GameOverScene', { won }))
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
    const candidates = this.stations.concat(this.queue.filter(c => c.state === 'queued'))
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
    if (p.input.pressed('interact')) {
      let ok = false
      if (target instanceof Customer) ok = this.follow(target)
      else if (target) ok = target.interact(p)
      if (!ok) sfx('error')
    }
    if (target && p.input.held('use')) target.use(p, dt)
  }

  updateModifiers (dt) {
    if (RunState.has('grill') && this.spare && !this.spare.item) {
      const { tx, ty } = this.spare
      this.stations.splice(this.stations.indexOf(this.spare), 1)
      this.spare.destroy()
      this.spare = null
      const g = new Grill(this, tx, ty)
      this.stations.push(g)
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

  togglePause () {
    this.paused = !this.paused
    this.pauseText.setVisible(this.paused)
    if (this.paused) {
      this.physics.pause()
      this.tweens.pauseAll()
      this.time.paused = true
    } else {
      this.physics.resume()
      this.tweens.resumeAll()
      this.time.paused = false
    }
  }

  update (time, delta) {
    const dt = Math.min(delta / 1000, 0.05)
    this.players.forEach(p => p.input.update())
    if (!this.over && this.players.some(p => p.input.pressed('pause'))) this.togglePause()
    if (this.paused) return
    if (this.over) {
      this.players.forEach(p => p.body.setVelocity(0, 0))
      return
    }

    this.updateSpawning(dt)
    this.players.forEach(p => this.updatePlayer(p, dt))
    this.stations.forEach(s => s.update(dt))

    this.customers.slice().forEach(c => {
      const expired = c.update(dt, c.state === 'following' ? this.server : null)
      if (expired && !this.over) this.leave(c, true)
      else if (c.state === 'eating' && c.eatTimer <= 0) {
        c.table.setDirty(true)
        this.leave(c, false)
      }
    })

    this.updateModifiers(dt)
    this.checkWaveCleared()
    this.hud.update()
    this.rail.update()
  }
}
