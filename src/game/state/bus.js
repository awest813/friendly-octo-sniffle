import Phaser from 'phaser'

// Gameplay emits, UI listens. Events:
//   order_taken({ order })        order_closed({ order, served })
//   tip_earned({ amount, x, y })  customer_left_angry({ customer })
//   life_lost({ lives })          wave_started({ wave, config })
//   wave_cleared({ wave })        run_over({ won })
const bus = new Phaser.Events.EventEmitter()

export default bus
