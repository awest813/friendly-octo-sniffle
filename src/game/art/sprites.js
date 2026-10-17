// Pixel-string sprites. Each char maps to a palette colour; '.' is transparent.
// Characters are 16x16 and food/icons are 8x8; both are drawn at 2x.

const OUTLINE = '#1a1423'

export const CHEF = [
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwwwwwwwk...',
  '...kwwwwwwwwk...',
  '....kggggggk....',
  '....kssssssk....',
  '....ksesseSk....',
  '....kssssssk....',
  '.....kSSSSk.....',
  '....kwwccwwk....',
  '...kwwwccwwwk...',
  '...kswwccwwsk...',
  '....kwwwwwwk....',
  '....kppkkppk....',
  '....kppkkppk....',
  '....kkk..kkk....'
]

export const PERSON = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '...khsesseshk...',
  '...khsssssshk...',
  '....kkSSSSkk....',
  '....kttaattk....',
  '...kttaaaattk...',
  '...ksTaaaaTsk...',
  '....kTaaaaTk....',
  '....kppkkppk....',
  '....kppkkppk....',
  '....kkk..kkk....',
  '................'
]

export const CHEF_PALETTE = {
  k: OUTLINE, w: '#f4f4f4', g: '#c9c9d6', s: '#f2c39b', S: '#d79b74', e: OUTLINE, c: '#00ffd0', p: '#2b2b3a'
}

export const SERVER_PALETTE = {
  k: OUTLINE, h: '#3a2420', s: '#e8b48a', S: '#c98e66', e: OUTLINE, t: '#ff3b8d', T: '#c0246a', a: '#1f1a2b', p: '#2b2b3a'
}

const SKINS = [['#f2c39b', '#d79b74'], ['#c68a5e', '#9f6a44'], ['#8d5a3b', '#6b4029'], ['#f7d7bd', '#e0b494']]
const HAIRS = ['#3a2420', '#d9a441', '#1b1b1b', '#a0522d', '#7a7a8a', '#4b2a6b']
const SHIRTS = [['#4e8ef7', '#3367c4'], ['#7ed957', '#52a836'], ['#f79a3e', '#c4732a'], ['#b06ef7', '#8048c4'], ['#e04848', '#a83232'], ['#3ec9c9', '#2a9696']]

export function customerPalettes () {
  const out = []
  SHIRTS.forEach((shirt, i) => {
    const skin = SKINS[i % SKINS.length]
    out.push({
      k: OUTLINE, h: HAIRS[i % HAIRS.length], s: skin[0], S: skin[1], e: OUTLINE, t: shirt[0], T: shirt[1], a: shirt[0], p: '#2b2b3a'
    })
  })
  return out
}

export const GRANNY_PALETTE = {
  k: OUTLINE, h: '#d8d8e0', s: '#f2c39b', S: '#d79b74', e: OUTLINE, t: '#9a6fc4', T: '#6f4a96', a: '#9a6fc4', p: '#4a3a5a'
}

export const RUSHER_PALETTE = {
  k: OUTLINE, h: '#2a1a14', s: '#c68a5e', S: '#9f6a44', e: OUTLINE, t: '#2b3a5a', T: '#1c2640', a: '#e8402f', p: '#1c2640'
}

export const CRITIC_PALETTE = {
  k: OUTLINE, h: '#1b1b1b', s: '#f2c39b', S: '#d79b74', e: OUTLINE, t: '#ffd93d', T: '#c9a422', a: '#1f1a2b', p: '#1f1a2b'
}

const BUN = { k: OUTLINE, o: '#e0a050', y: '#f6d38a', b: '#c07a30', n: '#6b3a1e', g: '#5ec45e', G: '#2f8a3a' }

