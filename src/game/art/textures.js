import {
  CHEF, PERSON, CHEF_PALETTE, SERVER_PALETTE, CRITIC_PALETTE, customerPalettes, ICONS, ICON_PALETTE_OVERRIDES
} from '@/game/art/sprites'

const SCALE = 2

function pixelTexture (scene, key, rows, palette, scale = SCALE) {
  const h = rows.length
  const w = rows[0].length
  rows.forEach((row, i) => {
    if (row.length !== w) throw new Error(`Sprite ${key} row ${i} is ${row.length} wide, expected ${w}`)
  })
  const tex = scene.textures.createCanvas(key, w * scale, h * scale)
  const ctx = tex.getContext()
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return
      ctx.fillStyle = palette[ch] || '#ff00ff'
      ctx.fillRect(x * scale, y * scale, scale, scale)
    })
  })
  tex.refresh()
}

// Draw on a 16x16 logical grid, output 32x32.
function tileTexture (scene, key, draw, w = 16, h = 16) {
  const tex = scene.textures.createCanvas(key, w * SCALE, h * SCALE)
  const ctx = tex.getContext()
  const px = (x, y, pw, ph, color) => {
    ctx.fillStyle = color
    ctx.fillRect(x * SCALE, y * SCALE, pw * SCALE, ph * SCALE)
  }
  draw(px)
  tex.refresh()
}

const K = '#1a1423'

function counterBase (px, top = '#9aa3b5', front = '#5d6475') {
  px(0, 0, 16, 16, K)
  px(1, 1, 14, 10, top)
  px(1, 1, 14, 1, '#c5ccda')
  px(1, 11, 14, 4, front)
  px(1, 11, 14, 1, '#454b5a')
}

