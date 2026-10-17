<script setup>
import PhaserContainer from '@/components/PhaserContainer'
</script>

<template>
  <Suspense>
    <PhaserContainer />

    <template #fallback>
      <div class="placeholder">
        LOADING ...
      </div>
    </template>
  </Suspense>
</template>

<style lang="scss" scoped>
.placeholder {
  font-size: 1rem;
  font-family: 'Press Start 2P', monospace;
  color: #00ffd0;
}
</style>
