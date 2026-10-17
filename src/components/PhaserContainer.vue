<script setup>
import { onMounted, onUnmounted } from 'vue'

let gameInstance = null
const containerId = 'game-container'
const game = await import(/* webpackChunkName: "game" */ '@/game/game')
// Phaser text is rasterised once, so the pixel font must be ready before the game starts.
await document.fonts.load('8px "Press Start 2P"')

onMounted(() => {
  gameInstance = game.launch(containerId)
  if (process.env.NODE_ENV === 'development') {
    window.__duo = { game: gameInstance, RunState: game.RunState }
  }
})

onUnmounted(() => {
  gameInstance.destroy(false)
})
</script>

<template>
  <div :id="containerId" class="game-container" />
</template>

<style lang="scss" scoped>
.game-container {
  width: 100vw;
  height: 100vh;
}
</style>
