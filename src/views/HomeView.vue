<script setup>
import { computed } from 'vue'
import { useCollectiblesStore } from '../stores/collectibles'
import { useAuthStore } from '../stores/auth'
import BestTimeBanner from '../components/BestTimeBanner.vue'

const collectiblesStore = useCollectiblesStore()
const authStore = useAuthStore()

// Every museum wing, in the order Blathers files them.
const TILES = [
  { key: 'bug', label: '🐛 Bugs' },
  { key: 'fish', label: '🐟 Fish' },
  { key: 'sea', label: '🦀 Sea Creatures' },
  { key: 'fossil', label: '🦴 Fossils' },
  { key: 'art', label: '🖼️ Art' },
]

const totals = computed(() =>
  Object.fromEntries(TILES.map(({ key }) => [key, collectiblesStore.byCategory[key].length]))
)

const caughtByCategory = computed(() => {
  const counts = Object.fromEntries(TILES.map(({ key }) => [key, 0]))
  for (const c of collectiblesStore.museumItems) {
    if (collectiblesStore.caughtIds.has(c.id)) counts[c.category]++
  }
  return counts
})

const musicTotal = computed(() => collectiblesStore.musicItems.length)
const musicCollected = computed(() => collectiblesStore.musicCaughtCount)
const musicPercent = computed(() =>
  musicTotal.value === 0 ? 0 : Math.round((musicCollected.value / musicTotal.value) * 100)
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <BestTimeBanner />

    <section v-if="authStore.user" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div
        v-for="tile in TILES"
        :key="tile.key"
        class="rounded-xl border border-stone-200 bg-white p-4 text-center dark:border-stone-800 dark:bg-stone-900"
      >
        <p class="text-sm text-stone-500 dark:text-stone-400">{{ tile.label }}</p>
        <p class="text-2xl font-bold text-stone-900 dark:text-white">
          {{ caughtByCategory[tile.key] }}
          <span class="text-base font-normal text-stone-400">/ {{ totals[tile.key] }}</span>
        </p>
      </div>
    </section>

    <!-- Music sits outside the tile grid on purpose: those five are the museum
         wings, and a record is the one thing you collect that Blathers won't
         take. Its own box (and its own colour) keeps that line visible. -->
    <section
      v-if="authStore.user"
      class="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="font-medium text-stone-900 dark:text-white">
          🎵 {{ musicCollected }} / {{ musicTotal }} songs collected ({{ musicPercent }}%)
        </p>
        <p class="text-xs text-stone-500 dark:text-stone-400">
          Tracked separately — records aren't museum exhibits.
        </p>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div class="h-full bg-sky-500" :style="{ width: musicPercent + '%' }" />
      </div>
    </section>

    <!-- Not v-else: the music box now sits between this and the tiles, so the
         condition is spelled out rather than left to pair with whatever
         happens to precede it. -->
    <section v-if="!authStore.user" class="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-600 dark:border-stone-700 dark:text-stone-300">
      <p>
        <router-link to="/login" class="font-medium text-emerald-700 underline dark:text-emerald-400">Sign in</router-link>
        to track all {{ collectiblesStore.museumItems.length }} museum collectibles — every bug, fish,
        sea creature, fossil and artwork — plus {{ musicTotal }} K.K. Slider songs, and watch your
        museum fill up.
      </p>
    </section>
  </div>
</template>
