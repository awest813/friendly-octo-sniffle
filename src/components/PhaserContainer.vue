<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

let gameInstance = null
const containerId = 'game-container'
const game = await import(/* webpackChunkName: "game" */ '@/game/game')
// Phaser text is rasterised once, so the pixel font must be ready before the game starts.
await document.fonts.load('8px "Press Start 2P"')

const crash = ref(null)
const touchOnly = ref(window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches)

// Only our own errors: browser extensions throw on pages too.
function onError (event) {
  const fromUs = !event.filename || event.filename.startsWith(window.location.origin)
  if (fromUs && !crash.value) crash.value = event.message || 'Unknown error'
}

function onKey (event) {
  if (event.code === 'KeyF' && !event.repeat) toggleFullscreen()
  if (crash.value && event.code === 'KeyR') window.location.reload()
}

function toggleFullscreen () {
  if (gameInstance) gameInstance.scale.toggleFullscreen()
}

onMounted(() => {
  gameInstance = game.launch(containerId)
  window.addEventListener('error', onError)
  window.addEventListener('keydown', onKey)
  if (process.env.NODE_ENV === 'development') {
    window.__duo = { game: gameInstance, RunState: game.RunState }
  }
})

onUnmounted(() => {
  window.removeEventListener('error', onError)
  window.removeEventListener('keydown', onKey)
  gameInstance.destroy(false)
})

const reload = () => window.location.reload()
</script>

<template>
  <div :id="containerId" class="game-container" />
  <button class="fullscreen" title="Fullscreen (F)" @click="toggleFullscreen">&#x26F6;</button>
  <div v-if="touchOnly" class="notice" @click="touchOnly = false">
    DUO DINER NEEDS GAMEPADS OR A KEYBOARD. TAP TO HIDE.
  </div>
  <div v-if="crash" class="crash">
    <p class="bad">SOMETHING BURNT IN THE KITCHEN.</p>
    <p class="small">{{ crash }}</p>
    <button @click="reload">RELOAD (R)</button>
  </div>
</template>

<style lang="scss" scoped>
.game-container {
  width: 100vw;
  height: 100vh;
}

.fullscreen {
  position: fixed;
  right: 8px;
  bottom: 8px;
  width: 32px;
  height: 32px;
  font-size: 18px;
  line-height: 1;
  color: #8a8399;
  background: transparent;
  border: 2px solid #3a3150;
  opacity: 0.5;
  cursor: pointer;

  &:hover { opacity: 1; }
}

.notice, .crash {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Press Start 2P', monospace;
  text-align: center;
  background: #1d1828;
  border: 2px solid #ffd93d;
  color: #ffd93d;
  padding: 12px 16px;
  max-width: calc(100vw - 64px);
}

.notice { top: 12px; font-size: 8px; line-height: 1.8; }

.crash {
  top: 50%;
  transform: translate(-50%, -50%);
  border-color: #ff4040;
  color: #f4f4f4;

  .bad { color: #ff4040; font-size: 10px; }
  .small { font-size: 8px; line-height: 2; word-break: break-word; }

  button {
    font-family: inherit;
    font-size: 10px;
    padding: 8px 12px;
    background: #120f1a;
    color: #ffd93d;
    border: 2px solid #ffd93d;
    cursor: pointer;
  }
}
</style>