function buildTiles (scene) {
  tileTexture(scene, 'floor_k', px => {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) px(x * 4, y * 4, 4, 4, (x + y) % 2 ? '#2a2438' : '#352d47')
    }
  })
  tileTexture(scene, 'floor_d', px => {
    px(0, 0, 16, 16, '#5a3b2a')
    for (let y = 0; y < 16; y += 4) px(0, y, 16, 1, '#4a2f22')
    px(5, 0, 1, 4, '#4a2f22'); px(11, 4, 1, 4, '#4a2f22'); px(3, 8, 1, 4, '#4a2f22'); px(9, 12, 1, 4, '#4a2f22')
    px(1, 1, 3, 1, '#6a4733'); px(8, 9, 4, 1, '#6a4733')
  })
  tileTexture(scene, 'wall', px => {
    px(0, 0, 16, 16, '#241d33')
    px(0, 0, 16, 2, '#3a3150')
    for (let y = 4; y < 16; y += 4) px(0, y, 16, 1, '#1a1423')
    px(7, 2, 1, 2, '#1a1423'); px(3, 5, 1, 3, '#1a1423'); px(11, 5, 1, 3, '#1a1423'); px(7, 9, 1, 3, '#1a1423'); px(3, 13, 1, 3, '#1a1423'); px(13, 13, 1, 3, '#1a1423')
  })
  tileTexture(scene, 'door', px => {
    px(0, 0, 16, 16, '#352d47')
    px(2, 2, 12, 12, '#7a2a4a')
    px(3, 3, 10, 10, '#a83a62')
    for (let x = 0; x < 16; x += 4) px(x, 0, 2, 1, '#ffd93d')
  })
  tileTexture(scene, 'counter', px => counterBase(px))
  tileTexture(scene, 'pass', px => {
    counterBase(px)
    px(1, 11, 14, 2, '#ffd93d')
    px(1, 13, 14, 2, '#c9a422')
  })
  tileTexture(scene, 'crate', px => {
    px(0, 0, 16, 16, K)
    px(1, 1, 14, 14, '#a8743a')
    px(1, 1, 14, 1, '#c9945a')
    px(1, 5, 14, 1, '#7a5228'); px(1, 10, 14, 1, '#7a5228')
    px(1, 14, 14, 1, '#7a5228')
    px(3, 3, 10, 10, '#3a2a1a')
  })
  tileTexture(scene, 'grill', px => {
    px(0, 0, 16, 16, K)
    px(1, 1, 14, 14, '#2b2b3a')
    px(2, 2, 12, 8, '#16131f')
    for (let x = 3; x < 14; x += 2) px(x, 2, 1, 8, '#6b6b7a')
    px(1, 11, 14, 4, '#3a3a4a')
    px(3, 12, 2, 2, '#e8402f'); px(7, 12, 2, 2, '#e8402f'); px(11, 12, 2, 2, '#e8402f')
  })
  tileTexture(scene, 'board', px => {
    counterBase(px)
    px(3, 2, 10, 8, K)
    px(4, 3, 8, 6, '#c49a6c')
    px(4, 3, 8, 1, '#ddb88a')
  })
  tileTexture(scene, 'sink', px => {
    counterBase(px)
    px(2, 2, 12, 8, K)
    px(3, 3, 10, 6, '#3b8fd0')
    px(3, 3, 10, 2, '#69b4ea')
    px(7, 1, 2, 2, '#c5ccda')
  })
  tileTexture(scene, 'bin', px => {
    px(0, 0, 16, 16, '#352d47')
    px(3, 2, 10, 13, K)
    px(4, 3, 8, 11, '#5d6475')
    px(4, 3, 8, 2, '#9aa3b5')
    px(6, 6, 1, 7, '#454b5a'); px(9, 6, 1, 7, '#454b5a')
  })
  tileTexture(scene, 'table', px => {
    px(1, 2, 14, 11, K)
    px(2, 3, 12, 8, '#b07a48')
    px(2, 3, 12, 2, '#c9945a')
    px(2, 11, 12, 1, '#7a5228')
    px(3, 12, 2, 3, K); px(11, 12, 2, 3, K)
  })
  tileTexture(scene, 'table_closed', px => {
    px(1, 2, 14, 11, K)
    px(2, 3, 12, 8, '#4a3a3a')
    px(2, 11, 12, 1, '#2a2020')
    px(3, 12, 2, 3, K); px(11, 12, 2, 3, K)
    px(5, 6, 6, 2, '#8a8399')
  })
  tileTexture(scene, 'chair', px => {
    px(4, 3, 8, 11, K)
    px(5, 4, 6, 4, '#6b3f2a')
    px(5, 8, 6, 3, '#8a5a3a')
    px(5, 11, 1, 3, '#6b3f2a'); px(10, 11, 1, 3, '#6b3f2a')
  })
  tileTexture(scene, 'shadow', px => {
    px(2, 0, 8, 1, 'rgba(0,0,0,0.35)')
    px(0, 1, 12, 2, 'rgba(0,0,0,0.35)')
    px(2, 3, 8, 1, 'rgba(0,0,0,0.35)')
  }, 12, 4)
  tileTexture(scene, 'bubble', px => {
    px(1, 0, 10, 1, K); px(0, 1, 1, 9, K); px(11, 1, 1, 9, K); px(1, 10, 10, 1, K)
    px(1, 1, 10, 9, '#f4f4f4')
    px(4, 11, 3, 1, K); px(5, 12, 1, 1, K); px(4, 10, 3, 1, '#f4f4f4')
  }, 12, 13)
  tileTexture(scene, 'highlight', px => {
    const c = '#ffffff'
    px(0, 0, 4, 1, c); px(0, 0, 1, 4, c)
    px(12, 0, 4, 1, c); px(15, 0, 1, 4, c)
    px(0, 15, 4, 1, c); px(0, 12, 1, 4, c)
    px(12, 15, 4, 1, c); px(15, 12, 1, 4, c)
  })
  tileTexture(scene, 'hook', px => {
    counterBase(px)
    px(1, 11, 14, 4, '#a8261c')
    px(1, 11, 14, 1, '#e8402f')
    px(5, 3, 6, 6, '#c5ccda')
    px(6, 4, 4, 4, '#9aa3b5')
  })
  tileTexture(scene, 'px', px => px(0, 0, 1, 1, '#ffffff'), 1, 1)
  tileTexture(scene, 'flame', px => {
    px(1, 0, 1, 1, '#ffffff'); px(0, 1, 3, 2, '#ffffff'); px(1, 3, 1, 1, '#ffffff')
  }, 3, 4)
  tileTexture(scene, 'smoke', px => {
    px(1, 0, 2, 4, '#ffffff'); px(0, 1, 4, 2, '#ffffff')
  }, 4, 4)
}

function buildCharacters (scene) {
  pixelTexture(scene, 'cook', CHEF, CHEF_PALETTE)
  pixelTexture(scene, 'server', PERSON, SERVER_PALETTE)
  pixelTexture(scene, 'critic', PERSON, CRITIC_PALETTE)
  const palettes = customerPalettes()
  palettes.forEach((p, i) => pixelTexture(scene, `customer${i}`, PERSON, p))
  scene.registry.set('customerVariants', palettes.length)
}

function buildIcons (scene) {
  Object.entries(ICONS).forEach(([key, def]) => {
    const [rows, palette] = typeof def === 'string' ? ICONS[def] : def
    pixelTexture(scene, key, rows, ICON_PALETTE_OVERRIDES[key] || palette)
  })
}

export function buildTextures (scene) {
  buildTiles(scene)
  buildCharacters(scene)
  buildIcons(scene)
}
