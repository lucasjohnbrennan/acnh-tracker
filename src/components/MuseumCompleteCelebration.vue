<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'

const collectiblesStore = useCollectiblesStore()

const visible = ref(false)
const canvasEl = ref(null)

const CONFETTI_COLORS = ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#fde68a', '#ffffff']
const GRAVITY = 900 // px/s²
const DISMISS_AFTER_MS = 11000

let pieces = []
let ctx = null
let rafId = null
let lastFrame = 0
let timers = []

const donatedCount = computed(() => collectiblesStore.all.length)

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function sizeCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function makePiece(x, y, vx, vy) {
  return {
    x,
    y,
    vx,
    vy,
    width: 6 + Math.random() * 6,
    height: 9 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 12,
    // Squashing the drawn width on a cycle fakes a piece tumbling in 3D.
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 3 + Math.random() * 5,
  }
}

// A cannon firing up and inward from one of the bottom corners.
function fireCannon(fromLeft, count) {
  const originX = fromLeft ? 0 : window.innerWidth
  const originY = window.innerHeight
  const direction = fromLeft ? 1 : -1

  for (let i = 0; i < count; i++) {
    const angle = (-70 + Math.random() * 45) * (Math.PI / 180)
    const speed = 900 + Math.random() * 700
    pieces.push(
      makePiece(originX, originY, Math.cos(angle) * speed * direction, Math.sin(angle) * speed)
    )
  }
}

// Slower pieces drifting down from above the viewport.
function rain(count) {
  for (let i = 0; i < count; i++) {
    pieces.push(
      makePiece(Math.random() * window.innerWidth, -20, (Math.random() - 0.5) * 120, 120 + Math.random() * 160)
    )
  }
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  pieces = pieces.filter((p) => {
    p.vy += GRAVITY * dt
    p.vx *= 0.99
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rotation += p.spin * dt
    p.flip += p.flipSpeed * dt

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width * Math.abs(Math.cos(p.flip)), p.height)
    ctx.restore()

    return p.y < window.innerHeight + 40
  })

  if (pieces.length > 0) {
    rafId = requestAnimationFrame(frame)
  } else {
    rafId = null
  }
}

function run() {
  if (rafId === null) {
    lastFrame = performance.now()
    rafId = requestAnimationFrame(frame)
  }
}

function later(fn, ms) {
  timers.push(setTimeout(fn, ms))
}

function stopAnimation() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  pieces = []
  timers.forEach(clearTimeout)
  timers = []
  window.removeEventListener('resize', sizeCanvas)
}

function dismiss() {
  visible.value = false
  stopAnimation()
}

function celebrate() {
  stopAnimation()
  visible.value = true
  later(dismiss, DISMISS_AFTER_MS)

  if (prefersReducedMotion()) return

  nextTick(() => {
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)

    fireCannon(true, 90)
    fireCannon(false, 90)
    later(() => { fireCannon(true, 70); fireCannon(false, 70); run() }, 700)
    later(() => { fireCannon(true, 60); fireCannon(false, 60); run() }, 1600)
    for (let t = 400; t <= 4000; t += 200) later(() => { rain(6); run() }, t)

    run()
  })
}

// Only fires on the transition into completeness, and only once the saved
// collection has loaded — so it's the moment you finish, not every page load.
watch(
  () => [collectiblesStore.hydrated, collectiblesStore.museumComplete],
  ([isHydrated, complete], [wasHydrated, wasComplete]) => {
    if (isHydrated && wasHydrated && complete && !wasComplete) celebrate()
  }
)

onBeforeUnmount(stopAnimation)

defineExpose({ celebrate })
</script>

<template>
  <div
    v-if="visible"
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
    role="alertdialog"
    aria-labelledby="museum-complete-heading"
  >
    <div class="museum-glow absolute inset-0" />
    <canvas ref="canvasEl" class="absolute inset-0 h-full w-full" />

    <div
      class="museum-card pointer-events-auto relative w-full max-w-md rounded-3xl border border-amber-300 bg-white p-8 text-center shadow-2xl dark:border-amber-700 dark:bg-stone-900"
    >
      <p class="museum-building text-6xl" aria-hidden="true">🏛️</p>

      <h2
        id="museum-complete-heading"
        class="mt-3 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 bg-clip-text text-3xl font-extrabold text-transparent"
      >
        Museum Complete!
      </h2>

      <p class="mt-3 text-stone-600 dark:text-stone-300">
        All {{ donatedCount }} bugs, fish, sea creatures, fossils and artworks donated.
        Blathers is, for once, speechless.
      </p>

      <div class="mt-4 flex justify-center gap-2 text-2xl" aria-hidden="true">
        <span v-for="(emoji, i) in ['🐛', '🐟', '🦀', '🦴', '🖼️']" :key="emoji" class="museum-pop" :style="{ animationDelay: `${0.4 + i * 0.12}s` }">
          {{ emoji }}
        </span>
      </div>

      <button
        type="button"
        class="mt-6 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        @click="dismiss"
      >
        Take a bow
      </button>
    </div>
  </div>
</template>

<style scoped>
.museum-glow {
  background: radial-gradient(circle at center, rgb(251 191 36 / 0.35), transparent 65%);
  animation: museum-fade 0.6s ease-out;
}

.museum-card {
  animation: museum-drop 0.7s cubic-bezier(0.2, 1.5, 0.4, 1);
}

.museum-building {
  display: inline-block;
  animation: museum-bob 2s ease-in-out 0.7s infinite;
}

.museum-pop {
  display: inline-block;
  opacity: 0;
  animation: museum-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) forwards;
}

@keyframes museum-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes museum-drop {
  0% { opacity: 0; transform: translateY(-40px) scale(0.85); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes museum-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}

@keyframes museum-pop {
  0% { opacity: 0; transform: scale(0) rotate(-30deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

@media (prefers-reduced-motion: reduce) {
  .museum-glow,
  .museum-card,
  .museum-building,
  .museum-pop {
    animation: none;
  }

  .museum-pop {
    opacity: 1;
  }
}
</style>
