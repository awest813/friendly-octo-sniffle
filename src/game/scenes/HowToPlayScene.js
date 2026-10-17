import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, COLORS } from '@/game/constants'
import AnyInput from '@/game/input/AnyInput'
import { sfx } from '@/game/audio/sfx'

// Each page: a title, a row of sprites (texture keys, '>' draws an arrow)
// and a few lines of text.
const PAGES = [
  {
    title: 'THE GOAL',
    color: CSS.diner,
    icons: ['cook', 'server', '>', 'customer0', 'dish_burger', 'pu_tips'],
    lines: [
      'Run a diner together. One of you cooks,',
      'the other runs the floor.',
      '',
      'Survive 8 waves of hungry customers to save',
      'the diner, then hold out through Closing Time.',
      '',
      'Each customer who runs out of patience walks',
      'out angry. Three walkouts and the run is over.',
      'Tips are your score - and your shop money.'
    ]
  },
  {
    title: 'THE COOK',
    color: CSS.cook,
    icons: ['plate', '>', 'bun_raw', 'patty_raw', '>', 'patty_cooked', '>', 'dish_burger'],
    lines: [
      'A: grab from crates, put down, add to a plate.',
      'X (hold) at the board: chop lettuce and tomato.',
      'Patties cook on the grill - and burn if left.',
      '',
      'BURGER   bun + grilled patty',
      'SALAD    chopped lettuce + chopped tomato',
      'DELUXE   bun + grilled patty + chopped lettuce',
      '',
      'Read the tickets up top. Finished plates go',
      'on the yellow PASS counters in the wall.'
    ]
  },
  {
    title: 'THE SERVER',
    color: CSS.server,
    icons: ['customer1', '>', 'table', '>', 'dish_salad', '>', 'plate_dirty', 'sink'],
    lines: [
      'A on the customer at the door: they follow you.',
      'A on a free table: they sit down.',
      'A on a customer showing "!": take the order.',
      '',
      'Grab the matching plate from the pass and',
      'serve it with A. The faster, the bigger the tip.',
      '',
      'Bring dirty plates back to the sink in the',
      'kitchen. No clean plates means no food.'
    ]
  },
  {
    title: 'GUESTS & TIPS',
    color: CSS.diner,
    icons: ['customer2', 'guest_granny', 'customer4', 'guest_rusher', 'critic', 'pu_tips'],
    lines: [
      'CHILL grandparents wait long and tip well.',
      'KIDS eat fast, only want burgers, tip small.',
      'RUSH guests are impatient but tip big.',
      'VIP critics: gold tickets, triple tips.',
      'A glittering BIG TIPPER turns up now and then.',
      '',
      'Serve fast for PERFECT, rescue a guest at the',
      'last second for CLUTCH. Every serve in a row',
      'grows your STREAK: up to +50% tips.',
      'Clean waves earn up to 3 stars and bonus tips.'
    ]
  },
  {
    title: 'CONTROLS',
    color: CSS.white,
    table: [
      ['', 'GAMEPAD', 'COOK KEYS', 'SERVER KEYS'],
      ['MOVE', 'STICK', 'WASD', 'ARROWS'],
      ['ACTION', 'A', 'SPACE', 'ENTER'],
      ['CHOP / SPRAY', 'X (HOLD)', 'E', 'SHIFT'],
      ['THROW / REROLL', 'Y', 'Q', '/'],
      ['BACK', 'B', 'BACKSPACE', 'BACKSPACE'],
      ['PAUSE', 'START', 'ESC', 'ESC']
    ],
    lines: [
      'First pad to press A in the lobby cooks,',
      'the second serves. Alone? Press A again and an',
      'AI teammate takes the other role.'
    ]
  },
  {
    title: 'TROUBLE',
    color: CSS.danger,
    icons: ['patty_burnt', '>', 'tool_extinguisher', 'critic', 'pu_ghost', 'pu_skates', 'pu_busboy'],
    lines: [
      'From wave 5, burnt food left on a grill catches',
      'fire. Grab the red extinguisher, hold X on it.',
      'Smoke makes every customer lose patience faster.',
      '',
      'VIP critics (gold tickets) are impatient but',
      'tip triple. Serve them first.',
      '',
      'Between waves: spend tips in the shop. Before',
      'waves 3, 5 and 7: draft a power-up. Y rerolls.'
    ]
  }
]

export default class HowToPlayScene extends Phaser.Scene {
  constructor () {
    super({ key: 'HowToPlayScene' })
  }

  create () {
    this.cameras.main.setBackgroundColor(COLORS.bg)
    this.page = 0
    this.layer = this.add.container(0, 0)
    this.dots = PAGES.map((_, i) => this.add.rectangle(WIDTH / 2 + (i - (PAGES.length - 1) / 2) * 14, HEIGHT - 34, 8, 8, COLORS.panelEdge))
    this.add.text(WIDTH / 2, HEIGHT - 16, 'LEFT / RIGHT OR A: NEXT PAGE  -  B: BACK', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    this.inputs = new AnyInput(this)
    this.show(0)
  }

  show (i) {
    this.page = i
    this.layer.removeAll(true)
    const p = PAGES[i]
    const add = o => { this.layer.add(o); return o }
    add(this.add.text(WIDTH / 2, 26, p.title, { fontFamily: FONT, fontSize: '16px', color: p.color }).setOrigin(0.5))
    add(this.add.text(WIDTH - 12, 26, `${i + 1}/${PAGES.length}`, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(1, 0.5))

    let y = 60
    if (p.icons) {
      const step = 44
      const x0 = WIDTH / 2 - (p.icons.length - 1) * step / 2
      p.icons.forEach((key, j) => {
        const x = x0 + j * step
        if (key === '>') add(this.add.text(x, 76, '>', { fontFamily: FONT, fontSize: '16px', color: CSS.dim }).setOrigin(0.5))
        else add(this.add.image(x, 76, key).setScale(this.textures.get(key).getSourceImage().width > 16 ? 1.5 : 2))
      })
      y = 112
    }
    if (p.table) {
      const cols = [WIDTH / 2 - 250, WIDTH / 2 - 60, WIDTH / 2 + 60, WIDTH / 2 + 180]
      p.table.forEach((row, r) => {
        row.forEach((cell, c) => {
          const color = r === 0 ? CSS.diner : c === 0 ? CSS.dim : CSS.white
          add(this.add.text(cols[c], 58 + r * 20, cell, { fontFamily: FONT, fontSize: '8px', color }).setOrigin(c === 0 ? 0 : 0.5, 0))
        })
      })
      y = 58 + p.table.length * 20 + 16
    }
    p.lines.forEach((line, j) => {
      add(this.add.text(WIDTH / 2 - 236, y + j * 16, line, { fontFamily: FONT, fontSize: '8px', color: CSS.white }))
    })
    this.dots.forEach((d, j) => d.setFillStyle(j === i ? COLORS.diner : COLORS.panelEdge))
  }

  update () {
    this.inputs.update()
    if (this.inputs.pressed('back') || this.inputs.pressed('pause')) {
      sfx('confirm')
      this.scene.start('TitleScene', { skipSplash: true })
      return
    }
    let d = this.inputs.nav.x
    if (this.inputs.pressed('interact')) d = 1
    if (!d) return
    const next = this.page + d
    if (next >= PAGES.length) {
      sfx('confirm')
      this.scene.start('TitleScene', { skipSplash: true })
      return
    }
    sfx('select')
    this.show(Phaser.Math.Clamp(next, 0, PAGES.length - 1))
  }
}
