<script setup>
import { ref, onErrorCaptured } from 'vue'
import PhaserContainer from '@/components/PhaserContainer'

// A failed download of the game chunk (flaky network) lands here.
const loadError = ref(null)
onErrorCaptured(err => {
  loadError.value = err && err.message ? err.message : String(err)
  return false
})

const reload = () => window.location.reload()
</script>

<template>
  <div v-if="loadError" class="launcher">
    <h1><span>DUO</span><span class="accent">DINER</span></h1>
    <p class="bad">THE KITCHEN DIDN'T OPEN.</p>
    <p class="small">{{ loadError }}</p>
    <button @click="reload">TRY AGAIN</button>
  </div>
  <Suspense v-else>
    <PhaserContainer />

    <template #fallback>
      <div class="launcher">
        <h1><span>DUO</span><span class="accent">DINER</span></h1>
        <p class="tag">ONE COOKS. ONE SERVES. BOTH PANIC.</p>
        <div class="bar"><div class="fill" /></div>
        <p class="small">HEATING UP THE GRILL...</p>
        <p class="small dim">BEST WITH TWO GAMEPADS. KEYBOARD WORKS TOO.</p>
      </div>
    </template>
  </Suspense>
</template>

<style lang="scss" scoped>
.launcher {
  font-family: 'Press Start 2P', monospace;
  color: #f4f4f4;
  text-align: center;
  padding: 0 16px;
}

h1 {
  font-size: clamp(28px, 7vw, 56px);
  line-height: 1.3;
  margin: 0 0 16px;

  span { display: block; }
  .accent { color: #00ffd0; }
}

.tag { color: #ffd93d; font-size: 10px; margin-bottom: 28px; }
.small { font-size: 8px; line-height: 2; }
.dim { color: #8a8399; }
.bad { color: #ff4040; font-size: 10px; }

.bar {
  width: min(260px, 70vw);
  height: 8px;
  margin: 0 auto 16px;
  border: 2px solid #3a3150;
  overflow: hidden;

  .fill {
    height: 100%;
    width: 40%;
    background: #00ffd0;
    animation: slide 1.1s ease-in-out infinite alternate;
  }
}

@keyframes slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

button {
  font-family: inherit;
  font-size: 10px;
  margin-top: 16px;
  padding: 10px 16px;
  background: #1d1828;
  color: #ffd93d;
  border: 2px solid #ffd93d;
  cursor: pointer;
}
</style>
