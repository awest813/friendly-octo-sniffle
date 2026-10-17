// Diner pets, adopted for free on Adoption Day (after every 5th wave). Each
// one has a single, visible bonus. Any pet can be petted (A) for a small
// patience boost to every waiting guest.
//   aura:  radius (px) of the area bonus around the pet, drawn as a ring
//   home:  'door' pets stay by the entrance; others wander the dining room
export const PETS = [
  {
    id: 'sunny', kind: 'DOG', name: 'SUNNY', breed: 'GOLDEN RETRIEVER', texture: 'pet_sunny',
    desc: 'Guests near Sunny lose patience 50% slower.', aura: 64, color: 0xffd93d, follows: true
  },
  {
    id: 'biscuit', kind: 'DOG', name: 'BISCUIT', breed: 'CORGI', texture: 'pet_biscuit',
    desc: 'Guests served near Biscuit tip +30%.', aura: 64, color: 0xf79a3e, follows: true
  },
  {
    id: 'beans', kind: 'DOG', name: 'BEANS', breed: 'BEAGLE', texture: 'pet_beans',
    desc: 'Greets the queue: waiting guests lose patience 50% slower.', home: 'door', color: 0xc08040
  },
  {
    id: 'mochi', kind: 'CAT', name: 'MOCHI', breed: 'TABBY', texture: 'pet_mochi',
    desc: 'Purrs: guests near Mochi eat twice as fast.', aura: 64, color: 0xc9a07a, lazy: true
  },
  {
    id: 'pepper', kind: 'CAT', name: 'PEPPER', breed: 'BLACK CAT', texture: 'pet_pepper',
    desc: 'Lucky! Big Tippers show up twice as often.', color: 0x8a8399, lazy: true
  },
  {
    id: 'noodle', kind: 'CAT', name: 'NOODLE', breed: 'SIAMESE', texture: 'pet_noodle',
    desc: 'Loves pets: petting gives +6s patience, more often.', color: 0x69b4ea, lazy: true
  }
]

export const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]))

export const PETTING = {
  boost: 3, // seconds of patience for every waiting guest
  cooldown: 20,
  noodleBoost: 6,
  noodleCooldown: 12
}

// Adoption Day after every ADOPT_EVERY waves; in endless Closing Time,
// every ENDLESS_ADOPT_SERVED guests served counts as 5 waves.
export const ADOPT_EVERY = 5
export const ENDLESS_ADOPT_SERVED = 20

export function adoptionOptions (owned, count = 3) {
  const pool = PETS.filter(p => !owned.includes(p.id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = pool[i]
    pool[i] = pool[j]
    pool[j] = t
  }
  return pool.slice(0, count)
}