export const ICONS = {
  bun_raw: [[
    '........',
    '..kkkk..',
    '.kyoook.',
    'kyoooook',
    'kooooook',
    'kbbbbbbk',
    '.kkkkkk.',
    '........'
  ], BUN],
  patty_raw: [[
    '........',
    '........',
    '.kkkkkk.',
    'kllmmmmk',
    'kmmmmmnk',
    'knnnnnnk',
    '.kkkkkk.',
    '........'
  ], { k: OUTLINE, m: '#e86b7a', l: '#f5a0aa', n: '#b8475a' }],
  patty_cooked: 'patty_raw',
  patty_burnt: 'patty_raw',
  lettuce_raw: [[
    '........',
    '..kkkk..',
    '.klgggk.',
    'klggGggk',
    'kgGggGgk',
    'kgggGGgk',
    '.kGGGGk.',
    '..kkkk..'
  ], { k: OUTLINE, g: '#5ec45e', G: '#2f8a3a', l: '#a6ec7a' }],
  lettuce_chopped: [[
    '........',
    '........',
    '.kk.kk..',
    'klgkkgk.',
    'kgGkgGkk',
    '.kkklggk',
    '...kkkk.',
    '........'
  ], { k: OUTLINE, g: '#5ec45e', G: '#2f8a3a', l: '#a6ec7a' }],
  tomato_raw: [[
    '...gg...',
    '..kggk..',
    '.krggrk.',
    'krwrrrRk',
    'krrrrrRk',
    'krrrrRRk',
    '.kRRRRk.',
    '..kkkk..'
  ], { k: OUTLINE, r: '#e8402f', R: '#a8261c', w: '#ff9b8a', g: '#3c9a40' }],
  tomato_chopped: [[
    '........',
    '.kkk....',
    'krwrk...',
    'krrrkkk.',
    '.kkkrwrk',
    '....krrk',
    '.....kk.',
    '........'
  ], { k: OUTLINE, r: '#e8402f', w: '#ff9b8a' }],
  plate: [[
    '........',
    '........',
    '........',
    '........',
    '.kkkkkk.',
    'kwwwwwwk',
    'kggwwggk',
    '.kkkkkk.'
  ], { k: OUTLINE, w: '#f4f4f4', g: '#c9c9d6' }],
  plate_dirty: [[
    '........',
    '........',
    '........',
    '........',
    '.kkkkkk.',
    'kwdwwdwk',
    'kggdwggk',
    '.kkkkkk.'
  ], { k: OUTLINE, w: '#d8d8c8', g: '#a9a99a', d: '#8a6a40' }],
  dish_burger: [[
    '........',
    '..kkkk..',
    '.kyoook.',
    'kooooook',
    'knnnnnnk',
    'kbbbbbbk',
    '.kkkkkk.',
    '........'
  ], BUN],
  dish_deluxe: [[
    '..kkkk..',
    '.kyoook.',
    'kooooook',
    'kgGgGgGk',
    'knnnnnnk',
    'knnnnnnk',
    'kbbbbbbk',
    '.kkkkkk.'
  ], BUN],
  dish_salad: [[
    '........',
    '..g.rg..',
    '.gGrgGg.',
    'kkkkkkkk',
    'kwwwwwwk',
    '.kwwwwk.',
    '..kkkk..',
    '........'
  ], { k: OUTLINE, g: '#5ec45e', G: '#2f8a3a', r: '#e8402f', w: '#f4f4f4' }],
  pu_charm: [[
    '.kk.kk..',
    'krrkrrk.',
    'krwrrrrk',
    'krrrrrrk',
    '.krrrrk.',
    '..krrk..',
    '...kk...',
    '........'
  ], { k: OUTLINE, r: '#ff3b8d', w: '#ffc4dc' }],
  pu_grill: [[
    '...kk...',
    '..korkk.',
    '.korrok.',
    '.koyyrok',
    'kroyyyrk',
    'kroyyork',
    '.kryyrk.',
    '..kkkk..'
  ], { k: OUTLINE, r: '#e8402f', o: '#f79a3e', y: '#ffd93d' }],
  pu_ghost: [[
    '..kkkk..',
    '.kwwwwk.',
    'kwkwwkwk',
    'kwwwwwwk',
    'kwwwwwwk',
    'kwwwwwwk',
    'kwkwwkwk',
    '.k.kk.k.'
  ], { k: OUTLINE, w: '#c8fff4' }],
  pu_tips: [[
    '..kkkk..',
    '.kyyyok.',
    'kyykkyok',
    'kyykyyok',
    'kyyykyok',
    'kykkyyok',
    '.kyyyok.',
    '..kkkk..'
  ], { k: OUTLINE, y: '#ffd93d', o: '#c9a422' }],
  pu_chopper: [[
    '......kk',
    '.....kwk',
    '....kwsk',
    '...kwsk.',
    '..kssk..',
    '.kbkk...',
    'kbbk....',
    'kkk.....'
  ], { k: OUTLINE, w: '#ffffff', s: '#aab3c5', b: '#8a5a2a' }],
  pu_skates: [[
    '.kkk....',
    '.kppk...',
    '.kppk...',
    '.kpppkk.',
    '.kpppppk',
    '.kkkkkkk',
    '.kgk.kgk',
    '..k...k.'
  ], { k: OUTLINE, p: '#ff3b8d', g: '#ffd93d' }],
  pu_busboy: [[
    '...kk...',
    '..kggk..',
    '.kggggk.',
    'kgckkcgk',
    'kggggggk',
    '.kgkkgk.',
    '.kggggk.',
    '.kk..kk.'
  ], { k: OUTLINE, g: '#aab3c5', c: '#00ffd0' }],
  pu_octo: [[
    '..kkkk..',
    '.kppppk.',
    'kpwpwppk',
    'kppppppk',
    '.kppppk.',
    'kpkpkpkp',
    'kpkpkpk.',
    '.k.k.k..'
  ], { k: OUTLINE, p: '#b06ef7', w: '#ffffff' }],
  pu_cannon: [[
    '.....ky.',
    '....k.y.',
    '..kkkk..',
    '.kggkkk.',
    'kgkkkkkk',
    'kkkkkkkk',
    '.kkkkkk.',
    '..kkkk..'
  ], { k: '#2b2b3a', g: '#6b6b7a', y: '#ffd93d' }],
  tool_extinguisher: [[
    '...kk...',
    '..kggk..',
    '.kkrrkk.',
    '.krwrrk.',
    '.krrrrk.',
    '.krrrrk.',
    '.kRRRRk.',
    '..kkkk..'
  ], { k: OUTLINE, r: '#e8402f', R: '#a8261c', w: '#ff9b8a', g: '#aab3c5' }],
  pu_coffee: [[
    '........',
    'kkkkkk..',
    'kwwwwk..',
    'kbbbbkkk',
    'kbbbbk.k',
    'kbbbbkkk',
    'kbbbbk..',
    '.kkkk...'
  ], { k: OUTLINE, w: '#f4f4f4', b: '#8a4a2a' }],
  pu_sink: [[
    '...k....',
    '..kbk...',
    '.kbbbk..',
    '.kbwbk..',
    'kbbwbbk.',
    'kbbbbbk.',
    '.kbbbk..',
    '..kkk...'
  ], { k: OUTLINE, b: '#3b8fd0', w: '#c8f0ff' }],
  pu_chair: [[
    '.kk.....',
    '.kbk....',
    '.kbk....',
    '.kbkkkk.',
    '.kbbbbbk',
    '.kkkkkkk',
    '.kb..kb.',
    '.kk..kk.'
  ], { k: OUTLINE, b: '#b07a48' }],
  pu_clover: [[
    '.kk.kk..',
    'kggkggk.',
    'kgGkGgk.',
    '.kkGkk..',
    'kgGkGgk.',
    'kggkggk.',
    '.kk.kk..',
    '...k....'
  ], { k: OUTLINE, g: '#7ed957', G: '#3c9a40' }],
  star: [[
    '...kk...',
    '...yk...',
    'kkkyykkk',
    'kyyyyyyk',
    '.kyyyyk.',
    '.kykkyk.',
    'kyk..kyk',
    'kk....kk'
  ], { k: OUTLINE, y: '#ffd93d' }],
  star_empty: [[
    '...kk...',
    '...dk...',
    'kkkddkkk',
    'kddddddk',
    '.kddddk.',
    '.kdkkdk.',
    'kdk..kdk',
    'kk....kk'
  ], { k: '#3a3150', d: '#241d33' }],
  heart: 'pu_charm',
  heart_empty: [[
    '.kk.kk..',
    'kddkddk.',
    'kddddddk',
    'kddddddk',
    '.kddddk.',
    '..kddk..',
    '...kk...',
    '........'
  ], { k: '#3a3150', d: '#241d33' }]
}

export const ICON_PALETTE_OVERRIDES = {
  patty_cooked: { k: OUTLINE, m: '#8a4a2a', l: '#b0703f', n: '#5a2d18' },
  patty_burnt: { k: OUTLINE, m: '#2a2222', l: '#4a4040', n: '#111111' },
  heart: { k: OUTLINE, r: '#ff4060', w: '#ffc4dc' }
}
