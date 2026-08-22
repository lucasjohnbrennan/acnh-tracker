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

    <section v-else class="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-600 dark:border-stone-700 dark:text-stone-300">
      <p>
        <router-link to="/login" class="font-medium text-emerald-700 underline dark:text-emerald-400">Sign in</router-link>
        to track all {{ collectiblesStore.museumItems.length }} museum collectibles — every bug, fish,
        sea creature, fossil and artwork — plus {{ musicTotal }} K.K. Slider songs, and watch your
        museum fill up.
      </p>
    </section>

    <router-link
      to="/critters"
      class="inline-block w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
    >
      Browse all critters →
    </router-link>
  </div>
</template>
